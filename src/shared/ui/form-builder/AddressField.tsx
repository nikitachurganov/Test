import { useEffect, useRef } from 'react';
import { Form, Input } from 'antd';
import type { FormFieldInstance } from '../../types/form-builder.types';
import { useYandexMaps } from '../../hooks/useYandexMaps';
import { FieldLabel } from './FieldLabel';

interface AddressFieldProps {
  field: FormFieldInstance;
}

const getAddressRules = (required: boolean) =>
  required
    ? [
        {
          required: true,
          message: 'Это поле обязательно для заполнения',
        },
      ]
    : [];

export const AddressField = ({ field }: AddressFieldProps) => {
  const { ymaps } = useYandexMaps();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const suggestViewRef = useRef<any | null>(null);

  useEffect(() => {
    if (!ymaps || typeof window === 'undefined') return;
    if (!inputRef.current) return;
    if (suggestViewRef.current) return;

    const ymAny = ymaps as any;

    try {
      const provider = {
        suggest: (request: string, options: unknown) => {
          if (!request || request.length < 2) {
            if (ymAny.vow && typeof ymAny.vow.resolve === 'function') {
              return ymAny.vow.resolve([]);
            }
            return Promise.resolve([]);
          }

          const baseOptions = (options || {}) as Record<string, unknown>;
          return ymAny.suggest(request, {
            ...baseOptions,
            results: 5,
            boundedBy: [
              [41, 19],
              [82, 191],
            ],
            strictBounds: false,
          });
        },
      };

      const view = new ymAny.SuggestView(inputRef.current, {
        results: 5,
        provider,
      });

      suggestViewRef.current = view;
    } catch {
      // Graceful fallback — just keep the input as a normal text field
    }

    return () => {
      if (suggestViewRef.current && typeof suggestViewRef.current.destroy === 'function') {
        suggestViewRef.current.destroy();
        suggestViewRef.current = null;
      }
    };
  }, [ymaps]);

  return (
    <Form.Item
      name={field.id}
      label={
        <FieldLabel
          label={field.label || 'Адрес'}
          required={field.required}
        />
      }
      required={field.required}
      rules={getAddressRules(field.required)}
      help={field.description || undefined}
    >
      <Input
        ref={inputRef}
        placeholder="Начните вводить адрес..."
        style={{ width: '100%' }}
      />
    </Form.Item>
  );
};


