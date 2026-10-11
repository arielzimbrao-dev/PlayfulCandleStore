'use client';

import { useEffect } from 'react';
import { ecommerceEvent, type EcommerceItem } from '@/lib/analytics';

// Dispara view_item_list uma vez por lista renderizada (loja/coleção/pesquisa).
export default function TrackListView({ items, listName }: { items: EcommerceItem[]; listName?: string }) {
  const key = items.map((i) => i.item_id).join(',');
  useEffect(() => {
    if (items.length === 0) return;
    ecommerceEvent('view_item_list', items, listName ? { item_list_name: listName } : {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, listName]);
  return null;
}
