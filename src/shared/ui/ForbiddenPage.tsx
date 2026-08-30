import { Result } from 'antd';

/**
 * Xabar matni bu yerda yozilgan, chunki bu holatda server bilan gaplashish
 * umuman bo'lmagan: marshrut klient tomonda to'silgan.
 */
export function ForbiddenPage() {
  return (
    <Result
      status="403"
      title="Ruxsat yo'q"
      subTitle="Bu bo'limga kirish huquqingiz yo'q. Kerak bo'lsa direktorga murojaat qiling."
    />
  );
}
