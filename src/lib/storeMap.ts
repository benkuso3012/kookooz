export type MappableStore = {
  name: string;
  address?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

/** Best available query string for a store (coords when known, otherwise the address). */
export function storeQuery(store: MappableStore): string {
  if (store.latitude != null && store.longitude != null) {
    return `${store.latitude},${store.longitude}`;
  }
  return [store.name, store.address, store.city].filter(Boolean).join(", ");
}

/** Keyless Google Maps embed URL — safe to use in an iframe. */
export function mapEmbedUrl(store: MappableStore): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(storeQuery(store))}&z=15&output=embed`;
}

/** Turn-by-turn directions link that opens Google Maps (or the native app on mobile). */
export function directionsUrl(store: MappableStore): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(storeQuery(store))}`;
}

export function openDirections(store: MappableStore) {
  window.open(directionsUrl(store), "_blank", "noopener,noreferrer");
}
