<script>
  export let lang = 'bn';

  const faqsBn = [
    {
      q: 'প্রাইজবন্ডের ড্র কত দিন পর পর অনুষ্ঠিত হয়?',
      a: 'বাংলাদেশ ব্যাংকের অধীনে প্রাইজবন্ড ড্র বছরে চারবার অনুষ্ঠিত হয় — ৩১ জানুয়ারি, ৩০ এপ্রিল, ৩১ জুলাই এবং ৩১ অক্টোবর। কোনো তারিখ সরকারি ছুটির দিন হলে পরবর্তী কার্যদিবসে ড্র অনুষ্ঠিত হয়।',
    },
    {
      q: 'সিরিজের অক্ষর বা বর্ণ কি ফলাফলে প্রভাব ফেলে?',
      a: 'না। বাংলাদেশ ব্যাংকের নিয়মানুযায়ী ফলাফল ড্র অনুষ্ঠিত হয় কেবল ৭-সংখ্যার নম্বরের উপর। যদি একটি ৭-সংখ্যার নম্বর পুরস্কৃত হয়, তবে বাজারে প্রচলিত সকল সিরিজের ওই একই নম্বরের বন্ড সমপরিমাণ পুরস্কার লাভ করে।',
    },
    {
      q: 'পুরস্কার দাবির মেয়াদ কত দিন?',
      a: 'ড্র অনুষ্ঠানের তারিখ হতে পরবর্তী ২ (দুই) বছর (২৪ মাস) পর্যন্ত পুরস্কার দাবি করা যায়। দুই বছর অতিবাহিত হলে প্রাইজবন্ডটি অকার্যকর হয়ে যায় এবং অর্থ সরকারি কোষাগারে জমা হয়।',
    },
    {
      q: 'পুরস্কারের অর্থের উপর কি কর কাটা হয়?',
      a: 'হ্যাঁ, সরকারের বিদ্যমান আয়কর আইন ২০২৩ অনুযায়ী পুরস্কারের টাকার উপর ২০% হারে উৎসে কর (Withholding Tax) কর্তন করা হয়।',
    },
    {
      q: 'আমার প্রাইজবন্ড নম্বর কি আপনাদের সার্ভারে জমা থাকে?',
      a: 'একদমই না! একুশ ল্যাবস-এর এই টুলটি সম্পূর্ণ ব্রাউজারভিত্তিক ও ক্লায়েন্ট-সাইড প্রযুক্তি দ্বারা তৈরি। আপনার কোনো বন্ড নম্বর বা ফাইল কোনো সার্ভারে প্রেরিত বা সংরক্ষিত হয় না।',
    },
  ];

  const faqsEn = [
    {
      q: 'How frequently are Bangladesh prize bond draws held?',
      a: 'Prize bond draws are held four times a year: January 31, April 30, July 31, and October 31. If any date is a public holiday, the draw is conducted on the following business day.',
    },
    {
      q: 'Does the series letter affect winning eligibility?',
      a: 'No. Bangladesh Bank draws winners solely on the 7-digit number. Every bond bearing that winning 7-digit number across all circulating series wins the respective prize tier.',
    },
    {
      q: 'What is the deadline to claim a prize?',
      a: 'Prize money must be claimed within 2 years (24 months) from the draw date. Unclaimed prize amounts revert to the national treasury after this window.',
    },
    {
      q: 'Is there any tax deducted on prize bond winnings?',
      a: 'Yes. Under the Income Tax Act 2023, a 20% tax at source is deducted from all prize money before disbursement to your bank account.',
    },
    {
      q: 'Are my prize bond numbers or files saved anywhere?',
      a: 'Never. All data parsing, hashing, and matching execute entirely client-side in your web browser. No bond numbers or uploaded files ever touch any server.',
    },
  ];

  $: faqs = lang === 'bn' ? faqsBn : faqsEn;
  let openIndex = 0;

  function toggle(idx) {
    openIndex = openIndex === idx ? -1 : idx;
  }
</script>

<div class="mt-12">
  <div class="text-center mb-8">
    <h3 class="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
      {lang === 'bn' ? 'সাধারণ জিজ্ঞাসা (FAQ)' : 'Frequently Asked Questions'}
    </h3>
    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
      {lang === 'bn' ? 'বাংলাদেশ প্রাইজবন্ড যাচাই সংক্রান্ত প্রয়োজনীয় তথ্য' : 'Everything you need to know about Bangladesh Prize Bonds'}
    </p>
  </div>

  <div class="max-w-3xl mx-auto space-y-3">
    {#each faqs as item, idx}
      <div class="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md overflow-hidden transition-colors">
        <button
          type="button"
          on:click={() => toggle(idx)}
          class="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-bold text-slate-900 dark:text-white hover:text-primary-start transition-colors"
        >
          <span>{item.q}</span>
          <span class="text-xl transition-transform duration-200 {openIndex === idx ? 'rotate-180 text-primary-start' : 'text-slate-400'}">
            ▼
          </span>
        </button>
        {#if openIndex === idx}
          <div class="px-5 pb-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700/50 pt-3">
            {item.a}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
