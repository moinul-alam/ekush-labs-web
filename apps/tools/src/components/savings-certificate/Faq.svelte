<script lang="ts">
  export let lang: 'bn' | 'en' = 'bn';

  const faqsBn = [
    {
      q: 'সঞ্চয়পত্রের মুনাফার হার কীভাবে হিসাব করা হয়?',
      a: 'জাতীয় সঞ্চয় অধিদপ্তরের নিয়ম অনুযায়ী প্রতিটি সঞ্চয়পত্র যে তারিখে ক্রয় করা হয়, সেই তারিখে কার্যকর সরকারি প্রজ্ঞাপনের মুনাফার হারই পূর্ণ মেয়াদের জন্য অপরিবর্তিত থাকে। সরকার পরবর্তীতে মুনাফার হার পুনর্নির্ধারণ করলেও পুরনো কেনা সঞ্চয়পত্রের হারে তার কোনো প্রভাব পড়ে না।'
    },
    {
      q: '৭.৫০ লক্ষ টাকার বেশি বিনিয়োগে মুনাফার হার কীভাবে প্রযোজ্য হয়?',
      a: 'সঞ্চয়পত্রের স্ল্যাব বা টায়ার সিস্টেম প্রগতিশীল (Excess-only)। অর্থাৎ মোট বিনিয়োগ ৭.৫০ লক্ষ টাকার বেশি হলে সম্পূর্ণ টাকার ওপর কম হার প্রযোজ্য হয় না। প্রথম ৭.৫০ লক্ষ টাকা পর্যন্ত অংশের জন্য সর্বোচ্চ হার প্রযোজ্য হবে এবং ৭.৫০ লক্ষ টাকার অতিরিক্ত অংশের জন্যই কেবল পরবর্তী স্তরের নির্ধারিত মুনাফার হার কার্যকর হবে।'
    },
    {
      q: 'সঞ্চয়পত্রের মুনাফার ওপর উৎসে কর (ট্যাক্স) কত টাকা কাটা হয়?',
      a: 'আয়কর আইন অনুযায়ী, সঞ্চয়পত্রে সর্বমোট বিনিয়োগ ৫,০০,০০০ (পাঁচ লক্ষ) টাকা পর্যন্ত থাকলে মুনাফার ওপর ৫% উৎসে কর কর্তন করা হয়। তবে মোট বিনিয়োগ ৫ লক্ষ টাকার বেশি হলে অর্জিত সম্পূর্ণ মুনাফার ওপর ১০% হারে উৎসে কর কাটা হয়। পেনশনার সঞ্চয়পত্রে ৫ লক্ষ টাকা পর্যন্ত বিনিয়োগে কোনো কর কাটা হয় না (০% কর)।'
    },
    {
      q: 'পেনশনার সঞ্চয়পত্রে বিশেষ কী কী সুবিধা রয়েছে?',
      a: 'পেনশনার সঞ্চয়পত্রে সর্বোচ্চ মুনাফার হার কার্যকর (৭.৫০ লাখ পর্যন্ত ১১.৯৮%) এবং ৫ লক্ষ টাকা পর্যন্ত মোট বিনিয়োগে কোনো উৎসে কর কাটা হয় না। এটি অবসরপ্রাপ্ত সরকারি, আধা-সরকারি, স্বায়ত্তশাসিত প্রতিষ্ঠানের কর্মকর্তা-কর্মচারী ও তাঁদের বৈধ পরিবারের জন্য সংরক্ষিত।'
    },
    {
      q: 'মেয়াদ পূর্ণ হওয়ার আগেই কি সঞ্চয়পত্র ভাঙানো (নগদায়ন) যায়?',
      a: 'হ্যাঁ, সকল সঞ্চয়পত্রই ন্যূনতম ১ বছর পূর্ণ হওয়ার পর মেয়াদপূর্তির পূর্বে যেকোনো সময় ভাঙানো যায়। তবে মেয়াদপূর্তির আগে ভাঙালে সংশ্লিষ্ট বছরান্তের জন্য নির্ধারিত তুলনামূলক হ্রাসকৃত হারে মুনাফা প্রাপ্য হবে। ইতিপূর্বে প্রতি মাসে বা ৩ মাস পর পর নিয়মিত যে বাড়তি মুনাফা তোলা হয়েছিল, তা মূল টাকা থেকে কর্তন করে সমন্বয়পূর্বক অবশিষ্ট টাকা গ্রাহককে ফেরত দেওয়া হয়।'
    },
    {
      q: 'সঞ্চয়পত্র কোথায় ক্রয় করা যায় এবং ক্রয়ের জন্য কী কী প্রয়োজন?',
      a: 'বাংলাদেশ ব্যাংকের যেকোনো শাখা অফিস, জাতীয় সঞ্চয় ব্যুরো, যেকোনো বাণিজ্যিক ব্যাংক এবং ডাকঘর (Post Office) থেকে সঞ্চয়পত্র কেনা যায়। ক্রয়ের জন্য বিনিয়োগকারী ও নমিনির জাতীয় পরিচয়পত্র (NID), পাসপোর্ট সাইজ ছবি, ব্যাংক হিসাবের চেকের পাতা বা ব্যাংক বিবরণী এবং ২ লক্ষ টাকার বেশি বিনিয়োগে ই-টিন (e-TIN) সনদ প্রয়োজন।'
    }
  ];

  const faqsEn = [
    {
      q: 'How is the interest or profit calculated on National Savings Certificates?',
      a: 'Under Department of National Savings regulations, certificates lock in the rate in force on their purchase date for their entire tenure. Subsequent rate revisions issued by the government apply only to newly purchased certificates.'
    },
    {
      q: 'Does the lower rate above Tk 7.5 Lakh apply to the entire amount or only the excess portion?',
      a: 'It applies strictly to the excess portion (progressive tiering). The first Tk 7,50,000 always earns the highest tier rate, and only the portion exceeding Tk 7,50,000 earns the subsequent tier rate.'
    },
    {
      q: 'What is the rate of Tax Deducted at Source (TDS) on savings certificate profit?',
      a: 'Under Bangladesh Income Tax regulations, investments up to Tk 5,00,000 incur a 5% source tax on profit. If total certificate holdings exceed Tk 5,00,000, a 10% tax applies to the entire profit. Pensioner savings certificates up to Tk 5,00,000 are completely tax-exempt (0% tax).'
    },
    {
      q: 'What are the exclusive advantages of the Pensioner Savings Certificate?',
      a: 'The Pensioner certificate offers the highest profit rate (11.98% up to Tk 7.5L) and complete source-tax exemption up to Tk 5 Lakh. It is exclusively available to retired government, semi-government, and autonomous body employees or surviving spouses.'
    },
    {
      q: 'Can savings certificates be encashed before maturity?',
      a: 'Yes, after completing at least 1 full year, certificates can be encashed early. However, profit is recalculated using the lower early-encashment rate for completed years, and any excess monthly/quarterly payouts previously drawn are adjusted from the principal.'
    },
    {
      q: 'Where can I purchase savings certificates and what documents are required?',
      a: 'Certificates can be purchased at Bangladesh Bank branches, National Savings Bureau offices, scheduled commercial banks, and post offices. You will need the investor and nominee NIDs, passport-size photographs, bank account details/cheque leaf, and an e-TIN certificate for investments exceeding Tk 2 Lakh.'
    }
  ];

  $: faqs = lang === 'bn' ? faqsBn : faqsEn;
  let openIndex = 0;

  function toggle(idx: number) {
    openIndex = openIndex === idx ? -1 : idx;
  }
</script>

<div class="mt-14">
  <div class="text-center mb-8">
    <h3 class="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
      {lang === 'bn' ? 'সাধারণ জিজ্ঞাসা (FAQ)' : 'Frequently Asked Questions'}
    </h3>
    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl mx-auto">
      {lang === 'bn'
        ? 'জাতীয় সঞ্চয়পত্রের মুনাফা, কর, স্ল্যাব ও নিয়মাবলী সংক্রান্ত প্রয়োজনীয় তথ্য'
        : 'Essential guidelines on Sanchayapatra profit rates, tax rules, tiers, and encashment'}
    </p>
  </div>

  <div class="max-w-3xl mx-auto space-y-3">
    {#each faqs as item, idx}
      <div
        class="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md overflow-hidden transition-colors"
      >
        <button
          type="button"
          on:click={() => toggle(idx)}
          class="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-bold text-slate-900 dark:text-white hover:text-primary-start transition-colors"
        >
          <span class="text-sm sm:text-base">{item.q}</span>
          <span
            class="text-lg transition-transform duration-200 {openIndex === idx ? 'rotate-180 text-primary-start' : 'text-slate-400'}"
          >
            ▼
          </span>
        </button>
        {#if openIndex === idx}
          <div
            class="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700/50 pt-3"
          >
            {item.a}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
