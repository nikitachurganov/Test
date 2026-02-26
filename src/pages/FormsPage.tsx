import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Popconfirm, Space, Table, notification } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useFormsStore } from '../shared/store/forms.store';
import type { FormSchema } from '../shared/types/form-schema.types';

export const FormsPage = () => {
  const [notificationApi, contextHolder] = notification.useNotification();
  const navigate = useNavigate();
  const forms = useFormsStore((state) => state.forms);
  const deleteForm = useFormsStore((state) => state.deleteForm);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const [tableScrollY, setTableScrollY] = useState(0);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) {
      return;
    }

    const updateHeight = () => {
      setTableScrollY(container.clientHeight);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      deleteForm(id);
      notificationApi.success({
        message: 'Форма удалена',
        description: 'Форма была успешно удалена.',
      });
    },
    [deleteForm, notificationApi],
  );

  const columns = useMemo<TableProps<FormSchema>['columns']>(
    () => [
      {
        title: 'Название',
        dataIndex: 'title',
        key: 'title',
      },
      {
        title: 'Описание',
        dataIndex: 'description',
        key: 'description',
      },
      {
        title: 'Дата создания',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (createdAt: string) => new Date(createdAt).toLocaleString('ru-RU'),
      },
      {
        title: 'Действия',
        key: 'actions',
        render: (_: unknown, record: FormSchema) => (
          <Space>
            <Button onClick={() => navigate(`/forms/${record.id}/edit`)}>
              Редактировать
            </Button>
            <Popconfirm
              title="Удалить форму?"
              description="Это действие нельзя отменить."
              okText="Удалить"
              cancelText="Отмена"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button danger>Удалить</Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [handleDelete, navigate],
  );

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', minHeight: 0 }}>
      {contextHolder}
      <Card
        title="Формы"
        extra={
          <Button type="primary" onClick={() => navigate('/forms/create')}>
            Создать форму
          </Button>
        }
        style={{
          display: 'flex',
          flex: 1,
          height: '100%',
          minHeight: 0,
          flexDirection: 'column',
        }}
        styles={{
          body: {
            display: 'flex',
            flex: 1,
            minHeight: 0,
            flexDirection: 'column',
          },
        }}
      >
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <div
            ref={tableContainerRef}
            style={{ display: 'flex', flex: 1, minHeight: 0 }}
          >
            <Table<FormSchema>
              rowKey="id"
              columns={columns}
              dataSource={forms}
              pagination={false}
              scroll={{ y: tableScrollY }}
              style={{ width: '100%', flex: 1, minHeight: 0 }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
