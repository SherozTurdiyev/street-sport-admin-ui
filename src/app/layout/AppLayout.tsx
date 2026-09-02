import { createElement, useState } from 'react';
import { LogoutOutlined } from '@ant-design/icons';
import { Avatar, Button, Layout, Menu, Tooltip, Typography } from 'antd';
import { Link, Outlet, useLocation } from 'react-router';
import { useAuth, useCan, useHasOrg } from '@/features/auth/hooks';
import { displayPhone } from '@/shared/format/phone';
import { ROLE_LABELS } from '@/shared/api/types';
import { figma } from '@/shared/theme/tokens';
import { SubscriptionBanner } from '@/app/SubscriptionBanner';
import logoUrl from '@/assets/logo.svg';
import { Breadcrumbs } from './Breadcrumbs';
import { NotificationsBell } from './NotificationsBell';
import { allowedNav } from './nav';

const { Header, Sider, Content } = Layout;

/** Ism va familiyaning bosh harflari — avatar rasmi API da yo'q. */
function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

export function AppLayout() {
  const { me, logout } = useAuth();
  /**
   * Yon panel `fixed` — u oqim (`flow`) dan chiqadi va o'ng tomondagi
   * ustunga o'z kengligini bermaydi. Shuning uchun chetni O'ZIMIZ
   * qo'shamiz; `collapsed` da esa panel yo'qoladi va chet nolga tushadi.
   */
  const [collapsed, setCollapsed] = useState(false);
  const can = useCan();
  const hasOrg = useHasOrg();
  const location = useLocation();

  const nav = allowedNav(can, hasOrg);
  const items = nav.map((item) => ({
    key: item.path,
    icon: createElement(item.icon, { 'aria-hidden': true }),
    label: <Link to={item.path}>{item.label}</Link>,
  }));

  // Ichki sahifalarda ham bo'lim yoritilib turishi uchun boshlanishi
  // bo'yicha topiladi: `/members/abc` da ham "Xodimlar" tanlangan.
  const selected = nav
    .map((item) => item.path)
    .filter((path) => location.pathname.startsWith(path));

  return (
    <Layout className="min-h-screen">
      <Sider
        width={figma.siderWidth}
        breakpoint="lg"
        collapsedWidth={0}
        onCollapse={setCollapsed}
        style={{
          borderRight: `1px solid ${figma.border}`,
          // To'liq balandlik va sahifa bilan birga sirg'almaydi: uzun
          // jadvalni aylantirganda menyu joyida turadi.
          position: 'fixed',
          insetBlock: 0,
          insetInlineStart: 0,
          height: '100vh',
          zIndex: 20,
        }}
      >
        <div className="flex h-full flex-col">
          <div
            className="flex shrink-0 items-center gap-3 px-8"
            style={{
              height: figma.headerHeight,
              borderBottom: `1px solid ${figma.border}`,
            }}
          >
            {/* Belgi Figma'dan eksport qilingan: tashqi kvadrat 40px,
                ichki chizma 24px — ikkalasi ham aniq berilgan. */}
            <div
              className="flex shrink-0 items-center justify-center"
              style={{
                width: 40,
                height: 40,
                borderRadius: figma.radiusPill,
                background: figma.primary,
                boxShadow: `0 0 8px ${figma.primaryGlow}`,
              }}
            >
              <img src={logoUrl} alt="" width={24} height={24} />
            </div>
            <Typography.Text strong style={{ fontSize: 20 }}>
              StreetSport
            </Typography.Text>
          </div>

          <div className="flex-1 overflow-y-auto py-6">
            <div
              className="px-8 pb-2"
              style={{
                color: figma.textMuted,
                fontSize: 12,
                letterSpacing: '0.6px',
              }}
            >
              {me ? ROLE_LABELS[me.role].toUpperCase() : ''}
            </div>
            <Menu mode="inline" selectedKeys={selected} items={items} />
          </div>

          <div
            className="flex shrink-0 items-center justify-between gap-3 px-6 py-6"
            style={{ borderTop: `1px solid ${figma.border}` }}
          >
            {/* Profilga yagona kirish yo'li — sarlavhadagi tugma o'rniga. */}
            <Link to="/profile" className="flex min-w-0 items-center gap-3">
              <Avatar
                size={40}
                style={{ border: `1px solid ${figma.primary}` }}
              >
                {me ? initials(me.fullName) : ''}
              </Avatar>
              <div className="min-w-0">
                <div className="truncate">
                  <Typography.Text strong style={{ fontSize: 14 }}>
                    {me?.fullName}
                  </Typography.Text>
                </div>
                {/* Rol yuqorida, bo'lim yorlig'ida turibdi — bu yerda
                    takrorlanmaydi. Telefon esa foydalanuvchiga qaysi
                    hisob bilan kirganini aytadi. */}
                <div
                  className="truncate"
                  style={{ color: figma.textMuted, fontSize: 12 }}
                >
                  {displayPhone(me?.phone)}
                </div>
              </div>
            </Link>
            <Tooltip title="Chiqish">
              <Button
                type="text"
                aria-label="Chiqish"
                icon={<LogoutOutlined />}
                onClick={() => void logout()}
              />
            </Tooltip>
          </div>
        </div>
      </Sider>

      <Layout
        style={{
          marginInlineStart: collapsed ? 0 : figma.siderWidth,
          transition: 'margin-inline-start 0.2s',
        }}
      >
        <Header
          className="flex items-center justify-between"
          style={{ borderBottom: `1px solid ${figma.border}` }}
        >
          {/* Yo'lakcha har doim shu yerda: sahifa ichida chizilsa,
              har bir sahifada boshqacha joyda turib qolardi. */}
          <Breadcrumbs />
          <NotificationsBell />
        </Header>
        <SubscriptionBanner />
        <Content className="p-8">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
