import { useState } from 'react';
import { Avatar, Button, Dropdown, Grid, Layout, Menu, Spin, Switch, Typography, theme } from 'antd';
import { GlobalScrollbarStyles } from './shared/ui/GlobalScrollbarStyles';
import { EllipsisOutlined, MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import {
  Navigate,
  Outlet,
  RouterProvider,
  createBrowserRouter,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useAuth } from './shared/context/auth.context';
import { useThemeMode } from './shared/context/theme.context';
import { CreateFormPage } from './pages/CreateFormPage';
import { EditFormPage } from './pages/EditFormPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { FormViewPage } from './pages/FormViewPage';
import { FormsPage } from './pages/FormsPage';
import { RequestsPage } from './pages/RequestsPage';
import { CreateRequestPage } from './pages/CreateRequestPage';
import { RequestViewPage } from './pages/RequestViewPage';
import { AuthPage } from './pages/AuthPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { buildDisplayName } from './shared/utils/userName';

const { Content, Sider } = Layout;
const { Text } = Typography;

type NavigationItem = {
  key: string;
  label: string;
  path: string;
};

const navigationItems: NavigationItem[] = [
  { key: 'requests', label: 'Заявки', path: '/requests' },
  { key: 'forms', label: 'Формы', path: '/forms' },
  { key: 'employees', label: 'Сотрудники', path: '/employees' },
];

const menuItems: MenuProps['items'] = navigationItems.map((item) => ({
  key: item.key,
  label: item.label,
}));

const getSelectedMenuKey = (pathname: string): string => {
  const matched = navigationItems.find((item) => pathname.startsWith(item.path));
  return matched?.key ?? 'requests';
};

const ProfileBlock = () => {
  const { token } = theme.useToken();
  const { user, profile, signOut } = useAuth();
  const { themeMode, toggleTheme } = useThemeMode();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const email = profile?.email ?? user?.email ?? '';
  const avatarUrl = profile?.avatarUrl ?? null;
  const displayName = profile
    ? buildDisplayName({
        lastName: profile.lastName,
        firstName: profile.firstName,
        middleName: profile.middleName,
      }) || 'Пользователь'
    : 'Пользователь';

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  const profileMenuItems: MenuProps['items'] = [
    { key: 'settings', label: 'Настройки' },
    { type: 'divider' },
    {
      key: 'theme',
      label: (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            minWidth: 140,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <span>Тема</span>
          <Switch
            checked={themeMode === 'dark'}
            onChange={toggleTheme}
            size="small"
            aria-label={themeMode === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          />
        </div>
      ),
    },
    { key: 'support', label: 'Поддержка' },
    { key: 'feedback', label: 'Обратная связь' },
    { type: 'divider' },
    { key: 'logout', label: 'Выйти' },
  ];

  const handleProfileMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      void handleSignOut();
    }
    // Settings, Support, Feedback: placeholders for future handlers
  };

  return (
    <div
      style={{
        padding: 12,
        borderTop: `1px solid ${token.colorBorderSecondary}`,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
      }}
    >
      <Avatar src={avatarUrl ?? undefined} icon={<UserOutlined />} size={36}>
        {!avatarUrl ? displayName.charAt(0).toUpperCase() : null}
      </Avatar>

      <div style={{ minWidth: 0, flex: 1 }}>
        <Text
          strong
          style={{ color: token.colorTextLightSolid, fontSize: 13, display: 'block' }}
          ellipsis={{ tooltip: displayName }}
        >
          {displayName}
        </Text>
        <Text
          style={{
            color: token.colorTextLightSolid,
            opacity: 0.75,
            fontSize: 12,
            display: 'block',
          }}
          ellipsis={{ tooltip: email }}
        >
          {email || 'Нет email'}
        </Text>
      </div>

      <Dropdown
        trigger={['click']}
        menu={{
          items: profileMenuItems,
          onClick: handleProfileMenuClick,
        }}
      >
        <Button
          type="text"
          icon={<EllipsisOutlined />}
          aria-label="Меню профиля"
          style={{ color: token.colorTextLightSolid }}
          loading={isSigningOut}
        />
      </Dropdown>
    </div>
  );
};

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const selectedKey = getSelectedMenuKey(location.pathname);
  const [collapsed, setCollapsed] = useState(false);

  const isCompact = !screens.lg;

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    const nextItem = navigationItems.find((item) => item.key === key);
    if (nextItem) {
      navigate(nextItem.path);
      if (isCompact) setCollapsed(true);
    }
  };

  return (
    <>
      <GlobalScrollbarStyles />
      <Layout style={{ height: '100vh', overflow: 'hidden' }}>
        <Sider
          width={240}
          collapsedWidth={isCompact ? 0 : 64}
          theme="dark"
          collapsible
          collapsed={isCompact ? collapsed : false}
          trigger={null}
          breakpoint="lg"
          onBreakpoint={(broken) => setCollapsed(broken)}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <div
              style={{
                height: 64,
                paddingInline: 16,
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <Text strong style={{ color: token.colorTextLightSolid, fontSize: 16 }}>
                Сервис Деск
              </Text>
            </div>

            <Menu
              theme="dark"
              mode="inline"
              items={menuItems}
              selectedKeys={[selectedKey]}
              onClick={handleMenuClick}
              style={{ flex: 1, borderInlineEnd: 'none' }}
            />

            <ProfileBlock />
          </div>
        </Sider>

        <Layout style={{ overflow: 'hidden', minHeight: 0 }}>
          {isCompact && (
            <div
              style={{
                height: 48,
                display: 'flex',
                alignItems: 'center',
                paddingInline: 16,
                background: token.colorBgContainer,
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                flexShrink: 0,
              }}
            >
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed((v) => !v)}
                aria-label="Меню"
              />
              <Text strong style={{ marginLeft: 12 }}>Сервис Деск</Text>
            </div>
          )}
          <Content
            style={{
              display: 'flex',
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
              background: token.colorBgLayout,
            }}
          >
            <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    </>
  );
};

const FullPageLoader = () => (
  <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
    <Spin size="large" />
  </div>
);

const ProtectedLayout = () => {
  const { user, isAuthLoading } = useAuth();
  const location = useLocation();

  if (isAuthLoading) {
    return <FullPageLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return <AppLayout />;
};

const PublicOnlyAuthPage = () => {
  const { user, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <FullPageLoader />;
  }

  if (user) {
    return <Navigate to="/requests" replace />;
  }

  return <AuthPage />;
};

const router = createBrowserRouter([
  {
    path: '/auth/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/auth/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/auth',
    element: <PublicOnlyAuthPage />,
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/requests" replace />,
      },
      {
        path: 'requests',
        element: <RequestsPage />,
      },
      {
        path: 'requests/create',
        element: <CreateRequestPage />,
      },
      {
        path: 'requests/:id',
        element: <RequestViewPage />,
      },
      {
        path: 'forms',
        element: <FormsPage />,
      },
      {
        path: 'forms/create',
        element: <CreateFormPage />,
      },
      {
        path: 'forms/:id',
        element: <FormViewPage />,
      },
      {
        path: 'forms/:id/edit',
        element: <EditFormPage />,
      },
      {
        path: 'employees',
        element: <EmployeesPage />,
      },
    ],
  },
]);

const App = () => <RouterProvider router={router} />;

export default App;
