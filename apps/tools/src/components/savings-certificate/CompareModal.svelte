<script lang="ts">
  import type { SchemeResult } from '../../lib/savings-certificate/types';
  import {
    formatCurrency,
    formatPercent,
    toBanglaDigits,
  } from '../../lib/savings-certificate/formatters';

  export let selectedSchemes: SchemeResult[] = [];
  export let lang: 'bn' | 'en' = 'bn';
  export let onClose: () => void = () => {};
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
  <div
    class="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
  >
    <!-- Modal Header -->
    <div class="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
      <div class="flex items-center gap-3">
        <span class="text-2xl">⚖️</span>
        <div>
          <h3 class="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {lang === 'bn' ? 'সঞ্চয়পত্র তুলনা' : 'Scheme Comparison'}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'bn'
              ? `${toBanglaDigits(selectedSchemes.length)} টি সঞ্চয়পত্রের পাশাপাশি তুলনামূলক হিসাব`
              : `Side-by-side comparison of ${selectedSchemes.length} schemes`}
          </p>
        </div>
      </div>

      <button
        type="button"
        on:click={onClose}
        class="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        aria-label="Close"
      >
        ✕
      </button>
    </div>

    <!-- Modal Body (Table) -->
    <div class="overflow-y-auto p-5 sm:p-6">
      <div class="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table class="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr class="bg-slate-100/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <th class="p-3.5 min-w-[140px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                {lang === 'bn' ? 'তুলনার বিষয়' : 'Criteria'}
              </th>
              {#each selectedSchemes as res}
                <th class="p-3.5 min-w-[180px] font-black text-slate-900 dark:text-white text-base">
                  {res.scheme.name[lang] || res.scheme.name.bn}
                </th>
              {/each}
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
            <!-- Term -->
            <tr>
              <td class="p-3.5 font-bold text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                {lang === 'bn' ? 'মেয়াদকাল' : 'Tenure'}
              </td>
              {#each selectedSchemes as res}
                <td class="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                  {lang === 'bn' ? `${toBanglaDigits(res.scheme.termYears)} বছর` : `${res.scheme.termYears} Years`}
                </td>
              {/each}
            </tr>

            <!-- Payout Mode -->
            <tr>
              <td class="p-3.5 font-bold text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                {lang === 'bn' ? 'মুনাফা উত্তোলন' : 'Payout Frequency'}
              </td>
              {#each selectedSchemes as res}
                <td class="p-3.5 text-slate-800 dark:text-slate-200">
                  {#if res.scheme.payoutType === 'monthly'}
                    <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      {lang === 'bn' ? 'প্রতি মাসে' : 'Monthly'}
                    </span>
                  {:else if res.scheme.payoutType === 'quarterly'}
                    <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                      {lang === 'bn' ? '৩ মাস পর পর' : 'Quarterly'}
                    </span>
                  {:else}
                    <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                      {lang === 'bn' ? 'মেয়াদান্তে এককালীন' : 'At maturity'}
                    </span>
                  {/if}
                </td>
              {/each}
            </tr>

            <!-- Periodic Income -->
            <tr>
              <td class="p-3.5 font-bold text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                {lang === 'bn' ? 'নিয়মিত কিস্তি (নিট)' : 'Regular Net Payout'}
              </td>
              {#each selectedSchemes as res}
                <td class="p-3.5 font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {#if res.periodicPayout}
                    {formatCurrency(res.periodicPayout.netPerPayout, lang)}
                    <span class="text-xs font-normal text-slate-500 block">
                      ({res.periodicPayout.frequency === 'monthly' ? (lang === 'bn' ? 'মাসিক' : 'monthly') : (lang === 'bn' ? 'ত্রৈমাসিক' : 'quarterly')})
                    </span>
                  {:else}
                    <span class="text-slate-400 text-xs">{lang === 'bn' ? 'মেয়াদান্তে প্রদেয়' : 'Paid at maturity'}</span>
                  {/if}
                </td>
              {/each}
            </tr>

            <!-- Full Term Net Profit -->
            <tr>
              <td class="p-3.5 font-bold text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                {lang === 'bn' ? 'মোট নিট মুনাফা' : 'Total Net Profit'}
              </td>
              {#each selectedSchemes as res}
                <td class="p-3.5 font-black text-blue-600 dark:text-blue-400 text-base font-mono">
                  {formatCurrency(res.netProfit ?? 0, lang)}
                </td>
              {/each}
            </tr>

            <!-- Total at Maturity -->
            <tr>
              <td class="p-3.5 font-bold text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                {lang === 'bn' ? 'মেয়াদান্তে মোট প্রাপ্তি' : 'Total at Maturity'}
              </td>
              {#each selectedSchemes as res}
                <td class="p-3.5 font-bold text-slate-900 dark:text-white font-mono">
                  {formatCurrency(res.totalAtMaturity ?? 0, lang)}
                </td>
              {/each}
            </tr>

            <!-- Effective Yield -->
            <tr>
              <td class="p-3.5 font-bold text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                {lang === 'bn' ? 'ফলপ্রসূ বার্ষিক রিটার্ন' : 'Effective Annual Yield'}
              </td>
              {#each selectedSchemes as res}
                <td class="p-3.5 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatPercent(res.effectiveAnnualYield, lang)}
                </td>
              {/each}
            </tr>

            <!-- Source Tax -->
            <tr>
              <td class="p-3.5 font-bold text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                {lang === 'bn' ? 'কর্তনকৃত উৎসে কর' : 'Source Tax (TDS)'}
              </td>
              {#each selectedSchemes as res}
                <td class="p-3.5 font-semibold text-rose-600 dark:text-rose-400 font-mono">
                  -{formatCurrency(res.taxDeducted ?? 0, lang)}
                </td>
              {/each}
            </tr>

            <!-- Individual Ceiling -->
            <tr>
              <td class="p-3.5 font-bold text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                {lang === 'bn' ? 'একক সর্বোচ্চ সীমা' : 'Individual Max Limit'}
              </td>
              {#each selectedSchemes as res}
                <td class="p-3.5 text-slate-700 dark:text-slate-300">
                  {res.scheme.purchaseLimits.individual.max
                    ? formatCurrency(res.scheme.purchaseLimits.individual.max, lang)
                    : '—'}
                </td>
              {/each}
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Footer -->
    <div class="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end">
      <button
        type="button"
        on:click={onClose}
        class="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs sm:text-sm font-bold transition-colors"
      >
        {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
      </button>
    </div>
  </div>
</div>
