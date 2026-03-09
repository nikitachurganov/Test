import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  App,
  Breadcrumb,
  Button,
  Form,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Typography,
  theme,
} from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import {
  deleteForm,
  getFormById,
  pagesPayloadToInstances,
  type FormResponse,
} from '../shared/api/forms.api';
import { buildDisplayName } from '../shared/utils/userName';
import { PreviewField } from '../shared/ui/form-builder/FormPreviewModal';
import type { FormFieldInstance, FormPageInstance } from '../shared/types/form-builder.types';

const { Title, Text } = Typography;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export const FormViewPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { token } = theme.useToken();
  const { notification } = App.useApp();

  const [formData, setFormData] = useState<FormResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm();
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getFormById(id)
      .then((data) => {
        setFormData(data);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить форму');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Convert API payload pages to FormPageInstance once per load
  const pageInstances = useMemo<FormPageInstance[]>(
    () => (formData?.pages ? pagesPayloadToInstances(formData.pages) : []),
    [formData],
  );

  const hasPages = pageInstances.length > 0;
  const currentPage = hasPages
    ? pageInstances[Math.min(pageIndex, pageInstances.length - 1)]
    : null;
  const isFirst = pageIndex === 0;
  const isLast = hasPages && pageIndex === pageInstances.length - 1;

  useEffect(() => {
    // Reset to first page when a new form is loaded
    setPageIndex(0);
    form.resetFields();
  }, [formData, form]);

  const scrollToTop = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = async () => {
    if (!currentPage) return;
    const ids = collectFieldIds(currentPage.fields);
    try {
      await form.validateFields(ids);
      setPageIndex((idx) => Math.min(idx + 1, pageInstances.length - 1));
      scrollToTop();
    } catch {
      // Validation errors are shown inline
    }
  };

  const handlePrevPage = () => {
    setPageIndex((idx) => Math.max(0, idx - 1));
    scrollToTop();
  };

  const handleSubmitForm = async () => {
    try {
      await form.validateFields(); // validate all pages
      setIsSubmitting(true);
      await new Promise<void>((resolve) => setTimeout(resolve, 500));
      notification.success({
        title: 'Форма заполнена',
        description: 'Это публичный просмотр — данные не отправляются.',
        placement: 'topRight',
      });
    } catch {
      // Validation errors are shown inline
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = useCallback(async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteForm(id);
      notification.success({ title: 'Форма удалена' });
      navigate('/forms');
    } catch (err) {
      notification.error({
        title: 'Ошибка удаления',
        description: err instanceof Error ? err.message : 'Попробуйте ещё раз.',
      });
      setIsDeleting(false);
    }
  }, [id, navigate]);

  const pageTitle = loading ? 'Загрузка…' : (formData?.name ?? 'Форма');
  const breadcrumbCurrent = loading ? 'Загрузка…' : (error ? 'Не найдено' : (formData?.name ?? 'Форма'));

  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}
    >
      {/* ── Header ── */}
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
            { title: breadcrumbCurrent },
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
              aria-label="Вернуться к реестру форм"
            />
            <Title level={4} style={{ margin: 0 }}>
              {pageTitle}
            </Title>
            {!loading && formData && (
              <Tag color="processing" style={{ fontWeight: 400 }}>
                Просмотр
              </Tag>
            )}
          </Space>

          {formData && (
            <Space>
              <Button
                icon={<EditOutlined />}
                onClick={() => navigate(`/forms/${id}/edit`)}
              >
                Изменить
              </Button>

              <Popconfirm
                title="Удалить форму?"
                description="Это действие нельзя отменить."
                okText="Удалить"
                cancelText="Отмена"
                okButtonProps={{ danger: true }}
                onConfirm={handleDelete}
              >
                <Button danger loading={isDeleting} icon={<DeleteOutlined />}>
                  Удалить
                </Button>
              </Popconfirm>
            </Space>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          background: token.colorBgLayout,
        }}
        ref={contentRef}
      >
        {loading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '60vh',
            }}
          >
            <Spin size="large" />
          </div>
        ) : error ? (
          <div style={{ padding: 24 }}>
            <Alert type="error" showIcon message="Ошибка загрузки" description={error} />
          </div>
        ) : (
          <div style={{ maxWidth: 680, margin: '0 auto', padding: 24 }}>
            {formData?.description && (
              <Text
                type="secondary"
                style={{ display: 'block', marginBottom: 24, fontSize: token.fontSizeLG }}
              >
                {formData.description}
              </Text>
            )}
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Автор: {formData?.author ? buildDisplayName(formData.author) : 'Неизвестный автор'}
            </Text>

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
                    <Button onClick={handlePrevPage}>Назад</Button>
                  )}
                  {!isLast && (
                    <Button type="primary" onClick={handleNextPage}>
                      Далее
                    </Button>
                  )}
                  {isLast && (
                    <Button
                      type="primary"
                      onClick={handleSubmitForm}
                      loading={isSubmitting}
                    >
                      Отправить
                    </Button>
                  )}
                </div>
              </Form>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <Text type="secondary">В форме нет полей.</Text>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
