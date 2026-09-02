import { Alert, Skeleton, Space, Tag, Typography } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { formatMoney } from '@/shared/format/money';
import { WEEKDAYS } from '../enums';
import { usePriceTable } from './hooks';

/**
 * Qoidalar ro'yxatini o'qib "soat 19:00 da qancha?" degan savolga javob
 * berish qiyin — prioritet, kun va vaqt oralig'i bir-biriga qo'shilib
 * ketadi. Panjara o'sha javobni tayyor ko'rsatadi va qoida noto'g'ri
 * yozilganini darhol ochib beradi.
 */
const COLORS = [
  'geekblue',
  'magenta',
  'gold',
  'cyan',
  'purple',
  'volcano',
  'lime',
] as const;

export function PriceTable({ venueId }: { venueId: string }) {
  const { data, isPending, error } = usePriceTable(venueId);

  if (error !== null) {
    return <Alert type="error" showIcon message={errorMessage(error)} />;
  }
  if (isPending || !data) return <Skeleton active />;

  // Rang qoidaga biriktiriladi, narxga emas: bir xil narxli ikki qoida
  // ham farqlanib turishi kerak.
  const ruleNames = new Map<string, string>();
  for (const day of data.days) {
    for (const cell of day.hours) ruleNames.set(cell.ruleId, cell.ruleName);
  }
  const colorOf = new Map(
    [...ruleNames.keys()].map((id, i) => [
      id,
      COLORS[i % COLORS.length] as string,
    ]),
  );

  const byWeekday = new Map(data.days.map((d) => [d.weekday, d.hours]));

  return (
    <Space direction="vertical" size="middle" className="w-full">
      <div className="overflow-x-auto">
        <table
          aria-label="Haftalik narx jadvali"
          className="w-full border-collapse text-center"
        >
          <thead>
            <tr>
              <th scope="col" className="p-1 text-xs font-normal" />
              {Array.from({ length: 24 }, (_, hour) => (
                <th
                  key={hour}
                  scope="col"
                  className="p-1 text-xs font-normal opacity-60"
                >
                  {hour}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WEEKDAYS.map(({ value, short, label }) => (
              <tr key={value}>
                <th scope="row" className="p-1 text-xs font-normal">
                  {short}
                </th>
                {Array.from({ length: 24 }, (_, hour) => {
                  const cell = byWeekday.get(value)?.[hour];
                  if (!cell) return <td key={hour} className="p-1" />;
                  return (
                    <td key={hour} className="p-0.5">
                      {/* Sichqoncha ostida to'liq ma'lumot: rang o'zi
                          narxni aytmaydi. */}
                      <Tag
                        color={colorOf.get(cell.ruleId)}
                        title={`${label} ${hour}:00 — ${cell.ruleName} · ${formatMoney(cell.pricePerHour)}`}
                        className="!m-0 !w-full !px-0"
                      >
                        &nbsp;
                      </Tag>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Space wrap>
        {[...ruleNames].map(([id, name]) => (
          <Tag key={id} color={colorOf.get(id)}>
            {name}
          </Tag>
        ))}
      </Space>

      <Typography.Text type="secondary">
        Ustunlar — Toshkent mahalliy soati.
      </Typography.Text>
    </Space>
  );
}
