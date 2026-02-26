import { Typography, theme } from 'antd';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DroppedFieldCard } from './DroppedFieldCard';
import type { FormFieldInstance } from '../../types/form-builder.types';

const { Text } = Typography;

export const CANVAS_DROPPABLE_ID = 'form-canvas' as const;

interface FormCanvasProps {
  fields: FormFieldInstance[];
  onFieldChange: (id: string, changes: Partial<FormFieldInstance>) => void;
  onFieldDelete: (id: string) => void;
  onGroupChildChange: (groupId: string, childId: string, changes: Partial<FormFieldInstance>) => void;
  onGroupChildDelete: (groupId: string, childId: string) => void;
}

export const FormCanvas = ({
  fields,
  onFieldChange,
  onFieldDelete,
  onGroupChildChange,
  onGroupChildDelete,
}: FormCanvasProps) => {
  const { token } = theme.useToken();
  const { setNodeRef, isOver } = useDroppable({ id: CANVAS_DROPPABLE_ID });

  const isEmpty = fields.length === 0;

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        minHeight: 240,
        borderRadius: token.borderRadius,
        border: `2px dashed ${isOver ? token.colorPrimary : isEmpty ? token.colorBorderSecondary : 'transparent'}`,
        background: isOver ? token.colorPrimaryBg : 'transparent',
        transition: `border-color ${token.motionDurationMid}, background ${token.motionDurationMid}`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {isEmpty ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text type="secondary" style={{ fontSize: 13 }}>
            Перетащите поле из панели инструментов
          </Text>
        </div>
      ) : (
        <div style={{ padding: '12px 12px 32px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            {fields.map((field) => (
              <DroppedFieldCard
                key={field.id}
                field={field}
                onChange={(changes) => onFieldChange(field.id, changes)}
                onDelete={() => onFieldDelete(field.id)}
                onChildChange={(childId, changes) =>
                  onGroupChildChange(field.id, childId, changes)
                }
                onChildDelete={(childId) => onGroupChildDelete(field.id, childId)}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
};
