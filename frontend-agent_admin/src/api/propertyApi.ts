const BASE = import.meta.env.VITE_API_BASE_URL || "";

export interface SearchParams {
  city?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
  maxRooms?: number;
  page?: number;
}

/**
 * Recherche de propriétés via l'API backend (qui appelle RapidAPI).
 */
export async function searchProperties(params: SearchParams = {}) {
  const qs = new URLSearchParams();
  if (params.city) qs.set("city", params.city);
  if (params.propertyType) qs.set("propertyType", params.propertyType);
  if (params.minPrice) qs.set("minPrice", params.minPrice.toString());
  if (params.maxPrice) qs.set("maxPrice", params.maxPrice.toString());
  if (params.minRooms) qs.set("minRooms", params.minRooms.toString());
  if (params.maxRooms) qs.set("maxRooms", params.maxRooms.toString());
  if (params.page) qs.set("page", params.page.toString());

  const res = await fetch(`${BASE}/api/properties/search?${qs}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { results: [...], total: number, page: number }
}

/** Lier une propriété externe à un dossier client (crée la Property en base) */
export async function linkPropertyToDeal(dealId: string, propertyData: any) {
  const res = await fetch(`${BASE}/api/properties/link?dealId=${dealId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(propertyData),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Propriétés déjà liées à un deal */
export async function getPropertiesByDeal(dealId: string) {
  const res = await fetch(`${BASE}/api/properties/deal/${dealId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
