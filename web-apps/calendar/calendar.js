// calendar.js

// Language Dictionary
const dict = {
    bn: {
        weekdays: ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র", "শনি"],
        months: ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"],
        bMonths: ["বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"],
        hMonths: ["মহররম", "সফর", "রবিউল আউয়াল", "রবিউস সানি", "জমাদিউল আউয়াল", "জমাদিউস সানি", "রজব", "শাবান", "রমজান", "শাওয়াল", "জিলকদ", "জিলহজ"],
        prev: "আগে",
        next: "পরে",
        holidayList: "এই মাসের ছুটির দিন",
        ctaTitle: "পূর্ণ অভিজ্ঞতার জন্য Ekush Ponji ডাউনলোড করুন",
        ctaSub: "Get reminders, age calculator & more",
        ctaBtn: "Download on Google Play",
        noHolidays: "এই মাসে কোনো ছুটির দিন নেই",
        langToggle: "English",
        themeToggle: "ডার্ক মোড টগল করুন"
    },
    en: {
        weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        bMonths: ["Baishakh", "Jaistha", "Ashar", "Srabon", "Bhadro", "Ashwin", "Kartik", "Ogrohayon", "Poush", "Magh", "Falgun", "Chaitra"],
        hMonths: ["Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani", "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"],
        prev: "Prev",
        next: "Next",
        holidayList: "Holidays this month",
        ctaTitle: "Download Ekush Ponji for the full experience",
        ctaSub: "Get reminders, age calculator & more",
        ctaBtn: "Download on Google Play",
        noHolidays: "No holidays this month",
        langToggle: "বাংলা",
        themeToggle: "Toggle Dark Mode"
    }
};

let currentLang = 'bn';

// Utilities
function formatNum(number) {
    if (currentLang === 'en') return number.toString();
    const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return number.toString().replace(/[0-9]/g, w => bn[w]);
}

function getBanglaDateObj(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const y = d.getUTCFullYear();
    
    const april14 = new Date(Date.UTC(y, 3, 14));
    let startYear = y;
    let bYear = y - 593;
    
    if (d < april14) {
        startYear = y - 1;
        bYear = y - 594;
    }
    
    const startDate = new Date(Date.UTC(startYear, 3, 14));
    const diffTime = d.getTime() - startDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    const nextYear = startYear + 1;
    const isLeapYear = (nextYear % 4 === 0 && nextYear % 100 !== 0) || (nextYear % 400 === 0);
    const monthLengths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, isLeapYear ? 30 : 29, 30];
    
    let daysLeft = diffDays;
    let bMonth = 0;
    while (daysLeft >= monthLengths[bMonth]) {
        daysLeft -= monthLengths[bMonth];
        bMonth++;
    }
    
    return { day: daysLeft + 1, monthIndex: bMonth, year: bYear };
}

function getHijriDateObj(date) {
    let m = date.getMonth();
    let y = date.getFullYear();
    let d = date.getDate();

    let m1 = m + 1;
    let y1 = y;

    if (m1 < 3) {
        y1 -= 1;
        m1 += 12;
    }

    let a = Math.floor(y1 / 100);
    let b = 2 - a + Math.floor(a / 4);

    if (y < 1583) { b = 0; }
    if (y === 1582 && m > 9) { b = 2 - a + Math.floor(a / 4); }
    if (y === 1582 && m === 9 && d > 14) { b = 2 - a + Math.floor(a / 4); }

    let jd = Math.floor(365.25 * (y1 + 4716)) + Math.floor(30.6001 * (m1 + 1)) + d + b - 1524;
    let bjd = jd - 1948440 + 10632;
    let n = Math.floor((bjd - 1) / 10631);
    let bjd1 = bjd - 10631 * n + 354;
    let j = (Math.floor((10985 - bjd1) / 5316)) * (Math.floor((50 * bjd1) / 17719)) + (Math.floor(bjd1 / 5670)) * (Math.floor((43 * bjd1) / 15238));
    let bjd2 = bjd1 - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
    let m2 = Math.floor((24 * bjd2) / 709);
    let d2 = bjd2 - Math.floor((709 * m2) / 24);
    let y2 = 30 * n + j - 30;

    return { day: d2, monthIndex: m2 - 1, year: y2 };
}

// State
let currentTheme = localStorage.getItem('ekush_theme') || 'light';
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let holidaysCache = {};
let manifestCache = null;

// Don't assign navbar elements yet, they are injected dynamically
let langToggleBtn;
let themeToggleBtn;
let themeIconLight;
let themeIconDark;

// DOM Elements
const prevBtn = document.getElementById('prev-month');
const nextBtn = document.getElementById('next-month');
const monthYearDisplay = document.getElementById('current-month-year');
const monthYearSub = document.getElementById('current-month-sub');
const calendarWeekdays = document.getElementById('calendar-weekdays');
const calendarDays = document.getElementById('calendar-days');
const holidayListContainer = document.getElementById('holiday-list');

// Initialization
async function initCalendar() {
    initTheme();
    setupStaticEventListeners();
    // Render immediately so UI doesn't vanish while waiting for network
    await renderCalendar();
    
    // Fetch in background and re-render
    await fetchManifest();
    await renderCalendar();
}

function setupStaticEventListeners() {
    prevBtn.addEventListener('click', async () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        await renderCalendar();
    });

    nextBtn.addEventListener('click', async () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        await renderCalendar();
    });
}

window.addEventListener('componentsLoaded', () => {
    langToggleBtn = document.getElementById('lang-toggle');
    themeToggleBtn = document.getElementById('theme-toggle');
    themeIconLight = document.querySelector('.theme-icon--light');
    themeIconDark = document.querySelector('.theme-icon--dark');
    
    if (langToggleBtn && themeToggleBtn) {
        langToggleBtn.addEventListener('click', async () => {
            currentLang = currentLang === 'bn' ? 'en' : 'bn';
            updateUIStaticText();
            await renderCalendar();
        });

        themeToggleBtn.addEventListener('click', () => {
            currentTheme = currentTheme === 'light' ? 'dark' : 'light';
            applyTheme();
        });
        
        // Update their text using the current dict
        const t = dict[currentLang];
        langToggleBtn.textContent = t.langToggle;
        themeToggleBtn.title = t.themeToggle;
        applyTheme();
        syncNavbarHeaders();
    }
});

function syncNavbarHeaders() {
    const scrolledTitle = document.getElementById('nav-scrolled-title');
    const scrolledSub = document.getElementById('nav-scrolled-sub');
    if (scrolledTitle && monthYearDisplay) scrolledTitle.textContent = monthYearDisplay.textContent;
    if (scrolledSub && monthYearSub) scrolledSub.textContent = monthYearSub.textContent;
}

function initTheme() {
    applyTheme();
}

function applyTheme() {
    if (currentTheme === 'dark') {
        document.body.classList.add('dark');
        if (themeIconLight) themeIconLight.classList.add('theme-icon-hidden');
        if (themeIconDark) themeIconDark.classList.remove('theme-icon-hidden');
    } else {
        document.body.classList.remove('dark');
        if (themeIconLight) themeIconLight.classList.remove('theme-icon-hidden');
        if (themeIconDark) themeIconDark.classList.add('theme-icon-hidden');
    }
    localStorage.setItem('ekush_theme', currentTheme);
}

function updateUIStaticText() {
    const t = dict[currentLang];
    
    if (langToggleBtn) langToggleBtn.textContent = t.langToggle;
    if (themeToggleBtn) themeToggleBtn.title = t.themeToggle;
    
    prevBtn.querySelector('.prev-txt').textContent = t.prev;
    nextBtn.querySelector('.next-txt').textContent = t.next;
    
    document.getElementById('holiday-list-title').textContent = t.holidayList;
    document.getElementById('cta-title').textContent = t.ctaTitle;
    document.getElementById('cta-sub').textContent = t.ctaSub;
    document.getElementById('cta-btn').textContent = t.ctaBtn;
    
    // Render weekdays
    calendarWeekdays.innerHTML = '';
    t.weekdays.forEach((day, index) => {
        const div = document.createElement('div');
        div.className = 'weekday';
        if (index === 5 || index === 6) div.classList.add('weekend'); // Fri, Sat
        div.textContent = day;
        calendarWeekdays.appendChild(div);
    });
}

async function fetchWithCORSFallback(url) {
    try {
        const response = await fetch(url);
        // If it succeeds but isn't OK, we'll throw to try the proxy
        if (!response.ok) throw new Error("HTTP Status " + response.status);
        return response;
    } catch (e) {
        console.warn("Direct fetch failed (likely CORS), falling back to proxy for: " + url);
        return await fetch("https://corsproxy.io/?" + encodeURIComponent(url));
    }
}

async function fetchManifest() {
    try {
        const response = await fetchWithCORSFallback('https://hub.ekushlabs.com/ponji/manifest.json');
        if (response.ok) {
            manifestCache = await response.json();
        }
    } catch (e) {
        console.error("Failed to fetch manifest:", e);
    }
}

async function fetchHolidays(year) {
    if (holidaysCache[year]) return holidaysCache[year];
    if (!manifestCache || !manifestCache.datasets || !manifestCache.datasets.holidays) return [];
    
    const holidayFiles = manifestCache.datasets.holidays.files;
    const yearStr = year.toString();
    
    if (holidayFiles && holidayFiles[yearStr]) {
        try {
            const baseUrl = manifestCache.baseUrl || 'https://hub.ekushlabs.com/ponji';
            const url = `${baseUrl}/${holidayFiles[yearStr]}`;
            const response = await fetchWithCORSFallback(url);
            if (response.ok) {
                const data = await response.json();
                holidaysCache[year] = parseHolidays(data.holidays || []);
                return holidaysCache[year];
            }
        } catch (e) {
            console.error(`Failed to fetch holidays for ${year}:`, e);
        }
    }
    return [];
}

function parseHolidays(rawHolidays) {
    const holidayMap = {};
    rawHolidays.forEach(h => {
        if (h.gazetteType && h.gazetteType.startsWith('mandatory')) {
            const start = new Date(h.startDate);
            const end = h.endDate ? new Date(h.endDate) : start;
            
            let current = new Date(start);
            while (current <= end) {
                const dateStr = current.toISOString().split('T')[0];
                if (!holidayMap[dateStr]) holidayMap[dateStr] = [];
                holidayMap[dateStr].push(h);
                current.setDate(current.getDate() + 1);
            }
        }
    });
    return holidayMap;
}

async function renderCalendar() {
    const t = dict[currentLang];
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    
    // Update Header Text
    monthYearDisplay.textContent = `${t.months[currentMonth]} ${formatNum(currentYear)}`;
    
    const bStart = getBanglaDateObj(new Date(currentYear, currentMonth, 1));
    const bEnd = getBanglaDateObj(new Date(currentYear, currentMonth, daysInMonth));
    const hStart = getHijriDateObj(new Date(currentYear, currentMonth, 1));
    const hEnd = getHijriDateObj(new Date(currentYear, currentMonth, daysInMonth));
    
    let bngStr = `${t.bMonths[bStart.monthIndex]}`;
    if (bStart.monthIndex !== bEnd.monthIndex) {
        bngStr += ` - ${t.bMonths[bEnd.monthIndex]}`;
    }
    bngStr += ` ${formatNum(bEnd.year)}`; // usually ends in same year, display the later year

    let hjrStr = `${t.hMonths[hStart.monthIndex]}`;
    if (hStart.monthIndex !== hEnd.monthIndex) {
        hjrStr += ` - ${t.hMonths[hEnd.monthIndex]}`;
    }
    hjrStr += ` ${formatNum(hEnd.year)}`;
    
    monthYearSub.textContent = `${bngStr} | ${hjrStr}`;
    
    syncNavbarHeaders();
    
    calendarDays.innerHTML = '';
    const holidaysForYear = await fetchHolidays(currentYear);
    
    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;
    
    let currentMonthHolidays = [];
    let processedHolidayIds = new Set();
    
    // Fill empty slots before 1st day
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'day-cell empty';
        calendarDays.appendChild(emptyCell);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        cell.className = 'day-cell';
        
        const currentDate = new Date(currentYear, currentMonth, d);
        const dayOfWeek = currentDate.getDay();
        
        if (dayOfWeek === 5 || dayOfWeek === 6) {
            cell.classList.add('weekend');
        }
        
        if (isCurrentMonth && d === today.getDate()) {
            cell.classList.add('today');
        }
        
        const dateStr = new Date(currentDate.getTime() - (currentDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        
        let tooltips = [];
        if (holidaysForYear && holidaysForYear[dateStr]) {
            cell.classList.add('holiday');
            holidaysForYear[dateStr].forEach(h => {
                const hName = currentLang === 'bn' ? (h.namebn || h.name) : h.name;
                const hDesc = currentLang === 'bn' ? (h.descriptionbn || h.description || '') : (h.description || '');
                
                tooltips.push(hName);
                
                // Track for the list below
                if (!processedHolidayIds.has(h.id)) {
                    processedHolidayIds.add(h.id);
                    currentMonthHolidays.push({ date: d, name: hName, desc: hDesc });
                }
            });
        }
        
        const bngDate = getBanglaDateObj(currentDate);
        const hjrDate = getHijriDateObj(currentDate);
        
        let html = `
            <div class="date-main">${formatNum(d)}</div>
            <div class="date-bangla">${formatNum(bngDate.day)}</div>
            <div class="date-hijri">${formatNum(hjrDate.day)}</div>
        `;
        
        if (tooltips.length > 0) {
            html += `<div class="tooltip">${tooltips.join('<br>')}</div>`;
        }
        
        cell.innerHTML = html;
        calendarDays.appendChild(cell);
    }
    
    const totalCells = firstDay + daysInMonth;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let i = 0; i < remainingCells; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'day-cell empty';
        calendarDays.appendChild(emptyCell);
    }
    
    // Render Holiday List
    holidayListContainer.innerHTML = '';
    if (!manifestCache) {
        holidayListContainer.innerHTML = `<li class="holiday-list-item"><span style="color:#d32f2f;">Failed to load holidays. (Check internet or CORS/server)</span></li>`;
    } else if (currentMonthHolidays.length === 0) {
        holidayListContainer.innerHTML = `<li class="holiday-list-item"><span style="color:var(--cal-text-muted);">${t.noHolidays}</span></li>`;
    } else {
        currentMonthHolidays.forEach((h, index) => {
            const li = document.createElement('li');
            li.className = 'holiday-list-item';
            
            // Alternate colors for rows
            if (index % 2 === 1) {
                li.classList.add('alt-row');
            }
            
            const dateSpan = document.createElement('div');
            dateSpan.className = 'holiday-date-text';
            dateSpan.textContent = `${formatNum(h.date)} ${t.months[currentMonth]}`;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'holiday-content';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'holiday-name';
            nameSpan.textContent = h.name;
            contentDiv.appendChild(nameSpan);
            
            if (h.desc) {
                const descP = document.createElement('p');
                descP.className = 'holiday-desc';
                descP.textContent = h.desc;
                contentDiv.appendChild(descP);
            }
            
            li.appendChild(dateSpan);
            li.appendChild(contentDiv);
            holidayListContainer.appendChild(li);
        });
    }
}

// Start
initCalendar();
