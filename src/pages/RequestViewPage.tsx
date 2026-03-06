import { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Breadcrumb,
  Button,
  Descriptions,
  Image,
  Popconfirm,
  Spin,
  Tabs,
  Typography,
  notification,
  theme,
} from 'antd';
import { ArrowLeftOutlined, FileOutlined, DownloadOutlined } from '@ant-design/icons';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getRequestWithForm, type RequestWithForm } from '../services/requestService';
import { deleteRequest } from '../shared/api/requests.api';
import { formatFieldValue } from '../shared/utils/formatFieldValue';
import type { Field } from '../types/form';

interface StoredFileMeta {
  id?: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  file_url: string;
}

const { Title, Text } = Typography;

type RequestDetailsState = {
  data: RequestWithForm | null;
  loading: boolean;
  error: string | null;
};

const pad = (n: number): string => (n < 10 ? `0${n}` : String(n));

const formatDate = (iso: string | undefined): string => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
};

export const RequestViewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const [{ data, loading, error }, setState] = useState<RequestDetailsState>({
    data: null,
    loading: true,
    error: null,
  });
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'people'>('info');

  useEffect(() => {
    if (!id) return;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const load = async () => {
      try {
        const result = await getRequestWithForm(id);
        setState({ data: result, loading: false, error: null });
      } catch (err) {
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : 'Не удалось загрузить заявку',
        });
      }
    };

    void load();
  }, [id]);

  const pageTitle = data?.request ? data.request.title : 'Загрузка заявки…';
  const formTitle = data?.form?.title ?? '—';

  if (!id) {
    return (
      <div
        style={{
          display: 'flex',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          background: token.colorBgLayout,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  const fields: Field[] = data?.form?.fields ?? [];
  const parsedData = data?.parsedData ?? {};

  const fieldIds = fields.map((f) => f.id);
  const dataKeys = Object.keys(parsedData);
  const maybeValues = (parsedData as Record<string, unknown>).values;
  const nestedValues =
    maybeValues && typeof maybeValues === 'object' && !Array.isArray(maybeValues)
      ? (maybeValues as Record<string, unknown>)
      : undefined;
  const nestedKeys = nestedValues ? Object.keys(nestedValues) : [];

  const hasDirectMatches = fieldIds.some((fieldId) => fieldId in parsedData);
  const activeDataSource = hasDirectMatches ? parsedData : (nestedValues ?? parsedData);
  const activeKeys = Object.keys(activeDataSource);
  const missingFieldIds = fieldIds.filter((fieldId) => !(fieldId in activeDataSource));
  const extraDataKeys = activeKeys.filter((key) => !fieldIds.includes(key));

  const isNonEmptyValue = (value: unknown): boolean => {
    if (value == null) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0;
    return true;
  };

  const hasMissingFilledFields = extraDataKeys.some((key) =>
    isNonEmptyValue((activeDataSource as Record<string, unknown>)[key]),
  );

  /**
   * Normalizes stored file data into a uniform metadata array.
   * Handles both new format (array of { file_name, file_url, ... }) and
   * legacy format (array of plain filename strings / single string).
   */
  const normalizeFileValues = (raw: unknown): StoredFileMeta[] => {
    if (raw == null) return [];

    const items = Array.isArray(raw) ? raw : [raw];
    const result: StoredFileMeta[] = [];

    for (const item of items) {
      if (typeof item === 'object' && item !== null && 'file_url' in item) {
        const meta = item as Record<string, unknown>;
        result.push({
          id: typeof meta.id === 'string' ? meta.id : undefined,
          file_name: String(meta.file_name ?? 'file'),
          file_type: typeof meta.file_type === 'string' ? meta.file_type : undefined,
          file_size: typeof meta.file_size === 'number' ? meta.file_size : undefined,
          file_url: String(meta.file_url),
        });
      } else if (typeof item === 'string' && item.trim()) {
        const isUrl = /^https?:\/\//.test(item) || item.startsWith('/') || item.startsWith('data:');
        result.push({
          file_name: isUrl ? item.split('/').pop() ?? item : item,
          file_url: isUrl ? item : '',
        });
      }
    }

    return result;
  };

  const formatSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  };

  const handleDelete = async () => {
    if (!data?.request) return;

    setDeleting(true);
    try {
      await deleteRequest(data.request.id);
      notification.success({ message: 'Заявка удалена' });
      navigate('/requests');
    } catch (err) {
      notification.error({
        message: 'Ошибка удаления',
        description: err instanceof Error ? err.message : 'Попробуйте ещё раз.',
      });
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!data) return;

    // Debug: verify loaded field IDs and data keys for this request
    // eslint-disable-next-line no-console
    console.log('Loaded field IDs:', fieldIds);
    // eslint-disable-next-line no-console
    console.log('REQUEST DATA KEYS:', dataKeys);
    if (nestedValues) {
      // eslint-disable-next-line no-console
      console.log('REQUEST DATA KEYS (values):', nestedKeys);
    }
    if (missingFieldIds.length > 0) {
      // eslint-disable-next-line no-console
      console.warn('Missing field IDs in request data:', missingFieldIds);
    }
    if (extraDataKeys.length > 0) {
      // eslint-disable-next-line no-console
      console.warn('Extra keys in request data:', extraDataKeys);
    }
  }, [data, fieldIds, dataKeys, nestedValues, nestedKeys, missingFieldIds, extraDataKeys]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          padding: '12px 24px 16px',
          flexShrink: 0,
        }}
      >
        {data?.request && (
          <Breadcrumb
            style={{ marginBottom: 8 }}
            items={[
              {
                title: <Link to="/requests">Заявки</Link>,
              },
              {
                title: data.request.title,
              },
            ]}
          />
        )}

        {/* Top row: back button + title + subtitle + (future) actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/requests')}
              style={{ padding: '0 4px' }}
              aria-label="Вернуться к реестру заявок"
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <Title level={4} style={{ margin: 0 }}>
                  {pageTitle}
                </Title>
                {data?.request && (
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    № {data.request.id}
                  </Text>
                )}
              </div>
            </div>
          </div>
          {/* Right side: actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {data?.request && (
              <Popconfirm
                title="Are you sure you want to delete this request?"
                okText="OK"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
                onConfirm={handleDelete}
              >
                <Button
                  danger
                  loading={deleting}
                >
                  Удалить
                </Button>
              </Popconfirm>
            )}
          </div>
        </div>

        {/* Metadata block (inside header) */}
        {data?.request && (
          <Descriptions
            column={{ xs: 1, sm: 2, md: 3 }}
            bordered={false}
            size="small"
            style={{ marginTop: 12, fontSize: 13 }}
            items={[
              {
                key: 'status',
                label: <Text type="secondary" style={{ fontSize: 13, marginRight: 8 }}>Статус</Text>,
                children: (
                  <Badge
                    status="processing"
                    text={<Text style={{ fontSize: 13 }}>Открыта</Text>}
                  />
                ),
              },
              {
                key: 'type',
                label: <Text type="secondary" style={{ fontSize: 13, marginRight: 8 }}>Тип заявки</Text>,
                children: (
                  <Text style={{ fontSize: 13 }}>
                    {data.request.form_snapshot?.title?.trim() || formTitle || '—'}
                  </Text>
                ),
              },
              {
                key: 'author',
                label: <Text type="secondary" style={{ fontSize: 13, marginRight: 8 }}>Автор</Text>,
                children: <Text style={{ fontSize: 13 }}>—</Text>,
              },
              {
                key: 'createdAt',
                label: <Text type="secondary" style={{ fontSize: 13, marginRight: 8 }}>Дата создания</Text>,
                children: (
                  <Text style={{ fontSize: 13 }}>
                    {formatDate(data.request.created_at)}
                  </Text>
                ),
              },
              {
                key: 'updatedAt',
                label: <Text type="secondary" style={{ fontSize: 13, marginRight: 8 }}>Дата изменения</Text>,
                children: (
                  <Text style={{ fontSize: 13 }}>
                    {formatDate(data.request.updated_at ?? data.request.created_at)}
                  </Text>
                ),
              },
              
            ]}
          />
        )}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          background: token.colorBgLayout,
          overflow: 'hidden',
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
          <Alert type="error" showIcon message="Ошибка загрузки" description={error} />
        ) : !data ? (
          <Alert
            type="error"
            showIcon
            message="Заявка не найдена"
            description="Проверьте корректность ссылки или вернитесь к реестру заявок."
          />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              height: '100%',
            }}
          >
            {/* Left: main request content with tabs */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                height: '100%',
              }}
            >
              <Tabs
                activeKey={activeTab}
                onChange={(key) =>
                  setActiveTab(key as 'info' | 'history' | 'people')
                }
                type="line"
                items={[
                  { key: 'info', label: 'Информация' },
                  { key: 'history', label: 'История', disabled: true },
                  { key: 'people', label: 'Люди', disabled: true },
                ]}
              />

              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflow: 'auto',
                }}
              >
                {activeTab === 'info' && (
                  <>
                    {fields.length > 0 ? (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 16,
                        }}
                      >
                        {hasMissingFilledFields && (
                          <Alert
                            type="warning"
                            showIcon
                            message="Форма была изменена после создания заявки"
                            description="Некоторые поля могут не отображаться."
                          />
                        )}
                        {/* TODO: Store form snapshot in request at creation time
                            to prevent ID mismatch when form is edited later. */}
                        {fields.map((field) => {
                          if (
                            field.type === 'file_image' ||
                            field.type === 'file_vector' ||
                            field.type === 'file_document'
                          ) return null;

                          const rawValue = activeDataSource[field.id];
                          if (rawValue === undefined) return null;

                          const formatted = formatFieldValue(field, rawValue);
                          return (
                            <div key={field.id}>
                              <Text
                                type="secondary"
                                style={{ fontSize: 12, marginBottom: 4, display: 'block' }}
                              >
                                {field.label || 'Без названия'}
                              </Text>
                              <Text style={{ fontSize: 14, fontWeight: 500 }}>
                                {formatted}
                              </Text>
                            </div>
                          );
                        })}

                        {(() => {
                          const fileFields = fields.filter(
                            (f) =>
                              f.type === 'file_image' ||
                              f.type === 'file_vector' ||
                              f.type === 'file_document',
                          );
                          const nonEmptyFileFields = fileFields.filter(
                            (f) => normalizeFileValues(activeDataSource[f.id]).length > 0,
                          );
                          if (!nonEmptyFileFields.length) return null;

                          return (
                            <div style={{ marginTop: token.marginSM }}>
                              <Title level={5} style={{ marginBottom: token.marginSM }}>
                                Файлы
                              </Title>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {nonEmptyFileFields.map((field) => {
                                  const fileMetas = normalizeFileValues(activeDataSource[field.id]);

                                  return (
                                    <div key={field.id}>
                                      <Text
                                        type="secondary"
                                        style={{ fontSize: 12, marginBottom: 8, display: 'block' }}
                                      >
                                        {field.label || 'Без названия'}
                                      </Text>

                                      {field.type === 'file_image' ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                          <Image.PreviewGroup>
                                            {fileMetas.map((meta, idx) => (
                                              <div
                                                key={meta.id ?? `${meta.file_name}-${idx}`}
                                                style={{
                                                  border: `1px solid ${token.colorBorderSecondary}`,
                                                  borderRadius: token.borderRadius,
                                                  overflow: 'hidden',
                                                  maxWidth: 300,
                                                  background: token.colorBgContainer,
                                                }}
                                              >
                                                {meta.file_url ? (
                                                  <Image
                                                    src={meta.file_url}
                                                    alt={meta.file_name}
                                                    style={{
                                                      maxWidth: 300,
                                                      maxHeight: 200,
                                                      objectFit: 'contain',
                                                      display: 'block',
                                                    }}
                                                    fallback="data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22100%22%3E%3Crect%20fill%3D%22%23f0f0f0%22%20width%3D%22200%22%20height%3D%22100%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23999%22%20font-size%3D%2214%22%3EОшибка%3C%2Ftext%3E%3C%2Fsvg%3E"
                                                  />
                                                ) : (
                                                  <div style={{ padding: 16, textAlign: 'center' }}>
                                                    <FileOutlined
                                                      style={{ fontSize: 32, color: token.colorTextQuaternary }}
                                                    />
                                                  </div>
                                                )}
                                                <div
                                                  style={{
                                                    padding: '6px 10px',
                                                    borderTop: `1px solid ${token.colorBorderSecondary}`,
                                                    fontSize: 12,
                                                    color: token.colorTextSecondary,
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                  }}
                                                >
                                                  <span
                                                    style={{
                                                      overflow: 'hidden',
                                                      textOverflow: 'ellipsis',
                                                      whiteSpace: 'nowrap',
                                                      maxWidth: '70%',
                                                    }}
                                                  >
                                                    {meta.file_name}
                                                  </span>
                                                  {meta.file_size ? <span>{formatSize(meta.file_size)}</span> : null}
                                                </div>
                                              </div>
                                            ))}
                                          </Image.PreviewGroup>
                                        </div>
                                      ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                          {fileMetas.map((meta, idx) => (
                                            <div
                                              key={meta.id ?? `${meta.file_name}-${idx}`}
                                              style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                                padding: '8px 12px',
                                                border: `1px solid ${token.colorBorderSecondary}`,
                                                borderRadius: token.borderRadius,
                                                background: token.colorBgContainer,
                                              }}
                                            >
                                              <FileOutlined
                                                style={{ fontSize: 18, color: token.colorTextSecondary }}
                                              />
                                              <div style={{ flex: 1, minWidth: 0 }}>
                                                <Text
                                                  style={{
                                                    fontSize: 14,
                                                    fontWeight: 500,
                                                    display: 'block',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                  }}
                                                >
                                                  {meta.file_name}
                                                </Text>
                                                {(meta.file_type || meta.file_size) && (
                                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {[meta.file_type, formatSize(meta.file_size)]
                                                      .filter(Boolean)
                                                      .join(' · ')}
                                                  </Text>
                                                )}
                                              </div>
                                              {meta.file_url && (
                                                <a
                                                  href={meta.file_url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  title="Скачать"
                                                >
                                                  <DownloadOutlined style={{ fontSize: 16 }} />
                                                </a>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <Text type="secondary">У связанной формы нет полей.</Text>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Right: AI suggestions panel */}
            <div
              style={{
                width: 360,
                flexShrink: 0,
                height: '100%',
              }}
            >
              <div
                style={{
                  background: token.colorBgContainer,
                  height: '100%',
                  borderLeft: `1px solid ${token.colorBorderSecondary}`,
                  padding: 16,
                }}
              >
                <Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
                  AI Suggestions
                </Title>
                <Text type="secondary">
                  Здесь позже появятся рекомендации на основе данных заявки.
                </Text>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

