<script>
  import { englishToBanglaDigits } from '../../lib/prize-bond/parse-input';

  export let draws = [];
  export let selectedDrawIds = [];
  export let lang = 'bn';
  export let onSelectionChange = (ids) => {};

  $: allClaimableIds = draws
    .filter((d) => !isDrawExpired(d.claimableUntil))
    .map((d) => d.id);

  $: isAllClaimableSelected =
    allClaimableIds.length > 0 &&
    allClaimableIds.every((id) => selectedDrawIds.includes(id));

  function isDrawExpired(claimableUntil) {
    if (!claimableUntil) return false;
    const today = new Date().toISOString().split('T')[0];
    return claimableUntil < today;
  }

  function toggleAllClaimable() {
    if (isAllClaimableSelected) {
      // Keep only latest
      if (draws.length > 0) {
        onSelectionChange([draws[0].id]);
      }
    } else {
      onSelectionChange([...allClaimableIds]);
    }
  }

  function toggleDraw(id) {
    if (selectedDrawIds.includes(id)) {
      if (selectedDrawIds.length === 1) return; // Keep at least one selected
      onSelectionChange(selectedDrawIds.filter((item) => item !== id));
    } else {
      onSelectionChange([...selectedDrawIds, id]);
    }
  }
</script>

<div class="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm">
  <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
    <div>
      <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <span>🎯</span>
        <span>{lang === 'bn' ? 'ড্র নির্বাচন করুন' : 'Select Draws to Check'}</span>
      </h3>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        {lang === 'bn'
          ? 'ডিফল্টভাবে সকল দাবিযোগ্য ড্র অন্তর্ভুক্ত থাকে'
          : 'All active claimable draws are included by default'}
      </p>
    </div>

    <button
      type="button"
      on:click={toggleAllClaimable}
      class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-primary-start/30 text-primary-start dark:text-blue-400 hover:bg-primary-start/10 transition-colors"
    >
      {isAllClaimableSelected
        ? (lang === 'bn' ? 'শুধুমাত্র সর্বশেষ ড্র' : 'Only Latest Draw')
        : (lang === 'bn' ? 'সকল দাবিযোগ্য ড্র' : 'All Claimable Draws')}
    </button>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
    {#each draws as draw}
      {@const expired = isDrawExpired(draw.claimableUntil)}
      {@const isSelected = selectedDrawIds.includes(draw.id)}

      <button
        type="button"
        on:click={() => toggleDraw(draw.id)}
        class="flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200 {isSelected
          ? 'bg-blue-50/80 dark:bg-blue-900/30 border-blue-400/80 dark:border-blue-500/60 shadow-sm'
          : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700/60 opacity-70 hover:opacity-100'}"
      >
        <div class="min-w-0 pr-2">
          <div class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <span>
              {lang === 'bn' ? `${englishToBanglaDigits(draw.drawNumber)}তম ড্র` : `Draw #${draw.drawNumber}`}
            </span>
            {#if expired}
              <span class="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded font-medium">
                {lang === 'bn' ? 'মেয়াদ উত্তীর্ণ' : 'Expired'}
              </span>
            {/if}
          </div>
          <div class="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {lang === 'bn' ? englishToBanglaDigits(draw.date) : draw.date}
          </div>
        </div>

        <div class="w-5 h-5 rounded-md flex items-center justify-center border {isSelected ? 'bg-primary-start border-primary-start text-white' : 'border-slate-300 dark:border-slate-600'}">
          {#if isSelected}
            <svg class="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          {/if}
        </div>
      </button>
    {/each}
  </div>
</div>
