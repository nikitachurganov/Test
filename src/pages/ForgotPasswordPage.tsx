import { useState } from 'react';
import { Alert, Button, Card, Flex, Form, Input, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../shared/api/auth.api';

interface ForgotPasswordFormValues {
  email: string;
}

const mapResetError = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'Unexpected error. Please try again.';
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
      setSuccessText('If an account exists for this email, a reset link has been sent.');
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
        Service Desk
      </Typography.Title>

      <Card style={{ width: '100%', maxWidth: 420 }}>
        <Typography.Title level={4} style={{ marginTop: 0 }}>
          Forgot password
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          Enter your email and we will send a password reset link.
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
            label="Email"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Enter a valid email' },
            ]}
          >
            <Input autoComplete="email" placeholder="name@example.com" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={isSubmitting}>
            Send reset link
          </Button>
        </Form>
      </Card>

      <Typography.Text type="secondary">
        Remembered your password? <Link to="/auth">Back to sign in</Link>
      </Typography.Text>
    </Flex>
  );
};

