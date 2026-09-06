import { useState } from 'react';
import { Alert, Button, Card, Checkbox, Input, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Link } from 'react-router';
import { errorMessage } from '@/shared/api/error-handler';
import { DEFAULT_PAGE_SIZE } from '@/shared/api/types';
import { displayPhone } from '@/shared/format/phone';
import { useCan } from '@/features/auth/hooks';
import type { Customer, CustomersQuery } from './api';
import { CustomerFormModal } from './CustomerFormModal';
import { useCustomers } from './hooks';

export function CustomersPage() {
  const [query, setQuery] = useState<CustomersQuery>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [formOpen, setFormOpen] = useState(false);
  const { data, isFetching, error } = useCustomers(query);
  const can = useCan();

  function setFilter(patch: Partial<CustomersQuery>): void {
    setQuery((prev) => ({ ...prev, ...patch, page: 1 }));
  }

  const columns: ColumnsType<Customer> = [
    {
      title: 'Ism',
      dataIndex: 'fullName',
      render: (value: string, row) => (
        <Link to={`/customers/${row.id}`}>{value}</Link>
      ),
    },
    {
      title: 'Telefon',
      dataIndex: 'phone',
      render: (value: string) => displayPhone(value),
    },
    {
      title: 'Teglar',
      responsive: ['md'],
      dataIndex: 'tags',
      render: (tags: string[]) =>
        tags.length === 0 ? '—' : tags.map((t) => <Tag key={t}>{t}</Tag>),
    },
    {
      title: 'Holat',
      responsive: ['sm'],
      dataIndex: 'isBlacklisted',
      render: (value: boolean) =>
        value ? <Tag color="error">Qora ro‘yxat</Tag> : <Tag>Oddiy</Tag>,
    },
  ];

  return (
    <Card
      className="sahifa-kartochka"
      title="Mijozlar"
      extra={
        can('customer.manage') && (
          <Button type="primary" onClick={() => setFormOpen(true)}>
            Yangi mijoz
          </Button>
        )
      }
    >
      <Space className="filtr-qatori mb-6" wrap>
        <Input.Search
          aria-label="Qidiruv"
          placeholder="Ism yoki telefon"
          allowClear
          onSearch={(value) => setFilter({ search: value || undefined })}
        />
        <Checkbox
          onChange={(e) =>
            setFilter({ blacklistedOnly: e.target.checked || undefined })
          }
        >
          Faqat qora ro‘yxat
        </Checkbox>
      </Space>

      {error === null ? null : (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          message={errorMessage(error)}
        />
      )}

      <Table<Customer>
        rowKey="id"
        size="small"
        loading={isFetching}
        dataSource={data?.items ?? []}
        columns={columns}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: query.page,
          pageSize: query.pageSize,
          total: data?.total ?? 0,
          showSizeChanger: false,
          onChange: (page) => setQuery((prev) => ({ ...prev, page })),
        }}
      />

      <CustomerFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </Card>
  );
}
