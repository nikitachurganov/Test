import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Flex, Form, Input, Spin, Typography, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { signOut, updatePassword } from '../shared/api/auth.api';
import { supabase } from '../shared/lib/supabase';

interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

const mapResetError = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'Unexpected error. Please try again.';
  }
  return error.message;
};

const hasRecoveryParamsInHash = (): boolean => {
  const rawHash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(rawHash);
  return hashParams.get('type') === 'recovery' && Boolean(hashParams.get('access_token'));
};

export const ResetPasswordPage = () => {
  const [isCheckingLink, setIsCheckingLink] = useState(true);
  const [isRecoveryReady, setIsRecoveryReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const navigate = useNavigate();
  const hasRecoveryParams = useMemo(hasRecoveryParamsInHash, []);

  useEffect(() => {
    let isMounted = true;

    const initializeRecovery = async () => {
      if (!hasRecoveryParams) {
        if (isMounted) {
          setErrorText('Recovery link is invalid or missing. Request a new password reset email.');
          setIsCheckingLink(false);
        }
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) {
        return;
      }

      if (error || !data.session) {
        setErrorText('Recovery link is invalid or expired. Please request a new one.');
        setIsRecoveryReady(false);
      } else {
        setErrorText(null);
        setIsRecoveryReady(true);
      }
      setIsCheckingLink(false);
    };

    void initializeRecovery();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) {
        return;
      }

      if (event === 'PASSWORD_RECOVERY' && session) {
        setErrorText(null);
        setIsRecoveryReady(true);
        setIsCheckingLink(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [hasRecoveryParams]);

  const handleSubmit = async (values: ResetPasswordFormValues) => {
    setIsSubmitting(true);
    setErrorText(null);

    try {
      await updatePassword(values.password);
      await signOut();
      message.success('Password updated. Please sign in with your new password.');
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
        Service Desk
      </Typography.Title>

      <Card style={{ width: '100%', maxWidth: 420 }}>
        <Typography.Title level={4} style={{ marginTop: 0 }}>
          Reset password
        </Typography.Title>

        {isCheckingLink ? (
          <Flex align="center" gap={12}>
            <Spin size="small" />
            <Typography.Text type="secondary">Validating recovery link...</Typography.Text>
          </Flex>
        ) : null}

        {!isCheckingLink && errorText ? (
          <Alert type="error" showIcon message={errorText} style={{ marginBottom: 16 }} />
        ) : null}

        {!isCheckingLink && isRecoveryReady ? (
          <Form<ResetPasswordFormValues> layout="vertical" onFinish={handleSubmit} disabled={isSubmitting}>
            <Form.Item
              name="password"
              label="New password"
              rules={[
                { required: true, message: 'Password is required' },
                { min: 8, message: 'Password must be at least 8 characters' },
              ]}
            >
              <Input.Password autoComplete="new-password" placeholder="Enter new password" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm password"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm the password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password autoComplete="new-password" placeholder="Repeat new password" />
            </Form.Item>

            <Button type="primary" htmlType="submit" block loading={isSubmitting}>
              Update password
            </Button>
          </Form>
        ) : null}
      </Card>

      <Typography.Text type="secondary">
        Back to <Link to="/auth">sign in</Link>
      </Typography.Text>
    </Flex>
  );
};

