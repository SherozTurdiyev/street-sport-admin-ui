import { Alert, Card, Descriptions, Skeleton } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { formatDate } from '@/shared/format/time';
import { useOrganization } from './hooks';

const NONE = '—';

export function OrganizationPage() {
  const { data, isPending, error } = useOrganization();

  if (error)
    return <Alert type="error" showIcon message={errorMessage(error)} />;
  if (isPending) return <Skeleton active />;

  return (
    <Card title={data.name}>
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Telefon">
          {data.phone ?? NONE}
        </Descriptions.Item>
        <Descriptions.Item label="Manzil">
          {data.address ?? NONE}
        </Descriptions.Item>
        <Descriptions.Item label="Vaqt mintaqasi">
          {data.timezone}
        </Descriptions.Item>
        <Descriptions.Item label="Valyuta">{data.currency}</Descriptions.Item>
        <Descriptions.Item label="Obuna">
          {data.subscriptionStatus}
        </Descriptions.Item>
        <Descriptions.Item label="Obuna tugaydi">
          {formatDate(data.subscriptionEndsAt)}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
