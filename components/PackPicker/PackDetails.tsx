'use client';

import { usePackChoice } from '@/components/PackPicker/PackChoice';

export type PackDetailItem = { title: string; scents: string[] };
/** Item de escolha: as opções por handle (o escolhido vem do PackChoiceProvider). */
export type PackDetailSlot = { key: string; options: Record<string, PackDetailItem> };

const notes = (item: PackDetailItem) =>
  item.scents.length ? `${item.scents.join(', ')}.` : 'sem notas indicadas.';

// Acordeão "Aromas" + "Cuidados" da página de um pack: notas de cada produto do pack
// (nos itens de escolha, do produto escolhido na BuyBox) e os cuidados de cada tipo que o pack traz.
export default function PackDetails({
  fixed,
  slots,
  care,
}: {
  fixed: PackDetailItem[];
  slots: PackDetailSlot[];
  care: { label: string; text: string }[];
}) {
  const [choice] = usePackChoice();
  return (
    <>
      <details>
        <summary>Aromas e notas olfativas</summary>
        {fixed.map((item) => (
          <p key={item.title}>
            <strong>{item.title}:</strong> {notes(item)}
          </p>
        ))}
        {slots.map((slot) => {
          const item = slot.options[choice[slot.key] ?? ''];
          return (
            <p key={slot.key}>
              {item ? (
                <>
                  <strong>
                    {slot.key} · {item.title}:
                  </strong>{' '}
                  {notes(item)}
                </>
              ) : (
                <>
                  <strong>{slot.key}:</strong> escolhe o aroma acima para veres as notas.
                </>
              )}
            </p>
          );
        })}
      </details>
      <details>
        <summary>Cuidados de utilização</summary>
        {care.map((entry) => (
          <p key={entry.label}>
            <strong>{entry.label}:</strong> {entry.text}
          </p>
        ))}
      </details>
    </>
  );
}
