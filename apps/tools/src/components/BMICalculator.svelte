<script>
  import { fmt, handleLocalizedInput } from '../utils/numbers';
  // Language Dictionary
  const dict = {
    bn: {
      cardTitle: 'বিএমআই (BMI) গণনা করুন',
      cardDesc: 'বিএমআই (বডি মাস ইনডেক্স) হলো আপনার উচ্চতা অনুযায়ী ওজন ঠিক আছে কি না তা সহজে জানার একটি উপায়। এর মাধ্যমে আপনার ওজন স্বাভাবিকের চেয়ে কম, স্বাভাবিক, অতিরিক্ত নাকি স্থূল, তা অনুমান করা যায়।',
      weightLabel: 'ওজন',
      heightLabel: 'উচ্চতা',
      bmiUnit: 'kg/m²',
      resetText: 'রিসেট',
      resultTitle: 'ফলাফল',
      underweight: 'কম ওজন',
      normal: 'স্বাভাবিক ওজন',
      overweight: 'অতিরিক্ত ওজন',
      obese: 'স্থুলকায়',
      arcUnderweight1: 'কম', arcUnderweight2: 'ওজন',
      arcNormal1: 'স্বাভাবিক', arcNormal2: 'ওজন',
      arcOverweight1: 'অতিরিক্ত', arcOverweight2: 'ওজন',
      arcObese1: 'স্থুলকায়', arcObese2: '',
      weightPlaceholder: 'ওজন ইনপুট দিন',
      heightPlaceholderCm: 'উচ্চতা ইনপুট দিন',
      heightPlaceholderFt: 'ft',
      heightPlaceholderIn: 'in'
    },
    en: {
      cardTitle: 'Calculate BMI',
      cardDesc: 'BMI (Body Mass Index) is a quick way to check if your weight is healthy for your height. It helps estimate if you are underweight, normal weight, overweight, or obese.',
      weightLabel: 'Weight',
      heightLabel: 'Height',
      bmiUnit: 'kg/m²',
      resetText: 'Reset',
      resultTitle: 'Result',
      underweight: 'Underweight',
      normal: 'Normal Weight',
      overweight: 'Overweight',
      obese: 'Obese',
      arcUnderweight1: 'Under', arcUnderweight2: 'weight',
      arcNormal1: 'Normal', arcNormal2: 'Weight',
      arcOverweight1: 'Over', arcOverweight2: 'weight',
      arcObese1: 'Obese', arcObese2: '',
      weightPlaceholder: 'Enter weight',
      heightPlaceholderCm: 'Enter height',
      heightPlaceholderFt: 'ft',
      heightPlaceholderIn: 'in'
    }
  };

  export let lang = 'en';

  let weightVal = '';
  let heightCmVal = '';
  let heightFtVal = '';
  let heightInVal = '';

  let weightUnit = 'kg'; // 'kg' or 'lb'
  let heightUnit = 'cm'; // 'cm' or 'ft'

  $: t = dict[lang];

  // Formatting utilities
  const formatNum = (n) => fmt(n.toString(), lang);

  $: result = calculateBMI(weightVal, heightCmVal, heightFtVal, heightInVal, weightUnit, heightUnit);

  function calculateBMI(wVal, hCm, hFt, hIn, wUnit, hUnit) {
    let weightKg = parseFloat(wVal);
    if (isNaN(weightKg) || weightKg <= 0) return null;
    if (wUnit === 'lb') weightKg = weightKg / 2.20462;

    let heightCm = 0;
    if (hUnit === 'cm') {
      heightCm = parseFloat(hCm);
    } else {
      let ft = parseFloat(hFt) || 0;
      let inches = parseFloat(hIn) || 0;
      heightCm = ((ft * 12) + inches) * 2.54;
    }

    if (isNaN(heightCm) || heightCm <= 0) return null;

    let heightM = heightCm / 100;
    let bmi = weightKg / (heightM * heightM);

    let category = 'obese';
    if (bmi < 18.5) category = 'underweight';
    else if (bmi < 25) category = 'normal';
    else if (bmi < 30) category = 'overweight';

    let clampedBmi = Math.max(10, Math.min(40, bmi));
    let progress = ((clampedBmi - 10) / 30) * 100;

    return {
      bmi,
      category,
      progress
    };
  }

  function toggleWeightUnit(unit) {
    if (weightUnit === unit) return;
    let currentVal = parseFloat(weightVal);
    if (!isNaN(currentVal)) {
      if (unit === 'lb') weightVal = (currentVal * 2.20462).toFixed(1);
      else weightVal = (currentVal / 2.20462).toFixed(1);
    }
    weightUnit = unit;
  }

  function toggleHeightUnit(unit) {
    if (heightUnit === unit) return;
    if (unit === 'ft') {
      let cmVal = parseFloat(heightCmVal);
      if (!isNaN(cmVal)) {
        let totalInches = cmVal / 2.54;
        heightFtVal = Math.floor(totalInches / 12).toString();
        heightInVal = (totalInches % 12).toFixed(1);
      }
    } else {
      let ft = parseFloat(heightFtVal) || 0;
      let inches = parseFloat(heightInVal) || 0;
      if (ft > 0 || inches > 0) {
        heightCmVal = (((ft * 12) + inches) * 2.54).toFixed(1);
      }
    }
    heightUnit = unit;
  }

  function resetAll() {
    weightVal = '';
    heightCmVal = '';
    heightFtVal = '';
    heightInVal = '';
  }

  // Gauge Math
  $: gaugeAngle = result ? ((Math.max(10, Math.min(40, result.bmi)) - 10) / 30) * 180 : 0;

  function polarToCartesian(cx, cy, r, angleInDegrees) {
    const angleInRadians = (angleInDegrees + 180) * Math.PI / 180.0;
    return {
      x: cx + (r * Math.cos(angleInRadians)),
      y: cy + (r * Math.sin(angleInRadians))
    };
  }

  function describeArc(x, y, radius, startAngle, endAngle) {
    const start = polarToCartesian(x, y, radius, startAngle);
    const end = polarToCartesian(x, y, radius, endAngle);
    return [
      "M", start.x, start.y, 
      "A", radius, radius, 0, 0, 1, end.x, end.y
    ].join(" ");
  }
</script>

<div class="calculator-layout flex flex-col md:flex-row gap-6">
  <!-- Input Card -->
  <div class="input-card flex-1 bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg transition-colors">
    <div class="card-header flex items-start gap-4 mb-8">
      <div class="card-icon text-4xl">⚖️</div>
      <div class="card-header-text">
        <h2 class="text-2xl font-bold text-slate-900 dark:text-white m-0">{t.cardTitle}</h2>
        <p class="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">{t.cardDesc}</p>
      </div>
    </div>

    <!-- Weight Input -->
    <div class="input-section flex flex-col gap-3 mb-6">
      <div class="label-row flex justify-between items-center">
        <label for="bmi-weight" class="font-semibold text-slate-800 dark:text-slate-200">{t.weightLabel}</label>
        <div class="unit-toggle flex gap-2 bg-slate-50 dark:bg-slate-700 p-1 rounded-xl border border-slate-200 dark:border-slate-600">
          <button class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all {weightUnit === 'kg' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}" on:click={() => toggleWeightUnit('kg')}>kg</button>
          <button class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all {weightUnit === 'lb' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}" on:click={() => toggleWeightUnit('lb')}>lb</button>
        </div>
      </div>
      <div class="input-wrapper flex items-center gap-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
        <input id="bmi-weight" type="text" inputmode="decimal" value={fmt(weightVal, lang)} on:input={(e) => handleLocalizedInput(e, lang, v => weightVal = v)} placeholder={t.weightPlaceholder} class="flex-1 py-3 bg-transparent border-none text-lg font-semibold text-slate-900 dark:text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
        <span class="text-slate-500 dark:text-slate-400 font-semibold">{weightUnit}</span>
      </div>
    </div>

    <!-- Height Input -->
    <div class="input-section flex flex-col gap-3 mb-8">
      <div class="label-row flex justify-between items-center">
        <label for="bmi-height" class="font-semibold text-slate-800 dark:text-slate-200">{t.heightLabel}</label>
        <div class="unit-toggle flex gap-2 bg-slate-50 dark:bg-slate-700 p-1 rounded-xl border border-slate-200 dark:border-slate-600">
          <button class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all {heightUnit === 'cm' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}" on:click={() => toggleHeightUnit('cm')}>cm</button>
          <button class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all {heightUnit === 'ft' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}" on:click={() => toggleHeightUnit('ft')}>ft/in</button>
        </div>
      </div>
      
      {#if heightUnit === 'cm'}
        <div class="input-wrapper flex items-center gap-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
          <input id="bmi-height" type="text" inputmode="decimal" value={fmt(heightCmVal, lang)} on:input={(e) => handleLocalizedInput(e, lang, v => heightCmVal = v)} placeholder={t.heightPlaceholderCm} class="flex-1 py-3 bg-transparent border-none text-lg font-semibold text-slate-900 dark:text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          <span class="text-slate-500 dark:text-slate-400 font-semibold">cm</span>
        </div>
      {:else}
        <div class="flex gap-4">
          <div class="input-wrapper flex-1 flex items-center gap-2 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
            <input type="text" inputmode="decimal" value={fmt(heightFtVal, lang)} on:input={(e) => handleLocalizedInput(e, lang, v => heightFtVal = v)} placeholder={t.heightPlaceholderFt} class="flex-1 py-3 w-full bg-transparent border-none text-lg font-semibold text-slate-900 dark:text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            <span class="text-slate-500 dark:text-slate-400 font-semibold">ft</span>
          </div>
          <div class="input-wrapper flex-1 flex items-center gap-2 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
            <input type="text" inputmode="decimal" value={fmt(heightInVal, lang)} on:input={(e) => handleLocalizedInput(e, lang, v => heightInVal = v)} placeholder={t.heightPlaceholderIn} class="flex-1 py-3 w-full bg-transparent border-none text-lg font-semibold text-slate-900 dark:text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            <span class="text-slate-500 dark:text-slate-400 font-semibold">in</span>
          </div>
        </div>
      {/if}
    </div>

    <!-- Reset Button -->
    <button on:click={resetAll} class="w-full py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center gap-2">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      {t.resetText}
    </button>
  </div>

  <!-- Result Card -->
  <div class="result-card flex-1 bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg transition-all duration-400 {result ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 hidden'}">
    {#if result}
      <div class="text-center mb-4">
        <h3 class="text-2xl font-bold text-slate-800 dark:text-slate-200">{t.resultTitle}</h3>
      </div>

      <div class="bmi-gauge-container relative flex flex-col items-center justify-center py-4">
        <svg viewBox="0 0 380 220" class="w-full max-w-[380px] drop-shadow-md overflow-visible mx-auto">
          <defs>
            <filter id="needle-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3" />
            </filter>
          </defs>
          
          <!-- Arcs with 1 degree gaps for a modern look (no round linecaps to keep bottom flat) -->
          <!-- Underweight: 10 - 18.5 => 0 to 50.5 degrees -->
          <path d={describeArc(190, 180, 130, 0, 50.5)} fill="none" stroke="#3b82f6" stroke-width="50" />
          <!-- Normal: 18.5 - 25 => 51.5 to 89.5 degrees -->
          <path d={describeArc(190, 180, 130, 51.5, 89.5)} fill="none" stroke="#10b981" stroke-width="50" />
          <!-- Overweight: 25 - 30 => 90.5 to 119.5 degrees -->
          <path d={describeArc(190, 180, 130, 90.5, 119.5)} fill="none" stroke="#f59e0b" stroke-width="50" />
          <!-- Obese: 30 - 40 => 120.5 to 180 degrees -->
          <path d={describeArc(190, 180, 130, 120.5, 180)} fill="none" stroke="#ef4444" stroke-width="50" />
          
          <!-- Category Text Inside Arc (rotated to align with curve tangent) -->
          <!-- Underweight: কম / ওজন — midpoint 25.5°, tangent rotation = 25.5 - 90 = -64.5° -->
          <g transform="translate({polarToCartesian(190, 180, 130, 25.5).x}, {polarToCartesian(190, 180, 130, 25.5).y}) rotate({25.5 - 90})">
            <text x="0" y="-9" text-anchor="middle" dominant-baseline="middle" fill="white" font-weight="bold" font-size="14" class="drop-shadow-sm pointer-events-none">{t.arcUnderweight1}</text>
            <text x="0" y="9" text-anchor="middle" dominant-baseline="middle" fill="white" font-weight="bold" font-size="14" class="drop-shadow-sm pointer-events-none">{t.arcUnderweight2}</text>
          </g>
          <!-- Normal: স্বাভাবিক / ওজন — midpoint 70.5°, tangent rotation = 70.5 - 90 = -19.5° -->
          <g transform="translate({polarToCartesian(190, 180, 130, 70.5).x}, {polarToCartesian(190, 180, 130, 70.5).y}) rotate({70.5 - 90})">
            <text x="0" y="-9" text-anchor="middle" dominant-baseline="middle" fill="white" font-weight="bold" font-size="14" class="drop-shadow-sm pointer-events-none">{t.arcNormal1}</text>
            <text x="0" y="9" text-anchor="middle" dominant-baseline="middle" fill="white" font-weight="bold" font-size="14" class="drop-shadow-sm pointer-events-none">{t.arcNormal2}</text>
          </g>
          <!-- Overweight: অতিরিক্ত / ওজন — midpoint 105°, tangent rotation = 105 - 90 = 15° -->
          <g transform="translate({polarToCartesian(190, 180, 130, 105).x}, {polarToCartesian(190, 180, 130, 105).y}) rotate({105 - 90})">
            <text x="0" y="-9" text-anchor="middle" dominant-baseline="middle" fill="white" font-weight="bold" font-size="14" class="drop-shadow-sm pointer-events-none">{t.arcOverweight1}</text>
            <text x="0" y="9" text-anchor="middle" dominant-baseline="middle" fill="white" font-weight="bold" font-size="14" class="drop-shadow-sm pointer-events-none">{t.arcOverweight2}</text>
          </g>
          <!-- Obese: স্থুলকায় — midpoint 150°, tangent rotation = 150 - 90 = 60° -->
          <g transform="translate({polarToCartesian(190, 180, 130, 150).x}, {polarToCartesian(190, 180, 130, 150).y}) rotate({150 - 90})">
            <text x="0" y="0" text-anchor="middle" dominant-baseline="middle" fill="white" font-weight="bold" font-size="14" class="drop-shadow-sm pointer-events-none">{t.arcObese1}</text>
          </g>

          <!-- Cutoff Markers (Ticks and Numbers) -->
          <!-- 10 (Start) -->
          <text x={polarToCartesian(190, 180, 175, 0).x} y={polarToCartesian(190, 180, 175, 0).y} text-anchor="middle" alignment-baseline="middle" font-size="12" class="fill-slate-500 font-bold">{formatNum(10)}</text>
          
          <!-- 18.5 -->
          <line x1={polarToCartesian(190, 180, 157, 51).x} y1={polarToCartesian(190, 180, 157, 51).y} x2={polarToCartesian(190, 180, 165, 51).x} y2={polarToCartesian(190, 180, 165, 51).y} stroke="currentColor" stroke-width="2" class="text-slate-300 dark:text-slate-600" />
          <text x={polarToCartesian(190, 180, 175, 51).x} y={polarToCartesian(190, 180, 175, 51).y} text-anchor="middle" alignment-baseline="middle" font-size="12" class="fill-slate-500 font-bold">{formatNum(18.5)}</text>

          <!-- 25 -->
          <line x1={polarToCartesian(190, 180, 157, 90).x} y1={polarToCartesian(190, 180, 157, 90).y} x2={polarToCartesian(190, 180, 165, 90).x} y2={polarToCartesian(190, 180, 165, 90).y} stroke="currentColor" stroke-width="2" class="text-slate-300 dark:text-slate-600" />
          <text x={polarToCartesian(190, 180, 175, 90).x} y={polarToCartesian(190, 180, 175, 90).y} text-anchor="middle" alignment-baseline="middle" font-size="12" class="fill-slate-500 font-bold">{formatNum(25)}</text>

          <!-- 30 -->
          <line x1={polarToCartesian(190, 180, 157, 120).x} y1={polarToCartesian(190, 180, 157, 120).y} x2={polarToCartesian(190, 180, 165, 120).x} y2={polarToCartesian(190, 180, 165, 120).y} stroke="currentColor" stroke-width="2" class="text-slate-300 dark:text-slate-600" />
          <text x={polarToCartesian(190, 180, 175, 120).x} y={polarToCartesian(190, 180, 175, 120).y} text-anchor="middle" alignment-baseline="middle" font-size="12" class="fill-slate-500 font-bold">{formatNum(30)}</text>

          <!-- 40 (End) -->
          <text x={polarToCartesian(190, 180, 175, 180).x} y={polarToCartesian(190, 180, 175, 180).y} text-anchor="middle" alignment-baseline="middle" font-size="12" class="fill-slate-500 font-bold">{formatNum(40)}</text>
          
          <!-- Indicator Needle -->
          <g transform="translate(190, 180) rotate({gaugeAngle})" filter="url(#needle-shadow)" style="transition: transform 1s cubic-bezier(0.34, 1.56, 0.64, 1);">
            <polygon points="10,-5 10,5 -100,0" fill="#1e293b" class="dark:fill-slate-100" />
            <polygon points="-100,-4 -100,4 -118,0" fill="#ef4444" /> <!-- Red indicator triangle tip -->
            <circle cx="0" cy="0" r="14" fill="#1e293b" class="dark:fill-slate-100" />
            <circle cx="0" cy="0" r="5" fill="#f8fafc" class="dark:fill-slate-800" />
          </g>

        </svg>
      </div>

      <div class="text-center mt-4">
        <div class="text-6xl font-black font-display text-slate-900 dark:text-white mb-2 tracking-tight">
          {formatNum(result.bmi.toFixed(1))} <span class="text-xl text-slate-500 dark:text-slate-400 font-bold ml-1">{t.bmiUnit}</span>
        </div>
        <h4 class="text-3xl font-black font-display {result.category === 'underweight' ? 'text-blue-500' : result.category === 'normal' ? 'text-emerald-500' : result.category === 'overweight' ? 'text-amber-500' : 'text-red-500'}">
          {t[result.category]}
        </h4>
      </div>
    {/if}
  </div>
</div>
