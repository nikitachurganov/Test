import { useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Flex,
  Form,
  Input,
  Space,
  Tabs,
  Typography,
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
  firstName: string;
  lastName: string;
  middleName?: string;
  phoneNumber: string;
  confirmPassword: string;
}

const emailRules = [
  { required: true, message: 'Электронная почта обязательна' },
  { type: 'email' as const, message: 'Введите действительный адрес электронной почты' },
];

const phoneRules = [
  { required: true, message: 'Номер телефона обязателен' },
  {
    pattern: /^\+?[0-9]{10,15}$/,
    message: 'Используйте международный формат: +1234567890',
  },
];

const mapAuthError = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'Неожиданная ошибка аутентификации';
  }

  if (error.message.includes('Invalid login credentials')) {
    return 'Неверный адрес электронной почты или пароль';
  }

  if (error.message.includes('User already registered')) {
    return 'Пользователь с таким адресом электронной почты уже зарегистрирован';
  }

  return error.message;
};

export const AuthPage = () => {
  const [activeKey, setActiveKey] = useState<AuthTabKey>('sign-in');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const { message } = App.useApp();

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
      message.success('Вы успешно вошли');
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
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        middleName: values.middleName?.trim() || undefined,
        email: values.email.trim().toLowerCase(),
        phoneNumber: values.phoneNumber.trim(),
        password: values.password,
      });
      message.success(
        result.requiresEmailConfirmation
          ? 'Регистрация успешна. Подтвердите адрес электронной почты перед входом.'
          : 'Регистрация успешна. Теперь вы можете войти.',
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
      label: 'Вход',
      children: (
        <Form<SignInFormValues> layout="vertical" onFinish={onSignIn} disabled={loading}>
          <Form.Item name="email" label="Электронная почта" rules={emailRules}>
            <Input autoComplete="email" placeholder="name@example.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Пароль"
            rules={[{ required: true, message: 'Пароль обязателен' }]}
          >
            <Input.Password autoComplete="current-password" placeholder="Введите пароль" />
          </Form.Item>

          <Space style={{ width: '100%', justifyContent: 'flex-end', marginBottom: 12 }}>
            <Link to="/auth/forgot-password">Забыли пароль?</Link>
          </Space>

          <Button type="primary" htmlType="submit" block loading={loading}>
            Войти
          </Button>
        </Form>
      ),
    },
    {
      key: 'sign-up',
      label: 'Регистрация',
      children: (
        <Form<SignUpFormValues> layout="vertical" onFinish={onSignUp} disabled={loading}>
          <Form.Item
            name="lastName"
            label="Фамилия"
            rules={[
              { required: true, message: 'Фамилия обязательна' },
              { min: 2, message: 'Фамилия слишком короткая' },
            ]}
          >
            <Input autoComplete="family-name" placeholder="Иванов" maxLength={100} />
          </Form.Item>

          <Form.Item
            name="firstName"
            label="Имя"
            rules={[
              { required: true, message: 'Имя обязательно' },
              { min: 2, message: 'Имя слишком короткое' },
            ]}
          >
            <Input autoComplete="given-name" placeholder="Иван" maxLength={100} />
          </Form.Item>

          <Form.Item name="middleName" label="Отчество (необязательно)">
            <Input autoComplete="additional-name" placeholder="Иванович" maxLength={100} />
          </Form.Item>

          <Form.Item name="email" label="Электронная почта" rules={emailRules}>
            <Input autoComplete="email" placeholder="name@example.com" />
          </Form.Item>

          <Form.Item name="phoneNumber" label="Номер телефона" rules={phoneRules}>
            <Input autoComplete="tel" placeholder="+79001234567" maxLength={16} />
          </Form.Item>

          <Form.Item
            name="password"
            label="Пароль"
            rules={[
              { required: true, message: 'Пароль обязателен' },
              { min: 8, message: 'Пароль должен содержать не менее 8 символов' },
            ]}
          >
            <Input.Password autoComplete="new-password" placeholder="Придумайте пароль" />
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
            <Input.Password autoComplete="new-password" placeholder="Повторите пароль" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={loading}>
            Зарегистрироваться
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
        Сервис Деск
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
        Продолжая, вы соглашаетесь использовать учётные данные корпоративной учётной записи.
      </Typography.Text>
    </Flex>
  );
};

