import { Alert, Card, Empty, Skeleton, Table, Typography } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { figma } from '@/shared/theme/tokens';
import type { Occupancy, ReportRange } from '../api';
import { useOccupancy } from '../hooks';
import { ShareBar } from '../ShareBar';

type VenueRow = Occupancy['byVenue'][number];

function Raqam({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex flex-col gap-1 p-4"
      style={{
        background: 'rgba(27, 12, 54, 0.6)',
        border: `1px solid ${figma.border}`,
        borderRadius: figma.radiusCard,
      }}
    >
      <span style={{ color: figma.textMuted, fontSize: 12 }}>{label}</span>
      <Typography.Text strong style={{ fontSize: 22 }}>
        {value}
      </Typography.Text>
    </div>
  );
}

const hh = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

/**
 * F10.4 — bandlik. TZ buni "eng qimmatli tahliliy hisobot" deb ataydi:
 * egasi qaysi soatlar bo'sh qolayotganini ko'radi va o'sha vaqtga
 * chegirma qo'yishi mumkin.
 *
 * Soatlar 0 dan 23 gacha HAMMASI chiziladi. Stadion yopiq bo'lgan soat
 * ham qatorda qoladi va "yopiq" deb belgilanadi — uni yashirish
 * "bu soat band bo'lmagan" degan noto'g'ri taassurot qoldirardi.
 */
export function OccupancyTab({ range }: { range: ReportRange }) {
  const { data, isPending, isFetching, error } = useOccupancy(range, true);

  if (error !== null) {
    return <Alert type="error" showIcon message={errorMessage(error)} />;
  }
  if (isPending || !data) return <Skeleton active />;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Raqam label="OCHIQ SOAT" value={`${data.totals.openHours} soat`} />
        <Raqam label="BAND SOAT" value={`${data.totals.bookedHours} soat`} />
        <Raqam label="BANDLIK" value={`${data.totals.occupancyPercent}%`} />
      </div>

      <Card title="Stadionlar" styles={{ body: { padding: 0 } }}>
        <Table<VenueRow>
          rowKey="venueId"
          dataSource={data.byVenue}
          loading={isFetching}
          pagination={false}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: <Empty description="Stadion yo‘q" /> }}
          columns={[
            { title: 'Stadion', dataIndex: 'venueName' },
            {
              title: 'Ochiq',
              responsive: ['sm'],
              dataIndex: 'openHours',
              align: 'right',
              render: (v: number) => `${v} soat`,
            },
            {
              title: 'Band',
              responsive: ['sm'],
              dataIndex: 'bookedHours',
              align: 'right',
              render: (v: number) => `${v} soat`,
            },
            {
              title: 'Bandlik',
              dataIndex: 'occupancyPercent',
              width: 200,
              render: (percent: number, row) => (
                <ShareBar
                  percent={percent}
                  tone={row.openHours === 0 ? 'muted' : 'normal'}
                  label={row.openHours === 0 ? 'yopiq' : `${percent}%`}
                />
              ),
            },
          ]}
        />
      </Card>

      <Card title="Soatlar kesimi">
        <div className="flex flex-col gap-2">
          {data.byHour.map((soat) => {
            const yopiq = soat.openHours === 0;
            return (
              <div key={soat.hour} className="flex items-center gap-3">
                <span
                  className="w-12 shrink-0 tabular-nums"
                  style={{ color: figma.textMuted, fontSize: 13 }}
                >
                  {hh(soat.hour)}
                </span>
                <div className="min-w-0 flex-1">
                  <ShareBar
                    percent={soat.occupancyPercent}
                    tone={yopiq ? 'muted' : 'normal'}
                    label={
                      yopiq
                        ? 'yopiq'
                        : `${soat.occupancyPercent}% · ${soat.bookedHours}/${soat.openHours} soat`
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
