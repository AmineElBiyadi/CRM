const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

export interface ContractPaymentRequest {
  amount: number;
  dueDate: string;
  paymentOrder: number;
}

export interface CreateContractRequest {
  agreedPrice: number;
  depositAmount: number;
  depositDate?: string | null;
  keyHandoverDate?: string | null;
  internalNotes?: string;
  payments: ContractPaymentRequest[];
}

/** Créer un contrat (avec son calendrier de paiement) */
export async function createContract(dealId: string, body: CreateContractRequest) {
  const res = await fetch(`${BASE}/api/contracts?dealId=${dealId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Récupérer tous les contrats d'un deal */
export async function getContractsByDeal(dealId: string) {
  const res = await fetch(`${BASE}/api/contracts/deal/${dealId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Récupérer un contrat par ID */
export async function getContractById(contractId: string) {
  const res = await fetch(`${BASE}/api/contracts/${contractId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Changer le statut d'un contrat */
export async function updateContractStatus(contractId: string, status: string) {
  const res = await fetch(`${BASE}/api/contracts/${contractId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Supprimer un contrat (uniquement si DRAFT) */
export async function deleteContract(contractId: string) {
  const res = await fetch(`${BASE}/api/contracts/${contractId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

/** Marquer un paiement comme payé */
export async function markPaymentPaid(contractId: string, paymentId: string) {
  const res = await fetch(
    `${BASE}/api/contracts/${contractId}/payments/${paymentId}/paid`,
    { method: "PATCH", credentials: "include" }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
