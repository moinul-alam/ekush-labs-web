<script>
  import { onMount } from "svelte";

  let isDark = false;

  onMount(() => {
    isDark = document.documentElement.getAttribute("data-theme") === "dark";
  });

  function toggleTheme() {
    isDark = !isDark;
    const theme = isDark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("ekush_theme", theme);
  }
</script>

<button
  class="theme-toggle flex shrink-0 items-center justify-center w-10 h-10 rounded-full cursor-pointer transition-all duration-400 ml-8 relative overflow-hidden text-slate-700 dark:text-white bg-white dark:bg-[var(--glass-bg)] shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_0_0_2px_var(--glass-border)] border border-slate-200 dark:border-transparent hover:bg-slate-50 dark:hover:bg-[var(--glass-highlight)] hover:scale-105 hover:shadow-[0_8px_30px_rgba(29,91,253,0.15)] dark:hover:shadow-[0_4px_12px_rgba(29,91,253,0.3)] active:scale-95 active:rotate-12 group"
  aria-label="Toggle theme"
  on:click={toggleTheme}
>
  <svg
    class="sun-icon absolute w-5 h-5 transition-all duration-400 z-10 {isDark
      ? 'opacity-100 rotate-0 scale-100 group-hover:text-amber-500'
      : 'opacity-0 rotate-90 scale-75'}"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <circle cx="12" cy="12" r="5" />
    <path
      d="M12 1v2m0 18v2m11-11h-2M4 12H2m15.364 6.364l-1.414-1.414M7.05 7.05L5.636 5.636m12.728 0l-1.414 1.414M7.05 16.95l-1.414 1.414M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"
    />
  </svg>
  <svg
    class="moon-icon absolute w-5 h-5 transition-all duration-400 z-10 {isDark
      ? 'opacity-0 -rotate-90 scale-75'
      : 'opacity-100 rotate-0 scale-100 group-hover:text-slate-800'}"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
</button>
