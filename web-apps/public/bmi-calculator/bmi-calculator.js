/* ============================================================
   BMI Calculator — bmi-calculator.js
   Calculates Body Mass Index (BMI) with category classification
============================================================ */

/* ─── LANGUAGE DICTIONARY ─────────────────────────────────────── */
var dict = {
  bn: {
    cardTitle: 'বিএমআই (BMI) গণনা করুন',
    cardDesc: 'বিএমআই (বডি মাস ইনডেক্স) হলো আপনার উচ্চতা অনুযায়ী ওজন ঠিক আছে কি না তা সহজে জানার একটি উপায়। এর মাধ্যমে আপনার ওজন স্বাভাবিকের চেয়ে কম, স্বাভাবিক, অতিরিক্ত নাকি স্থূল, তা অনুমান করা যায়।',
    weightLabel: 'ওজন',
    heightLabel: 'উচ্চতা',
    bmiUnit: 'kg/m²',
    resetText: 'রিসেট',
    underweight: 'অন্যপেক্ষা কম ওজন',
    normal: 'স্বাভাবিক',
    overweight: 'অতিরিক্ত ওজন',
    obese: 'স্থূলকায়',
    underweightShort: 'কম',
    normalShort: 'স্বাভাবিক',
    overweightShort: 'অতিরিক্ত',
    obeseShort: 'স্থূল',
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
    bmiUnit: 'kg/m²',
    resetText: 'Reset',
    underweight: 'Underweight',
    normal: 'Normal',
    overweight: 'Overweight',
    obese: 'Obese',
    underweightShort: 'Underweight',
    normalShort: 'Normal',
    overweightShort: 'Overweight',
    obeseShort: 'Obese',
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

/* ─── STATE ─────────────────────────────────────────────────── */
var currentLang = 'bn';
var weightUnit = 'kg'; // 'kg' or 'lb'
var heightUnit = 'cm'; // 'cm' or 'ft'

/* ─── DOM REFS ───────────────────────────────────────────────── */
var weightInput, heightCm, heightFt, heightIn, resultCard, bmiBarNumber, bmiBarMarkerWrapper, resultVerdict, bmiLabels;

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

/* ─── BMI BAR UPDATE ─────────────────────────────────────── */
function updateBMIBar(bmi) {
  if (!bmiBarMarkerWrapper || !bmiBarNumber) return;

  var minBMI = 10;
  var maxBMI = 40;
  
  var clampedBMI = Math.max(minBMI, Math.min(maxBMI, bmi || 0));
  var progress = (clampedBMI - minBMI) / (maxBMI - minBMI);
  var leftPercent = progress * 100;
  
  bmiBarMarkerWrapper.style.left = leftPercent + '%';
  
  if (bmiBarNumber) {
    bmiBarNumber.textContent = bmi ? fmt(formatBMI(bmi)) : '--';
  }
}

/* ─── UPDATE LABELS LOCALE ─────────────────────────────────── */
function updateBarLabels() {
  var t = dict[currentLang];
  
  // Update numerical bar labels
  var labels = document.querySelectorAll('.bmi-label');
  labels.forEach(function(label) {
    var value = label.getAttribute('data-value');
    var parts = value.split('.');
    if (currentLang === 'bn') {
      var bnValue = parts.map(function(part) {
        return part.split('').map(function(c) { return '০১২৩৪৫৬৭৮৯'[c]; }).join('');
      }).join('·');
      label.textContent = bnValue;
    } else {
      label.textContent = value;
    }
  });
  
  // Update segment labels
  var segmentLabels = document.querySelectorAll('.bmi-bar-segment-label');
  segmentLabels.forEach(function(label) {
    var category = label.getAttribute('data-category');
    label.textContent = t[category + 'Short'];
  });
}

/* ─── UPDATE UI TEXT ────────────────────────────────────────── */
function updateStaticText() {
  var t = dict[currentLang];
  
  if (document.getElementById('card-title')) document.getElementById('card-title').textContent = t.cardTitle;
  if (document.getElementById('card-desc')) document.getElementById('card-desc').textContent = t.cardDesc;
  if (document.getElementById('weight-label')) document.getElementById('weight-label').textContent = t.weightLabel;
  if (document.getElementById('height-label')) document.getElementById('height-label').textContent = t.heightLabel;
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
  
  // Update bar labels
  updateBarLabels();
  
  // Re-calculate and update results if available
  triggerCalculation();
}

/* ─── UPDATE RESULTS ────────────────────────────────────────── */
function updateResults(result) {
  var t = dict[currentLang];
  
  if (!resultCard) return;

  if (!result) {
    resultCard.classList.add('hidden');
    resultCard.className = 'calculator-card result-card hidden';
    resultVerdict.textContent = '';
    updateBMIBar(null);
    return;
  }

  resultCard.classList.remove('hidden');
  resultCard.className = 'calculator-card result-card result-' + result.category;

  if (resultVerdict) {
    resultVerdict.textContent = t[result.category];
  }

  updateBMIBar(result.bmi);
}

/* ─── TRIGGER CALCULATION ───────────────────────────────────── */
function triggerCalculation() {
  // Get weight in kg
  var weightInputVal = parseFloat(weightInput.value);
  var weightKg;
  if (weightUnit === 'kg') {
    weightKg = weightInputVal;
  } else {
    weightKg = lbToKg(weightInputVal);
  }
  
  // Get height in cm
  var heightCmVal;
  if (heightUnit === 'cm') {
    heightCmVal = parseFloat(heightCm.value);
  } else {
    var ft = parseFloat(heightFt.value) || 0;
    var inches = parseFloat(heightIn.value) || 0;
    heightCmVal = ftInToCm(ft, inches);
  }
  
  var result = calculateBMI(weightKg, heightCmVal);
  updateResults(result);
}

/* ─── RESET FUNCTIONALITY ────────────────────────────────────── */
function resetAll() {
  weightInput.value = '';
  heightCm.value = '';
  heightFt.value = '';
  heightIn.value = '';
  updateResults(null);
}

/* ─── DOM READY ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  // Get DOM refs
  weightInput = document.getElementById('weight-input');
  heightCm = document.getElementById('height-cm');
  heightFt = document.getElementById('height-ft');
  heightIn = document.getElementById('height-in');
  resultCard = document.getElementById('result-card');
  bmiBarNumber = document.getElementById('bmi-bar-number');
  bmiBarMarkerWrapper = document.getElementById('bmi-bar-marker-wrapper');
  resultVerdict = document.getElementById('result-verdict');

  // Initialize weight unit toggle
  var toggleWeightKg = document.getElementById('toggle-weight-kg');
  var toggleWeightLb = document.getElementById('toggle-weight-lb');
  
  toggleWeightKg.addEventListener('click', function() {
    if (weightUnit === 'lb') {
      // Convert current value from lb to kg
      var currentVal = parseFloat(weightInput.value);
      if (!isNaN(currentVal)) {
        var newVal = lbToKg(currentVal);
        weightInput.value = newVal.toFixed(1);
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
      var currentVal = parseFloat(weightInput.value);
      if (!isNaN(currentVal)) {
        var newVal = kgToLb(currentVal);
        weightInput.value = newVal.toFixed(1);
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
      var cmVal = parseFloat(heightCm.value);
      if (!isNaN(cmVal)) {
        var ftIn = cmToFtIn(cmVal);
        heightFt.value = ftIn.ft;
        heightIn.value = ftIn.inches.toFixed(1);
      }
      document.getElementById('height-inputs-cm').style.display = 'none';
      document.getElementById('height-inputs-ft').style.display = 'flex';
      toggleHeightCm.classList.remove('toggle-active');
      toggleHeightFt.classList.add('toggle-active');
      toggleHeightCm2.classList.remove('toggle-active');
      toggleHeightFt2.classList.add('toggle-active');
    } else {
      // Convert ft/in to cm
      var ftVal = parseFloat(heightFt.value) || 0;
      var inVal = parseFloat(heightIn.value) || 0;
      if (ftVal > 0 || inVal > 0) {
        var cm = ftInToCm(ftVal, inVal);
        heightCm.value = cm.toFixed(1);
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
  weightInput.addEventListener('input', triggerCalculation);
  heightCm.addEventListener('input', triggerCalculation);
  heightFt.addEventListener('input', triggerCalculation);
  heightIn.addEventListener('input', triggerCalculation);
  
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
