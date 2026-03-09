import { useState } from 'react';
import { Alert, Button, Card, Flex, Form, Input, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../shared/api/auth.api';

interface ForgotPasswordFormValues {
  email: string;
}

const mapResetError = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'Неожиданная ошибка. Попробуйте ещё раз.';
  }
  return error.message;
};

export const ForgotPasswordPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successText, setSuccessText] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    setErrorText(null);
    setSuccessText(null);

    try {
      await requestPasswordReset(values.email.trim().toLowerCase());
      setSuccessText('Если аккаунт с этим адресом существует, ссылка для сброса пароля отправлена.');
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
          Забыли пароль
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          Введите адрес электронной почты, и мы отправим ссылку для сброса пароля.
        </Typography.Paragraph>

        {successText ? (
          <Alert
            type="success"
            showIcon
            message={successText}
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setSuccessText(null)}
          />
        ) : null}

        {errorText ? (
          <Alert
            type="error"
            showIcon
            message={errorText}
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setErrorText(null)}
          />
        ) : null}

        <Form<ForgotPasswordFormValues> layout="vertical" onFinish={handleSubmit} disabled={isSubmitting}>
          <Form.Item
            name="email"
            label="Электронная почта"
            rules={[
              { required: true, message: 'Электронная почта обязательна' },
              { type: 'email', message: 'Введите действительный адрес электронной почты' },
            ]}
          >
            <Input autoComplete="email" placeholder="name@example.com" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={isSubmitting}>
            Отправить ссылку для сброса
          </Button>
        </Form>
      </Card>

      <Typography.Text type="secondary">
        Вспомнили пароль? <Link to="/auth">Вернуться ко входу</Link>
      </Typography.Text>
    </Flex>
  );
};

