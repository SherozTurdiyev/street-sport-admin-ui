import { BellOutlined } from '@ant-design/icons';
import { Badge, Button, Tooltip } from 'antd';
import { figma } from '@/shared/theme/tokens';

/**
 * Bildirishnomalar tugmasi (Figma: 2020:8491).
 *
 * Bildirishnomalar moduli hali yo'q, shuning uchun `count` standart
 * qiymati 0 va belgi KO'RINMAYDI. Bo'sh qizil nuqta chizish yolg'on
 * bo'lardi: foydalanuvchi bosib, hech narsa topmasdi. Manba paydo
 * bo'lganda faqat shu proplarga son uzatiladi.
 */
export function NotificationsBell({
  count = 0,
  onClick,
}: {
  count?: number;
  onClick?: () => void;
}) {
  const title =
    count === 0 ? 'Bildirishnoma yo‘q' : `${count} ta yangi bildirishnoma`;

  return (
    <Tooltip title={title}>
      <Badge
        count={count}
        size="small"
        offset={[-4, 4]}
        color={figma.danger}
        // Nol ko'rsatilmaydi: bo'sh belgi diqqatni behuda tortadi.
        showZero={false}
      >
        <Button
          shape="circle"
          aria-label={`Bildirishnomalar: ${title}`}
          icon={<BellOutlined aria-hidden />}
          onClick={onClick}
        />
      </Badge>
    </Tooltip>
  );
}
