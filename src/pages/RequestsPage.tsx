import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  notification,
  theme,
} from 'antd';
import type { TableProps } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import {
  deleteRequest,
  getRequests,
  type RequestResponse,
} from '../shared/api/requests.api';

const { Title } = Typography;

const statusView: Record<RequestResponse['status'], { color: string; label: string }> = {
  open: { color: 'processing', label: 'Открыта' },
  closed: { color: 'error', label: 'Закрыта' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const RequestsPage = () => {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const [requests, setRequests] = useState<RequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadRequests = useCallback(() => {
    setLoading(true);
    getRequests()
      .then((data) => {
        setRequests(data);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить заявки');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleDelete = useCallback(
    async (id: string) => {
      setDeletingId(id);
      try {
        await deleteRequest(id);
        setRequests((prev) => prev.filter((r) => r.id !== id));
        notification.success({ message: 'Заявка удалена' });
      } catch (err) {
        notification.error({
          message: 'Ошибка удаления',
          description: err instanceof Error ? err.message : 'Попробуйте ещё раз.',
        });
      } finally {
        setDeletingId(null);
      }
    },
    [],
  );

  const columns = useMemo<TableProps<RequestResponse>['columns']>(
    () => [
      {
        title: 'Название заявки',
        dataIndex: 'title',
        key: 'title',
        minWidth: 260,
        render: (_: unknown, record: RequestResponse) => (
          <Link to={`/requests/${record.id}`} style={{ fontWeight: 500 }}>
            {record.title}
          </Link>
        ),
      },
      {
        title: 'Номер заявки',
        dataIndex: 'id',
        key: 'id',
        width: 160,
      },
      {
        title: 'Дата создания',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 200,
        sorter: (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        render: (value: string) => formatDate(value),
      },
      {
        title: 'Дата изменения',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 200,
        sorter: (a, b) =>
          new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
        render: (value: string) => formatDate(value),
      },
      {
        title: 'Статус',
        dataIndex: 'status',
        key: 'status',
        width: 140,
        render: (status: RequestResponse['status']) => {
          const view = statusView[status];
          return <Tag color={view.color}>{view.label}</Tag>;
        },
      },
      {
        title: 'Действия',
        key: 'actions',
        width: 200,
        render: (_: unknown, record: RequestResponse) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              onClick={() => navigate(`/requests/${record.id}`)}
            >
              Открыть
            </Button>
            <Popconfirm
              title="Удалить заявку?"
              description="Это действие нельзя отменить."
              okText="Удалить"
              cancelText="Отмена"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record.id)}
            >
              <Button
                type="link"
                size="small"
                danger
                loading={deletingId === record.id}
              >
                Удалить
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [navigate, handleDelete, deletingId],
  );

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
          <Title level={4} style={{ margin: 0 }}>
            Реестр заявок
          </Title>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/requests/create')}
          >
            Создать заявку
          </Button>
        </div>
      </div>

      {/* ── Content ── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          padding: 24,
          background: token.colorBgLayout,
        }}
      >
        {error ? (
          <Alert
            type="error"
            showIcon
            message="Ошибка загрузки"
            description={error}
            action={
              <Button size="small" onClick={loadRequests}>
                Повторить
              </Button>
            }
          />
        ) : (
          <Table<RequestResponse>
            rowKey="id"
            loading={loading}
            dataSource={requests}
            columns={columns}
            pagination={{ pageSize: 20, showSizeChanger: true }}
            scroll={{ x: 900 }}
            locale={{ emptyText: 'Заявок пока нет. Создайте первую!' }}
          />
        )}
      </div>
    </div>
  );
};
