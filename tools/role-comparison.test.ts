import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * TZ 4.4: qaror rol bo'yicha emas, `permissions` bo'yicha qabul qilinadi.
 *
 * Backendda buni ESLint ning `no-restricted-syntax` qoidasi ushlaydi.
 * Bu yerda linter oxlint va unda bunday qoida YO'Q (uning sozlama
 * sxemasida `no-restricted-syntax` yo'q). Faqat shu bitta qoida uchun
 * butun ESLint zanjirini qo'shish — parser, plaginlar, ikkinchi lint
 * bosqichi — qimmat. Shuning uchun qoida test sifatida yozilgan: u
 * `npm test` da, ya'ni CI da ham ishlaydi.
 */
// Bu fayl ATAYLAB `src/` dan tashqarida: u `node:fs` bilan ishlaydi va
// `src` uchun mo'ljallangan tsconfig'da Node globallari yo'q.
const SRC = join(process.cwd(), 'src');

const RULES: readonly { re: RegExp; xato: string }[] = [
  { re: /\brole\s*(?:===|!==|==|!=)/, xato: 'rolni solishtirish' },
  {
    re: /(?:===|!==|==|!=)\s*['"](?:SUPER_ADMIN|DIRECTOR|MANAGER|VENUE_ADMIN)['"]/,
    xato: 'rol qiymati bilan solishtirish',
  },
  { re: /\bswitch\s*\(\s*[\w.$]*role\s*\)/, xato: "rol bo'yicha switch" },
];

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(full));
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

/**
 * Izohlar tekshirilmaydi: qoidani izohda tushuntirish uchun uni yozib
 * ko'rsatish kerak bo'ladi va o'sha izohning o'zi qoidani buzardi.
 */
function stripComments(source: string): string[] {
  let inBlock = false;
  return source.split('\n').map((line) => {
    let rest = line;
    let kept = '';
    while (rest.length > 0) {
      if (inBlock) {
        const end = rest.indexOf('*/');
        if (end === -1) break;
        rest = rest.slice(end + 2);
        inBlock = false;
        continue;
      }
      const block = rest.indexOf('/*');
      const lineComment = rest.indexOf('//');
      if (lineComment !== -1 && (block === -1 || lineComment < block)) {
        kept += rest.slice(0, lineComment);
        break;
      }
      if (block !== -1) {
        kept += rest.slice(0, block);
        rest = rest.slice(block + 2);
        inBlock = true;
        continue;
      }
      kept += rest;
      break;
    }
    return kept;
  });
}

describe('TZ 4.4 — rol bo`yicha qaror qabul qilinmaydi', () => {
  it('hech bir faylda rolni solishtirish yo`q', () => {
    const buzilishlar: string[] = [];

    for (const file of sourceFiles(SRC)) {
      const lines = stripComments(readFileSync(file, 'utf8'));
      lines.forEach((line, i) => {
        for (const rule of RULES) {
          if (rule.re.test(line)) {
            buzilishlar.push(
              `${relative(SRC, file)}:${i + 1} — ${rule.xato}: ${line.trim()}`,
            );
          }
        }
      });
    }

    expect(buzilishlar).toEqual([]);
  });
});
