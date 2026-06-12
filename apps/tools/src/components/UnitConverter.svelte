<script lang="ts">
  import { categories, units, type Category, type Unit } from '../data/units';

  export let lang = 'bn';

  const dict = {
    bn: {
      cardTitle: 'ইউনিট কনভার্টার',
      cardDesc: 'দৈর্ঘ্য, ক্ষেত্রফল, ওজন, তাপমাত্রা ও অন্যান্য বিভিন্ন ইউনিটের মধ্যে দ্রুত রূপান্তর করুন।',
      fromLabel: 'থেকে',
      toLabel: 'প্রতি',
      valuePlaceholder: 'মান লিখুন',
      resultPlaceholder: 'ফলাফল',
      swapTooltip: 'ইউনিট পরিবর্তন করুন',
      copyTooltip: 'কপি করুন',
      copiedText: 'কপি হয়েছে!',
    },
    en: {
      cardTitle: 'Unit Converter',
      cardDesc: 'Quickly convert between length, area, weight, temperature, and various other units.',
      fromLabel: 'From',
      toLabel: 'To',
      valuePlaceholder: 'Enter value',
      resultPlaceholder: 'Result',
      swapTooltip: 'Swap units',
      copyTooltip: 'Copy result',
      copiedText: 'Copied!',
    }
  };

  $: t = dict[lang === 'bn' ? 'bn' : 'en'];

  // Icons for categories
  const categoryIcons: Record<string, string> = {
    length: '📏',
    area: '🗺️',
    weight: '⚖️',
    volume: '🧪',
    temperature: '🌡️',
    speed: '🚀',
    pressure: '🎈',
    time: '⏱️',
    digital_storage: '💾',
    energy: '⚡',
    fuel_efficiency: '⛽',
  };

  // State
  let activeCategoryKey = categories[0].key;
  let fromUnitKey = '';
  let toUnitKey = '';
  let inputValue = '1';

  // Reactively filter units for active category
  $: categoryUnits = units.filter(u => u.categoryKey === activeCategoryKey);

  // Set defaults when category changes
  $: {
    if (categoryUnits.length > 0) {
      // Avoid resetting if the current unit is already in the new category (safeguard)
      const currentFromInNewCat = categoryUnits.find(u => u.key === fromUnitKey);
      const currentToInNewCat = categoryUnits.find(u => u.key === toUnitKey);

      if (!currentFromInNewCat || !currentToInNewCat) {
        fromUnitKey = categoryUnits[0].key;
        toUnitKey = categoryUnits[1] ? categoryUnits[1].key : categoryUnits[0].key;
      }
    }
  }

  // Find active unit details
  $: fromUnit = units.find(u => u.key === fromUnitKey);
  $: toUnit = units.find(u => u.key === toUnitKey);

  // Perform conversion reactively
  $: convertedValue = convert(inputValue, fromUnit, toUnit);

  function convert(valStr: string, from: Unit | undefined, to: Unit | undefined): number | null {
    const value = parseFloat(valStr);
    if (isNaN(value) || !from || !to) return null;
    if (from.key === to.key) return value;

    // 1. Convert from source unit to category base unit
    let baseValue = 0;
    if (from.convert) {
      baseValue = from.convert(value);
    } else if (from.factor !== undefined) {
      baseValue = value * from.factor;
    } else {
      baseValue = value;
    }

    // 2. Convert from base unit to target unit
    let result = 0;
    if (to.revert) {
      result = to.revert(baseValue);
    } else if (to.factor !== undefined) {
      result = baseValue / to.factor;
    } else {
      result = baseValue;
    }

    return result;
  }

  // Format the float numbers nicely without trailing zeros or unnecessary scientific notations
  function formatValue(val: number | null): string {
    if (val === null) return '';
    if (val === 0) return '0';
    
    // Check if it's very small or very large to use scientific notation
    if (Math.abs(val) < 1e-6 || Math.abs(val) > 1e12) {
      return val.toExponential(6);
    }

    // Otherwise, limit to 8 decimal places and strip trailing zeros
    const fixed = val.toFixed(8);
    return fixed.replace(/\.?0+$/, '');
  }

  // Locale-aware digits formatter
  function fmt(nStr: string): string {
    if (lang === 'en') return nStr;
    return nStr.replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)]);
  }

  function handleSwap() {
    const temp = fromUnitKey;
    fromUnitKey = toUnitKey;
    toUnitKey = temp;
  }

  function handleCategoryChange(key: string) {
    activeCategoryKey = key;
  }

  function copyResult() {
    const resultText = formatValue(convertedValue);
    if (!resultText) return;
    navigator.clipboard.writeText(resultText).then(() => {
      alert(t.copiedText);
    }).catch(err => {
      console.error('Copy failed:', err);
    });
  }
</script>

<div class="w-full flex flex-col gap-8">
  <!-- Category Selector Tabs -->
  <div class="relative w-full">
    <!-- Left/Right Fading Masks to indicate scrollability -->
    <div class="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-50 dark:from-slate-900 to-transparent pointer-events-none z-10 rounded-l-[2rem]"></div>
    <div class="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50 dark:from-slate-900 to-transparent pointer-events-none z-10 rounded-r-[2rem]"></div>

    <div class="w-full overflow-x-auto no-scrollbar p-2 bg-slate-100/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-[2rem] shadow-inner">
      <div class="flex gap-1.5 min-w-max">
        {#each categories as category}
          <button
            type="button"
            class="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all duration-300 text-sm select-none cursor-pointer
              {activeCategoryKey === category.key
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:scale-[1.01]'}"
            on:click={() => handleCategoryChange(category.key)}
          >
            <span class="text-base">{categoryIcons[category.key] || '📊'}</span>
            <span>{lang === 'bn' ? category.labelBn : category.labelEn}</span>
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- Converter Interface -->
  <div class="flex flex-col lg:flex-row gap-6 items-stretch">
    <!-- Left Box: From Input -->
    <div class="flex-1 bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col justify-between transition-colors">
      <div class="flex flex-col gap-4">
        <div class="flex justify-between items-center">
          <span class="font-bold text-slate-800 dark:text-slate-200 text-lg">{t.fromLabel}</span>
        </div>
        
        <div class="relative">
          <select
            bind:value={fromUnitKey}
            class="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-2xl px-5 py-4 text-lg font-bold text-slate-900 dark:text-white outline-none focus-within:border-blue-500 transition-all appearance-none cursor-pointer"
          >
            {#each categoryUnits as unit}
              <option value={unit.key}>{lang === 'bn' ? unit.labelBn : unit.labelEn}</option>
            {/each}
          </select>
          <div class="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
            ▼
          </div>
        </div>

        <div class="mt-4 flex flex-col gap-2">
          <label for="from-input" class="text-sm font-semibold text-slate-500 dark:text-slate-400">{t.valuePlaceholder}</label>
          <input
            id="from-input"
            type="number"
            bind:value={inputValue}
            class="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-2xl px-5 py-4 text-2xl font-black text-slate-900 dark:text-white outline-none focus-within:border-blue-500 transition-all"
            placeholder="0"
            step="any"
          />
        </div>
      </div>
    </div>

    <!-- Middle Swap Button -->
    <div class="flex items-center justify-center -my-2 lg:my-0 lg:-mx-2 z-10">
      <button
        type="button"
        class="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer border-4 border-slate-50 dark:border-slate-900"
        title={t.swapTooltip}
        on:click={handleSwap}
      >
        <svg class="w-6 h-6 rotate-90 lg:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      </button>
    </div>

    <!-- Right Box: To Result -->
    <div class="flex-1 bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col justify-between transition-colors">
      <div class="flex flex-col gap-4">
        <div class="flex justify-between items-center">
          <span class="font-bold text-slate-800 dark:text-slate-200 text-lg">{t.toLabel}</span>
        </div>

        <div class="relative">
          <select
            bind:value={toUnitKey}
            class="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-2xl px-5 py-4 text-lg font-bold text-slate-900 dark:text-white outline-none focus-within:border-blue-500 transition-all appearance-none cursor-pointer"
          >
            {#each categoryUnits as unit}
              <option value={unit.key}>{lang === 'bn' ? unit.labelBn : unit.labelEn}</option>
            {/each}
          </select>
          <div class="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
            ▼
          </div>
        </div>

        <div class="mt-4 flex flex-col gap-2">
          <div class="flex justify-between items-center">
            <span class="text-sm font-semibold text-slate-500 dark:text-slate-400">{t.resultPlaceholder}</span>
            {#if convertedValue !== null}
              <button
                type="button"
                class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                on:click={copyResult}
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {t.copyTooltip}
              </button>
            {/if}
          </div>
          <div class="w-full bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 min-h-[66px] flex items-center text-2xl font-black text-slate-950 dark:text-white overflow-x-auto select-all">
            {fmt(formatValue(convertedValue))}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
