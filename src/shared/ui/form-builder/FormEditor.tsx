import { useCallback, useRef, useState, type ReactNode } from 'react';
import {
  Breadcrumb,
  Button,
  Card,
  Form,
  Input,
  Popconfirm,
  Space,
  Tabs,
  Tooltip,
  Typography,
  notification,
  theme,
} from 'antd';
import { ArrowLeftOutlined, EyeOutlined } from '@ant-design/icons';
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
  type FormPageInstance,
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
  /** Pre-filled pages (edit mode). If omitted, a single empty page is created. */
  initialPages?: FormPageInstance[];
  /**
   * Backward-compatibility: pre-filled flat field list (legacy shape).
   * If provided and initialPages is empty, wrapped into a default page.
   */
  initialFields?: FormFieldInstance[];
  /**
   * Called when the user clicks Save.
   * Should perform the API call and navigate away on success.
   * If it throws, FormEditor shows an error notification.
   */
  onSave: (title: string, pages: FormPageInstance[]) => Promise<void>;
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
  width: number;
  onResizeStart: (event: React.MouseEvent<HTMLDivElement>) => void;
  children: ReactNode;
}

/**
 * Must be rendered as a CHILD of <DndContext> so that useDroppable can find
 * the dnd-kit context. Calling useDroppable in the same component that renders
 * DndContext would look for a provider *above* it in the tree — which doesn't
 * exist — and the droppable would never be registered.
 */
const ToolPanelDropZone = ({
  isCanvasDragging,
  width,
  onResizeStart,
  children,
}: ToolPanelDropZoneProps) => {
  const { token } = theme.useToken();
  const { setNodeRef, isOver } = useDroppable({ id: TOOL_PANEL_DROP_ID });

  const deleteMode = isCanvasDragging && isOver;

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'relative',
        width,
        minWidth: width,
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
          borderRight: `1px solid ${token.colorBorderSecondary}`,
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
      <div
        onMouseDown={onResizeStart}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: 3,
          cursor: 'col-resize',
          background: 'transparent',
        }}
      />
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

// ─── Inline preview panel (multi-page) ───────────────────────────────────────

const collectFieldIds = (fields: FormFieldInstance[]): string[] => {
  const ids: string[] = [];
  for (const field of fields) {
    if (field.type === 'group' && field.children && field.children.length > 0) {
      ids.push(...collectFieldIds(field.children));
    } else {
      ids.push(field.id);
    }
  }
  return ids;
};

interface InlinePreviewProps {
  formTitle: string;
  pages: FormPageInstance[];
}

const InlinePreview = ({ formTitle, pages }: InlinePreviewProps) => {
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const [pageIndex, setPageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const hasPages = pages.length > 0;
  const currentPage = hasPages ? pages[Math.min(pageIndex, pages.length - 1)] : null;
  const isFirst = pageIndex === 0;
  const isLast = hasPages && pageIndex === pages.length - 1;

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = async () => {
    if (!currentPage) return;
    const ids = collectFieldIds(currentPage.fields);
    try {
      await form.validateFields(ids);
      setPageIndex((idx) => Math.min(idx + 1, pages.length - 1));
      scrollToTop();
    } catch {
      // Validation errors are shown inline
    }
  };

  const handleBack = () => {
    setPageIndex((idx) => Math.max(0, idx - 1));
    scrollToTop();
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      setIsSubmitting(true);
      await new Promise<void>((resolve) => setTimeout(resolve, 500));
      notification.success({
        message: 'Форма отправлена',
        description: 'Это предпросмотр — данные не сохраняются.',
        placement: 'topRight',
      });
      form.resetFields();
      setPageIndex(0);
      scrollToTop();
    } catch {
      // Validation errors are shown inline
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        background: token.colorBgLayout,
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {formTitle && (
          <Title level={4} style={{ marginBottom: 24 }}>
            {formTitle}
          </Title>
        )}

        {hasPages && currentPage && currentPage.fields.length > 0 ? (
          <Form form={form} layout="vertical" requiredMark={false}>
            {currentPage.fields.map((field) => (
              <PreviewField key={field.id} field={field} />
            ))}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
                gap: 10,
                marginTop: 16,
              }}
            >
              {!isFirst && (
                <Button onClick={handleBack}>Назад</Button>
              )}
              {!isLast && (
                <Button type="primary" onClick={handleNext}>
                  Далее
                </Button>
              )}
              {isLast && (
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  loading={isSubmitting}
                >
                  Отправить
                </Button>
              )}
            </div>
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
  );
};

// ─── FormEditor ───────────────────────────────────────────────────────────────

export const FormEditor = ({
  breadcrumbLabel,
  pageTitle,
  saveButtonLabel = 'Сохранить',
  initialTitle = '',
  initialPages,
  initialFields = [],
  onSave,
  onBack,
}: FormEditorProps) => {
  const { token } = theme.useToken();

  const [formTitle, setFormTitle] = useState<string>(initialTitle);
  const resolvedInitialPages: FormPageInstance[] =
    initialPages && initialPages.length
      ? initialPages
      : [
          {
            id: crypto.randomUUID(),
            title: 'Страница 1',
            fields: initialFields,
          },
        ];

  const [pages, setPages] = useState<FormPageInstance[]>(resolvedInitialPages);
  const [activePageId, setActivePageId] = useState<string>(
    resolvedInitialPages[0]?.id ?? crypto.randomUUID(),
  );
  const [toolboxWidth, setToolboxWidth] = useState<number>(360);
  const resizeStateRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const [activeDrag, setActiveDrag] = useState<ActiveDragInfo>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const isCanvasDragging = activeDrag?.source === 'canvas';

  const handleToolboxResizeMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!resizeStateRef.current) return;
      const { startX, startWidth } = resizeStateRef.current;
      const delta = event.clientX - startX;
      const nextWidth = Math.min(Math.max(startWidth + delta, 240), 600);
      setToolboxWidth(nextWidth);
    },
    [],
  );

  const handleToolboxResizeMouseUp = useCallback(() => {
    resizeStateRef.current = null;
    window.removeEventListener('mousemove', handleToolboxResizeMouseMove);
    window.removeEventListener('mouseup', handleToolboxResizeMouseUp);
  }, [handleToolboxResizeMouseMove]);

  const handleToolboxResizeStart = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      resizeStateRef.current = { startX: event.clientX, startWidth: toolboxWidth };
      window.addEventListener('mousemove', handleToolboxResizeMouseMove);
      window.addEventListener('mouseup', handleToolboxResizeMouseUp);
    },
    [toolboxWidth, handleToolboxResizeMouseMove, handleToolboxResizeMouseUp],
  );

  const activePage: FormPageInstance | undefined =
    pages.find((p) => p.id === activePageId) ?? pages[0];
  const activeFields: FormFieldInstance[] = activePage?.fields ?? [];

  const setActivePageFields = useCallback(
    (updater: (fields: FormFieldInstance[]) => FormFieldInstance[]) => {
      setPages((prevPages) =>
        prevPages.map((page) =>
          page.id === activePageId ? { ...page, fields: updater(page.fields) } : page,
        ),
      );
    },
    [activePageId],
  );

  // ── Top-level field mutation ──────────────────────────────────────────────────
  const handleFieldChange = useCallback(
    (id: string, changes: Partial<FormFieldInstance>) => {
      setActivePageFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...changes } : f)),
      );
    },
    [setActivePageFields],
  );

  const handleFieldDelete = useCallback((id: string) => {
    setActivePageFields((prev) => prev.filter((f) => f.id !== id));
  }, [setActivePageFields]);

  // ── Group child mutation ──────────────────────────────────────────────────────
  const handleGroupChildChange = useCallback(
    (groupId: string, childId: string, changes: Partial<FormFieldInstance>) => {
      setActivePageFields((prev) =>
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
    [setActivePageFields],
  );

  const handleGroupChildDelete = useCallback(
    (groupId: string, childId: string) => {
      setActivePageFields((prev) =>
        prev.map((f) =>
          f.id === groupId && f.children
            ? { ...f, children: f.children.filter((c) => c.id !== childId) }
            : f,
        ),
      );
    },
    [setActivePageFields],
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
        setActivePageFields((prev) =>
          prev.map((f) =>
            f.id === groupId
              ? { ...f, children: [...(f.children ?? []), newField] }
              : f,
          ),
        );
        return;
      }

      setActivePageFields((prev) => {
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
      setActivePageFields((prev) => {
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
      setActivePageFields((prev) => {
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
  }, [setActivePageFields]);

  // ── DragOverlay renderer ──────────────────────────────────────────────────────
  const renderOverlay = () => {
    if (!activeDrag) return null;

    if (activeDrag.source === 'panel') {
      return <PanelDragChip label={activeDrag.label} />;
    }

    const topLevel = activeFields.find((f) => f.id === activeDrag.fieldId);
    if (topLevel) return <CanvasFieldOverlay field={topLevel} />;

    for (const f of activeFields) {
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
      await onSave(formTitle.trim(), pages);
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
  }, [formTitle, pages, onSave]);

  const handleAddPage = () => {
    const newPage: FormPageInstance = {
      id: crypto.randomUUID(),
      title: `Страница ${pages.length + 1}`,
      fields: [],
    };
    setPages((prev) => [...prev, newPage]);
    setActivePageId(newPage.id);
  };

  const handleDeletePage = (pageId: string) => {
    setPages((prev) => {
      if (prev.length <= 1) return prev;
      const index = prev.findIndex((p) => p.id === pageId);
      if (index === -1) return prev;
      const next = prev.filter((p) => p.id !== pageId);
      if (pageId === activePageId && next.length > 0) {
        const newIndex = index > 0 ? index - 1 : 0;
        setActivePageId(next[newIndex].id);
      }
      return next;
    });
  };

  const handleTabEdit = (targetKey: string, action: 'add' | 'remove') => {
    if (action === 'add') {
      handleAddPage();
      return;
    }
    if (action === 'remove') {
      if (pages.length <= 1) return;
      handleDeletePage(targetKey);
    }
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
              <Tooltip title={isPreviewMode ? 'К редактированию' : 'Предпросмотр'}>
                <Button
                  type={isPreviewMode ? 'primary' : 'default'}
                  ghost={isPreviewMode}
                  icon={<EyeOutlined />}
                  onClick={() => setIsPreviewMode((prev) => !prev)}
                  disabled={isSaving}
                />
              </Tooltip>
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

        {/* ── Content area: builder or inline preview ── */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {isPreviewMode ? (
            <InlinePreview formTitle={formTitle} pages={pages} />
          ) : (
            <>
              {/* Left — Tool Panel (also a drop zone: drag canvas → here to delete) */}
              <ToolPanelDropZone
                isCanvasDragging={isCanvasDragging}
                width={toolboxWidth}
                onResizeStart={handleToolboxResizeStart}
              >
                <ToolPanel isCompact={toolboxWidth < 320} />
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
                <Tabs
                  type="line"
                  activeKey={activePageId}
                  onChange={(key) => setActivePageId(key)}
                  onEdit={(e, action) => {
                    const key = typeof e === 'string' ? e : '';
                    if (key) {
                      handleTabEdit(key, action as 'add' | 'remove');
                    }
                  }}
                  hideAdd
                  tabBarGutter={12}
                  tabBarStyle={{ marginBottom: 0 }}
                  items={pages.map((page, index) => ({
                    key: page.id,
                    label: (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span>Страница {index + 1}</span>
                        {pages.length > 1 && (
                          <Popconfirm
                            title="Удалить страницу"
                            description="Вы уверены, что хотите удалить страницу? Это действие нельзя отменить."
                            okText="Удалить"
                            cancelText="Отменить"
                            onConfirm={() => handleTabEdit(page.id, 'remove')}
                          >
                            <Button
                              type="text"
                              size="small"
                              shape="circle"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                padding: 0,
                                width: 20,
                                height: 20,
                                lineHeight: '20px',
                                minWidth: 0,
                              }}
                            >
                              ×
                            </Button>
                          </Popconfirm>
                        )}
                      </div>
                    ),
                  }))}
                  tabBarExtraContent={
                    <span
                      style={{
                        color: token.colorPrimary,
                        cursor: 'pointer',
                        marginLeft: 8,
                        userSelect: 'none',
                        fontSize: 12,
                      }}
                      onClick={handleAddPage}
                    >
                      Добавить страницу
                    </span>
                  }
                />
                <div style={{ marginBottom: token.margin }} />
                <FormCanvas
                  fields={activeFields}
                  onFieldChange={handleFieldChange}
                  onFieldDelete={handleFieldDelete}
                  onGroupChildChange={handleGroupChildChange}
                  onGroupChildDelete={handleGroupChildDelete}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>{renderOverlay()}</DragOverlay>
    </DndContext>
  );
};
