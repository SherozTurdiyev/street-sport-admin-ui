import { api } from '@/shared/api/client';
import type { PageQuery, Paginated } from '@/shared/api/types';

export type SurveyQuestionType =
  'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'TEXT' | 'RATING';

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
      .get<Paginated<SurveyResponseView>>(`${ROOT}/${id}/responses`, {
        params: query,
      })
      .then((r) => r.data),
};
