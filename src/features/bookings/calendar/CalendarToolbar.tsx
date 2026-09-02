import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button, DatePicker, Select, Space } from 'antd';
import dayjs from 'dayjs';
import { tashkentToday } from '@/shared/format/time';
import { useVenueOptions } from '@/features/venues/hooks';

const DATE = 'YYYY-MM-DD';

export function CalendarToolbar({
  date,
  onDate,
  venueIds,
  onVenueIds,
}: {
  date: string;
  onDate: (next: string) => void;
  venueIds: string[];
  onVenueIds: (next: string[]) => void;
}) {
  const venues = useVenueOptions(true);
  const bugun = tashkentToday();

  return (
    <Space wrap className="mb-6">
      <Button
        aria-label="Oldingi kun"
        icon={<LeftOutlined aria-hidden />}
        onClick={() => onDate(dayjs(date).subtract(1, 'day').format(DATE))}
      />
      <Button disabled={date === bugun} onClick={() => onDate(bugun)}>
        Bugun
      </Button>
      <Button
        aria-label="Keyingi kun"
        icon={<RightOutlined aria-hidden />}
        onClick={() => onDate(dayjs(date).add(1, 'day').format(DATE))}
      />
      <DatePicker
        aria-label="Sana"
        allowClear={false}
        format={DATE}
        value={dayjs(date)}
        onChange={(value) => value && onDate(value.format(DATE))}
      />
      {/* Filtr bo'sh bo'lsa so'rovga `venueIds` qo'shilmaydi va server
          foydalanuvchiga ochiq hamma stadionni beradi (BR-08). */}
      <Select
        aria-label="Stadionlar bo'yicha filtr"
        mode="multiple"
        allowClear
        className="min-w-64"
        placeholder="Barcha stadionlar"
        loading={venues.isPending}
        value={venueIds}
        onChange={onVenueIds}
        options={(venues.data ?? []).map((v) => ({
          value: v.id,
          label: v.name,
        }))}
      />
    </Space>
  );
}
