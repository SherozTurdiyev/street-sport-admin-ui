import { Table, Tag, Typography } from 'antd';
import { DEFAULT_PAGE_SIZE, ROLE_LABELS } from '@/shared/api/types';
import { formatDateTime } from '@/shared/format/time';
import {
  SPORT_TYPE_LABELS,
  VENUE_STATUS_VIEW,
  type SportType,
  type VenueStatus,
} from '@/features/venues/enums';
import type { OrganizationMember, OrganizationVenue } from '../api';
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

export function OrgVenuesTab({ id }: { id: string }) {
  const { data, isFetching } = useOrganizationVenues(id, PAGE);
  return (
    <>
      {/* Arxivlanganlar ham ko'rinadi — shunda ro'yxat kartochkadagi
          `venueCount` bilan mos keladi va farqi sababsiz qolmaydi. */}
      <Typography.Paragraph type="secondary">
        Arxivlangan stadionlar ham ko‘rsatiladi.
      </Typography.Paragraph>
      <Table<OrganizationVenue>
        rowKey="id"
        size="small"
        loading={isFetching}
        dataSource={data?.items ?? []}
        pagination={false}
        scroll={{ x: 'max-content' }}
        columns={[
          { title: 'Nomi', dataIndex: 'name' },
          {
            title: 'Sport turi',
            dataIndex: 'sportType',
            // Enum qiymati EMAS, yorlig'i. Noma'lum qiymat kelsa
            // (backend yangi tur qo'shsa) xom qiymat ko'rsatiladi —
            // bo'sh katakdan ko'ra shu foydaliroq.
            render: (value: string) =>
              SPORT_TYPE_LABELS[value as SportType] ?? value,
          },
          { title: 'Shahar', dataIndex: 'city' },
          {
            title: 'Holat',
            dataIndex: 'status',
            render: (value: string) => {
              const view = VENUE_STATUS_VIEW[value as VenueStatus];
              return view ? <Tag color={view.color}>{view.label}</Tag> : value;
            },
          },
        ]}
      />
    </>
  );
}
