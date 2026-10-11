<script>
  import { englishToBanglaDigits } from '../../lib/prize-bond/parse-input';

  export let totalChecked = 0;
  export let winnersCount = 0;
  export let totalPrize = 0;
  export let topPrizeTier = null; // e.g. 1, 2, 3, 4, 5
  export let lang = 'bn';

  const tierNamesBn = {
    1: '১ম',
    2: '২য়',
    3: '৩য়',
    4: '৪র্থ',
    5: '৫ম',
  };

  const tierNamesEn = {
    1: '1st',
    2: '2nd',
    3: '3rd',
    4: '4th',
    5: '5th',
  };

  function formatMoney(amount) {
    if (lang === 'bn') {
      return englishToBanglaDigits(amount.toLocaleString('en-IN')) + ' ৳';
    }
    return '৳ ' + amount.toLocaleString('en-US');
  }
</script>

<div class="grid grid-cols-2 md:grid-cols-4 gap-3.5 my-6">
  <!-- 1. মোট যাচাইকৃত বন্ড -->
  <div class="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-md flex flex-col justify-center">
    <div class="text-xs font-semibold text-slate-500 dark:text-slate-400">
      {lang === 'bn' ? 'মোট যাচাইকৃত বন্ড' : 'Total Checked'}
    </div>
    <div class="text-2xl font-black text-slate-900 dark:text-white mt-1">
      {lang === 'bn' ? englishToBanglaDigits(totalChecked.toLocaleString()) : totalChecked.toLocaleString()}
    </div>
  </div>

  <!-- 2. বিজয়ী বন্ড সংখ্যা -->
  <div class="p-4 rounded-2xl {winnersCount > 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white'} border shadow-sm backdrop-blur-md flex flex-col justify-center">
    <div class="text-xs font-semibold opacity-80">
      {lang === 'bn' ? 'বিজয়ী বন্ড সংখ্যা' : 'Winning Bonds'}
    </div>
    <div class="text-2xl font-black mt-1 flex items-center gap-1.5">
      <span>{lang === 'bn' ? englishToBanglaDigits(winnersCount) : winnersCount}</span>
      {#if winnersCount > 0}
        <span class="text-base animate-bounce">🎉</span>
      {/if}
    </div>
  </div>

  <!-- 3. -তম পুরস্কার in big font -->
  <div class="p-4 rounded-2xl {topPrizeTier ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300' : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white'} border shadow-sm backdrop-blur-md flex flex-col justify-center">
    <div class="text-xs font-semibold opacity-80">
      {lang === 'bn' ? 'সর্বোচ্চ প্রাপ্ত পুরস্কার' : 'Highest Prize Won'}
    </div>
    <div class="text-2xl font-black mt-1 tracking-tight">
      {#if topPrizeTier}
        {lang === 'bn' ? `${tierNamesBn[topPrizeTier]} পুরস্কার` : `${tierNamesEn[topPrizeTier]} Prize`}
      {:else}
        <span class="text-slate-400 font-semibold text-lg">-</span>
      {/if}
    </div>
  </div>

  <!-- 4. মোট অর্জিত পুরস্কার -->
  <div class="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-md flex flex-col justify-center">
    <div class="text-xs font-semibold text-slate-500 dark:text-slate-400">
      {lang === 'bn' ? 'মোট অর্জিত পুরস্কার' : 'Total Prize Sum'}
    </div>
    <div class="text-2xl font-black text-primary-start dark:text-blue-400 mt-1 truncate">
      {formatMoney(totalPrize)}
    </div>
  </div>
</div>
