<script>
  import { onMount } from 'svelte';
  import { DrawStore } from '../../lib/prize-bond/draw-store';
  import { parseTextInput, expandRange, englishToBanglaDigits } from '../../lib/prize-bond/parse-input';
  import { parseExcelOrCsvFile, downloadSampleTemplate } from '../../lib/prize-bond/parse-excel';
  import { checkBonds } from '../../lib/prize-bond/matcher';
  import { generateWinnersPdf } from '../../lib/prize-bond/export-pdf';

  import InputPanel from './InputPanel.svelte';
  import ResultSummary from './ResultSummary.svelte';
  import WinnerCard from './WinnerCard.svelte';
  import NextSteps from './NextSteps.svelte';
  import Disclaimer from './Disclaimer.svelte';
  import Faq from './Faq.svelte';

  export let lang = 'bn';

  const store = new DrawStore();

  let loadingData = true;
  let loadError = null;
  let manifest = null;
  let rules = null;
  let draws = [];
  let selectedDrawIds = [];
  let showDrawsExpanded = false;

  // Input states
  let activeTab = 'text'; // 'text' | 'range' | 'file'
  let rawTextInput = '';
  let rangeFrom = '';
  let rangeTo = '';
  let excelLoading = false;
  let excelStats = null;
  let fileInputRef;
  let isDraggingOver = false;

  // Staged combined bond numbers
  let validNumbersSet = new Set();
  let ignoredList = [];
  let duplicateCount = 0;

  let isChecking = false;
  let isGeneratingPdf = false;
  let matchResult = null;
  let hasChecked = false;
  let copyNotification = false;

  onMount(async () => {
    await initData();
  });

  async function initData() {
    loadingData = true;
    loadError = null;
    try {
      manifest = await store.fetchManifest();
      rules = await store.fetchRules();
      draws = manifest.draws || [];

      // Automatically select all active claimable draws within the official 2-year window
      const today = new Date().toISOString().split('T')[0];
      const claimable = draws
        .filter((d) => !d.claimableUntil || d.claimableUntil >= today)
        .map((d) => d.id);

      // Default to all claimable (or latest draw if none found)
      selectedDrawIds = claimable.length > 0 ? claimable : (draws[0] ? [draws[0].id] : []);

      // Preload the draws into memory
      await store.loadSelectedDraws(selectedDrawIds);
    } catch (err) {
      console.error(err);
      loadError = err.message || 'Failed to load draw data.';
    } finally {
      loadingData = false;
    }
  }

  function handleTextInputChange() {
    const res = parseTextInput(rawTextInput);
    validNumbersSet = new Set(res.validNumbers);
    ignoredList = res.ignoredEntries;
    duplicateCount = res.duplicateCount;
    hasChecked = false;
    matchResult = null;
  }

  function insertSampleNumbers() {
    const samples = ['0806964', '0144370', '0307973', '0657980', '0925766'];
    rawTextInput = samples.join('\n');
    handleTextInputChange();
  }

  function addRangeToNumbers(shouldCheckImmediately = false) {
    const res = expandRange(rangeFrom, rangeTo);
    if (res.error) {
      alert(res.error);
      return;
    }
    const current = Array.from(validNumbersSet);
    for (const num of res.numbers) {
      validNumbersSet.add(num);
    }
    duplicateCount += (current.length + res.numbers.length) - validNumbersSet.size;
    validNumbersSet = new Set(validNumbersSet);
    rangeFrom = '';
    rangeTo = '';
    hasChecked = false;
    matchResult = null;

    if (shouldCheckImmediately) {
      runCheck();
    }
  }

  function handleDirectRangeCheck() {
    if (rangeFrom && rangeTo) {
      addRangeToNumbers(true);
    } else if (validNumbersSet.size > 0) {
      runCheck();
    }
  }

  async function processUploadedFile(file) {
    if (!file) return;

    excelLoading = true;
    try {
      const res = await parseExcelOrCsvFile(file);
      if (res.error) {
        alert(res.error);
        return;
      }
      excelStats = res;
      for (const num of res.numbers) {
        validNumbersSet.add(num);
      }
      validNumbersSet = new Set(validNumbersSet);
      duplicateCount += res.duplicateCount;

      // Auto-check immediately as requested!
      if (validNumbersSet.size > 0) {
        runCheck();
        setTimeout(() => {
          const resultsEl = document.getElementById('results-section');
          if (resultsEl) {
            resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      }
    } finally {
      excelLoading = false;
      if (fileInputRef) fileInputRef.value = '';
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  }

  function handleFileDrop(e) {
    e.preventDefault();
    isDraggingOver = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    isDraggingOver = true;
  }

  function handleDragLeave(e) {
    e.preventDefault();
    isDraggingOver = false;
  }

  function clearAll() {
    rawTextInput = '';
    rangeFrom = '';
    rangeTo = '';
    validNumbersSet.clear();
    validNumbersSet = new Set();
    ignoredList = [];
    duplicateCount = 0;
    excelStats = null;
    matchResult = null;
    hasChecked = false;
  }

  $: topPrizeTier = matchResult && matchResult.matches.length > 0
    ? Math.min(...matchResult.matches.flatMap((m) => m.wins.map((w) => w.tier)))
    : null;

  function runCheck() {
    // If user is currently in the Range tab and typed a range without clicking add
    if (activeTab === 'range' && rangeFrom && rangeTo) {
      const res = expandRange(rangeFrom, rangeTo);
      if (res.error) {
        alert(res.error);
        return;
      }
      for (const num of res.numbers) {
        validNumbersSet.add(num);
      }
      validNumbersSet = new Set(validNumbersSet);
      rangeFrom = '';
      rangeTo = '';
    }

    if (validNumbersSet.size === 0) return;
    isChecking = true;

    try {
      store.rebuildIndex(selectedDrawIds);
      const numbersList = Array.from(validNumbersSet);
      matchResult = checkBonds(numbersList, store.getIndex());
      hasChecked = true;
    } finally {
      isChecking = false;
    }
  }

  function copyWinners() {
    if (!matchResult || matchResult.matches.length === 0) return;
    const text = matchResult.matches
      .map((m) => `${m.bondNumber} - ৳${m.totalPrize}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    copyNotification = true;
    setTimeout(() => {
      copyNotification = false;
    }, 2500);
  }
</script>

<div class="max-w-4xl mx-auto space-y-6">
  <!-- Loading or Error Notification -->
  {#if loadingData && !draws.length}
    <div class="p-8 rounded-3xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-white/10 text-center animate-pulse">
      <div class="text-4xl mb-3">⏳</div>
      <div class="font-bold text-lg text-slate-800 dark:text-white">
        {lang === 'bn' ? 'অফিসিয়াল ড্র ফলাফল লোড হচ্ছে...' : 'Loading official draw results...'}
      </div>
      <p class="text-xs text-slate-500 mt-1">
        {lang === 'bn' ? 'বাংলাদেশ ব্যাংকের ডাটাবেজ ইন-মেমোরিতে প্রিপেয়ার করা হচ্ছে' : 'Preparing in-memory index'}
      </p>
    </div>
  {:else if loadError}
    <div class="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-center">
      <div class="text-2xl mb-1">⚠️</div>
      <div class="font-bold">{lang === 'bn' ? 'তথ্য লোড করা সম্ভব হয়নি' : 'Failed to load draw data'}</div>
      <p class="text-xs mt-1 opacity-90">{loadError}</p>
      <button
        type="button"
        on:click={initData}
        class="mt-3 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition"
      >
        {lang === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry'}
      </button>
    </div>
  {/if}

  {#if draws.length > 0}
    <!-- Centered Latest Draw Header with Expandable 8-Draw Grid -->
    <div class="flex flex-col items-center justify-center space-y-3">
      <button
        type="button"
        on:click={() => (showDrawsExpanded = !showDrawsExpanded)}
        class="group inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-5 py-2.5 rounded-full bg-white/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-white/10 shadow-sm hover:shadow-md backdrop-blur-md transition-all active:scale-[0.99] cursor-pointer"
      >
        <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-black shadow-sm">
          ✓
        </span>
        <span class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
          {lang === 'bn'
            ? `সর্বশেষ ড্র: ${englishToBanglaDigits(draws[0]?.drawNumber || '')}তম`
            : `Latest Draw: #${draws[0]?.drawNumber || ''}`}
        </span>
        {#if draws[0]?.date}
          <span class="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-300">
            {lang === 'bn' ? `তারিখ: ${englishToBanglaDigits(draws[0].date)}` : `Date: ${draws[0].date}`}
          </span>
        {/if}
        <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-primary-start group-hover:text-white transition-all transform {showDrawsExpanded ? 'rotate-180' : ''} text-xs font-bold ml-1">
          ▼
        </span>
      </button>

      <!-- Expandable 8-Draws Grid (2 rows x 4 chips) -->
      {#if showDrawsExpanded}
        <div class="w-full max-w-2xl p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-white/10 shadow-inner backdrop-blur-md space-y-3 animate-fadeIn">
          <div class="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 text-center">
            {lang === 'bn'
              ? 'সরকারি নিয়মানুযায়ী বিগত ২ বছরের ড্র-সমূহ বিবেচিত হবে'
              : 'Draws of the last 2 years considered under official rules:'}
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {#each draws.slice(0, 8) as draw}
              <div class="flex flex-col items-center justify-center py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                <span class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'bn' ? `[${englishToBanglaDigits(draw.drawNumber)}তম]` : `[Draw #${draw.drawNumber}]`}
                </span>
                {#if draw.date}
                  <span class="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {lang === 'bn' ? englishToBanglaDigits(draw.date) : draw.date}
                  </span>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Input Tabs Island -->
    <div class="p-6 rounded-3xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-lg space-y-5">
      <InputPanel
        {activeTab}
        {lang}
        onTabChange={(tab) => (activeTab = tab)}
      />

      <!-- Tab 1: Textarea -->
      {#if activeTab === 'text'}
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label for="bond-text-input" class="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              {lang === 'bn' ? 'প্রাইজবন্ড নম্বরসমূহ প্রবেশ করান' : 'Enter Prize Bond Numbers'}
            </label>
            <button
              type="button"
              on:click={insertSampleNumbers}
              class="text-xs text-primary-start dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
            >
              <span>✨</span>
              <span>{lang === 'bn' ? 'নমুনা নম্বর দিয়ে পরীক্ষা করুন' : 'Try sample numbers'}</span>
            </button>
          </div>
          <textarea
            id="bond-text-input"
            bind:value={rawTextInput}
            on:input={handleTextInputChange}
            rows="5"
            placeholder={lang === 'bn' ? 'উদাহরণ: ০৮০৬৯৬৪, ০১৪৪৩৭০, ০৩০৭৯৭৩ অথবা স্পেস/কমা দিয়ে একাধিক নম্বর লিখুন...' : 'e.g. 0806964, 0144370, 0307973 (separated by space, comma, or newline)...'}
            class="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary-start outline-none transition"
          ></textarea>
        </div>
      {/if}

      <!-- Tab 2: Range -->
      {#if activeTab === 'range'}
        <div class="space-y-4">
          <div class="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'bn' ? 'ক্রমিক নম্বরের সিরিজ বা রেঞ্জ তৈরি করুন (যেমন: ০০০১০০০ হতে ০০০১২০০ পর্যন্ত)' : 'Enter sequential start and end numbers (e.g. 0001000 to 0001200):'}
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="range-from" class="block text-xs font-bold text-slate-500 mb-1">
                {lang === 'bn' ? 'শুরুর নম্বর (From)' : 'Start Number (From)'}
              </label>
              <input
                id="range-from"
                type="text"
                bind:value={rangeFrom}
                placeholder="0001000"
                class="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary-start outline-none"
              />
            </div>
            <div>
              <label for="range-to" class="block text-xs font-bold text-slate-500 mb-1">
                {lang === 'bn' ? 'শেষের নম্বর (To)' : 'End Number (To)'}
              </label>
              <input
                id="range-to"
                type="text"
                bind:value={rangeTo}
                placeholder="0001200"
                class="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary-start outline-none"
              />
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              on:click={() => addRangeToNumbers(false)}
              disabled={!rangeFrom || !rangeTo}
              class="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {lang === 'bn' ? 'তালিকার সাথে যোগ করুন +' : 'Add Range to List +'}
            </button>
            <button
              type="button"
              on:click={handleDirectRangeCheck}
              disabled={(!rangeFrom || !rangeTo) && validNumbersSet.size === 0}
              class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-start to-primary-end text-white text-xs font-bold hover:opacity-95 shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <span>🔍</span>
              <span>{lang === 'bn' ? 'সরাসরি এই রেঞ্জ যাচাই করুন' : 'Check This Range Directly'}</span>
            </button>
          </div>
        </div>
      {/if}

      <!-- Tab 3: Excel Upload -->
      {#if activeTab === 'file'}
        <div class="space-y-4">
          <div
            on:dragover={handleDragOver}
            on:dragleave={handleDragLeave}
            on:drop={handleFileDrop}
            class="relative border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-200 {isDraggingOver
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 hover:border-primary-start bg-slate-50/50 dark:bg-slate-900/30'}"
          >
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              bind:this={fileInputRef}
              on:change={handleFileUpload}
              class="hidden"
              id="excel-file-input"
            />
            <label for="excel-file-input" class="cursor-pointer block space-y-2.5">
              {#if excelLoading}
                <div class="text-4xl animate-spin">⏳</div>
                <div class="font-bold text-slate-800 dark:text-white text-base">
                  {lang === 'bn' ? 'ফাইলটি স্ক্যান ও স্বয়ংক্রিয়ভাবে যাচাই করা হচ্ছে...' : 'Scanning & Auto-Checking File...'}
                </div>
                <p class="text-xs text-slate-500">
                  {lang === 'bn' ? 'অনুগ্রহ করে অপেক্ষা করুন, ফলাফল প্রস্তুত হচ্ছে' : 'Please wait, checking winning numbers...'}
                </p>
              {:else}
                <div class="text-5xl transform transition-transform group-hover:scale-110">
                  {isDraggingOver ? '📥' : '📊'}
                </div>
                <div class="font-bold text-slate-800 dark:text-white text-base">
                  {lang === 'bn' ? 'এক্সেল (.xlsx, .xls) বা .csv ফাইল এখানে ড্রপ করুন অথবা নির্বাচন করুন' : 'Drop Excel (.xlsx, .xls) / CSV here or browse'}
                </div>
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  <span>⚡</span>
                  <span>{lang === 'bn' ? 'ফাইল আপলোড করলেই সরাসরি স্বয়ংক্রিয়ভাবে ফলাফল প্রদর্শিত হবে' : 'Automatically checks numbers right upon upload'}</span>
                </div>
                <p class="text-xs text-slate-400 mt-1">
                  {lang === 'bn' ? '১০০% নিরাপদ ও গোপনীয় — ফাইলটি সম্পূর্ণ আপনার ব্রাউজারে প্রক্রিয়াজাত হয়।' : '100% private — your file is processed entirely inside your browser.'}
                </p>
              {/if}
            </label>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
            <button
              type="button"
              on:click={downloadSampleTemplate}
              class="text-primary-start dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
            >
              <span>📥</span>
              <span>{lang === 'bn' ? 'নমুনা এক্সেল টেমপ্লেট ডাউনলোড করুন' : 'Download sample template'}</span>
            </button>

            {#if excelStats}
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/20">
                <span>✓</span>
                <span>
                  {lang === 'bn'
                    ? `মোট ${englishToBanglaDigits(excelStats.numbers.length)}টি প্রাইজবন্ড স্বয়ংক্রিয়ভাবে যাচাই করা হয়েছে`
                    : `Auto-checked ${excelStats.numbers.length} numbers successfully`}
                </span>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Summary Counts & Actions -->
      <div class="pt-4 border-t border-slate-100 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3 text-xs">
          <span class="font-bold text-slate-800 dark:text-white px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700">
            {lang === 'bn' ? `যাচাইয়ের জন্য প্রস্তুত: ${englishToBanglaDigits(validNumbersSet.size)}` : `Ready to check: ${validNumbersSet.size}`}
          </span>
          {#if duplicateCount > 0}
            <span class="text-slate-400">
              ({lang === 'bn' ? `${englishToBanglaDigits(duplicateCount)}টি ডুপ্লিকেট বাদ` : `${duplicateCount} dupes removed`})
            </span>
          {/if}
        </div>

        <div class="flex items-center gap-2">
          {#if validNumbersSet.size > 0 || rangeFrom || rangeTo}
            <button
              type="button"
              on:click={clearAll}
              class="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              {lang === 'bn' ? 'সব মুছুন' : 'Clear All'}
            </button>
          {/if}

          <button
            type="button"
            on:click={runCheck}
            disabled={(validNumbersSet.size === 0 && !(activeTab === 'range' && rangeFrom && rangeTo)) || isChecking}
            class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-start to-primary-end hover:opacity-95 text-white text-sm font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95 flex items-center gap-2"
          >
            <span>{isChecking ? '⏳' : '🔍'}</span>
            <span>{lang === 'bn' ? 'ফলাফল যাচাই করুন' : 'Check Results'}</span>
          </button>
        </div>
      </div>

      <!-- Collapsible Ignored List -->
      {#if ignoredList.length > 0}
        <details class="text-xs text-amber-600 dark:text-amber-400 pt-2">
          <summary class="cursor-pointer font-semibold">
            {lang === 'bn' ? `অকার্যকর এন্ট্রি (${englishToBanglaDigits(ignoredList.length)}টি) দেখুন` : `View ${ignoredList.length} ignored entries`}
          </summary>
          <div class="mt-2 p-3 bg-amber-500/10 rounded-xl space-y-1 max-h-32 overflow-y-auto">
            {#each ignoredList as item}
              <div class="flex justify-between font-mono">
                <span>"{item.raw}"</span>
                <span class="opacity-75">{item.reason}</span>
              </div>
            {/each}
          </div>
        </details>
      {/if}
    </div>

    <!-- Match Results Presentation -->
    {#if hasChecked && matchResult}
      <div id="results-section" class="scroll-mt-24 space-y-6">
        {#if matchResult.totalWinnersCount > 0}
          <!-- 1. Celebratory Banner BEFORE the summary stats -->
          <div class="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-blue-500/20 border border-emerald-500/30 text-center space-y-2">
            <div class="text-4xl animate-bounce">🎊</div>
            <h3 class="text-2xl font-black text-slate-900 dark:text-white">
              {lang === 'bn' ? 'অভিনন্দন! আপনার প্রাইজবন্ড পুরস্কৃত হয়েছে!' : 'Congratulations! You Have Winning Prize Bonds!'}
            </h3>
            <p class="text-sm text-slate-600 dark:text-slate-300">
              {lang === 'bn' ? `মোট ${englishToBanglaDigits(matchResult.totalWinnersCount)}টি বন্ডে পুরস্কার মিলেছে। বিস্তারিত নিচে দেখুন:` : `Found matches on ${matchResult.totalWinnersCount} bond(s). Details below:`}
            </p>

            <div class="flex flex-wrap justify-center gap-3 pt-3">
              <button
                type="button"
                disabled={isGeneratingPdf}
                on:click={async () => {
                  if (isGeneratingPdf) return;
                  isGeneratingPdf = true;
                  try {
                    await generateWinnersPdf(matchResult.matches, rules, lang);
                  } catch (e) {
                    console.error('PDF generation error:', e);
                  } finally {
                    isGeneratingPdf = false;
                  }
                }}
                class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-start to-primary-end text-white text-xs md:text-sm font-bold shadow-lg hover:opacity-95 transition active:scale-95 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {#if isGeneratingPdf}
                  <span class="animate-spin text-sm">⏳</span>
                  <span>{lang === 'bn' ? 'পিডিএফ তৈরি হচ্ছে...' : 'Generating PDF...'}</span>
                {:else}
                  <span>📄</span>
                  <span>{lang === 'bn' ? 'ফলাফল ডাউনলোড করুন (PDF)' : 'Download Results (PDF)'}</span>
                {/if}
              </button>
            </div>
          </div>
        {/if}

        <!-- 2. Clean 4-stat Summary Cards -->
        <ResultSummary
          totalChecked={matchResult.totalChecked}
          winnersCount={matchResult.totalWinnersCount}
          totalPrize={matchResult.totalPrizeAmount}
          {topPrizeTier}
          {lang}
        />

        {#if matchResult.totalWinnersCount > 0}
          <!-- Winners List -->
          <div class="space-y-4">
            {#each matchResult.matches as match}
              <WinnerCard {match} {lang} />
            {/each}
          </div>

          <!-- Next Steps Guidance -->
          <NextSteps {rules} {lang} />
        {:else}
          <!-- No Winners Friendly State -->
          <div class="p-10 rounded-3xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-white/10 text-center space-y-3">
            <div class="text-4xl text-slate-400">🔍</div>
            <h3 class="text-xl font-bold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'নির্বাচিত ড্রগুলোতে কোনো বিজয়ী নম্বর পাওয়া যায়নি' : 'No Winning Numbers Found in Selected Draws'}
            </h3>
            <p class="text-sm text-slate-500 max-w-md mx-auto">
              {lang === 'bn'
                ? `আপনার মোট ${englishToBanglaDigits(matchResult.totalChecked)}টি প্রাইজবন্ড নম্বর নির্বাচিত ${englishToBanglaDigits(selectedDrawIds.length)}টি ড্রয়ের বিরুদ্ধে নির্ভুলভাবে মিলিয়ে দেখা হয়েছে। প্রাইজবন্ডগুলো নিরাপদে রাখুন, পরবর্তী ড্রয়ে আবার মিলতে পারে!`
                : `Checked ${matchResult.totalChecked} bond(s) against ${selectedDrawIds.length} draw(s). Keep your physical bonds safe for upcoming draws!`}
            </p>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Disclaimer & Notice -->
    <Disclaimer {rules} generatedAt={manifest?.generatedAt} {lang} />

    <!-- FAQ Section -->
    <Faq {lang} />
  {/if}
</div>
