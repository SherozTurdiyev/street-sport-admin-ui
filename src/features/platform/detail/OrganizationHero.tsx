import { useState } from 'react';
import { Alert, App, Button, Popconfirm, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { errorMessage } from '@/shared/api/error-handler';
import { displayPhone } from '@/shared/format/phone';
import { figma } from '@/shared/theme/tokens';
import type { PlatformOrganizationDetail } from '../api';
import { BlockModal } from '../BlockModal';
import { STATUS_VIEW } from '../status';
import { useBlockOrganization, useUnblockOrganization } from '../hooks';

/**
 * Figma (2009:4387): sahifa boshidagi karta — chapda nom va holat,
 * o'ngda ajratuvchi chiziq ortida direktorlar.
 */
export function OrganizationHero({ org }: { org: PlatformOrganizationDetail }) {
  const { message } = App.useApp();
  const block = useBlockOrganization(org.id);
  const unblock = useUnblockOrganization(org.id);
  const [xato, setXato] = useState<string | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);

  const status = STATUS_VIEW[org.effectiveStatus];

  /**
   * Tugmalar `isBlocked` ga EMAS, ustunga qaraydi — backend ham shunday
   * qaraydi. Obunasi o'z-o'zidan tugagan tashkilot `isBlocked: true`
   * bo'ladi, lekin qo'lda bloklanmagan: uni bloklash mumkin va kerak,
   * chunki bu ikki xil hodisa va ikkalasining ham izi qoladi.
   */
  const qoldaBloklangan = org.subscriptionStatus === 'SUSPENDED';

  /**
   * Blokdan chiqarish YETARLI bo'lmasligi mumkin: obuna sanasi o'tib
   * ketgan bo'lsa, holat `SUSPENDED` dan `EXPIRED` ga o'tadi, xolos.
   */
  const muddatOtgan =
    org.subscriptionEndsAt !== null &&
    dayjs(org.subscriptionEndsAt).isBefore(dayjs());

  async function bajar(
    ish: () => Promise<unknown>,
    muvaffaqiyat: string,
  ): Promise<void> {
    setXato(null);
    try {
      await ish();
      message.success(muvaffaqiyat);
    } catch (e) {
      setXato(errorMessage(e));
      throw e;
    }
  }

  return (
    <div
      className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center"
      style={{
        background: 'rgba(27, 12, 54, 0.6)',
        border: `1px solid ${figma.border}`,
        borderRadius: figma.radiusCard,
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <Typography.Title
            level={1}
            style={{ fontSize: 'clamp(20px, 5vw, 28px)', margin: 0 }}
          >
            {org.name}
          </Typography.Title>
          <Tag color={status.color}>{status.label}</Tag>
        </div>

        <div className="mt-2 flex flex-wrap gap-x-4" style={{ fontSize: 13 }}>
          <span>ORG-{org.id.slice(0, 8)}</span>
          {org.phone !== null && <span>{displayPhone(org.phone)}</span>}
          {org.address !== null && <span>{org.address}</span>}
        </div>

        {org.blockReason !== null && (
          <Alert
            className="!mt-3"
            type="error"
            showIcon
            message="Bloklangan"
            description={`${org.blockReason}${
              org.blockedAt === null
                ? ''
                : ` — ${dayjs(org.blockedAt).format('DD.MM.YYYY')}`
            }`}
          />
        )}
        {xato !== null && (
          <Alert className="!mt-3" type="error" showIcon message={xato} />
        )}
      </div>

      {/* Figma'da direktorlar bloki vertikal chiziq bilan ajratilgan. */}
      <div
        className="lg:border-l lg:pl-6"
        style={{ borderColor: figma.border }}
      >
        <div
          className="uppercase"
          style={{
            color: figma.textMuted,
            fontSize: 11,
            letterSpacing: '0.5px',
          }}
        >
          Tashkilot direktori
        </div>
        <div className="mt-1">
          {org.directors.length === 0 ? (
            <Typography.Text type="warning">
              Direktor biriktirilmagan
            </Typography.Text>
          ) : (
            org.directors.map((d) => (
              <div key={d.userId}>
                <Typography.Text strong>{d.fullName}</Typography.Text>{' '}
                <span style={{ color: figma.textMuted }}>
                  {displayPhone(d.phone)}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="mt-4">
          {qoldaBloklangan ? (
            <>
              {muddatOtgan && (
                <Alert
                  className="!mb-3"
                  type="warning"
                  showIcon
                  message="Obuna muddati o'tgan"
                  description="Blokdan chiqarish yetarli emas: muddat o'tgani uchun tashkilot baribir yopiq qoladi. Avval obuna muddatini uzaytiring."
                />
              )}
              <Popconfirm
                title="Blokdan chiqarilsinmi?"
                okText="Ha"
                cancelText="Yo'q"
                onConfirm={() =>
                  void bajar(
                    () => unblock.mutateAsync(),
                    'Tashkilot blokdan chiqarildi',
                  ).catch(() => undefined)
                }
              >
                <Button loading={unblock.isPending}>Blokdan chiqarish</Button>
              </Popconfirm>
            </>
          ) : (
            <Button danger onClick={() => setBlockOpen(true)}>
              Tashkilotni bloklash
            </Button>
          )}
        </div>
      </div>

      <BlockModal
        open={blockOpen}
        busy={block.isPending}
        onCancel={() => setBlockOpen(false)}
        onSubmit={async (reason) => {
          await bajar(() => block.mutateAsync(reason), 'Tashkilot bloklandi');
          setBlockOpen(false);
        }}
      />
    </div>
  );
}
