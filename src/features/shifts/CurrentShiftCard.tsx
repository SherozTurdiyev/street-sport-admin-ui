import { useState } from 'react';
import { Alert, Button, Card, Empty, Select, Skeleton, Space } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { formatMoney } from '@/shared/format/money';
import { formatDateTime } from '@/shared/format/time';
import { figma } from '@/shared/theme/tokens';
import { useCan } from '@/features/auth/hooks';
import { useVenueOptions } from '@/features/venues/hooks';
import { useCurrentShift } from './hooks';
import { CloseShiftModal, OpenShiftModal } from './ShiftModals';

function Qator({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span style={{ color: figma.textMuted, fontSize: 13 }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  );
}

/**
 * Joriy smena — kassirning ish o'rni. Stadion tanlanadi, chunki bitta
 * tashkilotda bir nechta stadion bo'ladi va har birida o'z smenasi
 * yuriladi (bazadagi `one_open_shift_per_venue` shundan).
 */
export function CurrentShiftCard() {
  const can = useCan();
  const stadionlar = useVenueOptions(true);
  const [venueId, setVenueId] = useState<string | null>(null);
  const [ochish, setOchish] = useState(false);
  const [yopish, setYopish] = useState(false);

  // Birinchi stadion o'zi tanlanadi: bitta stadionli tashkilotda
  // ortiqcha bosish bo'lmasin.
  const tanlangan = venueId ?? stadionlar.data?.[0]?.id ?? null;
  const smena = useCurrentShift(tanlangan);

  /*
   * Stadionlar ro'yxati kelmaguncha ham yuklanish ko'rsatiladi.
   * Aks holda ekran ketma-ket uchta holatni chizardi: "smena yo'q"
   * (hali so'ralmagan) → yuklanish → haqiqiy holat. Birinchisi
   * YOLG'ON edi va tugmasi bosilishga ulgurardi.
   */
  const yuklanmoqda = stadionlar.isPending || smena.isPending;

  return (
    <Card
      title="Joriy smena"
      extra={
        <Select
          aria-label="Stadion"
          style={{ minWidth: 180 }}
          placeholder="Stadion"
          loading={stadionlar.isPending}
          value={tanlangan ?? undefined}
          onChange={setVenueId}
          options={(stadionlar.data ?? []).map((v) => ({
            value: v.id,
            label: v.name,
          }))}
        />
      }
    >
      {smena.error !== null ? (
        <Alert type="error" showIcon message={errorMessage(smena.error)} />
      ) : yuklanmoqda ? (
        <Skeleton active />
      ) : smena.data == null ? (
        <div className="flex flex-col items-center gap-4">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Bu stadionda ochiq smena yo‘q"
          />
          {/* Naqd to'lov ochiq smenasiz qabul qilinmaydi — shuni shu
              yerda aytib qo'yamiz, aks holda kassir 409 xatosini
              tushunmasdi. */}
          <span style={{ color: figma.textMuted, fontSize: 13 }}>
            Naqd to‘lov qabul qilish uchun avval smenani oching.
          </span>
          {can('shift.manage') && (
            <Button type="primary" onClick={() => setOchish(true)}>
              Smenani ochish
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Qator label="Kassir" value={smena.data.userName} />
          <Qator label="Ochilgan" value={formatDateTime(smena.data.openedAt)} />
          <Qator
            label="Boshlang‘ich qoldiq"
            value={formatMoney(smena.data.openingCash)}
          />
          <Qator
            label="Naqd to‘lovlar"
            value={formatMoney(smena.data.cashPaymentTotal)}
          />
          <Qator
            label="Naqd qaytarishlar"
            value={formatMoney(smena.data.cashRefundTotal)}
          />
          <div
            className="flex items-baseline justify-between gap-4 pt-2"
            style={{ borderTop: `1px solid ${figma.border}` }}
          >
            <span style={{ color: figma.textMuted, fontSize: 13 }}>
              Kassada bo‘lishi kerak
            </span>
            <span style={{ fontWeight: 700, fontSize: 20 }}>
              {formatMoney(smena.data.expectedCash)}
            </span>
          </div>

          {can('shift.manage') && (
            <Space wrap>
              <Button type="primary" onClick={() => setYopish(true)}>
                Smenani yopish
              </Button>
            </Space>
          )}
        </div>
      )}

      <OpenShiftModal
        venueId={tanlangan}
        open={ochish}
        onClose={() => setOchish(false)}
      />
      {smena.data != null && (
        <CloseShiftModal
          shift={smena.data}
          open={yopish}
          onClose={() => setYopish(false)}
        />
      )}
    </Card>
  );
}
