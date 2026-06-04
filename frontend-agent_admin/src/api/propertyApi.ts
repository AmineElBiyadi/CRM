import apiClient from '@/lib/api-client';

export interface SearchPropertiesParams {
  city?: string;
  propertyType?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  minRooms?: number | string;
  maxRooms?: number | string;
  floor?: number | string;
  page?: number | string;
}

/**
 * Recherche de propriétés via l'API backend.
 */
export async function searchProperties(params: SearchPropertiesParams = {}) {
  const qs = new URLSearchParams();
  if (params.city) qs.set("city", params.city);
  if (params.propertyType) qs.set("propertyType", params.propertyType);
  if (params.minPrice) qs.set("minPrice", String(params.minPrice));
  if (params.maxPrice) qs.set("maxPrice", String(params.maxPrice));
  if (params.minRooms) qs.set("minRooms", String(params.minRooms));
  if (params.maxRooms) qs.set("maxRooms", String(params.maxRooms));
  if (params.floor) qs.set("floor", String(params.floor));
  if (params.page) qs.set("page", String(params.page));

  const res = await apiClient.get(`/api/properties/search?${qs}`);
  return res.data;
}

/** Lier une propriété externe à un dossier client */
export async function linkPropertyToDeal(dealId: string, propertyData: any) {
  const res = await apiClient.post(`/api/properties/link?dealId=${dealId}`, propertyData);
  return res.data;
}

/** Propriétés déjà liées à un deal */
export async function getPropertiesByDeal(dealId: string) {
  const res = await apiClient.get(`/api/properties/deal/${dealId}`);
  return res.data;
}
