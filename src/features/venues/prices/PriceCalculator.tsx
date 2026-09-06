import { useState } from 'react';
import {
  Alert,
  Button,
  DatePicker,
  Space,
  Statistic,
  Table,
  Typography,
} from 'antd';
import type { Dayjs } from 'dayjs';
import { errorMessage } from '@/shared/api/error-handler';
import { formatMoney } from '@/shared/format/money';
import { formatDateTime, tashkentToIso } from '@/shared/format/time';
import { SHOW_TIME } from '@/shared/ui/timePicker';
import type { PriceSegment } from './api';
import { useCalculatePrice } from './hooks';

const PICKER_FORMAT = 'YYYY-MM-DD HH:mm';

export function PriceCalculator({ venueId }: { venueId: string }) {
  const calculate = useCalculatePrice(venueId);
  const [from, setFrom] = useState<Dayjs | null>(null);
  const [to, setTo] = useState<Dayjs | null>(null);
  const [xato, setXato] = useState<string | null>(null);

  async function hisobla(): Promise<void> {
    if (!from || !to) return;
    setXato(null);
    try {
      await calculate.mutateAsync({
        // Tanlangan devor soati Toshkent vaqti deb o'qiladi: stadion
        // o'sha yerda va foydalanuvchi boshqa mintaqada bo'lishi mumkin.
        startsAt: tashkentToIso(from.format(PICKER_FORMAT)),
        endsAt: tashkentToIso(to.format(PICKER_FORMAT)),
      });
    } catch (e) {
      setXato(errorMessage(e));
    }
  }

  return (
    <Space direction="vertical" size="middle" className="w-full">
      <Typography.Text strong>Narx kalkulyatori</Typography.Text>

      {xato !== null && <Alert type="error" showIcon message={xato} />}

      <Space wrap>
        <DatePicker
          aria-label="Boshlanishi"
          showTime={SHOW_TIME}
          format={PICKER_FORMAT}
          value={from}
          onChange={setFrom}
        />
        <DatePicker
          aria-label="Tugashi"
          showTime={SHOW_TIME}
          format={PICKER_FORMAT}
          value={to}
          onChange={setTo}
        />
        <Button
          type="primary"
          loading={calculate.isPending}
          disabled={!from || !to}
          onClick={() => void hisobla()}
        >
          Hisoblash
        </Button>
      </Space>

      {calculate.data && (
        <>
          <Statistic
            title="Jami"
            formatter={() => formatMoney(calculate.data.totalPrice)}
          />
          {/* Segmentlar ATAYLAB ko'rsatiladi: bron narx zonasi
              chegarasidan o'tsa bo'linadi va "nega shuncha?" degan savol
              shu ro'yxatda javob topadi.

              `section` nomi bilan: bu bo'limda uchta jadval bor va
              ularni ajratib bo'lishi kerak. */}
          <section aria-label="Narx segmentlari">
            <Table<PriceSegment>
              scroll={{ x: 'max-content' }}
              rowKey="from"
              size="small"
              pagination={false}
              dataSource={calculate.data.segments}
              columns={[
                {
                  title: 'Boshlanishi',
                  dataIndex: 'from',
                  render: (v: string) => formatDateTime(v),
                },
                {
                  title: 'Tugashi',
                  responsive: ['md'],
                  dataIndex: 'to',
                  render: (v: string) => formatDateTime(v),
                },
                {
                  title: 'Daqiqa',
                  responsive: ['sm'],
                  dataIndex: 'minutes',
                },
                { title: 'Tarif', dataIndex: 'ruleName' },
                {
                  title: 'Soatiga',
                  responsive: ['md'],
                  dataIndex: 'pricePerHour',
                  render: (v: string) => formatMoney(v),
                },
                {
                  title: 'Summa',
                  dataIndex: 'price',
                  render: (v: string) => formatMoney(v),
                },
              ]}
            />
          </section>
        </>
      )}
    </Space>
  );
}
