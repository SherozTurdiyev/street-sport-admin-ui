import { useState } from 'react';
import { Alert, Button, Modal, Typography } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { useAuth } from '@/features/auth/hooks';
import type { Member, MemberRole } from './api';
import { useResetMemberPassword } from './hooks';

/** Kim kimning parolini UI da tiklay oladi — backend bilan bir xil. */
const RESETABLE: Partial<Record<MemberRole, readonly MemberRole[]>> = {
  DIRECTOR: ['MANAGER', 'VENUE_ADMIN'],
  MANAGER: ['VENUE_ADMIN'],
};

export function canResetMemberPassword(
  actorRole: MemberRole | 'SUPER_ADMIN',
  targetRole: MemberRole,
  actorUserId: string,
  targetUserId: string,
): boolean {
  if (actorUserId === targetUserId) return false;
  if (actorRole === 'SUPER_ADMIN') return false;
  return RESETABLE[actorRole]?.includes(targetRole) ?? false;
}

/**
 * Xodim parolini tiklash. Platformadagi `DirectorPasswordButton` bilan
 * bir xil ikki bosqichli oqim.
 */
export function MemberPasswordButton({ member }: { member: Member }) {
  const { me } = useAuth();
  const [tasdiq, setTasdiq] = useState(false);
  const [parol, setParol] = useState<string | null>(null);
  const [xato, setXato] = useState<string | null>(null);
  const reset = useResetMemberPassword(member.userId);

  if (
    me === null ||
    !canResetMemberPassword(me.role, member.role, me.userId, member.userId)
  ) {
    return null;
  }

  function tikla(): void {
    setXato(null);
    reset.mutate(undefined, {
      onSuccess: (natija) => {
        setTasdiq(false);
        setParol(natija.temporaryPassword);
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
          <Typography.Text strong>{member.fullName}</Typography.Text> uchun
          yangi vaqtinchalik parol yaratiladi.
        </p>
        <Alert
          type="warning"
          showIcon
          message="Xodim tizimdan chiqariladi"
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
          <Typography.Text strong>{member.fullName}</Typography.Text> uchun
          vaqtinchalik parol:
        </p>
        <Typography.Title level={3} copyable={{ text: parol ?? '' }}>
          {parol}
        </Typography.Title>
        <Alert
          type="warning"
          showIcon
          message="Bu parol boshqa ko‘rsatilmaydi"
          description="Oynani yopgach parolni qayta olish imkoni yo‘q. Uni hozir xodimga yetkazing."
        />
      </Modal>
    </>
  );
}
