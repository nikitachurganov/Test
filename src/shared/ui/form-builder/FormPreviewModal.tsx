import { useEffect, useState } from 'react';
import {
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
  notification,
  theme,
} from 'antd';
import { InboxOutlined, SendOutlined } from '@ant-design/icons';
import type { FormFieldInstance } from '../../types/form-builder.types';

const { Title, Text } = Typography;
const { TextArea } = Input;

// ─── Props ────────────────────────────────────────────────────────────────────

interface FormPreviewModalProps {
  open: boolean;
  onClose: () => void;
  formTitle: string;
  fields: FormFieldInstance[];
}

// ─── Single field renderer ───────────────────────────────────────────────────

interface PreviewFieldProps {
  field: FormFieldInstance;
}

const PreviewField = ({ field }: PreviewFieldProps) => {
  const { token } = theme.useToken();

  // ── Group: render as a titled section with nested fields ─────────────────
  if (field.type === 'group') {
    const children = field.children ?? [];
    return (
      <div
        style={{
          background: token.colorFillAlter,
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: token.borderRadius,
          padding: '16px 20px',
          marginBottom: token.marginMD,
        }}
      >
        {(field.label || field.description) && (
          <>
            {field.label && (
              <Text strong style={{ fontSize: token.fontSizeLG, display: 'block' }}>
                {field.label}
              </Text>
            )}
            {field.description && (
              <Text
                type="secondary"
                style={{ display: 'block', marginTop: 4, marginBottom: 12 }}
              >
                {field.description}
              </Text>
            )}
            <Divider style={{ marginTop: 8, marginBottom: 16 }} />
          </>
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

  // ── Address: composite inputs without a single form value ────────────────
  if (field.type === 'address') {
    return (
      <Form.Item
        label={field.label || 'Адрес'}
        required={field.required}
        help={field.description || undefined}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Input placeholder="Город" />
            <Input placeholder="Улица" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Input placeholder="Дом" />
            <Input placeholder="Квартира" />
          </div>
          <Input placeholder="Почтовый индекс" />
        </div>
      </Form.Item>
    );
  }

  // ── File upload ──────────────────────────────────────────────────────────
  if (field.type === 'fileUpload') {
    return (
      <Form.Item
        label={field.label || undefined}
        required={field.required}
        help={field.description || undefined}
      >
        <Upload.Dragger beforeUpload={() => false} showUploadList={false}>
          <p style={{ margin: 0 }}>
            <InboxOutlined style={{ fontSize: 24 }} />
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 13 }}>
            Нажмите или перетащите файл для загрузки
          </p>
        </Upload.Dragger>
      </Form.Item>
    );
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

      case 'radio':
        return (
          <Radio.Group
            options={options.length ? options : [{ label: 'Вариант 1', value: '__1' }]}
          />
        );

      case 'checkbox':
        return (
          <Checkbox.Group
            options={options.length ? options : [{ label: 'Вариант 1', value: '__1' }]}
          />
        );

      case 'dropdown':
        return (
          <Select
            placeholder="Выберите вариант"
            options={options}
            style={{ width: '100%' }}
          />
        );

      case 'yesNo':
        return (
          <Radio.Group
            options={[
              { label: 'Да', value: 'yes' },
              { label: 'Нет', value: 'no' },
            ]}
          />
        );

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
      label={field.label || undefined}
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form values every time the modal closes so re-opening is fresh
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
      // Brief artificial delay to make the interaction feel realistic
      await new Promise<void>((resolve) => setTimeout(resolve, 500));
      notification.success({
        message: 'Форма отправлена',
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
            color="blue"
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
        <Form form={form} layout="vertical" requiredMark="optional">
          {fields.map((field) => (
            <PreviewField key={field.id} field={field} />
          ))}

          <Divider style={{ marginTop: 8 }} />

          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleMockSubmit}
            loading={isSubmitting}
            block
          >
            Отправить
          </Button>
        </Form>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 0',
          }}
        >
          <Text type="secondary">
            В форму не добавлено ни одного поля.
          </Text>
        </div>
      )}
    </Modal>
  );
};
