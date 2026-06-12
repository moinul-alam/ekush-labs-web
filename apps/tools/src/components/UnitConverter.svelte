<script lang="ts">
  import {
    categories,
    units,
    globalSuggestions,
    categorySuggestions,
    type Category,
    type Unit,
    type SuggestionPair,
  } from "../data/units";
  import { fmt, handleLocalizedInput } from "../utils/numbers";

  export let lang: "bn" | "en" = "bn";

  // ── i18n ──────────────────────────────────────────────────────────────────
  const dict = {
    bn: {
      cardTitle: "ইউনিট কনভার্টার",
      fromLabel: "থেকে",
      toLabel: "প্রতি",
      valuePlaceholder: "মান লিখুন",
      resultPlaceholder: "ফলাফল",
      swapTooltip: "ইউনিট পরিবর্তন করুন",
      copyTooltip: "কপি করুন",
      copiedText: "কপি!",
      quickPairs: "দ্রুত রূপান্তর",
      invalidInput: "অবৈধ মান",
      tapHint: "একটি ক্যাটাগরি বা জোড়া বেছে নিন",
    },
    en: {
      cardTitle: "Unit Converter",
      fromLabel: "From",
      toLabel: "To",
      valuePlaceholder: "Enter value",
      resultPlaceholder: "Result",
      swapTooltip: "Swap units",
      copyTooltip: "Copy",
      copiedText: "Copied!",
      quickPairs: "Quick Convert",
      invalidInput: "Invalid value",
      tapHint: "Choose a category or pair below",
    },
  };
  $: t = dict[lang];

  // ── State ─────────────────────────────────────────────────────────────────
  let activeCategoryKey: string | null = null; // null = first-launch, no category selected
  let fromUnitKey = "";
  let toUnitKey = "";
  let inputValue = "1";
  let copied = false;
  let copyTimer: ReturnType<typeof setTimeout>;

  // ── Derived ───────────────────────────────────────────────────────────────
  $: activeCategory = activeCategoryKey
    ? (categories.find((c) => c.key === activeCategoryKey) ?? null)
    : null;

  $: categoryUnits = activeCategoryKey
    ? units.filter((u) => u.categoryKey === activeCategoryKey)
    : [];

  $: fromUnit = units.find((u) => u.key === fromUnitKey);
  $: toUnit = units.find((u) => u.key === toUnitKey);

  $: suggestions = activeCategoryKey
    ? (categorySuggestions[activeCategoryKey] ?? [])
    : globalSuggestions;

  $: inputNum = parseFloat(inputValue);
  $: inputValid = !isNaN(inputNum) && inputValue.trim() !== "";

  $: convertedValue = inputValid ? convert(inputNum, fromUnit, toUnit) : null;
  $: resultText = inputValid
    ? (convertedValue !== null ? fmt(formatValue(convertedValue), lang) : "")
    : inputValue.trim() !== ""
      ? t.invalidInput
      : "";

  // ── Conversion engine ─────────────────────────────────────────────────────
  function convert(
    value: number,
    from: Unit | undefined,
    to: Unit | undefined,
  ): number | null {
    if (!from || !to) return null;
    if (from.key === to.key) return value;

    let base: number;
    if (from.convert) {
      base = from.convert(value);
    } else if (from.factor !== undefined) {
      base = value * from.factor;
    } else {
      return null;
    }

    let result: number;
    if (to.revert) {
      result = to.revert(base);
    } else if (to.factor !== undefined) {
      result = base / to.factor;
    } else {
      return null;
    }

    return result;
  }

  // ── Formatting ────────────────────────────────────────────────────────────
  function formatValue(val: number | null): string {
    if (val === null) return '';
    if (val === 0) return '0';
    const abs = Math.abs(val);
    if (abs < 1e-6 || abs >= 1e15) return val.toExponential(4);
    return parseFloat(val.toFixed(4)).toString();
  }

  function handleInput(e: Event) {
    handleLocalizedInput(e, lang, (parsed) => {
      inputValue = parsed;
    });
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  function selectCategory(key: string) {
    activeCategoryKey = key;
    const catUnits = units.filter((u) => u.categoryKey === key);
    const firstPair = categorySuggestions[key]?.[0];
    if (firstPair) {
      fromUnitKey = firstPair.fromKey;
      toUnitKey = firstPair.toKey;
    } else if (catUnits.length >= 2) {
      fromUnitKey = catUnits[0].key;
      toUnitKey = catUnits[1].key;
    }
    inputValue = "1";
  }

  function applyPair(pair: SuggestionPair) {
    // Determine the category of the pair's fromUnit
    const fromU = units.find((u) => u.key === pair.fromKey);
    if (fromU) {
      activeCategoryKey = fromU.categoryKey;
    }
    fromUnitKey = pair.fromKey;
    toUnitKey = pair.toKey;
    inputValue = "1";
  }

  function handleSwap() {
    [fromUnitKey, toUnitKey] = [toUnitKey, fromUnitKey];
  }

  function handleFromChange(newKey: string) {
    if (newKey === toUnitKey) {
      // Auto-nudge: find a different unit
      const catUnits = units.filter((u) => u.categoryKey === activeCategoryKey);
      const other = catUnits.find((u) => u.key !== newKey);
      if (other) toUnitKey = other.key;
    }
    fromUnitKey = newKey;
  }

  function handleToChange(newKey: string) {
    if (newKey === fromUnitKey) {
      const catUnits = units.filter((u) => u.categoryKey === activeCategoryKey);
      const other = catUnits.find((u) => u.key !== newKey);
      if (other) fromUnitKey = other.key;
    }
    toUnitKey = newKey;
  }

  async function copyResult() {
    const raw = formatValue(convertedValue);
    if (!raw) return;
    try {
      await navigator.clipboard.writeText(raw);
      copied = true;
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => {
        copied = false;
      }, 2000);
    } catch (_) {
      // clipboard unavailable — silently skip
    }
  }
</script>

<!-- ── Root ──────────────────────────────────────────────────────────────── -->
<div class="w-full flex flex-col gap-6">
  <!-- ── Category Pill Cloud ──────────────────────────────────────────────── -->
  <div class="flex flex-wrap gap-2">
    {#each categories as cat}
      <button
        type="button"
        class="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 select-none cursor-pointer
          {activeCategoryKey === cat.key
          ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20 scale-[1.03]'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'}"
        on:click={() => selectCategory(cat.key)}
      >
        <span>{cat.icon}</span>
        <span>{lang === "bn" ? cat.labelBn : cat.labelEn}</span>
      </button>
    {/each}
  </div>

  <!-- ── Main Body ─────────────────────────────────────────────────────────── -->
  <div class="flex flex-col lg:flex-row gap-4 items-stretch">
    <!-- ── Suggestion Panel ─────────────────────────────────────────────── -->
    <!-- Mobile: horizontal chip row above converter -->
    <div class="lg:hidden flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {#each suggestions as pair}
        <button
          type="button"
          class="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300
                 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors cursor-pointer whitespace-nowrap"
          on:click={() => applyPair(pair)}
        >
          {lang === "bn" ? pair.labelBn : pair.labelEn}
        </button>
      {/each}
    </div>

    <!-- Desktop: vertical panel left-side -->
    <div
      class="hidden lg:flex flex-col w-48 flex-shrink-0 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
    >
      <div class="px-4 pt-4 pb-2">
        <span
          class="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
        >
          {t.quickPairs}
        </span>
      </div>
      <div class="flex flex-col gap-0.5 px-2 pb-2 flex-1">
        {#each suggestions as pair}
          <button
            type="button"
            class="w-full text-left px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-150 cursor-pointer
              text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300"
            on:click={() => applyPair(pair)}
          >
            {lang === "bn" ? pair.labelBn : pair.labelEn}
          </button>
        {/each}
      </div>
    </div>

    <!-- ── Converter ────────────────────────────────────────────────────── -->
    {#if !fromUnitKey || !toUnitKey}
      <!-- Empty / First-launch state -->
      <div
        class="flex-1 flex items-center justify-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-600 min-h-[220px]"
      >
        <p class="text-slate-400 dark:text-slate-500 text-sm font-medium">
          {t.tapHint}
        </p>
      </div>
    {:else}
      <div class="flex-1 flex flex-col sm:flex-row gap-4 items-stretch">
        <!-- From Card -->
        <div
          class="flex-1 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4"
        >
          <span
            class="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
            >{t.fromLabel}</span
          >

          <!-- Select: from unit -->
          <div class="relative">
            <select
              value={fromUnitKey}
              on:change={(e) => handleFromChange(e.currentTarget.value)}
              class="w-full appearance-none bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600
                     rounded-2xl pl-4 pr-10 py-3 text-base font-bold text-slate-900 dark:text-white
                     outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              {#each categoryUnits as unit}
                <option value={unit.key}
                  >{lang === "bn" ? unit.labelBn : unit.labelEn}</option
                >
              {/each}
            </select>
            <!-- SVG chevron -->
            <div
              class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>

          <!-- Input: no spinners -->
          <input
            type="text"
            inputmode="decimal"
            value={fmt(inputValue, lang)}
            on:input={handleInput}
            class="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600
                   rounded-2xl px-4 py-3 text-2xl font-black text-slate-900 dark:text-white
                   outline-none focus:border-blue-500 transition-colors
                   [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="0"
            aria-label={t.valuePlaceholder}
          />
        </div>

        <!-- Swap Button -->
        <div class="flex items-center justify-center">
          <button
            type="button"
            class="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center
                   shadow-md hover:scale-110 active:scale-95 transition-transform cursor-pointer
                   border-4 border-slate-50 dark:border-slate-900"
            title={t.swapTooltip}
            on:click={handleSwap}
          >
            <svg
              class="w-5 h-5 rotate-90 sm:rotate-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </button>
        </div>

        <!-- To Card -->
        <div
          class="flex-1 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4"
        >
          <span
            class="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
            >{t.toLabel}</span
          >

          <!-- Select: to unit -->
          <div class="relative">
            <select
              value={toUnitKey}
              on:change={(e) => handleToChange(e.currentTarget.value)}
              class="w-full appearance-none bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600
                     rounded-2xl pl-4 pr-10 py-3 text-base font-bold text-slate-900 dark:text-white
                     outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              {#each categoryUnits as unit}
                <option value={unit.key}
                  >{lang === "bn" ? unit.labelBn : unit.labelEn}</option
                >
              {/each}
            </select>
            <div
              class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>

          <!-- Result: readonly input for reliable select-all + copy -->
          <div class="relative">
            <input
              type="text"
              readonly
              value={resultText}
              class="w-full bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-100 dark:border-slate-800
                     rounded-2xl px-4 py-3 text-2xl font-black text-slate-900 dark:text-white
                     outline-none cursor-text select-all transition-colors
                     {!inputValid && inputValue.trim() !== ''
                ? 'text-red-500 dark:text-red-400'
                : ''}"
              placeholder={t.resultPlaceholder}
              aria-label={t.resultPlaceholder}
            />
            {#if convertedValue !== null}
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg
                       transition-all cursor-pointer
                       {copied
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40'
                  : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'}"
                on:click={copyResult}
                title={t.copyTooltip}
              >
                {#if copied}
                  <svg
                    class="w-3.5 h-3.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  {t.copiedText}
                {:else}
                  <svg
                    class="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  {t.copyTooltip}
                {/if}
              </button>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
