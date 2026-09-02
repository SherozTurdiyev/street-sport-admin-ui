import { Result } from 'antd';

/**
 * "Ruxsat yo'q" (403) EMAS — bu boshqa holat va uni chalkashtirish
 * foydalanuvchini adashtiradi. Bu yerda muammo ruxsatda emas: hisob
 * hech qaysi tashkilotga tegishli emas, ya'ni bu panelda unga
 * ko'rsatadigan narsa yo'q.
 */
export function NoSectionsPage() {
  return (
    <Result
      status="info"
      title="Sizga ochiq bo'lim yo'q"
      subTitle="Bu panel tashkilot xodimlari uchun. Platforma boshqaruvi alohida bo'limda bo'ladi va u hali tayyor emas."
    />
  );
}
