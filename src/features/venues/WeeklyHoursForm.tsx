import { useState } from 'react';
import {
  Alert,
  App,
  Button,
  Space,
  Switch,
  TimePicker,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { errorMessage } from '@/shared/api/error-handler';
import type { VenueHours } from './api';
import { WEEKDAYS } from './enums';
import { useSetVenueHours, useVenueHours } from './hooks';

dayjs.extend(customParseFormat);

const FORMAT = 'HH:mm';
const DEFAULT_OPEN = '08:00';
const DEFAULT_CLOSE = '23:00';

type DayState = { open: boolean; opensAt: string; closesAt: string };

/** Serverdagi ro'yxatni yettala kunlik holatga yoyadi. */
function toState(hours: VenueHours[]): Record<number, DayState> {
  const byDay = new Map(hours.map((h) => [h.weekday, h]));
  return Object.fromEntries(
    WEEKDAYS.map(({ value }) => {
      const found = byDay.get(value);
      return [
        value,
        {
          open: found !== undefined,
          opensAt: found?.opensAt ?? DEFAULT_OPEN,
          closesAt: found?.closesAt ?? DEFAULT_CLOSE,
        },
      ];
    }),
  );
}

/** Yopiq kun massivga UMUMAN kirmaydi — backend uchun "yopiq" shu degani. */
function toPayload(state: Record<number, DayState>): VenueHours[] {
  return WEEKDAYS.filter(({ value }) => state[value]?.open).map(({ value }) => {
    const day = state[value] as DayState;
    return { weekday: value, opensAt: day.opensAt, closesAt: day.closesAt };
  });
}

export function WeeklyHoursForm({ venueId }: { venueId: string }) {
  const { message } = App.useApp();
  const { data, isPending, error } = useVenueHours(venueId);
  const save = useSetVenueHours(venueId);
  const [draft, setDraft] = useState<Record<number, DayState> | null>(null);
  const [saqlashXatosi, setSaqlashXatosi] = useState<string | null>(null);

  if (error !== null) {
    return <Alert type="error" showIcon message={errorMessage(error)} />;
  }
  if (isPending || !data)
    return <Typography.Text>Yuklanmoqda…</Typography.Text>;

  const state = draft ?? toState(data);

  function patch(weekday: number, next: Partial<DayState>): void {
    setDraft({
      ...state,
      [weekday]: { ...(state[weekday] as DayState), ...next },
    });
  }

  async function saqlash(): Promise<void> {
    setSaqlashXatosi(null);
    try {
      await save.mutateAsync(toPayload(state));
      message.success('Ish vaqti saqlandi');
      setDraft(null);
    } catch (e) {
      setSaqlashXatosi(errorMessage(e));
    }
  }

  return (
    <Space direction="vertical" size="middle" className="w-full">
      {saqlashXatosi !== null && (
        <Alert type="error" showIcon message={saqlashXatosi} />
      )}

      {/* Jadval TO'LIQ almashtiriladi, shuning uchun yettala kun ham
          doim ko'rinadi. "Kun qo'shish" tugmasi bo'lganda dushanbani
          tahrirlagan odam qolgan kunlarni bilmasdan yopib qo'yardi. */}
      <Typography.Paragraph type="secondary" className="!mb-0">
        Belgisi olingan kun — o‘sha kuni stadion yopiq. Yarim tundan o‘tuvchi
        vaqt qo‘llab-quvvatlanadi: 18:00 → 02:00.
      </Typography.Paragraph>

      {WEEKDAYS.map(({ value, label }) => {
        const day = state[value] as DayState;
        return (
          <div key={value} className="flex items-center gap-4">
            <Switch
              aria-label={label}
              checked={day.open}
              onChange={(open) => patch(value, { open })}
            />
            <span className="w-28">{label}</span>
            {day.open ? (
              <>
                <TimePicker
                  aria-label={`${label} ochilish`}
                  format={FORMAT}
                  minuteStep={15}
                  allowClear={false}
                  value={dayjs(day.opensAt, FORMAT)}
                  onChange={(v) =>
                    v && patch(value, { opensAt: v.format(FORMAT) })
                  }
                />
                <TimePicker
                  aria-label={`${label} yopilish`}
                  format={FORMAT}
                  minuteStep={15}
                  allowClear={false}
                  value={dayjs(day.closesAt, FORMAT)}
                  onChange={(v) =>
                    v && patch(value, { closesAt: v.format(FORMAT) })
                  }
                />
              </>
            ) : (
              <Typography.Text type="secondary">Yopiq</Typography.Text>
            )}
          </div>
        );
      })}

      <Button
        type="primary"
        loading={save.isPending}
        onClick={() => void saqlash()}
      >
        Ish vaqtini saqlash
      </Button>
    </Space>
  );
}
