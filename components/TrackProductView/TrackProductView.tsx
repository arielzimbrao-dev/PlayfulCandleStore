'use client';

import { useEffect } from 'react';
import { ecommerceEvent } from '@/lib/analytics';

export default function TrackProductView({
  id,
  name,
  price,
  category,
}: {
  id: string;
  name: string;
  price: number;
  category: string;
}) {
  useEffect(() => {
    ecommerceEvent('view_item', [
      { item_id: id, item_name: name, price, quantity: 1, item_category: category },
    ]);
  }, [id, name, price, category]);
  return null;
}
