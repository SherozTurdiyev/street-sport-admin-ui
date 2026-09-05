import { BellOutlined } from '@ant-design/icons';
import { Badge, Button, Dropdown, Empty, Spin, Tooltip, Typography } from 'antd';
import { useNavigate } from 'react-router';
import { formatDateTime } from '@/shared/format/time';
import { figma } from '@/shared/theme/tokens';
import type { AppNotification } from '@/features/notifications/api';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/features/notifications/hooks';
import { notificationPath } from '@/features/notifications/notification-link';

/**
 * Bildirishnomalar tugmasi (Figma: 2020:8491).
 *
 * Ro'yxat qo'ng'iroqcha ostida ochiladi va oxirgi o'ntasini ko'rsatadi:
 * bildirishnoma — "hozir nima bo'ldi" degan savol, arxiv emas.
 */
function Element({
  item,
  onOpen,
}: {
  item: AppNotification;
  onOpen: (item: AppNotification) => void;
}) {
  const oqilmagan = item.readAt === null;

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="flex w-full flex-col gap-1 px-3 py-2 text-left"
      style={{
        background: oqilmagan ? figma.primarySoft : 'transparent',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
      }}
    >
      <Typography.Text strong={oqilmagan} style={{ fontSize: 13 }}>
        {item.title}
      </Typography.Text>
      <Typography.Text style={{ color: figma.textMuted, fontSize: 12 }}>
        {item.body}
      </Typography.Text>
      <Typography.Text style={{ color: figma.textMuted, fontSize: 11 }}>
        {formatDateTime(item.createdAt)}
      </Typography.Text>
    </button>
  );
}

export function NotificationsBell() {
  const navigate = useNavigate();
  const { data, isPending } = useNotifications({ pageSize: 10 });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const count = data?.unreadCount ?? 0;
  const items = data?.items ?? [];
  const title =
    count === 0 ? 'Bildirishnoma yo‘q' : `${count} ta yangi bildirishnoma`;

  function ochish(item: AppNotification): void {
    // O'qilgan deb belgilash NATIJASI kutilmaydi: foydalanuvchi
    // sahifaga darhol o'tishi kerak, belgi esa fon amali.
    if (item.readAt === null) markRead.mutate(item.id);

    const path = notificationPath(item.type, item.payload);
    if (path !== null) void navigate(path);
  }

  const royxat = (
    <div
      className="flex max-h-96 w-80 flex-col gap-1 overflow-y-auto p-2"
      style={{
        background: figma.bgCard,
        border: `1px solid ${figma.border}`,
        borderRadius: figma.radiusCard,
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
      }}
    >
      <div className="flex items-center justify-between px-1 pb-1">
        <Typography.Text strong>Bildirishnomalar</Typography.Text>
        {count > 0 && (
          <Button
            size="small"
            type="link"
            loading={markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            Hammasini o‘qildi
          </Button>
        )}
      </div>

      {isPending ? (
        <div className="flex justify-center py-6">
          <Spin />
        </div>
      ) : items.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Hozircha xabar yo‘q"
        />
      ) : (
        items.map((item) => (
          <Element key={item.id} item={item} onOpen={ochish} />
        ))
      )}
    </div>
  );

  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      popupRender={() => royxat}
    >
      <Tooltip title={title}>
        <Badge
          count={count}
          size="small"
          offset={[-4, 4]}
          color={figma.danger}
          // Nol ko'rsatilmaydi: bo'sh belgi diqqatni behuda tortadi.
          showZero={false}
        >
          <Button
            shape="circle"
            aria-label={`Bildirishnomalar: ${title}`}
            icon={<BellOutlined aria-hidden />}
          />
        </Badge>
      </Tooltip>
    </Dropdown>
  );
}
