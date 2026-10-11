// Opções de ordenação (dropdown) — mapeiam para as sort keys da Storefront API.
// A query de produtos usa ProductSortKeys; a de coleção usa ProductCollectionSortKeys.
export type ProductSortKey = 'BEST_SELLING' | 'CREATED_AT' | 'TITLE' | 'PRICE' | 'RELEVANCE';
export type CollectionSortKey =
  'BEST_SELLING' | 'CREATED' | 'TITLE' | 'PRICE' | 'MANUAL' | 'RELEVANCE';

export type SortOption = {
  key: string;
  label: string;
  product: ProductSortKey;
  collection: CollectionSortKey;
  reverse: boolean;
};

export const SORT_OPTIONS: SortOption[] = [
  {
    key: 'destaque',
    label: 'Em Destaque',
    product: 'BEST_SELLING',
    collection: 'MANUAL',
    reverse: false,
  },
  // ponytail: RELEVANCE só é válido com uma query de busca; coleções não têm uma → BEST_SELLING
  // como substituto (senão dá 500).
  {
    key: 'relevancia',
    label: 'Mais relevantes',
    product: 'RELEVANCE',
    collection: 'BEST_SELLING',
    reverse: false,
  },
  {
    key: 'mais-vendidos',
    label: 'Mais vendidos',
    product: 'BEST_SELLING',
    collection: 'BEST_SELLING',
    reverse: false,
  },
  {
    key: 'az',
    label: 'Alfabeticamente, A-Z',
    product: 'TITLE',
    collection: 'TITLE',
    reverse: false,
  },
  {
    key: 'za',
    label: 'Alfabeticamente, Z-A',
    product: 'TITLE',
    collection: 'TITLE',
    reverse: true,
  },
  {
    key: 'preco-asc',
    label: 'Preço, mais baratos',
    product: 'PRICE',
    collection: 'PRICE',
    reverse: false,
  },
  {
    key: 'preco-desc',
    label: 'Preço, mais caros',
    product: 'PRICE',
    collection: 'PRICE',
    reverse: true,
  },
  {
    key: 'data-antiga',
    label: 'Data, mais antigos',
    product: 'CREATED_AT',
    collection: 'CREATED',
    reverse: false,
  },
  {
    key: 'data-recente',
    label: 'Data, mais recentes',
    product: 'CREATED_AT',
    collection: 'CREATED',
    reverse: true,
  },
];

// Chave desconhecida (URL editada à mão, link antigo) cai na ordenação padrão em vez de quebrar.
export function resolveSort(sortKey?: string): SortOption {
  return SORT_OPTIONS.find((option) => option.key === sortKey) ?? SORT_OPTIONS[0];
}
