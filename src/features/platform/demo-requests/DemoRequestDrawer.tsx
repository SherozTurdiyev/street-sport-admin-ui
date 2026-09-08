import { useState } from 'react';
import { App, Button, Descriptions, Drawer, Input, Select, Tag } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { displayPhone } from '@/shared/format/phone';
import { formatDateTime } from '@/shared/format/time';
import type { DemoRequest, DemoRequestStatus } from './api';
import { STATUS_OPTIONS, STATUS_VIEW } from './status';
import { useUpdateDemoRequest } from './hooks';

/**
 * Murojaat ustida ishlash oynasi: to'liq izohni o'qish, holatni
 * o'zgartirish va ichki eslatma yozish.
 *
 * Jadvalga sig'maydigan narsalar shu yerda — mijozning izohi uzun
 * bo'lishi mumkin va ustunda kesilib qolardi.
 */
export function DemoRequestDrawer({
  murojaat,
  onClose,
}: {
  murojaat: DemoRequest | null;
  onClose: () => void;
}) {
  return (
    <Drawer
      open={murojaat !== null}
      onClose={onClose}
      placement="right"
      width="min(480px, 92vw)"
      title={murojaat?.fullName ?? ''}
      destroyOnHidden
      footer={null}
    >
      {/*
        `key` — maydonlarni useEffect bilan sinxronlash o'rniga.
        Boshqa murojaat ochilganda komponent qaytadan quriladi va
        holat to'g'ridan-to'g'ri yangi qiymat bilan boshlanadi;
        oldingisining izohi qolib ketmaydi.
      */}
      {murojaat !== null && (
        <Ichki key={murojaat.id} murojaat={murojaat} onClose={onClose} />
      )}
    </Drawer>
  );
}

function Ichki({
  murojaat,
  onClose,
}: {
  murojaat: DemoRequest;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const update = useUpdateDemoRequest();
  const [holat, setHolat] = useState<DemoRequestStatus>(murojaat.status);
  const [izoh, setIzoh] = useState(murojaat.note ?? '');

  function saqla(): void {
    update.mutate(
      { id: murojaat.id, input: { status: holat, note: izoh } },
      {
        onSuccess: () => {
          message.success('Murojaat yangilandi');
          onClose();
        },
        onError: (error) => message.error(errorMessage(error)),
      },
    );
  }

  return (
    <>
      <Descriptions column={1} size="small" className="mb-6">
        <Descriptions.Item label="Telefon">
          {/* Bosib qo'ng'iroq qilish — bu sahifadagi asosiy amal. */}
          <a href={`tel:${murojaat.phone}`}>{displayPhone(murojaat.phone)}</a>
        </Descriptions.Item>
        <Descriptions.Item label="Shahar">
          {murojaat.city ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Stadionlar">
          {murojaat.venueCount ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Kelgan vaqti">
          {formatDateTime(murojaat.createdAt)}
        </Descriptions.Item>
        <Descriptions.Item label="Hozirgi holat">
          <Tag color={STATUS_VIEW[murojaat.status].color}>
            {STATUS_VIEW[murojaat.status].label}
          </Tag>
        </Descriptions.Item>
        {murojaat.handledAt !== null && (
          <Descriptions.Item label="Oxirgi o‘zgarish">
            {formatDateTime(murojaat.handledAt)}
          </Descriptions.Item>
        )}
      </Descriptions>

      <div className="mb-4">
        <div className="mb-1.5">Mijozning izohi</div>
        <div className="opacity-70">{murojaat.comment ?? '—'}</div>
      </div>

      <label className="mb-1.5 block" htmlFor="murojaat-holat">
        Holat
      </label>
      <Select
        id="murojaat-holat"
        aria-label="Holat"
        className="mb-4 w-full"
        value={holat}
        options={STATUS_OPTIONS}
        onChange={setHolat}
      />

      <label className="mb-1.5 block" htmlFor="murojaat-izoh">
        Ichki izoh
      </label>
      <Input.TextArea
        id="murojaat-izoh"
        aria-label="Ichki izoh"
        rows={4}
        maxLength={1000}
        value={izoh}
        onChange={(e) => setIzoh(e.target.value)}
        placeholder="Mijozga ko‘rsatilmaydi"
      />

      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={onClose}>Bekor qilish</Button>
        <Button type="primary" loading={update.isPending} onClick={saqla}>
          Saqlash
        </Button>
      </div>
    </>
  );
}
