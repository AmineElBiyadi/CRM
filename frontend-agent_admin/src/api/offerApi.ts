const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

/**
 * Accepter une offre.
 * Marque le bien comme vendu et rejette les autres offres du deal.
 * 
 * @param {string} offerId - ID de l'offre
 */
export async function acceptOffer(offerId: string) {
  const res = await fetch(`${BASE}/api/offers/${offerId}/accept`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}
