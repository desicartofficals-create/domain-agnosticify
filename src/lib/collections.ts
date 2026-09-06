export type Collection = { key: string; title: string; kicker: string };

export const COLLECTIONS: Collection[] = [
  { key: "best-sellers", title: "Best Sellers", kicker: "Most loved by customers" },
  { key: "best-offers", title: "Best Offers", kicker: "Biggest savings right now" },
  { key: "just-launched", title: "Just Launched", kicker: "Fresh in the store" },
];

export function collectionByKey(key: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.key === key);
}
