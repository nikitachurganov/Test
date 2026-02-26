import { Typography, theme } from 'antd';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FieldBlock } from './FieldBlock';
import { FieldRenderer } from './FieldRenderer';
import { GroupBlock } from './GroupBlock';
import {
  FIELD_TYPE_LABELS,
  type CanvasDragData,
  type FormFieldInstance,
} from '../../types/form-builder.types';

const { Text } = Typography;

// ─── Sortable field card ─────────────────────────────────────────────────────

interface DroppedFieldCardProps {
  field: FormFieldInstance;
  onChange: (changes: Partial<FormFieldInstance>) => void;
  onDelete: () => void;
  /** Required when field.type === 'group' */
  onChildChange?: (childId: string, changes: Partial<FormFieldInstance>) => void;
  /** Required when field.type === 'group' */
  onChildDelete?: (childId: string) => void;
}

export const DroppedFieldCard = ({
  field,
  onChange,
  onDelete,
  onChildChange,
  onChildDelete,
}: DroppedFieldCardProps) => {
  const dragData: CanvasDragData = { source: 'canvas' };

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
    data: dragData,
  });

  const dragHandleProps = {
    ...attributes,
    ...listeners,
  } as React.HTMLAttributes<HTMLDivElement>;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
        touchAction: 'none',
      }}
    >
      {field.type === 'group' ? (
        <GroupBlock
          field={field}
          onChange={onChange}
          onDelete={onDelete}
          onChildChange={onChildChange ?? (() => {})}
          onChildDelete={onChildDelete ?? (() => {})}
          dragHandleProps={dragHandleProps}
        />
      ) : (
        <FieldBlock
          field={field}
          onChange={onChange}
          onDelete={onDelete}
          dragHandleProps={dragHandleProps}
        />
      )}
    </div>
  );
};

// ─── Drag overlay — shown while a canvas field is being reordered ────────────

interface CanvasFieldOverlayProps {
  field: FormFieldInstance;
}

export const CanvasFieldOverlay = ({ field }: CanvasFieldOverlayProps) => {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        background: token.colorBgContainer,
        border: `1px solid ${token.colorPrimary}`,
        borderRadius: token.borderRadius,
        boxShadow: token.boxShadowSecondary,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        opacity: 0.92,
      }}
    >
      <div>
        <Text strong style={{ fontSize: token.fontSizeLG }}>
          {field.label || 'Поле'}
        </Text>
        <br />
        <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
          {FIELD_TYPE_LABELS[field.type]}
        </Text>
      </div>
      <FieldRenderer field={field} />
    </div>
  );
};
