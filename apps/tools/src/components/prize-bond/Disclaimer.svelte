<script>
  export let rules = null;
  export let generatedAt = '';
  export let lang = 'bn';
</script>

<div class="mt-12 p-6 rounded-3xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 text-xs text-slate-600 dark:text-slate-400 space-y-3">
  <div class="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
    <span>⚖️</span>
    <span>{lang === 'bn' ? 'সতর্কীকরণ ও দায়িত্বমুক্তি (Disclaimer)' : 'Disclaimer & Notice'}</span>
  </div>

  <p class="leading-relaxed">
    {lang === 'bn'
      ? 'এই টুলটি একটি বেসরকারি ও স্বাধীন উন্মুক্ত ওয়েব অ্যাপ্লিকেশন। এটি বাংলাদেশ ব্যাংক, গণপ্রজাতন্ত্রী বাংলাদেশ সরকার বা জাতীয় সঞ্চয় অধিদপ্তরের সাথে সরাসরি সংশ্লিষ্ট নয়। ফলাফলসমূহ বাংলাদেশ ব্যাংকের প্রকাশিত অফিসিয়াল ড্র তালিকা হতে সংগৃহীত। কোনো সিদ্ধান্ত গ্রহণের পূর্বে অবশ্যই সরকারি গেজেট বা বাংলাদেশ ব্যাংকের অফিসিয়াল ওয়েবসাইট হতে পুনঃযাচাই করে নিন।'
      : 'This tool is an unofficial, independent web utility and is not affiliated with Bangladesh Bank, the Government of Bangladesh, or the National Savings Directorate. Draw results are transcribed from published official lists and may contain unintended discrepancies. Always verify winning numbers directly with official publications before taking action.'}
  </p>

  <p class="leading-relaxed font-semibold text-slate-700 dark:text-slate-300">
    {lang === 'bn'
      ? 'গোপনীয়তা নিশ্চয়তা: আপনার প্রবেশ করানো কোনো প্রাইজবন্ড নম্বর বা আপলোড করা ফাইল কোনো সার্ভারে জমা বা পাঠানো হয় না। সকল যাচাইকরণ সম্পূর্ণ আপনার ব্রাউজারে ইন-মেমোরি প্রসেস হয়।'
      : 'Privacy Assurance: None of your bond numbers or uploaded files are sent to or stored on any server. All parsing and verification happen strictly client-side within your browser.'}
  </p>

  <div class="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
    <div>
      {lang === 'bn' ? 'তথ্য হালনাগাদ: ' : 'Data Last Updated: '}
      <span class="font-mono">{generatedAt || '2026-10-11'}</span>
    </div>
    {#if rules?.claim?.officialSourceUrl}
      <a
        href={rules.claim.officialSourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary-start dark:text-blue-400 hover:underline font-semibold"
      >
        {lang === 'bn' ? 'বাংলাদেশ ব্যাংক অফিসিয়াল সাইট ↗' : 'Bangladesh Bank Official Portal ↗'}
      </a>
    {/if}
  </div>
</div>
