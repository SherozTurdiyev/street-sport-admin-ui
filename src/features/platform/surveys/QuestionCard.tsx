import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Card, Form, Input, Select, Switch } from 'antd';
import type { FormInstance } from 'antd';
import {
  QUESTION_TYPE_OPTIONS,
  isChoice,
  type SurveyFormValues,
} from './model';

const VARIANT_MAX = 30;

type Props = {
  form: FormInstance<SurveyFormValues>;
  name: number;
  index: number;
  total: number;
  locked: boolean;
  move: (from: number, to: number) => void;
  remove: (index: number) => void;
};

/**
 * Bitta savol. Qulflangan holatda FAQAT matn maydonlari ochiq —
 * backend baribir tekshiradi, lekin foydalanuvchi 409 ga urilib
 * qolmasligi uchun bu yerda oldindan cheklanadi.
 */
export function QuestionCard({
  form,
  name,
  index,
  total,
  locked,
  move,
  remove,
}: Props) {
  const type = Form.useWatch(['questions', name, 'type'], form);

  return (
    <Card
      size="small"
      title={`${index + 1}-savol`}
      extra={
        <div className="flex gap-1">
          <Button
            size="small"
            aria-label="Yuqoriga"
            icon={<ArrowUpOutlined aria-hidden />}
            disabled={locked || index === 0}
            onClick={() => move(index, index - 1)}
          />
          <Button
            size="small"
            aria-label="Pastga"
            icon={<ArrowDownOutlined aria-hidden />}
            disabled={locked || index === total - 1}
            onClick={() => move(index, index + 1)}
          />
          <Button
            size="small"
            danger
            aria-label="Savolni o‘chirish"
            icon={<DeleteOutlined aria-hidden />}
            disabled={locked || total === 1}
            onClick={() => remove(index)}
          />
        </div>
      }
    >
      <Form.Item name={[name, 'id']} hidden>
        <Input />
      </Form.Item>

      <div className="grid gap-x-4 sm:grid-cols-[1fr_220px]">
        <Form.Item
          name={[name, 'text']}
          label="Savol matni"
          rules={[
            {
              required: true,
              whitespace: true,
              message: 'Savol matnini kiriting',
            },
            { max: 500 },
          ]}
        >
          <Input.TextArea autoSize={{ minRows: 1, maxRows: 4 }} />
        </Form.Item>
        <Form.Item name={[name, 'type']} label="Savol turi">
          <Select
            options={QUESTION_TYPE_OPTIONS}
            disabled={locked}
            onChange={(next) => {
              // Tanlov turiga o'tganda kamida ikkita bo'sh variant
              // bo'lsin — aks holda foydalanuvchi ularni qo'lda qo'shishi
              // kerakligini sezmay qolardi.
              const joriy = form.getFieldValue([
                'questions',
                name,
                'options',
              ]) as unknown[] | undefined;
              if (isChoice(next) && (joriy?.length ?? 0) < 2) {
                form.setFieldValue(
                  ['questions', name, 'options'],
                  [{ text: '' }, { text: '' }],
                );
              }
            }}
          />
        </Form.Item>
      </div>

      <Form.Item
        name={[name, 'required']}
        label="Majburiy"
        valuePropName="checked"
        className="mb-2"
      >
        <Switch disabled={locked} />
      </Form.Item>

      {type !== undefined && isChoice(type) && (
        <Form.List name={[name, 'options']}>
          {(fields, { add, remove: removeOption, move: moveOption }) => (
            <div className="flex flex-col gap-2">
              {fields.map((field, j) => (
                <div key={field.key} className="flex items-start gap-2">
                  <Form.Item name={[field.name, 'id']} hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name={[field.name, 'text']}
                    className="mb-0 flex-1"
                    rules={[
                      {
                        required: true,
                        whitespace: true,
                        message: 'Variant matnini kiriting',
                      },
                      { max: 300 },
                    ]}
                  >
                    <Input aria-label={`Variant ${j + 1}`} />
                  </Form.Item>
                  <Button
                    aria-label="Variantni yuqoriga"
                    icon={<ArrowUpOutlined aria-hidden />}
                    disabled={locked || j === 0}
                    onClick={() => moveOption(j, j - 1)}
                  />
                  <Button
                    danger
                    aria-label="Variantni o‘chirish"
                    icon={<DeleteOutlined aria-hidden />}
                    disabled={locked || fields.length <= 2}
                    onClick={() => removeOption(j)}
                  />
                </div>
              ))}
              <Button
                type="dashed"
                icon={<PlusOutlined aria-hidden />}
                disabled={locked || fields.length >= VARIANT_MAX}
                onClick={() => add({ text: '' })}
                className="self-start"
              >
                Variant qo‘shish
              </Button>
            </div>
          )}
        </Form.List>
      )}
    </Card>
  );
}
