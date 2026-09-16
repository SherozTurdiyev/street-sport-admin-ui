import {
  Alert,
  App,
  Button,
  Card,
  Skeleton,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { errorMessage } from '@/shared/api/error-handler';
import { useActivateSurvey, useDeactivateSurvey, useSurvey } from './hooks';
import { SurveyResponsesTab } from './SurveyResponsesTab';
import { SurveyStatsTab } from './SurveyStatsTab';

const TABS = ['stats', 'responses'] as const;
type Tab = (typeof TABS)[number];
const isTab = (v: string | null): v is Tab =>
  v !== null && (TABS as readonly string[]).includes(v);

export function SurveyResultsPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isPending, error } = useSurvey(id);
  const activate = useActivateSurvey();
  const deactivate = useDeactivateSurvey();

  const tabParam = searchParams.get('tab');
  const tab: Tab = isTab(tabParam) ? tabParam : 'stats';

  if (error !== null) {
    return <Alert type="error" showIcon message={errorMessage(error)} />;
  }
  if (isPending) return <Skeleton active />;

  function almashtir(): void {
    const p = data!.isActive
      ? deactivate.mutateAsync(data!.id)
      : activate.mutateAsync(data!.id);
    p.then(() =>
      message.success(
        data!.isActive
          ? 'So‘rovnoma to‘xtatildi'
          : 'So‘rovnoma faollashtirildi',
      ),
    ).catch((e: unknown) => message.error(errorMessage(e)));
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <Card className="sahifa-kartochka">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Typography.Title level={4} className="m-0 break-words">
              {data.title}
            </Typography.Title>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {data.isActive ? (
                <Tag color="green">Faol</Tag>
              ) : (
                <Tag>Nofaol</Tag>
              )}
              <Typography.Text type="secondary">
                {data.responseCount} ta javob
              </Typography.Text>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void navigate(`/platform/surveys/${data.id}/edit`)}
            >
              Tahrirlash
            </Button>
            <Button
              type={data.isActive ? 'default' : 'primary'}
              loading={activate.isPending || deactivate.isPending}
              onClick={almashtir}
            >
              {data.isActive ? 'To‘xtatish' : 'Faollashtirish'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="sahifa-kartochka">
        <Tabs
          activeKey={tab}
          onChange={(key) => setSearchParams({ tab: key }, { replace: true })}
          items={[
            {
              key: 'stats',
              label: 'Statistika',
              children: <SurveyStatsTab id={data.id} />,
            },
            {
              key: 'responses',
              label: 'Javoblar',
              children: <SurveyResponsesTab survey={data} />,
            },
          ]}
        />
      </Card>
    </div>
  );
}
