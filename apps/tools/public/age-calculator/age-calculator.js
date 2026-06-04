/* ============================================================
   Age Calculator — age-calculator.js
   Calculates age in years, months, days, total days, months, weeks, hours
============================================================ */

/* ─── LANGUAGE DICTIONARY ────────────────────────────────── */
var dict = {
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
    langToggle: 'English',
    bottomCtaTitle: 'একুশ পঞ্জি অ্যাপ ডাউনলোড করুন',
    bottomCtaDesc: 'ক্যালেন্ডার, ছুটি, ইভেন্ট, রিমাইন্ডার, বয়স ক্যালকুলেটর, দৈনিক উক্তি এবং আরও অনেক কিছু!',
    bottomCtaBtnText: 'একুশ পঞ্জি অ্যাপ ডাউনলোড করুন',
    navBackText: 'ফিরে',
    navEkush: 'একুশ',
    navPonji: 'পঞ্জি',
    navCalTitle: 'বয়স ক্যালকুলেটর',
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
    langToggle: 'বাংলা',
    bottomCtaTitle: 'Get the Ekush Ponji App',
    bottomCtaDesc: 'Calendar, Holidays, Events, Reminders, Age Calculator, Daily Quote and more.',
    bottomCtaBtnText: 'Get Ekush Ponji App',
    navBackText: 'Back',
    navEkush: 'Ekush',
    navPonji: 'Ponji',
    navCalTitle: 'Age Calculator',
  },
};

/* ─── STATE ──────────────────────────────────────────────── */
var currentLang = 'bn';
var currentResults = null;

/* ─── UTILITIES ──────────────────────────────────────────── */
function fmt(n) {
  if (currentLang === 'en') return n.toString();
  return n.toString().replace(/[0-9]/g, function (d) {
    return '০১২৩৪৫৬৭৮৯'[d];
  });
}

function formatNumberWithCommas(n) {
  if (currentLang === 'en') return n.toLocaleString('en-US');
  // For Bangla, we can just format with commas but keep Bangla digits
  return n.toLocaleString('bn-BD');
}

/* ─── AGE CALCULATION LOGIC ─────────────────────────────── */
function calculateAge(startDate, endDate) {
  if (!startDate || !endDate) return null;
  
  var start = new Date(startDate);
  var end = new Date(endDate);
  
  // Ensure start <= end
  if (start > end) {
    var temp = start;
    start = end;
    end = temp;
  }
  
  var years = end.getFullYear() - start.getFullYear();
  var months = end.getMonth() - start.getMonth();
  var days = end.getDate() - start.getDate();
  
  if (days < 0) {
    months--;
    var lastMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += lastMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  var totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));
  var totalMonths = years * 12 + months;
  var totalWeeks = Math.floor(totalDays / 7);
  var totalHours = totalDays * 24;
  
  return {
    years: years,
    months: months,
    days: days,
    totalDays: totalDays,
    totalMonths: totalMonths,
    totalWeeks: totalWeeks,
    totalHours: totalHours
  };
}

/* ─── DOM REFS ───────────────────────────────────────────── */
// Start date inputs
var startDay = document.getElementById('start-day');
var startMonth = document.getElementById('start-month');
var startYear = document.getElementById('start-year');
var startCalendar = document.getElementById('start-calendar');

// End date inputs
var endDay = document.getElementById('end-day');
var endMonth = document.getElementById('end-month');
var endYear = document.getElementById('end-year');
var endCalendar = document.getElementById('end-calendar');

// Today button
var todayBtn = document.getElementById('today-btn');

// Results
var resultYears = document.getElementById('result-years');
var resultMonths = document.getElementById('result-months');
var resultDays = document.getElementById('result-days');
var totalDays = document.getElementById('total-days');
var totalMonths = document.getElementById('total-months');
var totalWeeks = document.getElementById('total-weeks');
var totalHours = document.getElementById('total-hours');

// Labels
var labelYears = document.getElementById('label-years');
var labelMonths = document.getElementById('label-months');
var labelDays = document.getElementById('label-days');
var totalDaysLabel = document.getElementById('total-days-label');
var totalMonthsLabel = document.getElementById('total-months-label');
var totalWeeksLabel = document.getElementById('total-weeks-label');
var totalHoursLabel = document.getElementById('total-hours-label');
var startLabel = document.getElementById('start-label');
var endLabel = document.getElementById('end-label');
var dayText = document.getElementById('day-text');
var monthText = document.getElementById('month-text');
var yearText = document.getElementById('year-text');
var dayTextEnd = document.getElementById('day-text-end');
var monthTextEnd = document.getElementById('month-text-end');
var yearTextEnd = document.getElementById('year-text-end');
var todayText = document.getElementById('today-text');
var cardTitle = document.getElementById('card-title');
var ctaTitle = document.getElementById('bottom-cta-title');
var ctaDesc = document.getElementById('bottom-cta-desc');
var ctaBtnText = document.getElementById('bottom-cta-btn-text');
var navBackText = document.getElementById('nav-back-text');

// Copy all and reset
var copyAllBtn = document.getElementById('copy-all-btn');
var copyAllTextSpan = document.getElementById('copy-all-text');
var resetBtn = document.getElementById('reset-btn');
var resetTextSpan = document.getElementById('reset-text');

// Modal
var resetModal = document.getElementById('reset-modal');
var modalTitle = document.getElementById('modal-title');
var modalDesc = document.getElementById('modal-desc');
var modalNo = document.getElementById('modal-no');
var modalYes = document.getElementById('modal-yes');

/* ─── UPDATE UI TEXT ────────────────────────────────────── */
function updateStaticText() {
  var t = dict[currentLang];
  var langBtn = document.getElementById('lang-toggle');
  if (langBtn) langBtn.title = t.langToggle;

  if (cardTitle) cardTitle.textContent = t.cardTitle;
  if (startLabel) startLabel.textContent = t.startLabel;
  if (endLabel) endLabel.textContent = t.endLabel;
  if (dayText) dayText.textContent = t.dayText;
  if (monthText) monthText.textContent = t.monthText;
  if (yearText) yearText.textContent = t.yearText;
  if (dayTextEnd) dayTextEnd.textContent = t.dayText;
  if (monthTextEnd) monthTextEnd.textContent = t.monthText;
  if (yearTextEnd) yearTextEnd.textContent = t.yearText;
  if (todayText) todayText.textContent = t.todayText;
  if (labelYears) labelYears.textContent = t.labelYears;
  if (labelMonths) labelMonths.textContent = t.labelMonths;
  if (labelDays) labelDays.textContent = t.labelDays;
  if (totalDaysLabel) totalDaysLabel.textContent = t.totalDaysLabel;
  if (totalMonthsLabel) totalMonthsLabel.textContent = t.totalMonthsLabel;
  if (totalWeeksLabel) totalWeeksLabel.textContent = t.totalWeeksLabel;
  if (totalHoursLabel) totalHoursLabel.textContent = t.totalHoursLabel;
  if (copyAllTextSpan) copyAllTextSpan.textContent = t.copyAllText;
  if (resetTextSpan) resetTextSpan.textContent = t.resetText;
  if (modalTitle) modalTitle.textContent = t.modalTitle;
  if (modalDesc) modalDesc.textContent = t.modalDesc;
  if (modalYes) modalYes.textContent = t.modalYes;
  if (modalNo) modalNo.textContent = t.modalNo;
  if (ctaTitle) ctaTitle.textContent = t.bottomCtaTitle;
  if (ctaDesc) ctaDesc.textContent = t.bottomCtaDesc;
  if (ctaBtnText) ctaBtnText.textContent = t.bottomCtaBtnText;
  if (navBackText) navBackText.textContent = t.navBackText;

  var ekushEl = document.querySelector('.nav-ekush');
  var ponjiEl = document.querySelector('.nav-ponji-text');
  var calEl = document.getElementById('nav-cal-title');
  if (ekushEl) ekushEl.textContent = t.navEkush;
  if (ponjiEl) ponjiEl.textContent = t.navPonji;
  if (calEl) calEl.textContent = t.navCalTitle;
  
  // Re-calculate and update results if available
  if (currentResults) {
    updateResults(currentResults);
  }
}

/* ─── UPDATE RESULTS ─────────────────────────────────────── */
function updateResults(results) {
  if (!results) {
    resultYears.textContent = '--';
    resultMonths.textContent = '--';
    resultDays.textContent = '--';
    totalDays.textContent = '--';
    totalMonths.textContent = '--';
    totalWeeks.textContent = '--';
    totalHours.textContent = '--';
    return;
  }
  
  currentResults = results;
  if (resultYears) resultYears.textContent = fmt(results.years);
  if (resultMonths) resultMonths.textContent = fmt(results.months);
  if (resultDays) resultDays.textContent = fmt(results.days);
  if (totalDays) totalDays.textContent = formatNumberWithCommas(results.totalDays);
  if (totalMonths) totalMonths.textContent = formatNumberWithCommas(results.totalMonths);
  if (totalWeeks) totalWeeks.textContent = formatNumberWithCommas(results.totalWeeks);
  if (totalHours) totalHours.textContent = formatNumberWithCommas(results.totalHours);
}

/* ─── GET DATE FROM INPUTS ──────────────────────────────── */
function getDateFromInputs(dayInput, monthInput, yearInput) {
  var day = parseInt(dayInput.value, 10);
  var month = parseInt(monthInput.value, 10);
  var year = parseInt(yearInput.value, 10);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (day < 1 || day > 31) return null;
  if (month < 1 || month > 12) return null;
  
  var date = new Date(year, month - 1, day);
  
  // Check if the date is valid
  if (date.getDate() !== day || date.getMonth() + 1 !== month || date.getFullYear() !== year) {
    return null;
  }
  
  return date;
}

/* ─── SET INPUTS FROM DATE ───────────────────────────────── */
function setInputsFromDate(dayInput, monthInput, yearInput, calendarInput, date) {
  var d = date.getDate();
  var m = date.getMonth() + 1;
  var y = date.getFullYear();
  
  dayInput.value = d;
  monthInput.value = m;
  yearInput.value = y;
  
  calendarInput.value = y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}

/* ─── VALIDATE INPUTS ───────────────────────────────────── */
function validateInput(input, maxVal, maxLength, nextField) {
  var value = input.value;
  value = value.replace(/[^0-9]/g, '');
  input.value = value;
  
  if (value && maxVal) {
    var num = parseInt(value, 10);
    if (num > maxVal) {
      input.value = maxVal;
    }
  }
  
  // Auto-advance to next field if we reached max length
  if (maxLength && value.length === maxLength && nextField) {
    nextField.focus();
  }
  
  triggerCalculation();
}

/* ─── TRIGGER CALCULATION ───────────────────────────────── */
function triggerCalculation() {
  var start = getDateFromInputs(startDay, startMonth, startYear);
  var end = getDateFromInputs(endDay, endMonth, endYear);
  
  if (start && end) {
    var results = calculateAge(start, end);
    updateResults(results);
  } else if (start) {
    // If only start is present, don't show anything yet
  } else {
    updateResults(null);
  }
}

/* ─── SET TODAY AS END DATE ──────────────────────────────── */
function setTodayAsEnd() {
  var today = new Date();
  setInputsFromDate(endDay, endMonth, endYear, endCalendar, today);
  triggerCalculation();
}

/* ─── COPY FUNCTIONALITY WITH TOOLTIP ─────────────────────── */
function copyToClipboard(text, buttonElement) {
  navigator.clipboard.writeText(text).then(function() {
    // Show tooltip
    showCopiedTooltip(buttonElement);
  }).catch(function(err) {
    console.error('Copy failed:', err);
  });
}

function showCopiedTooltip(buttonElement) {
  var t = dict[currentLang];
  
  // Remove existing tooltip
  var existingTooltip = buttonElement.querySelector('.copy-tooltip');
  if (existingTooltip) existingTooltip.remove();
  
  // Create tooltip
  var tooltip = document.createElement('div');
  tooltip.className = 'copy-tooltip';
  tooltip.textContent = t.copiedTooltip;
  buttonElement.appendChild(tooltip);
  
  // Show
  setTimeout(function() {
    tooltip.classList.add('show');
  }, 10);
  
  // Hide after 2 seconds
  setTimeout(function() {
    tooltip.classList.remove('show');
    setTimeout(function() {
      if (tooltip.parentNode === buttonElement) {
        buttonElement.removeChild(tooltip);
      }
    }, 200);
  }, 2000);
}

function getCopyText(copyType) {
  if (!currentResults) return '';
  
  var t = dict[currentLang];
  
  switch (copyType) {
    case 'years':
      return currentResults.years + ' ' + t.labelYears;
    case 'months':
      return currentResults.months + ' ' + t.labelMonths;
    case 'days':
      return currentResults.days + ' ' + t.labelDays;
    case 'total-days':
      return formatNumberWithCommas(currentResults.totalDays) + ' ' + t.totalDaysLabel;
    case 'total-months':
      return formatNumberWithCommas(currentResults.totalMonths) + ' ' + t.totalMonthsLabel;
    case 'total-weeks':
      return formatNumberWithCommas(currentResults.totalWeeks) + ' ' + t.totalWeeksLabel;
    case 'total-hours':
      return formatNumberWithCommas(currentResults.totalHours) + ' ' + t.totalHoursLabel;
    case 'all':
      return (
        fmt(currentResults.years) + ' ' + t.labelYears + ' ' +
        fmt(currentResults.months) + ' ' + t.labelMonths + ' ' +
        fmt(currentResults.days) + ' ' + t.labelDays
      );
    default:
      return '';
  }
}

/* ─── MODAL FUNCTIONALITY ───────────────────────────────── */
function openModal() {
  resetModal.classList.add('show');
}

function closeModal() {
  resetModal.classList.remove('show');
}

/* ─── RESET FUNCTIONALITY ───────────────────────────────── */
function resetAll() {
  // Clear all inputs
  startDay.value = '';
  startMonth.value = '';
  startYear.value = '';
  startCalendar.value = '';
  
  // Set end to today
  setTodayAsEnd();
  
  // Clear results
  updateResults(null);
  currentResults = null;
  
  // Close modal
  closeModal();
}

/* ─── EVENT LISTENERS ─────────────────────────────────────── */
// Input validation and calculation
startDay.addEventListener('input', function() { validateInput(startDay, 31, 2, startMonth); });
startMonth.addEventListener('input', function() { validateInput(startMonth, 12, 2, startYear); });
startYear.addEventListener('input', function() { validateInput(startYear, null, 4, null); });

endDay.addEventListener('input', function() { validateInput(endDay, 31, 2, endMonth); });
endMonth.addEventListener('input', function() { validateInput(endMonth, 12, 2, endYear); });
endYear.addEventListener('input', function() { validateInput(endYear, null, 4, null); });

// Backspace to go to previous field
startDay.addEventListener('keydown', function(e) {
  if (e.key === 'Backspace' && startDay.value === '') {
    startDay.focus(); // already first field
  }
});

startMonth.addEventListener('keydown', function(e) {
  if (e.key === 'Backspace' && startMonth.value === '') {
    startDay.focus();
    startDay.setSelectionRange(startDay.value.length, startDay.value.length);
  }
});

startYear.addEventListener('keydown', function(e) {
  if (e.key === 'Backspace' && startYear.value === '') {
    startMonth.focus();
    startMonth.setSelectionRange(startMonth.value.length, startMonth.value.length);
  }
});

endDay.addEventListener('keydown', function(e) {
  if (e.key === 'Backspace' && endDay.value === '') {
    endDay.focus(); // already first field
  }
});

endMonth.addEventListener('keydown', function(e) {
  if (e.key === 'Backspace' && endMonth.value === '') {
    endDay.focus();
    endDay.setSelectionRange(endDay.value.length, endDay.value.length);
  }
});

endYear.addEventListener('keydown', function(e) {
  if (e.key === 'Backspace' && endYear.value === '') {
    endMonth.focus();
    endMonth.setSelectionRange(endMonth.value.length, endMonth.value.length);
  }
});

// Calendar picker listeners
startCalendar.addEventListener('change', function() {
  var date = new Date(startCalendar.value);
  setInputsFromDate(startDay, startMonth, startYear, startCalendar, date);
  triggerCalculation();
});

endCalendar.addEventListener('change', function() {
  var date = new Date(endCalendar.value);
  setInputsFromDate(endDay, endMonth, endYear, endCalendar, date);
  triggerCalculation();
});

// Today button
todayBtn.addEventListener('click', function() {
  setTodayAsEnd();
});

// Copy buttons (individual)
document.querySelectorAll('.copy-btn').forEach(function(btn) {
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    var copyType = btn.getAttribute('data-copy');
    var text = getCopyText(copyType);
    if (text) {
      copyToClipboard(text, btn);
    }
  });
});

// Copy all button
copyAllBtn.addEventListener('click', function() {
  var text = getCopyText('all');
  if (text) {
    copyToClipboard(text, copyAllBtn);
  }
});

// Reset button
resetBtn.addEventListener('click', function() {
  openModal();
});

// Modal buttons
modalNo.addEventListener('click', function() {
  closeModal();
});

modalYes.addEventListener('click', function() {
  resetAll();
});

// Close modal on overlay click
resetModal.addEventListener('click', function(e) {
  if (e.target === resetModal) {
    closeModal();
  }
});

// Close modal on escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeModal();
  }
});

/* ─── LANGUAGE TOGGLE ────────────────────────────────────── */
function bindLangToggle() {
  var btn = document.getElementById('lang-toggle');
  if (!btn) return;
  btn.addEventListener('click', function() {
    currentLang = currentLang === 'bn' ? 'en' : 'bn';
    updateStaticText();
  });
}

/* ─── INIT ───────────────────────────────────────────────── */
function initAgeCalculator() {
  if (window.EkushTheme) {
    window.EkushTheme.applyTheme(window.EkushTheme.getStoredTheme());
  }
  
  // Set today as end date by default
  setTodayAsEnd();
  updateStaticText();
}

document.addEventListener('DOMContentLoaded', function() {
  bindLangToggle();
  initAgeCalculator();
});
