import { Button, Drawer, Form, Input, Select, Space, notification } from 'antd';
import { useRequestsStore } from '../store/requests.store';
import type { RequestStatus } from '../types/request.types';

interface CreateRequestDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface CreateRequestFormValues {
  title: string;
  description: string;
  status: RequestStatus;
}

const statusOptions: { value: RequestStatus; label: string }[] = [
  { value: 'new', label: 'Новая' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'done', label: 'Завершена' },
];

export const CreateRequestDrawer = ({ open, onClose }: CreateRequestDrawerProps) => {
  const [notificationApi, contextHolder] = notification.useNotification();
  const [form] = Form.useForm<CreateRequestFormValues>();
  const addRequest = useRequestsStore((state) => state.addRequest);

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleFinish = (values: CreateRequestFormValues) => {
    addRequest(values);

    notificationApi.success({
      message: 'Заявка создана',
      description: 'Новая заявка успешно добавлена в реестр.',
    });

    handleClose();
  };

  return (
    <>
      {contextHolder}
      <Drawer
        title="Создание заявки"
        placement="right"
        width={480}
        open={open}
        onClose={handleClose}
        destroyOnClose
        footer={
          <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
            <Button onClick={handleClose}>Отмена</Button>
            <Button type="primary" onClick={() => form.submit()}>
              Сохранить
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: 'new' }}
          onFinish={handleFinish}
        >
          <Form.Item<CreateRequestFormValues>
            label="Название"
            name="title"
            rules={[{ required: true, message: 'Введите название заявки' }]}
          >
            <Input placeholder="Например: Ошибка в отчёте" />
          </Form.Item>

          <Form.Item<CreateRequestFormValues>
            label="Описание"
            name="description"
            rules={[{ required: true, message: 'Введите описание заявки' }]}
          >
            <Input.TextArea rows={4} placeholder="Опишите суть заявки" />
          </Form.Item>

          <Form.Item<CreateRequestFormValues> label="Статус" name="status">
            <Select options={statusOptions} />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};
