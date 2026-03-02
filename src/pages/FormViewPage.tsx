import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Divider,
  Form,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Typography,
  notification,
  theme,
} from 'antd';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import {
  deleteForm,
  getFormById,
  payloadToInstance,
  type FormResponse,
} from '../shared/api/forms.api';
import { PreviewField } from '../shared/ui/form-builder/FormPreviewModal';
import type { FormFieldInstance } from '../shared/types/form-builder.types';

const { Title, Text } = Typography;

// ─── Page ─────────────────────────────────────────────────────────────────────

export const FormViewPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { token } = theme.useToken();

  const [formData, setFormData] = useState<FormResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Convert API payload fields to FormFieldInstance once per load
  const fieldInstances = useMemo<FormFieldInstance[]>(
    () => (formData?.fields ?? []).map(payloadToInstance),
    [formData],
  );

  const handleDelete = useCallback(async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteForm(id);
      notification.success({ message: 'Форма удалена' });
      navigate('/forms');
    } catch (err) {
      notification.error({
        message: 'Ошибка удаления',
        description: err instanceof Error ? err.message : 'Попробуйте ещё раз.',
      });
      setIsDeleting(false);
    }
  }, [id, navigate]);

  const pageTitle = loading ? 'Загрузка…' : (formData?.name ?? 'Форма');

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
              <Tag color="blue" style={{ fontWeight: 400 }}>
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

            {fieldInstances.length > 0 ? (
              <Form layout="vertical" requiredMark="optional">
                {fieldInstances.map((field) => (
                  <PreviewField key={field.id} field={field} />
                ))}

                <Divider style={{ marginTop: 8 }} />

                <Button type="primary" icon={<SendOutlined />} disabled block>
                  Отправить
                </Button>
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
