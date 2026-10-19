<script lang="ts">
  import type { SchemeResult } from '../../lib/savings-certificate/types';
  import {
    formatCurrency,
    formatPercent,
    toBanglaDigits,
  } from '../../lib/savings-certificate/formatters';

  export let result: SchemeResult;
  export let lang: 'bn' | 'en' = 'bn';
  export let isSelectedForCompare: boolean = false;
  export let onToggleCompare: (schemeId: string) => void = () => {};
  export let rankIndex: number = 0;
  export let totalEligible: number = 0;

  let isDetailsOpen = false;

  $: scheme = result.scheme;
  $: isEligible = result.eligible;
  $: name = scheme.name[lang] || scheme.name.bn;
  $: shortDesc = scheme.shortDescription?.[lang] || scheme.shortDescription?.bn || '';

  // Badges logic
  $: isBestNet = isEligible && rankIndex === 0;
  $: isMonthlyIncome = scheme.payoutType === 'monthly';
  $: isQuarterlyIncome = scheme.payoutType === 'quarterly';
  $: isAtMaturity = scheme.payoutType === 'at_maturity';

  function toggleDetails() {
    isDetailsOpen = !isDetailsOpen;
  }
</script>

<div
  class="group relative rounded-3xl transition-all duration-300 backdrop-blur-md border {isEligible
    ? isBestNet
      ? 'bg-white/95 dark:bg-slate-800/90 border-emerald-500/40 dark:border-emerald-500/30 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20'
      : 'bg-white/80 dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600'
    : 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75'}"
>
  <!-- Card Header -->
  <div class="p-6 sm:p-7 border-b border-slate-100 dark:border-slate-700/50">
    <div class="flex flex-wrap items-start justify-between gap-3 mb-3">
      <!-- Title & Badges in Single Line, Aligned Top -->
      <div class="flex-1 min-w-[200px]">
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <h3 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mr-1">
            {name}
          </h3>

          <span
            class="px-2.5 py-0.5 rounded-full text-xs font-bold {isEligible
              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}"
          >
            {lang === 'bn' ? `${toBanglaDigits(scheme.termYears)} বছর মেয়াদি` : `${scheme.termYears}-Year Term`}
          </span>

          {#if isMonthlyIncome}
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              {lang === 'bn' ? 'প্রতি মাসে মুনাফা' : 'Monthly Profit'}
            </span>
          {:else if isQuarterlyIncome}
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
              {lang === 'bn' ? '৩ মাস অন্তর মুনাফা' : 'Quarterly Profit'}
            </span>
          {:else}
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
              {lang === 'bn' ? 'মেয়াদান্তে এককালীন' : 'Profit at Maturity'}
            </span>
          {/if}

          {#if isBestNet}
            <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xs">
              ★ {lang === 'bn' ? 'সর্বোচ্চ নিট লাভ' : 'Highest Net Return'}
            </span>
          {:else if isEligible && totalEligible > 1}
            <span class="px-2 py-0.5 rounded-full text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 border border-slate-200/60 dark:border-slate-700">
              {lang === 'bn' ? `র‌্যাংক #${toBanglaDigits(rankIndex + 1)}` : `Rank #${rankIndex + 1}`}
            </span>
          {/if}
        </div>

        <!-- Eligible Buyers Chips -->
        {#if scheme.eligibility?.buyerTags}
          <div class="flex flex-wrap items-center gap-1.5 mt-2">
            <span class="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {lang === 'bn' ? 'যারা কিনতে পারবেন' : 'Eligible to buy:'}
            </span>
            {#each (scheme.eligibility.buyerTags[lang] || scheme.eligibility.buyerTags.bn) as tag}
              <span class="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700">
                {tag}
              </span>
            {/each}
          </div>
        {:else}
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            {shortDesc}
          </p>
        {/if}
      </div>

      <!-- Compare Checkbox -->
      {#if isEligible}
        <label
          class="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none transition-colors"
        >
          <input
            type="checkbox"
            checked={isSelectedForCompare}
            on:change={() => onToggleCompare(scheme.id)}
            class="rounded border-slate-300 dark:border-slate-600 text-primary-start focus:ring-primary-start/30 w-4 h-4 cursor-pointer"
          />
          <span>{lang === 'bn' ? 'তুলনা করুন' : 'Compare'}</span>
        </label>
      {/if}
    </div>

    <!-- Ineligible State Banner -->
    {#if !isEligible}
      <div class="mt-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 flex items-start gap-3 text-xs sm:text-sm">
        <span class="text-lg leading-none">⚠️</span>
        <div>
          <div class="font-bold">{lang === 'bn' ? 'বিনিয়োগের জন্য প্রযোজ্য নয়' : 'Not Eligible for Investment'}</div>
          <div class="mt-0.5">{result.ineligibleReason?.[lang] || result.ineligibleReason?.bn}</div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Card Body (Calculations) -->
  {#if isEligible}
    <div class="p-6 sm:p-7 space-y-6">
      <!-- Big Highlights -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Main Income Focal Box -->
        {#if result.periodicPayout}
          <div class="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20">
            <div class="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-1">
              {result.periodicPayout.frequency === 'monthly'
                ? lang === 'bn' ? 'মাসিক নিট প্রাপ্তি' : 'Net Monthly Payout'
                : lang === 'bn' ? '৩ মাস পর পর নিট কিস্তি' : 'Net Quarterly Payout'}
            </div>
            <div class="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(result.periodicPayout.netPerPayout, lang)}
            </div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {lang === 'bn'
                ? `কর কর্তনের পর হাতে পাবেন (মোট ${toBanglaDigits(result.periodicPayout.totalPayouts)} বার)`
                : `Receivable in hand after tax (${result.periodicPayout.totalPayouts} installments)`}
            </div>
          </div>
        {/if}

        <!-- Net Profit Focal Box -->
        <div class="p-4 rounded-2xl {result.periodicPayout ? 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60' : 'sm:col-span-2 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20'}">
          <div class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            {lang === 'bn' ? `মোট নিট মুনাফা (${toBanglaDigits(scheme.termYears)} বছর)` : `Total Net Profit (${scheme.termYears} Years)`}
          </div>
          <div class="text-2xl sm:text-3xl font-black {result.periodicPayout ? 'text-slate-900 dark:text-white' : 'text-blue-600 dark:text-blue-400'}">
            {formatCurrency(result.netProfit ?? 0, lang)}
          </div>
          <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'bn'
              ? `আসল ও মোট লাভ মিলিয়ে: ${formatCurrency(result.totalAtMaturity ?? 0, lang)}`
              : `Total value with principal: ${formatCurrency(result.totalAtMaturity ?? 0, lang)}`}
          </div>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div class="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/40">
          <div class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {lang === 'bn' ? 'মোট গ্রস মুনাফা' : 'Total Gross Profit'}
          </div>
          <div class="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
            {formatCurrency(result.grossProfit ?? 0, lang)}
          </div>
        </div>

        <div class="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/40">
          <div class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {lang === 'bn' ? 'উৎসে কর কর্তন' : 'Source Tax (TDS)'}
          </div>
          <div class="text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">
            -{formatCurrency(result.taxDeducted ?? 0, lang)}
          </div>
          <div class="text-[10px] text-slate-400 mt-0.5">
            {formatPercent(result.appliedTaxRatePercent, lang)} {lang === 'bn' ? 'হারে' : 'rate'}
          </div>
        </div>

        <div class="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/40">
          <div class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {lang === 'bn' ? 'কার্যকর সুদের হার' : 'Headline Rate'}
          </div>
          <div class="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
            {formatPercent(result.appliedRatePercent?.weightedAverage, lang)}
          </div>
          <div class="text-[10px] text-slate-400 mt-0.5">
            {lang === 'bn' ? 'স্ল্যাব অনুযায়ী' : 'tier weighted'}
          </div>
        </div>
      </div>

      <!-- Collapsible Details Toggle Button -->
      <div class="pt-2">
        <button
          type="button"
          on:click={toggleDetails}
          class="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between transition-colors"
        >
          <span class="flex items-center gap-2">
            <span>⏱️</span>
            <span>{lang === 'bn' ? 'মেয়াদপূর্ব ভাঙানো বা নগদায়নের ছক ও নিয়মাবলী' : 'Early Encashment Schedule & Rules'}</span>
          </span>
          <span class="text-xs transition-transform duration-200 {isDetailsOpen ? 'rotate-180' : ''}">
            ▼
          </span>
        </button>
      </div>

      <!-- Collapsible Content -->
      {#if isDetailsOpen}
        <div class="space-y-6 pt-2 text-xs sm:text-sm border-t border-slate-100 dark:border-slate-700/60">

          <!-- Early Encashment Schedule Table -->
          {#if result.earlyEncashment && result.earlyEncashment.length > 0}
            <div>
              <h4 class="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <span>⏱️</span>
                <span>{lang === 'bn' ? 'মেয়াদপূর্ব ভাঙানো বা নগদায়নের ছক' : 'Early Encashment Schedule'}</span>
              </h4>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                {lang === 'bn'
                  ? 'পূর্ণ মেয়াদ শেষ হওয়ার আগে ভাঙালে সংশ্লিষ্ট বছরান্তের নির্ধারিত হারে মুনাফা ও মূলধন সহ হাতে পাবেন।'
                  : 'If encashed before maturity, you will receive the principal plus net profit calculated at the completed-year rate.'}
              </p>

              <div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table class="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <th class="p-2.5">{lang === 'bn' ? 'সময়কাল' : 'Holding Period'}</th>
                      <th class="p-2.5">{lang === 'bn' ? 'মুনাফার হার' : 'Rate (%)'}</th>
                      <th class="p-2.5">{lang === 'bn' ? 'প্রাপ্য গ্রস লাভ' : 'Gross Entitled'}</th>
                      <th class="p-2.5">{lang === 'bn' ? 'কর' : 'Tax'}</th>
                      <th class="p-2.5 font-black text-right text-emerald-700 dark:text-emerald-400">{lang === 'bn' ? 'ভাঙালে হাতে পাবেন' : 'Receivable (Main + Profit)'}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                    {#each result.earlyEncashment as enc, idx}
                      <tr class="{idx % 2 === 0 ? 'bg-white dark:bg-slate-900/40' : 'bg-slate-50 dark:bg-slate-800/60'} hover:bg-emerald-50/50 dark:hover:bg-slate-800/90 transition-colors">
                        <td class="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                          {lang === 'bn' ? `${toBanglaDigits(enc.afterFullYears)} বছর পূর্ণ হলে` : `After ${enc.afterFullYears} Full Year(s)`}
                        </td>
                        <td class="p-2.5 text-slate-700 dark:text-slate-300">
                          {formatPercent(enc.ratePercent, lang)}
                        </td>
                        <td class="p-2.5 text-slate-600 dark:text-slate-400">
                          {formatCurrency(enc.grossProfit ?? 0, lang, false)}
                        </td>
                        <td class="p-2.5 text-rose-600 dark:text-rose-400">
                          -{formatCurrency(enc.taxDeducted ?? 0, lang, false)}
                        </td>
                        <td class="p-2.5 font-black text-right text-emerald-700 dark:text-emerald-400">
                          {formatCurrency(enc.netReceivable ?? 0, lang)}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          {/if}

          <!-- Scheme Rules & Purchase Limits -->
          <div class="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40 space-y-2 text-xs">
            <div class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>📋</span>
              <span>{lang === 'bn' ? 'অফিসিয়াল ক্রয় সীমা ও যোগ্যতা' : 'Official Limits & Eligibility'}</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
              <div>
                <strong>{lang === 'bn' ? 'একক সর্বোচ্চ সীমা:' : 'Individual Max:'}</strong>{' '}
                {scheme.purchaseLimits.individual.max
                  ? formatCurrency(scheme.purchaseLimits.individual.max, lang)
                  : lang === 'bn' ? 'প্রযোজ্য নয়' : 'N/A'}
              </div>
              <div>
                <strong>{lang === 'bn' ? 'যৌথ সর্বোচ্চ সীমা:' : 'Joint Max:'}</strong>{' '}
                {scheme.purchaseLimits.joint.max
                  ? formatCurrency(scheme.purchaseLimits.joint.max, lang)
                  : lang === 'bn' ? 'যৌথ নামে ক্রয় প্রযোজ্য নয়' : 'Joint not allowed'}
              </div>
              <div>
                <strong>{lang === 'bn' ? 'সর্বনিম্ন বিনিয়োগ:' : 'Min Purchase:'}</strong>{' '}
                {scheme.purchaseLimits.minPurchase ? formatCurrency(scheme.purchaseLimits.minPurchase, lang) : '—'}
              </div>
              <div>
                <strong>{lang === 'bn' ? 'মুনাফা উত্তোলন:' : 'Payout Mode:'}</strong>{' '}
                {scheme.payoutType === 'monthly'
                  ? lang === 'bn' ? 'প্রতি মাসে' : 'Monthly'
                  : scheme.payoutType === 'quarterly'
                  ? lang === 'bn' ? 'প্রতি ৩ মাসে' : 'Quarterly'
                  : lang === 'bn' ? 'মেয়াদান্তে এককালীন' : 'At maturity'}
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
