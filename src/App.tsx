import { Layout, Menu, Switch, Typography, theme } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import {
  Navigate,
  Outlet,
  RouterProvider,
  createBrowserRouter,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useThemeMode } from './shared/context/theme.context';
import { CreateFormPage } from './pages/CreateFormPage';
import { EditFormPage } from './pages/EditFormPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { FormsPage } from './pages/FormsPage';
import { RequestsPage } from './pages/RequestsPage';

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

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { themeMode, toggleTheme } = useThemeMode();
  const { token } = theme.useToken();
  const selectedKey = getSelectedMenuKey(location.pathname);

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    const nextItem = navigationItems.find((item) => item.key === key);
    if (nextItem) {
      navigate(nextItem.path);
    }
  };

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Sider width={240} theme="dark">
        {/*
         * Inner wrapper makes the sider a flex column so the theme
         * switcher can sit flush at the bottom.
         */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          {/* Logo / app name */}
          <div
            style={{
              height: 64,
              paddingInline: 16,
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            {/* colorTextLightSolid is always #fff — correct for a dark sider */}
            <Text
              strong
              style={{ color: token.colorTextLightSolid, fontSize: 16 }}
            >
              Service Desk
            </Text>
          </div>

          {/* Navigation — flex: 1 pushes the switcher to the bottom */}
          <Menu
            theme="dark"
            mode="inline"
            items={menuItems}
            selectedKeys={[selectedKey]}
            onClick={handleMenuClick}
            style={{ flex: 1, borderInlineEnd: 'none' }}
          />

          {/* Theme switcher */}
          <div
            style={{
              padding: '16px',
              borderTop: 'rgba(255, 255, 255, 0.12) 1px solid',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexShrink: 0,
            }}
          >
            <Switch
              checked={themeMode === 'dark'}
              onChange={toggleTheme}
              checkedChildren={<MoonOutlined aria-hidden="true" />}
              unCheckedChildren={<SunOutlined aria-hidden="true" />}
              aria-label={
                themeMode === 'dark'
                  ? 'Переключить на светлую тему'
                  : 'Переключить на тёмную тему'
              }
            />
            <Text style={{ color: token.colorTextLightSolid, fontSize: 13 }}>
              {themeMode === 'dark' ? 'Тёмная' : 'Светлая'}
            </Text>
          </div>
        </div>
      </Sider>

      <Layout style={{ overflow: 'hidden', minHeight: 0 }}>
        <Content
          style={{
            display: 'flex',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
            // colorBgLayout adapts to light (#f5f5f5) / dark (#000) algorithm
            background: token.colorBgLayout,
          }}
        >
          <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
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
        path: 'forms',
        element: <FormsPage />,
      },
      {
        path: 'forms/create',
        element: <CreateFormPage />,
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
