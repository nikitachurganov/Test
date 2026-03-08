import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Flex,
  Form,
  Input,
  Space,
  Tabs,
  Typography,
  message,
} from 'antd';
import type { TabsProps } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/context/auth.context';

type AuthTabKey = 'sign-in' | 'sign-up';

interface SignInFormValues {
  email: string;
  password: string;
}

interface SignUpFormValues extends SignInFormValues {
  fullName: string;
  phoneNumber: string;
  confirmPassword: string;
}

const emailRules = [
  { required: true, message: 'Email is required' },
  { type: 'email' as const, message: 'Enter a valid email' },
];

const phoneRules = [
  { required: true, message: 'Phone number is required' },
  {
    pattern: /^\+?[0-9]{10,15}$/,
    message: 'Use international format: +1234567890',
  },
];

const mapAuthError = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'Unexpected authentication error';
  }

  if (error.message.includes('Invalid login credentials')) {
    return 'Invalid email or password';
  }

  if (error.message.includes('User already registered')) {
    return 'A user with this email already exists';
  }

  return error.message;
};

export const AuthPage = () => {
  const [activeKey, setActiveKey] = useState<AuthTabKey>('sign-in');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo =
    typeof (location.state as { from?: string } | null)?.from === 'string'
      ? (location.state as { from: string }).from
      : '/requests';

  const onSignIn = async (values: SignInFormValues) => {
    setLoading(true);
    setErrorText(null);

    try {
      await signIn(values);
      message.success('Successfully signed in');
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setErrorText(mapAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const onSignUp = async (values: SignUpFormValues) => {
    setLoading(true);
    setErrorText(null);

    try {
      const result = await signUp({
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        phoneNumber: values.phoneNumber.trim(),
        password: values.password,
      });
      message.success(
        result.requiresEmailConfirmation
          ? 'Registration successful. Confirm your email before signing in.'
          : 'Registration successful. You can now sign in.',
      );
      setActiveKey('sign-in');
    } catch (error) {
      setErrorText(mapAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const tabItems: TabsProps['items'] = [
    {
      key: 'sign-in',
      label: 'Sign in',
      children: (
        <Form<SignInFormValues> layout="vertical" onFinish={onSignIn} disabled={loading}>
          <Form.Item name="email" label="Email" rules={emailRules}>
            <Input autoComplete="email" placeholder="name@example.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input.Password autoComplete="current-password" placeholder="Enter password" />
          </Form.Item>

          <Space style={{ width: '100%', justifyContent: 'flex-end', marginBottom: 12 }}>
            <Link to="/auth/forgot-password">Forgot password?</Link>
          </Space>

          <Button type="primary" htmlType="submit" block loading={loading}>
            Sign in
          </Button>
        </Form>
      ),
    },
    {
      key: 'sign-up',
      label: 'Sign up',
      children: (
        <Form<SignUpFormValues> layout="vertical" onFinish={onSignUp} disabled={loading}>
          <Form.Item
            name="fullName"
            label="Full name"
            rules={[
              { required: true, message: 'Full name is required' },
              { min: 2, message: 'Name is too short' },
            ]}
          >
            <Input autoComplete="name" placeholder="John Doe" maxLength={120} />
          </Form.Item>

          <Form.Item name="email" label="Email" rules={emailRules}>
            <Input autoComplete="email" placeholder="name@example.com" />
          </Form.Item>

          <Form.Item name="phoneNumber" label="Phone number" rules={phoneRules}>
            <Input autoComplete="tel" placeholder="+12345678901" maxLength={16} />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Password is required' },
              { min: 8, message: 'Password must be at least 8 characters' },
            ]}
          >
            <Input.Password autoComplete="new-password" placeholder="Create password" />
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
            <Input.Password autoComplete="new-password" placeholder="Repeat password" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={loading}>
            Sign up
          </Button>
        </Form>
      ),
    },
  ];

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
        {errorText ? (
          <Alert
            type="error"
            showIcon
            message={errorText}
            closable
            style={{ marginBottom: 16 }}
            onClose={() => setErrorText(null)}
          />
        ) : null}

        <Tabs
          activeKey={activeKey}
          onChange={(nextKey) => {
            setErrorText(null);
            setActiveKey(nextKey as AuthTabKey);
          }}
          items={tabItems}
        />
      </Card>

      <Typography.Text type="secondary">
        By continuing, you agree to use your corporate account credentials.
      </Typography.Text>
    </Flex>
  );
};

