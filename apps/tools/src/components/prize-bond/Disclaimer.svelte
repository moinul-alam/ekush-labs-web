<script>
  export let rules = null;
  export let generatedAt = "";
  export let lang = "bn";
</script>

<div
  class="mt-12 p-6 rounded-3xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 text-xs text-slate-600 dark:text-slate-400 space-y-3"
>
  <div
    class="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2"
  >
    <span>⚖️</span>
    <span>
      {lang === "bn" ? "সতর্কবার্তা ও দায়মুক্তি" : "Disclaimer & Notice"}
    </span>
  </div>

  <p class="leading-relaxed">
    {lang === "bn"
      ? "এই টুলটি একটি বেসরকারি ও স্বাধীন ওয়েব অ্যাপ্লিকেশন। এটি বাংলাদেশ ব্যাংক, গণপ্রজাতন্ত্রী বাংলাদেশ সরকার বা জাতীয় সঞ্চয় অধিদপ্তরের সাথে সরাসরি সম্পৃক্ত নয়। ফলাফলের তথ্যসমূহ বাংলাদেশ ব্যাংকের প্রকাশিত অফিসয়াল ড্র তালিকা থেকে সংগৃহীত। চূড়ান্ত সিদ্ধান্ত গ্রহণের পূর্বে অফিসিয়াল গেজেট বা বাংলাদেশ ব্যাংকের মূল ওয়েবসাইট থেকে পুনঃযাচাই করার জন্য অনুরোধ করা হচ্ছে।"
      : "This tool is an unofficial, independent web application and is not affiliated with Bangladesh Bank, the Government of Bangladesh, or the National Savings Directorate. Draw results are compiled from official publications. Please verify all winning numbers directly with official sources before taking action."}
  </p>

  <p class="leading-relaxed font-semibold text-slate-700 dark:text-slate-300">
    {lang === "bn"
      ? "গোপনীয়তার নিশ্চয়তা: আপনার প্রদান করা কোনো প্রাইজবন্ড নম্বর বা আপলোড করা ফাইল আমাদের সার্ভারে সংরক্ষণ বা প্রেরণ করা হয় না। সকল তথ্য যাচাইকরণ প্রক্রিয়া সম্পূর্ণ আপনার ব্রাউজারেই (Client-side) সম্পন্ন হয়।"
      : "Privacy Guarantee: None of your bond numbers or uploaded files are stored on or sent to any server. All processing and verification happen securely within your browser."}
  </p>

  <div
    class="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500"
  >
    <div>
      {lang === "bn" ? "সর্বশেষ হালনাগাদ: " : "Last Updated: "}
      <span class="font-mono">{generatedAt || "2026-10-11"}</span>
    </div>
    {#if rules?.claim?.officialSourceUrl}
      <a
        href={rules.claim.officialSourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary-start dark:text-blue-400 hover:underline font-semibold"
      >
        {lang === "bn"
          ? "বাংলাদেশ ব্যাংকের অফিসিয়াল সাইট ↗"
          : "Bangladesh Bank Official Website ↗"}
      </a>
    {/if}
  </div>
</div>
