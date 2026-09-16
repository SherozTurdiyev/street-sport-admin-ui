import { useState } from 'react';
import { Alert, Descriptions, Drawer, Pagination, Table } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { DEFAULT_PAGE_SIZE, type PageQuery } from '@/shared/api/types';
import { displayPhone } from '@/shared/format/phone';
import { formatDateTime } from '@/shared/format/time';
import type { SurveyDetail, SurveyResponseView } from './api';
import { useSurveyResponses } from './hooks';
import { javobMatni } from './model';

export function SurveyResponsesTab({ survey }: { survey: SurveyDetail }) {
  const [query, setQuery] = useState<PageQuery>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [ochiq, setOchiq] = useState<SurveyResponseView | null>(null);
  const { data, isPending, error } = useSurveyResponses(survey.id, query);

  const ustunlar = [
    {
      title: 'Vaqti',
      dataIndex: 'createdAt',
      render: (v: string) => formatDateTime(v),
    },
    ...(survey.collectContact
      ? [
          { title: 'Ism', dataIndex: 'fullName' },
          {
            title: 'Telefon',
            dataIndex: 'phone',
            render: (v: string | null) =>
              v ? (
                <a href={`tel:${v}`} onClick={(e) => e.stopPropagation()}>
                  {displayPhone(v)}
                </a>
              ) : (
                '—'
              ),
          },
        ]
      : []),
    {
      title: 'Javob berilgan savollar',
      key: 'soni',
      render: (_: unknown, row: SurveyResponseView) =>
        `${row.answers.length} / ${survey.questions.length}`,
    },
  ];

  return (
    <>
      {error !== null && (
        <Alert type="error" message={errorMessage(error)} className="mb-4" />
      )}
      <Table
        rowKey="id"
        loading={isPending}
        dataSource={data?.items ?? []}
        columns={ustunlar}
        pagination={false}
        scroll={{ x: 'max-content' }}
        onRow={(row) => ({
          onClick: () => setOchiq(row),
          style: { cursor: 'pointer' },
        })}
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

      <Drawer
        open={ochiq !== null}
        onClose={() => setOchiq(null)}
        width="min(520px, 92vw)"
        title={
          ochiq?.fullName ?? (ochiq ? formatDateTime(ochiq.createdAt) : '')
        }
        destroyOnHidden
      >
        {ochiq !== null && (
          <Descriptions column={1} layout="vertical" size="small">
            {survey.questions.map((q) => (
              <Descriptions.Item key={q.id} label={q.text}>
                <span className="whitespace-pre-wrap break-words">
                  {javobMatni(
                    q,
                    ochiq.answers.find((a) => a.questionId === q.id),
                  )}
                </span>
              </Descriptions.Item>
            ))}
          </Descriptions>
        )}
      </Drawer>
    </>
  );
}
