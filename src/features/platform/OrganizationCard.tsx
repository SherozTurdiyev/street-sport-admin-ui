import { ArrowRightOutlined, PhoneOutlined } from '@ant-design/icons';
import { Button, Tag, Typography } from 'antd';
import { Link } from 'react-router';
import { formatDate } from '@/shared/format/time';
import { figma } from '@/shared/theme/tokens';
import type { PlatformOrganization } from './api';
import { STATUS_VIEW } from './status';

/**
 * Tor ekranda jadval o'rniga shu kartochka chiziladi: olti ustunni
 * telefon ekraniga sig'dirib bo'lmaydi — u yon tomonga sirg'anadigan
 * yoki o'qib bo'lmas darajada siqilgan jadvalga aylanardi.
 */
export function OrganizationCard({ org }: { org: PlatformOrganization }) {
  const status = STATUS_VIEW[org.effectiveStatus];

  return (
    <div
      className="flex flex-col gap-3 p-5"
      style={{
        background: 'rgba(27, 12, 54, 0.6)',
        border: `1px solid ${figma.border}`,
        borderRadius: figma.radiusCard,
        color: figma.text,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Typography.Title level={3} style={{ fontSize: 16, margin: 0 }}>
            {org.name}
          </Typography.Title>
          {org.phone !== null && (
            <div
              className="mt-1 flex items-center gap-2"
              style={{ fontSize: 13 }}
            >
              <PhoneOutlined aria-hidden />
              {org.phone}
            </div>
          )}
        </div>
        <Tag color={status.color}>{status.label}</Tag>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1" style={{ fontSize: 13 }}>
        <span>Stadionlar: {org.stats.venueCount}</span>
        <span>Xodimlar: {org.stats.memberCount}</span>
        <span>Bronlar: {org.stats.bookingCount}</span>
      </div>

      <div
        className="flex items-center justify-between gap-3 pt-3"
        style={{ borderTop: `1px solid ${figma.border}`, fontSize: 13 }}
      >
        <span>
          Obuna:{' '}
          {org.subscriptionEndsAt === null
            ? 'Muddatsiz'
            : formatDate(org.subscriptionEndsAt)}
        </span>
        <Link to={`/platform/organizations/${org.id}`}>
          <Button
            type="primary"
            aria-label={`${org.name} — ochish`}
            icon={<ArrowRightOutlined aria-hidden />}
          />
        </Link>
      </div>
    </div>
  );
}
