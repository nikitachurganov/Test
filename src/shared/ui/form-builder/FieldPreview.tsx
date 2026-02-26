import { DatePicker, Input, Radio, Select, TimePicker, Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { FieldOptionsEditor } from './FieldOptionsEditor';
import type { FieldOption, FormFieldInstance } from '../../types/form-builder.types';

interface FieldPreviewProps {
  field: FormFieldInstance;
  onOptionsChange: (options: FieldOption[]) => void;
}

/**
 * Renders the interactive preview / editor for a field block on the canvas.
 * Options-based types (radio, checkbox, dropdown) render an editable options list.
 * All other types render a disabled, non-interactive Ant Design component.
 * Groups are rendered by GroupBlock and return null here.
 */
export const FieldPreview = ({ field, onOptionsChange }: FieldPreviewProps) => {
  switch (field.type) {
    case 'shortText':
      return <Input disabled placeholder="Короткий текст" />;

    case 'longText':
      return (
        <Input.TextArea
          disabled
          placeholder="Длинный текст"
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      );

    case 'radio':
    case 'checkbox':
      return field.options ? (
        <FieldOptionsEditor
          fieldType={field.type}
          options={field.options}
          onChange={onOptionsChange}
        />
      ) : null;

    case 'dropdown':
      return (
        <>
          <Select
            disabled
            placeholder="Выпадающий список"
            style={{ width: '100%', marginBottom: 12 }}
            options={field.options?.map((opt) => ({ label: opt.label, value: opt.id }))}
          />
          {field.options && (
            <FieldOptionsEditor
              fieldType="dropdown"
              options={field.options}
              onChange={onOptionsChange}
            />
          )}
        </>
      );

    case 'yesNo':
      return (
        <Radio.Group disabled style={{ display: 'flex', gap: 16 }}>
          <Radio value="yes">Да</Radio>
          <Radio value="no">Нет</Radio>
        </Radio.Group>
      );

    case 'number':
      return <Input disabled type="number" placeholder="Число" />;

    case 'fullName':
      return <Input disabled placeholder="Полное имя" />;

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
          placeholder="Дата и время"
        />
      );

    case 'date':
      return <DatePicker disabled style={{ width: '100%' }} placeholder="Дата" />;

    case 'time':
      return <TimePicker disabled style={{ width: '100%' }} placeholder="Время" />;

    case 'group':
      // Rendered by GroupBlock — FieldPreview is not used for groups
      return null;

    case 'fileUpload':
      return (
        <Upload.Dragger
          disabled
          beforeUpload={() => false}
          showUploadList={false}
          style={{ pointerEvents: 'none' }}
        >
          <p style={{ margin: 0 }}>
            <InboxOutlined style={{ fontSize: 24 }} />
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 13 }}>Загрузите файл</p>
        </Upload.Dragger>
      );

    case 'address':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Input disabled placeholder="Город" />
            <Input disabled placeholder="Улица" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Input disabled placeholder="Дом" />
            <Input disabled placeholder="Квартира" />
          </div>
          <Input disabled placeholder="Почтовый индекс" />
        </div>
      );
  }
};
