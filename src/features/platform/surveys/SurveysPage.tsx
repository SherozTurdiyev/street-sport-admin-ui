import { useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Pagination,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router';
import { errorMessage } from '@/shared/api/error-handler';
import { DEFAULT_PAGE_SIZE, type PageQuery } from '@/shared/api/types';
import { formatDateTime } from '@/shared/format/time';
import type { SurveyListItem } from './api';
import {
  useActivateSurvey,
  useDeactivateSurvey,
  useDeleteSurvey,
  useSurveys,
} from './hooks';

/**
 * Platforma so'rovnomalari. Bir vaqtda faqat BITTASI faol — landing
 * aynan shuni ko'rsatadi.
 */
export function SurveysPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState<PageQuery>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const { data, isPending, error } = useSurveys(query);
  const activate = useActivateSurvey();
  const deactivate = useDeactivateSurvey();
  const remove = useDeleteSurvey();

  const items = data?.items ?? [];

  function bajar(p: Promise<unknown>, ok: string): void {
    p.then(() => message.success(ok)).catch((e: unknown) =>
      message.error(errorMessage(e)),
    );
  }

  /**
   * Faol so'rovnoma boshqa sahifada bo'lishi mumkin — shunda nomi
   * noma'lum, lekin ogohlantirish baribir kerak.
   */
  function faollashtirishSavoli(row: SurveyListItem): string {
    const faol = items.find((x) => x.isActive && x.id !== row.id);
    return faol
      ? `«${faol.title}» to‘xtatiladi. Davom etasizmi?`
      : 'Faol so‘rovnoma bo‘lsa, u to‘xtatiladi. Davom etasizmi?';
  }

  const ustunlar = [
    {
      title: 'Nomi',
      dataIndex: 'title',
      render: (v: string, row: SurveyListItem) => (
        <Link to={`/platform/surveys/${row.id}`}>{v}</Link>
      ),
    },
    {
      title: 'Holat',
      dataIndex: 'isActive',
      render: (v: boolean) =>
        v ? <Tag color="green">Faol</Tag> : <Tag>Nofaol</Tag>,
    },
    { title: 'Javoblar', dataIndex: 'responseCount' },
    {
      title: 'Yaratilgan',
      dataIndex: 'createdAt',
      render: (v: string) => formatDateTime(v),
    },
    {
      title: 'Amallar',
      key: 'amallar',
      render: (_: unknown, row: SurveyListItem) => (
        <Space wrap size="small">
          {row.isActive ? (
            <Button
              size="small"
              loading={deactivate.isPending && deactivate.variables === row.id}
              onClick={() =>
                bajar(deactivate.mutateAsync(row.id), 'So‘rovnoma to‘xtatildi')
              }
            >
              To‘xtatish
            </Button>
          ) : (
            <Popconfirm
              title={faollashtirishSavoli(row)}
              okText="Ha"
              cancelText="Yo‘q"
              onConfirm={() =>
                bajar(
                  activate.mutateAsync(row.id),
                  'So‘rovnoma faollashtirildi',
                )
              }
            >
              <Button size="small" type="primary">
                Faollashtirish
              </Button>
            </Popconfirm>
          )}
          <Button
            size="small"
            onClick={() => void navigate(`/platform/surveys/${row.id}/edit`)}
          >
            Tahrirlash
          </Button>
          {row.responseCount > 0 ? (
            <Tooltip title="Javoblari bor — o‘chirib bo‘lmaydi">
              {/* O'chiq tugma hodisa bermaydi — tooltip `span` da. */}
              <span>
                <Button size="small" danger disabled>
                  O‘chirish
                </Button>
              </span>
            </Tooltip>
          ) : (
            <Popconfirm
              title="So‘rovnoma o‘chirilsinmi?"
              okText="Ha"
              cancelText="Yo‘q"
              onConfirm={() =>
                bajar(remove.mutateAsync(row.id), 'So‘rovnoma o‘chirildi')
              }
            >
              <Button size="small" danger>
                O‘chirish
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      className="sahifa-kartochka"
      title="So‘rovnomalar"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined aria-hidden />}
          onClick={() => void navigate('/platform/surveys/new')}
        >
          Yangi so‘rovnoma
        </Button>
      }
    >
      <Typography.Paragraph type="secondary">
        Faol so‘rovnoma landing saytidagi “So‘rovnoma” sahifasida ko‘rinadi. Bir
        vaqtda faqat bittasi faol bo‘ladi.
      </Typography.Paragraph>

      {error !== null && (
        <Alert type="error" message={errorMessage(error)} className="mb-4" />
      )}

      <Table
        rowKey="id"
        loading={isPending}
        dataSource={items}
        columns={ustunlar}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />

      {(data?.total ?? 0) > (query.pageSize ?? DEFAULT_PAGE_SIZE) && (
        <Pagination
          className="mt-6"
          align="end"
          current={query.page}
          pageSize={query.pageSize}
          total={data?.total ?? 0}
          showSizeChanger={false}
          onChange={(page) => setQuery((prev) => ({ ...prev, page }))}
        />
      )}
    </Card>
  );
}
