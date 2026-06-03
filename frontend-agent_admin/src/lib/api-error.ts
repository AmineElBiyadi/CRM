export interface ApiErrorBody {
  error?: string;
  message?: string;
  details?: string | null;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: string;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message ?? defaultMessage(status, body.error));
    this.name = "ApiError";
    this.status = status;
    this.code = body.error;
    this.details = body.details ?? undefined;
  }

  static client(code: string, message: string, details?: string): ApiError {
    return new ApiError(0, { error: code, message, details: details ?? null });
  }
}

function defaultMessage(status: number, code?: string): string {
  if (code === "NETWORK_ERROR") {
    return "Impossible de joindre le serveur.";
  }
  switch (status) {
    case 401:
      return "Session expirée. Veuillez vous reconnecter.";
    case 403:
      return "Vous n'avez pas l'autorisation d'accéder à cette page.";
    case 404:
      return "Ressource introuvable.";
    case 500:
    case 502:
    case 503:
      return "Le serveur a rencontré une erreur. Réessayez plus tard.";
    default:
      return status === 0
        ? "Erreur de connexion au serveur."
        : `Erreur (${status}). Réessayez ou reconnectez-vous.`;
  }
}

export async function parseApiErrorResponse(res: Response): Promise<ApiError> {
  const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
  return new ApiError(res.status, body);
}

export type ErrorUi = {
  title: string;
  message: string;
  hint?: string;
  showLogin?: boolean;
};

export function getAdminDashboardErrorUi(
  error: unknown,
  cachedRole?: string | null,
): ErrorUi {
  if (cachedRole === "AGENT") {
    return {
      title: "Compte agent détecté",
      message:
        "L'espace administrateur nécessite un compte avec le rôle administrateur.",
      hint: "Déconnectez-vous, puis connectez-vous avec votre compte admin (ex. admin@Rawabet.com).",
      showLogin: true,
    };
  }

  if (error instanceof ApiError) {
    if (error.code === "WRONG_ROLE") {
      return {
        title: "Accès refusé",
        message: error.message,
        hint: error.details,
        showLogin: true,
      };
    }

    switch (error.code) {
      case "UNAUTHORIZED":
      case "NOT_AUTHENTICATED":
        return {
          title: "Session expirée",
          message: error.message,
          hint: error.details ?? "Reconnectez-vous pour continuer.",
          showLogin: true,
        };
      case "FORBIDDEN":
        return {
          title: "Accès refusé",
          message: error.message,
          hint:
            error.details ??
            "Seuls les comptes administrateur peuvent ouvrir ce tableau de bord.",
          showLogin: true,
        };
      case "DATABASE_ERROR":
      case "INTERNAL_ERROR":
        return {
          title: "Erreur serveur",
          message: error.message,
          hint:
            error.details ??
            "Le chargement des statistiques a échoué. Réessayez dans quelques instants.",
        };
      default:
        break;
    }

    switch (error.status) {
      case 401:
        return {
          title: "Non connecté",
          message: error.message,
          hint: error.details,
          showLogin: true,
        };
      case 403:
        return {
          title: "Accès refusé",
          message: error.message,
          hint:
            error.details ??
            "Vérifiez que vous utilisez un compte administrateur.",
          showLogin: true,
        };
      case 0:
        return {
          title: "Serveur injoignable",
          message: error.message,
          hint:
            error.details ??
            "Vérifiez que le backend tourne (port 8081) et que le proxy Vite est actif.",
        };
      default:
        if (error.status >= 500) {
          return {
            title: "Erreur serveur",
            message: error.message,
            hint: error.details,
          };
        }
    }
  }

  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      title: "Connexion impossible",
      message: "Le navigateur n'a pas pu contacter l'API.",
      hint: "Vérifiez votre réseau et que le serveur backend est démarré.",
    };
  }

  const msg = error instanceof Error ? error.message : "Erreur inconnue.";
  return {
    title: "Chargement impossible",
    message: msg,
    hint: "Réessayez ou reconnectez-vous avec un compte administrateur.",
    showLogin: true,
  };
}
