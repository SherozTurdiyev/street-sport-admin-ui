import { PlusOutlined } from '@ant-design/icons';
import { Alert, App, Button, Card, Form, Input, Skeleton, Switch } from 'antd';
import { useNavigate, useParams } from 'react-router';
import { errorMessage } from '@/shared/api/error-handler';
import type { SurveyDetail } from './api';
import { useCreateSurvey, useSurvey, useUpdateSurvey } from './hooks';
import {
  BOSH_FORMA,
  toFormValues,
  toInput,
  yangiSavol,
  type SurveyFormValues,
} from './model';
import { QuestionCard } from './QuestionCard';

const SAVOL_MAX = 50;

/** `/platform/surveys/new` va `/platform/surveys/:id/edit`. */
export function SurveyFormPage() {
  const { id = '' } = useParams<{ id: string }>();
  const survey = useSurvey(id);

  if (id === '') return <SurveyForm detail={null} />;
  if (survey.error !== null) {
    return <Alert type="error" showIcon message={errorMessage(survey.error)} />;
  }
  if (survey.isPending) return <Skeleton active />;
  // `key` — boshqa so'rovnoma ochilganda forma boshlang'ich qiymati
  // yangidan o'qiladi (antd `initialValues` faqat birinchi chizishda).
  return <SurveyForm key={survey.data.id} detail={survey.data} />;
}

function SurveyForm({ detail }: { detail: SurveyDetail | null }) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [form] = Form.useForm<SurveyFormValues>();
  const create = useCreateSurvey();
  const update = useUpdateSurvey();
  const locked = detail?.locked ?? false;

  async function saqla(values: SurveyFormValues): Promise<void> {
    const input = toInput(values);
    try {
      const saved = detail
        ? await update.mutateAsync({ id: detail.id, input })
        : await create.mutateAsync(input);
      message.success('So‘rovnoma saqlandi');
      void navigate(`/platform/surveys/${saved.id}`);
    } catch (e) {
      message.error(errorMessage(e));
    }
  }

  return (
    <Card
      className="sahifa-kartochka"
      title={detail ? 'So‘rovnomani tahrirlash' : 'Yangi so‘rovnoma'}
    >
      {locked && (
        <Alert
          type="warning"
          showIcon
          className="mb-6"
          message={`${detail?.responseCount ?? 0} ta javob bor — faqat matnni tuzatish mumkin`}
          description="Savol qo‘shish, o‘chirish, tartib va turini o‘zgartirish eski javoblarni buzadi."
        />
      )}

      <Form<SurveyFormValues>
        form={form}
        layout="vertical"
        initialValues={detail ? toFormValues(detail) : BOSH_FORMA}
        onFinish={(v) => void saqla(v)}
        requiredMark={false}
      >
        <Form.Item
          name="title"
          label="Nomi"
          rules={[
            { required: true, whitespace: true, message: 'Nomini kiriting' },
            { min: 3, message: 'Kamida 3 belgi' },
            { max: 200 },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Tavsif" rules={[{ max: 2000 }]}>
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} />
        </Form.Item>
        <Form.Item
          name="collectContact"
          label="Ism va telefon so‘ralsin"
          valuePropName="checked"
          extra="Yoqilsa, har telefon raqamidan bitta javob qabul qilinadi."
        >
          <Switch disabled={locked} />
        </Form.Item>

        <Form.List name="questions">
          {(fields, { add, remove, move }) => (
            <div className="flex flex-col gap-4">
              {fields.map((field, index) => (
                <QuestionCard
                  key={field.key}
                  form={form}
                  name={field.name}
                  index={index}
                  total={fields.length}
                  locked={locked}
                  move={move}
                  remove={remove}
                />
              ))}
              <Button
                type="dashed"
                icon={<PlusOutlined aria-hidden />}
                disabled={locked || fields.length >= SAVOL_MAX}
                onClick={() => add(yangiSavol())}
              >
                Savol qo‘shish
              </Button>
            </div>
          )}
        </Form.List>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button onClick={() => void navigate(-1)}>Bekor qilish</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={create.isPending || update.isPending}
          >
            Saqlash
          </Button>
        </div>
      </Form>
    </Card>
  );
}
