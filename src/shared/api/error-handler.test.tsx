import { useState } from 'react';
import { Button, Form, Input } from 'antd';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { applyServerErrors, errorMessage } from './error-handler';
import type { ApiError } from './errors';

function validationError(messages: string[]): ApiError {
  return {
    code: 'VALIDATION_FAILED',
    message: "Yuborilgan ma'lumot noto'g'ri.",
    status: 400,
    details: { message: messages },
  };
}

function TestForm({ error }: { error: ApiError }) {
  const [form] = Form.useForm();
  const [umumiy, setUmumiy] = useState<string | null>(null);

  return (
    <Form form={form} layout="vertical">
      <Form.Item label="Ism" name="fullName">
        <Input />
      </Form.Item>
      <Button
        onClick={() => {
          if (!applyServerErrors(form, error, ['fullName'])) {
            setUmumiy(errorMessage(error));
          }
        }}
      >
        Yuborish
      </Button>
      {umumiy === null ? null : <div role="alert">{umumiy}</div>}
    </Form>
  );
}

describe('Server validatsiya xatosi', () => {
  it('mos maydonning ostiga tushadi', async () => {
    const text = 'fullName must be longer than or equal to 3 characters';
    render(<TestForm error={validationError([text])} />);

    await userEvent.click(screen.getByRole('button', { name: 'Yuborish' }));

    expect(await screen.findByText(text)).toBeInTheDocument();
    // Umumiy joyda takrorlanmaydi: maydon topilgan.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('maydon topilmasa umumiy joyda ko`rsatiladi', async () => {
    render(
      <TestForm error={validationError(['phone must be a valid number'])} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Yuborish' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Yuborilgan ma'lumot noto'g'ri.",
    );
  });
});
