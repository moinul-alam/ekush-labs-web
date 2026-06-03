/* ============================================================
   BMI Calculator — bmi-calculator.js
   Calculates Body Mass Index (BMI) with category classification
============================================================ */

/* ─── LANGUAGE DICTIONARY ────────────────────────────────── */
var dict = {
  bn: {
    cardTitle: 'আপনার BMI গণনা করুন',
    weightLabel: 'ওজন (কেজি)',
    heightLabel: 'উচ্চতা',
    bmiLabel: 'BMI',
    categoryLabel: 'ক্যাটাগরি',
    resetText: 'রিসেট',
    underweight: 'অন্যপেক্ষা কম ওজন',
    normal: 'স্বাভাবিক ওজন',
    overweight: 'অতিরিক্ত ওজন',
    obese: 'স্থূলকায়',
    bottomCtaTitle: 'শোনামণির সাথে আপনার বাচ্চার বিকাশ ট্র্যাক করুন',
    bottomCtaDesc: 'আপনার সন্তানের বিকাশ নিরীক্ষণ করুন, মাইলফলক ট্র্যাক করুন এবং বিশেষজ্ঞ পরামর্শ পান।',
    bottomCtaBtnText: 'শোনামণি পান',
    navBackText: 'ফিরে',
    navEkush: 'একুশ',
    navPonji: 'পঞ্জি',
    navCalTitle: 'BMI ক্যালকুলেটর',
  },
  en: {
    cardTitle: 'Calculate Your BMI',
    weightLabel: 'Weight (kg)',
    heightLabel: 'Height',
    bmiLabel: 'BMI',
    categoryLabel: 'Category',
    resetText: 'Reset',
    underweight: 'Underweight',
    normal: 'Normal',
    overweight: 'Overweight',
    obese: 'Obese',
    bottomCtaTitle: 'Track your baby\'s growth with Shonamoni',
    bottomCtaDesc: 'Monitor your child\'s development, track milestones, and get expert guidance.',
    bottomCtaBtnText: 'Get Shonamoni',
    navBackText: 'Back',
    navEkush: 'Ekush',
    navPonji: 'Ponji',
    navCalTitle: 'BMI Calculator',
  },
};

/* ─── STATE ──────────────────────────────────────────────── */
var currentLang = 'bn';
var heightUnit = 'cm'; // 'cm' or 'ft'

/* ─── UTILITIES ──────────────────────────────────────────── */
function fmt(n) {
  if (currentLang === 'en') return n.toString();
  return n.toString().replace(/[0-9]/g, function (d) {
    return '০১২৩৪৫৬৭৮৯'[d];
  });
}

function formatBMI(bmi) {
  if (isNaN(bmi)) return '--';
  return bmi.toFixed(1);
}

/* ─── BMI CALCULATION LOGIC ─────────────────────────────── */
function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return null;
  
  var heightM = heightCm / 100;
  var bmi = weightKg / (heightM * heightM);
  
  var category;
  if (bmi < 18.5) {
    category = 'underweight';
  } else if (bmi < 25) {
    category = 'normal';
  } else if (bmi < 30) {
    category = 'overweight';
  } else {
    category = 'obese';
  }
  
  return {
    bmi: bmi,
    category: category
  };
}

function convertFtInToCm(ft, inches) {
  var totalInches = (ft * 12) + inches;
  return totalInches * 2.54;
}

/* ─── DOM REFS ───────────────────────────────────────────── */
var weightInput = document.getElementById('weight-input');
var heightCm = document.getElementById('height-cm');
var heightFt = document.getElementById('height-ft');
var heightIn = document.getElementById('height-in');
var toggleCm = document.getElementById('toggle-cm');
var toggleFt = document.getElementById('toggle-ft');
var bmiValue = document.getElementById('bmi-value');
var categoryIndicator = document.getElementById('category-indicator');
var categoryText = document.getElementById('category-text');
var resetBtn = document.getElementById('reset-btn');

/* ─── UPDATE UI TEXT ────────────────────────────────────── */
function updateStaticText() {
  var t = dict[currentLang];
  var langBtn = document.getElementById('lang-toggle');
  if (langBtn) langBtn.title = t.langToggle;

  if (document.getElementById('card-title')) document.getElementById('card-title').textContent = t.cardTitle;
  if (document.getElementById('weight-label')) document.getElementById('weight-label').textContent = t.weightLabel;
  if (document.getElementById('height-label')) document.getElementById('height-label').textContent = t.heightLabel;
  if (document.getElementById('bmi-label')) document.getElementById('bmi-label').textContent = t.bmiLabel;
  if (document.getElementById('category-label')) document.getElementById('category-label').textContent = t.categoryLabel;
  if (document.getElementById('reset-text')) document.getElementById('reset-text').textContent = t.resetText;
  if (document.getElementById('bottom-cta-title')) document.getElementById('bottom-cta-title').textContent = t.bottomCtaTitle;
  if (document.getElementById('bottom-cta-desc')) document.getElementById('bottom-cta-desc').textContent = t.bottomCtaDesc;
  if (document.getElementById('bottom-cta-btn-text')) document.getElementById('bottom-cta-btn-text').textContent = t.bottomCtaBtnText;
  if (document.getElementById('nav-back-text')) document.getElementById('nav-back-text').textContent = t.navBackText;

  var ekushEl = document.querySelector('.nav-ekush');
  var ponjiEl = document.querySelector('.nav-ponji-text');
  var calEl = document.getElementById('nav-cal-title');
  if (ekushEl) ekushEl.textContent = t.navEkush;
  if (ponjiEl) ponjiEl.textContent = t.navPonji;
  if (calEl) calEl.textContent = t.navCalTitle;
  
  // Re-calculate and update results if available
  triggerCalculation();
}

/* ─── UPDATE RESULTS ─────────────────────────────────────── */
function updateResults(result) {
  var t = dict[currentLang];
  
  if (!result) {
    bmiValue.textContent = '--';
    categoryText.textContent = '';
    categoryIndicator.className = 'category-indicator';
    return;
  }
  
  bmiValue.textContent = fmt(formatBMI(result.bmi));
  categoryText.textContent = t[result.category];
  categoryIndicator.className = 'category-indicator category-' + result.category;
}

/* ─── TRIGGER CALCULATION ───────────────────────────────── */
function triggerCalculation() {
  var weight = parseFloat(weightInput.value);
  var heightCmVal;
  
  if (heightUnit === 'cm') {
    heightCmVal = parseFloat(heightCm.value);
  } else {
    var ft = parseFloat(heightFt.value) || 0;
    var inches = parseFloat(heightIn.value) || 0;
    heightCmVal = convertFtInToCm(ft, inches);
  }
  
  var result = calculateBMI(weight, heightCmVal);
  updateResults(result);
}

/* ─── RESET FUNCTIONALITY ───────────────────────────────── */
function resetAll() {
  weightInput.value = '';
  heightCm.value = '';
  heightFt.value = '';
  heightIn.value = '';
  updateResults(null);
}

/* ─── EVENT LISTENERS ─────────────────────────────────────── */
weightInput.addEventListener('input', triggerCalculation);
heightCm.addEventListener('input', triggerCalculation);
heightFt.addEventListener('input', triggerCalculation);
heightIn.addEventListener('input', triggerCalculation);

toggleCm.addEventListener('click', function() {
  heightUnit = 'cm';
  toggleCm.classList.add('toggle-active');
  toggleFt.classList.remove('toggle-active');
  document.querySelector('.cm-input').style.display = 'flex';
  document.querySelector('.ft-in-inputs').style.display = 'none';
  triggerCalculation();
});

toggleFt.addEventListener('click', function() {
  heightUnit = 'ft';
  toggleFt.classList.add('toggle-active');
  toggleCm.classList.remove('toggle-active');
  document.querySelector('.ft-in-inputs').style.display = 'flex';
  document.querySelector('.cm-input').style.display = 'none';
  triggerCalculation();
});

resetBtn.addEventListener('click', resetAll);

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
function initBMICalculator() {
  if (window.EkushTheme) {
    window.EkushTheme.applyTheme(window.EkushTheme.getStoredTheme());
  }
  
  // Initialize with cm unit
  document.querySelector('.ft-in-inputs').style.display = 'none';
  updateStaticText();
}

document.addEventListener('DOMContentLoaded', function() {
  bindLangToggle();
  initBMICalculator();
});
