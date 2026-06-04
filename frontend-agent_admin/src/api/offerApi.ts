import apiClient from '@/lib/api-client';

/**
 * Accepter une offre.
 * Marque le bien comme vendu et rejette les autres offres du deal.
 * 
 * @param {string} offerId - ID de l'offre
 */
export async function acceptOffer(offerId: string) {
  await apiClient.post(`/api/offers/${offerId}/accept`);
  return true;
}
