import { useEffect, useMemo } from 'react';
import { Button, Card, Empty, Form, Input, Space, notification } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormsStore } from '../shared/store/forms.store';

interface EditFormValues {
  title: string;
  description: string;
}

export const EditFormPage = () => {
  const [notificationApi, contextHolder] = notification.useNotification();
  const [form] = Form.useForm<EditFormValues>();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const forms = useFormsStore((state) => state.forms);
  const updateForm = useFormsStore((state) => state.updateForm);

  const formSchema = useMemo(
    () => forms.find((item) => item.id === id),
    [id, forms],
  );

  useEffect(() => {
    if (!formSchema) {
      return;
    }

    form.setFieldsValue({
      title: formSchema.title,
      description: formSchema.description,
    });
  }, [form, formSchema]);

  const handleFinish = (values: EditFormValues) => {
    if (!id) {
      return;
    }

    updateForm(id, {
      title: values.title,
      description: values.description,
    });

    notificationApi.success({
      message: 'Форма обновлена',
      description: 'Изменения формы успешно сохранены.',
    });

    navigate('/forms');
  };

  if (!formSchema) {
    return (
      <Card title="Редактирование формы">
        {contextHolder}
        <Empty description="Форма не найдена" />
        <Button style={{ marginTop: 16 }} onClick={() => navigate('/forms')}>
          Вернуться к списку
        </Button>
      </Card>
    );
  }

  return (
    <Card title="Редактирование формы">
      {contextHolder}
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item<EditFormValues>
          label="Название"
          name="title"
          rules={[{ required: true, message: 'Введите название формы' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item<EditFormValues>
          label="Описание"
          name="description"
          rules={[{ required: true, message: 'Введите описание формы' }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Space>
            <Button type="primary" onClick={() => form.submit()}>
              Сохранить
            </Button>
            <Button onClick={() => navigate('/forms')}>Отмена</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};
