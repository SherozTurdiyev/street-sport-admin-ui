import { Button, Layout, Menu, Space, Typography } from 'antd';
import { Link, Outlet, useLocation } from 'react-router';
import { useAuth, useCan } from '@/features/auth/hooks';
import { ROLE_LABELS } from '@/shared/api/types';
import { allowedNav } from './nav';

const { Header, Sider, Content } = Layout;

export function AppLayout() {
  const { me, logout } = useAuth();
  const can = useCan();
  const location = useLocation();

  const items = allowedNav(can).map((item) => ({
    key: item.path,
    label: <Link to={item.path}>{item.label}</Link>,
  }));

  // Ichki sahifalarda ham bo'lim yoritilib turishi uchun boshlanishi
  // bo'yicha topiladi: `/members/abc` da ham "Xodimlar" tanlangan.
  const selected = items
    .map((item) => item.key)
    .filter((path) => location.pathname.startsWith(path));

  return (
    <Layout className="min-h-full">
      <Sider breakpoint="lg" collapsedWidth={0} theme="light">
        <div className="px-4 py-4">
          <Typography.Text strong>Stadion</Typography.Text>
        </div>
        <Menu mode="inline" selectedKeys={selected} items={items} />
      </Sider>
      <Layout>
        <Header className="flex items-center justify-end gap-4 bg-white px-6">
          <Space size="middle">
            <span>
              <Typography.Text strong>{me?.fullName}</Typography.Text>{' '}
              <Typography.Text type="secondary">
                {me ? ROLE_LABELS[me.role] : ''}
              </Typography.Text>
            </span>
            {/* Parol almashtirish sahifasiga boshqa kirish yo'li yo'q. */}
            <Link to="/change-password">Parolni almashtirish</Link>
            <Button onClick={() => void logout()}>Chiqish</Button>
          </Space>
        </Header>
        <Content className="p-6">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
