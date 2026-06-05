<script>
  import { onMount } from 'svelte';

  const dict = {
    bn: {
      weekdays: ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'],
      months: ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'],
      bMonths: ['বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন', 'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র'],
      hMonths: ['মহররম', 'সফর', 'রবিউল আউয়াল', 'রবিউস সানি', 'জমাদিউল আউয়াল', 'জমাদিউস সানি', 'রজব', 'শাবান', 'রমজান', 'শাওয়াল', 'জিলকদ', 'জিলহজ'],
      holidayList: 'এই মাসের ছুটির দিন',
      noHolidays: 'এই মাসে কোনো ছুটির দিন নেই',
      todayLabel: 'আজ',
      gregorianSuffix: 'খ্রীস্টাব্দ',
      banglaSuffix: 'বঙ্গাব্দ',
      hijriSuffix: 'হিজরি',
    },
    en: {
      weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      bMonths: ['Baishakh', 'Jaistha', 'Ashar', 'Srabon', 'Bhadro', 'Ashwin', 'Kartik', 'Ogrohayon', 'Poush', 'Magh', 'Falgun', 'Chaitra'],
      hMonths: ["Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani", "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"],
      holidayList: 'Holidays this month',
      noHolidays: 'No holidays this month',
      todayLabel: 'Today',
      gregorianSuffix: '',
      banglaSuffix: 'BS',
      hijriSuffix: 'AH',
    },
  };

  export let lang = 'en';

  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  const today = new Date();

  let manifestCache = null;
  let holidaysCache = {};
  let currentMonthHolidays = [];
  let calendarCells = [];

  $: t = dict[lang];

  function fmt(n) {
    if (lang === 'en') return n.toString();
    return n.toString().replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]);
  }

  function getBanglaDate(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const y = d.getUTCFullYear();
    const april14 = new Date(Date.UTC(y, 3, 14));
    let startYear = y, bYear = y - 593;
    if (d < april14) { startYear = y - 1; bYear = y - 594; }

    const startDate = new Date(Date.UTC(startYear, 3, 14));
    let diffDays = Math.round((d - startDate) / 86400000);

    const ny = startYear + 1;
    const isLeap = (ny % 4 === 0 && ny % 100 !== 0) || ny % 400 === 0;
    const lengths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, isLeap ? 30 : 29, 30];

    let left = diffDays, bMonth = 0;
    while (left >= lengths[bMonth]) { left -= lengths[bMonth]; bMonth++; }
    return { day: left + 1, monthIndex: bMonth, year: bYear };
  }

  function getHijriDate(date) {
    let m = date.getMonth() + 1, y = date.getFullYear(), d = date.getDate();
    if (m < 3) { y--; m += 12; }
    const a = Math.floor(y / 100);
    let b = 0;
    if (y > 1582 || (y === 1582 && (m > 10 || (m === 10 && d > 14)))) {
      b = 2 - a + Math.floor(a / 4);
    }
    const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524;
    const bjd = jd - 1948440 + 10632;
    const n = Math.floor((bjd - 1) / 10631);
    const bjd1 = bjd - 10631 * n + 354;
    const j = (Math.floor((10985 - bjd1) / 5316)) * (Math.floor((50 * bjd1) / 17719))
             + (Math.floor(bjd1 / 5670)) * (Math.floor((43 * bjd1) / 15238));
    const bjd2 = bjd1 - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50))
             - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
    const m2 = Math.floor((24 * bjd2) / 709);
    const d2 = bjd2 - Math.floor((709 * m2) / 24);
    const y2 = 30 * n + j - 30;
    return { day: d2, monthIndex: m2 - 1, year: y2 };
  }

  $: todayBangla = getBanglaDate(today);
  $: todayHijri = getHijriDate(today);

  $: bStart = getBanglaDate(new Date(currentYear, currentMonth, 1));
  $: bEnd = getBanglaDate(new Date(currentYear, currentMonth + 1, 0));
  $: hStart = getHijriDate(new Date(currentYear, currentMonth, 1));
  $: hEnd = getHijriDate(new Date(currentYear, currentMonth + 1, 0));

  $: bStr = bStart.monthIndex !== bEnd.monthIndex
    ? `${t.bMonths[bStart.monthIndex]} - ${t.bMonths[bEnd.monthIndex]} ${fmt(bEnd.year)}`
    : `${t.bMonths[bStart.monthIndex]} ${fmt(bEnd.year)}`;

  $: hStr = hStart.monthIndex !== hEnd.monthIndex
    ? `${t.hMonths[hStart.monthIndex]} - ${t.hMonths[hEnd.monthIndex]} ${fmt(hEnd.year)}`
    : `${t.hMonths[hStart.monthIndex]} ${fmt(hEnd.year)}`;

  onMount(async () => {
    try {
      const res = await fetch('/calendar-assets/data/manifest.json');
      if (res.ok) manifestCache = await res.json();
    } catch (e) {
      console.error('[Calendar] Manifest fetch failed:', e);
    }
    updateCalendar();
  });

  async function fetchHolidays(year) {
    if (holidaysCache[year]) return holidaysCache[year];
    if (!manifestCache?.datasets?.holidays?.files?.[year]) return {};

    const file = manifestCache.datasets.holidays.files[year];
    try {
      const r = await fetch(`/calendar-assets/data/${file}`);
      if (!r.ok) return {};
      const data = await r.json();
      const map = {};
      data.holidays?.forEach(h => {
        if (!h.gazetteType?.startsWith('mandatory')) return;
        let cur = new Date(h.startDate);
        const end = h.endDate ? new Date(h.endDate) : new Date(h.startDate);
        while (cur <= end) {
          const key = cur.toISOString().split('T')[0];
          if (!map[key]) map[key] = [];
          map[key].push(h);
          cur.setDate(cur.getDate() + 1);
        }
      });
      holidaysCache[year] = map;
      return map;
    } catch (e) {
      console.error('[Calendar] Holidays fetch failed:', e);
      return {};
    }
  }

  async function updateCalendar() {
    const holidays = await fetchHolidays(currentYear);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const isThisMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

    let cells = [];
    let hols = [];
    const seenIds = new Set();

    for (let i = 0; i < firstDay; i++) {
      const prevDate = new Date(currentYear, currentMonth, -i);
      cells.unshift({ empty: true, date: prevDate, b: getBanglaDate(prevDate), h: getHijriDate(prevDate) });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(currentYear, currentMonth, d);
      const dayOfWeek = dateObj.getDay();
      const mm = String(currentMonth + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateKey = `${currentYear}-${mm}-${dd}`;
      const dayHols = holidays[dateKey] || [];
      
      let tooltipNames = [];
      dayHols.forEach(h => {
        const name = lang === 'bn' ? (h.namebn || h.name) : h.name;
        const desc = lang === 'bn' ? (h.descriptionbn || h.description || '') : (h.description || '');
        tooltipNames.push(name);
        if (!seenIds.has(h.id)) {
          seenIds.add(h.id);
          hols.push({ date: d, name, desc });
        }
      });

      cells.push({
        empty: false,
        date: dateObj,
        b: getBanglaDate(dateObj),
        h: getHijriDate(dateObj),
        isWeekend: dayOfWeek === 5 || dayOfWeek === 6,
        isToday: isThisMonth && d === today.getDate(),
        isHoliday: dayHols.length > 0,
        tooltip: tooltipNames.join(', ')
      });
    }

    const total = firstDay + daysInMonth;
    const remaining = (7 - (total % 7)) % 7;
    for (let j = 0; j < remaining; j++) {
      const nextDate = new Date(currentYear, currentMonth + 1, j + 1);
      cells.push({ empty: true, date: nextDate, b: getBanglaDate(nextDate), h: getHijriDate(nextDate) });
    }

    calendarCells = cells;
    currentMonthHolidays = hols;
  }

  function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    updateCalendar();
  }

  function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    updateCalendar();
  }
  
  // Re-run if lang changes
  $: {
    lang;
    if (manifestCache) updateCalendar();
  }
</script>

<div class="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
  <!-- Today Sidebar -->
  <div class="w-full lg:w-72 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col gap-6 h-fit shrink-0">
    <div class="text-center pb-6 border-b border-slate-100 dark:border-slate-700">
      <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">{t.todayLabel}</h3>
      <div class="text-4xl font-black text-blue-600 dark:text-blue-400 mb-2">{fmt(today.getDate())}</div>
      <div class="text-xl font-bold text-slate-700 dark:text-slate-300">{t.months[today.getMonth()]} {fmt(today.getFullYear())} {t.gregorianSuffix}</div>
    </div>
    
    <div class="flex flex-col gap-4">
      <div class="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800/50">
        <div class="text-sm font-semibold text-amber-600 dark:text-amber-500 mb-1">বাংলা</div>
        <div class="font-bold text-slate-800 dark:text-slate-200">{fmt(todayBangla.day)} {t.bMonths[todayBangla.monthIndex]} {fmt(todayBangla.year)} {t.banglaSuffix}</div>
      </div>
      <div class="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
        <div class="text-sm font-semibold text-emerald-600 dark:text-emerald-500 mb-1">هجري</div>
        <div class="font-bold text-slate-800 dark:text-slate-200">{fmt(todayHijri.day)} {t.hMonths[todayHijri.monthIndex]} {fmt(todayHijri.year)} {t.hijriSuffix}</div>
      </div>
    </div>
  </div>

  <!-- Main Calendar -->
  <div class="flex-1 flex flex-col gap-6">
    <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-lg">
      
      <!-- Calendar Header -->
      <div class="flex justify-between items-center mb-8">
        <button on:click={prevMonth} class="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-2">
          &larr; <span class="hidden md:inline">{t.months[currentMonth === 0 ? 11 : currentMonth - 1]}</span>
        </button>
        <div class="text-center">
          <h2 class="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{t.months[currentMonth]} {fmt(currentYear)}</h2>
          <div class="text-sm md:text-base font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-2">
            <span class="text-amber-600 dark:text-amber-500">{bStr}</span> | <span class="text-emerald-600 dark:text-emerald-500">{hStr}</span>
          </div>
        </div>
        <button on:click={nextMonth} class="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-2">
          <span class="hidden md:inline">{t.months[currentMonth === 11 ? 0 : currentMonth + 1]}</span> &rarr;
        </button>
      </div>

      <!-- Calendar Grid -->
      <div class="w-full">
        <div class="grid grid-cols-7 gap-1 md:gap-2 mb-2">
          {#each t.weekdays as day, i}
            <div class="text-center py-2 font-bold text-sm {i === 5 || i === 6 ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}">{day}</div>
          {/each}
        </div>
        <div class="grid grid-cols-7 gap-1 md:gap-2">
          {#each calendarCells as cell}
            <div class="relative group aspect-square flex flex-col justify-between p-1 md:p-2 rounded-xl border {cell.empty ? 'opacity-30 pointer-events-none border-transparent' : 'border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors'} {cell.isToday ? '!bg-blue-50 dark:!bg-blue-900/20 !border-blue-500 shadow-[inset_0_0_0_2px_#3b82f6]' : ''} {cell.isWeekend && !cell.empty ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}">
              {#if !cell.empty && cell.isHoliday}
                <div class="absolute inset-0 bg-red-100/50 dark:bg-red-900/20 rounded-xl pointer-events-none"></div>
                <!-- Tooltip -->
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] bg-slate-900 text-white text-xs p-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none shadow-xl text-center">
                  {cell.tooltip}
                  <div class="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900"></div>
                </div>
              {/if}
              
              <div class="text-lg md:text-xl font-bold z-10 {cell.isHoliday ? 'text-red-600 dark:text-red-400' : ''}">{fmt(cell.date.getDate())}</div>
              
              <div class="flex justify-between items-end text-[10px] md:text-xs font-semibold z-10">
                <span class="text-amber-600 dark:text-amber-500">{fmt(cell.b.day)}</span>
                <span class="text-emerald-600 dark:text-emerald-500">{fmt(cell.h.day)}</span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Holidays List -->
    <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-lg">
      <h3 class="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
        <span class="text-red-500">📅</span> {t.holidayList}
      </h3>
      
      {#if !manifestCache}
        <div class="text-slate-500 dark:text-slate-400 py-4 text-center">Loading...</div>
      {:else if currentMonthHolidays.length === 0}
        <div class="text-slate-500 dark:text-slate-400 py-4 text-center">{t.noHolidays}</div>
      {:else}
        <ul class="flex flex-col gap-3 m-0 p-0 list-none">
          {#each currentMonthHolidays as h}
            <li class="flex flex-col md:flex-row gap-2 md:gap-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
              <div class="md:w-32 shrink-0 font-bold text-red-600 dark:text-red-400">
                {fmt(h.date)} {t.months[currentMonth]}
              </div>
              <div>
                <div class="font-bold text-slate-800 dark:text-slate-200">{h.name}</div>
                {#if h.desc}
                  <div class="text-sm text-slate-600 dark:text-slate-400 mt-1">{h.desc}</div>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</div>
