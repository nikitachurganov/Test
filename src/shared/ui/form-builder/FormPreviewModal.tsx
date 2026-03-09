import { useEffect, useState } from 'react';
import {
  App,
  Button,
  Checkbox,
  DatePicker,
  Divider,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Tag,
  TimePicker,
  Typography,
  Upload,
  theme,
} from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { FormFieldInstance } from '../../types/form-builder.types';
import { AddressField } from './AddressField';
import { FieldLabel } from './FieldLabel';

const { Title, Text } = Typography;
const { TextArea } = Input;

// ─── Props ────────────────────────────────────────────────────────────────────

interface FormPreviewModalProps {
  open: boolean;
  onClose: () => void;
  formTitle: string;
  fields: FormFieldInstance[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getFileAccept = (type: FormFieldInstance['type']): string | undefined => {
  switch (type) {
    case 'file_vector':
      return '.svg,.ai,.eps,.pdf';
    case 'file_image':
      return 'image/*';
    case 'file_document':
      return '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt';
    default:
      return undefined;
  }
};

const getFileUploadPrompt = (type: FormFieldInstance['type']): string => {
  switch (type) {
    case 'file_vector':
      return 'Нажмите или перетащите векторный файл для загрузки';
    case 'file_image':
      return 'Нажмите или перетащите изображение для загрузки';
    case 'file_document':
    default:
      return 'Нажмите или перетащите документ для загрузки';
  }
};

// ─── FileUploadField ──────────────────────────────────────────────────────────

interface FileUploadFieldProps {
  field: FormFieldInstance;
}

const FileUploadField = ({ field }: FileUploadFieldProps) => (
  <Form.Item
    name={field.id}
    label={
      field.label ? (
        <FieldLabel label={field.label} required={field.required} />
      ) : undefined
    }
    required={field.required}
    help={field.description || undefined}
    valuePropName="fileList"
    getValueFromEvent={(e: { fileList?: unknown[] } | unknown[]) => {
      if (Array.isArray(e)) return e;
      return (e as { fileList?: unknown[] })?.fileList;
    }}
    rules={
      field.required
        ? [
            {
              validator: (_: unknown, value: unknown[]) =>
                value && value.length > 0
                  ? Promise.resolve()
                  : Promise.reject(new Error('Загрузите файл')),
            },
          ]
        : []
    }
  >
    <Upload.Dragger
      beforeUpload={() => false}
      accept={getFileAccept(field.type)}
    >
      <p style={{ margin: 0 }}>
        <InboxOutlined style={{ fontSize: 24 }} />
      </p>
      <p style={{ margin: '8px 0 0', fontSize: 13 }}>
        {getFileUploadPrompt(field.type)}
      </p>
    </Upload.Dragger>
  </Form.Item>
);

// ─── CheckboxGroupField ───────────────────────────────────────────────────────

interface CheckboxGroupFieldProps {
  options: { label: string; value: string }[];
  value?: string[];
  onChange?: (values: string[]) => void;
}

/**
 * Renders each checkbox option inside a styled container that visually matches
 * text inputs. The entire row is clickable; the container highlights when checked.
 * Form.Item passes `value` and `onChange` automatically as the direct child.
 */
const CheckboxGroupField = ({
  options,
  value = [],
  onChange,
}: CheckboxGroupFieldProps) => {
  const { token } = theme.useToken();

  const toggle = (optValue: string) => {
    const next = value.includes(optValue)
      ? value.filter((v) => v !== optValue)
      : [...value, optValue];
    onChange?.(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map((opt) => {
        const checked = value.includes(opt.value);
        return (
          <div
            key={opt.value}
            onClick={() => toggle(opt.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              border: `1px solid ${checked ? token.colorPrimary : token.colorBorder}`,
              borderRadius: token.borderRadius,
              background: checked ? token.colorPrimaryBg : token.colorBgContainer,
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'border-color 0.2s ease, background 0.2s ease',
            }}
          >
            <Checkbox checked={checked} />
            <span style={{ fontSize: token.fontSize }}>{opt.label}</span>
          </div>
        );
      })}
    </div>
  );
};

// ─── RadioGroupField ──────────────────────────────────────────────────────────

interface RadioGroupFieldProps {
  options: { label: string; value: string }[];
  value?: string;
  onChange?: (value: string) => void;
}

/**
 * Renders each radio option inside the same styled container as checkboxes.
 * Only one option can be selected; clicking the row selects that option.
 * Used as direct child of Form.Item so `value` / `onChange` are provided.
 */
const RadioGroupField = ({ options, value, onChange }: RadioGroupFieldProps) => {
  const { token } = theme.useToken();

  const select = (optValue: string) => {
    if (optValue === value) return;
    onChange?.(optValue);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map((opt) => {
        const checked = value === opt.value;
        return (
          <div
            key={opt.value}
            onClick={() => select(opt.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              border: `1px solid ${checked ? token.colorPrimary : token.colorBorder}`,
              borderRadius: token.borderRadius,
              background: checked ? token.colorPrimaryBg : token.colorBgContainer,
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'border-color 0.2s ease, background 0.2s ease',
            }}
          >
            <Radio checked={checked} />
            <span style={{ fontSize: token.fontSize }}>{opt.label}</span>
          </div>
        );
      })}
    </div>
  );
};

// ─── YesNoRadioGroupField ─────────────────────────────────────────────────────

interface YesNoRadioGroupFieldProps {
  value?: string;
  onChange?: (value: string) => void;
}

/**
 * Specialized 2-option yes/no group. Uses the same container visuals as
 * RadioGroupField, but lays options side-by-side at 50% width each.
 */
const YesNoRadioGroupField = ({ value, onChange }: YesNoRadioGroupFieldProps) => {
  const { token } = theme.useToken();

  const select = (optValue: string) => {
    if (optValue === value) return;
    onChange?.(optValue);
  };

  const options = [
    { label: 'Да', value: 'yes' },
    { label: 'Нет', value: 'no' },
  ];

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        gap: 12,
      }}
    >
      {options.map((opt) => {
        const checked = value === opt.value;
        return (
          <div
            key={opt.value}
            onClick={() => select(opt.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              border: `1px solid ${checked ? token.colorPrimary : token.colorBorder}`,
              borderRadius: token.borderRadius,
              background: checked ? token.colorPrimaryBg : token.colorBgContainer,
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'border-color 0.2s ease, background 0.2s ease',
              flex: 1,
            }}
          >
            <Radio checked={checked} />
            <span style={{ fontSize: token.fontSize }}>{opt.label}</span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Single field renderer ────────────────────────────────────────────────────

interface PreviewFieldProps {
  field: FormFieldInstance;
}

export const PreviewField = ({ field }: PreviewFieldProps) => {
  const { token } = theme.useToken();

  // ── Group: titled section with nested fields — no asterisk on group ───────
  if (field.type === 'group') {
    const children = field.children ?? [];
    return (
      <div style={{ marginBottom: token.marginMD }}>
        {field.label && (
          <Text strong style={{ fontSize: token.fontSizeLG, display: 'block', marginBottom: 4 }}>
            {field.label}
          </Text>
        )}
        {field.description && (
          <Text
            type="secondary"
            style={{ display: 'block', marginBottom: 12 }}
          >
            {field.description}
          </Text>
        )}
        {children.length > 0 ? (
          children.map((child) => <PreviewField key={child.id} field={child} />)
        ) : (
          <Text type="secondary" italic style={{ fontSize: token.fontSizeSM }}>
            В группе нет полей
          </Text>
        )}
      </div>
    );
  }

  // ── Address: single-line input with Yandex suggestions ───────────────────
  if (field.type === 'address') {
    return <AddressField field={field} />;
  }

  // ── File upload ──────────────────────────────────────────────────────────
  if (
    field.type === 'file_vector' ||
    field.type === 'file_image' ||
    field.type === 'file_document'
  ) {
    return <FileUploadField field={field} />;
  }

  // ── Standard fields (bound to Form state via name={field.id}) ───────────
  const options = (field.options ?? []).map((o) => ({ label: o.label, value: o.id }));

  const requiredRule = field.required
    ? [{ required: true, message: 'Это поле обязательно для заполнения' }]
    : [];

  const checkboxRequiredRule = field.required
    ? [
        {
          validator: (_: unknown, value: string[]) =>
            value && value.length > 0
              ? Promise.resolve()
              : Promise.reject(new Error('Выберите хотя бы один вариант')),
        },
      ]
    : [];

  const renderControl = () => {
    switch (field.type) {
      case 'shortText':
        return <Input placeholder={field.description || undefined} />;

      case 'longText':
        return <TextArea rows={3} placeholder={field.description || undefined} />;

      case 'radio': {
        const radioOptions = options.length
          ? options
          : [{ label: 'Вариант 1', value: '__1' }];
        return <RadioGroupField options={radioOptions} />;
      }

      case 'checkbox': {
        const checkboxOptions = options.length
          ? options
          : [{ label: 'Вариант 1', value: '__1' }];
        return <CheckboxGroupField options={checkboxOptions} />;
      }

      case 'dropdown':
        return (
          <Select
            placeholder="Выберите вариант"
            options={options}
            style={{ width: '100%' }}
          />
        );

      case 'yesNo':
        return <YesNoRadioGroupField />;

      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.description || 'Введите число'}
          />
        );

      case 'fullName':
        return <Input placeholder={field.description || 'Полное имя'} />;

      case 'phone':
        return (
          <Input
            type="tel"
            placeholder={field.description || '+7 (___) ___-__-__'}
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            placeholder={field.description || 'example@mail.com'}
          />
        );

      case 'dateTime':
        return <DatePicker showTime style={{ width: '100%' }} />;

      case 'date':
        return <DatePicker style={{ width: '100%' }} />;

      case 'time':
        return <TimePicker style={{ width: '100%' }} />;

      default:
        return <Input />;
    }
  };

  return (
    <Form.Item
      name={field.id}
      label={
        field.label ? (
          <FieldLabel label={field.label} required={field.required} />
        ) : undefined
      }
      required={field.required}
      rules={field.type === 'checkbox' ? checkboxRequiredRule : requiredRule}
      help={field.description || undefined}
    >
      {renderControl()}
    </Form.Item>
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────────

export const FormPreviewModal = ({
  open,
  onClose,
  formTitle,
  fields,
}: FormPreviewModalProps) => {
  const [form] = Form.useForm();
  const { token } = theme.useToken();
  const { notification } = App.useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleMockSubmit = async () => {
    try {
      await form.validateFields();
      setIsSubmitting(true);
      await new Promise<void>((resolve) => setTimeout(resolve, 500));
      notification.success({
        title: 'Форма отправлена',
        description: 'Это предпросмотр — данные не сохраняются.',
        placement: 'topRight',
      });
      form.resetFields();
    } catch {
      // Validation errors are shown inline — nothing extra needed here
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasFields = fields.length > 0;

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Предпросмотр формы
          <Tag
            color="processing"
            style={{ marginLeft: 4, fontWeight: 400, fontSize: 12 }}
          >
            Только просмотр
          </Tag>
        </div>
      }
      footer={null}
      width={680}
      styles={{
        body: {
          padding: '0 24px 24px',
          maxHeight: '75vh',
          overflowY: 'auto',
        },
      }}
    >
      {/* ── Form header ── */}
      <div
        style={{
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          paddingBottom: 16,
          marginBottom: 24,
          paddingTop: 8,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          {formTitle || (
            <Text type="secondary" italic style={{ fontWeight: 'normal' }}>
              Название не задано
            </Text>
          )}
        </Title>
      </div>

      {/* ── Fields ── */}
      {hasFields ? (
        <Form form={form} layout="vertical" requiredMark={false}>
          {fields.map((field) => (
            <PreviewField key={field.id} field={field} />
          ))}

          <Divider style={{ marginTop: 8 }} />

          <Button
            type="primary"
            onClick={handleMockSubmit}
            loading={isSubmitting}
          >
            Отправить
          </Button>
        </Form>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Text type="secondary">
            В форму не добавлено ни одного поля.
          </Text>
        </div>
      )}
    </Modal>
  );
};
