export const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

export function parseEn(nStr: string): string {
  let en = nStr.replace(/[০-৯]/g, (d) => BN_DIGITS.indexOf(d).toString());
  // Strip anything that is not a digit, minus, or dot.
  en = en.replace(/[^0-9.-]/g, "");
  return en;
}

export function fmt(nStr: string, lang: string): string {
  if (lang === "en") return nStr;
  return nStr.replace(/[0-9]/g, (d) => BN_DIGITS[parseInt(d, 10)]);
}

export function handleLocalizedInput(e: Event, lang: string, updateValue: (parsed: string) => void) {
  const el = e.currentTarget as HTMLInputElement;
  const start = el.selectionStart;
  const end = el.selectionEnd;

  const parsed = parseEn(el.value);
  updateValue(parsed);

  el.value = fmt(parsed, lang);

  if (start !== null && end !== null) {
    el.setSelectionRange(start, end);
  }
}
