import { Button, Divider, Input, Popconfirm, Switch, Typography, theme } from 'antd';
import { DragHandle } from './DragHandle';
import { FieldPreview } from './FieldPreview';
import type { FieldOption, FormFieldInstance } from '../../types/form-builder.types';

const { Text } = Typography;

interface FieldBlockProps {
  field: FormFieldInstance;
  onChange: (changes: Partial<FormFieldInstance>) => void;
  onDelete: () => void;
  dragHandleProps: React.HTMLAttributes<HTMLDivElement>;
  isDraggingOverlay?: boolean;
}

export const FieldBlock = ({
  field,
  onChange,
  onDelete,
  dragHandleProps,
  isDraggingOverlay = false,
}: FieldBlockProps) => {
  const { token } = theme.useToken();

  const handleOptionsChange = (options: FieldOption[]) => {
    onChange({ options });
  };

  return (
    <div
      style={{
        background: token.colorBgContainer,
        border: `1px solid ${isDraggingOverlay ? token.colorPrimary : token.colorBorderSecondary}`,
        borderRadius: token.borderRadius,
        boxShadow: isDraggingOverlay ? token.boxShadowSecondary : 'none',
        overflow: 'hidden',
      }}
    >
      {/* ── Drag handle — top center ── */}
      <DragHandle dragProps={dragHandleProps} />

      {/* ── Block content ── */}
      <div style={{ padding: '0px 16px 12px' }}>

        {/* Editable label (title) */}
        <Input
          variant="borderless"
          placeholder="Напишите название"
          value={field.label}
          onChange={(e) => onChange({ label: e.target.value })}
          style={{
            padding: '0 4px',
            fontSize: token.fontSizeLG,
            fontWeight: token.fontWeightStrong,
            color: token.colorText,
            width: '100%',
            marginBottom: 2,
          }}
        />

        {/* Editable description */}
        <Input
          variant="borderless"
          placeholder="Напишите описание"
          value={field.description}
          onChange={(e) => onChange({ description: e.target.value })}
          style={{
            padding: '0 4px',
            fontSize: token.fontSizeSM,
            color: token.colorTextSecondary,
            width: '100%',
            marginBottom: 12,
          }}
        />

        {/* ── Field preview / options editor ── */}
        <FieldPreview field={field} onOptionsChange={handleOptionsChange} />

        {/* ── Required switch ── */}
        <Divider style={{ margin: '14px 0 10px' }} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Switch
              size="small"
              checked={field.required}
              onChange={(checked) => onChange({ required: checked })}
            />
            <Text style={{ fontSize: token.fontSize, color: token.colorTextSecondary }}>
              Обязательно для заполнения
            </Text>
          </div>

          {/* ── Delete button ── */}
          <Popconfirm
            title="Удалить поле?"
            okText="Удалить"
            cancelText="Отмена"
            okButtonProps={{ danger: true }}
            onConfirm={onDelete}
            placement="bottom"
          >
            <Button
              size="small"
              type="link"
              danger
              style={{ paddingInline: 0 }}
            >
              Удалить поле
            </Button>
          </Popconfirm>
        </div>
      </div>
    </div>
  );
};
