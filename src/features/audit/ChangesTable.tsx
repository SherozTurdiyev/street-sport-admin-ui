import { Table, Typography } from 'antd';
import { figma } from '@/shared/theme/tokens';
import type { AuditChange } from './api';

const NONE = '—';

/**
 * Kengaytirilgan qatordagi jadval: Maydon — Eski — Yangi.
 *
 * Asosiy jadvalga sig'dirilmadi: bitta amal beshta maydonni
 * o'zgartirishi mumkin va ular qator balandligini o'nlab piksel qilib
 * yuborardi — "bugun nechta amal bo'ldi" degan savolga ko'z bilan
 * javob berib bo'lmasdi.
 */
export function ChangesTable({ changes }: { changes: AuditChange[] }) {
  return (
    <Table<AuditChange>
      rowKey="field"
      dataSource={changes}
      pagination={false}
      size="small"
      scroll={{ x: 'max-content' }}
      columns={[
        { title: 'Maydon', dataIndex: 'label' },
        {
          title: 'Eski',
          dataIndex: 'old',
          render: (value: string | null) => (
            <Typography.Text style={{ color: figma.textMuted }}>
              {value ?? NONE}
            </Typography.Text>
          ),
        },
        {
          title: 'Yangi',
          dataIndex: 'new',
          render: (value: string | null) => (
            <Typography.Text strong>{value ?? NONE}</Typography.Text>
          ),
        },
      ]}
    />
  );
}
