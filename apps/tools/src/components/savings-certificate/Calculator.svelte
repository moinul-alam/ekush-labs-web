<script lang="ts">
  import { onMount } from 'svelte';
  import { SavingsDataStore } from '../../lib/savings-certificate/store';
  import {
    calculateAllSchemes,
    rankSchemes,
    type SortCriterion,
  } from '../../lib/savings-certificate/calculator';
  import {
    formatCurrency,
    formatNumberInWords,
    parseLocalizedAmount,
    toBanglaDigits,
    toEnglishDigits,
    formatDate,
  } from '../../lib/savings-certificate/formatters';
  import type {
    IndexManifest,
    SchemesData,
    TaxData,
    RatePeriodData,
    SchemeResult,
    PeriodManifestItem,
  } from '../../lib/savings-certificate/types';

  import SchemeCard from './SchemeCard.svelte';
  import CompareModal from './CompareModal.svelte';
  import Faq from './Faq.svelte';
  import Disclaimer from './Disclaimer.svelte';

  export let lang: 'bn' | 'en' = 'bn';

  const store = new SavingsDataStore();

  let loading = true;
  let error: string | null = null;

  let indexManifest: IndexManifest | null = null;
  let schemesData: SchemesData | null = null;
  let taxData: TaxData | null = null;
  let currentRateData: RatePeriodData | null = null;
  let activePeriod: PeriodManifestItem | null = null;

  // User input states
  let rawAmountInput: string = '';
  let numericAmount: number = 0;
  let isPensioner: boolean = false;
  let purchaseDate: string = new Date().toISOString().split('T')[0];
  let showAdvanced: boolean = false;
  let sortBy: SortCriterion = 'net';

  // Compare mode states
  let selectedForCompare: string[] = [];
  let isCompareModalOpen: boolean = false;

  // Share link toast notification
  let showCopiedToast: boolean = false;

  // Stale rate warning check
  let isRateStale: boolean = false;

  // Quick pick options
  const quickPicks = [
    { labelBn: '১ লক্ষ', labelEn: '1 Lakh', value: 100000 },
    { labelBn: '৫ লক্ষ', labelEn: '5 Lakh', value: 500000 },
    { labelBn: '৭.৫ লক্ষ', labelEn: '7.5 Lakh', value: 750000 },
    { labelBn: '১০ লক্ষ', labelEn: '10 Lakh', value: 1000000 },
    { labelBn: '২০ লক্ষ', labelEn: '20 Lakh', value: 2000000 },
    { labelBn: '৩০ লক্ষ', labelEn: '30 Lakh', value: 3000000 },
    { labelBn: '৫০ লক্ষ', labelEn: '50 Lakh', value: 5000000 },
  ];

  onMount(async () => {
    // Read query parameters if available
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('amount')) {
      const parsed = parseLocalizedAmount(searchParams.get('amount') || '');
      if (parsed > 0) {
        numericAmount = parsed;
        rawAmountInput = formatCurrency(parsed, lang, false);
      }
    } else {
      rawAmountInput = '';
      numericAmount = 0;
    }

    if (searchParams.has('pensioner')) {
      isPensioner = searchParams.get('pensioner') === '1' || searchParams.get('pensioner') === 'true';
    }

    if (searchParams.has('date')) {
      const qDate = searchParams.get('date') || '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(qDate)) {
        purchaseDate = qDate;
      }
    }

    if (searchParams.has('sort')) {
      const s = searchParams.get('sort') as SortCriterion;
      if (['net', 'yield', 'income', 'term'].includes(s)) {
        sortBy = s;
      }
    }

    await loadInitialData();
  });

  async function loadInitialData() {
    loading = true;
    error = null;
    try {
      indexManifest = await store.fetchIndex();
      schemesData = await store.fetchSchemes();
      taxData = await store.fetchTax();

      await updateRatePeriodForDate(purchaseDate);
    } catch (err: any) {
      console.error(err);
      error = err.message || (lang === 'bn' ? 'তথ্য লোড করতে ব্যর্থ হয়েছে।' : 'Failed to load savings certificate data.');
    } finally {
      loading = false;
    }
  }

  async function updateRatePeriodForDate(dateStr: string) {
    if (!indexManifest) return;

    const resolution = store.resolvePeriodForDate(dateStr, indexManifest);
    const targetPeriod = resolution.period || resolution.nearest;

    activePeriod = targetPeriod;
    currentRateData = await store.fetchRatePeriod(targetPeriod);

    // Stale check: if today's date is beyond the latest period's effectiveTo
    const today = new Date().toISOString().split('T')[0];
    const latestPeriod = indexManifest.periods[0];
    isRateStale = today > latestPeriod.to;
  }

  function handleAmountInput(e: Event) {
    const inputEl = e.target as HTMLInputElement;
    const value = inputEl.value;
    const parsed = parseLocalizedAmount(value);
    numericAmount = parsed;
    rawAmountInput = value;
    updateUrlParams();
  }

  function applyQuickPick(val: number) {
    numericAmount = val;
    rawAmountInput = formatCurrency(val, lang, false);
    updateUrlParams();
  }

  function handlePensionerToggle() {
    isPensioner = !isPensioner;
    updateUrlParams();
  }

  async function handleDateChange(e: Event) {
    const inputEl = e.target as HTMLInputElement;
    purchaseDate = inputEl.value;
    await updateRatePeriodForDate(purchaseDate);
    updateUrlParams();
  }

  function handleReset() {
    numericAmount = 0;
    rawAmountInput = '';
    isPensioner = false;
    purchaseDate = new Date().toISOString().split('T')[0];
    sortBy = 'net';
    selectedForCompare = [];
    updateRatePeriodForDate(purchaseDate);
    updateUrlParams();
  }

  function toggleCompare(schemeId: string) {
    if (selectedForCompare.includes(schemeId)) {
      selectedForCompare = selectedForCompare.filter((id) => id !== schemeId);
    } else {
      if (selectedForCompare.length >= 4) {
        alert(lang === 'bn' ? 'সর্বোচ্চ ৪ টি স্কিম একসাথে তুলনা করা যায়।' : 'You can compare up to 4 schemes at a time.');
        return;
      }
      selectedForCompare = [...selectedForCompare, schemeId];
    }
  }

  function copyShareLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      showCopiedToast = true;
      setTimeout(() => {
        showCopiedToast = false;
      }, 2500);
    });
  }

  function updateUrlParams() {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (numericAmount > 0) url.searchParams.set('amount', String(numericAmount));
    if (isPensioner) url.searchParams.set('pensioner', '1');
    else url.searchParams.delete('pensioner');
    if (purchaseDate) url.searchParams.set('date', purchaseDate);
    if (sortBy !== 'net') url.searchParams.set('sort', sortBy);
    else url.searchParams.delete('sort');
    window.history.replaceState({}, '', url.toString());
  }

  // Reactive calculations
  $: results =
    schemesData && currentRateData && taxData && numericAmount > 0
      ? rankSchemes(
          calculateAllSchemes(schemesData.schemes, currentRateData, taxData, {
            amount: numericAmount,
            purchaseDate,
            isPensioner,
          }),
          sortBy
        )
      : [];

  $: eligibleCount = results.filter((r) => r.eligible).length;
  $: selectedCompareResults = results.filter((r) => selectedForCompare.includes(r.schemeId));
  $: wordsHint = formatNumberInWords(numericAmount, lang);
</script>

<div class="max-w-5xl mx-auto space-y-8">
  <!-- Loading State -->
  {#if loading}
    <div class="p-12 text-center rounded-3xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
      <div class="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-4"></div>
      <p class="text-slate-600 dark:text-slate-300 font-semibold text-sm">
        {lang === 'bn' ? 'সঞ্চয়পত্রের সরকারি হার ও তথ্য লোড হচ্ছে...' : 'Loading official savings certificate rates...'}
      </p>
    </div>
  {:else if error}
    <div class="p-8 text-center rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200">
      <div class="text-3xl mb-2">⚠️</div>
      <h3 class="text-lg font-bold mb-2">{error}</h3>
      <button
        type="button"
        on:click={loadInitialData}
        class="mt-3 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-colors shadow-sm"
      >
        {lang === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry'}
      </button>
    </div>
  {:else}
    <!-- Freshness & Stale Rate Banner -->
    <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-xs backdrop-blur-md text-xs sm:text-sm">
      <div class="flex items-center gap-2 text-slate-700 dark:text-slate-200">
        <span class="flex h-2 w-2 relative">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span class="font-bold">
          {lang === 'bn' ? 'কার্যকর সময়কাল:' : 'Effective Period:'}
        </span>
        <span class="font-semibold text-slate-900 dark:text-white">
          {activePeriod?.label?.[lang] || activePeriod?.label?.bn || `${activePeriod?.from} – ${activePeriod?.to}`}
        </span>
      </div>

      <div class="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-xs">
        <div>
          {lang === 'bn' ? 'যাচাইকৃত: ' : 'Verified: '}
          <span class="font-mono">{activePeriod ? toBanglaDigits(activePeriod.to.substring(0, 7)) : '2026-10'}</span>
        </div>
        <span>·</span>
        <button
          type="button"
          on:click={copyShareLink}
          class="font-semibold text-primary-start dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>🔗</span>
          <span>{lang === 'bn' ? 'লিংক শেয়ার' : 'Share Link'}</span>
        </button>
      </div>
    </div>

    {#if isRateStale}
      <div class="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs sm:text-sm flex items-center gap-2">
        <span>📢</span>
        <span>
          {lang === 'bn'
            ? 'নতুন মেয়াদের প্রজ্ঞাপন জারি হয়ে থাকতে পারে — চূড়ান্ত নিশ্চিতের জন্য সরকারি গেজেট বা সংশ্লিষ্ট ব্যাংক শাখা থেকে যাচাই করে নিন।'
            : 'A newer rate cycle may have been announced by the government — please cross-check with official circulars.'}
        </span>
      </div>
    {/if}

    <!-- Copied Share Toast -->
    {#if showCopiedToast}
      <div class="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs sm:text-sm shadow-xl flex items-center gap-2 animate-bounce">
        <span>✅</span>
        <span>{lang === 'bn' ? 'লিংক ক্লিপবোর্ডে কপি হয়েছে!' : 'Shareable link copied to clipboard!'}</span>
      </div>
    {/if}

    <!-- Input Panel Hero Card -->
    <div class="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 shadow-md backdrop-blur-md space-y-6">
      <!-- Amount Input Block -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label for="sc-amount" class="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <span>💰</span>
            <span>{lang === 'bn' ? 'বিনিয়োগের পরিমাণ (টাকা)' : 'Investment Amount (BDT)'}</span>
          </label>
          {#if wordsHint}
            <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {wordsHint}
            </span>
          {/if}
        </div>

        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none text-xl sm:text-2xl font-bold text-slate-400">
            ৳
          </div>
          <input
            id="sc-amount"
            type="text"
            inputmode="numeric"
            value={rawAmountInput}
            on:input={handleAmountInput}
            placeholder={lang === 'bn' ? 'যেমন: ৫,০০,০০০' : 'e.g. 500,000'}
            class="w-full pl-10 sm:pl-12 pr-4 py-3.5 sm:py-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white outline-none transition-all"
          />
        </div>
      </div>

      <!-- Quick-Pick Amount Chips -->
      <div class="space-y-1.5">
        <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {lang === 'bn' ? 'দ্রুত নির্বাচন করুন' : 'Quick Presets'}
        </div>
        <div class="flex flex-wrap items-center gap-2">
          {#each quickPicks as pick}
            <button
              type="button"
              on:click={() => applyQuickPick(pick.value)}
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all {numericAmount === pick.value
                ? 'bg-emerald-600 text-white shadow-xs scale-105'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}"
            >
              {lang === 'bn' ? pick.labelBn : pick.labelEn}
            </button>
          {/each}
        </div>
      </div>

      <!-- Pensioner & Advanced Options Bar -->
      <div class="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-4">
        <!-- Pensioner Toggle Button -->
        <label class="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isPensioner}
            on:change={handlePensionerToggle}
            class="sr-only peer"
          />
          <div class="relative w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          <div>
            <div class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
              {lang === 'bn' ? 'আমি একজন পেনশনার' : 'I am a Pensioner'}
            </div>
            <div class="text-[11px] text-slate-500">
              {lang === 'bn' ? 'পেনশনার সঞ্চয়পত্র এবং ৫ লক্ষ টাকা পর্যন্ত কর ছাড় প্রযোজ্য' : 'Enables Pensioner scheme & tax exemption up to Tk 5 Lakh'}
            </div>
          </div>
        </label>

        <!-- Right Side: Advanced Toggle & Reset -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            on:click={() => showAdvanced = !showAdvanced}
            class="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <span>⚙️</span>
            <span>{lang === 'bn' ? 'ক্রয়ের তারিখ' : 'Purchase Date'}</span>
            <span class="text-[10px] transition-transform {showAdvanced ? 'rotate-180' : ''}">▼</span>
          </button>

          <button
            type="button"
            on:click={handleReset}
            class="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-xs font-semibold text-slate-600 dark:text-slate-400 transition-colors"
          >
            {lang === 'bn' ? 'রিসেট' : 'Reset'}
          </button>
        </div>
      </div>

      <!-- Advanced Purchase Date Picker (Collapsible) -->
      {#if showAdvanced}
        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 space-y-3 animate-fadeIn">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <label for="sc-purchase-date" class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {lang === 'bn' ? 'সঞ্চয়পত্র ক্রয়ের তারিখ নির্বাচন করুন' : 'Select Certificate Purchase Date'}
              </label>
              <p class="text-[11px] text-slate-500">
                {lang === 'bn'
                  ? 'ক্রয়ের তারিখে যে সুদের হার বহাল ছিল, পূর্ণ মেয়াদে সেই হারেই মুনাফা প্রদান করা হয়।'
                  : 'Certificates retain the rate in effect on their purchase date for their entire duration.'}
              </p>
            </div>
            <input
              id="sc-purchase-date"
              type="date"
              value={purchaseDate}
              on:change={handleDateChange}
              class="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      {/if}
    </div>

    {#if numericAmount <= 0}
      <div class="p-8 sm:p-12 text-center rounded-3xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 shadow-xs backdrop-blur-md">
        <div class="text-4xl sm:text-5xl mb-3">💰</div>
        <h3 class="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
          {lang === 'bn' ? 'বিনিয়োগের পরিমাণ লিখুন বা উপরের প্রেসেট নির্বাচন করুন' : 'Enter an investment amount or pick a preset above'}
        </h3>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {lang === 'bn'
            ? 'টাকার পরিমাণ লিখলেই সকল সঞ্চয়পত্রের মাসিক বা বার্ষিক লাভ, উৎসে কর এবং মেয়াদপূর্তির মোট প্রাপ্তির হিসাব তাৎক্ষণিকভাবে দেখতে পাবেন।'
            : 'Enter an amount to instantly see ranked profit cards, monthly/quarterly payouts, TDS tax, and early encashment values.'}
        </p>
      </div>
    {:else}
      <!-- Sorting Chips & Filter Bar -->
      <div class="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1">
            {lang === 'bn' ? 'সাজান:' : 'Sort By:'}
          </span>

          <button
            type="button"
            on:click={() => { sortBy = 'net'; updateUrlParams(); }}
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all {sortBy === 'net'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}"
          >
            {lang === 'bn' ? 'সর্বোচ্চ নিট লাভ' : 'Highest Net Return'}
          </button>

          <button
            type="button"
            on:click={() => { sortBy = 'yield'; updateUrlParams(); }}
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all {sortBy === 'yield'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}"
          >
            {lang === 'bn' ? 'সর্বোচ্চ বার্ষিক রিটার্ন' : 'Highest Yield'}
          </button>

          <button
            type="button"
            on:click={() => { sortBy = 'income'; updateUrlParams(); }}
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all {sortBy === 'income'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}"
          >
            {lang === 'bn' ? 'নিয়মিত সর্বোচ্চ কিস্তি' : 'Highest Regular Payout'}
          </button>

          <button
            type="button"
            on:click={() => { sortBy = 'term'; updateUrlParams(); }}
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all {sortBy === 'term'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}"
          >
            {lang === 'bn' ? 'স্বল্প মেয়াদী' : 'Shortest Term'}
          </button>
        </div>

        <!-- Compare Mode Trigger Pill -->
        {#if selectedForCompare.length >= 2}
          <button
            type="button"
            on:click={() => isCompareModalOpen = true}
            class="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 animate-pulse"
          >
            <span>⚖️</span>
            <span>{lang === 'bn' ? `${toBanglaDigits(selectedForCompare.length)} টি তুলনা দেখুন` : `Compare ${selectedForCompare.length} Schemes`}</span>
          </button>
        {/if}
      </div>

      <!-- Ranked Scheme Cards -->
      <div class="space-y-6">
        {#each results as res, idx (res.schemeId)}
          <SchemeCard
            result={res}
            {lang}
            rankIndex={idx}
            totalEligible={eligibleCount}
            isSelectedForCompare={selectedForCompare.includes(res.schemeId)}
            onToggleCompare={toggleCompare}
          />
        {/each}
      </div>
    {/if}

    <!-- Compare Modal View -->
    {#if isCompareModalOpen}
      <CompareModal
        selectedSchemes={selectedCompareResults}
        {lang}
        onClose={() => isCompareModalOpen = false}
      />
    {/if}

    <!-- FAQ Accordion -->
    <Faq {lang} />

    <!-- Official Disclaimer & Links -->
    <Disclaimer
      lastVerified={currentRateData?.meta?.lastVerified || '2026-10-19'}
      {lang}
    />
  {/if}
</div>
