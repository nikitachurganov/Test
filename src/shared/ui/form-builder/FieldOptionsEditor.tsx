import { Button, Checkbox, Input, Radio, theme } from 'antd';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import type { FieldOption } from '../../types/form-builder.types';

interface FieldOptionsEditorProps {
  fieldType: 'radio' | 'checkbox' | 'dropdown';
  options: FieldOption[];
  onChange: (options: FieldOption[]) => void;
}

const OptionIndicator = ({
  fieldType,
}: {
  fieldType: FieldOptionsEditorProps['fieldType'];
}) => {
  const { token } = theme.useToken();

  if (fieldType === 'radio') {
    return <Radio style={{ marginInlineEnd: 0 }} />;
  }
  if (fieldType === 'checkbox') {
    return <Checkbox style={{ marginInlineEnd: 0 }} />;
  }
  // dropdown — neutral dot
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 16,
        height: 16,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: token.colorTextTertiary,
          display: 'block',
        }}
      />
    </span>
  );
};

export const FieldOptionsEditor = ({ fieldType, options, onChange }: FieldOptionsEditorProps) => {
  const { token } = theme.useToken();

  const handleLabelChange = (id: string, label: string) => {
    onChange(options.map((opt) => (opt.id === id ? { ...opt, label } : opt)));
  };

  const handleRemove = (id: string) => {
    if (options.length <= 1) return;
    onChange(options.filter((opt) => opt.id !== id));
  };

  const handleAdd = () => {
    onChange([
      ...options,
      { id: crypto.randomUUID(), label: `Вариант ${options.length + 1}` },
    ]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {options.map((opt) => (
        <div
          key={opt.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 0',
          }}
        >
          {/* Non-interactive field-type indicator */}
          <span
            style={{
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <OptionIndicator fieldType={fieldType} />
          </span>

          <Input
            variant="borderless"
            value={opt.label}
            placeholder="Вариант"
            onChange={(e) => handleLabelChange(opt.id, e.target.value)}
            style={{
              flex: 1,
              padding: '1px 4px',
              fontSize: token.fontSize,
            }}
          />

          <Button
            type="text"
            size="small"
            icon={<CloseOutlined style={{ fontSize: 10 }} />}
            onClick={() => handleRemove(opt.id)}
            disabled={options.length <= 1}
            style={{
              color: token.colorTextQuaternary,
              flexShrink: 0,
              minWidth: 22,
              width: 22,
              height: 22,
              padding: 0,
            }}
            aria-label={`Удалить вариант ${opt.label}`}
          />
        </div>
      ))}

      <Button
        type="text"
        icon={<PlusOutlined />}
        onClick={handleAdd}
        size="small"
        style={{
          alignSelf: 'flex-start',
          color: token.colorPrimary,
          padding: '4px 0',
          height: 'auto',
          marginTop: 2,
        }}
      >
        Добавить вариант
      </Button>
    </div>
  );
};
