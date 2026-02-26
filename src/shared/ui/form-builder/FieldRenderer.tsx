import { Checkbox, DatePicker, Input, Radio, Select, TimePicker, Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { theme } from 'antd';
import { FIELD_TYPE_LABELS, type FormFieldInstance } from '../../types/form-builder.types';

interface FieldRendererProps {
  field: FormFieldInstance;
}

/**
 * Disabled/non-interactive preview of a field.
 * Used inside the DragOverlay for canvas field reordering.
 */
export const FieldRenderer = ({ field }: FieldRendererProps) => {
  const { token } = theme.useToken();
  const options = field.options ?? [];

  switch (field.type) {
    case 'shortText':
      return <Input disabled placeholder={FIELD_TYPE_LABELS.shortText} />;

    case 'longText':
      return (
        <Input.TextArea
          disabled
          placeholder={FIELD_TYPE_LABELS.longText}
          autoSize={{ minRows: 2, maxRows: 3 }}
        />
      );

    case 'radio':
      return (
        <Radio.Group
          disabled
          style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
        >
          {options.map((opt) => (
            <Radio key={opt.id} value={opt.id}>
              {opt.label}
            </Radio>
          ))}
        </Radio.Group>
      );

    case 'checkbox':
      return (
        <Checkbox.Group
          disabled
          options={options.map((opt) => ({ label: opt.label, value: opt.id }))}
          style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
        />
      );

    case 'dropdown':
      return (
        <Select
          disabled
          placeholder={FIELD_TYPE_LABELS.dropdown}
          style={{ width: '100%' }}
          options={options.map((opt) => ({ label: opt.label, value: opt.id }))}
        />
      );

    case 'yesNo':
      return (
        <Radio.Group disabled style={{ display: 'flex', gap: 16 }}>
          <Radio value="yes">Да</Radio>
          <Radio value="no">Нет</Radio>
        </Radio.Group>
      );

    case 'number':
      return <Input disabled type="number" placeholder={FIELD_TYPE_LABELS.number} />;

    case 'fullName':
      return <Input disabled placeholder={FIELD_TYPE_LABELS.fullName} />;

    case 'phone':
      return <Input disabled type="tel" placeholder="+7 (___) ___-__-__" />;

    case 'email':
      return <Input disabled type="email" placeholder="example@mail.com" />;

    case 'dateTime':
      return (
        <DatePicker
          disabled
          showTime
          style={{ width: '100%' }}
          placeholder={FIELD_TYPE_LABELS.dateTime}
        />
      );

    case 'date':
      return (
        <DatePicker
          disabled
          style={{ width: '100%' }}
          placeholder={FIELD_TYPE_LABELS.date}
        />
      );

    case 'time':
      return (
        <TimePicker
          disabled
          style={{ width: '100%' }}
          placeholder={FIELD_TYPE_LABELS.time}
        />
      );

    case 'group':
      return (
        <div
          style={{
            padding: 12,
            background: token.colorFillAlter,
            border: `1px dashed ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadiusSM,
            color: token.colorTextSecondary,
            fontSize: token.fontSizeSM,
          }}
        >
          {FIELD_TYPE_LABELS.group}
          {field.children && field.children.length > 0
            ? ` (${field.children.length})`
            : ''}
        </div>
      );

    case 'fileUpload':
      return (
        <Upload.Dragger
          disabled
          showUploadList={false}
          style={{ pointerEvents: 'none' }}
        >
          <p style={{ margin: 0 }}>
            <InboxOutlined style={{ fontSize: 20 }} />
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 12 }}>
            {FIELD_TYPE_LABELS.fileUpload}
          </p>
        </Upload.Dragger>
      );

    case 'address':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Input disabled placeholder="Город" />
          <Input disabled placeholder="Улица" />
          <Input disabled placeholder="Дом / Квартира" />
        </div>
      );
  }
};
