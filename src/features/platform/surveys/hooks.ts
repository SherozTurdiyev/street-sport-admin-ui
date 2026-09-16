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
