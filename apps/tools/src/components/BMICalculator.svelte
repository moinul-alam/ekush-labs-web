<script>
  // Language Dictionary
  const dict = {
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
      heightPlaceholderIn: 'in'
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
  function fmt(n) {
    if (lang === 'en') return n.toString();
    return n.toString().replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]);
  }

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
        <label class="font-semibold text-slate-800 dark:text-slate-200">{t.weightLabel}</label>
        <div class="unit-toggle flex gap-2 bg-slate-50 dark:bg-slate-700 p-1 rounded-xl border border-slate-200 dark:border-slate-600">
          <button class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all {weightUnit === 'kg' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}" on:click={() => toggleWeightUnit('kg')}>kg</button>
          <button class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all {weightUnit === 'lb' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}" on:click={() => toggleWeightUnit('lb')}>lb</button>
        </div>
      </div>
      <div class="input-wrapper flex items-center gap-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
        <input type="number" bind:value={weightVal} placeholder={t.weightPlaceholder} class="flex-1 py-3 bg-transparent border-none text-lg font-semibold text-slate-900 dark:text-white outline-none" />
        <span class="text-slate-500 dark:text-slate-400 font-semibold">{weightUnit}</span>
      </div>
    </div>

    <!-- Height Input -->
    <div class="input-section flex flex-col gap-3 mb-8">
      <div class="label-row flex justify-between items-center">
        <label class="font-semibold text-slate-800 dark:text-slate-200">{t.heightLabel}</label>
        <div class="unit-toggle flex gap-2 bg-slate-50 dark:bg-slate-700 p-1 rounded-xl border border-slate-200 dark:border-slate-600">
          <button class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all {heightUnit === 'cm' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}" on:click={() => toggleHeightUnit('cm')}>cm</button>
          <button class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all {heightUnit === 'ft' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}" on:click={() => toggleHeightUnit('ft')}>ft/in</button>
        </div>
      </div>
      
      {#if heightUnit === 'cm'}
        <div class="input-wrapper flex items-center gap-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
          <input type="number" bind:value={heightCmVal} placeholder={t.heightPlaceholderCm} class="flex-1 py-3 bg-transparent border-none text-lg font-semibold text-slate-900 dark:text-white outline-none" />
          <span class="text-slate-500 dark:text-slate-400 font-semibold">cm</span>
        </div>
      {:else}
        <div class="flex gap-4">
          <div class="input-wrapper flex-1 flex items-center gap-2 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
            <input type="number" bind:value={heightFtVal} placeholder={t.heightPlaceholderFt} class="flex-1 py-3 w-full bg-transparent border-none text-lg font-semibold text-slate-900 dark:text-white outline-none" />
            <span class="text-slate-500 dark:text-slate-400 font-semibold">ft</span>
          </div>
          <div class="input-wrapper flex-1 flex items-center gap-2 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
            <input type="number" bind:value={heightInVal} placeholder={t.heightPlaceholderIn} class="flex-1 py-3 w-full bg-transparent border-none text-lg font-semibold text-slate-900 dark:text-white outline-none" />
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
      <div class="text-center mb-8">
        <h3 class="text-xl font-bold text-slate-800 dark:text-slate-200">{t.navCalTitlePart1} Result</h3>
      </div>

      <div class="bmi-bar-container relative pt-10 pb-5">
        <div class="bmi-bar-segments flex h-10 rounded-full overflow-hidden">
          <div class="h-full bg-blue-500 flex items-center justify-center relative w-[28.33%]">
            <span class="text-white font-semibold text-xs whitespace-nowrap">{t.underweightShort}</span>
          </div>
          <div class="h-full bg-emerald-500 flex items-center justify-center relative w-[21.67%]">
            <span class="text-white font-semibold text-xs whitespace-nowrap">{t.normalShort}</span>
          </div>
          <div class="h-full bg-amber-500 flex items-center justify-center relative w-[16.67%]">
            <span class="text-white font-semibold text-xs whitespace-nowrap">{t.overweightShort}</span>
          </div>
          <div class="h-full bg-red-500 flex items-center justify-center relative w-[33.33%]">
            <span class="text-white font-semibold text-xs whitespace-nowrap">{t.obeseShort}</span>
          </div>
        </div>
        
        <div class="absolute top-0 flex flex-col items-center transition-all duration-500 ease-out -translate-x-1/2" style="left: {result.progress}%">
          <div class="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">{fmt(result.bmi.toFixed(1))}</div>
          <div class="w-0 h-0 border-l-[10px] border-r-[10px] border-l-transparent border-r-transparent border-b-[14px] border-b-slate-800 dark:border-b-white"></div>
        </div>

        <div class="flex justify-between mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
          <span>{fmt(10)}</span>
          <span>{fmt(18.5)}</span>
          <span>{fmt(25)}</span>
          <span>{fmt(30)}</span>
          <span>{fmt(40)}</span>
        </div>
      </div>

      <div class="text-center mt-6">
        <h4 class="text-2xl font-bold {result.category === 'underweight' ? 'text-blue-500' : result.category === 'normal' ? 'text-emerald-500' : result.category === 'overweight' ? 'text-amber-500' : 'text-red-500'}">{t[result.category]}</h4>
      </div>
    {/if}
  </div>
</div>
