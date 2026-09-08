import { useState } from 'react';
import { Alert, Card, Pagination, Select, Table, Tag, Typography } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { DEFAULT_PAGE_SIZE } from '@/shared/api/types';
import { displayPhone } from '@/shared/format/phone';
import { formatDateTime } from '@/shared/format/time';
import type { DemoRequest, DemoRequestsQuery } from './api';
import { STATUS_OPTIONS, STATUS_VIEW } from './status';
import { useDemoRequests } from './hooks';
import { DemoRequestDrawer } from './DemoRequestDrawer';

/**
 * Landing formasidan kelgan demo so'rovlari. Bu StreetSport ning O'Z
 * sotuv ma'lumoti — tashkilot rollari bu bo'limga umuman kirmaydi.
 */
export function DemoRequestsPage() {
  const [query, setQuery] = useState<DemoRequestsQuery>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [ochiq, setOchiq] = useState<DemoRequest | null>(null);
  const { data, isPending, error } = useDemoRequests(query);

  const items = data?.items ?? [];

  const ustunlar = [
    {
      title: 'Kelgan vaqti',
      dataIndex: 'createdAt',
      render: (v: string) => formatDateTime(v),
    },
    { title: 'Ism', dataIndex: 'fullName' },
    {
      title: 'Telefon',
      dataIndex: 'phone',
      render: (v: string) => (
        // Qatorni bosish oynani ochadi, shuning uchun havola bosilganda
        // tarqalish to'xtatiladi — aks holda ikkalasi birga ishlardi.
        <a href={`tel:${v}`} onClick={(e) => e.stopPropagation()}>
          {displayPhone(v)}
        </a>
      ),
    },
    {
      title: 'Shahar',
      dataIndex: 'city',
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'Stadionlar',
      dataIndex: 'venueCount',
      render: (v: number | null) => v ?? '—',
    },
    {
      title: 'Holat',
      dataIndex: 'status',
      render: (v: DemoRequest['status']) => (
        <Tag color={STATUS_VIEW[v].color}>{STATUS_VIEW[v].label}</Tag>
      ),
    },
  ];

  return (
    <Card className="sahifa-kartochka" title="Murojaatlar">
      <Typography.Paragraph type="secondary">
        Landing saytidagi demo formasidan kelgan so‘rovlar. Yangisi birinchi
        turadi.
      </Typography.Paragraph>

      <div className="filtr-qatori mb-6">
        <Select
          aria-label="Holat"
          placeholder="Barcha holatlar"
          allowClear
          style={{ minWidth: 200 }}
          options={STATUS_OPTIONS}
          value={query.status}
          onChange={(status) =>
            setQuery((prev) => ({ ...prev, status, page: 1 }))
          }
        />
      </div>

      {error !== null && (
        <Alert type="error" message={errorMessage(error)} className="mb-4" />
      )}

      <Table
        rowKey="id"
        loading={isPending}
        dataSource={items}
        columns={ustunlar}
        pagination={false}
        // Tor ekranda jadval O'ZI suriladi, sahifa emas.
        scroll={{ x: 'max-content' }}
        onRow={(row) => ({
          onClick: () => setOchiq(row),
          style: { cursor: 'pointer' },
        })}
      />

      {(data?.total ?? 0) > 0 && (
        <Pagination
          className="mt-6"
          align="end"
          current={query.page}
          pageSize={query.pageSize}
          total={data?.total ?? 0}
          showSizeChanger={false}
          onChange={(page) => setQuery((prev) => ({ ...prev, page }))}
        />
      )}

      <DemoRequestDrawer murojaat={ochiq} onClose={() => setOchiq(null)} />
    </Card>
  );
}
