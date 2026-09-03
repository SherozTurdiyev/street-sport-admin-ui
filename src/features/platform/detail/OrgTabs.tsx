import { Empty, Skeleton, Table, Typography } from 'antd';
import { DEFAULT_PAGE_SIZE, ROLE_LABELS } from '@/shared/api/types';
import { displayPhone } from '@/shared/format/phone';
import { formatDateTime } from '@/shared/format/time';
import { VenueCard } from '@/features/venues/VenueCard';
import { PlatformVenueLink } from '../venues/PlatformVenueLink';
import type { OrganizationMember } from '../api';
import { useOrganizationMembers, useOrganizationVenues } from '../hooks';

const PAGE = { page: 1, pageSize: DEFAULT_PAGE_SIZE };

export function OrgMembersTab({ id }: { id: string }) {
  const { data, isFetching } = useOrganizationMembers(id, PAGE);
  return (
    <Table<OrganizationMember>
      rowKey="id"
      size="small"
      loading={isFetching}
      dataSource={data?.items ?? []}
      pagination={false}
      scroll={{ x: 'max-content' }}
      columns={[
        { title: 'Ism', dataIndex: 'fullName' },
        {
          title: 'Telefon',
          dataIndex: 'phone',
          render: (value: string) => displayPhone(value),
        },
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

export function OrgVenuesTab({ id }: { id: string }) {
  const { data, isPending, isFetching } = useOrganizationVenues(id, PAGE);
  const items = data?.items ?? [];

  return (
    <>
      {/* Arxivlanganlar ham ko'rinadi — shunda ro'yxat kartochkadagi
          `venueCount` bilan mos keladi va farqi sababsiz qolmaydi. */}
      <Typography.Paragraph type="secondary">
        Arxivlangan stadionlar ham ko‘rsatiladi.
      </Typography.Paragraph>

      {isPending ? (
        <Skeleton active />
      ) : items.length === 0 ? (
        <Empty description="Tashkilotda stadion yo‘q" />
      ) : (
        <div
          // Figma (2009:4486): kartochka 256 keng, oralig'i 24. Ustunlar
          // soni qotirilmaydi — tor oynada kartochka siqilib ketardi.
          className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,256px),1fr))] gap-4 sm:gap-6"
          style={{ opacity: isFetching ? 0.6 : 1 }}
        >
          {items.map((venue) => (
            // Havola platformaning O'Z sahifasiga: `/venues/:id`
            // tashkilot ichidagi sahifa va platforma xodimiga yopiq
            // (BR-08/BR-09).
            <VenueCard
              key={venue.id}
              venue={venue}
              actions={<PlatformVenueLink venue={venue} />}
            />
          ))}
        </div>
      )}
    </>
  );
}
