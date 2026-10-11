<script>
  import { englishToBanglaDigits } from '../../lib/prize-bond/parse-input';

  export let totalChecked = 0;
  export let winnersCount = 0;
  export let ignoredCount = 0;
  export let totalPrize = 0;
  export let durationMs = 0;
  export let drawsCount = 0;
  export let lang = 'bn';

  function formatMoney(amount) {
    if (lang === 'bn') {
      return englishToBanglaDigits(amount.toLocaleString('en-IN')) + ' ৳';
    }
    return '৳ ' + amount.toLocaleString('en-US');
  }
</script>

<div class="grid grid-cols-2 md:grid-cols-4 gap-3.5 my-6">
  <div class="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-md">
    <div class="text-xs font-semibold text-slate-500 dark:text-slate-400">
      {lang === 'bn' ? 'মোট যাচাইকৃত বন্ড' : 'Total Checked'}
    </div>
    <div class="text-2xl font-black text-slate-900 dark:text-white mt-1">
      {lang === 'bn' ? englishToBanglaDigits(totalChecked.toLocaleString()) : totalChecked.toLocaleString()}
    </div>
    <div class="text-[11px] text-slate-400 mt-1">
      {lang === 'bn' ? `${englishToBanglaDigits(drawsCount)}টি ড্রয়ে খোঁজা হয়েছে` : `Across ${drawsCount} draws`}
    </div>
  </div>

  <div class="p-4 rounded-2xl {winnersCount > 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white'} border shadow-sm backdrop-blur-md">
    <div class="text-xs font-semibold opacity-80">
      {lang === 'bn' ? 'বিজয়ী বন্ড সংখ্যা' : 'Winning Bonds'}
    </div>
    <div class="text-2xl font-black mt-1 flex items-center gap-1.5">
      <span>{lang === 'bn' ? englishToBanglaDigits(winnersCount) : winnersCount}</span>
      {#if winnersCount > 0}
        <span class="text-base animate-bounce">🎉</span>
      {/if}
    </div>
    <div class="text-[11px] opacity-75 mt-1">
      {winnersCount > 0 ? (lang === 'bn' ? 'পুরস্কার মিলেছে!' : 'Matches found!') : (lang === 'bn' ? 'কোনো বিজয়ী নেই' : 'No wins')}
    </div>
  </div>

  <div class="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-md">
    <div class="text-xs font-semibold text-slate-500 dark:text-slate-400">
      {lang === 'bn' ? 'মোট অর্জিত পুরস্কার' : 'Total Prize Sum'}
    </div>
    <div class="text-2xl font-black text-primary-start dark:text-blue-400 mt-1 truncate">
      {formatMoney(totalPrize)}
    </div>
    <div class="text-[11px] text-slate-400 mt-1">
      {lang === 'bn' ? '২০% উৎসে কর প্রযোজ্য' : '20% tax applies'}
    </div>
  </div>

  <div class="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-md">
    <div class="text-xs font-semibold text-slate-500 dark:text-slate-400">
      {lang === 'bn' ? 'গতি ও অন্যান্য' : 'Speed & Status'}
    </div>
    <div class="text-2xl font-black text-slate-900 dark:text-white mt-1">
      {lang === 'bn' ? `${englishToBanglaDigits(durationMs)} মি.সে.` : `${durationMs} ms`}
    </div>
    <div class="text-[11px] text-slate-400 mt-1">
      {#if ignoredCount > 0}
        <span class="text-amber-500 font-medium">
          {lang === 'bn' ? `${englishToBanglaDigits(ignoredCount)}টি বাদ দেওয়া হয়েছে` : `${ignoredCount} ignored`}
        </span>
      {:else}
        <span>{lang === 'bn' ? 'ইন-মেমোরি হ্যাশ ও(১)' : 'In-memory O(1)'}</span>
      {/if}
    </div>
  </div>
</div>
