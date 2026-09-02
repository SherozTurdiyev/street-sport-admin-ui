import { useState } from 'react';
import {
  Alert,
  App,
  Button,
  Image,
  Popconfirm,
  Space,
  Tag,
  Typography,
} from 'antd';
import { assetUrl } from '@/shared/api/client';
import { errorMessage } from '@/shared/api/error-handler';
import { useAddPhoto, useRemovePhoto, useVenue } from './hooks';

const ACCEPT = 'image/jpeg,image/png,image/webp';

export function PhotosTab({ venueId }: { venueId: string }) {
  const { message } = App.useApp();
  const { data } = useVenue(venueId);
  const add = useAddPhoto(venueId);
  const remove = useRemovePhoto(venueId);
  const [xato, setXato] = useState<string | null>(null);

  if (!data) return null;

  async function yukla(file: File): Promise<void> {
    setXato(null);
    try {
      await add.mutateAsync(file);
      message.success('Rasm yuklandi');
    } catch (e) {
      // `VENUE_PHOTO_INVALID` (tip yoki hajm) va `VENUE_PHOTO_LIMIT`
      // (10 tadan oshdi) — ikkalasining matni backenddan keladi.
      setXato(errorMessage(e));
    }
  }

  return (
    <Space direction="vertical" size="middle" className="w-full">
      {xato !== null && <Alert type="error" showIcon message={xato} />}

      <Typography.Paragraph type="secondary" className="!mb-0">
        JPEG, PNG yoki WebP; 5 MB gacha; bitta stadionga 10 tagacha. Birinchi
        yuklangan rasm asosiy bo‘ladi.
      </Typography.Paragraph>

      <input
        aria-label="Rasm fayli"
        type="file"
        accept={ACCEPT}
        disabled={add.isPending}
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Maydon tozalanadi: bir xil faylni ikkinchi marta tanlaganda
          // `change` hodisasi umuman kelmasdi.
          e.target.value = '';
          if (file) void yukla(file);
        }}
      />

      <Space wrap>
        {data.photos.map((photo) => (
          <Space key={photo.id} direction="vertical" align="center">
            {/* `url` ishlatiladi, `key` emas: `key` ichki tafsilot va u
                kelajakda o'zgarishi mumkin. */}
            <Image
              src={assetUrl(photo.url)}
              alt="Stadion rasmi"
              width={160}
              height={110}
              style={{ objectFit: 'cover' }}
            />
            {photo.isPrimary && <Tag color="blue">Asosiy</Tag>}
            <Popconfirm
              title="Rasm o‘chirilsinmi?"
              okText="Ha"
              cancelText="Yo‘q"
              onConfirm={() =>
                void remove
                  .mutateAsync(photo.id)
                  .then(() => message.success('Rasm o‘chirildi'))
                  .catch((e: unknown) => setXato(errorMessage(e)))
              }
            >
              <Button type="text" danger size="small">
                O‘chirish
              </Button>
            </Popconfirm>
          </Space>
        ))}
      </Space>
    </Space>
  );
}
