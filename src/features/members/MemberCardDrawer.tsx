import { useState } from 'react';
import {
  Alert,
  App,
  Button,
  Checkbox,
  Descriptions,
  Drawer,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { ROLE_LABELS } from '@/shared/api/types';
import { formatDateTime } from '@/shared/format/time';
import { formatMoney } from '@/shared/format/money';
import { useVenueOptions } from '@/features/venues/hooks';
import type { MemberRole } from './api';
import { useMember, useSetActive, useSetRole, useSetVenues } from './hooks';

const ROLE_OPTIONS: { value: MemberRole; label: string }[] = [
  { value: 'DIRECTOR', label: ROLE_LABELS.DIRECTOR },
  { value: 'MANAGER', label: ROLE_LABELS.MANAGER },
  { value: 'VENUE_ADMIN', label: ROLE_LABELS.VENUE_ADMIN },
];

/**
 * Kartochka ichi alohida komponent va u `key={userId}` bilan chiziladi:
 * boshqa xodimga o'tilganda barcha qoralama qiymatlar o'zi tozalanadi.
 * Aks holda ularni effekt bilan qo'lda tiklash kerak bo'lardi.
 */
function MemberCardBody({ userId }: { userId: string }) {
  const { message } = App.useApp();
  const { data, isPending, error } = useMember(userId);
  const venues = useVenueOptions(true);

  const setRole = useSetRole(userId);
  const setActive = useSetActive(userId);
  const setVenues = useSetVenues(userId);

  // Qoralama: `null` — foydalanuvchi hali tegmagan, server qiymati
  // ko'rsatiladi. Shu bilan effekt ham, sinxronlash ham kerak emas.
  const [roleDraft, setRoleDraft] = useState<MemberRole | null>(null);
  const [venuesDraft, setVenuesDraft] = useState<string[] | null>(null);
  const [amalXatosi, setAmalXatosi] = useState<string | null>(null);

  if (error !== null) {
    return <Alert type="error" showIcon message={errorMessage(error)} />;
  }
  if (isPending || !data) return <Skeleton active />;

  const role = roleDraft ?? data.role;
  const venueIds = venuesDraft ?? data.venueIds;

  async function bajar(
    ish: () => Promise<unknown>,
    muvaffaqiyat: string,
  ): Promise<void> {
    setAmalXatosi(null);
    try {
      await ish();
      message.success(muvaffaqiyat);
    } catch (e) {
      // Xabar matni backenddan: ierarxiya, oxirgi direktor, stadion
      // talabi — hammasi o'zbekcha va tayyor holda keladi.
      setAmalXatosi(errorMessage(e));
    }
  }

  return (
    <Space direction="vertical" size="large" className="w-full">
      {amalXatosi !== null && (
        <Alert type="error" showIcon message={amalXatosi} />
      )}

      <Descriptions column={1} size="small">
        <Descriptions.Item label="Telefon">{data.phone}</Descriptions.Item>
        <Descriptions.Item label="Holat">
          {data.isActive ? <Tag color="success">Faol</Tag> : <Tag>Faolsiz</Tag>}
        </Descriptions.Item>
        <Descriptions.Item label="Oxirgi kirish">
          {formatDateTime(data.lastLoginAt)}
        </Descriptions.Item>
      </Descriptions>

      <div className="flex flex-wrap gap-8">
        <Statistic
          title="Yaratgan bronlari"
          value={data.stats.bookingsCreated}
        />
        <Statistic
          title="Bekor qilgan bronlari"
          value={data.stats.bookingsCancelled}
        />
        {/* `value` emas, `formatter`: antd sonni o'ziga o'girib
            yuborardi, pul esa satrligicha qolishi kerak (BR-13). */}
        <Statistic
          title="Qabul qilgan naqd"
          formatter={() => formatMoney(data.stats.cashReceived)}
        />
      </div>

      <div>
        <Typography.Text strong>Lavozim</Typography.Text>
        <div className="mt-2 flex gap-2">
          <Select<MemberRole>
            aria-label="Lavozim"
            className="flex-1"
            options={ROLE_OPTIONS}
            value={role}
            onChange={setRoleDraft}
          />
          {/* Tugma "o'zgarmagan" holatda ham ochiq: bir xil lavozimni
              qayta saqlash zararsiz, tekshiruvi esa rolni solishtirishni
              talab qilardi (TZ 4.4). */}
          <Button
            loading={setRole.isPending}
            onClick={() =>
              void bajar(
                () => setRole.mutateAsync(role),
                'Lavozim o‘zgartirildi',
              )
            }
          >
            Lavozimni saqlash
          </Button>
        </div>
      </div>

      <div>
        <Typography.Text strong>Stadionlar</Typography.Text>
        {/* Bu ro'yxat BUTUNLAY almashtiriladi (PUT). Belgini olib tashlash
            biriktirishni bekor qiladi, shuning uchun interfeys belgilash
            ro'yxati ko'rinishida — "qo'shish" tugmasi emas. */}
        <Typography.Paragraph type="secondary" className="!mb-2">
          Belgilangan stadionlar ro‘yxati to‘liq almashtiriladi.
        </Typography.Paragraph>
        <Checkbox.Group
          className="flex flex-col gap-2"
          value={venueIds}
          onChange={(next) => setVenuesDraft(next as string[])}
          options={(venues.data ?? []).map((v) => ({
            value: v.id,
            label: v.name,
          }))}
        />
        <Button
          className="mt-3"
          loading={setVenues.isPending}
          onClick={() =>
            void bajar(
              () => setVenues.mutateAsync(venueIds),
              'Stadionlar biriktirildi',
            )
          }
        >
          Stadionlarni saqlash
        </Button>
      </div>

      <Popconfirm
        title={data.isActive ? 'Faolsizlantirilsinmi?' : 'Faollashtirilsinmi?'}
        description={
          data.isActive
            ? 'Xodimning barcha sessiyalari darhol yopiladi.'
            : undefined
        }
        okText="Ha"
        cancelText="Yo‘q"
        onConfirm={() =>
          void bajar(
            () => setActive.mutateAsync(!data.isActive),
            data.isActive ? 'Xodim faolsizlantirildi' : 'Xodim faollashtirildi',
          )
        }
      >
        <Button danger={data.isActive} loading={setActive.isPending} block>
          {data.isActive ? 'Faolsizlantirish' : 'Faollashtirish'}
        </Button>
      </Popconfirm>
    </Space>
  );
}

export function MemberCardDrawer({
  userId,
  onClose,
}: {
  userId: string | null;
  onClose: () => void;
}) {
  return (
    <Drawer
      open={userId !== null}
      onClose={onClose}
      size="large"
      title="Xodim kartochkasi"
      destroyOnHidden
    >
      {userId !== null && <MemberCardBody key={userId} userId={userId} />}
    </Drawer>
  );
}
