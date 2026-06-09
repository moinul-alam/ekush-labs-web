<script>
  import { onMount } from "svelte";

  const dict = {
    bn: {
      weekdays: ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র", "শনি"],
      months: [
        "জানুয়ারি",
        "ফেব্রুয়ারি",
        "মার্চ",
        "এপ্রিল",
        "মে",
        "জুন",
        "জুলাই",
        "আগস্ট",
        "সেপ্টেম্বর",
        "অক্টোবর",
        "নভেম্বর",
        "ডিসেম্বর",
      ],
      bMonths: [
        "বৈশাখ",
        "জ্যৈষ্ঠ",
        "আষাঢ়",
        "শ্রাবণ",
        "ভাদ্র",
        "আশ্বিন",
        "কার্তিক",
        "অগ্রহায়ণ",
        "পৌষ",
        "মাঘ",
        "ফাল্গুন",
        "চৈত্র",
      ],
      hMonths: [
        "মহররম",
        "সফর",
        "রবিউল আউয়াল",
        "রবিউস সানি",
        "জমাদিউল আউয়াল",
        "জমাদিউস সানি",
        "রজব",
        "শাবান",
        "রমজান",
        "শাওয়াল",
        "জিলকদ",
        "জিলহজ",
      ],
      holidayList: "এই মাসের ছুটির দিন",
      noHolidays: "এই মাসে কোনো ছুটির দিন নেই",
      todayLabel: "আজ",
      gregorianSuffix: "খ্রীস্টাব্দ",
      banglaSuffix: "বঙ্গাব্দ",
      hijriSuffix: "হিজরি",
      banglaLabel: "বাংলা",
      hijriLabel: "হিজরি",
      loading: "লোড হচ্ছে...",
      cancelLabel: "বাতিল",
      resetLabel: "চলতি মাস",
    },
    en: {
      weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      months: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
      bMonths: [
        "Baishakh",
        "Jaistha",
        "Ashar",
        "Srabon",
        "Bhadro",
        "Ashwin",
        "Kartik",
        "Ogrohayon",
        "Poush",
        "Magh",
        "Falgun",
        "Chaitra",
      ],
      hMonths: [
        "Muharram",
        "Safar",
        "Rabi' al-Awwal",
        "Rabi' al-Thani",
        "Jumada al-Awwal",
        "Jumada al-Thani",
        "Rajab",
        "Sha'ban",
        "Ramadan",
        "Shawwal",
        "Dhu al-Qi'dah",
        "Dhu al-Hijjah",
      ],
      holidayList: "Holidays this month",
      noHolidays: "No holidays this month",
      todayLabel: "Today",
      gregorianSuffix: "",
      banglaSuffix: "BS",
      hijriSuffix: "AH",
      banglaLabel: "Bangla",
      hijriLabel: "Hijri",
      loading: "Loading...",
      cancelLabel: "Cancel",
      resetLabel: "Current Month",
    },
  };

  export let lang = "en";

  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  const today = new Date();

  let manifestCache = null;
  let holidaysCache = {};
  let currentMonthHolidays = [];
  let calendarCells = [];

  $: t = dict[lang];

  function fmt(n) {
    if (lang === "en") return n.toString();
    return n.toString().replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
  }

  function getBanglaDate(date) {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const y = d.getUTCFullYear();
    const april14 = new Date(Date.UTC(y, 3, 14));
    let startYear = y,
      bYear = y - 593;
    if (d < april14) {
      startYear = y - 1;
      bYear = y - 594;
    }

    const startDate = new Date(Date.UTC(startYear, 3, 14));
    let diffDays = Math.round((d - startDate) / 86400000);

    const ny = startYear + 1;
    const isLeap = (ny % 4 === 0 && ny % 100 !== 0) || ny % 400 === 0;
    const lengths = [
      31,
      31,
      31,
      31,
      31,
      31,
      30,
      30,
      30,
      30,
      isLeap ? 30 : 29,
      30,
    ];

    let left = diffDays,
      bMonth = 0;
    while (left >= lengths[bMonth]) {
      left -= lengths[bMonth];
      bMonth++;
    }
    return { day: left + 1, monthIndex: bMonth, year: bYear };
  }

  function getHijriDate(date) {
    let m = date.getMonth() + 1,
      y = date.getFullYear(),
      d = date.getDate();
    if (m < 3) {
      y--;
      m += 12;
    }
    const a = Math.floor(y / 100);
    let b = 0;
    if (y > 1582 || (y === 1582 && (m > 10 || (m === 10 && d > 14)))) {
      b = 2 - a + Math.floor(a / 4);
    }
    const jd =
      Math.floor(365.25 * (y + 4716)) +
      Math.floor(30.6001 * (m + 1)) +
      d +
      b -
      1524;
    const bjd = jd - 1948440 + 10632;
    const n = Math.floor((bjd - 1) / 10631);
    const bjd1 = bjd - 10631 * n + 354;
    const j =
      Math.floor((10985 - bjd1) / 5316) * Math.floor((50 * bjd1) / 17719) +
      Math.floor(bjd1 / 5670) * Math.floor((43 * bjd1) / 15238);
    const bjd2 =
      bjd1 -
      Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
      Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
      29;
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

  $: bStr =
    bStart.monthIndex !== bEnd.monthIndex
      ? `${t.bMonths[bStart.monthIndex]} - ${t.bMonths[bEnd.monthIndex]} ${fmt(bEnd.year)}`
      : `${t.bMonths[bStart.monthIndex]} ${fmt(bEnd.year)}`;

  $: hStr =
    hStart.monthIndex !== hEnd.monthIndex
      ? `${t.hMonths[hStart.monthIndex]} - ${t.hMonths[hEnd.monthIndex]} ${fmt(hEnd.year)}`
      : `${t.hMonths[hStart.monthIndex]} ${fmt(hEnd.year)}`;

  onMount(async () => {
    try {
      const res = await fetch("/calendar-assets/data/manifest.json");
      if (res.ok) manifestCache = await res.json();
    } catch (e) {
      console.error("[Calendar] Manifest fetch failed:", e);
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
      data.holidays?.forEach((h) => {
        if (!h.gazetteType?.startsWith("mandatory")) return;
        let cur = new Date(h.startDate);
        const end = h.endDate ? new Date(h.endDate) : new Date(h.startDate);
        while (cur <= end) {
          const key = cur.toISOString().split("T")[0];
          if (!map[key]) map[key] = [];
          map[key].push(h);
          cur.setDate(cur.getDate() + 1);
        }
      });
      holidaysCache[year] = map;
      return map;
    } catch (e) {
      console.error("[Calendar] Holidays fetch failed:", e);
      return {};
    }
  }

  async function updateCalendar() {
    const holidays = await fetchHolidays(currentYear);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const isThisMonth =
      today.getMonth() === currentMonth && today.getFullYear() === currentYear;

    let cells = [];
    let hols = [];
    const seenIds = new Set();

    for (let i = 0; i < firstDay; i++) {
      const prevDate = new Date(currentYear, currentMonth, -i);
      cells.unshift({
        empty: true,
        date: prevDate,
        b: getBanglaDate(prevDate),
        h: getHijriDate(prevDate),
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(currentYear, currentMonth, d);
      const dayOfWeek = dateObj.getDay();
      const mm = String(currentMonth + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      const dateKey = `${currentYear}-${mm}-${dd}`;
      const dayHols = holidays[dateKey] || [];

      let tooltipNames = [];
      dayHols.forEach((h) => {
        const name = lang === "bn" ? h.namebn || h.name : h.name;
        const desc =
          lang === "bn"
            ? h.descriptionbn || h.description || ""
            : h.description || "";
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
        tooltip: tooltipNames.join(", "),
      });
    }

    const total = firstDay + daysInMonth;
    const remaining = (7 - (total % 7)) % 7;
    for (let j = 0; j < remaining; j++) {
      const nextDate = new Date(currentYear, currentMonth + 1, j + 1);
      cells.push({
        empty: true,
        date: nextDate,
        b: getBanglaDate(nextDate),
        h: getHijriDate(nextDate),
      });
    }

    calendarCells = cells;
    currentMonthHolidays = hols;
  }

  function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    updateCalendar();
  }

  function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    updateCalendar();
  }

  // Month Picker
  let showPicker = false;
  let pickerYear = currentYear;

  function openPicker() {
    pickerYear = currentYear;
    showPicker = true;
  }

  function selectMonth(m) {
    currentMonth = m;
    currentYear = pickerYear;
    showPicker = false;
    updateCalendar();
  }

  function resetToCurrent() {
    const d = new Date();
    currentMonth = d.getMonth();
    currentYear = d.getFullYear();
    showPicker = false;
    updateCalendar();
  }

  function closePicker() {
    showPicker = false;
  }

  // Re-run if lang changes
  $: {
    lang;
    if (manifestCache) updateCalendar();
  }
</script>

<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[90rem] mx-auto">
  <!-- Left Column: Main Calendar Grid -->
  <div class="lg:col-span-8 flex flex-col gap-6">
    <div
      class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-10 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl shadow-slate-200/50 dark:shadow-none relative"
    >
      <!-- Premium background glows -->
      <div class="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 rounded-full bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 blur-3xl pointer-events-none"></div>

      <!-- Calendar Header -->
      <div class="relative flex justify-between items-center mb-8 z-10">
        <button
          on:click={prevMonth}
          class="p-3 md:px-5 md:py-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          &larr; <span class="hidden md:inline">{t.months[currentMonth === 0 ? 11 : currentMonth - 1]}</span>
        </button>
        <div class="text-center">
          <div class="flex items-center justify-center gap-2">
            <h2
              class="text-2xl md:text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent"
            >
              {t.months[currentMonth]}
              {fmt(currentYear)}
            </h2>
            <button
              on:click={openPicker}
              class="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
              title="Pick month & year"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          <div
            class="text-sm md:text-base font-bold mt-2 flex items-center justify-center gap-3"
          >
            <span class="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full">{bStr}</span>
            <span class="px-3 py-1 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full">{hStr}</span>
          </div>
        </div>
        <button
          on:click={nextMonth}
          class="p-3 md:px-5 md:py-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          <span class="hidden md:inline">{t.months[currentMonth === 11 ? 0 : currentMonth + 1]}</span> &rarr;
        </button>
      </div>

      <!-- Calendar Grid -->
      <div class="w-full relative z-10">
        <div class="grid grid-cols-7 gap-2 md:gap-3 mb-3">
          {#each t.weekdays as day, i}
            <div
              class="text-center py-2 font-bold text-xs md:text-sm uppercase tracking-wider {i ===
                5 || i === 6
                ? 'text-red-500'
                : 'text-slate-500 dark:text-slate-400'}"
            >
              {day}
            </div>
          {/each}
        </div>
        <div class="grid grid-cols-7 gap-2 md:gap-3">
          {#each calendarCells as cell}
            <div
              class="relative group aspect-square flex items-center justify-center p-2 rounded-2xl border transition-all duration-300 hover:z-40 {cell.empty
                ? 'opacity-0 pointer-events-none'
                : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none hover:-translate-y-1'} {cell.isToday
                ? '!bg-gradient-to-br !from-blue-500 !to-indigo-600 !border-transparent !text-white shadow-lg shadow-blue-500/30'
                : ''} {cell.isWeekend && !cell.empty && !cell.isToday
                ? 'text-red-600 dark:text-red-400'
                : !cell.isToday ? 'text-slate-800 dark:text-slate-200' : ''}"
            >
              {#if !cell.empty && cell.isHoliday}
                <div
                  class="absolute inset-0 bg-red-200/60 dark:bg-red-500/30 rounded-2xl pointer-events-none"
                ></div>
                <!-- Premium Tooltip -->
                <div
                  class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max max-w-[220px] bg-white dark:bg-slate-800 backdrop-blur-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] md:text-xs p-3 md:p-4 rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30 pointer-events-none shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] text-center font-bold tracking-wide"
                >
                  {cell.tooltip}
                  <div
                    class="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-200 dark:border-t-slate-700"
                  ></div>
                  <div
                    class="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-white dark:border-t-slate-800"
                    style="margin-top: -1px;"
                  ></div>
                </div>
              {/if}

              <div
                class="text-lg md:text-xl lg:text-2xl font-black z-10 pb-2 md:pb-3 {cell.isHoliday && !cell.isToday
                  ? 'text-red-600 dark:text-red-400'
                  : ''}"
              >
                {fmt(cell.date.getDate())}
              </div>

              {#if !cell.empty}
                <div
                  class="absolute bottom-1.5 inset-x-1.5 md:bottom-2 md:inset-x-2 flex justify-between items-end text-[9px] md:text-[11px] font-bold z-10"
                >
                  <span class="{cell.isToday ? 'text-white/80' : 'text-emerald-600 dark:text-emerald-500'}"
                    >{fmt(cell.b.day)}</span
                  >
                  <span class="{cell.isToday ? 'text-white/80' : 'text-orange-600 dark:text-orange-500'}"
                    >{fmt(cell.h.day)}</span
                  >
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <!-- Right Column: Today & Holidays -->
  <div class="lg:col-span-4 flex flex-col gap-6">
    <!-- Premium Today Widget -->
    <div
      class="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[2.5rem] p-8 text-slate-800 dark:text-slate-200 relative overflow-hidden flex flex-col gap-6"
    >
      <!-- Glass accents -->
      <div class="absolute top-0 right-0 -mr-24 -mt-24 w-64 h-64 rounded-full bg-gradient-to-br from-orange-500/10 to-rose-500/10 blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 -ml-24 -mb-24 w-64 h-64 rounded-full bg-gradient-to-tr from-violet-500/10 to-fuchsia-500/10 blur-3xl pointer-events-none"></div>
      
      <div
        class="text-center pb-6 border-b border-slate-200 dark:border-slate-700/50 relative z-10"
      >
        <h3 class="text-lg font-bold text-slate-500 dark:text-slate-400 mb-4 tracking-wide uppercase">
          {t.todayLabel}
        </h3>
        <div class="text-6xl font-black mb-2 bg-gradient-to-r from-blue-800 to-blue-900 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent drop-shadow-sm">
          {fmt(today.getDate())}
        </div>
        <div class="text-2xl font-bold text-blue-900 dark:text-blue-200">
          {t.months[today.getMonth()]}
          {fmt(today.getFullYear())}
          <span class="text-lg font-medium text-blue-700 dark:text-blue-400 ml-1">{t.gregorianSuffix}</span>
        </div>
      </div>

      <div class="flex flex-col gap-4 relative z-10">
        <div
          class="bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-md p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50"
        >
          <div
            class="text-xs font-bold text-emerald-600 dark:text-emerald-500 mb-1 uppercase tracking-wider"
          >
            {t.banglaLabel}
          </div>
          <div class="text-lg font-bold text-emerald-700 dark:text-emerald-400">
            {fmt(todayBangla.day)}
            {t.bMonths[todayBangla.monthIndex]}
            {fmt(todayBangla.year)}
            <span class="text-sm font-medium text-emerald-600 dark:text-emerald-500 ml-1">{t.banglaSuffix}</span>
          </div>
        </div>
        <div
          class="bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-md p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50"
        >
          <div
            class="text-xs font-bold text-orange-600 dark:text-orange-500 mb-1 uppercase tracking-wider"
          >
            {t.hijriLabel}
          </div>
          <div class="text-lg font-bold text-orange-600 dark:text-orange-400">
            {fmt(todayHijri.day)}
            {t.hMonths[todayHijri.monthIndex]}
            {fmt(todayHijri.year)}
            <span class="text-sm font-medium text-orange-500 dark:text-orange-500 ml-1">{t.hijriSuffix}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Holidays List -->
    <div
      class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/50 dark:shadow-none flex-1 flex flex-col"
    >
      <h3
        class="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-3"
      >
        <span class="flex items-center justify-center w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-500">📅</span>
        {t.holidayList}
      </h3>

      <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {#if !manifestCache}
          <div class="text-slate-500 dark:text-slate-400 py-10 text-center font-medium">
            {t.loading}
          </div>
        {:else if currentMonthHolidays.length === 0}
          <div class="text-slate-500 dark:text-slate-400 py-10 text-center font-medium flex flex-col items-center gap-3">
            <span class="text-4xl opacity-50">✨</span>
            {t.noHolidays}
          </div>
        {:else}
          <ul class="flex flex-col gap-4 m-0 p-0 list-none">
            {#each currentMonthHolidays as h}
              <li
                class="flex flex-col gap-2 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-red-200 dark:hover:border-red-500/30 transition-colors group"
              >
                <div
                  class="font-black text-red-500 dark:text-red-400 text-sm uppercase tracking-wide"
                >
                  {fmt(h.date)}
                  {t.months[currentMonth]}
                </div>
                <div>
                  <div class="font-bold text-slate-800 dark:text-slate-200 text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {h.name}
                  </div>
                  {#if h.desc}
                    <div class="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                      {h.desc}
                    </div>
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>
  </div>
</div>

{#if showPicker}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-700">
      <!-- Header with Year Navigation -->
      <div class="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
        <button on:click={() => pickerYear--} class="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors font-bold text-slate-600 dark:text-slate-300">
          &larr;
        </button>
        <div class="text-xl font-bold text-slate-800 dark:text-slate-200">
          {fmt(pickerYear)}
        </div>
        <button on:click={() => pickerYear++} class="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors font-bold text-slate-600 dark:text-slate-300">
          &rarr;
        </button>
      </div>
      <!-- Month Grid -->
      <div class="p-4 grid grid-cols-3 gap-2">
        {#each t.months as monthName, i}
          <button
            on:click={() => selectMonth(i)}
            class="p-3 text-center rounded-xl font-semibold text-sm transition-all {currentMonth === i && currentYear === pickerYear ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}"
          >
            {monthName}
          </button>
        {/each}
      </div>
      <!-- Footer -->
      <div class="p-4 border-t border-slate-100 dark:border-slate-700 flex gap-3">
        <button on:click={closePicker} class="flex-1 p-3 text-center font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
          {t.cancelLabel}
        </button>
        <button on:click={resetToCurrent} class="flex-1 p-3 text-center font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors">
          {t.resetLabel}
        </button>
      </div>
    </div>
  </div>
{/if}
