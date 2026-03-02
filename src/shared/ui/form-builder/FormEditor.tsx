import { useCallback, useState, type ReactNode } from 'react';
import {
  Breadcrumb,
  Button,
  Card,
  Divider,
  Form,
  Input,
  Space,
  Tag,
  Typography,
  notification,
  theme,
} from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, EyeOutlined, SendOutlined } from '@ant-design/icons';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

import { ToolPanel } from '../ToolPanel';
import { FormCanvas } from './FormCanvas';
import { CanvasFieldOverlay } from './DroppedFieldCard';
import { PreviewField } from './FormPreviewModal';
import {
  FIELD_TYPES_WITH_OPTIONS,
  PANEL_KEY_TO_FIELD_TYPE,
  isGroupCanvas,
  groupIdFromCanvas,
  type DragData,
  type FieldOption,
  type FormFieldInstance,
  type FormFieldType,
} from '../../types/form-builder.types';

const { Title } = Typography;

// ─── Public props ─────────────────────────────────────────────────────────────

export interface FormEditorProps {
  /** Second breadcrumb item text, e.g. "Создание новой формы" */
  breadcrumbLabel: string;
  /** Page-header title, e.g. "Новая форма" */
  pageTitle: string;
  /** Save button label (default: "Сохранить") */
  saveButtonLabel?: string;
  /** Pre-filled form name (edit mode) */
  initialTitle?: string;
  /** Pre-filled field list (edit mode) */
  initialFields?: FormFieldInstance[];
  /**
   * Called when the user clicks Save.
   * Should perform the API call and navigate away on success.
   * If it throws, FormEditor shows an error notification.
   */
  onSave: (title: string, fields: FormFieldInstance[]) => Promise<void>;
  /** Called when the user clicks the back arrow */
  onBack: () => void;
}

// ─── FormTitleInput ───────────────────────────────────────────────────────────

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

// ─── Panel drag overlay chip ──────────────────────────────────────────────────

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

// ─── Active drag state ────────────────────────────────────────────────────────

type ActiveDragInfo =
  | { source: 'panel'; label: string }
  | { source: 'canvas'; fieldId: string }
  | null;

// ─── Tool-panel drop zone ─────────────────────────────────────────────────────

/**
 * Stable ID for the tool-panel droppable zone.
 * Exported so handleDragEnd can compare against it without string literals.
 */
export const TOOL_PANEL_DROP_ID = 'tool-panel';

interface ToolPanelDropZoneProps {
  isCanvasDragging: boolean;
  children: ReactNode;
}

/**
 * Must be rendered as a CHILD of <DndContext> so that useDroppable can find
 * the dnd-kit context. Calling useDroppable in the same component that renders
 * DndContext would look for a provider *above* it in the tree — which doesn't
 * exist — and the droppable would never be registered.
 */
const ToolPanelDropZone = ({ isCanvasDragging, children }: ToolPanelDropZoneProps) => {
  const { token } = theme.useToken();
  const { setNodeRef, isOver } = useDroppable({ id: TOOL_PANEL_DROP_ID });

  const deleteMode = isCanvasDragging && isOver;

  return (
    <div
      ref={setNodeRef}
      style={{
        width: 420,
        minWidth: 420,
        height: '100%',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Card
        style={{
          flex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          borderRadius: 0,
          boxShadow: 'none',
          borderTop: 'none',
          borderBottom: 'none',
          borderLeft: 'none',
          borderRight: `1px solid ${deleteMode ? token.colorError : token.colorBorderSecondary}`,
          background: deleteMode ? token.colorErrorBg : token.colorBgContainer,
          transition: 'background 0.15s ease, border-color 0.15s ease',
        }}
        styles={{
          body: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: deleteMode ? 'hidden' : 'auto',
            padding: 0,
          },
        }}
      >
        {deleteMode ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '24px 32px',
              textAlign: 'center',
            }}
          >
            <Typography.Text
              style={{
                color: token.colorError,
              }}
            >
              Перенесите в область, чтобы удалить поле
            </Typography.Text>
          </div>
        ) : (
          children
        )}
      </Card>
    </div>
  );
};

// ─── Field helpers ────────────────────────────────────────────────────────────

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

// ─── FormEditor ───────────────────────────────────────────────────────────────

export const FormEditor = ({
  breadcrumbLabel,
  pageTitle,
  saveButtonLabel = 'Сохранить',
  initialTitle = '',
  initialFields = [],
  onSave,
  onBack,
}: FormEditorProps) => {
  const { token } = theme.useToken();

  const [formTitle, setFormTitle] = useState<string>(initialTitle);
  const [fields, setFields] = useState<FormFieldInstance[]>(initialFields);
  const [activeDrag, setActiveDrag] = useState<ActiveDragInfo>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const isCanvasDragging = activeDrag?.source === 'canvas';

  // ── Top-level field mutation ──────────────────────────────────────────────────
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

  // ── Group child mutation ──────────────────────────────────────────────────────
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

  // ── Drag start ───────────────────────────────────────────────────────────────
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined;
    if (!data) return;

    setActiveDrag(
      data.source === 'panel'
        ? { source: 'panel', label: data.label }
        : { source: 'canvas', fieldId: String(event.active.id) },
    );
  }, []);

  // ── Drag end ─────────────────────────────────────────────────────────────────
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDrag(null);

    const { active, over } = event;
    if (!over) return;

    const data = active.data.current as DragData | undefined;
    if (!data) return;

    const overId = String(over.id);
    const activeId = String(active.id);

    // Panel → canvas drop
    if (data.source === 'panel') {
      const fieldType = PANEL_KEY_TO_FIELD_TYPE[data.fieldKey];
      if (!fieldType) return;

      const newField = createField(fieldType);

      if (isGroupCanvas(overId)) {
        if (fieldType === 'group') return;
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

      setFields((prev) => {
        const parentGroup = prev.find(
          (f) => f.type === 'group' && f.children?.some((c) => c.id === overId),
        );

        if (parentGroup) {
          if (fieldType === 'group') return prev;
          return prev.map((f) => {
            if (f.id !== parentGroup.id || !f.children) return f;
            const idx = f.children.findIndex((c) => c.id === overId);
            const next = [...f.children];
            next.splice(idx + 1, 0, newField);
            return { ...f, children: next };
          });
        }

        const overIndex = prev.findIndex((f) => f.id === overId);
        if (overIndex !== -1) {
          const next = [...prev];
          next.splice(overIndex + 1, 0, newField);
          return next;
        }

        return [...prev, newField];
      });
      return;
    }

    // Canvas → tool panel (delete)
    if (data.source === 'canvas' && overId === TOOL_PANEL_DROP_ID) {
      setFields((prev) => {
        if (prev.some((f) => f.id === activeId)) {
          return prev.filter((f) => f.id !== activeId);
        }
        return prev.map((f) => {
          if (f.type === 'group' && f.children?.some((c) => c.id === activeId)) {
            return { ...f, children: f.children.filter((c) => c.id !== activeId) };
          }
          return f;
        });
      });
      return;
    }

    // Canvas → canvas reorder
    if (data.source === 'canvas') {
      setFields((prev) => {
        const activeParent = prev.find(
          (f) => f.type === 'group' && f.children?.some((c) => c.id === activeId),
        );
        const overParent = prev.find(
          (f) => f.type === 'group' && f.children?.some((c) => c.id === overId),
        );

        if (activeParent && activeParent.id === overParent?.id) {
          return prev.map((f) => {
            if (f.id !== activeParent.id || !f.children) return f;
            const oldIdx = f.children.findIndex((c) => c.id === activeId);
            const newIdx = f.children.findIndex((c) => c.id === overId);
            if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return f;
            return { ...f, children: arrayMove(f.children, oldIdx, newIdx) };
          });
        }

        if (!activeParent && !overParent) {
          const oldIndex = prev.findIndex((f) => f.id === activeId);
          const newIndex = prev.findIndex((f) => f.id === overId);
          if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;
          return arrayMove(prev, oldIndex, newIndex);
        }

        return prev;
      });
    }
  }, []);

  // ── DragOverlay renderer ──────────────────────────────────────────────────────
  const renderOverlay = () => {
    if (!activeDrag) return null;

    if (activeDrag.source === 'panel') {
      return <PanelDragChip label={activeDrag.label} />;
    }

    const topLevel = fields.find((f) => f.id === activeDrag.fieldId);
    if (topLevel) return <CanvasFieldOverlay field={topLevel} />;

    for (const f of fields) {
      if (f.type === 'group' && f.children) {
        const child = f.children.find((c) => c.id === activeDrag.fieldId);
        if (child) return <CanvasFieldOverlay field={child} />;
      }
    }

    return null;
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!formTitle.trim()) {
      notification.warning({
        message: 'Необходимо указать название',
        description: 'Введите название формы перед сохранением.',
        placement: 'topRight',
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formTitle.trim(), fields);
    } catch (err) {
      notification.error({
        message: 'Ошибка при сохранении',
        description:
          err instanceof Error ? err.message : 'Не удалось сохранить форму.',
        placement: 'topRight',
      });
    } finally {
      setIsSaving(false);
    }
  }, [formTitle, fields, onSave]);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          position: 'relative',
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
              { title: <a onClick={onBack}>Формы</a> },
              { title: breadcrumbLabel },
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
                onClick={onBack}
                style={{ padding: '0 4px' }}
                aria-label="Вернуться к списку форм"
              />
              <Title level={4} style={{ margin: 0 }}>
                {pageTitle}
              </Title>
            </Space>

            <Space>
              <Button
                icon={<EyeOutlined />}
                onClick={() => setIsPreviewOpen(true)}
                disabled={isSaving}
              >
                Предпросмотр
              </Button>
              <Button
                type="primary"
                onClick={handleSave}
                loading={isSaving}
                disabled={isSaving}
              >
                {saveButtonLabel}
              </Button>
            </Space>
          </div>
        </div>

        {/* ── Two-panel layout ── */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Left — Tool Panel (also a drop zone: drag canvas → here to delete) */}
          <ToolPanelDropZone isCanvasDragging={isCanvasDragging}>
            <ToolPanel />
          </ToolPanelDropZone>

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

      {/* ── Full-content-area preview overlay ── */}
      {isPreviewOpen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            background: token.colorBgLayout,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: token.colorBgContainer,
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
              padding: '12px 24px 16px',
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Space align="center" size={12}>
              <Title level={4} style={{ margin: 0 }}>
                Предпросмотр формы
              </Title>
              <Tag color="blue" style={{ fontWeight: 400 }}>
                Только просмотр
              </Tag>
            </Space>
            <Button onClick={() => setIsPreviewOpen(false)}>Закрыть</Button>
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              padding: 24,
            }}
          >
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              {formTitle && (
                <Title level={4} style={{ marginBottom: 24 }}>
                  {formTitle}
                </Title>
              )}

              {fields.length > 0 ? (
                <Form layout="vertical" requiredMark="optional">
                  {fields.map((field) => (
                    <PreviewField key={field.id} field={field} />
                  ))}
                  <Divider style={{ marginTop: 8 }} />
                  <Button type="primary" icon={<SendOutlined />} disabled block>
                    Отправить
                  </Button>
                </Form>
              ) : (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <Typography.Text type="secondary">
                    В форму не добавлено ни одного поля.
                  </Typography.Text>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
};
