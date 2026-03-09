import { useState } from 'react';
import { Alert, App, Button, Card, Flex, Form, Input, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { signOut, updatePassword } from '../shared/api/auth.api';

interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

const mapResetError = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'Неожиданная ошибка. Попробуйте ещё раз.';
  }
  return error.message;
};

export const ResetPasswordPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const { message } = App.useApp();

  const navigate = useNavigate();

  const handleSubmit = async (values: ResetPasswordFormValues) => {
    setIsSubmitting(true);
    setErrorText(null);

    try {
      await updatePassword(values.password);
      await signOut();
      message.success('Пароль обновлён. Войдите, используя новый пароль.');
      navigate('/auth', { replace: true });
    } catch (error) {
      setErrorText(mapResetError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Flex
      align="center"
      justify="center"
      style={{ minHeight: '100vh', padding: 16 }}
      vertical
      gap={16}
    >
      <Typography.Title level={3} style={{ margin: 0 }}>
        Сервис Деск
      </Typography.Title>

      <Card style={{ width: '100%', maxWidth: 420 }}>
        <Typography.Title level={4} style={{ marginTop: 0 }}>
          Сбросить пароль
        </Typography.Title>

        {errorText ? (
          <Alert type="error" showIcon message={errorText} style={{ marginBottom: 16 }} />
        ) : null}

        <Form<ResetPasswordFormValues> layout="vertical" onFinish={handleSubmit} disabled={isSubmitting}>
          <Form.Item
            name="password"
            label="Новый пароль"
            rules={[
              { required: true, message: 'Пароль обязателен' },
              { min: 8, message: 'Пароль должен содержать не менее 8 символов' },
            ]}
          >
            <Input.Password autoComplete="new-password" placeholder="Введите новый пароль" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Подтвердите пароль"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Подтвердите пароль' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Пароли не совпадают'));
                },
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" placeholder="Повторите новый пароль" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={isSubmitting}>
            Обновить пароль
          </Button>
        </Form>
      </Card>

      <Typography.Text type="secondary">
        <Link to="/auth">Вернуться ко входу</Link>
      </Typography.Text>
    </Flex>
  );
};
