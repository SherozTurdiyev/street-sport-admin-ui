import { Alert, Card, Empty, Progress, Skeleton, Typography } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { formatDateTime } from '@/shared/format/time';
import type { SurveyStatsQuestion } from './api';
import { useSurveyStats } from './hooks';
import { foiz } from './model';

export function SurveyStatsTab({ id }: { id: string }) {
  const { data, isPending, error } = useSurveyStats(id);

  if (error !== null) {
    return <Alert type="error" showIcon message={errorMessage(error)} />;
  }
  if (isPending) return <Skeleton active />;
  if (data.responseCount === 0) {
    return <Empty description="Hali javob yo‘q" />;
  }

  return (
    <div className="flex flex-col gap-4">
      {data.questions.map((q, i) => (
        <Card
          key={q.questionId}
          size="small"
          title={
            // Uzun savol sarlavhada kesilib qolmasin.
            <span className="whitespace-normal">{`${i + 1}. ${q.text}`}</span>
          }
          extra={
            <Typography.Text type="secondary">
              {q.answered} ta javob
            </Typography.Text>
          }
        >
          <SavolNatijasi q={q} />
        </Card>
      ))}
    </div>
  );
}

function Qator({
  nom,
  count,
  answered,
}: {
  nom: string;
  count: number;
  answered: number;
}) {
  const p = foiz(count, answered);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4">
      <span className="truncate">{nom}</span>
      <Typography.Text type="secondary">{`${count} ta · ${p}%`}</Typography.Text>
      <Progress percent={p} showInfo={false} className="col-span-2 m-0" />
    </div>
  );
}

function SavolNatijasi({ q }: { q: SurveyStatsQuestion }) {
  if (q.type === 'SINGLE_CHOICE' || q.type === 'MULTI_CHOICE') {
    return (
      <div className="flex flex-col gap-3">
        {q.type === 'MULTI_CHOICE' && (
          <Typography.Text type="secondary">
            Bir nechta tanlash mumkin — yig‘indi 100% dan oshishi mumkin.
          </Typography.Text>
        )}
        {q.options.map((o) => (
          <Qator
            key={o.optionId}
            nom={o.text}
            count={o.count}
            answered={q.answered}
          />
        ))}
      </div>
    );
  }

  if (q.type === 'RATING') {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <Typography.Text type="secondary">O‘rtacha baho</Typography.Text>
          <div className="text-3xl font-semibold">{q.average ?? '—'}</div>
        </div>
        {[5, 4, 3, 2, 1].map((baho) => (
          <Qator
            key={baho}
            nom={`${baho} ★`}
            count={q.distribution[baho - 1] ?? 0}
            answered={q.answered}
          />
        ))}
      </div>
    );
  }

  // `SINGLE || MULTI` sharti union'ni toraytirmaydi — bu yerda tur
  // aniq tekshirilmasa `latest` TypeScript uchun noma'lum.
  if (q.type !== 'TEXT') return null;
  if (q.latest.length === 0) {
    return <Typography.Text type="secondary">Hali javob yo‘q</Typography.Text>;
  }
  return (
    <div className="flex flex-col gap-3">
      {q.latest.map((a, j) => (
        <div key={j} className="border-l-2 border-gray-200 pl-3">
          <div className="whitespace-pre-wrap break-words">{a.text}</div>
          <Typography.Text type="secondary" className="text-xs">
            {formatDateTime(a.createdAt)}
          </Typography.Text>
        </div>
      ))}
      {q.answered > q.latest.length && (
        <Typography.Text type="secondary">
          Oxirgi {q.latest.length} tasi. Barchasi — “Javoblar” tabida.
        </Typography.Text>
      )}
    </div>
  );
}
