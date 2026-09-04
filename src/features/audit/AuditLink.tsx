import { FileSearchOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { Link } from 'react-router';
import { useCan } from '@/features/auth/hooks';
import { auditQuery } from './entity-link';

/**
 * "Tarix" havolasi — obyekt sahifasidan tayyor filtrlangan jurnalga.
 *
 * `audit.view` yo'q foydalanuvchiga UMUMAN chizilmaydi: havola
 * ko'rinib, bosilganda "ruxsat yo'q" chiqishi eng chalg'ituvchi
 * holat bo'lardi.
 */
export function AuditLink({
  actorId,
  entityType,
  entityId,
  label = 'Tarix',
}: {
  actorId?: string;
  entityType?: string;
  entityId?: string;
  label?: string;
}) {
  const can = useCan();
  if (!can('audit.view')) return null;

  return (
    <Link to={auditQuery({ actorId, entityType, entityId })}>
      <Button icon={<FileSearchOutlined aria-hidden />}>{label}</Button>
    </Link>
  );
}
