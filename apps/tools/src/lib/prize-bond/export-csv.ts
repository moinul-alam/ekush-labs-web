import type { MatchWin } from './matcher';

/**
 * Exports matched prize winners to a cleanly formatted CSV file.
 */
export function exportWinnersToCsv(
  matches: MatchWin[],
  lang: 'bn' | 'en' = 'bn'
): void {
  if (!matches || matches.length === 0) return;

  const headers = lang === 'bn'
    ? ['বন্ড নম্বর', 'ড্র নম্বর', 'ড্রয়ের তারিখ', 'পুরস্কারের স্তর', 'পুরস্কারের পরিমাণ (টাকা)', 'দাবি স্ট্যাটাস', 'দাবির শেষ তারিখ']
    : ['Bond Number', 'Draw No', 'Draw Date', 'Prize Tier', 'Prize Amount (BDT)', 'Claim Status', 'Claim Deadline'];

  const rows: string[][] = [headers];

  for (const match of matches) {
    for (const win of match.wins) {
      const tierLabel = lang === 'bn'
        ? `${win.tier}ম পুরস্কার`
        : `Tier ${win.tier} Prize`;

      const status = win.isExpired
        ? (lang === 'bn' ? 'মেয়াদোত্তীর্ণ হতে পারে' : 'Claim Period May Have Ended')
        : (lang === 'bn' ? 'দাবিযোগ্য' : 'Claimable');

      rows.push([
        `="${match.bondNumber}"`, // Excel formula wrapper to preserve leading zeros
        win.drawNumber.toString(),
        win.date,
        tierLabel,
        win.amount.toString(),
        status,
        win.claimableUntil,
      ]);
    }
  }

  const csvContent = '\uFEFF' + rows.map((e) => e.map((val) => `"${val.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `ekush-prize-bond-winners-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
