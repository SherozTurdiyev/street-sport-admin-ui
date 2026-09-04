import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import { API, DIRECTOR_ME, authedHandlers } from '@/test/handlers';
import { AppRouter } from '@/app/router';
import { useCan } from '@/features/auth/hooks';
import { AuditLink } from './AuditLink';

/** Direktorda `audit.view` va `export.data` bor (TZ 4.3). */
const DIREKTOR = {
  ...DIRECTOR_ME,
  permissions: [...DIRECTOR_ME.permissions, 'audit.view', 'export.data'],
};

/** Menejerda audit ruxsati YO'Q — menyu testi shunga tayanadi. */
const MENEJER = {
  ...DIRECTOR_ME,
  userId: 'u-2',
  role: 'MANAGER',
  fullName: 'Bobur Menejerov',
  permissions: ['booking.create', 'report.occupancy'],
};

const YOZUVLAR = [
  {
    id: 'a-1',
    createdAt: '2026-09-04T09:12:03.114Z',
    action: 'price.rule_changed',
    actionLabel: "Narx qoidasi o'zgardi",
    entityType: 'price_rule',
    entityLabel: 'Narx qoidasi',
    entityId: 'p-1',
    actor: { id: 'u-1', name: 'Anvar Direktorov' },
    ip: '84.54.10.7',
    changes: [
      {
        field: 'pricePerHour',
        label: 'Narx (soatiga)',
        old: '100000',
        new: '120000',
      },
    ],
  },
  {
    id: 'a-2',
    createdAt: '2026-09-04T08:00:00.000Z',
    action: 'venue.settings_updated',
    actionLabel: "Stadion sozlamalari o'zgardi",
    entityType: 'venue',
    entityLabel: 'Stadion',
    entityId: 'v-1',
    actor: null,
    ip: null,
    changes: [],
  },
  {
    id: 'a-3',
    createdAt: '2026-09-04T07:00:00.000Z',
    action: 'booking.created',
    actionLabel: 'Bron yaratildi',
    entityType: 'booking',
    entityLabel: 'Bron',
    entityId: 'b-1',
    actor: { id: 'u-3', name: 'Davron Adminov' },
    ip: '10.0.0.5',
    changes: [],
  },
];

let soralgan: URL[] = [];

function baseHandlers(me: object = DIREKTOR) {
  return [
    ...authedHandlers(me),
    http.get(`${API}/audit-log/meta`, () =>
      HttpResponse.json({
        actions: [
          { value: 'booking.created', label: 'Bron yaratildi' },
          { value: 'price.rule_changed', label: "Narx qoidasi o'zgardi" },
        ],
        entityTypes: [
          { value: 'booking', label: 'Bron' },
          { value: 'price_rule', label: 'Narx qoidasi' },
        ],
      }),
    ),
    http.get(`${API}/audit-log`, ({ request }) => {
      const url = new URL(request.url);
      soralgan.push(url);
      const amal = url.searchParams.get('action');
      const items =
        amal === null
          ? YOZUVLAR
          : YOZUVLAR.filter((y) => amal.split(',').includes(y.action));
      return HttpResponse.json({
        items,
        total: items.length,
        page: 1,
        pageSize: 20,
      });
    }),
    http.get(`${API}/members`, () =>
      HttpResponse.json({
        items: [
          {
            id: 'm-1',
            userId: 'u-3',
            fullName: 'Davron Adminov',
            phone: '+998901110003',
            role: 'VENUE_ADMIN',
            isActive: true,
            venues: [],
          },
        ],
        total: 1,
        page: 1,
        pageSize: 100,
      }),
    ),
  ];
}

beforeEach(() => {
  soralgan = [];
});

describe('Audit jurnali sahifasi', () => {
  it('direktor yozuvlarni ko`radi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/audit' });

    const jadval = within(await screen.findByRole('table'));
    expect(jadval.getByText("Narx qoidasi o'zgardi")).toBeVisible();
    expect(jadval.getByText('04.09.2026 14:12')).toBeVisible();
    // Yon menyuda ham shu ism turadi — tekshiruv jadval ichida.
    expect(jadval.getByText('Anvar Direktorov')).toBeVisible();
    expect(jadval.getByText('84.54.10.7')).toBeVisible();
  });

  it('tizim yozgan amalda xodim o`rnida `Tizim` turadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/audit' });

    expect(await screen.findByText('Tizim')).toBeVisible();
  });

  it('audit ruxsati yo`q rolda menyuda bo`lim yo`q', async () => {
    server.use(...baseHandlers(MENEJER));
    renderApp(<AppRouter />, { route: '/dashboard' });

    const menyu = within(await screen.findByRole('menu'));
    expect(menyu.getByText('Boshqaruv paneli')).toBeVisible();
    expect(menyu.queryByText('Audit jurnali')).toBeNull();
  });

  it('qator ochilganda o`zgarishlar jadvali chiqadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/audit' });
    await screen.findByText("Narx qoidasi o'zgardi");

    // antd o'zbek lokalida tugma nomi — "Satirni yozish".
    const tugmalar = screen.getAllByRole('button', { name: 'Satirni yozish' });
    await userEvent.click(tugmalar[0]!);

    expect(await screen.findByText('Narx (soatiga)')).toBeVisible();
    expect(screen.getByText('100000')).toBeVisible();
    expect(screen.getByText('120000')).toBeVisible();
  });

  it('o`zgarishsiz yozuvda kengaytirish tugmasi yo`q', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/audit' });
    await screen.findByText("Narx qoidasi o'zgardi");

    // Uch yozuvdan faqat bittasida o'zgarish bor.
    expect(
      screen.getAllByRole('button', { name: 'Satirni yozish' }),
    ).toHaveLength(1);
  });

  it('stadion yozuvi stadion sahifasiga havola qiladi, bron — yo`q', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/audit' });

    const stadion = await screen.findByRole('link', { name: 'Stadion' });
    expect(stadion).toHaveAttribute('href', '/venues/v-1');
    // Bron adminkada kalendar ichida ochiladi — havola bo'lmaydi.
    expect(screen.queryByRole('link', { name: 'Bron' })).toBeNull();
  });

  it('URL dagi amal filtri so`rovga tushadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/audit?action=booking.created' });

    // "Bron yaratildi" filtr tegida ham turadi — tekshiruv jadval ichida.
    const jadval = within(await screen.findByRole('table'));
    expect(jadval.getByText('Bron yaratildi')).toBeVisible();
    expect(jadval.queryByText("Narx qoidasi o'zgardi")).toBeNull();
    const url = soralgan.at(-1);
    expect(url?.searchParams.get('action')).toBe('booking.created');
  });

  it('xodim filtri xodimlar ro`yxatidan to`ladi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/audit' });

    await userEvent.click(await screen.findByRole('combobox', { name: 'Xodim' }));

    expect(
      await screen.findByRole('option', { name: 'Davron Adminov' }),
    ).toBeInTheDocument();
  });

  it('`export.data` yo`q bo`lsa CSV tugmasi chizilmaydi', async () => {
    server.use(
      ...baseHandlers({
        ...DIRECTOR_ME,
        permissions: [...DIRECTOR_ME.permissions, 'audit.view'],
      }),
    );
    renderApp(<AppRouter />, { route: '/audit' });

    await screen.findByText("Narx qoidasi o'zgardi");
    expect(screen.queryByRole('button', { name: /CSV/i })).toBeNull();
  });
});

describe('Audit jurnali xatolari', () => {
  it('xato bo`lsa filtrlar ekranda qoladi', async () => {
    // MSW da BIRINCHI mos handler ishlaydi — xato javobi ro'yxat
    // boshida turishi kerak.
    server.use(
      http.get(`${API}/audit-log`, () =>
        HttpResponse.json(
          {
            code: 'REPORT_RANGE_INVALID',
            message: "Sana oralig'i noto'g'ri.",
          },
          { status: 400 },
        ),
      ),
      ...baseHandlers(),
    );
    renderApp(<AppRouter />, { route: '/audit?from=2020-01-01&to=2026-01-01' });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Sana oralig'i noto'g'ri.",
    );
    // Filtrlar joyida — foydalanuvchi tanlovini tuzatishi mumkin.
    expect(screen.getByRole('combobox', { name: 'Amal' })).toBeVisible();
  });
});

describe('Kontekstli "Tarix" havolasi', () => {
  it('tayyor filtr bilan jurnalga olib boradi', async () => {
    server.use(...baseHandlers());
    renderApp(<AuditLink entityType="booking" entityId="b-1" />);

    const havola = await screen.findByRole('link', { name: /Tarix/ });
    expect(havola).toHaveAttribute(
      'href',
      '/audit?entityType=booking&entityId=b-1',
    );
  });

  it('xodim havolasi `actorId` bilan ketadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AuditLink actorId="u-3" label="Xodim amallari" />);

    expect(
      await screen.findByRole('link', { name: /Xodim amallari/ }),
    ).toHaveAttribute('href', '/audit?actorId=u-3');
  });

  it('audit ruxsati yo`q bo`lsa umuman chizilmaydi', async () => {
    // Ko'rinib turgan, lekin bosilganda "ruxsat yo'q" chiqadigan havola
    // eng chalg'ituvchi holat bo'lardi.
    server.use(...baseHandlers(MENEJER));

    // Zond: menejerda BOR ruxsat. U ekranga chiqqanda ruxsatlar
    // yuklangani aniq bo'ladi va "havola yo'q" tekshiruvi ma'noga ega
    // bo'ladi — aks holda test hali yuklanmagan holatni tekshirardi.
    function Zond() {
      const can = useCan();
      return <>{can('booking.create') ? 'ruxsatlar yuklandi' : null}</>;
    }

    const { container } = renderApp(
      <>
        <AuditLink entityId="v-1" />
        <Zond />
      </>,
    );

    expect(await screen.findByText('ruxsatlar yuklandi')).toBeVisible();
    expect(container.querySelector('a')).toBeNull();
  });
});

describe('Aniq obyekt filtri', () => {
  it('teg bilan ko`rsatiladi va olib tashlanadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, {
      route: '/audit?entityType=booking&entityId=b-1',
    });

    // Belgisiz qolsa, bitta bronning tarixi "barcha bronlar" deb
    // o'qilardi.
    expect(await screen.findByText('Bitta obyekt')).toBeVisible();
    expect(soralgan.at(-1)?.searchParams.get('entityId')).toBe('b-1');

    // antd tegining yopish tugmasi — ikonka, matnsiz.
    const teg = screen.getByText('Bitta obyekt').closest('.ant-tag');
    await userEvent.click(teg!.querySelector('.ant-tag-close-icon')!);

    await waitFor(() =>
      expect(soralgan.at(-1)?.searchParams.get('entityId')).toBeNull(),
    );
  });
});
