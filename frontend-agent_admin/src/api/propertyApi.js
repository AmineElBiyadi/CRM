const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

/**
 * Recherche de propriétés via l'API backend (qui appelle RapidAPI).
 *
 * Pour changer d'API : modifiez PropertyApiClient.java côté backend.
 * Le frontend n'a besoin que de ces paramètres normalisés.
 *
 * @param {Object} params - { city, propertyType, minPrice, maxPrice, minRooms, maxRooms, page }
 */
export async function searchProperties(params = {}) {
  const qs = new URLSearchParams();
  if (params.city) qs.set("city", params.city);
  if (params.propertyType) qs.set("propertyType", params.propertyType);
  if (params.minPrice) qs.set("minPrice", params.minPrice);
  if (params.maxPrice) qs.set("maxPrice", params.maxPrice);
  if (params.minRooms) qs.set("minRooms", params.minRooms);
  if (params.maxRooms) qs.set("maxRooms", params.maxRooms);
  if (params.page) qs.set("page", params.page);

  const res = await fetch(`${BASE}/api/properties/search?${qs}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { results: [...], total: number, page: number }
}

/** Lier une propriété externe à un dossier client (crée la Property en base) */
export async function linkPropertyToDeal(dealId, propertyData) {
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
export async function getPropertiesByDeal(dealId) {
  const res = await fetch(`${BASE}/api/properties/deal/${dealId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
