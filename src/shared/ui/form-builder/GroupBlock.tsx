import { Button, Input, Popconfirm, Tag, Typography, theme } from 'antd';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DragHandle } from './DragHandle';
import { DroppedFieldCard } from './DroppedFieldCard';
import {
  GROUP_CANVAS_PREFIX,
  type FormFieldInstance,
} from '../../types/form-builder.types';

const { Text } = Typography;

interface GroupBlockProps {
  field: FormFieldInstance;
  onChange: (changes: Partial<FormFieldInstance>) => void;
  onDelete: () => void;
  /** Called when a child field inside this group changes */
  onChildChange: (childId: string, changes: Partial<FormFieldInstance>) => void;
  /** Called when a child field inside this group is deleted */
  onChildDelete: (childId: string) => void;
  dragHandleProps: React.HTMLAttributes<HTMLDivElement>;
}

export const GroupBlock = ({
  field,
  onChange,
  onDelete,
  onChildChange,
  onChildDelete,
  dragHandleProps,
}: GroupBlockProps) => {
  const { token } = theme.useToken();
  const children = field.children ?? [];

  const { setNodeRef, isOver } = useDroppable({
    id: `${GROUP_CANVAS_PREFIX}${field.id}`,
  });

  return (
    <div
      style={{
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadius,
        boxShadow: 'none',
        overflow: 'hidden',
      }}
    >
      {/* ── Drag handle ── */}
      <DragHandle dragProps={dragHandleProps} />

      {/* ── Block content ── */}
      <div style={{ padding: '0 16px 12px' }}>
        {/* Group type badge */}
        <div style={{ marginBottom: 8 }}>
          <Tag
            color="processing"
            style={{ borderRadius: token.borderRadiusSM, fontSize: 11, userSelect: 'none' }}
          >
            Группа полей
          </Tag>
        </div>

        {/* Editable title */}
        <Input
          variant="borderless"
          placeholder="Название группы"
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

        {/* ── Inner drop zone ── */}
        <div
          ref={setNodeRef}
          style={{
            minHeight: 80,
            borderRadius: token.borderRadiusSM,
            border: `2px dashed ${isOver ? token.colorPrimary : token.colorBorderSecondary}`,
            background: isOver ? token.colorPrimaryBg : token.colorBgLayout,
            transition: `border-color ${token.motionDurationMid}, background ${token.motionDurationMid}`,
          }}
        >
          {children.length === 0 ? (
            <div
              style={{
                padding: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                Перетащите поле в группу
              </Text>
            </div>
          ) : (
            <div
              style={{
                padding: '8px 8px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <SortableContext
                items={children.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {children.map((child) => (
                  <DroppedFieldCard
                    key={child.id}
                    field={child}
                    onChange={(changes) => onChildChange(child.id, changes)}
                    onDelete={() => onChildDelete(child.id)}
                  />
                ))}
              </SortableContext>
            </div>
          )}
        </div>

        {/* ── Delete ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <Popconfirm
            title="Удалить группу?"
            okText="Удалить"
            cancelText="Отмена"
            okButtonProps={{ danger: true }}
            onConfirm={onDelete}
            placement="bottom"
          >
            <Button size="small" type="link" danger style={{ paddingInline: 0 }}>
              Удалить группу
            </Button>
          </Popconfirm>
        </div>
      </div>
    </div>
  );
};
