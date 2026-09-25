// Opções de ordenação (dropdown) — mapeiam para as sort keys da Storefront API.
// products usa ProductSortKeys; collection usa ProductCollectionSortKeys.
export type ProductSortKey = 'BEST_SELLING' | 'CREATED_AT' | 'TITLE' | 'PRICE' | 'RELEVANCE';
export type CollectionSortKey = 'BEST_SELLING' | 'CREATED' | 'TITLE' | 'PRICE' | 'MANUAL' | 'RELEVANCE';

export type SortOption = {
  key: string;
  label: string;
  product: ProductSortKey;
  collection: CollectionSortKey;
  reverse: boolean;
};

export const SORT_OPTIONS: SortOption[] = [
  { key: 'destaque', label: 'Em destaque', product: 'BEST_SELLING', collection: 'MANUAL', reverse: false },
  // ponytail: RELEVANCE só é válido com search query; coleções não têm uma → BEST_SELLING como proxy (senão 500).
  { key: 'relevancia', label: 'Mais relevantes', product: 'RELEVANCE', collection: 'BEST_SELLING', reverse: false },
  { key: 'mais-vendidos', label: 'Mais vendidos', product: 'BEST_SELLING', collection: 'BEST_SELLING', reverse: false },
  { key: 'az', label: 'Ordem alfabética, A–Z', product: 'TITLE', collection: 'TITLE', reverse: false },
  { key: 'za', label: 'Ordem alfabética, Z–A', product: 'TITLE', collection: 'TITLE', reverse: true },
  { key: 'preco-asc', label: 'Preço, ordem crescente', product: 'PRICE', collection: 'PRICE', reverse: false },
  { key: 'preco-desc', label: 'Preço, ordem decrescente', product: 'PRICE', collection: 'PRICE', reverse: true },
  { key: 'data-antiga', label: 'Data, mais antiga primeiro', product: 'CREATED_AT', collection: 'CREATED', reverse: false },
  { key: 'data-recente', label: 'Data, mais recente primeiro', product: 'CREATED_AT', collection: 'CREATED', reverse: true },
];

export function resolveSort(s?: string): SortOption {
  return SORT_OPTIONS.find((o) => o.key === s) ?? SORT_OPTIONS[0];
}
