/* ============================================================
   BMI Calculator — bmi-calculator.js
   Calculates Body Mass Index (BMI) with category classification
============================================================ */

/* ─── LANGUAGE DICTIONARY ────────────────────────────────────── */
var dict = {
  bn: {
    cardTitle: 'বিএমআই (BMI) গণনা করুন',
    cardDesc: 'বিএমআই (বডি মাস ইনডেক্স) হলো আপনার উচ্চতা অনুযায়ী ওজন ঠিক আছে কি না তা সহজে জানার একটি উপায়। এর মাধ্যমে আপনার ওজন স্বাভাবিকের চেয়ে কম, স্বাভাবিক, অতিরিক্ত নাকি স্থূল, তা অনুমান করা যায়।',
    weightLabel: 'ওজন',
    heightLabel: 'উচ্চতা',
    resultTitle: 'ফলাফল',
    scoreLabel: 'স্কোর',
    verdictLabel: 'মতামত',
    bmiUnit: 'kg/m²',
    resetText: 'রিসেট',
    underweight: 'অন্যপেক্ষা কম ওজন',
    normal: 'স্বাভাবিক',
    overweight: 'অতিরিক্ত ওজন',
    obese: 'স্থূলকায়',
    weightPlaceholder: 'ওজন ইনপুট দিন',
    heightPlaceholderCm: 'উচ্চতা ইনপুট দিন',
    heightPlaceholderFt: 'ft',
    heightPlaceholderIn: 'in',
    bottomCtaTitle: 'শোনামণির সাথে আপনার বাচ্চার বিকাশ ট্র্যাক করুন',
    bottomCtaDesc: 'আপনার সন্তানের বিকাশ নিরীক্ষণ করুন, মাইলফলক ট্র্যাক করুন এবং বিশেষজ্ঞ পরামর্শ পান।',
    bottomCtaBtnText: 'শোনামণি পান',
    navBackText: 'ফিরে',
    navEkush: 'একুশ',
    navPonji: 'পঞ্জি',
    navCalTitlePart1: 'বিএমআই',
    navCalTitlePart2: ' ক্যালকুলেটর'
  },
  en: {
    cardTitle: 'Calculate BMI',
    cardDesc: 'BMI (Body Mass Index) is a quick way to check if your weight is healthy for your height. It helps estimate if you are underweight, normal weight, overweight, or obese.',
    weightLabel: 'Weight',
    heightLabel: 'Height',
    resultTitle: 'Result',
    scoreLabel: 'Score',
    verdictLabel: 'Verdict',
    bmiUnit: 'kg/m²',
    resetText: 'Reset',
    underweight: 'Underweight',
    normal: 'Normal',
    overweight: 'Overweight',
    obese: 'Obese',
    weightPlaceholder: 'Enter weight',
    heightPlaceholderCm: 'Enter height',
    heightPlaceholderFt: 'ft',
    heightPlaceholderIn: 'in',
    bottomCtaTitle: 'Track your baby\'s growth with Shonamoni',
    bottomCtaDesc: 'Monitor your child\'s development, track milestones, and get expert guidance.',
    bottomCtaBtnText: 'Get Shonamoni',
    navBackText: 'Back',
    navEkush: 'Ekush',
    navPonji: 'Ponji',
    navCalTitlePart1: 'BMI',
    navCalTitlePart2: ' Calculator'
  }
};

/* ─── STATE ──────────────────────────────────────────────────── */
var currentLang = 'bn';
var weightUnit = 'kg'; // 'kg' or 'lb'
var heightUnit = 'cm'; // 'cm' or 'ft'

/* ─── UTILITIES ──────────────────────────────────────────────── */
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

/* ─── CONVERSION FUNCTIONS ───────────────────────────────────── */
function kgToLb(kg) {
  return kg * 2.20462;
}

function lbToKg(lb) {
  return lb / 2.20462;
}

function cmToFtIn(cm) {
  var totalInches = cm / 2.54;
  var ft = Math.floor(totalInches / 12);
  var inches = totalInches % 12;
  return { ft: ft, inches: inches };
}

function ftInToCm(ft, inches) {
  var totalInches = (ft * 12) + inches;
  return totalInches * 2.54;
}

/* ─── BMI CALCULATION LOGIC ─────────────────────────────────── */
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

/* ─── SPEEDOMETER UPDATE ────────────────────────────────────── */
function updateSpeedometer(bmi) {
  var needle = document.getElementById('needle');
  if (!needle) return;

  var minAngle = -90; // leftmost
  var maxAngle = 90; // rightmost
  var minBMI = 10;
  var maxBMI = 40;
  
  var clampedBMI = Math.max(minBMI, Math.min(maxBMI, bmi || 0));
  var progress = (clampedBMI - minBMI) / (maxBMI - minBMI);
  var angle = minAngle + (progress * (maxAngle - minAngle));
  
  needle.style.transform = 'rotate(' + angle + 'deg)';
  needle.style.transition = 'transform 0.5s ease-out';
}

/* ─── UPDATE UI TEXT ────────────────────────────────────────── */
function updateStaticText() {
  var t = dict[currentLang];
  
  if (document.getElementById('card-title')) document.getElementById('card-title').textContent = t.cardTitle;
  if (document.getElementById('card-desc')) document.getElementById('card-desc').textContent = t.cardDesc;
  if (document.getElementById('weight-label')) document.getElementById('weight-label').textContent = t.weightLabel;
  if (document.getElementById('height-label')) document.getElementById('height-label').textContent = t.heightLabel;
  if (document.getElementById('result-title')) document.getElementById('result-title').textContent = t.resultTitle;
  if (document.getElementById('result-score-label')) document.getElementById('result-score-label').textContent = t.scoreLabel;
  if (document.getElementById('result-verdict-label')) document.getElementById('result-verdict-label').textContent = t.verdictLabel;
  if (document.getElementById('bmi-unit')) document.getElementById('bmi-unit').textContent = t.bmiUnit;
  if (document.getElementById('reset-text')) document.getElementById('reset-text').textContent = t.resetText;
  if (document.getElementById('bottom-cta-title')) document.getElementById('bottom-cta-title').textContent = t.bottomCtaTitle;
  if (document.getElementById('bottom-cta-desc')) document.getElementById('bottom-cta-desc').textContent = t.bottomCtaDesc;
  if (document.getElementById('bottom-cta-btn-text')) document.getElementById('bottom-cta-btn-text').textContent = t.bottomCtaBtnText;
  if (document.getElementById('nav-back-text')) document.getElementById('nav-back-text').textContent = t.navBackText;
  
  var ekushEl = document.querySelector('.nav-ekush');
  var ponjiEl = document.querySelector('.nav-ponji-text');
  if (ekushEl) ekushEl.textContent = t.navEkush;
  if (ponjiEl) ponjiEl.textContent = t.navPonji;
  if (document.getElementById('nav-cal-title-part1')) document.getElementById('nav-cal-title-part1').textContent = t.navCalTitlePart1;
  if (document.getElementById('nav-cal-title-part2')) document.getElementById('nav-cal-title-part2').textContent = t.navCalTitlePart2;
  
  // Update placeholders
  if (document.getElementById('weight-input')) document.getElementById('weight-input').placeholder = t.weightPlaceholder;
  if (document.getElementById('height-cm')) document.getElementById('height-cm').placeholder = t.heightPlaceholderCm;
  if (document.getElementById('height-ft')) document.getElementById('height-ft').placeholder = t.heightPlaceholderFt;
  if (document.getElementById('height-in')) document.getElementById('height-in').placeholder = t.heightPlaceholderIn;
  
  // Re-calculate and update results if available
  triggerCalculation();
}

/* ─── UPDATE RESULTS ────────────────────────────────────────── */
function updateResults(result) {
  var t = dict[currentLang];
  var bmiValueEl = document.getElementById('bmi-value');
  var resultVerdictEl = document.getElementById('result-verdict');
  var resultCardEl = document.querySelector('.result-card');
  
  if (!result) {
    if (bmiValueEl) bmiValueEl.textContent = '--';
    if (resultVerdictEl) resultVerdictEl.textContent = '';
    if (resultCardEl) resultCardEl.className = 'result-card';
    updateSpeedometer(null);
    return;
  }
  
  if (bmiValueEl) bmiValueEl.textContent = fmt(formatBMI(result.bmi));
  if (resultVerdictEl) resultVerdictEl.textContent = t[result.category];
  if (resultCardEl) {
    resultCardEl.className = 'result-card result-' + result.category;
  }
  updateSpeedometer(result.bmi);
}

/* ─── TRIGGER CALCULATION ───────────────────────────────────── */
function triggerCalculation() {
  // Get weight in kg
  var weightInputVal = parseFloat(document.getElementById('weight-input').value);
  var weightKg;
  if (weightUnit === 'kg') {
    weightKg = weightInputVal;
  } else {
    weightKg = lbToKg(weightInputVal);
  }
  
  // Get height in cm
  var heightCmVal;
  if (heightUnit === 'cm') {
    heightCmVal = parseFloat(document.getElementById('height-cm').value);
  } else {
    var ft = parseFloat(document.getElementById('height-ft').value) || 0;
    var inches = parseFloat(document.getElementById('height-in').value) || 0;
    heightCmVal = ftInToCm(ft, inches);
  }
  
  var result = calculateBMI(weightKg, heightCmVal);
  updateResults(result);
}

/* ─── RESET FUNCTIONALITY ────────────────────────────────────── */
function resetAll() {
  document.getElementById('weight-input').value = '';
  document.getElementById('height-cm').value = '';
  document.getElementById('height-ft').value = '';
  document.getElementById('height-in').value = '';
  updateResults(null);
}

/* ─── DOM READY ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  // Initialize weight unit toggle
  var toggleWeightKg = document.getElementById('toggle-weight-kg');
  var toggleWeightLb = document.getElementById('toggle-weight-lb');
  
  toggleWeightKg.addEventListener('click', function() {
    if (weightUnit === 'lb') {
      // Convert current value from lb to kg
      var currentVal = parseFloat(document.getElementById('weight-input').value);
      if (!isNaN(currentVal)) {
        var newVal = lbToKg(currentVal);
        document.getElementById('weight-input').value = newVal.toFixed(1);
      }
      weightUnit = 'kg';
      toggleWeightKg.classList.add('toggle-active');
      toggleWeightLb.classList.remove('toggle-active');
      triggerCalculation();
    }
  });
  
  toggleWeightLb.addEventListener('click', function() {
    if (weightUnit === 'kg') {
      // Convert current value from kg to lb
      var currentVal = parseFloat(document.getElementById('weight-input').value);
      if (!isNaN(currentVal)) {
        var newVal = kgToLb(currentVal);
        document.getElementById('weight-input').value = newVal.toFixed(1);
      }
      weightUnit = 'lb';
      toggleWeightLb.classList.add('toggle-active');
      toggleWeightKg.classList.remove('toggle-active');
      triggerCalculation();
    }
  });
  
  // Initialize height unit toggle
  var toggleHeightCm = document.getElementById('toggle-height-cm');
  var toggleHeightFt = document.getElementById('toggle-height-ft');
  var toggleHeightCm2 = document.getElementById('toggle-height-cm-2');
  var toggleHeightFt2 = document.getElementById('toggle-height-ft-2');
  
  function updateHeightUnit(newUnit) {
    if (heightUnit === newUnit) return;
    
    if (newUnit === 'ft') {
      // Convert cm to ft/in
      var cmVal = parseFloat(document.getElementById('height-cm').value);
      if (!isNaN(cmVal)) {
        var ftIn = cmToFtIn(cmVal);
        document.getElementById('height-ft').value = ftIn.ft;
        document.getElementById('height-in').value = ftIn.inches.toFixed(1);
      }
      document.getElementById('height-inputs-cm').style.display = 'none';
      document.getElementById('height-inputs-ft').style.display = 'flex';
      toggleHeightCm.classList.remove('toggle-active');
      toggleHeightFt.classList.add('toggle-active');
      toggleHeightCm2.classList.remove('toggle-active');
      toggleHeightFt2.classList.add('toggle-active');
    } else {
      // Convert ft/in to cm
      var ftVal = parseFloat(document.getElementById('height-ft').value) || 0;
      var inVal = parseFloat(document.getElementById('height-in').value) || 0;
      if (ftVal > 0 || inVal > 0) {
        var cm = ftInToCm(ftVal, inVal);
        document.getElementById('height-cm').value = cm.toFixed(1);
      }
      document.getElementById('height-inputs-ft').style.display = 'none';
      document.getElementById('height-inputs-cm').style.display = 'flex';
      toggleHeightCm.classList.add('toggle-active');
      toggleHeightFt.classList.remove('toggle-active');
      toggleHeightCm2.classList.add('toggle-active');
      toggleHeightFt2.classList.remove('toggle-active');
    }
    
    heightUnit = newUnit;
    triggerCalculation();
  }
  
  toggleHeightCm.addEventListener('click', function() { updateHeightUnit('cm'); });
  toggleHeightFt.addEventListener('click', function() { updateHeightUnit('ft'); });
  toggleHeightCm2.addEventListener('click', function() { updateHeightUnit('cm'); });
  toggleHeightFt2.addEventListener('click', function() { updateHeightUnit('ft'); });
  
  // Hide ft inputs initially
  document.getElementById('height-inputs-ft').style.display = 'none';
  
  // Input listeners
  document.getElementById('weight-input').addEventListener('input', triggerCalculation);
  document.getElementById('height-cm').addEventListener('input', triggerCalculation);
  document.getElementById('height-ft').addEventListener('input', triggerCalculation);
  document.getElementById('height-in').addEventListener('input', triggerCalculation);
  
  // Reset listener
  document.getElementById('reset-btn').addEventListener('click', resetAll);
  
  // Language toggle
  document.getElementById('lang-toggle').addEventListener('click', function() {
    currentLang = currentLang === 'bn' ? 'en' : 'bn';
    updateStaticText();
  });
  
  // Initialize theme
  if (window.EkushTheme) {
    window.EkushTheme.applyTheme(window.EkushTheme.getStoredTheme());
  }
  
  updateStaticText();
});
