<script>
  import { englishToBanglaDigits } from '../../lib/prize-bond/parse-input';

  export let match;
  export let lang = 'bn';

  const tierNamesBn = {
    1: '১ম পুরস্কার',
    2: '২য় পুরস্কার',
    3: '৩য় পুরস্কার',
    4: '৪র্থ পুরস্কার',
    5: '৫ম পুরস্কার',
  };

  const tierNamesEn = {
    1: '1st Prize',
    2: '2nd Prize',
    3: '3rd Prize',
    4: '4th Prize',
    5: '5th Prize',
  };

  function formatMoney(amount) {
    if (lang === 'bn') {
      return englishToBanglaDigits(amount.toLocaleString('en-IN')) + ' ৳';
    }
    return '৳ ' + amount.toLocaleString('en-US');
  }
</script>

<div class="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
  <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-3">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xl shadow-md">
        🏆
      </div>
      <div>
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {lang === 'bn' ? 'বিজয়ী বন্ড নম্বর' : 'Winning Bond Number'}
        </div>
        <div class="text-2xl font-black tracking-widest text-slate-900 dark:text-white font-mono">
          {lang === 'bn' ? englishToBanglaDigits(match.bondNumber) : match.bondNumber}
        </div>
      </div>
    </div>

    <div class="text-right">
      <div class="text-xs font-medium text-slate-400">
        {lang === 'bn' ? 'মোট পুরস্কার' : 'Total Prize'}
      </div>
      <div class="text-xl font-black text-emerald-600 dark:text-emerald-400">
        {formatMoney(match.totalPrize)}
      </div>
    </div>
  </div>

  <!-- List of specific draws where this number won -->
  <div class="space-y-2 mt-3">
    {#each match.wins as win}
      <div class="flex flex-wrap items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-xs">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded-md font-bold {win.tier === 1 ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-blue-500/10 text-blue-700 dark:text-blue-300'}">
            {lang === 'bn' ? tierNamesBn[win.tier] : tierNamesEn[win.tier]}
          </span>
          <span class="font-medium text-slate-700 dark:text-slate-300">
            {lang === 'bn' ? `${englishToBanglaDigits(win.drawNumber)}তম ড্র (${englishToBanglaDigits(win.date)})` : `Draw #${win.drawNumber} (${win.date})`}
          </span>
        </div>

        <div class="flex items-center gap-3 mt-1 sm:mt-0">
          <span class="font-bold text-slate-900 dark:text-white">
            {formatMoney(win.amount)}
          </span>
          {#if win.isExpired}
            <span class="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-semibold text-[10px]">
              {lang === 'bn' ? 'দাবির মেয়াদ শেষ হতে পারে' : 'Claim Window Expired'}
            </span>
          {:else}
            <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold text-[10px]">
              {lang === 'bn' ? `দাবিযোগ্য (${englishToBanglaDigits(win.claimableUntil)} পর্যন্ত)` : `Claimable until ${win.claimableUntil}`}
            </span>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>
