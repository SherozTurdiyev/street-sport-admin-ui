import { api } from '@/shared/api/client';
import type { PageQuery, Paginated, Role } from '@/shared/api/types';

/** `SUPER_ADMIN` tashkilot xodimi emas — u ro'yxatda uchramaydi. */
export type MemberRole = Exclude<Role, 'SUPER_ADMIN'>;

export type Member = {
  /**
   * `id` — a'zolik yozuvi, `userId` — foydalanuvchi. Bu ikkisi FARQ
   * QILADI: `/members/:id` yo'lidagi `:id` aslida **`userId`**. `id`
   * bu yerda faqat jadval kaliti sifatida ishlatiladi; keyingi barcha
   * so'rovlar (rol, faollashtirish, stadion biriktirish) `userId` bilan
   * ketadi. Adashtirilsa backend `MEMBER_NOT_FOUND` (404) qaytaradi.
   */
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  role: MemberRole;
  isActive: boolean;
  lastLoginAt: string | null;
  venueIds: string[];
};

export type MembersQuery = PageQuery & {
  role?: MemberRole;
  isActive?: boolean;
  search?: string;
};

/** `DIRECTOR` bu yerda yaratilmaydi — backend uni rad etadi. */
export type CreatableRole = Exclude<MemberRole, 'DIRECTOR'>;

export type CreateMemberInput = {
  fullName: string;
  phone: string;
  role: CreatableRole;
  venueIds: string[];
};

/**
 * `temporaryPassword` BIR MARTA qaytadi va boshqa hech qayerdan
 * olinmaydi: backend faqat uning hash'ini saqlaydi.
 */
export type CreatedMember = {
  member: Member;
  temporaryPassword: string;
};

export const membersApi = {
  list: (query: MembersQuery) =>
    // axios `undefined` parametrlarni umuman yubormaydi, shuning uchun
    // bo'sh filtrlar uchun alohida tozalash kerak emas.
    api
      .get<Paginated<Member>>('/members', { params: query })
      .then((r) => r.data),

  create: (input: CreateMemberInput) =>
    api.post<CreatedMember>('/members', input).then((r) => r.data),
};
