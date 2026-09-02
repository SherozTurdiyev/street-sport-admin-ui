import { useState } from 'react';
import {
  Alert,
  App,
  Button,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { errorMessage } from '@/shared/api/error-handler';
import { DEFAULT_PAGE_SIZE, ROLE_LABELS } from '@/shared/api/types';
import { formatDate, formatDateTime } from '@/shared/format/time';
import type { OrganizationMember, OrganizationVenue } from './api';
import { BlockModal } from './BlockModal';
import { STATUS_VIEW } from './status';
import {
  useBlockOrganization,
  useOrganization,
  useOrganizationMembers,
  useOrganizationVenues,
  useUnblockOrganization,
  useUpdateOrganization,
} from './hooks';

type ProfileValues = {
  name: string;
  phone?: string;
  address?: string;
  subscriptionEndsAt?: Dayjs | null;
};

const PAGE = { page: 1, pageSize: DEFAULT_PAGE_SIZE };

function MembersTab({ id }: { id: string }) {
  const { data, isFetching } = useOrganizationMembers(id, PAGE);
  return (
    <Table<OrganizationMember>
      rowKey="id"
      size="small"
      loading={isFetching}
      dataSource={data?.items ?? []}
      pagination={false}
      columns={[
        { title: 'Ism', dataIndex: 'fullName' },
        { title: 'Telefon', dataIndex: 'phone' },
        {
          title: 'Lavozim',
          dataIndex: 'role',
          render: (value: OrganizationMember['role']) => ROLE_LABELS[value],
        },
        {
          title: 'Oxirgi kirish',
          dataIndex: 'lastLoginAt',
          render: (value: string | null) => formatDateTime(value),
        },
      ]}
    />
  );
}

function VenuesTab({ id }: { id: string }) {
  const { data, isFetching } = useOrganizationVenues(id, PAGE);
  return (
    <>
      {/* Arxivlanganlar ham ko'rinadi — shunda ro'yxat kartochkadagi
          `venueCount` bilan mos keladi va farqi sababsiz qolmaydi. */}
      <Typography.Paragraph type="secondary">
        Arxivlangan stadionlar ham ko'rsatiladi.
      </Typography.Paragraph>
      <Table<OrganizationVenue>
        rowKey="id"
        size="small"
        loading={isFetching}
        dataSource={data?.items ?? []}
        pagination={false}
        columns={[
          { title: 'Nomi', dataIndex: 'name' },
          { title: 'Sport turi', dataIndex: 'sportType' },
          { title: 'Shahar', dataIndex: 'city' },
          { title: 'Holat', dataIndex: 'status' },
        ]}
      />
    </>
  );
}

function OrganizationCardBody({ id }: { id: string }) {
  const { message } = App.useApp();
  const { data, isPending, error } = useOrganization(id);
  const update = useUpdateOrganization(id);
  const block = useBlockOrganization(id);
  const unblock = useUnblockOrganization(id);
  const [amalXatosi, setAmalXatosi] = useState<string | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);

  if (error !== null) {
    return <Alert type="error" showIcon message={errorMessage(error)} />;
  }
  if (isPending || !data) return <Skeleton active />;

  const status = STATUS_VIEW[data.effectiveStatus];

  /**
   * Tugmalar `isBlocked` ga EMAS, ustunga qaraydi — backend ham shunday
   * qaraydi. Obunasi o'z-o'zidan tugagan tashkilot `isBlocked: true`
   * bo'ladi, lekin qo'lda bloklanmagan: uni bloklash mumkin va kerak,
   * chunki bu ikki xil hodisa va ikkalasining ham izi qoladi.
   *
   * `isBlocked` bo'yicha qaralsa, muddati tugagan tashkilotga "blokdan
   * chiqarish" tugmasi chiqib, backend `ORGANIZATION_NOT_BLOCKED` (409)
   * qaytarardi.
   */
  const qoldaBloklangan = data.subscriptionStatus === 'SUSPENDED';

  /**
   * Blokdan chiqarish YETARLI bo'lmasligi mumkin: obuna sanasi o'tib
   * ketgan bo'lsa, holat `SUSPENDED` dan `EXPIRED` ga o'tadi, xolos.
   * Buni oldindan aytmasak, foydalanuvchi tugmani bosib "ishlamadi"
   * deb o'ylaydi.
   */
  const muddatOtgan =
    data.subscriptionEndsAt !== null &&
    dayjs(data.subscriptionEndsAt).isBefore(dayjs());

  async function bajar(
    ish: () => Promise<unknown>,
    muvaffaqiyat: string,
  ): Promise<void> {
    setAmalXatosi(null);
    try {
      await ish();
      message.success(muvaffaqiyat);
    } catch (e) {
      setAmalXatosi(errorMessage(e));
      throw e;
    }
  }

  return (
    <Space direction="vertical" size="large" className="w-full">
      {amalXatosi !== null && (
        <Alert type="error" showIcon message={amalXatosi} />
      )}

      <Descriptions column={1} size="small">
        <Descriptions.Item label="Holat">
          <Tag color={status.color}>{status.label}</Tag>
        </Descriptions.Item>
        {data.blockReason !== null && (
          <Descriptions.Item label="Bloklash sababi">
            {data.blockReason}
            {data.blockedAt !== null && ` (${formatDate(data.blockedAt)})`}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Direktorlar">
          {data.directors.length === 0
            ? '—'
            : data.directors
                .map((d) => `${d.fullName} · ${d.phone}`)
                .join(', ')}
        </Descriptions.Item>
      </Descriptions>

      <div className="flex flex-wrap gap-8">
        <Statistic title="Stadionlar" value={data.stats.venueCount} />
        <Statistic title="Xodimlar" value={data.stats.memberCount} />
        <Statistic title="Bronlar" value={data.stats.bookingCount} />
      </div>

      {qoldaBloklangan ? (
        <div>
          {muddatOtgan && (
            <Alert
              className="!mb-3"
              type="warning"
              showIcon
              message="Obuna muddati o'tgan"
              description="Blokdan chiqarish yetarli emas: muddat o'tgani uchun tashkilot baribir yopiq qoladi. Avval obuna muddatini uzaytiring."
            />
          )}
          <Popconfirm
            title="Blokdan chiqarilsinmi?"
            okText="Ha"
            cancelText="Yo'q"
            onConfirm={() =>
              void bajar(
                () => unblock.mutateAsync(),
                'Tashkilot blokdan chiqarildi',
              ).catch(() => undefined)
            }
          >
            <Button loading={unblock.isPending} block>
              Blokdan chiqarish
            </Button>
          </Popconfirm>
        </div>
      ) : (
        <Button danger block onClick={() => setBlockOpen(true)}>
          Tashkilotni bloklash
        </Button>
      )}

      <BlockModal
        open={blockOpen}
        busy={block.isPending}
        onCancel={() => setBlockOpen(false)}
        onSubmit={async (reason) => {
          await bajar(() => block.mutateAsync(reason), 'Tashkilot bloklandi');
          setBlockOpen(false);
        }}
      />

      <Tabs
        items={[
          {
            key: 'profile',
            label: 'Profil',
            children: (
              <Form<ProfileValues>
                layout="vertical"
                initialValues={{
                  name: data.name,
                  phone: data.phone ?? undefined,
                  address: data.address ?? undefined,
                  subscriptionEndsAt: data.subscriptionEndsAt
                    ? dayjs(data.subscriptionEndsAt)
                    : null,
                }}
                onFinish={(values) =>
                  void bajar(
                    () =>
                      update.mutateAsync({
                        name: values.name,
                        phone: values.phone,
                        address: values.address,
                        // `null` — muddatsiz. Maydon bo'shatilsa aynan
                        // shu yuboriladi.
                        subscriptionEndsAt:
                          values.subscriptionEndsAt?.toISOString() ?? null,
                      }),
                    'Saqlandi',
                  ).catch(() => undefined)
                }
              >
                <Form.Item
                  name="name"
                  label="Nomi"
                  rules={[{ required: true, message: 'Nomini kiriting' }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item name="phone" label="Telefon">
                  <Input placeholder="+998712000000" />
                </Form.Item>
                <Form.Item name="address" label="Manzil">
                  <Input />
                </Form.Item>
                <Form.Item
                  name="subscriptionEndsAt"
                  label="Obuna tugash sanasi"
                  extra="Bo'sh qoldirilsa — muddatsiz"
                >
                  <DatePicker className="w-full" />
                </Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={update.isPending}
                >
                  Saqlash
                </Button>
              </Form>
            ),
          },
          {
            key: 'members',
            label: 'Xodimlar',
            children: <MembersTab id={id} />,
          },
          {
            key: 'venues',
            label: 'Stadionlar',
            children: <VenuesTab id={id} />,
          },
        ]}
      />
    </Space>
  );
}

export function OrganizationCardDrawer({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  return (
    <Drawer
      open={id !== null}
      onClose={onClose}
      size="large"
      title="Tashkilot"
      destroyOnHidden
    >
      {id !== null && <OrganizationCardBody key={id} id={id} />}
    </Drawer>
  );
}
