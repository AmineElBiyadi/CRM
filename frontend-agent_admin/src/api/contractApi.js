const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

/** Créer un contrat (avec son calendrier de paiement) */
export async function createContract(dealId, body) {
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
export async function getContractsByDeal(dealId) {
  const res = await fetch(`${BASE}/api/contracts/deal/${dealId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Récupérer un contrat par ID */
export async function getContractById(contractId) {
  const res = await fetch(`${BASE}/api/contracts/${contractId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Changer le statut d'un contrat */
export async function updateContractStatus(contractId, status) {
  const res = await fetch(`${BASE}/api/contracts/${contractId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Marquer un paiement comme payé */
export async function markPaymentPaid(contractId, paymentId) {
  const res = await fetch(
    `${BASE}/api/contracts/${contractId}/payments/${paymentId}/paid`,
    { method: "PATCH", credentials: "include" }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
