/* ============================================================
   Ekush Ponji — calendar.js
   Plain script. theme.js and loader.js load before this.
   Handles: bilingual UI, Bangla/Hijri conversion, holiday
   fetching, calendar grid, and language toggle wiring.
============================================================ */

/* ─── LANGUAGE DICTIONARY ────────────────────────────────── */

var dict = {
  bn: {
    weekdays: ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'],
    months: ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'],
    bMonths: ['বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন', 'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র'],
    hMonths: ['মহররম', 'সফর', 'রবিউল আউয়াল', 'রবিউস সানি', 'জমাদিউল আউয়াল', 'জমাদিউস সানি', 'রজব', 'শাবান', 'রমজান', 'শাওয়াল', 'জিলকদ', 'জিলহজ'],
    holidayList: 'এই মাসের ছুটির দিন',
    noHolidays: 'এই মাসে কোনো ছুটির দিন নেই',
    langToggle: 'English',
    todayLabel: 'আজ',
    gregorianSuffix: 'খ্রীস্টাব্দ',
    banglaSuffix: 'বঙ্গাব্দ',
    hijriSuffix: 'হিজরি',
    bottomCtaTitle: 'একুশ পঞ্জি অ্যাপ ডাউনলোড করুন',
    bottomCtaDesc: 'ক্যালেন্ডার, ছুটি, ইভেন্ট, রিমাইন্ডার, বয়স ক্যালকুলেটর, দৈনিক উক্তি এবং আরও অনেক কিছু!',
    bottomCtaBtnText: 'একুশ পঞ্জি অ্যাপ ডাউনলোড করুন',
    fabCtaText: 'একুশ পঞ্জি অ্যাপ পান',
    navEkush: 'একুশ',
    navPonji: 'পঞ্জি',
    navCalTitle: 'বাংলা ক্যালেন্ডার',
    navSubTitle: 'গ্রেগোরিয়ান, বাংলা ও হিজরি তারিখ, সরকারি ছুটিসহ',
  },
  en: {
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    bMonths: ['Baishakh', 'Jaistha', 'Ashar', 'Srabon', 'Bhadro', 'Ashwin', 'Kartik', 'Ogrohayon', 'Poush', 'Magh', 'Falgun', 'Chaitra'],
    hMonths: ["Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani", "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"],
    holidayList: 'Holidays this month',
    noHolidays: 'No holidays this month',
    langToggle: 'বাংলা',
    todayLabel: 'Today',
    gregorianSuffix: '',
    banglaSuffix: 'BS',
    hijriSuffix: 'AH',
    bottomCtaTitle: 'Get the Ekush Ponji App',
    bottomCtaDesc: 'Calendar, Holidays, Events, Reminders, Age Calculator, Daily Quote and more.',
    bottomCtaBtnText: 'Get Ekush Ponji App',
    fabCtaText: 'Get Ekush Ponji App',
    navEkush: 'Ekush',
    navPonji: 'Ponji',
    navCalTitle: 'Bangla Calendar',
    navSubTitle: 'Gregorian, Bangla & Hijri Dates with Holidays',
  },
};

/* ─── STATE ──────────────────────────────────────────────── */

var currentLang  = 'bn';
var currentMonth = new Date().getMonth();
var currentYear  = new Date().getFullYear();
var holidaysCache = {};
var manifestCache = null;

/* ─── UTILITIES ──────────────────────────────────────────── */

function fmt(n) {
  if (currentLang === 'en') return n.toString();
  return n.toString().replace(/[0-9]/g, function (d) {
    return '০১২৩৪৫৬৭৮৯'[d];
  });
}

function getBanglaDate(date) {
  var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  var y = d.getUTCFullYear();
  var april14 = new Date(Date.UTC(y, 3, 14));
  var startYear = y, bYear = y - 593;
  if (d < april14) { startYear = y - 1; bYear = y - 594; }

  var startDate = new Date(Date.UTC(startYear, 3, 14));
  var diffDays  = Math.round((d - startDate) / 86400000);

  var ny = startYear + 1;
  var isLeap = (ny % 4 === 0 && ny % 100 !== 0) || ny % 400 === 0;
  var lengths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, isLeap ? 30 : 29, 30];

  var left = diffDays, bMonth = 0;
  while (left >= lengths[bMonth]) { left -= lengths[bMonth]; bMonth++; }
  return { day: left + 1, monthIndex: bMonth, year: bYear };
}

function getHijriDate(date) {
  var m = date.getMonth() + 1, y = date.getFullYear(), d = date.getDate();
  if (m < 3) { y--; m += 12; }
  var a = Math.floor(y / 100);
  var b = 0;
  if (y > 1582 || (y === 1582 && (m > 10 || (m === 10 && d > 14)))) {
    b = 2 - a + Math.floor(a / 4);
  }
  var jd   = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524;
  var bjd  = jd - 1948440 + 10632;
  var n    = Math.floor((bjd - 1) / 10631);
  var bjd1 = bjd - 10631 * n + 354;
  var j    = (Math.floor((10985 - bjd1) / 5316)) * (Math.floor((50 * bjd1) / 17719))
           + (Math.floor(bjd1 / 5670)) * (Math.floor((43 * bjd1) / 15238));
  var bjd2 = bjd1
    - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50))
    - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
  var m2 = Math.floor((24 * bjd2) / 709);
  var d2 = bjd2 - Math.floor((709 * m2) / 24);
  var y2 = 30 * n + j - 30;
  return { day: d2, monthIndex: m2 - 1, year: y2 };
}

/* ─── DOM REFS ───────────────────────────────────────────── */

var prevBtn        = document.getElementById('prev-month');
var nextBtn        = document.getElementById('next-month');
var monthYearEl    = document.getElementById('current-month-year');
var monthYearSub   = document.getElementById('current-month-sub');
var weekdaysGrid   = document.getElementById('calendar-weekdays');
var daysGrid       = document.getElementById('calendar-days');
var holidayListEl  = document.getElementById('holiday-list');
var todayGregorian = document.getElementById('today-gregorian');
var todayBangla    = document.getElementById('today-bangla');
var todayHijri     = document.getElementById('today-hijri');
var todayTitle     = document.getElementById('today-widget-title');
var holidayTitle   = document.getElementById('holiday-list-title');
var ctaTitle       = document.getElementById('bottom-cta-title');
var ctaDesc        = document.getElementById('bottom-cta-desc');
var ctaBtnText     = document.getElementById('bottom-cta-btn-text');
var fabText        = document.getElementById('fab-cta-text');

/* ─── NAVBAR TITLE UPDATE ────────────────────────────────── */

function updateNavbarTitles(t) {
  var ekushEl = document.querySelector('.nav-ekush');
  var ponjiEl = document.querySelector('.nav-ponji-text');
  var calEl   = document.getElementById('nav-cal-title');
  var subEl   = document.getElementById('nav-sub-title');
  var scrTitle = document.getElementById('nav-scrolled-title');
  var scrSub   = document.getElementById('nav-scrolled-sub');

  if (ekushEl)   ekushEl.textContent   = t.navEkush;
  if (ponjiEl)   ponjiEl.textContent   = t.navPonji;
  if (calEl)     calEl.textContent     = t.navCalTitle;
  if (subEl)     subEl.textContent     = t.navSubTitle;
  if (scrTitle)  scrTitle.textContent  = monthYearEl.textContent;
  if (scrSub)    scrSub.textContent    = monthYearSub.textContent;
}

/* ─── STATIC TEXT ────────────────────────────────────────── */

function updateStaticText() {
  var t = dict[currentLang];
  var langBtn = document.getElementById('lang-toggle');
  if (langBtn) langBtn.title = t.langToggle;

  if (holidayTitle) holidayTitle.textContent = t.holidayList;
  if (todayTitle)   todayTitle.textContent   = t.todayLabel;
  if (ctaTitle)     ctaTitle.textContent     = t.bottomCtaTitle;
  if (ctaDesc)      ctaDesc.textContent      = t.bottomCtaDesc;
  if (ctaBtnText)   ctaBtnText.textContent   = t.bottomCtaBtnText;
  if (fabText)      fabText.textContent      = t.fabCtaText;

  weekdaysGrid.innerHTML = '';
  t.weekdays.forEach(function (day, i) {
    var div = document.createElement('div');
    div.className = 'weekday' + (i === 5 || i === 6 ? ' weekend' : '');
    div.textContent = day;
    weekdaysGrid.appendChild(div);
  });

  updateNavbarTitles(t);
}

/* ─── TODAY WIDGET ───────────────────────────────────────── */

function updateTodayWidget() {
  var t     = dict[currentLang];
  var today = new Date();

  if (todayGregorian) {
    todayGregorian.textContent =
      (fmt(today.getDate()) + ' ' + t.months[today.getMonth()] + ' ' + fmt(today.getFullYear()) + ' ' + t.gregorianSuffix).trim();
  }

  var b = getBanglaDate(today);
  if (todayBangla) {
    todayBangla.textContent =
      (fmt(b.day) + ' ' + t.bMonths[b.monthIndex] + ' ' + fmt(b.year) + ' ' + t.banglaSuffix).trim();
  }

  var h = getHijriDate(today);
  if (todayHijri) {
    todayHijri.textContent =
      (fmt(h.day) + ' ' + t.hMonths[h.monthIndex] + ' ' + fmt(h.year) + ' ' + t.hijriSuffix).trim();
  }
}

/* ─── DATA FETCHING ──────────────────────────────────────── */

async function fetchManifest() {
  try {
    var r = await fetch('assets/data/manifest.json');
    if (r.ok) manifestCache = await r.json();
  } catch (e) {
    console.error('[Calendar] Manifest fetch failed:', e);
  }
}

async function fetchHolidays(year) {
  if (holidaysCache[year]) return holidaysCache[year];
  if (!manifestCache || !manifestCache.datasets || !manifestCache.datasets.holidays) return {};

  var file = manifestCache.datasets.holidays.files[year.toString()];
  if (!file) return {};

  try {
    var r = await fetch('assets/data/' + file);
    if (!r.ok) return {};
    var data = await r.json();
    holidaysCache[year] = parseHolidays(data.holidays || []);
    return holidaysCache[year];
  } catch (e) {
    console.error('[Calendar] Holidays fetch failed for ' + year + ':', e);
    return {};
  }
}

function parseHolidays(raw) {
  var map = {};
  raw.forEach(function (h) {
    if (!h.gazetteType || !h.gazetteType.startsWith('mandatory')) return;
    var start = new Date(h.startDate);
    var end   = h.endDate ? new Date(h.endDate) : new Date(h.startDate);
    var cur   = new Date(start);
    while (cur <= end) {
      var key = cur.toISOString().split('T')[0];
      if (!map[key]) map[key] = [];
      map[key].push(h);
      cur.setDate(cur.getDate() + 1);
    }
  });
  return map;
}

/* ─── CALENDAR RENDERING ─────────────────────────────────── */

function makeDayCell(dateObj, classes) {
  var cell = document.createElement('div');
  cell.className = ['day-cell'].concat(classes || []).join(' ');
  var b = getBanglaDate(dateObj);
  var h = getHijriDate(dateObj);
  cell.innerHTML =
    '<div class="date-main">' + fmt(dateObj.getDate()) + '</div>' +
    '<div class="date-bottom-row">' +
      '<div class="date-bangla">' + fmt(b.day) + '</div>' +
      '<div class="date-hijri">'  + fmt(h.day) + '</div>' +
    '</div>';
  return cell;
}

async function renderCalendar() {
  var t           = dict[currentLang];
  var daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  var firstDay    = new Date(currentYear, currentMonth, 1).getDay();
  var today       = new Date();
  var isThisMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

  // Header text
  monthYearEl.textContent =
    t.months[currentMonth] + ' ' + fmt(currentYear);

  prevBtn.querySelector('.prev-txt').textContent =
    t.months[currentMonth === 0 ? 11 : currentMonth - 1];
  nextBtn.querySelector('.next-txt').textContent =
    t.months[currentMonth === 11 ? 0 : currentMonth + 1];

  var bStart = getBanglaDate(new Date(currentYear, currentMonth, 1));
  var bEnd   = getBanglaDate(new Date(currentYear, currentMonth, daysInMonth));
  var hStart = getHijriDate(new Date(currentYear, currentMonth, 1));
  var hEnd   = getHijriDate(new Date(currentYear, currentMonth, daysInMonth));

  var bStr = bStart.monthIndex !== bEnd.monthIndex
    ? t.bMonths[bStart.monthIndex] + ' - ' + t.bMonths[bEnd.monthIndex] + ' ' + fmt(bEnd.year)
    : t.bMonths[bStart.monthIndex] + ' ' + fmt(bEnd.year);

  var hStr = hStart.monthIndex !== hEnd.monthIndex
    ? t.hMonths[hStart.monthIndex] + ' - ' + t.hMonths[hEnd.monthIndex] + ' ' + fmt(hEnd.year)
    : t.hMonths[hStart.monthIndex] + ' ' + fmt(hEnd.year);

  monthYearSub.innerHTML =
    '<span class="bng-month">' + bStr + '</span> | <span class="hjr-month">' + hStr + '</span>';

  updateNavbarTitles(t);

  // Fetch holidays
  var holidays = await fetchHolidays(currentYear);
  daysGrid.innerHTML = '';

  var monthHolidays = [];
  var seenIds = {};

  // Leading empty cells
  for (var i = 0; i < firstDay; i++) {
    var prevDate = new Date(currentYear, currentMonth, -i);
    daysGrid.appendChild(makeDayCell(prevDate, ['empty']));
  }

  // Current month cells
  for (var d = 1; d <= daysInMonth; d++) {
    var dateObj   = new Date(currentYear, currentMonth, d);
    var dayOfWeek = dateObj.getDay();
    var classes   = [];

    if (dayOfWeek === 5 || dayOfWeek === 6) classes.push('weekend');
    if (isThisMonth && d === today.getDate()) classes.push('today');

    var mm      = String(currentMonth + 1).padStart(2, '0');
    var dd      = String(d).padStart(2, '0');
    var dateKey = currentYear + '-' + mm + '-' + dd;
    var dayHols = holidays[dateKey] || [];
    var tooltipNames = [];

    if (dayHols.length) {
      classes.push('holiday');
      dayHols.forEach(function (h) {
        var name = currentLang === 'bn' ? (h.namebn || h.name) : h.name;
        var desc = currentLang === 'bn' ? (h.descriptionbn || h.description || '') : (h.description || '');
        tooltipNames.push(name);
        if (!seenIds[h.id]) {
          seenIds[h.id] = true;
          monthHolidays.push({ date: d, name: name, desc: desc });
        }
      });
    }

    var cell = makeDayCell(dateObj, classes);

    if (tooltipNames.length) {
      var tip = document.createElement('div');
      tip.className = 'custom-tooltip';
      tip.textContent = tooltipNames.join(', ');
      cell.appendChild(tip);
    }

    daysGrid.appendChild(cell);
  }

  // Trailing empty cells
  var total     = firstDay + daysInMonth;
  var remaining = (7 - (total % 7)) % 7;
  for (var j = 0; j < remaining; j++) {
    var nextDate = new Date(currentYear, currentMonth + 1, j + 1);
    daysGrid.appendChild(makeDayCell(nextDate, ['empty']));
  }

  // Holiday list widget
  holidayListEl.innerHTML = '';
  if (!manifestCache) {
    holidayListEl.innerHTML = '<li class="holiday-list-item"><span style="color:#d32f2f;">ছুটির তালিকা লোড হয়নি।</span></li>';
  } else if (!monthHolidays.length) {
    holidayListEl.innerHTML = '<li class="holiday-list-item"><span style="color:var(--cal-text-muted);">' + t.noHolidays + '</span></li>';
  } else {
    monthHolidays.forEach(function (h) {
      var li = document.createElement('li');
      li.className = 'holiday-list-item';
      li.innerHTML =
        '<div class="holiday-date-col">' +
          '<div class="holiday-date-text">' + fmt(h.date) + ' ' + t.months[currentMonth] + '</div>' +
        '</div>' +
        '<div class="holiday-content-col">' +
          '<span class="holiday-name">' + h.name + '</span>' +
          (h.desc ? '<p class="holiday-desc">' + h.desc + '</p>' : '') +
        '</div>';
      holidayListEl.appendChild(li);
    });
  }
}

/* ─── LANGUAGE TOGGLE ────────────────────────────────────── */

function bindLangToggle() {
  var btn = document.getElementById('lang-toggle');
  if (!btn) return;
  btn.addEventListener('click', async function () {
    currentLang = currentLang === 'bn' ? 'en' : 'bn';
    updateStaticText();
    updateTodayWidget();
    await renderCalendar();
  });
}

/* ─── NAVIGATION ─────────────────────────────────────────── */

prevBtn.addEventListener('click', async function () {
  currentMonth--;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  await renderCalendar();
});

nextBtn.addEventListener('click', async function () {
  currentMonth++;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  await renderCalendar();
});

/* ─── INIT ───────────────────────────────────────────────── */

async function initCalendar() {
  // Apply stored theme immediately via shared EkushTheme
  if (window.EkushTheme) {
    window.EkushTheme.applyTheme(window.EkushTheme.getStoredTheme());
  }

  updateStaticText();
  updateTodayWidget();
  await fetchManifest();
  await renderCalendar();
}

// Lang toggle button lives in the static navbar in this HTML,
// so it's available immediately — no need to wait for components.
document.addEventListener('DOMContentLoaded', function () {
  bindLangToggle();
  initCalendar();
});