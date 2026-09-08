import { createElement } from 'react';
import { LogoutOutlined } from '@ant-design/icons';
import { Avatar, Badge, Button, Menu, Tooltip, Typography } from 'antd';
import { Link, useLocation } from 'react-router';
import { useAuth, useCan, useHasOrg } from '@/features/auth/hooks';
import { displayPhone } from '@/shared/format/phone';
import { ROLE_LABELS } from '@/shared/api/types';
import { figma } from '@/shared/theme/tokens';
import logoUrl from '@/assets/logo.png';
import { useNewDemoRequestCount } from '@/features/platform/demo-requests/hooks';
import { allowedNav } from './nav';

/** Belgi qo'yiladigan yagona bo'lim — boshqalarida hisoblanadigan
 *  "ishlanmagan" tushunchasi yo'q. */
const BELGILI_YOL = '/platform/demo-requests';

/** Ism va familiyaning bosh harflari — avatar rasmi API da yo'q. */
function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

/**
 * Yon panel mazmuni ikki joyda ishlatiladi: keng ekranda `Sider`
 * ichida, tor ekranda esa chetdan chiqadigan `Drawer` ichida. Ikki
 * nusxa yozilsa, menyuga qo'shilgan bo'lim telefonda paydo
 * bo'lmasdi.
 */
export function SiderContent({ onNavigate }: { onNavigate?: () => void }) {
  const { me, logout } = useAuth();
  const can = useCan();
  const hasOrg = useHasOrg();
  const location = useLocation();

  const nav = allowedNav(can, hasOrg);
  // Ruxsati yo'q foydalanuvchida so'rov umuman yuborilmaydi (hook
  // ichida tekshiriladi) va son 0 bo'lib qoladi.
  const yangiMurojaat = useNewDemoRequestCount();

  const items = nav.map((item) => {
    const belgi = item.path === BELGILI_YOL ? yangiMurojaat : 0;
    return {
      key: item.path,
      icon: createElement(item.icon, { 'aria-hidden': true }),
      label: (
        <Link to={item.path} onClick={onNavigate}>
          {item.label}
          {belgi > 0 && (
            /* Rang brend binafshasi: qizil qo'ng'iroqchaning ogohlantirish
               ma'nosini takrorlab, ikkalasini ham kuchsizlantirardi. */
            <Badge
              count={belgi}
              size="small"
              color={figma.primaryBright}
              title={`${belgi} ta yangi murojaat`}
              className="ml-2"
            />
          )}
        </Link>
      ),
    };
  });

  // Ichki sahifalarda ham bo'lim yoritilib turishi uchun boshlanishi
  // bo'yicha topiladi: `/members/abc` da ham "Xodimlar" tanlangan.
  const selected = nav
    .map((item) => item.path)
    .filter((path) => location.pathname.startsWith(path));

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex shrink-0 items-center gap-3 px-6 lg:px-8"
        style={{
          height: figma.headerHeight,
          borderBottom: `1px solid ${figma.border}`,
        }}
      >
        {/* Logotip Figma'dan (2023:11856 sarlavhasi): 40px dumaloq
            nishon va yonida "StreetSport" yozuvi. Rasmning o'zi qora
            fonli kvadrat, shuning uchun ostiga rang qo'yilmaydi —
            dumaloq qirqim maketdagidek. */}
        <img
          src={logoUrl}
          alt=""
          width={40}
          height={40}
          style={{
            borderRadius: figma.radiusPill,
            boxShadow: `0 0 8px ${figma.primaryGlow}`,
          }}
        />
        <Typography.Text strong style={{ fontSize: 20 }}>
          StreetSport
        </Typography.Text>
      </div>

      <div className="flex-1 overflow-y-auto py-6">
        <div
          className="px-6 pb-2 lg:px-8"
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
        <Link
          to="/profile"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-3"
        >
          <Avatar size={40} style={{ border: `1px solid ${figma.primary}` }}>
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
  );
}
