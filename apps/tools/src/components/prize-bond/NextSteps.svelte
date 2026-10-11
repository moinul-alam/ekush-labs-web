<script>
  export let rules = null;
  export let lang = 'bn';

  $: steps = lang === 'bn'
    ? (rules?.claim?.stepsBn || [
        '১. মূল প্রাইজবন্ডটি নিরাপদে ও যত্নে রাখুন (ভাঁজ বা দাগ ফেলা যাবে না)।',
        '২. বাংলাদেশ ব্যাংকের অফিসিয়াল নোটিশ বা দৈনিক পত্রিকার সাথে নিশ্চিত হোন।',
        '৩. বাংলাদেশ ব্যাংকের যেকোনো কার্যালয় অথবা নির্ধারিত ব্যাংকে দাবি পেশ করুন।',
        '৪. জাতীয় পরিচয়পত্র (NID) ও ব্যাংক হিসাবের তথ্যাদি সাথে নিয়ে যান।',
        '৫. ২০% সরকারি উৎসে কর কর্তন করে অর্থ ব্যাংক একাউন্টে প্রদান করা হবে।',
      ])
    : (rules?.claim?.stepsEn || [
        '1. Keep the physical prize bond completely safe without folding or markings.',
        '2. Confirm officially via Bangladesh Bank publication or website.',
        '3. Submit claim at any Bangladesh Bank office or scheduled commercial bank branch.',
        '4. Bring original bond, National ID (NID) copy, and bank account details.',
        '5. 20% source tax is withheld and proceeds are disbursed to your bank.',
      ]);

  $: documents = rules?.claim?.documents || [
    'Original Prize Bond (মূল প্রাইজবন্ড)',
    'NID photocopy (জাতীয় পরিচয়পত্র)',
    'Bank details / Cheque copy (ব্যাংক হিসাব ও চেকের কপি)',
    'Prescribed Claim Form (নির্ধারিত দাবি ফরম)',
  ];
</script>

<div class="mt-8 p-6 rounded-3xl bg-gradient-to-br from-blue-50/90 to-indigo-50/70 dark:from-slate-800/90 dark:to-slate-900/90 border border-blue-200/80 dark:border-blue-500/20 shadow-md">
  <div class="flex items-center gap-3 mb-4">
    <div class="w-10 h-10 rounded-2xl bg-primary-start text-white flex items-center justify-center text-xl shadow-md">
      🛡️
    </div>
    <div>
      <h3 class="text-xl font-bold text-slate-900 dark:text-white">
        {lang === 'bn' ? 'পুরস্কার জেতার পর পরবর্তী করণীয়' : 'What to Do Next If You Won'}
      </h3>
      <p class="text-xs text-slate-500 dark:text-slate-400">
        {lang === 'bn' ? 'বাংলাদেশ ব্যাংকের অফিশিয়াল নিয়ম ও দাবি প্রক্রিয়া' : 'Official Bangladesh Bank claim procedure'}
      </p>
    </div>
  </div>

  <div class="space-y-3 my-4">
    {#each steps as step}
      <div class="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
        <span class="text-blue-500 font-bold mt-0.5">•</span>
        <span class="leading-relaxed">{step}</span>
      </div>
    {/each}
  </div>

  <div class="mt-5 pt-4 border-t border-blue-200/50 dark:border-slate-700">
    <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
      {lang === 'bn' ? 'প্রয়োজনীয় কাগজপত্র' : 'Required Documents'}
    </h4>
    <div class="flex flex-wrap gap-2">
      {#each documents as doc}
        <span class="px-3 py-1 bg-white/80 dark:bg-slate-700/80 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-sm">
          📋 {doc}
        </span>
      {/each}
    </div>
  </div>

  <div class="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
    <span>⚠️</span>
    <span>
      {lang === 'bn'
        ? 'সতর্কতা: পুরস্কার দাবির জন্য কোনো অগ্রিম ফি বা মধ্যস্থতাকারীর প্রয়োজন নেই। কোনো আর্থিক লেনদেন করবেন না।'
        : 'Caution: The official claim process never requires upfront fees or brokers. Beware of fraud.'}
    </span>
  </div>
</div>
