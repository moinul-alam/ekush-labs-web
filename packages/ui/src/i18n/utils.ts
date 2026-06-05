import { ui, defaultLang } from './ui';

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  }
}

const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
export function localizeNumber(num: string | number, lang: keyof typeof ui): string {
  const numStr = String(num);
  if (lang === 'bn') {
    return numStr.replace(/\d/g, (d) => bnDigits[parseInt(d, 10)]);
  }
  return numStr;
}
