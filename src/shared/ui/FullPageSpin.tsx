import { Spin } from 'antd';

/** Sessiya tekshirilayotgan yoki sahifa yuklanayotgan paytdagi kutish. */
export function FullPageSpin() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spin size="large" />
    </div>
  );
}
