import { useCallback, useState } from 'react';
import { Breadcrumb, Button, Card, Input, Space, Typography, theme } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

import { ToolPanel } from '../shared/ui/ToolPanel';
import { FormCanvas } from '../shared/ui/form-builder/FormCanvas';
import { CanvasFieldOverlay } from '../shared/ui/form-builder/DroppedFieldCard';
import {
  FIELD_TYPES_WITH_OPTIONS,
  PANEL_KEY_TO_FIELD_TYPE,
  isGroupCanvas,
  groupIdFromCanvas,
  type DragData,
  type FieldOption,
  type FormFieldInstance,
  type FormFieldType,
} from '../shared/types/form-builder.types';

const { Title } = Typography;

// ─── FormTitleInput ──────────────────────────────────────────────────────────

interface FormTitleInputProps {
  value: string;
  onChange: (value: string) => void;
}

const FormTitleInput = ({ value, onChange }: FormTitleInputProps) => {
  const { token } = theme.useToken();

  return (
    <Input
      variant="borderless"
      placeholder="Название формы"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: 0,
        fontSize: token.fontSizeHeading4,
        fontWeight: 600,
        lineHeight: token.lineHeightHeading4,
        color: token.colorText,
        background: 'transparent',
        width: '100%',
      }}
    />
  );
};

// ─── Panel drag overlay chip ─────────────────────────────────────────────────

const PanelDragChip = ({ label }: { label: string }) => {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 14px',
        background: token.colorBgContainer,
        border: `1px solid ${token.colorPrimary}`,
        borderRadius: token.borderRadiusLG,
        boxShadow: token.boxShadowSecondary,
        color: token.colorPrimary,
        fontSize: 13,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        cursor: 'grabbing',
        userSelect: 'none',
      }}
    >
      {label}
    </div>
  );
};

// ─── Active drag state ───────────────────────────────────────────────────────

type ActiveDragInfo =
  | { source: 'panel'; label: string }
  | { source: 'canvas'; fieldId: string }
  | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const needsOptions = (type: FormFieldType): boolean =>
  FIELD_TYPES_WITH_OPTIONS.has(type);

const createDefaultOptions = (): FieldOption[] => [
  { id: crypto.randomUUID(), label: 'Вариант 1' },
  { id: crypto.randomUUID(), label: 'Вариант 2' },
];

const createField = (type: FormFieldType): FormFieldInstance => ({
  id: crypto.randomUUID(),
  type,
  label: '',
  description: '',
  required: false,
  options: needsOptions(type) ? createDefaultOptions() : undefined,
  children: type === 'group' ? [] : undefined,
});

// ─── CreateFormPage ──────────────────────────────────────────────────────────

export const CreateFormPage = () => {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const [formTitle, setFormTitle] = useState<string>('');
  const [fields, setFields] = useState<FormFieldInstance[]>([]);
  const [activeDrag, setActiveDrag] = useState<ActiveDragInfo>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // ── Top-level field mutation ─────────────────────────────────────────────────
  const handleFieldChange = useCallback(
    (id: string, changes: Partial<FormFieldInstance>) => {
      setFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...changes } : f)),
      );
    },
    [],
  );

  const handleFieldDelete = useCallback((id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // ── Group child mutation ─────────────────────────────────────────────────────
  const handleGroupChildChange = useCallback(
    (groupId: string, childId: string, changes: Partial<FormFieldInstance>) => {
      setFields((prev) =>
        prev.map((f) =>
          f.id === groupId && f.children
            ? {
                ...f,
                children: f.children.map((c) =>
                  c.id === childId ? { ...c, ...changes } : c,
                ),
              }
            : f,
        ),
      );
    },
    [],
  );

  const handleGroupChildDelete = useCallback(
    (groupId: string, childId: string) => {
      setFields((prev) =>
        prev.map((f) =>
          f.id === groupId && f.children
            ? { ...f, children: f.children.filter((c) => c.id !== childId) }
            : f,
        ),
      );
    },
    [],
  );

  // ── Drag start ──────────────────────────────────────────────────────────────
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined;
    if (!data) return;

    setActiveDrag(
      data.source === 'panel'
        ? { source: 'panel', label: data.label }
        : { source: 'canvas', fieldId: String(event.active.id) },
    );
  }, []);

  // ── Drag end ────────────────────────────────────────────────────────────────
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDrag(null);

    const { active, over } = event;
    if (!over) return;

    const data = active.data.current as DragData | undefined;
    if (!data) return;

    const overId = String(over.id);
    const activeId = String(active.id);

    // ── Panel → canvas drop ────────────────────────────────────────────────────
    if (data.source === 'panel') {
      const fieldType = PANEL_KEY_TO_FIELD_TYPE[data.fieldKey];
      if (!fieldType) return;

      const newField = createField(fieldType);

      // Dropped directly on a group's inner drop zone
      if (isGroupCanvas(overId)) {
        if (fieldType === 'group') return; // prevent nested groups
        const groupId = groupIdFromCanvas(overId);
        setFields((prev) =>
          prev.map((f) =>
            f.id === groupId
              ? { ...f, children: [...(f.children ?? []), newField] }
              : f,
          ),
        );
        return;
      }

      // Dropped on a field — figure out if it's a top-level or a group child
      setFields((prev) => {
        // Is overId a child inside some group?
        const parentGroup = prev.find(
          (f) => f.type === 'group' && f.children?.some((c) => c.id === overId),
        );

        if (parentGroup) {
          if (fieldType === 'group') return prev; // prevent nested groups
          return prev.map((f) => {
            if (f.id !== parentGroup.id || !f.children) return f;
            const idx = f.children.findIndex((c) => c.id === overId);
            const next = [...f.children];
            next.splice(idx + 1, 0, newField);
            return { ...f, children: next };
          });
        }

        // Top-level insert after the hovered field
        const overIndex = prev.findIndex((f) => f.id === overId);
        if (overIndex !== -1) {
          const next = [...prev];
          next.splice(overIndex + 1, 0, newField);
          return next;
        }

        // Fallback: append to end
        return [...prev, newField];
      });
      return;
    }

    // ── Canvas → canvas reorder ────────────────────────────────────────────────
    if (data.source === 'canvas') {
      setFields((prev) => {
        // Determine parent groups for both active and over IDs
        const activeParent = prev.find(
          (f) => f.type === 'group' && f.children?.some((c) => c.id === activeId),
        );
        const overParent = prev.find(
          (f) => f.type === 'group' && f.children?.some((c) => c.id === overId),
        );

        // Reorder within the same group
        if (activeParent && activeParent.id === overParent?.id) {
          return prev.map((f) => {
            if (f.id !== activeParent.id || !f.children) return f;
            const oldIdx = f.children.findIndex((c) => c.id === activeId);
            const newIdx = f.children.findIndex((c) => c.id === overId);
            if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return f;
            return { ...f, children: arrayMove(f.children, oldIdx, newIdx) };
          });
        }

        // Reorder top-level fields
        if (!activeParent && !overParent) {
          const oldIndex = prev.findIndex((f) => f.id === activeId);
          const newIndex = prev.findIndex((f) => f.id === overId);
          if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;
          return arrayMove(prev, oldIndex, newIndex);
        }

        // Cross-context moves (e.g. top-level ↔ group child): no-op for now
        return prev;
      });
    }
  }, []);

  // ── DragOverlay renderer ───────────────────────────────────────────────────
  const renderOverlay = () => {
    if (!activeDrag) return null;

    if (activeDrag.source === 'panel') {
      return <PanelDragChip label={activeDrag.label} />;
    }

    // Search top-level fields
    const topLevel = fields.find((f) => f.id === activeDrag.fieldId);
    if (topLevel) return <CanvasFieldOverlay field={topLevel} />;

    // Search group children
    for (const f of fields) {
      if (f.type === 'group' && f.children) {
        const child = f.children.find((c) => c.id === activeDrag.fieldId);
        if (child) return <CanvasFieldOverlay field={child} />;
      }
    }

    return null;
  };

  const handleSave = () => {
    // TODO: implement save logic
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
        }}
      >
        {/* ── Page header ── */}
        <div
          style={{
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            padding: '12px 24px 16px',
            flexShrink: 0,
          }}
        >
          <Breadcrumb
            style={{ marginBottom: 8 }}
            items={[
              { title: <a onClick={() => navigate('/forms')}>Формы</a> },
              { title: 'Создание новой формы' },
            ]}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Space align="center" size={12}>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/forms')}
                style={{ padding: '0 4px' }}
                aria-label="Вернуться к списку форм"
              />
              <Title level={4} style={{ margin: 0 }}>
                Новая форма
              </Title>
            </Space>

            <Button type="primary" onClick={handleSave}>
              Сохранить
            </Button>
          </div>
        </div>

        {/* ── Two-panel layout ── */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Left — Tool Panel */}
          <Card
            style={{
              width: 420,
              minWidth: 420,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              borderRadius: 0,
              boxShadow: 'none',
              borderTop: 'none',
              borderBottom: 'none',
              borderLeft: 'none',
              borderRight: `1px solid ${token.colorBorderSecondary}`,
            }}
            styles={{
              body: {
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                overflow: 'auto',
                padding: 0,
              },
            }}
          >
            <ToolPanel />
          </Card>

          {/* Right — Form Builder canvas */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              height: '100%',
              padding: 20,
              overflowY: 'auto',
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <FormTitleInput value={formTitle} onChange={setFormTitle} />
            <div style={{ marginBottom: token.margin }} />
            <FormCanvas
              fields={fields}
              onFieldChange={handleFieldChange}
              onFieldDelete={handleFieldDelete}
              onGroupChildChange={handleGroupChildChange}
              onGroupChildDelete={handleGroupChildDelete}
            />
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>{renderOverlay()}</DragOverlay>
    </DndContext>
  );
};
