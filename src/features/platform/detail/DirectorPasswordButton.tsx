import { useState } from 'react';
import { Alert, Button, Modal, Typography } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import type { OrganizationDirector } from '../api';
import { useResetDirectorPassword } from '../hooks';

/**
 * Direktor parolini tiklash. Qo'llab-quvvatlash amali: direktor
 * parolini unutsa, tashkilotni boshqara olmay qoladi.
 *
 * Ikki bosqich ATAYLAB: amal direktorni tizimdan chiqarib yuboradi va
 * uning ochiq sessiyalarini yopadi — tasodifiy bosishdan himoya kerak.
 */
export function DirectorPasswordButton({
  orgId,
  director,
}: {
  orgId: string;
  director: OrganizationDirector;
}) {
  const [tasdiq, setTasdiq] = useState(false);
  const [parol, setParol] = useState<string | null>(null);
  const [xato, setXato] = useState<string | null>(null);
  const reset = useResetDirectorPassword(orgId);

  function tikla(): void {
    setXato(null);
    reset.mutate(director.userId, {
      onSuccess: (natija) => {
        setTasdiq(false);
        setParol((natija as { temporaryPassword: string }).temporaryPassword);
      },
      onError: (error) => setXato(errorMessage(error)),
    });
  }

  return (
    <>
      <Button size="small" onClick={() => setTasdiq(true)}>
        Parolni tiklash
      </Button>

      <Modal
        open={tasdiq}
        title="Parolni tiklash"
        okText="Tiklash"
        cancelText="Bekor qilish"
        confirmLoading={reset.isPending}
        onOk={tikla}
        onCancel={() => {
          setTasdiq(false);
          setXato(null);
        }}
      >
        <p>
          <Typography.Text strong>{director.fullName}</Typography.Text> uchun
          yangi vaqtinchalik parol yaratiladi.
        </p>
        <Alert
          type="warning"
          showIcon
          message="Direktor tizimdan chiqariladi"
          description="Uning barcha ochiq sessiyalari yopiladi va eski parol ishlamay qoladi. Keyingi kirishda u o‘zi yangi parol o‘rnatadi."
        />
        {xato !== null && (
          <Alert type="error" showIcon message={xato} className="!mt-3" />
        )}
      </Modal>

      <Modal
        open={parol !== null}
        title="Parol tiklandi"
        okText="Tushunarli"
        cancelButtonProps={{ style: { display: 'none' } }}
        onOk={() => setParol(null)}
        onCancel={() => setParol(null)}
      >
        <p>
          <Typography.Text strong>{director.fullName}</Typography.Text> uchun
          vaqtinchalik parol:
        </p>
        <Typography.Title level={3} copyable={{ text: parol ?? '' }}>
          {parol}
        </Typography.Title>
        <Alert
          type="warning"
          showIcon
          message="Bu parol boshqa ko‘rsatilmaydi"
          description="Oynani yopgach parolni qayta olish imkoni yo‘q. Uni hozir direktorga yetkazing."
        />
      </Modal>
    </>
  );
}
