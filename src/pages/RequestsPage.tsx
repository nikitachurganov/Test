import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import { useRequestsStore } from '../shared/store/requests.store';
import { CreateRequestDrawer } from '../shared/ui/CreateRequestDrawer';
import type { Request } from '../shared/types/request.types';

const statusView: Record<Request['status'], { color: string; label: string }> = {
  new: { color: 'blue', label: 'Новая' },
  in_progress: { color: 'orange', label: 'В работе' },
  done: { color: 'green', label: 'Завершена' },
};

export const RequestsPage = () => {
  const requests = useRequestsStore((state) => state.requests);
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  const columns = useMemo<TableProps<Request>['columns']>(
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
        title: 'Статус',
        dataIndex: 'status',
        key: 'status',
        render: (status: Request['status']) => (
          <Tag color={statusView[status].color}>{statusView[status].label}</Tag>
        ),
      },
      {
        title: 'Дата создания',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (createdAt: string) => new Date(createdAt).toLocaleString('ru-RU'),
      },
    ],
    [],
  );

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', minHeight: 0 }}>
      <Card
        title="Реестр заявок"
        extra={
          <Button type="primary" onClick={() => setDrawerOpen(true)}>
            Добавить заявку
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
            <Table<Request>
              rowKey="id"
              columns={columns}
              dataSource={requests}
              pagination={false}
              scroll={{ y: tableScrollY }}
              style={{ width: '100%', flex: 1, minHeight: 0 }}
            />
          </div>
        </div>
      </Card>

      <CreateRequestDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
};
