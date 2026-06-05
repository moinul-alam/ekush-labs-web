<script>
  export let currentLang = 'bn';

  function toggleLanguage() {
    const targetLang = currentLang === 'bn' ? 'en' : 'bn';
    const currentPath = window.location.pathname;
    
    let newPath = currentPath;
    if (targetLang === 'en') {
      newPath = `/en${currentPath === '/' ? '' : currentPath}`;
    } else {
      newPath = currentPath.replace(/^\/en/, '') || '/';
    }
    
    window.location.href = newPath;
  }
</script>

<button class="lang-toggle flex shrink-0 items-center justify-center w-12 h-12 rounded-full cursor-pointer transition-all duration-400 ml-4 relative overflow-hidden text-slate-700 dark:text-white bg-white dark:bg-[var(--glass-bg)] shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_0_0_2px_var(--glass-border)] border border-slate-200 dark:border-transparent hover:bg-slate-50 dark:hover:bg-[var(--glass-highlight)] hover:scale-105 hover:shadow-[0_8px_30px_rgba(29,91,253,0.15)] dark:hover:shadow-[0_4px_12px_rgba(29,91,253,0.3)] active:scale-95 group" aria-label="Toggle language" on:click={toggleLanguage}>
  <svg class="globe-icon absolute w-5 h-5 transition-all duration-400 z-10 group-hover:text-primary-start group-hover:scale-110 group-hover:rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
  
  <span class="absolute bottom-[4px] right-[4px] text-[10px] font-bold {currentLang === 'bn' ? 'text-emerald-500' : 'text-primary-start'} transition-colors z-20">
    {currentLang === 'bn' ? 'বাং' : 'EN'}
  </span>
</button>
