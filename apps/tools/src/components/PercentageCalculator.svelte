<script lang="ts">
  import { fmt, handleLocalizedInput } from '../utils/numbers';

  export let lang: 'bn' | 'en' = 'en';

  const dict = {
    bn: {
      cardTitle: 'শতাংশ ক্যালকুলেটর',
      mode1_title: 'Y এর X% কত?',
      mode1_x: 'শতাংশ (X%)',
      mode1_y: 'সংখ্যা (Y)',
      mode2_title: 'Y এর কত শতাংশ হলো X?',
      mode2_x: 'সংখ্যা (X)',
      mode2_y: 'সংখ্যা (Y)',
      mode3_title: 'X থেকে Y এ পরিবর্তনের হার',
      mode3_x: 'শুরু (X)',
      mode3_y: 'শেষ (Y)',
      mode3_increase: 'বৃদ্ধি',
      mode3_decrease: 'হ্রাস',
      mode4_title: 'Y এর সাথে X% যোগ করুন',
      mode4_x: 'শতাংশ (X%)',
      mode4_y: 'সংখ্যা (Y)',
      mode5_title: 'Y থেকে X% বিয়োগ করুন',
      mode5_x: 'শতাংশ (X%)',
      mode5_y: 'সংখ্যা (Y)',
      result: 'ফলাফল',
    },
    en: {
      cardTitle: 'Percentage Calculator',
      mode1_title: 'What is X% of Y?',
      mode1_x: 'Percentage (X%)',
      mode1_y: 'Number (Y)',
      mode2_title: 'X is what % of Y?',
      mode2_x: 'Number (X)',
      mode2_y: 'Number (Y)',
      mode3_title: '% Change from X to Y',
      mode3_x: 'From (X)',
      mode3_y: 'To (Y)',
      mode3_increase: 'Increase',
      mode3_decrease: 'Decrease',
      mode4_title: 'Add X% to Y',
      mode4_x: 'Percentage (X%)',
      mode4_y: 'Number (Y)',
      mode5_title: 'Subtract X% from Y',
      mode5_x: 'Percentage (X%)',
      mode5_y: 'Number (Y)',
      result: 'Result',
    }
  };

  $: t = dict[lang];

  function formatNum(n: number | string, decimals: number = 4) {
    if (typeof n === 'number') {
      let str = parseFloat(n.toFixed(decimals)).toString();
      return fmt(str, lang);
    }
    return fmt(n.toString(), lang);
  }

  // --- Mode 1: What is X% of Y? ---
  let m1_x_str = '';
  let m1_y_str = '';
  $: m1_x = parseFloat(m1_x_str);
  $: m1_y = parseFloat(m1_y_str);
  $: m1_result = (!isNaN(m1_x) && !isNaN(m1_y) && m1_x_str !== '' && m1_y_str !== '') ? (m1_x / 100) * m1_y : null;

  // --- Mode 2: X is what % of Y? ---
  let m2_x_str = '';
  let m2_y_str = '';
  $: m2_x = parseFloat(m2_x_str);
  $: m2_y = parseFloat(m2_y_str);
  $: m2_result = (!isNaN(m2_x) && !isNaN(m2_y) && m2_y !== 0 && m2_x_str !== '' && m2_y_str !== '') ? (m2_x / m2_y) * 100 : null;

  // --- Mode 3: % change from X to Y ---
  let m3_x_str = '';
  let m3_y_str = '';
  $: m3_x = parseFloat(m3_x_str);
  $: m3_y = parseFloat(m3_y_str);
  $: m3_diff = (!isNaN(m3_x) && !isNaN(m3_y) && m3_x !== 0 && m3_x_str !== '' && m3_y_str !== '') ? ((m3_y - m3_x) / Math.abs(m3_x)) * 100 : null;
  $: m3_direction = m3_diff !== null ? (m3_diff >= 0 ? t.mode3_increase : t.mode3_decrease) : '';
  $: m3_abs = m3_diff !== null ? Math.abs(m3_diff) : null;

  // --- Mode 4: Add X% to Y ---
  let m4_x_str = '';
  let m4_y_str = '';
  $: m4_x = parseFloat(m4_x_str);
  $: m4_y = parseFloat(m4_y_str);
  $: m4_result = (!isNaN(m4_x) && !isNaN(m4_y) && m4_x_str !== '' && m4_y_str !== '') ? m4_y + (m4_y * (m4_x / 100)) : null;

  // --- Mode 5: Subtract X% from Y ---
  let m5_x_str = '';
  let m5_y_str = '';
  $: m5_x = parseFloat(m5_x_str);
  $: m5_y = parseFloat(m5_y_str);
  $: m5_result = (!isNaN(m5_x) && !isNaN(m5_y) && m5_x_str !== '' && m5_y_str !== '') ? m5_y - (m5_y * (m5_x / 100)) : null;

</script>

<div class="calculator-layout max-w-4xl mx-auto space-y-6">
  
  <!-- Header matching EMI style -->
  <div class="flex items-start gap-4 mb-2">
    <div class="text-4xl">📊</div>
    <div>
      <h2 class="text-2xl font-bold text-slate-900 dark:text-white m-0">{t.cardTitle}</h2>
    </div>
  </div>

  <!-- Mode 1: What is X% of Y? -->
  <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-lg">
    <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
      <span class="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-black">1</span>
      {t.mode1_title}
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="pct-m1x" class="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">{t.mode1_x}</label>
        <input id="pct-m1x" type="text" inputmode="decimal" value={formatNum(m1_x_str)} on:input={(e) => handleLocalizedInput(e, lang, v => m1_x_str = v)} class="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-lg font-semibold focus:border-blue-500 outline-none transition-all dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
      </div>
      <div>
        <label for="pct-m1y" class="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">{t.mode1_y}</label>
        <input id="pct-m1y" type="text" inputmode="decimal" value={formatNum(m1_y_str)} on:input={(e) => handleLocalizedInput(e, lang, v => m1_y_str = v)} class="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-lg font-semibold focus:border-blue-500 outline-none transition-all dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
      </div>
    </div>
    {#if m1_result !== null}
      <div class="mt-5 bg-slate-50 dark:bg-slate-700/50 p-5 rounded-2xl text-center">
        <span class="text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-1">{t.result}</span>
        <span class="text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">{formatNum(m1_result)}</span>
      </div>
    {/if}
  </div>

  <!-- Mode 2: X is what % of Y? -->
  <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-lg">
    <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
      <span class="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-black">2</span>
      {t.mode2_title}
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="pct-m2x" class="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">{t.mode2_x}</label>
        <input id="pct-m2x" type="text" inputmode="decimal" value={formatNum(m2_x_str)} on:input={(e) => handleLocalizedInput(e, lang, v => m2_x_str = v)} class="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-lg font-semibold focus:border-emerald-500 outline-none transition-all dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
      </div>
      <div>
        <label for="pct-m2y" class="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">{t.mode2_y}</label>
        <input id="pct-m2y" type="text" inputmode="decimal" value={formatNum(m2_y_str)} on:input={(e) => handleLocalizedInput(e, lang, v => m2_y_str = v)} class="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-lg font-semibold focus:border-emerald-500 outline-none transition-all dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
      </div>
    </div>
    {#if m2_result !== null}
      <div class="mt-5 bg-slate-50 dark:bg-slate-700/50 p-5 rounded-2xl text-center">
        <span class="text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-1">{t.result}</span>
        <span class="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">{formatNum(m2_result)}%</span>
      </div>
    {/if}
  </div>

  <!-- Mode 3: % change from X to Y -->
  <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-lg">
    <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
      <span class="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-black">3</span>
      {t.mode3_title}
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="pct-m3x" class="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">{t.mode3_x}</label>
        <input id="pct-m3x" type="text" inputmode="decimal" value={formatNum(m3_x_str)} on:input={(e) => handleLocalizedInput(e, lang, v => m3_x_str = v)} class="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-lg font-semibold focus:border-amber-500 outline-none transition-all dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
      </div>
      <div>
        <label for="pct-m3y" class="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">{t.mode3_y}</label>
        <input id="pct-m3y" type="text" inputmode="decimal" value={formatNum(m3_y_str)} on:input={(e) => handleLocalizedInput(e, lang, v => m3_y_str = v)} class="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-lg font-semibold focus:border-amber-500 outline-none transition-all dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
      </div>
    </div>
    {#if m3_abs !== null}
      <div class="mt-5 bg-slate-50 dark:bg-slate-700/50 p-5 rounded-2xl text-center">
        <span class="text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-1">{t.result}</span>
        <span class="text-3xl font-black bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">{formatNum(m3_abs)}%</span>
        <span class="ml-2 px-3 py-1 rounded-full text-sm font-bold {m3_diff !== null && m3_diff >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'}">
          {m3_diff !== null && m3_diff >= 0 ? '↑' : '↓'} {m3_direction}
        </span>
      </div>
    {/if}
  </div>

  <!-- Mode 4: Add X% to Y -->
  <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-lg">
    <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
      <span class="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-sm font-black">4</span>
      {t.mode4_title}
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="pct-m4y" class="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">{t.mode4_y}</label>
        <input id="pct-m4y" type="text" inputmode="decimal" value={formatNum(m4_y_str)} on:input={(e) => handleLocalizedInput(e, lang, v => m4_y_str = v)} class="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-lg font-semibold focus:border-cyan-500 outline-none transition-all dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
      </div>
      <div>
        <label for="pct-m4x" class="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">{t.mode4_x}</label>
        <input id="pct-m4x" type="text" inputmode="decimal" value={formatNum(m4_x_str)} on:input={(e) => handleLocalizedInput(e, lang, v => m4_x_str = v)} class="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-lg font-semibold focus:border-cyan-500 outline-none transition-all dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
      </div>
    </div>
    {#if m4_result !== null}
      <div class="mt-5 bg-slate-50 dark:bg-slate-700/50 p-5 rounded-2xl text-center">
        <span class="text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-1">{t.result}</span>
        <span class="text-3xl font-black bg-gradient-to-r from-cyan-600 to-blue-500 bg-clip-text text-transparent">{formatNum(m4_result)}</span>
      </div>
    {/if}
  </div>

  <!-- Mode 5: Subtract X% from Y -->
  <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-lg">
    <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
      <span class="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-black">5</span>
      {t.mode5_title}
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="pct-m5y" class="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">{t.mode5_y}</label>
        <input id="pct-m5y" type="text" inputmode="decimal" value={formatNum(m5_y_str)} on:input={(e) => handleLocalizedInput(e, lang, v => m5_y_str = v)} class="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-lg font-semibold focus:border-rose-500 outline-none transition-all dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
      </div>
      <div>
        <label for="pct-m5x" class="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">{t.mode5_x}</label>
        <input id="pct-m5x" type="text" inputmode="decimal" value={formatNum(m5_x_str)} on:input={(e) => handleLocalizedInput(e, lang, v => m5_x_str = v)} class="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-lg font-semibold focus:border-rose-500 outline-none transition-all dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
      </div>
    </div>
    {#if m5_result !== null}
      <div class="mt-5 bg-slate-50 dark:bg-slate-700/50 p-5 rounded-2xl text-center">
        <span class="text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-1">{t.result}</span>
        <span class="text-3xl font-black bg-gradient-to-r from-rose-600 to-pink-500 bg-clip-text text-transparent">{formatNum(m5_result)}</span>
      </div>
    {/if}
  </div>

</div>
