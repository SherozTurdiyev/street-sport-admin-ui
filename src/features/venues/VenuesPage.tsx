import { useState } from 'react';
import { FilterOutlined } from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Drawer,
  Empty,
  Grid,
  Input,
  Pagination,
  Select,
  Skeleton,
  Space,
} from 'antd';
import { Link } from 'react-router';
import { errorMessage } from '@/shared/api/error-handler';
import { figma } from '@/shared/theme/tokens';
import { DEFAULT_PAGE_SIZE } from '@/shared/api/types';
import type { VenuesQuery } from './api';
import {
  SPORT_TYPE_OPTIONS,
  VENUE_STATUS_OPTIONS,
  type SportType,
  type VenueStatus,
} from './enums';
import { VenueCard } from './VenueCard';
import { useVenues } from './hooks';

/**
 * Filtrlar BITTA joyda: ular ish stolida sahifa ustida, telefonda esa
 * chetdan chiqadigan oyna ichida turadi. Ikki nusxa yozilsa, bir xil
 * nomdagi ikkita maydon DOM da yonma-yon paydo bo'lardi — ekran
 * o'quvchisi uchun ham, testlar uchun ham chalkashlik.
 */
function Filtrlar({
  query,
  onFilter,
  vertikal,
}: {
  query: VenuesQuery;
  onFilter: (patch: Partial<VenuesQuery>) => void;
  vertikal: boolean;
}) {
  const kenglik = vertikal ? 'w-full' : undefined;

  return (
    <Space
      // `filtr-qatori` faqat tor ekranda ishlaydi va odatda bu yerga
      // yetib kelmaydi — telefonda oyna varianti chiziladi. U zaxira
      // uchun qoladi: `matchMedia` ishlamasa (juda eski brauzer),
      // sahifa gorizontal variantda qolib ketadi va sinf uni tartibga soladi.
      className={vertikal ? 'w-full' : 'filtr-qatori mb-6'}
      direction={vertikal ? 'vertical' : 'horizontal'}
      size="middle"
      style={vertikal ? { display: 'flex' } : undefined}
      wrap={!vertikal}
    >
      <Input.Search
        aria-label="Qidiruv"
        className={kenglik}
        placeholder="Nomi bo‘yicha"
        allowClear
        onSearch={(value) => onFilter({ search: value || undefined })}
      />
      <Input.Search
        aria-label="Shahar"
        className={kenglik}
        placeholder="Shahar"
        allowClear
        onSearch={(value) => onFilter({ city: value || undefined })}
      />
      <Select
        aria-label="Sport turi bo'yicha filtr"
        className={vertikal ? 'w-full' : 'w-48'}
        placeholder="Sport turi"
        allowClear
        options={SPORT_TYPE_OPTIONS}
        value={query.sportType}
        onChange={(value?: SportType) => onFilter({ sportType: value })}
      />
      <Select
        aria-label="Holat bo'yicha filtr"
        className={vertikal ? 'w-full' : 'w-44'}
        placeholder="Holat"
        allowClear
        options={VENUE_STATUS_OPTIONS}
        value={query.status}
        onChange={(value?: VenueStatus) => onFilter({ status: value })}
      />
    </Space>
  );
}

export function VenuesPage() {
  const [query, setQuery] = useState<VenuesQuery>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [filtrOchiq, setFiltrOchiq] = useState(false);
  /**
   * `Input.Search` boshqarilmaydi — yozilgan matn React holatida emas,
   * DOM da yashaydi. "Tozalash" bosilganda kalit o'zgaradi va maydonlar
   * qayta yaratiladi; aks holda tugma filtrni o'chirar, lekin yozuv
   * ekranda qolaverar va foydalanuvchi u hali ham ishlayapti deb o'ylardi.
   */
  const [tozalashKaliti, setTozalashKaliti] = useState(0);

  const { data, isPending, isFetching, error } = useVenues(query);

  /**
   * `xs` — antd da `(max-width: 575px)`, ya'ni telefon. Birinchi
   * renderda brekpoint hali noma'lum (`{}`) va sahifa ish stoli
   * ko'rinishida chiziladi; antd obunani `useLayoutEffect` da ochadi,
   * shuning uchun tuzatish brauzer chizishidan OLDIN yetib keladi va
   * ekranda hech narsa sakramaydi.
   */
  const screens = Grid.useBreakpoint();
  const mobil = screens.xs === true;

  function setFilter(patch: Partial<VenuesQuery>): void {
    setQuery((prev) => ({ ...prev, ...patch, page: 1 }));
  }

  function tozala(): void {
    setQuery({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
    setTozalashKaliti((n) => n + 1);
  }

  // Oynada filtrlar ko'rinmay qoladi — nechtasi yoqilganini raqam
  // aytib turadi. Usiz foydalanuvchi qisqargan ro'yxatni ko'rib,
  // nega bunday ekanini topa olmasdi.
  const faolFiltrlar = [
    query.search,
    query.city,
    query.sportType,
    query.status,
  ].filter((qiymat) => qiymat !== undefined && qiymat !== '').length;

  const items = data?.items ?? [];

  return (
    <Card
      title="Stadionlar"
      extra={
        <Link to="/venues/new">
          <Button type="primary">Yangi stadion</Button>
        </Link>
      }
    >
      {mobil ? (
        <div className="mb-4">
          {/* Rang ATAYLAB brend rangida: antd standarti qizil va u
              sarlavhadagi bildirishnoma soni bilan bir xil bo'lib
              qolardi, ya'ni "muammo bor" deb o'qilardi. Bu yerdagi
              raqam esa shunchaki nechta shart yoqilganini aytadi. */}
          <Badge count={faolFiltrlar} size="small" color={figma.primaryBright}>
            <Button
              icon={<FilterOutlined aria-hidden />}
              onClick={() => setFiltrOchiq(true)}
            >
              Filtrlar
            </Button>
          </Badge>
        </div>
      ) : (
        <Filtrlar
          key={tozalashKaliti}
          query={query}
          onFilter={setFilter}
          vertikal={false}
        />
      )}

      <Drawer
        title="Filtrlar"
        placement="right"
        // Kenglik ekrandan oshib ketmasligi kerak: 320px eng tor
        // telefonlarda ham to'liq ekranni egallab olardi.
        width="min(320px, 85vw)"
        open={mobil && filtrOchiq}
        onClose={() => setFiltrOchiq(false)}
        footer={
          <div className="flex justify-between gap-2">
            <Button disabled={faolFiltrlar === 0} onClick={tozala}>
              Tozalash
            </Button>
            <Button type="primary" onClick={() => setFiltrOchiq(false)}>
              Natijalarni ko‘rish
            </Button>
          </div>
        }
      >
        {/* Filtr tanlangan zahoti qo'llanadi — oyna esa ochiq qoladi,
            chunki odatda ketma-ket bir nechta shart tanlanadi. */}
        <Filtrlar
          key={tozalashKaliti}
          query={query}
          onFilter={setFilter}
          vertikal
        />
      </Drawer>

      {error === null ? null : (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          message={errorMessage(error)}
        />
      )}

      {isPending ? (
        <Skeleton active />
      ) : items.length === 0 ? (
        <Empty description="Stadion topilmadi" />
      ) : (
        <div
          // Panjara ekran kengligiga qarab o'zi moslashadi: ustunlar
          // soni qotirilsa, tor oynada kartochka siqilib ketardi.
          className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4 sm:gap-6"
          style={{ opacity: isFetching ? 0.6 : 1 }}
        >
          {items.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      )}

      {(data?.total ?? 0) > (query.pageSize ?? DEFAULT_PAGE_SIZE) && (
        <Pagination
          className="mt-6 text-right"
          align="end"
          current={query.page}
          pageSize={query.pageSize}
          total={data?.total ?? 0}
          showSizeChanger={false}
          onChange={(page) => setQuery((prev) => ({ ...prev, page }))}
        />
      )}
    </Card>
  );
}
