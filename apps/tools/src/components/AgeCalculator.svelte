<script>
  import { onMount } from 'svelte';

  const dict = {
    bn: {
      cardTitle: 'আপনার বয়স নির্ণয় করুন',
      startLabel: 'যে তারিখ থেকে বয়স করতে চান',
      endLabel: 'যে তারিখ পর্যন্ত হিসাব করতে চান',
      dayText: 'দিন',
      monthText: 'মাস',
      yearText: 'বছর',
      todayText: 'আজকের',
      labelYears: 'বছর',
      labelMonths: 'মাস',
      labelDays: 'দিন',
      totalDaysLabel: 'মোট দিন',
      totalMonthsLabel: 'মোট মাস',
      totalWeeksLabel: 'মোট সপ্তাহ',
      totalHoursLabel: 'মোট ঘণ্টা',
      copyAllText: 'কপি করুন',
      resetText: 'রিসেট',
      copiedTooltip: 'কপি হয়েছে!',
      modalTitle: 'রিসেট করবেন?',
      modalDesc: 'সব ইনপুট রিসেট করতে চান?',
      modalYes: 'হ্যাঁ',
      modalNo: 'না',
    },
    en: {
      cardTitle: 'Calculate Your Age',
      startLabel: 'Start date',
      endLabel: 'End date',
      dayText: 'Day',
      monthText: 'Month',
      yearText: 'Year',
      todayText: 'Today',
      labelYears: 'Years',
      labelMonths: 'Months',
      labelDays: 'Days',
      totalDaysLabel: 'Total Days',
      totalMonthsLabel: 'Total Months',
      totalWeeksLabel: 'Total Weeks',
      totalHoursLabel: 'Total Hours',
      copyAllText: 'Copy',
      resetText: 'Reset',
      copiedTooltip: 'Copied!',
      modalTitle: 'Reset?',
      modalDesc: 'Do you want to reset all inputs?',
      modalYes: 'Yes',
      modalNo: 'No',
    },
  };

  export let lang = 'en';

  let startDay = '';
  let startMonth = '';
  let startYear = '';

  let endDay = '';
  let endMonth = '';
  let endYear = '';

  $: t = dict[lang];

  function fmt(n) {
    if (lang === 'en') return n.toString();
    return n.toString().replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
  }

  function formatNumberWithCommas(n) {
    if (lang === 'en') return n.toLocaleString('en-US');
    return n.toLocaleString('bn-BD');
  }

  function setTodayAsEnd() {
    const today = new Date();
    endDay = String(today.getDate());
    endMonth = String(today.getMonth() + 1);
    endYear = String(today.getFullYear());
  }

  onMount(() => {
    setTodayAsEnd();
  });

  function getDateFromInputs(dStr, mStr, yStr) {
    const day = parseInt(dStr, 10);
    const month = parseInt(mStr, 10);
    const year = parseInt(yStr, 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31) return null;
    if (month < 1 || month > 12) return null;

    const date = new Date(year, month - 1, day);
    if (date.getDate() !== day || date.getMonth() + 1 !== month || date.getFullYear() !== year) {
      return null;
    }
    return date;
  }

  $: start = getDateFromInputs(startDay, startMonth, startYear);
  $: end = getDateFromInputs(endDay, endMonth, endYear);

  $: results = calculateAge(start, end);

  function calculateAge(startDate, endDate) {
    if (!startDate || !endDate) return null;

    let s = new Date(startDate);
    let e = new Date(endDate);

    if (s > e) {
      const temp = s;
      s = e;
      e = temp;
    }

    let years = e.getFullYear() - s.getFullYear();
    let months = e.getMonth() - s.getMonth();
    let days = e.getDate() - s.getDate();

    if (days < 0) {
      months--;
      const lastMonth = new Date(e.getFullYear(), e.getMonth(), 0);
      days += lastMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    const totalDays = Math.floor((e - s) / (1000 * 60 * 60 * 24));
    const totalMonths = years * 12 + months;
    const totalWeeks = Math.floor(totalDays / 7);
    const totalHours = totalDays * 24;

    return { years, months, days, totalDays, totalMonths, totalWeeks, totalHours };
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(err => console.error('Copy failed:', err));
    // Could add a toast notification here
    alert(t.copiedTooltip);
  }

  function getCopyText(copyType) {
    if (!results) return '';
    switch (copyType) {
      case 'years': return results.years + ' ' + t.labelYears;
      case 'months': return results.months + ' ' + t.labelMonths;
      case 'days': return results.days + ' ' + t.labelDays;
      case 'total-days': return formatNumberWithCommas(results.totalDays) + ' ' + t.totalDaysLabel;
      case 'total-months': return formatNumberWithCommas(results.totalMonths) + ' ' + t.totalMonthsLabel;
      case 'total-weeks': return formatNumberWithCommas(results.totalWeeks) + ' ' + t.totalWeeksLabel;
      case 'total-hours': return formatNumberWithCommas(results.totalHours) + ' ' + t.totalHoursLabel;
      case 'all': return `${fmt(results.years)} ${t.labelYears} ${fmt(results.months)} ${t.labelMonths} ${fmt(results.days)} ${t.labelDays}`;
      default: return '';
    }
  }

  function resetAll() {
    startDay = '';
    startMonth = '';
    startYear = '';
    setTodayAsEnd();
  }
</script>

<div class="flex flex-col lg:flex-row gap-6">
  <!-- Inputs Area -->
  <div class="flex-1 bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg">
    <div class="flex items-start gap-4 mb-8">
      <div class="text-4xl">🎂</div>
      <div>
        <h2 class="text-2xl font-bold text-slate-900 dark:text-white m-0">{t.cardTitle}</h2>
      </div>
    </div>

    <!-- Start Date -->
    <div class="mb-8">
      <label class="block font-semibold text-slate-800 dark:text-slate-200 mb-3">{t.startLabel}</label>
      <div class="flex gap-4">
        <div class="flex-1">
          <input type="number" bind:value={startDay} placeholder="DD" class="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-lg font-semibold text-center focus-within:border-blue-500 outline-none transition-all dark:text-white" min="1" max="31">
          <div class="text-center text-sm font-semibold text-slate-500 mt-2">{t.dayText}</div>
        </div>
        <div class="flex-1">
          <input type="number" bind:value={startMonth} placeholder="MM" class="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-lg font-semibold text-center focus-within:border-blue-500 outline-none transition-all dark:text-white" min="1" max="12">
          <div class="text-center text-sm font-semibold text-slate-500 mt-2">{t.monthText}</div>
        </div>
        <div class="flex-[1.5]">
          <input type="number" bind:value={startYear} placeholder="YYYY" class="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-lg font-semibold text-center focus-within:border-blue-500 outline-none transition-all dark:text-white">
          <div class="text-center text-sm font-semibold text-slate-500 mt-2">{t.yearText}</div>
        </div>
      </div>
    </div>

    <!-- End Date -->
    <div class="mb-8">
      <div class="flex justify-between items-center mb-3">
        <label class="font-semibold text-slate-800 dark:text-slate-200">{t.endLabel}</label>
        <button class="px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-bold hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors" on:click={setTodayAsEnd}>{t.todayText}</button>
      </div>
      <div class="flex gap-4">
        <div class="flex-1">
          <input type="number" bind:value={endDay} placeholder="DD" class="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-lg font-semibold text-center focus-within:border-blue-500 outline-none transition-all dark:text-white" min="1" max="31">
          <div class="text-center text-sm font-semibold text-slate-500 mt-2">{t.dayText}</div>
        </div>
        <div class="flex-1">
          <input type="number" bind:value={endMonth} placeholder="MM" class="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-lg font-semibold text-center focus-within:border-blue-500 outline-none transition-all dark:text-white" min="1" max="12">
          <div class="text-center text-sm font-semibold text-slate-500 mt-2">{t.monthText}</div>
        </div>
        <div class="flex-[1.5]">
          <input type="number" bind:value={endYear} placeholder="YYYY" class="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-lg font-semibold text-center focus-within:border-blue-500 outline-none transition-all dark:text-white">
          <div class="text-center text-sm font-semibold text-slate-500 mt-2">{t.yearText}</div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-4">
      <button class="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold shadow-lg shadow-blue-500/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2" on:click={() => copyToClipboard(getCopyText('all'))}>
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        {t.copyAllText}
      </button>
      <button class="px-6 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:border-slate-400 dark:hover:border-slate-500 transition-all" on:click={resetAll}>
        {t.resetText}
      </button>
    </div>
  </div>

  <!-- Results Area -->
  <div class="flex-1 bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col justify-center">
    {#if results}
      <div class="text-center mb-10">
        <h3 class="text-6xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
          <span class="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">{fmt(results.years)}</span> <span class="text-3xl text-slate-400 font-bold">{t.labelYears}</span>
        </h3>
        <div class="flex justify-center items-end gap-6 text-2xl font-bold mt-4">
          <div class="flex items-end gap-2"><span class="text-4xl text-slate-800 dark:text-slate-100">{fmt(results.months)}</span> <span class="text-slate-400">{t.labelMonths}</span></div>
          <div class="flex items-end gap-2"><span class="text-4xl text-slate-800 dark:text-slate-100">{fmt(results.days)}</span> <span class="text-slate-400">{t.labelDays}</span></div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl flex flex-col cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" on:click={() => copyToClipboard(getCopyText('total-months'))}>
          <span class="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-1">{t.totalMonthsLabel}</span>
          <span class="text-xl font-bold text-slate-800 dark:text-slate-200">{formatNumberWithCommas(results.totalMonths)}</span>
        </div>
        <div class="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl flex flex-col cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" on:click={() => copyToClipboard(getCopyText('total-weeks'))}>
          <span class="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-1">{t.totalWeeksLabel}</span>
          <span class="text-xl font-bold text-slate-800 dark:text-slate-200">{formatNumberWithCommas(results.totalWeeks)}</span>
        </div>
        <div class="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl flex flex-col cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" on:click={() => copyToClipboard(getCopyText('total-days'))}>
          <span class="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-1">{t.totalDaysLabel}</span>
          <span class="text-xl font-bold text-slate-800 dark:text-slate-200">{formatNumberWithCommas(results.totalDays)}</span>
        </div>
        <div class="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl flex flex-col cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" on:click={() => copyToClipboard(getCopyText('total-hours'))}>
          <span class="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-1">{t.totalHoursLabel}</span>
          <span class="text-xl font-bold text-slate-800 dark:text-slate-200">{formatNumberWithCommas(results.totalHours)}</span>
        </div>
      </div>
    {:else}
      <div class="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
        <svg class="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="text-lg font-semibold text-center max-w-[200px]">Enter both dates to see your exact age.</p>
      </div>
    {/if}
  </div>
</div>
