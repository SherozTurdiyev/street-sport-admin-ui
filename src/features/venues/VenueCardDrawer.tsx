import { useState } from 'react';
import {
  Alert,
  App,
  Button,
  Descriptions,
  Drawer,
  Skeleton,
  Space,
  Tabs,
  Tag,
} from 'antd';
import { errorMessage, errorCode } from '@/shared/api/error-handler';
import { formatDateTime } from '@/shared/format/time';
import {
  AMENITY_LABELS,
  SPORT_TYPE_LABELS,
  SURFACE_LABELS,
  VENUE_STATUS_VIEW,
} from './enums';
import { WeeklyHoursForm } from './WeeklyHoursForm';
import { PriceRulesTab } from './prices/PriceRulesTab';
import { useArchiveVenue, useRestoreVenue, useVenue } from './hooks';

function VenueProfileTab({ venueId }: { venueId: string }) {
  const { message } = App.useApp();
  const { data } = useVenue(venueId);
  const archive = useArchiveVenue(venueId);
  const restore = useRestoreVenue(venueId);
  const [xato, setXato] = useState<string | null>(null);
  /**
   * Faol bronlari bor stadionni arxivlash `confirm: true` talab qiladi.
   * Tugmani darrov `true` bilan yuborish noto'g'ri bo'lardi: to'siq
   * aynan foydalanuvchini ogohlantirish uchun qo'yilgan. Shuning uchun
   * avval `false` ketadi va 409 kelgandagina tasdiq tugmasi chiqadi.
   */
  const [tasdiqKerak, setTasdiqKerak] = useState(false);

  if (!data) return null;
  const status = VENUE_STATUS_VIEW[data.status];

  async function arxivla(confirm: boolean): Promise<void> {
    setXato(null);
    try {
      await archive.mutateAsync(confirm);
      message.success('Stadion arxivlandi');
      setTasdiqKerak(false);
    } catch (e) {
      setXato(errorMessage(e));
      if (errorCode(e) === 'VENUE_HAS_ACTIVE_BOOKINGS') setTasdiqKerak(true);
    }
  }

  return (
    <Space direction="vertical" size="middle" className="w-full">
      {xato !== null && <Alert type="error" showIcon message={xato} />}

      <Descriptions column={1} size="small">
        <Descriptions.Item label="Holat">
          <Tag color={status.color}>{status.label}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Sport turi">
          {SPORT_TYPE_LABELS[data.sportType]}
        </Descriptions.Item>
        <Descriptions.Item label="Qoplama">
          {data.surface === null ? '—' : SURFACE_LABELS[data.surface]}
        </Descriptions.Item>
        <Descriptions.Item label="O‘lchami">
          {data.sizeLabel ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Shahar">{data.city ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Manzil">
          {data.address ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Bron qadami">
          {data.slotMinutes} daqiqa
        </Descriptions.Item>
        <Descriptions.Item label="Qulayliklar">
          {data.amenities.length === 0
            ? '—'
            : data.amenities.map((a) => AMENITY_LABELS[a]).join(', ')}
        </Descriptions.Item>
        <Descriptions.Item label="Yaratilgan">
          {formatDateTime(data.createdAt)}
        </Descriptions.Item>
      </Descriptions>

      {data.status === 'ARCHIVED' ? (
        <Button
          block
          loading={restore.isPending}
          onClick={() =>
            void restore
              .mutateAsync()
              .then(() => message.success('Stadion qaytarildi'))
              .catch((e: unknown) => setXato(errorMessage(e)))
          }
        >
          Arxivdan qaytarish
        </Button>
      ) : tasdiqKerak ? (
        <Button
          danger
          block
          loading={archive.isPending}
          onClick={() => void arxivla(true)}
        >
          Baribir arxivlash
        </Button>
      ) : (
        <Button
          danger
          block
          loading={archive.isPending}
          onClick={() => void arxivla(false)}
        >
          Arxivlash
        </Button>
      )}
    </Space>
  );
}

function VenueCardBody({ venueId }: { venueId: string }) {
  const { data, isPending, error } = useVenue(venueId);

  if (error !== null) {
    return <Alert type="error" showIcon message={errorMessage(error)} />;
  }
  if (isPending || !data) return <Skeleton active />;

  return (
    <Tabs
      items={[
        {
          key: 'profile',
          label: 'Profil',
          children: <VenueProfileTab venueId={venueId} />,
        },
        {
          key: 'hours',
          label: 'Ish vaqti',
          children: <WeeklyHoursForm venueId={venueId} />,
        },
        {
          key: 'prices',
          label: 'Narxlar',
          children: <PriceRulesTab venueId={venueId} />,
        },
      ]}
    />
  );
}

export function VenueCardDrawer({
  venueId,
  onClose,
}: {
  venueId: string | null;
  onClose: () => void;
}) {
  return (
    <Drawer
      open={venueId !== null}
      onClose={onClose}
      size="large"
      title="Stadion"
      destroyOnHidden
    >
      {venueId !== null && <VenueCardBody key={venueId} venueId={venueId} />}
    </Drawer>
  );
}
