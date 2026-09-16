# So'rovnomalar — adminka. Implementatsiya rejasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Superadmin uchun so'rovnomalar bo'limi: ro'yxat, tuzilma formasi
(qulf bilan), natijalar (statistika + alohida javoblar).

**Architecture:** `src/features/platform/surveys/` — `demo-requests`
qolipida (`api.ts`, `hooks.ts`, sahifalar). Hisob-kitob va forma ↔ API
o'girishi sof funksiyalarda (`model.ts`) va unit testda; sahifalar MSW
bilan integratsion testda. Grafik kutubxonasi yo'q — antd `Progress`.

**Tech Stack:** React 19, antd 6, TanStack Query 5, react-router 7,
Vitest 4 + MSW + Testing Library, Tailwind 4 (faqat utility).

**Spec:** `../street-sport-back-api/docs/superpowers/specs/2026-09-16-sorovnomalar-design.md` (§7).
Backend shartnomasi: `../street-sport-back-api/docs/API.md` §14.6.

## Global Constraints

- Ruxsat qarori faqat `platform.org.manage` orqali (`RequirePermission`, `nav.ts`) — rol solishtirish taqiqlangan (TZ 4.4).
- Qulf holati faqat backenddagi `locked` maydonidan — frontend o'zi xulosa chiqarmaydi.
- Foizlar frontendda: `count / answered`; `average` backenddan string holida ko'rsatiladi, `Number` ga o'girilmaydi.
- Matnlar o'zbekcha, `‘` (U+2018) apostrof — mavjud UI matnlari uslubi.
- 575px dan tor ekranda ishlaydi; jadval `scroll={{ x: 'max-content' }}`.
- Tekshiruv: `npm run lint && npx tsc -b && npx vitest run <fayl>`; oxirida `npm test` va `npm run build`. Dev server test paytida ishlamasin (CPU raqobati testlarni yiqitadi).
- Kommit oxirida `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`. Tarmoq `feat/sorovnomalar`. `git stash` yo'q.

## Fayl tuzilmasi

| Fayl | Mas'uliyat |
|---|---|
| `src/features/platform/surveys/api.ts` | Tiplar va `surveysApi` |
| `src/features/platform/surveys/hooks.ts` | Query/mutation hook'lari |
| `src/features/platform/surveys/model.ts` | `QUESTION_TYPE_OPTIONS`, `isChoice`, `toFormValues`, `toInput`, `foiz`, `javobMatni`, `yangiSavol` |
| `src/features/platform/surveys/model.test.ts` | Sof funksiyalar |
| `src/features/platform/surveys/SurveysPage.tsx` | Ro'yxat |
| `src/features/platform/surveys/SurveyFormPage.tsx` | Yaratish/tahrir |
| `src/features/platform/surveys/QuestionCard.tsx` | Bitta savol kartochkasi |
| `src/features/platform/surveys/SurveyResultsPage.tsx` | Natijalar sahifasi (tablar) |
| `src/features/platform/surveys/SurveyStatsTab.tsx` | Statistika |
| `src/features/platform/surveys/SurveyResponsesTab.tsx` | Javoblar + drawer |
| `src/features/platform/surveys/surveys.test.tsx` | Integratsion testlar |
| `src/app/layout/nav.ts`, `src/app/router.tsx` | Menyu va marshrutlar |

---

### Task 1: API, model va sof funksiyalar

**Files:**
- Create: `src/features/platform/surveys/api.ts`
- Create: `src/features/platform/surveys/model.ts`
- Test: `src/features/platform/surveys/model.test.ts`

**Interfaces:**
- Produces: tiplar `SurveyQuestionType`, `SurveyListItem`, `SurveyDetail`, `SurveyInput`, `SurveyStats`, `SurveyStatsQuestion`, `SurveyResponseView`; `surveysApi.{list,get,create,update,activate,deactivate,remove,stats,responses}`; `model.ts` eksportlari (quyida).

- [ ] **Step 1: `api.ts`**

<!-- file: src/features/platform/surveys/api.ts -->
```ts
import { api } from '@/shared/api/client';
import type { PageQuery, Paginated } from '@/shared/api/types';

export type SurveyQuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTI_CHOICE'
  | 'TEXT'
  | 'RATING';

export type SurveyListItem = {
  id: string;
  title: string;
  isActive: boolean;
  responseCount: number;
  createdAt: string;
  updatedAt: string;
};

export type SurveyDetail = {
  id: string;
  title: string;
  description: string | null;
  collectContact: boolean;
  isActive: boolean;
  responseCount: number;
  /**
   * Backend hisoblaydi (`responseCount > 0`). Forma qaysi boshqaruvni
   * o'chirishni SHUNGA qarab hal qiladi — o'zi xulosa chiqarmaydi.
   */
  locked: boolean;
  questions: {
    id: string;
    position: number;
    type: SurveyQuestionType;
    text: string;
    required: boolean;
    options: { id: string; position: number; text: string }[];
  }[];
  createdAt: string;
  updatedAt: string;
};

export type SurveyInput = {
  title: string;
  description: string | null;
  collectContact: boolean;
  questions: {
    id?: string;
    type: SurveyQuestionType;
    text: string;
    required: boolean;
    options: { id?: string; text: string }[];
  }[];
};

export type SurveyStatsQuestion =
  | {
      questionId: string;
      type: 'SINGLE_CHOICE' | 'MULTI_CHOICE';
      text: string;
      answered: number;
      options: { optionId: string; text: string; count: number }[];
    }
  | {
      questionId: string;
      type: 'RATING';
      text: string;
      answered: number;
      /** String — `Number` ga o'girilmaydi, backend yozganidek ko'rsatiladi. */
      average: string | null;
      distribution: [number, number, number, number, number];
    }
  | {
      questionId: string;
      type: 'TEXT';
      text: string;
      answered: number;
      latest: { text: string; createdAt: string }[];
    };

export type SurveyStats = {
  responseCount: number;
  questions: SurveyStatsQuestion[];
};

export type SurveyResponseView = {
  id: string;
  fullName: string | null;
  phone: string | null;
  createdAt: string;
  answers: {
    questionId: string;
    optionIds: string[];
    text: string | null;
    rating: number | null;
  }[];
};

const ROOT = '/platform/surveys';

export const surveysApi = {
  list: (query: PageQuery) =>
    api
      .get<Paginated<SurveyListItem>>(ROOT, { params: query })
      .then((r) => r.data),

  get: (id: string) =>
    api.get<SurveyDetail>(`${ROOT}/${id}`).then((r) => r.data),

  create: (input: SurveyInput) =>
    api.post<SurveyDetail>(ROOT, input).then((r) => r.data),

  update: (id: string, input: SurveyInput) =>
    api.put<SurveyDetail>(`${ROOT}/${id}`, input).then((r) => r.data),

  activate: (id: string) =>
    api.post<SurveyDetail>(`${ROOT}/${id}/activate`).then((r) => r.data),

  deactivate: (id: string) =>
    api.post<SurveyDetail>(`${ROOT}/${id}/deactivate`).then((r) => r.data),

  remove: (id: string) =>
    api.delete<{ ok: true }>(`${ROOT}/${id}`).then((r) => r.data),

  stats: (id: string) =>
    api.get<SurveyStats>(`${ROOT}/${id}/stats`).then((r) => r.data),

  responses: (id: string, query: PageQuery) =>
    api
      .get<
        Paginated<SurveyResponseView>
      >(`${ROOT}/${id}/responses`, { params: query })
      .then((r) => r.data),
};
```

- [ ] **Step 2: `model.test.ts` — yiqiladigan test**

<!-- file: src/features/platform/surveys/model.test.ts -->
```ts
import { describe, expect, it } from 'vitest';
import type { SurveyDetail } from './api';
import { foiz, isChoice, javobMatni, toFormValues, toInput } from './model';

const DETAIL: SurveyDetail = {
  id: 's-1',
  title: 'Mijozlar fikri',
  description: null,
  collectContact: true,
  isActive: false,
  responseCount: 0,
  locked: false,
  questions: [
    {
      id: 'q-1',
      position: 0,
      type: 'SINGLE_CHOICE',
      text: 'Nechta maydon?',
      required: true,
      options: [
        { id: 'o-1', position: 0, text: '1' },
        { id: 'o-2', position: 1, text: '2+' },
      ],
    },
    {
      id: 'q-2',
      position: 1,
      type: 'RATING',
      text: 'Baho',
      required: false,
      options: [],
    },
  ],
  createdAt: '2026-09-16T10:00:00.000Z',
  updatedAt: '2026-09-16T10:00:00.000Z',
};

describe('isChoice', () => {
  it('faqat tanlov turlari', () => {
    expect(isChoice('SINGLE_CHOICE')).toBe(true);
    expect(isChoice('MULTI_CHOICE')).toBe(true);
    expect(isChoice('TEXT')).toBe(false);
    expect(isChoice('RATING')).toBe(false);
  });
});

describe('toFormValues → toInput', () => {
  it('aylanib qaytganda id lar va tartib saqlanadi', () => {
    expect(toInput(toFormValues(DETAIL))).toEqual({
      title: 'Mijozlar fikri',
      description: null,
      collectContact: true,
      questions: [
        {
          id: 'q-1',
          type: 'SINGLE_CHOICE',
          text: 'Nechta maydon?',
          required: true,
          options: [
            { id: 'o-1', text: '1' },
            { id: 'o-2', text: '2+' },
          ],
        },
        {
          id: 'q-2',
          type: 'RATING',
          text: 'Baho',
          required: false,
          options: [],
        },
      ],
    });
  });

  it('tur tanlovdan boshqaga o‘zgarsa variantlar yuborilmaydi', () => {
    const values = toFormValues(DETAIL);
    values.questions[0]!.type = 'TEXT';
    expect(toInput(values).questions[0]!.options).toEqual([]);
  });

  it('bo‘sh tavsif null bo‘ladi', () => {
    const values = toFormValues(DETAIL);
    values.description = '   ';
    expect(toInput(values).description).toBeNull();
  });
});

describe('foiz', () => {
  it('butun songa yuvarlaydi, nolga bo‘lmaydi', () => {
    expect(foiz(2, 3)).toBe(67);
    expect(foiz(1, 3)).toBe(33);
    expect(foiz(0, 0)).toBe(0);
  });
});

describe('javobMatni', () => {
  const [single, rating] = DETAIL.questions;

  it('variant matnlari', () => {
    expect(
      javobMatni(single!, {
        questionId: 'q-1',
        optionIds: ['o-2'],
        text: null,
        rating: null,
      }),
    ).toBe('2+');
  });

  it('baho', () => {
    expect(
      javobMatni(rating!, {
        questionId: 'q-2',
        optionIds: [],
        text: null,
        rating: 4,
      }),
    ).toBe('4 / 5');
  });

  it('javob yo‘q', () => {
    expect(javobMatni(rating!, undefined)).toBe('—');
  });
});
```

- [ ] **Step 3: Yiqilishini ko'rish**

Run: `npx vitest run src/features/platform/surveys/model.test.ts`
Expected: FAIL — `Failed to resolve import "./model"`.

- [ ] **Step 4: `model.ts`**

<!-- file: src/features/platform/surveys/model.ts -->
```ts
import type {
  SurveyDetail,
  SurveyInput,
  SurveyQuestionType,
  SurveyResponseView,
} from './api';

export const QUESTION_TYPE_OPTIONS: {
  value: SurveyQuestionType;
  label: string;
}[] = [
  { value: 'SINGLE_CHOICE', label: 'Bitta variant' },
  { value: 'MULTI_CHOICE', label: 'Bir nechta variant' },
  { value: 'TEXT', label: 'Matn javob' },
  { value: 'RATING', label: 'Baho (1–5)' },
];

export function isChoice(type: SurveyQuestionType): boolean {
  return type === 'SINGLE_CHOICE' || type === 'MULTI_CHOICE';
}

/** antd `Form` ichidagi ko'rinish. `id` yashirin maydonda yuradi. */
export type SurveyFormValues = {
  title: string;
  description: string;
  collectContact: boolean;
  questions: {
    id?: string;
    type: SurveyQuestionType;
    text: string;
    required: boolean;
    options?: { id?: string; text: string }[];
  }[];
};

export function yangiSavol(): SurveyFormValues['questions'][number] {
  return {
    type: 'SINGLE_CHOICE',
    text: '',
    required: true,
    options: [{ text: '' }, { text: '' }],
  };
}

export const BOSH_FORMA: SurveyFormValues = {
  title: '',
  description: '',
  collectContact: false,
  questions: [yangiSavol()],
};

export function toFormValues(detail: SurveyDetail): SurveyFormValues {
  return {
    title: detail.title,
    description: detail.description ?? '',
    collectContact: detail.collectContact,
    questions: detail.questions.map((q) => ({
      id: q.id,
      type: q.type,
      text: q.text,
      required: q.required,
      options: q.options.map((o) => ({ id: o.id, text: o.text })),
    })),
  };
}

/**
 * Tur tanlovdan boshqaga o'zgarganda forma ichida eski variantlar
 * qolib ketadi — ular backendga YUBORILMAYDI, aks holda
 * `SURVEY_STRUCTURE_INVALID` qaytardi.
 */
export function toInput(values: SurveyFormValues): SurveyInput {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    collectContact: values.collectContact,
    questions: values.questions.map((q) => ({
      ...(q.id ? { id: q.id } : {}),
      type: q.type,
      text: q.text.trim(),
      required: q.required,
      options: isChoice(q.type)
        ? (q.options ?? []).map((o) => ({
            ...(o.id ? { id: o.id } : {}),
            text: o.text.trim(),
          }))
        : [],
    })),
  };
}

export function foiz(count: number, answered: number): number {
  return answered === 0 ? 0 : Math.round((count * 100) / answered);
}

export function javobMatni(
  question: SurveyDetail['questions'][number],
  answer: SurveyResponseView['answers'][number] | undefined,
): string {
  if (!answer) return '—';
  if (answer.rating !== null) return `${answer.rating} / 5`;
  if (answer.text !== null) return answer.text;
  const matnlar = question.options
    .filter((o) => answer.optionIds.includes(o.id))
    .map((o) => o.text);
  return matnlar.length > 0 ? matnlar.join(', ') : '—';
}
```

- [ ] **Step 5: O'tishini ko'rish**

Run: `npx vitest run src/features/platform/surveys/model.test.ts`
Expected: PASS (8 test).

- [ ] **Step 6: Tekshiruv va kommit**

```bash
npm run lint && npx tsc -b
git add src/features/platform/surveys
git commit -m "feat(sorovnoma): API tiplari va forma modeli

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Hook'lar, ro'yxat sahifasi, menyu va marshrutlar

**Files:**
- Create: `src/features/platform/surveys/hooks.ts`
- Create: `src/features/platform/surveys/SurveysPage.tsx`
- Modify: `src/app/layout/nav.ts`, `src/app/router.tsx`
- Test: `src/features/platform/surveys/surveys.test.tsx`

**Interfaces:**
- Consumes: `surveysApi`, tiplar (Task 1).
- Produces: `surveyKeys`, `useSurveys`, `useSurvey`, `useSurveyStats`, `useSurveyResponses`, `useCreateSurvey`, `useUpdateSurvey`, `useActivateSurvey`, `useDeactivateSurvey`, `useDeleteSurvey`; marshrutlar `/platform/surveys`, `/platform/surveys/new`, `/platform/surveys/:id`, `/platform/surveys/:id/edit` (Task 3 va 4 sahifalari shu yerda lazy ulanadi).

- [ ] **Step 1: `hooks.ts`**

<!-- file: src/features/platform/surveys/hooks.ts -->
```ts
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { PageQuery } from '@/shared/api/types';
import { surveysApi, type SurveyInput } from './api';

export const surveyKeys = {
  all: ['surveys'] as const,
  list: (q: PageQuery) => ['surveys', 'list', q] as const,
  detail: (id: string) => ['surveys', 'detail', id] as const,
  stats: (id: string) => ['surveys', 'stats', id] as const,
  responses: (id: string, q: PageQuery) =>
    ['surveys', 'responses', id, q] as const,
};

export function useSurveys(q: PageQuery) {
  return useQuery({
    queryKey: surveyKeys.list(q),
    queryFn: () => surveysApi.list(q),
    placeholderData: keepPreviousData,
  });
}

export function useSurvey(id: string) {
  return useQuery({
    queryKey: surveyKeys.detail(id),
    queryFn: () => surveysApi.get(id),
    enabled: id !== '',
  });
}

export function useSurveyStats(id: string) {
  return useQuery({
    queryKey: surveyKeys.stats(id),
    queryFn: () => surveysApi.stats(id),
  });
}

export function useSurveyResponses(id: string, q: PageQuery) {
  return useQuery({
    queryKey: surveyKeys.responses(id, q),
    queryFn: () => surveysApi.responses(id, q),
    placeholderData: keepPreviousData,
  });
}

/**
 * Har mutatsiyadan keyin BUTUN `surveys` kaliti yangilanadi: bitta
 * so'rovnomani faollashtirish boshqasining holatini ham o'zgartiradi
 * (eskisi to'xtaydi), ya'ni faqat bitta yozuvni yangilash yetmaydi.
 */
function useSurveyMutation<TVars, TData>(fn: (v: TVars) => Promise<TData>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: surveyKeys.all }),
  });
}

export const useCreateSurvey = () =>
  useSurveyMutation((input: SurveyInput) => surveysApi.create(input));

export const useUpdateSurvey = () =>
  useSurveyMutation(({ id, input }: { id: string; input: SurveyInput }) =>
    surveysApi.update(id, input),
  );

export const useActivateSurvey = () =>
  useSurveyMutation((id: string) => surveysApi.activate(id));

export const useDeactivateSurvey = () =>
  useSurveyMutation((id: string) => surveysApi.deactivate(id));

export const useDeleteSurvey = () =>
  useSurveyMutation((id: string) => surveysApi.remove(id));
```

- [ ] **Step 2: Integratsion test — ro'yxat qismi (yiqiladigan)**

<!-- file: src/features/platform/surveys/surveys.test.tsx -->
```tsx
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import {
  API,
  SUPER_ADMIN_ME,
  authedHandlers,
  platformDashboardHandlers,
} from '@/test/handlers';
import { AppRouter } from '@/app/router';

const ROOT = `${API}/platform/surveys`;

const FAOL = {
  id: 's-1',
  title: 'Mijozlar fikri',
  isActive: true,
  responseCount: 3,
  createdAt: '2026-09-16T10:00:00.000Z',
  updatedAt: '2026-09-16T10:00:00.000Z',
};
const QORALAMA = {
  ...FAOL,
  id: 's-2',
  title: 'Narxlar haqida',
  isActive: false,
  responseCount: 0,
};

const royxat = (items: object[]) =>
  http.get(ROOT, () =>
    HttpResponse.json({ items, total: items.length, page: 1, pageSize: 20 }),
  );

function qator(nom: string): HTMLElement {
  const row = screen.getByText(nom).closest('tr');
  if (!row) throw new Error(`${nom} qatori topilmadi`);
  return row;
}

describe('So‘rovnomalar ro‘yxati', () => {
  beforeEach(() => {
    server.use(
      royxat([FAOL, QORALAMA]),
      ...authedHandlers(SUPER_ADMIN_ME),
      ...platformDashboardHandlers(),
    );
  });

  it('holat va javoblar sonini ko‘rsatadi', async () => {
    renderApp(<AppRouter />, { route: '/platform/surveys' });

    expect(await screen.findByText('Mijozlar fikri')).toBeInTheDocument();
    expect(within(qator('Mijozlar fikri')).getByText('Faol')).toBeInTheDocument();
    expect(within(qator('Narxlar haqida')).getByText('Nofaol')).toBeInTheDocument();
    expect(within(qator('Mijozlar fikri')).getByText('3')).toBeInTheDocument();
  });

  it('javobi bor so‘rovnomada o‘chirish tugmasi o‘chiq', async () => {
    renderApp(<AppRouter />, { route: '/platform/surveys' });
    await screen.findByText('Mijozlar fikri');

    expect(
      within(qator('Mijozlar fikri')).getByRole('button', { name: /O‘chirish/ }),
    ).toBeDisabled();
    expect(
      within(qator('Narxlar haqida')).getByRole('button', { name: /O‘chirish/ }),
    ).toBeEnabled();
  });

  it('faollashtirishda eskisi to‘xtatilishini ogohlantiradi', async () => {
    let chaqirildi = '';
    server.use(
      http.post(`${ROOT}/:id/activate`, ({ params }) => {
        chaqirildi = String(params.id);
        return HttpResponse.json({ ...QORALAMA, isActive: true });
      }),
    );
    const user = userEvent.setup();
    renderApp(<AppRouter />, { route: '/platform/surveys' });
    await screen.findByText('Narxlar haqida');

    await user.click(
      within(qator('Narxlar haqida')).getByRole('button', {
        name: /Faollashtirish/,
      }),
    );
    expect(
      await screen.findByText('«Mijozlar fikri» to‘xtatiladi. Davom etasizmi?'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ha' }));

    await expect.poll(() => chaqirildi).toBe('s-2');
  });

  it('menyuda “So‘rovnomalar” bandi bor', async () => {
    renderApp(<AppRouter />, { route: '/platform/surveys' });
    expect(
      await screen.findByRole('menuitem', { name: /So‘rovnomalar/ }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Yiqilishini ko'rish**

Run: `npx vitest run src/features/platform/surveys/surveys.test.tsx`
Expected: FAIL — `Mijozlar fikri` topilmaydi (marshrut yo'q).

- [ ] **Step 4: `SurveysPage.tsx`**

<!-- file: src/features/platform/surveys/SurveysPage.tsx -->
```tsx
import { useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Pagination,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router';
import { errorMessage } from '@/shared/api/error-handler';
import { DEFAULT_PAGE_SIZE, type PageQuery } from '@/shared/api/types';
import { formatDateTime } from '@/shared/format/time';
import type { SurveyListItem } from './api';
import {
  useActivateSurvey,
  useDeactivateSurvey,
  useDeleteSurvey,
  useSurveys,
} from './hooks';

/**
 * Platforma so'rovnomalari. Bir vaqtda faqat BITTASI faol — landing
 * aynan shuni ko'rsatadi.
 */
export function SurveysPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState<PageQuery>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const { data, isPending, error } = useSurveys(query);
  const activate = useActivateSurvey();
  const deactivate = useDeactivateSurvey();
  const remove = useDeleteSurvey();

  const items = data?.items ?? [];

  function bajar(p: Promise<unknown>, ok: string): void {
    p.then(() => message.success(ok)).catch((e: unknown) =>
      message.error(errorMessage(e)),
    );
  }

  /**
   * Faol so'rovnoma boshqa sahifada bo'lishi mumkin — shunda nomi
   * noma'lum, lekin ogohlantirish baribir kerak.
   */
  function faollashtirishSavoli(row: SurveyListItem): string {
    const faol = items.find((x) => x.isActive && x.id !== row.id);
    return faol
      ? `«${faol.title}» to‘xtatiladi. Davom etasizmi?`
      : 'Faol so‘rovnoma bo‘lsa, u to‘xtatiladi. Davom etasizmi?';
  }

  const ustunlar = [
    {
      title: 'Nomi',
      dataIndex: 'title',
      render: (v: string, row: SurveyListItem) => (
        <Link to={`/platform/surveys/${row.id}`}>{v}</Link>
      ),
    },
    {
      title: 'Holat',
      dataIndex: 'isActive',
      render: (v: boolean) =>
        v ? <Tag color="green">Faol</Tag> : <Tag>Nofaol</Tag>,
    },
    { title: 'Javoblar', dataIndex: 'responseCount' },
    {
      title: 'Yaratilgan',
      dataIndex: 'createdAt',
      render: (v: string) => formatDateTime(v),
    },
    {
      title: 'Amallar',
      key: 'amallar',
      render: (_: unknown, row: SurveyListItem) => (
        <Space wrap size="small">
          {row.isActive ? (
            <Button
              size="small"
              loading={deactivate.isPending && deactivate.variables === row.id}
              onClick={() =>
                bajar(deactivate.mutateAsync(row.id), 'So‘rovnoma to‘xtatildi')
              }
            >
              To‘xtatish
            </Button>
          ) : (
            <Popconfirm
              title={faollashtirishSavoli(row)}
              okText="Ha"
              cancelText="Yo‘q"
              onConfirm={() =>
                bajar(activate.mutateAsync(row.id), 'So‘rovnoma faollashtirildi')
              }
            >
              <Button size="small" type="primary">
                Faollashtirish
              </Button>
            </Popconfirm>
          )}
          <Button
            size="small"
            onClick={() => void navigate(`/platform/surveys/${row.id}/edit`)}
          >
            Tahrirlash
          </Button>
          {row.responseCount > 0 ? (
            <Tooltip title="Javoblari bor — o‘chirib bo‘lmaydi">
              {/* O'chiq tugma hodisa bermaydi — tooltip `span` da. */}
              <span>
                <Button size="small" danger disabled>
                  O‘chirish
                </Button>
              </span>
            </Tooltip>
          ) : (
            <Popconfirm
              title="So‘rovnoma o‘chirilsinmi?"
              okText="Ha"
              cancelText="Yo‘q"
              onConfirm={() =>
                bajar(remove.mutateAsync(row.id), 'So‘rovnoma o‘chirildi')
              }
            >
              <Button size="small" danger>
                O‘chirish
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      className="sahifa-kartochka"
      title="So‘rovnomalar"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined aria-hidden />}
          onClick={() => void navigate('/platform/surveys/new')}
        >
          Yangi so‘rovnoma
        </Button>
      }
    >
      <Typography.Paragraph type="secondary">
        Faol so‘rovnoma landing saytidagi “So‘rovnoma” sahifasida
        ko‘rinadi. Bir vaqtda faqat bittasi faol bo‘ladi.
      </Typography.Paragraph>

      {error !== null && (
        <Alert type="error" message={errorMessage(error)} className="mb-4" />
      )}

      <Table
        rowKey="id"
        loading={isPending}
        dataSource={items}
        columns={ustunlar}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />

      {(data?.total ?? 0) > (query.pageSize ?? DEFAULT_PAGE_SIZE) && (
        <Pagination
          className="mt-6"
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
```

- [ ] **Step 5: Menyu**

`src/app/layout/nav.ts` — importlarga `FormOutlined` (alifbo tartibida),
`/platform/demo-requests` bandidan keyin:

```ts
  {
    // Landing saytidagi so'rovnoma — tuzish, faollashtirish, natijalar.
    path: '/platform/surveys',
    permission: 'platform.org.manage',
    label: 'So‘rovnomalar',
    icon: FormOutlined,
    requiresOrg: false,
  },
```

- [ ] **Step 6: Marshrutlar**

`src/app/router.tsx` — `DemoRequestsPage` lazy e'lonidan keyin:

```tsx
const SurveysPage = lazy(() =>
  import('@/features/platform/surveys/SurveysPage').then((m) => ({
    default: m.SurveysPage,
  })),
);
```

`platform.org.manage` bloki ichida `/platform/demo-requests` marshrutidan keyin:

```tsx
              <Route path="/platform/surveys" element={<SurveysPage />} />
```

- [ ] **Step 7: O'tishini ko'rish**

Run: `npx vitest run src/features/platform/surveys`
Expected: PASS (model 8 + ro'yxat 4). Menyu testi `menuitem` roli bilan
topolmasa — `SiderContent.tsx` menyuni qanday chizishini ko'rib, mavjud
menyu testlari qaysi so'rov bilan izlashini (`grep -rn "menuitem" src`)
qo'lla.

- [ ] **Step 8: Tekshiruv va kommit**

```bash
npm run lint && npx tsc -b && npx prettier --check src
git add src/features/platform/surveys src/app/layout/nav.ts src/app/router.tsx
git commit -m "feat(sorovnoma): ro'yxat sahifasi, menyu va marshrut

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Tuzilma formasi (yaratish, tahrir, qulf)

**Files:**
- Create: `src/features/platform/surveys/QuestionCard.tsx`
- Create: `src/features/platform/surveys/SurveyFormPage.tsx`
- Modify: `src/app/router.tsx`
- Modify: `src/features/platform/surveys/surveys.test.tsx`

**Interfaces:**
- Consumes: `useSurvey`, `useCreateSurvey`, `useUpdateSurvey` (Task 2); `BOSH_FORMA`, `toFormValues`, `toInput`, `yangiSavol`, `isChoice`, `QUESTION_TYPE_OPTIONS`, `SurveyFormValues` (Task 1).
- Produces: `SurveyFormPage` (`/platform/surveys/new`, `/platform/surveys/:id/edit`); saqlangach `/platform/surveys/:id` ga o'tadi.

- [ ] **Step 1: Testlar (yiqiladigan) — `surveys.test.tsx` oxiriga**

```tsx
const DETAIL = {
  id: 's-1',
  title: 'Mijozlar fikri',
  description: null,
  collectContact: false,
  isActive: true,
  responseCount: 0,
  locked: false,
  questions: [
    {
      id: 'q-1',
      position: 0,
      type: 'SINGLE_CHOICE',
      text: 'Nechta maydon?',
      required: true,
      options: [
        { id: 'o-1', position: 0, text: '1' },
        { id: 'o-2', position: 1, text: '2+' },
      ],
    },
    {
      id: 'q-2',
      position: 1,
      type: 'TEXT',
      text: 'Taklif',
      required: false,
      options: [],
    },
  ],
  createdAt: '2026-09-16T10:00:00.000Z',
  updatedAt: '2026-09-16T10:00:00.000Z',
};

/** Natijalar sahifasi saqlashdan keyin ochiladi — u ham so'rov yuboradi. */
function natijaHandlerlari(detail: object = DETAIL) {
  return [
    http.get(`${ROOT}/s-1`, () => HttpResponse.json(detail)),
    http.get(`${ROOT}/s-1/stats`, () =>
      HttpResponse.json({ responseCount: 0, questions: [] }),
    ),
    http.get(`${ROOT}/s-1/responses`, () =>
      HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 20 }),
    ),
  ];
}

describe('So‘rovnoma formasi', () => {
  beforeEach(() => {
    server.use(
      ...natijaHandlerlari(),
      ...authedHandlers(SUPER_ADMIN_ME),
      ...platformDashboardHandlers(),
    );
  });

  it('yangi so‘rovnoma: savol, variant va tur — yuborilgan tana', async () => {
    let tana: unknown = null;
    server.use(
      http.post(ROOT, async ({ request }) => {
        tana = await request.json();
        return HttpResponse.json(DETAIL, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderApp(<AppRouter />, { route: '/platform/surveys/new' });

    await user.type(await screen.findByLabelText('Nomi'), 'Mijozlar fikri');
    const [savol1] = screen.getAllByLabelText('Savol matni');
    await user.type(savol1!, 'Nechta maydon?');
    const variantlar = screen.getAllByLabelText(/^Variant \d+$/);
    await user.type(variantlar[0]!, '1');
    await user.type(variantlar[1]!, '2+');

    await user.click(screen.getByRole('button', { name: /Savol qo‘shish/ }));
    const savollar = screen.getAllByLabelText('Savol matni');
    await user.type(savollar[1]!, 'Taklif');
    // Ikkinchi savol turini "Matn javob" ga o'zgartirish.
    await user.click(screen.getAllByLabelText('Savol turi')[1]!);
    await user.click(await screen.findByTitle('Matn javob'));

    await user.click(screen.getByRole('button', { name: 'Saqlash' }));

    await expect.poll(() => tana).toEqual({
      title: 'Mijozlar fikri',
      description: null,
      collectContact: false,
      questions: [
        {
          type: 'SINGLE_CHOICE',
          text: 'Nechta maydon?',
          required: true,
          options: [{ text: '1' }, { text: '2+' }],
        },
        {
          type: 'TEXT',
          text: 'Taklif',
          required: true,
          options: [],
        },
      ],
    });
  });

  it('tanlov savolida bo‘sh variant bo‘lsa yubormaydi', async () => {
    let yuborildi = false;
    server.use(
      http.post(ROOT, () => {
        yuborildi = true;
        return HttpResponse.json(DETAIL, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderApp(<AppRouter />, { route: '/platform/surveys/new' });

    await user.type(await screen.findByLabelText('Nomi'), 'Mijozlar fikri');
    await user.type(screen.getByLabelText('Savol matni'), 'Savol');
    await user.click(screen.getByRole('button', { name: 'Saqlash' }));

    expect(
      (await screen.findAllByText('Variant matnini kiriting')).length,
    ).toBeGreaterThan(0);
    expect(yuborildi).toBe(false);
  });

  it('↑ tugmasi savollar tartibini almashtiradi', async () => {
    let tana: { questions: { text: string }[] } | null = null;
    server.use(
      http.put(`${ROOT}/s-1`, async ({ request }) => {
        tana = (await request.json()) as typeof tana;
        return HttpResponse.json(DETAIL);
      }),
    );
    const user = userEvent.setup();
    renderApp(<AppRouter />, { route: '/platform/surveys/s-1/edit' });
    await screen.findByDisplayValue('Taklif');

    await user.click(screen.getAllByRole('button', { name: 'Yuqoriga' })[1]!);
    await user.click(screen.getByRole('button', { name: 'Saqlash' }));

    await expect
      .poll(() => tana?.questions.map((q) => q.text))
      .toEqual(['Taklif', 'Nechta maydon?']);
  });

  it('qulflangan: faqat matn maydonlari ochiq', async () => {
    server.use(
      ...natijaHandlerlari({ ...DETAIL, responseCount: 5, locked: true }),
    );
    renderApp(<AppRouter />, { route: '/platform/surveys/s-1/edit' });

    expect(
      await screen.findByText(
        '5 ta javob bor — faqat matnni tuzatish mumkin',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Savol qo‘shish/ })).toBeDisabled();
    expect(
      screen.getByRole('switch', { name: 'Ism va telefon so‘ralsin' }),
    ).toBeDisabled();
    for (const b of screen.getAllByRole('button', { name: 'Savolni o‘chirish' })) {
      expect(b).toBeDisabled();
    }
    expect(screen.getByDisplayValue('Taklif')).toBeEnabled();
  });

  it('409 xabari foydalanuvchiga ko‘rsatiladi', async () => {
    server.use(
      http.put(`${ROOT}/s-1`, () =>
        HttpResponse.json(
          {
            code: 'SURVEY_LOCKED',
            message: 'So‘rovnomaga javoblar kelgan: faqat matnni tuzatish mumkin.',
          },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp(<AppRouter />, { route: '/platform/surveys/s-1/edit' });
    await screen.findByDisplayValue('Taklif');
    await user.click(screen.getByRole('button', { name: 'Saqlash' }));

    expect(
      await screen.findByText(
        'So‘rovnomaga javoblar kelgan: faqat matnni tuzatish mumkin.',
      ),
    ).toBeInTheDocument();
  });
});
```

Diqqat: backend xato javobi shakli `src/shared/api/errors.ts` dagi
`errorMessage` kutgan shaklga mos bo'lishi kerak — mavjud testlardan
birida (`grep -rn "status: 409" src --include=*.test.tsx`) qanday
yozilganini tekshirib, xuddi shunday yoz.

- [ ] **Step 2: Yiqilishini ko'rish**

Run: `npx vitest run src/features/platform/surveys/surveys.test.tsx`
Expected: yangi 5 test FAIL (marshrut yo'q).

- [ ] **Step 3: `QuestionCard.tsx`**

<!-- file: src/features/platform/surveys/QuestionCard.tsx -->
```tsx
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Card, Form, Input, Select, Switch } from 'antd';
import type { FormInstance } from 'antd';
import { QUESTION_TYPE_OPTIONS, isChoice, type SurveyFormValues } from './model';

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
            { required: true, whitespace: true, message: 'Savol matnini kiriting' },
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
              const joriy = form.getFieldValue(['questions', name, 'options']) as
                | unknown[]
                | undefined;
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
```

- [ ] **Step 4: `SurveyFormPage.tsx`**

<!-- file: src/features/platform/surveys/SurveyFormPage.tsx -->
```tsx
import { PlusOutlined } from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  Form,
  Input,
  Skeleton,
  Switch,
} from 'antd';
import { useNavigate, useParams } from 'react-router';
import { errorMessage } from '@/shared/api/error-handler';
import type { SurveyDetail } from './api';
import { useCreateSurvey, useSurvey, useUpdateSurvey } from './hooks';
import {
  BOSH_FORMA,
  toFormValues,
  toInput,
  yangiSavol,
  type SurveyFormValues,
} from './model';
import { QuestionCard } from './QuestionCard';

const SAVOL_MAX = 50;

/** `/platform/surveys/new` va `/platform/surveys/:id/edit`. */
export function SurveyFormPage() {
  const { id = '' } = useParams<{ id: string }>();
  const survey = useSurvey(id);

  if (id === '') return <SurveyForm detail={null} />;
  if (survey.error !== null) {
    return <Alert type="error" showIcon message={errorMessage(survey.error)} />;
  }
  if (survey.isPending) return <Skeleton active />;
  // `key` — boshqa so'rovnoma ochilganda forma boshlang'ich qiymati
  // yangidan o'qiladi (antd `initialValues` faqat birinchi chizishda).
  return <SurveyForm key={survey.data.id} detail={survey.data} />;
}

function SurveyForm({ detail }: { detail: SurveyDetail | null }) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [form] = Form.useForm<SurveyFormValues>();
  const create = useCreateSurvey();
  const update = useUpdateSurvey();
  const locked = detail?.locked ?? false;

  async function saqla(values: SurveyFormValues): Promise<void> {
    const input = toInput(values);
    try {
      const saved = detail
        ? await update.mutateAsync({ id: detail.id, input })
        : await create.mutateAsync(input);
      message.success('So‘rovnoma saqlandi');
      void navigate(`/platform/surveys/${saved.id}`);
    } catch (e) {
      message.error(errorMessage(e));
    }
  }

  return (
    <Card
      className="sahifa-kartochka"
      title={detail ? 'So‘rovnomani tahrirlash' : 'Yangi so‘rovnoma'}
    >
      {locked && (
        <Alert
          type="warning"
          showIcon
          className="mb-6"
          message={`${detail?.responseCount ?? 0} ta javob bor — faqat matnni tuzatish mumkin`}
          description="Savol qo‘shish, o‘chirish, tartib va turini o‘zgartirish eski javoblarni buzadi."
        />
      )}

      <Form<SurveyFormValues>
        form={form}
        layout="vertical"
        initialValues={detail ? toFormValues(detail) : BOSH_FORMA}
        onFinish={(v) => void saqla(v)}
        requiredMark={false}
      >
        <Form.Item
          name="title"
          label="Nomi"
          rules={[
            { required: true, whitespace: true, message: 'Nomini kiriting' },
            { min: 3, message: 'Kamida 3 belgi' },
            { max: 200 },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Tavsif" rules={[{ max: 2000 }]}>
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} />
        </Form.Item>
        <Form.Item
          name="collectContact"
          label="Ism va telefon so‘ralsin"
          valuePropName="checked"
          extra="Yoqilsa, har telefon raqamidan bitta javob qabul qilinadi."
        >
          <Switch disabled={locked} />
        </Form.Item>

        <Form.List name="questions">
          {(fields, { add, remove, move }) => (
            <div className="flex flex-col gap-4">
              {fields.map((field, index) => (
                <QuestionCard
                  key={field.key}
                  form={form}
                  name={field.name}
                  index={index}
                  total={fields.length}
                  locked={locked}
                  move={move}
                  remove={remove}
                />
              ))}
              <Button
                type="dashed"
                icon={<PlusOutlined aria-hidden />}
                disabled={locked || fields.length >= SAVOL_MAX}
                onClick={() => add(yangiSavol())}
              >
                Savol qo‘shish
              </Button>
            </div>
          )}
        </Form.List>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button onClick={() => void navigate(-1)}>Bekor qilish</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={create.isPending || update.isPending}
          >
            Saqlash
          </Button>
        </div>
      </Form>
    </Card>
  );
}
```

- [ ] **Step 5: Marshrutlar**

`router.tsx` — lazy e'lon:

```tsx
const SurveyFormPage = lazy(() =>
  import('@/features/platform/surveys/SurveyFormPage').then((m) => ({
    default: m.SurveyFormPage,
  })),
);
```

`/platform/surveys` marshrutidan keyin:

```tsx
              <Route
                path="/platform/surveys/new"
                element={<SurveyFormPage />}
              />
              <Route
                path="/platform/surveys/:id/edit"
                element={<SurveyFormPage />}
              />
```

- [ ] **Step 6: O'tishini ko'rish**

Run: `npx vitest run src/features/platform/surveys/surveys.test.tsx`
Expected: forma testlari PASS. Saqlashdan keyingi navigatsiya natijalar
sahifasiga olib boradi, u hali yo'q (Task 4) — bu testlarga ta'sir
qilmaydi, chunki ular faqat yuborilgan tanani tekshiradi.

- [ ] **Step 7: Tekshiruv va kommit**

```bash
npm run lint && npx tsc -b && npx prettier --check src
git add src/features/platform/surveys src/app/router.tsx
git commit -m "feat(sorovnoma): tuzilma formasi va qulf

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Natijalar — statistika va javoblar

**Files:**
- Create: `src/features/platform/surveys/SurveyStatsTab.tsx`
- Create: `src/features/platform/surveys/SurveyResponsesTab.tsx`
- Create: `src/features/platform/surveys/SurveyResultsPage.tsx`
- Modify: `src/app/router.tsx`
- Modify: `src/features/platform/surveys/surveys.test.tsx`

**Interfaces:**
- Consumes: `useSurvey`, `useSurveyStats`, `useSurveyResponses`, `useActivateSurvey`, `useDeactivateSurvey` (Task 2); `foiz`, `javobMatni` (Task 1).
- Produces: `SurveyResultsPage` (`/platform/surveys/:id`, `?tab=stats|responses`).

- [ ] **Step 1: Testlar (yiqiladigan) — `surveys.test.tsx` oxiriga**

```tsx
const STATS = {
  responseCount: 3,
  questions: [
    {
      questionId: 'q-1',
      type: 'SINGLE_CHOICE',
      text: 'Nechta maydon?',
      answered: 3,
      options: [
        { optionId: 'o-1', text: '1', count: 2 },
        { optionId: 'o-2', text: '2+', count: 1 },
      ],
    },
    {
      questionId: 'q-3',
      type: 'RATING',
      text: 'Baho',
      answered: 3,
      average: '4.33',
      distribution: [0, 0, 0, 2, 1],
    },
    {
      questionId: 'q-2',
      type: 'TEXT',
      text: 'Taklif',
      answered: 1,
      latest: [{ text: 'Narxi qulay', createdAt: '2026-09-16T11:00:00.000Z' }],
    },
  ],
};

describe('So‘rovnoma natijalari', () => {
  beforeEach(() => {
    server.use(
      http.get(`${ROOT}/s-1`, () =>
        HttpResponse.json({ ...DETAIL, collectContact: true, responseCount: 3, locked: true }),
      ),
      http.get(`${ROOT}/s-1/stats`, () => HttpResponse.json(STATS)),
      http.get(`${ROOT}/s-1/responses`, () =>
        HttpResponse.json({
          items: [
            {
              id: 'r-1',
              fullName: 'Alisher Karimov',
              phone: '+998939542111',
              createdAt: '2026-09-16T11:00:00.000Z',
              answers: [
                { questionId: 'q-1', optionIds: ['o-2'], text: null, rating: null },
                { questionId: 'q-2', optionIds: [], text: 'Narxi qulay', rating: null },
              ],
            },
          ],
          total: 1,
          page: 1,
          pageSize: 20,
        }),
      ),
      ...authedHandlers(SUPER_ADMIN_ME),
      ...platformDashboardHandlers(),
    );
  });

  it('statistika: foiz, o‘rtacha baho va matn javoblar', async () => {
    renderApp(<AppRouter />, { route: '/platform/surveys/s-1' });

    expect(await screen.findByText('2 ta · 67%')).toBeInTheDocument();
    expect(screen.getByText('1 ta · 33%')).toBeInTheDocument();
    // `average` backend yozganidek — qayta formatlanmaydi.
    expect(screen.getByText('4.33')).toBeInTheDocument();
    expect(screen.getByText('Narxi qulay')).toBeInTheDocument();
  });

  it('javoblar: qator bosilganda drawer savol → javobni ko‘rsatadi', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />, { route: '/platform/surveys/s-1?tab=responses' });

    await user.click(await screen.findByText('Alisher Karimov'));
    const drawer = await screen.findByRole('dialog');
    expect(within(drawer).getByText('Nechta maydon?')).toBeInTheDocument();
    expect(within(drawer).getByText('2+')).toBeInTheDocument();
    expect(within(drawer).getByText('Taklif')).toBeInTheDocument();
    expect(within(drawer).getByText('Narxi qulay')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Yiqilishini ko'rish**

Run: `npx vitest run src/features/platform/surveys/surveys.test.tsx`
Expected: natijalar testlari FAIL.

- [ ] **Step 3: `SurveyStatsTab.tsx`**

<!-- file: src/features/platform/surveys/SurveyStatsTab.tsx -->
```tsx
import { Alert, Card, Empty, Progress, Skeleton, Typography } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { formatDateTime } from '@/shared/format/time';
import type { SurveyStatsQuestion } from './api';
import { useSurveyStats } from './hooks';
import { foiz } from './model';

export function SurveyStatsTab({ id }: { id: string }) {
  const { data, isPending, error } = useSurveyStats(id);

  if (error !== null) {
    return <Alert type="error" showIcon message={errorMessage(error)} />;
  }
  if (isPending) return <Skeleton active />;
  if (data.responseCount === 0) {
    return <Empty description="Hali javob yo‘q" />;
  }

  return (
    <div className="flex flex-col gap-4">
      {data.questions.map((q, i) => (
        <Card
          key={q.questionId}
          size="small"
          title={
            // Uzun savol sarlavhada kesilib qolmasin.
            <span className="whitespace-normal">{`${i + 1}. ${q.text}`}</span>
          }
          extra={<Typography.Text type="secondary">{q.answered} ta javob</Typography.Text>}
        >
          <SavolNatijasi q={q} />
        </Card>
      ))}
    </div>
  );
}

function Qator({
  nom,
  count,
  answered,
}: {
  nom: string;
  count: number;
  answered: number;
}) {
  const p = foiz(count, answered);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4">
      <span className="truncate">{nom}</span>
      <Typography.Text type="secondary">{`${count} ta · ${p}%`}</Typography.Text>
      <Progress percent={p} showInfo={false} className="col-span-2 m-0" />
    </div>
  );
}

function SavolNatijasi({ q }: { q: SurveyStatsQuestion }) {
  if (q.type === 'SINGLE_CHOICE' || q.type === 'MULTI_CHOICE') {
    return (
      <div className="flex flex-col gap-3">
        {q.type === 'MULTI_CHOICE' && (
          <Typography.Text type="secondary">
            Bir nechta tanlash mumkin — yig‘indi 100% dan oshishi mumkin.
          </Typography.Text>
        )}
        {q.options.map((o) => (
          <Qator key={o.optionId} nom={o.text} count={o.count} answered={q.answered} />
        ))}
      </div>
    );
  }

  if (q.type === 'RATING') {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <Typography.Text type="secondary">O‘rtacha baho</Typography.Text>
          <div className="text-3xl font-semibold">{q.average ?? '—'}</div>
        </div>
        {[5, 4, 3, 2, 1].map((baho) => (
          <Qator
            key={baho}
            nom={`${baho} ★`}
            count={q.distribution[baho - 1] ?? 0}
            answered={q.answered}
          />
        ))}
      </div>
    );
  }

  if (q.latest.length === 0) {
    return <Typography.Text type="secondary">Hali javob yo‘q</Typography.Text>;
  }
  return (
    <div className="flex flex-col gap-3">
      {q.latest.map((a, j) => (
        <div key={j} className="border-l-2 border-gray-200 pl-3">
          <div className="whitespace-pre-wrap break-words">{a.text}</div>
          <Typography.Text type="secondary" className="text-xs">
            {formatDateTime(a.createdAt)}
          </Typography.Text>
        </div>
      ))}
      {q.answered > q.latest.length && (
        <Typography.Text type="secondary">
          Oxirgi {q.latest.length} tasi. Barchasi — “Javoblar” tabida.
        </Typography.Text>
      )}
    </div>
  );
}
```

- [ ] **Step 4: `SurveyResponsesTab.tsx`**

<!-- file: src/features/platform/surveys/SurveyResponsesTab.tsx -->
```tsx
import { useState } from 'react';
import { Alert, Descriptions, Drawer, Pagination, Table } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { DEFAULT_PAGE_SIZE, type PageQuery } from '@/shared/api/types';
import { displayPhone } from '@/shared/format/phone';
import { formatDateTime } from '@/shared/format/time';
import type { SurveyDetail, SurveyResponseView } from './api';
import { useSurveyResponses } from './hooks';
import { javobMatni } from './model';

export function SurveyResponsesTab({ survey }: { survey: SurveyDetail }) {
  const [query, setQuery] = useState<PageQuery>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [ochiq, setOchiq] = useState<SurveyResponseView | null>(null);
  const { data, isPending, error } = useSurveyResponses(survey.id, query);

  const ustunlar = [
    {
      title: 'Vaqti',
      dataIndex: 'createdAt',
      render: (v: string) => formatDateTime(v),
    },
    ...(survey.collectContact
      ? [
          { title: 'Ism', dataIndex: 'fullName' },
          {
            title: 'Telefon',
            dataIndex: 'phone',
            render: (v: string | null) =>
              v ? (
                <a href={`tel:${v}`} onClick={(e) => e.stopPropagation()}>
                  {displayPhone(v)}
                </a>
              ) : (
                '—'
              ),
          },
        ]
      : []),
    {
      title: 'Javob berilgan savollar',
      key: 'soni',
      render: (_: unknown, row: SurveyResponseView) =>
        `${row.answers.length} / ${survey.questions.length}`,
    },
  ];

  return (
    <>
      {error !== null && (
        <Alert type="error" message={errorMessage(error)} className="mb-4" />
      )}
      <Table
        rowKey="id"
        loading={isPending}
        dataSource={data?.items ?? []}
        columns={ustunlar}
        pagination={false}
        scroll={{ x: 'max-content' }}
        onRow={(row) => ({
          onClick: () => setOchiq(row),
          style: { cursor: 'pointer' },
        })}
      />
      {(data?.total ?? 0) > (query.pageSize ?? DEFAULT_PAGE_SIZE) && (
        <Pagination
          className="mt-6"
          align="end"
          current={query.page}
          pageSize={query.pageSize}
          total={data?.total ?? 0}
          showSizeChanger={false}
          onChange={(page) => setQuery((prev) => ({ ...prev, page }))}
        />
      )}

      <Drawer
        open={ochiq !== null}
        onClose={() => setOchiq(null)}
        width="min(520px, 92vw)"
        title={ochiq?.fullName ?? (ochiq ? formatDateTime(ochiq.createdAt) : '')}
        destroyOnHidden
      >
        {ochiq !== null && (
          <Descriptions column={1} layout="vertical" size="small">
            {survey.questions.map((q) => (
              <Descriptions.Item key={q.id} label={q.text}>
                <span className="whitespace-pre-wrap break-words">
                  {javobMatni(
                    q,
                    ochiq.answers.find((a) => a.questionId === q.id),
                  )}
                </span>
              </Descriptions.Item>
            ))}
          </Descriptions>
        )}
      </Drawer>
    </>
  );
}
```

- [ ] **Step 5: `SurveyResultsPage.tsx`**

<!-- file: src/features/platform/surveys/SurveyResultsPage.tsx -->
```tsx
import { Alert, App, Button, Card, Skeleton, Tabs, Tag, Typography } from 'antd';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { errorMessage } from '@/shared/api/error-handler';
import { useActivateSurvey, useDeactivateSurvey, useSurvey } from './hooks';
import { SurveyResponsesTab } from './SurveyResponsesTab';
import { SurveyStatsTab } from './SurveyStatsTab';

const TABS = ['stats', 'responses'] as const;
type Tab = (typeof TABS)[number];
const isTab = (v: string | null): v is Tab =>
  v !== null && (TABS as readonly string[]).includes(v);

export function SurveyResultsPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isPending, error } = useSurvey(id);
  const activate = useActivateSurvey();
  const deactivate = useDeactivateSurvey();

  const tabParam = searchParams.get('tab');
  const tab: Tab = isTab(tabParam) ? tabParam : 'stats';

  if (error !== null) {
    return <Alert type="error" showIcon message={errorMessage(error)} />;
  }
  if (isPending) return <Skeleton active />;

  function almashtir(): void {
    const p = data!.isActive
      ? deactivate.mutateAsync(data!.id)
      : activate.mutateAsync(data!.id);
    p.then(() =>
      message.success(
        data!.isActive ? 'So‘rovnoma to‘xtatildi' : 'So‘rovnoma faollashtirildi',
      ),
    ).catch((e: unknown) => message.error(errorMessage(e)));
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <Card className="sahifa-kartochka">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Typography.Title level={4} className="m-0 break-words">
              {data.title}
            </Typography.Title>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {data.isActive ? <Tag color="green">Faol</Tag> : <Tag>Nofaol</Tag>}
              <Typography.Text type="secondary">
                {data.responseCount} ta javob
              </Typography.Text>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void navigate(`/platform/surveys/${data.id}/edit`)}>
              Tahrirlash
            </Button>
            <Button
              type={data.isActive ? 'default' : 'primary'}
              loading={activate.isPending || deactivate.isPending}
              onClick={almashtir}
            >
              {data.isActive ? 'To‘xtatish' : 'Faollashtirish'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="sahifa-kartochka">
        <Tabs
          activeKey={tab}
          onChange={(key) => setSearchParams({ tab: key }, { replace: true })}
          items={[
            {
              key: 'stats',
              label: 'Statistika',
              children: <SurveyStatsTab id={data.id} />,
            },
            {
              key: 'responses',
              label: 'Javoblar',
              children: <SurveyResponsesTab survey={data} />,
            },
          ]}
        />
      </Card>
    </div>
  );
}
```

Natijalar sahifasidagi faollashtirish tugmasida tasdiq yo'q: ro'yxat
sahifasidan farqli, bu yerda boshqa so'rovnoma nomi ma'lum emas. Agar
`oxlint` `data!` ni rad etsa, `const survey = data;` ni `if (isPending)`
dan keyin olib, `almashtir` ichida `survey` ishlat.

- [ ] **Step 6: Marshrut**

`router.tsx` — lazy:

```tsx
const SurveyResultsPage = lazy(() =>
  import('@/features/platform/surveys/SurveyResultsPage').then((m) => ({
    default: m.SurveyResultsPage,
  })),
);
```

`/platform/surveys/:id/edit` marshrutidan keyin:

```tsx
              <Route
                path="/platform/surveys/:id"
                element={<SurveyResultsPage />}
              />
```

- [ ] **Step 7: O'tishini ko'rish**

Run: `npx vitest run src/features/platform/surveys`
Expected: PASS (model 8 + ro'yxat 4 + forma 5 + natijalar 2).

- [ ] **Step 8: To'liq tekshiruv**

```bash
npm run lint && npx tsc -b && npx prettier --check src && npm test && npm run build
```

Expected: hammasi yashil.

- [ ] **Step 9: Kommit**

```bash
git add src/features/platform/surveys src/app/router.tsx
git commit -m "feat(sorovnoma): natijalar — statistika va javoblar

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```
