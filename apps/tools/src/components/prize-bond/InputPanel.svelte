<script>
  export let activeTab = 'text'; // 'text' | 'range' | 'file'
  export let lang = 'bn';
  export let onTabChange = (tab) => {};

  const tabs = [
    { id: 'text', labelBn: 'টাইপ বা পেস্ট', labelEn: 'Type / Paste', icon: '✍️' },
    { id: 'range', labelBn: 'ক্রমিক রেঞ্জ', labelEn: 'Number Range', icon: '🔢' },
    { id: 'file', labelBn: 'এক্সেল / সিএসভি', labelEn: 'Excel / CSV', icon: '📊' },
  ];
</script>

<div class="flex p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-white/10 gap-1.5 shadow-inner">
  {#each tabs as tab}
    <button
      type="button"
      on:click={() => onTabChange(tab.id)}
      class="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm md:text-base transition-all duration-200 {activeTab === tab.id
        ? 'bg-white dark:bg-slate-700 text-primary-start dark:text-blue-400 shadow-md scale-[1.01]'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/40'}"
    >
      <span class="text-lg">{tab.icon}</span>
      <span>{lang === 'bn' ? tab.labelBn : tab.labelEn}</span>
    </button>
  {/each}
</div>
