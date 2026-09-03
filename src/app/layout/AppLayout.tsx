import { useState } from 'react';
import { MenuOutlined } from '@ant-design/icons';
import { Button, Drawer, Layout } from 'antd';
import { Outlet } from 'react-router';
import { figma } from '@/shared/theme/tokens';
import { SubscriptionBanner } from '@/app/SubscriptionBanner';
import { Breadcrumbs } from './Breadcrumbs';
import { NotificationsBell } from './NotificationsBell';
import { SiderContent } from './SiderContent';

const { Header, Sider, Content } = Layout;

export function AppLayout() {
  /**
   * Yon panel `fixed` — u oqim (`flow`) dan chiqadi va o'ng tomondagi
   * ustunga o'z kengligini bermaydi. Shuning uchun chetni O'ZIMIZ
   * qo'shamiz; `collapsed` da esa panel yo'qoladi va chet nolga tushadi.
   */
  const [collapsed, setCollapsed] = useState(false);
  const [menyu, setMenyu] = useState(false);

  return (
    <Layout className="min-h-screen">
      <Sider
        width={figma.siderWidth}
        breakpoint="lg"
        collapsedWidth={0}
        // `trigger` o'chirilgan: antd standarti ekran chetiga yopishgan
        // tor tasma chizadi va u sarlavhadagi tugma bilan ikkilanardi.
        trigger={null}
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
        <SiderContent />
      </Sider>

      {/*
       * Tor ekranda panel butunlay yo'qoladi. Ilgari uni ochadigan
       * hech narsa yo'q edi — ya'ni telefonda menyuga umuman
       * kirib bo'lmasdi. Chetdan chiqadigan oyna aynan shu bo'shliqni
       * yopadi va menyu mazmuni bitta joydan keladi.
       */}
      <Drawer
        open={menyu}
        placement="left"
        width={figma.siderWidth}
        onClose={() => setMenyu(false)}
        closable={false}
        styles={{ body: { padding: 0, background: figma.bgSider } }}
      >
        <SiderContent onNavigate={() => setMenyu(false)} />
      </Drawer>

      <Layout
        style={{
          marginInlineStart: collapsed ? 0 : figma.siderWidth,
          transition: 'margin-inline-start 0.2s',
        }}
      >
        <Header
          className="flex items-center gap-2 !px-4 sm:!px-6 lg:!px-8"
          style={{ borderBottom: `1px solid ${figma.border}` }}
        >
          {collapsed && (
            <Button
              type="text"
              aria-label="Menyuni ochish"
              icon={<MenuOutlined aria-hidden />}
              onClick={() => setMenyu(true)}
            />
          )}
          {/* Yo'lakcha har doim shu yerda: sahifa ichida chizilsa,
              har bir sahifada boshqacha joyda turib qolardi. */}
          <div className="min-w-0 flex-1 overflow-hidden">
            <Breadcrumbs />
          </div>
          <NotificationsBell />
        </Header>
        <SubscriptionBanner />
        <Content className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
