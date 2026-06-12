<script lang="ts">
  import { fmt, handleLocalizedInput } from '../utils/numbers';

  export let lang: 'bn' | 'en' = 'en';

  const dict = {
    bn: {
      cardTitle: 'ইএমআই (EMI) ক্যালকুলেটর',
      amount: 'লোনের পরিমাণ (৳)',
      rate: 'বার্ষিক সুদের হার (%)',
      tenure: 'লোনের মেয়াদ (মাস)',
      monthly: 'মাসিক ইএমআই',
      totalPayment: 'মোট পেমেন্ট',
      totalInterest: 'মোট সুদ',
      showTable: 'অ্যামর্টাইজেশন টেবিল দেখুন',
      hideTable: 'অ্যামর্টাইজেশন টেবিল লুকান',
      month: 'মাস',
      opening: 'প্রারম্ভিক ব্যালেন্স',
      emi: 'ইএমআই',
      principal: 'আসল',
      interest: 'সুদ',
      closing: 'চূড়ান্ত ব্যালেন্স',
    },
    en: {
      cardTitle: 'EMI Calculator',
      amount: 'Loan Amount (৳)',
      rate: 'Annual Interest Rate (%)',
      tenure: 'Loan Tenure (Months)',
      monthly: 'Monthly EMI',
      totalPayment: 'Total Payment',
      totalInterest: 'Total Interest',
      showTable: 'Show Amortization Table',
      hideTable: 'Hide Amortization Table',
      month: 'Month',
      opening: 'Opening Balance',
      emi: 'EMI',
      principal: 'Principal',
      interest: 'Interest',
      closing: 'Closing Balance',
    }
  };

  $: t = dict[lang];

  let amountStr = '500000';
  let rateStr = '9';
  let tenureStr = '12';

  let showTable = false;

  $: amount = parseFloat(amountStr) || 0;
  $: rate = parseFloat(rateStr) || 0;
  $: tenure = parseFloat(tenureStr) || 0;

  $: results = calculateEMI(amount, rate, tenure);

  function calculateEMI(p: number, r: number, n: number) {
    if (p <= 0 || r < 0 || n <= 0) return null;
    
    let emi = 0;
    let totalPayment = 0;
    let totalInterest = 0;
    let schedule = [];

    if (r === 0) {
      emi = p / n;
      totalPayment = p;
      totalInterest = 0;
      let balance = p;
      for (let i = 1; i <= n; i++) {
        let principalPaid = emi;
        if (balance < principalPaid) principalPaid = balance;
        let closing = balance - principalPaid;
        schedule.push({ month: i, opening: balance, emi, principal: principalPaid, interest: 0, closing: Math.abs(closing) });
        balance = closing;
      }
    } else {
      let monthlyRate = r / 12 / 100;
      emi = p * monthlyRate * Math.pow(1 + monthlyRate, n) / (Math.pow(1 + monthlyRate, n) - 1);
      totalPayment = emi * n;
      totalInterest = totalPayment - p;
      
      let balance = p;
      for (let i = 1; i <= n; i++) {
        let interestPaid = balance * monthlyRate;
        let principalPaid = emi - interestPaid;
        let closing = balance - principalPaid;
        if (closing < 0) closing = 0;
        schedule.push({ month: i, opening: balance, emi, principal: principalPaid, interest: interestPaid, closing: Math.abs(closing) });
        balance = closing;
      }
    }

    return {
      emi,
      totalPayment,
      totalInterest,
      schedule
    };
  }

  function formatCurrency(n: number) {
    let formatted = n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return fmt(formatted, lang);
  }

  function formatNum(n: number | string) {
    return fmt(n.toString(), lang);
  }

  function handleSliderInput(e: Event, setter: (val: string) => void) {
    const el = e.currentTarget as HTMLInputElement;
    setter(el.value);
  }

  function toggleTable() {
    showTable = !showTable;
  }
</script>

<div class="calculator-layout flex flex-col xl:flex-row gap-6 max-w-6xl mx-auto">
  <!-- Input Card -->
  <div class="input-card flex-1 bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg">
    <div class="flex items-start gap-4 mb-8">
      <div class="text-4xl">💰</div>
      <div>
        <h2 class="text-2xl font-bold text-slate-900 dark:text-white m-0">{t.cardTitle}</h2>
      </div>
    </div>

    <!-- Amount Input -->
    <div class="mb-8">
      <div class="flex justify-between items-center mb-3">
        <label for="emi-amount" class="font-semibold text-slate-800 dark:text-slate-200">{t.amount}</label>
      </div>
      <div class="flex gap-4 items-center">
        <div class="flex-1">
          <input type="range" min="10000" max="5000000" step="5000" value={amountStr} on:input={(e) => handleSliderInput(e, v => amountStr = v)} class="w-full accent-blue-600">
        </div>
        <div class="w-1/3">
          <input id="emi-amount" type="text" inputmode="decimal" value={formatNum(amountStr)} on:input={(e) => handleLocalizedInput(e, lang, v => amountStr = v)} class="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-lg font-semibold focus-within:border-blue-500 outline-none transition-all dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-right">
        </div>
      </div>
    </div>

    <!-- Rate Input -->
    <div class="mb-8">
      <div class="flex justify-between items-center mb-3">
        <label for="emi-rate" class="font-semibold text-slate-800 dark:text-slate-200">{t.rate}</label>
      </div>
      <div class="flex gap-4 items-center">
        <div class="flex-1">
          <input type="range" min="1" max="30" step="0.5" value={rateStr} on:input={(e) => handleSliderInput(e, v => rateStr = v)} class="w-full accent-blue-600">
        </div>
        <div class="w-1/3">
          <input id="emi-rate" type="text" inputmode="decimal" value={formatNum(rateStr)} on:input={(e) => handleLocalizedInput(e, lang, v => rateStr = v)} class="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-lg font-semibold focus-within:border-blue-500 outline-none transition-all dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-right">
        </div>
      </div>
    </div>

    <!-- Tenure Input -->
    <div class="mb-8">
      <div class="flex justify-between items-center mb-3">
        <label for="emi-tenure" class="font-semibold text-slate-800 dark:text-slate-200">{t.tenure}</label>
      </div>
      <div class="flex gap-4 items-center">
        <div class="flex-1">
          <input type="range" min="3" max="360" step="1" value={tenureStr} on:input={(e) => handleSliderInput(e, v => tenureStr = v)} class="w-full accent-blue-600">
        </div>
        <div class="w-1/3">
          <input id="emi-tenure" type="text" inputmode="decimal" value={formatNum(tenureStr)} on:input={(e) => handleLocalizedInput(e, lang, v => tenureStr = v)} class="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-lg font-semibold focus-within:border-blue-500 outline-none transition-all dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-right">
        </div>
      </div>
    </div>
  </div>

  <!-- Results Card -->
  <div class="result-card flex-1 bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col justify-center">
    {#if results}
      <div class="text-center mb-10">
        <h3 class="text-lg font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">{t.monthly}</h3>
        <div class="text-6xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
          <span class="text-4xl text-slate-400 mr-2">৳</span><span class="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">{formatCurrency(results.emi)}</span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div class="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-2xl flex flex-col text-center">
          <span class="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-2">{t.totalPayment}</span>
          <span class="text-2xl font-bold text-slate-800 dark:text-slate-200">৳ {formatCurrency(results.totalPayment)}</span>
        </div>
        <div class="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-2xl flex flex-col text-center">
          <span class="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-2">{t.totalInterest}</span>
          <span class="text-2xl font-bold text-amber-600 dark:text-amber-400">৳ {formatCurrency(results.totalInterest)}</span>
        </div>
      </div>

      <div class="text-center">
        <button class="px-6 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all w-full" on:click={toggleTable}>
          {showTable ? t.hideTable : t.showTable}
        </button>
      </div>
    {:else}
      <div class="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
        <p class="text-lg font-semibold">Please enter valid values</p>
      </div>
    {/if}
  </div>
</div>

{#if results && showTable}
  <div class="max-w-6xl mx-auto mt-8 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg overflow-x-auto transition-all duration-500">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="border-b-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm">
          <th class="py-4 px-4 font-bold">{t.month}</th>
          <th class="py-4 px-4 font-bold text-right">{t.opening}</th>
          <th class="py-4 px-4 font-bold text-right">{t.emi}</th>
          <th class="py-4 px-4 font-bold text-right text-emerald-600 dark:text-emerald-400">{t.principal}</th>
          <th class="py-4 px-4 font-bold text-right text-amber-600 dark:text-amber-400">{t.interest}</th>
          <th class="py-4 px-4 font-bold text-right">{t.closing}</th>
        </tr>
      </thead>
      <tbody class="text-slate-800 dark:text-slate-200 text-sm md:text-base font-medium">
        {#each results.schedule as row}
          <tr class="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
            <td class="py-3 px-4 text-slate-500 dark:text-slate-400 font-bold">{formatNum(row.month)}</td>
            <td class="py-3 px-4 text-right">৳ {formatCurrency(row.opening)}</td>
            <td class="py-3 px-4 text-right">৳ {formatCurrency(row.emi)}</td>
            <td class="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">৳ {formatCurrency(row.principal)}</td>
            <td class="py-3 px-4 text-right text-amber-600 dark:text-amber-400">৳ {formatCurrency(row.interest)}</td>
            <td class="py-3 px-4 text-right font-bold">৳ {formatCurrency(row.closing)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
