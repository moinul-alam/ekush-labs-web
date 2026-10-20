<script lang="ts">
  import { toBanglaDigits } from "../../lib/savings-certificate/formatters";

  export let lastVerified: string = "2026-10-19";
  export let lang: "bn" | "en" = "bn";
</script>

<div
  class="mt-12 p-6 rounded-3xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 text-xs text-slate-600 dark:text-slate-400 space-y-3"
>
  <div
    class="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2"
  >
    <span>⚖️</span>
    <span>
      {lang === "bn"
        ? "সতর্কবার্তা, তথ্যসূত্র ও দায়মুক্তি"
        : "Disclaimer, Sources & Privacy Notice"}
    </span>
  </div>

  <p class="leading-relaxed">
    {lang === "bn"
      ? "এই ক্যালকুলেটরের ফলাফল শুধুমাত্র তথ্যগত ও অনুমিত হিসাবের জন্য প্রস্তুত করা হয়েছে। এটি কোনো আর্থিক বা কর পরামর্শ নয়। জাতীয় সঞ্চয় অধিদপ্তর ও অর্থ মন্ত্রণালয়ের সর্বশেষ সরকারি প্রজ্ঞাপন, গেজেট ও বিধিমালার নিয়মাবলীই চূড়ান্ত হিসেবে গণ্য হবে। বিভিন্ন সময়ে জারিকৃত প্রজ্ঞাপন অনুযায়ী পুরনো ও নতুন ক্রয়ের ক্ষেত্রে সুদের হার ও কর বিধিমালার পার্থক্য হতে পারে।"
      : "Calculations provided by this tool are informational estimates only and do not constitute financial or tax advice. Official circulars, gazettes, and rules published by the Department of National Savings (DNS) and the Ministry of Finance prevail. Government rates and tax regulations are subject to statutory revisions."}
  </p>

  <p class="leading-relaxed font-semibold text-slate-700 dark:text-slate-300">
    {lang === "bn"
      ? "🔒 ১০০% ব্রাউজার ভিত্তিক ও নিরাপদ: আপনার প্রদান করা কোনো টাকার পরিমাণ, ক্রয়ের তারিখ বা ব্যক্তিগত তথ্য কোনো সার্ভারে প্রেরণ বা সংরক্ষণ করা হয় না। সম্পূর্ণ হিসাব কেবল আপনার ডিভাইসের ব্রাউজারে সম্পন্ন হয়।"
      : "🔒 100% Client-Side & Private: None of your financial figures, purchase dates, or selections are sent to or stored on any server. Everything executes strictly in your local browser."}
  </p>

  <div
    class="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500"
  >
    <div>
      {lang === "bn" ? "সর্বশেষ যাচাইকৃত তারিখ: " : "Last Verified Date: "}
      <span class="font-mono font-semibold text-slate-700 dark:text-slate-300">
        {lang === "bn" ? toBanglaDigits(lastVerified) : lastVerified}
      </span>
    </div>

    <div class="flex flex-wrap items-center gap-3 font-semibold">
      <a
        href="https://nationalsavings.gov.bd"
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary-start dark:text-blue-400 hover:underline"
      >
        {lang === "bn"
          ? "জাতীয় সঞ্চয় অধিদপ্তর ↗"
          : "Department of National Savings ↗"}
      </a>
      <span>·</span>
      <a
        href="https://bb.org.bd"
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary-start dark:text-blue-400 hover:underline"
      >
        {lang === "bn" ? "বাংলাদেশ ব্যাংক ↗" : "Bangladesh Bank ↗"}
      </a>
      <span>·</span>
      <a
        href="https://ird.gov.bd"
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary-start dark:text-blue-400 hover:underline"
      >
        {lang === "bn"
          ? "অভ্যন্তরীণ সম্পদ বিভাগ ↗"
          : "Internal Resources Division (IRD) ↗"}
      </a>
    </div>
  </div>
</div>
