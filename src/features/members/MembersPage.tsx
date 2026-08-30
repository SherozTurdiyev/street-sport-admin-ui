import { useState } from "react";
import { Alert, Card, Input, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { errorMessage } from "@/shared/api/error-handler";
import { DEFAULT_PAGE_SIZE, ROLE_LABELS } from "@/shared/api/types";
import { formatDateTime } from "@/shared/format/time";
import type { Member, MemberRole, MembersQuery } from "./api";
import { useMembers } from "./hooks";

const ROLE_OPTIONS: { value: MemberRole; label: string }[] = [
  { value: "DIRECTOR", label: ROLE_LABELS.DIRECTOR },
  { value: "MANAGER", label: ROLE_LABELS.MANAGER },
  { value: "VENUE_ADMIN", label: ROLE_LABELS.VENUE_ADMIN },
];

const STATUS_OPTIONS = [
  { value: true, label: "Faol" },
  { value: false, label: "Faolsiz" },
];

const columns: ColumnsType<Member> = [
  { title: "Ism", dataIndex: "fullName" },
  { title: "Telefon", dataIndex: "phone" },
  {
    title: "Lavozim",
    dataIndex: "role",
    render: (value: MemberRole) => ROLE_LABELS[value],
  },
  {
    title: "Holat",
    dataIndex: "isActive",
    render: (value: boolean) =>
      value ? <Tag color="green">Faol</Tag> : <Tag>Faolsiz</Tag>,
  },
  {
    title: "Oxirgi kirish",
    dataIndex: "lastLoginAt",
    render: (value: string | null) => formatDateTime(value),
  },
];

export function MembersPage() {
  const [query, setQuery] = useState<MembersQuery>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const { data, isFetching, error } = useMembers(query);

  /**
   * Filtr o'zgarganda sahifa BIRINCHIGA qaytadi. Aks holda 5-sahifada
   * turgan foydalanuvchi 2 ta natija beradigan filtrni qo'yib, bo'sh
   * jadval ko'radi va sababini tushunmaydi.
   */
  function setFilter(patch: Partial<MembersQuery>): void {
    setQuery((prev) => ({ ...prev, ...patch, page: 1 }));
  }

  return (
    <Card title="Xodimlar">
      <Space className="mb-4" wrap>
        <Input.Search
          aria-label="Qidiruv"
          placeholder="Ism yoki telefon"
          allowClear
          onSearch={(value) => setFilter({ search: value || undefined })}
        />
        <Select
          aria-label="Lavozim"
          className="w-44"
          placeholder="Lavozim"
          allowClear
          options={ROLE_OPTIONS}
          value={query.role}
          onChange={(value?: MemberRole) => setFilter({ role: value })}
        />
        <Select
          aria-label="Holat"
          className="w-36"
          placeholder="Holat"
          allowClear
          options={STATUS_OPTIONS}
          value={query.isActive}
          onChange={(value?: boolean) => setFilter({ isActive: value })}
        />
      </Space>

      {error === null ? null : (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          message={errorMessage(error)}
        />
      )}

      <Table<Member>
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isFetching}
        // Sahifalash SERVER tomonda: nomlar backend bilan bir xil
        // (`page`, `pageSize`), shuning uchun o'girish kerak emas.
        pagination={{
          current: query.page,
          pageSize: query.pageSize,
          total: data?.total ?? 0,
          showSizeChanger: false,
        }}
        onChange={(pagination) =>
          setQuery((prev) => ({
            ...prev,
            page: pagination.current ?? 1,
            pageSize: pagination.pageSize ?? DEFAULT_PAGE_SIZE,
          }))
        }
      />
    </Card>
  );
}
