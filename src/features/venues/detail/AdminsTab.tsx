import { useState } from 'react';
import {
  Alert,
  App,
  Button,
  Empty,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { displayPhone } from '@/shared/format/phone';
import { useAssignVenues, useMembers } from '@/features/members/hooks';
import type { Member } from '@/features/members/api';

/**
 * F2.3 — stadion tomonidan administrator biriktirish.
 *
 * Xuddi shu amal xodimlar bo'limida ham bor, lekin u yerda savol
 * "bu xodim qaysi stadionlarda?" ko'rinishida turadi. Stadion egasi
 * esa teskarisini so'raydi: "shu stadionni kim boshqaradi?" — shuning
 * uchun ro'yxat stadion sahifasida ham kerak.
 */
export function AdminsTab({ venueId }: { venueId: string }) {
  const { message } = App.useApp();
  const [tanlangan, setTanlangan] = useState<string | undefined>(undefined);
  const [xato, setXato] = useState<string | null>(null);

  const biriktirilgan = useMembers({ venueId, pageSize: 100 });
  // Tanlash uchun faqat FAOL administratorlar: menejer va direktor
  // barcha stadionlarni baribir ko'radi, ularni biriktirish ma'nosiz.
  const nomzodlar = useMembers({
    role: 'VENUE_ADMIN',
    isActive: true,
    pageSize: 100,
  });
  const assign = useAssignVenues();

  const bor = new Set((biriktirilgan.data?.items ?? []).map((m) => m.userId));
  const ochiqNomzodlar = (nomzodlar.data?.items ?? []).filter(
    (m) => !bor.has(m.userId),
  );

  async function bajar(
    member: Member,
    venueIds: string[],
    muvaffaqiyat: string,
  ): Promise<void> {
    setXato(null);
    try {
      await assign.mutateAsync({ userId: member.userId, venueIds });
      message.success(muvaffaqiyat);
    } catch (e) {
      // Eng ko'p uchraydigani: administratorda kamida bitta stadion
      // qolishi shart (backend `MEMBER_VENUE_REQUIRED`).
      setXato(errorMessage(e));
    }
  }

  const biriktir = async (): Promise<void> => {
    const member = ochiqNomzodlar.find((m) => m.userId === tanlangan);
    if (!member) return;
    await bajar(member, [...member.venueIds, venueId], 'Admin biriktirildi');
    setTanlangan(undefined);
  };

  if (biriktirilgan.error !== null) {
    return (
      <Alert type="error" showIcon message={errorMessage(biriktirilgan.error)} />
    );
  }

  return (
    <Space direction="vertical" size="middle" className="w-full">
      {xato !== null && <Alert type="error" showIcon message={xato} />}

      <Space wrap>
        <Select
          aria-label="Xodim"
          placeholder="Administratorni tanlang"
          style={{ minWidth: 240 }}
          loading={nomzodlar.isPending}
          value={tanlangan}
          onChange={setTanlangan}
          options={ochiqNomzodlar.map((m) => ({
            value: m.userId,
            label: m.fullName,
          }))}
          notFoundContent={
            <Typography.Text type="secondary">
              Biriktirish uchun faol administrator yo‘q
            </Typography.Text>
          }
        />
        <Button
          type="primary"
          disabled={tanlangan === undefined}
          loading={assign.isPending}
          onClick={() => void biriktir()}
        >
          Biriktirish
        </Button>
      </Space>

      <Table<Member>
        rowKey="userId"
        dataSource={biriktirilgan.data?.items ?? []}
        loading={biriktirilgan.isPending}
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{
          emptyText: (
            <Empty description="Bu stadionga admin biriktirilmagan" />
          ),
        }}
        columns={[
          { title: 'Ism', dataIndex: 'fullName' },
          {
            title: 'Telefon',
            dataIndex: 'phone',
            render: (phone: string) => displayPhone(phone),
          },
          {
            title: 'Holat',
            responsive: ['sm'],
            dataIndex: 'isActive',
            render: (faol: boolean) =>
              faol ? <Tag color="success">Faol</Tag> : <Tag>Faolsiz</Tag>,
          },
          {
            title: '',
            key: 'amal',
            align: 'right',
            render: (_: unknown, member) => (
              <Popconfirm
                title="Olib tashlansinmi?"
                description="Xodim shu stadionni boshqara olmay qoladi."
                okText="Ha"
                cancelText="Yo‘q"
                onConfirm={() =>
                  void bajar(
                    member,
                    member.venueIds.filter((v) => v !== venueId),
                    'Admin olib tashlandi',
                  )
                }
              >
                <Button danger size="small">
                  Olib tashlash
                </Button>
              </Popconfirm>
            ),
          },
        ]}
      />
    </Space>
  );
}
