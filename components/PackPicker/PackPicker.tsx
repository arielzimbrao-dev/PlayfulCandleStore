'use client';

import Image from 'next/image';
import type { PackOption } from '@/lib/packs';
import './PackPicker.scss';

export type PackPickerSlot = { key: string; options: PackOption[] };

// Escolha dos itens de um pack (dentro da BuyBox): um grupo de rádios por item, com foto.
// Uma opção fica desativada quando as escolhas dos outros itens já gastaram o stock dela
// (ex.: a mesma snapbar 3 vezes com só 2 em stock).
export default function PackPicker({
  slots,
  value,
  onChange,
}: {
  slots: PackPickerSlot[];
  value: Record<string, string>;
  onChange: (key: string, handle: string) => void;
}) {
  return (
    <div className="pack-picker">
      {slots.map((slot, index) => (
        <fieldset key={slot.key} className="pack-picker__slot">
          <legend>
            <span className="pack-picker__step" aria-hidden="true">
              {index + 1}
            </span>
            {slot.key}
          </legend>
          {slot.options.length === 0 ? (
            <p className="pack-picker__empty">Sem opções em stock de momento.</p>
          ) : (
            <div className="pack-picker__options">
              {slot.options.map((option) => {
                const usedElsewhere = Object.entries(value).filter(
                  ([key, handle]) => key !== slot.key && handle === option.handle,
                ).length;
                const isDisabled = option.stock != null && usedElsewhere >= option.stock;
                return (
                  <label key={option.handle} className="pack-picker__option">
                    <input
                      type="radio"
                      name={`pack-${slot.key}`}
                      value={option.handle}
                      checked={value[slot.key] === option.handle}
                      disabled={isDisabled}
                      onChange={() => onChange(slot.key, option.handle)}
                    />
                    {option.image && (
                      <Image src={option.image.url} alt="" width={40} height={40} className="pack-picker__thumb" />
                    )}
                    <span>{option.title}</span>
                  </label>
                );
              })}
            </div>
          )}
        </fieldset>
      ))}
    </div>
  );
}
