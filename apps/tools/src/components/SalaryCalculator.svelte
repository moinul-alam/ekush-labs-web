<script>
  import { onMount } from "svelte";
  import { fmt as fmtLocalized, handleLocalizedInput } from '../utils/numbers';

  export let lang = "bn";

  const dict = {
    bn: {
      title: "সরকারি বেতন ক্যালকুলেটর",
      desc: "অষ্টম এবং প্রস্তাবিত নবম পে-স্কেলের তুলনামূলক বেতন হিসাব করুন",
      grade: "গ্রেড (১-২০)",
      currentBasic: "বর্তমান বেসিক (৳)",
      location: "কর্মস্থল / বাসাভাড়ার এলাকা",
      locDhaka: "ঢাকা সিটি কর্পোরেশন",
      locCityCorp: "অন্যান্য সিটি কর্পোরেশন",
      locOther: "জেলা/উপজেলা বা অন্যান্য",
      children: "সন্তান সংখ্যা (শিক্ষা ভাতার জন্য)",
      calcButton: "হিসাব করুন",
      currentTitle: "বর্তমান বেতন (৮ম পে-স্কেল)",
      newTitle: "প্রস্তাবিত বেতন (৯ম পে-স্কেল)",
      basic: "বেসিক",
      houseRent: "বাসা ভাড়া",
      medical: "চিকিৎসা ভাতা",
      tiffin: "টিফিন ভাতা",
      childEdu: "শিক্ষা ভাতা",
      specialBenefit: "বিশেষ সুবিধা",
      totalGross: "মোট প্রাপ্তি (Gross)",
      deductions: "কর্তনসমূহ",
      gpf: "সাধারণ ভবিষ্য তহবিল (GPF)",
      gpfDesc: "জিপিএফ (%)",
      jointInsurance: "কর্মচারী যৌথবিমা তহবিল",
      welfareFund: "কর্মচারী কল্যাণ তহবিল",
      stampDuty: "রাজস্ব স্ট্যাম্প",
      totalDeduction: "মোট কর্তন",
      netPay: "প্রদেয় বেতন (Net Pay)",
      increase: "বেতন বৃদ্ধি",
      loading: "লোড হচ্ছে...",
      error: "তথ্য লোড করতে সমস্যা হয়েছে।",
      retry: "আবার চেষ্টা করুন",
      ponjiTag: "অ্যান্ড্রয়েড অ্যাপ",
      ponjiTitle: "একুশ পঞ্জি - বাংলা ক্যালেন্ডার",
      ponjiDesc: "সম্পূর্ণ বাংলা ক্যালেন্ডার ও ছুটির তালিকা",
      ponjiBtn: "ডাউনলোড করুন",
    },
    en: {
      title: "Govt Salary Calculator",
      desc: "Calculate and compare salary between 8th and proposed 9th pay scale",
      grade: "Grade (1-20)",
      currentBasic: "Current Basic (৳)",
      location: "Workplace / House Rent Area",
      locDhaka: "Dhaka City Corporation",
      locCityCorp: "Other City Corporation",
      locOther: "District/Upazila or Other",
      children: "Number of Children (for Edu Allowance)",
      calcButton: "Calculate",
      currentTitle: "Current Salary (8th Scale)",
      newTitle: "Proposed Salary (9th Scale)",
      basic: "Basic",
      houseRent: "House Rent",
      medical: "Medical Allowance",
      tiffin: "Tiffin Allowance",
      childEdu: "Education Allowance",
      specialBenefit: "Special Benefit",
      totalGross: "Total Gross",
      deductions: "Deductions",
      gpf: "General Provident Fund (GPF)",
      gpfDesc: "GPF (%)",
      jointInsurance: "Joint Insurance Fund",
      welfareFund: "Welfare Fund",
      stampDuty: "Stamp Duty",
      totalDeduction: "Total Deduction",
      netPay: "Net Pay",
      increase: "Increase",
      loading: "Loading...",
      error: "Failed to load data.",
      retry: "Retry",
      ponjiTag: "Android App",
      ponjiTitle: "Ekush Ponji - Bangla Calendar",
      ponjiDesc: "Complete Bangla calendar with holidays",
      ponjiBtn: "Download",
    },
  };

  const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.ekushlabs.ponji";

  $: t = dict[lang];

  let loading = true;
  let error = false;

  let payscaleData = null;
  let selectedGrade = 9;
  let currentBasic = "";
  let location = "dhaka_city_corp";
  let childrenCount = 0;
  let gpfPercent = "25";

  let calculatedResult = null;

  function fmtNum(n) {
    if (lang === "en") return n.toString();
    return n.toString().replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
  }

  function fmtDisplay(str) {
    return fmtLocalized(str, lang);
  }

  function formatMoney(amount) {
    const formatted = Math.round(amount).toString();
    if (lang === "en") return new Intl.NumberFormat("en-US").format(amount);
    
    // Custom Bengali comma separation
    let parts = formatted.split(".");
    let num = parts[0];
    if (num.length > 3) {
      num = num.substring(0, num.length - 3).replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + num.substring(num.length - 3);
    }
    num = num.replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
    return num;
  }

  async function fetchPayScaleData() {
    loading = true;
    error = false;
    try {
      let manifestRes;
      try {
        manifestRes = await fetch("https://hub.ekushlabs.com/payscales/manifest.json");
      } catch (err) {
        manifestRes = { ok: false };
      }
      
      let manifest;
      if (manifestRes.ok) {
        manifest = await manifestRes.json();
      } else {
        manifestRes = await fetch("/hub/payscales/manifest.json");
        if (manifestRes.ok) {
          const text = await manifestRes.text();
          if (text.startsWith("<!")) throw new Error("Received HTML instead of JSON");
          manifest = JSON.parse(text);
        } else if (import.meta.env.DEV) {
          manifest = (await import("../../../../apps/hub/payscales/manifest.json")).default;
        } else {
          throw new Error("Failed to load manifest");
        }
      }

      const baseUrl = manifest.baseUrl || "https://hub.ekushlabs.com/payscales";
      const file8th = manifest.datasets?.payscales?.files?.["8th"] || "pay_scale_8th.json";
      const file9th = manifest.datasets?.payscales?.files?.["9th"] || "pay_scale_9th.json";

      // Fetch 8th
      let data8th;
      let data8thRes;
      try {
        data8thRes = await fetch(`${baseUrl}/${file8th}`);
      } catch (err) {
        data8thRes = { ok: false };
      }
      if (data8thRes.ok) {
        data8th = await data8thRes.json();
      } else {
        const localRes = await fetch(`/hub/payscales/${file8th}`);
        if (localRes.ok) {
          const text = await localRes.text();
          if (!text.startsWith("<!")) data8th = JSON.parse(text);
        }
        if (!data8th && import.meta.env.DEV) {
          data8th = (await import("../../../../apps/hub/payscales/pay_scale_8th.json")).default;
        }
      }

      // Fetch 9th
      let data9th;
      let data9thRes;
      try {
        data9thRes = await fetch(`${baseUrl}/${file9th}`);
      } catch (err) {
        data9thRes = { ok: false };
      }
      if (data9thRes.ok) {
        data9th = await data9thRes.json();
      } else {
        const localRes = await fetch(`/hub/payscales/${file9th}`);
        if (localRes.ok) {
          const text = await localRes.text();
          if (!text.startsWith("<!")) data9th = JSON.parse(text);
        }
        if (!data9th && import.meta.env.DEV) {
          data9th = (await import("../../../../apps/hub/payscales/pay_scale_9th.json")).default;
        }
      }

      if (!data8th || !data9th) throw new Error("Failed to load pay scale data");

      // Combine them into a single structure
      const grades = [];
      for (let i = 0; i < 20; i++) {
        const g8 = data8th.grades.find(g => g.grade === i + 1);
        const g9 = data9th.grades.find(g => g.grade === i + 1);
        if (g8 && g9) {
          grades.push({
            grade: i + 1,
            scale_8th: g8,
            scale_9th: g9
          });
        }
      }

      payscaleData = {
        allowances_8th: data8th.allowances,
        allowances_9th: data9th.allowances,
        deductions_8th: data8th.deductions || {},
        deductions_9th: data9th.deductions || {},
        disclaimer: {
          bn: data8th.meta.disclaimer_bn,
          en: data8th.meta.disclaimer_en
        },
        grades
      };
      
      updateGradeDefault();
    } catch (e) {
      console.error("[Salary Calculator] Data fetch failed:", e);
      error = true;
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchPayScaleData();
  });

  function updateGradeDefault() {
    if (payscaleData && payscaleData.grades) {
      const gradeData = payscaleData.grades.find((g) => g.grade == selectedGrade);
      if (gradeData) {
        currentBasic = gradeData.scale_8th.steps[0].toString();
        calculatedResult = null;
      }
    }
  }

  function handleGradeChange(e) {
    selectedGrade = parseInt(e.target.value);
    updateGradeDefault();
  }

  function getSpecialBenefit(allowances, basic, grade) {
    if (!allowances.special_benefit || !allowances.special_benefit.rules) return 0;
    for (const rule of allowances.special_benefit.rules) {
      const [minG, maxG] = rule.grades;
      if (grade >= minG && grade <= maxG) {
        return Math.max(basic * rule.percentage, rule.min_amount);
      }
    }
    return 0;
  }

  function getTiffin(allowances, grade) {
    if (!allowances.tiffin) return 0;
    const tiffin = allowances.tiffin;
    if (tiffin.grades) {
      const [minG, maxG] = tiffin.grades;
      if (grade >= minG && grade <= maxG) return tiffin.amount;
      return 0;
    }
    return tiffin.amount || 0;
  }

  function getDeductions(deductionsData, grade, basic, gpfPercentValue) {
    if (!deductionsData) return { gpf: 0, jointInsurance: 0, welfareFund: 0, stampDuty: 0, total: 0 };
    
    let gpf = 0;
    if (deductionsData.gpf) {
      let percent = parseFloat(gpfPercentValue) / 100;
      if (isNaN(percent)) percent = deductionsData.gpf.default_percentage;
      percent = Math.max(deductionsData.gpf.min_percentage, Math.min(percent, deductionsData.gpf.max_percentage));
      gpf = basic * percent;
    }

    let jointInsurance = 0;
    if (deductionsData.joint_insurance) {
      const jg = deductionsData.joint_insurance.grades;
      if (!jg || (grade >= jg[0] && grade <= jg[1])) {
        jointInsurance = deductionsData.joint_insurance.amount;
      }
    }
    
    let welfareFund = 0;
    if (deductionsData.welfare_fund) {
      const wg = deductionsData.welfare_fund.grades;
      if (!wg || (grade >= wg[0] && grade <= wg[1])) {
        welfareFund = deductionsData.welfare_fund.amount;
      }
    }
    
    let stampDuty = 0;
    if (deductionsData.stamp_duty) {
      stampDuty = deductionsData.stamp_duty.amount;
    }
    
    return {
      gpf,
      jointInsurance,
      welfareFund,
      stampDuty,
      total: gpf + jointInsurance + welfareFund + stampDuty
    };
  }

  function calculate() {
    if (!payscaleData || !currentBasic) return;

    const gradeData = payscaleData.grades.find((g) => g.grade == selectedGrade);
    if (!gradeData) return;

    const basicInput = parseFloat(currentBasic);
    const steps8th = gradeData.scale_8th.steps;
    const steps9th = gradeData.scale_9th.steps;

    // Find closest step in 8th scale
    let closestIndex = 0;
    let minDiff = Infinity;
    for (let i = 0; i < steps8th.length; i++) {
      const diff = Math.abs(steps8th[i] - basicInput);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }

    const currentBasicValue = basicInput;
    let newBasicValue = steps9th[closestIndex];
    if (!newBasicValue) {
      newBasicValue = steps9th[steps9th.length - 1];
    }
    
    if (basicInput > steps8th[steps8th.length - 1]) {
      newBasicValue = steps9th[steps9th.length - 1];
    }

    const grade = selectedGrade;
    const a8 = payscaleData.allowances_8th;
    const a9 = payscaleData.allowances_9th;

    const houseRentRate8 = a8.house_rent[location];
    const houseRentRate9 = a9.house_rent[location];
    const medical8 = a8.medical.amount;
    const medical9 = a9.medical.amount;
    const tiffin8 = getTiffin(a8, grade);
    const tiffin9 = getTiffin(a9, grade);
    const specialBenefit8 = getSpecialBenefit(a8, currentBasicValue, grade);
    const specialBenefit9 = getSpecialBenefit(a9, newBasicValue, grade);
    const childEduRate8 = a8.child_education.per_child;
    const childEduRate9 = a9.child_education.per_child;
    const childEduTotal8 = Math.min(childrenCount, a8.child_education.max_children) * childEduRate8;
    const childEduTotal9 = Math.min(childrenCount, a9.child_education.max_children) * childEduRate9;

    // Current (8th) Breakdown
    const currentHouseRent = currentBasicValue * houseRentRate8;
    const currentGross = currentBasicValue + currentHouseRent + medical8 + tiffin8 + specialBenefit8 + childEduTotal8;
    const currentDeductions = getDeductions(payscaleData.deductions_8th, grade, currentBasicValue, gpfPercent);
    const currentNet = currentGross - currentDeductions.total;

    // New (9th) Breakdown
    const newHouseRent = newBasicValue * houseRentRate9;
    const newGross = newBasicValue + newHouseRent + medical9 + tiffin9 + specialBenefit9 + childEduTotal9;
    const newDeductions = getDeductions(payscaleData.deductions_9th, grade, newBasicValue, gpfPercent);
    const newNet = newGross - newDeductions.total;

    const increaseAmt = newNet - currentNet;
    const increasePct = (increaseAmt / currentNet) * 100;

    calculatedResult = {
      current: {
        basic: currentBasicValue,
        houseRent: currentHouseRent,
        medical: medical8,
        tiffin: tiffin8,
        specialBenefit: specialBenefit8,
        childEdu: childEduTotal8,
        gross: currentGross,
        deductions: currentDeductions,
        net: currentNet
      },
      proposed: {
        basic: newBasicValue,
        houseRent: newHouseRent,
        medical: medical9,
        tiffin: tiffin9,
        specialBenefit: specialBenefit9,
        childEdu: childEduTotal9,
        gross: newGross,
        deductions: newDeductions,
        net: newNet
      },
      increaseAmount: increaseAmt,
      increasePercent: increasePct
    };
  }
</script>

<div class="max-w-4xl mx-auto flex flex-col gap-8">
  {#if loading}
    <div class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
    </div>
  {:else if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-3xl p-8 text-center">
      <div class="text-4xl mb-4">⚠️</div>
      <h3 class="text-lg font-bold text-red-600 dark:text-red-400 mb-4">{t.error}</h3>
      <button on:click={fetchPayScaleData} class="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors">
        {t.retry}
      </button>
    </div>
  {:else}
    <!-- Disclaimer -->
    <div class="bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 rounded-2xl p-4 md:p-5 shadow-sm">
      <div class="flex items-start gap-3">
        <span class="text-amber-500 mt-0.5">ℹ️</span>
        <p class="text-amber-800 dark:text-amber-200/80 text-sm md:text-base font-medium leading-relaxed">
          {payscaleData?.disclaimer?.[lang] || t.desc}
        </p>
      </div>
    </div>

    <!-- Calculator Card -->
    <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-10 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
      <!-- Glow -->
      <div class="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 blur-3xl pointer-events-none"></div>

      <div class="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Grade -->
        <div class="flex flex-col gap-2">
          <label for="grade-select" class="text-sm font-bold text-slate-700 dark:text-slate-300">{t.grade}</label>
          <div class="relative">
            <select
              id="grade-select"
              value={selectedGrade}
              on:change={handleGradeChange}
              class="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            >
              {#each Array(20) as _, i}
                <option value={i + 1}>{lang === 'bn' ? 'গ্রেড ' + fmtNum(i + 1) : 'Grade ' + (i + 1)}</option>
              {/each}
            </select>
            <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        <!-- Current Basic -->
        <div class="flex flex-col gap-2">
          <label for="basic-input" class="text-sm font-bold text-slate-700 dark:text-slate-300">{t.currentBasic}</label>
          <input
            id="basic-input"
            type="text"
            inputmode="numeric"
            value={fmtDisplay(currentBasic)}
            on:input={(e) => handleLocalizedInput(e, lang, v => currentBasic = v)}
            class="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        <!-- GPF Percent -->
        <div class="flex flex-col gap-2">
          <label for="gpf-input" class="text-sm font-bold text-slate-700 dark:text-slate-300">{t.gpfDesc}</label>
          <input
            id="gpf-input"
            type="text"
            inputmode="numeric"
            value={fmtDisplay(gpfPercent)}
            on:input={(e) => handleLocalizedInput(e, lang, v => gpfPercent = v)}
            class="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        <!-- Location -->
        <div class="flex flex-col gap-2 md:col-span-3">
          <div class="text-sm font-bold text-slate-700 dark:text-slate-300">{t.location}</div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors">
              <input type="radio" bind:group={location} value="dhaka_city_corp" class="w-4 h-4 text-blue-600" />
              <span class="text-sm font-semibold text-slate-700 dark:text-slate-300">{t.locDhaka}</span>
            </label>
            <label class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors">
              <input type="radio" bind:group={location} value="other_city_corp" class="w-4 h-4 text-blue-600" />
              <span class="text-sm font-semibold text-slate-700 dark:text-slate-300">{t.locCityCorp}</span>
            </label>
            <label class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors">
              <input type="radio" bind:group={location} value="district_upazila" class="w-4 h-4 text-blue-600" />
              <span class="text-sm font-semibold text-slate-700 dark:text-slate-300">{t.locOther}</span>
            </label>
          </div>
        </div>

        <!-- Children -->
        <div class="flex flex-col gap-2 md:col-span-3">
          <div class="text-sm font-bold text-slate-700 dark:text-slate-300">{t.children}</div>
          <div class="flex gap-4">
            {#each [0, 1, 2] as c}
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" bind:group={childrenCount} value={c} class="w-4 h-4 text-blue-600" />
                <span class="text-sm font-bold text-slate-700 dark:text-slate-300">{fmtNum(c)}{c === 2 ? '+' : ''}</span>
              </label>
            {/each}
          </div>
        </div>
      </div>

      <button
        on:click={calculate}
        class="w-full relative z-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all"
      >
        {t.calcButton}
      </button>
    </div>

    {#if calculatedResult}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
        <!-- Current Salary Card -->
        <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 border border-slate-200/50 dark:border-slate-800/50 shadow-xl relative overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <h3 class="text-lg font-bold text-slate-500 dark:text-slate-400 mb-6 uppercase tracking-wider">{t.currentTitle}</h3>
          
          <div class="flex flex-col gap-4 relative z-10">
            <div class="flex justify-between items-center text-sm font-medium text-slate-600 dark:text-slate-400">
              <span>{t.basic}</span>
              <span class="text-base font-bold text-slate-900 dark:text-white">৳ {formatMoney(calculatedResult.current.basic)}</span>
            </div>
            <div class="flex justify-between items-center text-sm font-medium text-slate-600 dark:text-slate-400">
              <span>{t.houseRent}</span>
              <span class="text-base font-bold text-slate-900 dark:text-white">৳ {formatMoney(calculatedResult.current.houseRent)}</span>
            </div>
            <div class="flex justify-between items-center text-sm font-medium text-slate-600 dark:text-slate-400">
              <span>{t.medical}</span>
              <span class="text-base font-bold text-slate-900 dark:text-white">৳ {formatMoney(calculatedResult.current.medical)}</span>
            </div>
            {#if calculatedResult.current.tiffin > 0}
              <div class="flex justify-between items-center text-sm font-medium text-slate-600 dark:text-slate-400">
                <span>{t.tiffin}</span>
                <span class="text-base font-bold text-slate-900 dark:text-white">৳ {formatMoney(calculatedResult.current.tiffin)}</span>
              </div>
            {/if}
            {#if calculatedResult.current.specialBenefit > 0}
              <div class="flex justify-between items-center text-sm font-medium text-slate-600 dark:text-slate-400">
                <span>{t.specialBenefit}</span>
                <span class="text-base font-bold text-slate-900 dark:text-white">৳ {formatMoney(calculatedResult.current.specialBenefit)}</span>
              </div>
            {/if}
            {#if childrenCount > 0}
              <div class="flex justify-between items-center text-sm font-medium text-slate-600 dark:text-slate-400">
                <span>{t.childEdu}</span>
                <span class="text-base font-bold text-slate-900 dark:text-white">৳ {formatMoney(calculatedResult.current.childEdu)}</span>
              </div>
            {/if}
            
            <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50 flex justify-between items-center">
              <span class="font-bold text-slate-800 dark:text-slate-200">{t.totalGross}</span>
              <span class="text-xl font-black text-slate-900 dark:text-white">৳ {formatMoney(calculatedResult.current.gross)}</span>
            </div>

            {#if calculatedResult.current.deductions.total > 0}
              <div class="mt-2 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700/50">
                <div class="text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-wider mb-3">{t.deductions}</div>
                {#if calculatedResult.current.deductions.gpf > 0}
                  <div class="flex justify-between items-center text-sm font-medium text-slate-500 dark:text-slate-500 mb-2">
                    <span>{t.gpf}</span>
                    <span class="text-red-500 dark:text-red-400 font-bold">-৳ {formatMoney(calculatedResult.current.deductions.gpf)}</span>
                  </div>
                {/if}
                {#if calculatedResult.current.deductions.jointInsurance > 0}
                  <div class="flex justify-between items-center text-sm font-medium text-slate-500 dark:text-slate-500 mb-2">
                    <span>{t.jointInsurance}</span>
                    <span class="text-red-500 dark:text-red-400 font-bold">-৳ {formatMoney(calculatedResult.current.deductions.jointInsurance)}</span>
                  </div>
                {/if}
                {#if calculatedResult.current.deductions.welfareFund > 0}
                  <div class="flex justify-between items-center text-sm font-medium text-slate-500 dark:text-slate-500 mb-2">
                    <span>{t.welfareFund}</span>
                    <span class="text-red-500 dark:text-red-400 font-bold">-৳ {formatMoney(calculatedResult.current.deductions.welfareFund)}</span>
                  </div>
                {/if}
                {#if calculatedResult.current.deductions.stampDuty > 0}
                  <div class="flex justify-between items-center text-sm font-medium text-slate-500 dark:text-slate-500 mb-2">
                    <span>{t.stampDuty}</span>
                    <span class="text-red-500 dark:text-red-400 font-bold">-৳ {formatMoney(calculatedResult.current.deductions.stampDuty)}</span>
                  </div>
                {/if}
              </div>
            {/if}

            <div class="mt-2 pt-4 border-t-2 border-slate-300 dark:border-slate-600 flex justify-between items-center">
              <span class="font-bold text-slate-800 dark:text-slate-200">{t.netPay}</span>
              <span class="text-2xl font-black bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">৳ {formatMoney(calculatedResult.current.net)}</span>
            </div>
          </div>
        </div>

        <!-- Proposed Salary Card -->
        <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 border border-emerald-200/50 dark:border-emerald-800/30 shadow-xl relative overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <h3 class="text-lg font-bold text-emerald-600 dark:text-emerald-500 mb-6 uppercase tracking-wider">{t.newTitle}</h3>
          
          <div class="flex flex-col gap-4 relative z-10">
            <div class="flex justify-between items-center text-sm font-medium text-slate-600 dark:text-slate-400">
              <span>{t.basic}</span>
              <span class="text-base font-bold text-slate-900 dark:text-white">৳ {formatMoney(calculatedResult.proposed.basic)}</span>
            </div>
            <div class="flex justify-between items-center text-sm font-medium text-slate-600 dark:text-slate-400">
              <span>{t.houseRent}</span>
              <span class="text-base font-bold text-slate-900 dark:text-white">৳ {formatMoney(calculatedResult.proposed.houseRent)}</span>
            </div>
            <div class="flex justify-between items-center text-sm font-medium text-slate-600 dark:text-slate-400">
              <span>{t.medical}</span>
              <span class="text-base font-bold text-slate-900 dark:text-white">৳ {formatMoney(calculatedResult.proposed.medical)}</span>
            </div>
            {#if calculatedResult.proposed.tiffin > 0}
              <div class="flex justify-between items-center text-sm font-medium text-slate-600 dark:text-slate-400">
                <span>{t.tiffin}</span>
                <span class="text-base font-bold text-slate-900 dark:text-white">৳ {formatMoney(calculatedResult.proposed.tiffin)}</span>
              </div>
            {/if}
            {#if calculatedResult.proposed.specialBenefit > 0}
              <div class="flex justify-between items-center text-sm font-medium text-slate-600 dark:text-slate-400">
                <span>{t.specialBenefit}</span>
                <span class="text-base font-bold text-slate-900 dark:text-white">৳ {formatMoney(calculatedResult.proposed.specialBenefit)}</span>
              </div>
            {/if}
            {#if childrenCount > 0}
              <div class="flex justify-between items-center text-sm font-medium text-slate-600 dark:text-slate-400">
                <span>{t.childEdu}</span>
                <span class="text-base font-bold text-slate-900 dark:text-white">৳ {formatMoney(calculatedResult.proposed.childEdu)}</span>
              </div>
            {/if}
            
            <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50 flex justify-between items-center">
              <span class="font-bold text-slate-800 dark:text-slate-200">{t.totalGross}</span>
              <span class="text-xl font-black text-slate-900 dark:text-white">৳ {formatMoney(calculatedResult.proposed.gross)}</span>
            </div>

            {#if calculatedResult.proposed.deductions.total > 0}
              <div class="mt-2 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700/50">
                <div class="text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-wider mb-3">{t.deductions}</div>
                {#if calculatedResult.proposed.deductions.gpf > 0}
                  <div class="flex justify-between items-center text-sm font-medium text-slate-500 dark:text-slate-500 mb-2">
                    <span>{t.gpf}</span>
                    <span class="text-red-500 dark:text-red-400 font-bold">-৳ {formatMoney(calculatedResult.proposed.deductions.gpf)}</span>
                  </div>
                {/if}
                {#if calculatedResult.proposed.deductions.jointInsurance > 0}
                  <div class="flex justify-between items-center text-sm font-medium text-slate-500 dark:text-slate-500 mb-2">
                    <span>{t.jointInsurance}</span>
                    <span class="text-red-500 dark:text-red-400 font-bold">-৳ {formatMoney(calculatedResult.proposed.deductions.jointInsurance)}</span>
                  </div>
                {/if}
                {#if calculatedResult.proposed.deductions.welfareFund > 0}
                  <div class="flex justify-between items-center text-sm font-medium text-slate-500 dark:text-slate-500 mb-2">
                    <span>{t.welfareFund}</span>
                    <span class="text-red-500 dark:text-red-400 font-bold">-৳ {formatMoney(calculatedResult.proposed.deductions.welfareFund)}</span>
                  </div>
                {/if}
                {#if calculatedResult.proposed.deductions.stampDuty > 0}
                  <div class="flex justify-between items-center text-sm font-medium text-slate-500 dark:text-slate-500 mb-2">
                    <span>{t.stampDuty}</span>
                    <span class="text-red-500 dark:text-red-400 font-bold">-৳ {formatMoney(calculatedResult.proposed.deductions.stampDuty)}</span>
                  </div>
                {/if}
              </div>
            {/if}

            <div class="mt-2 pt-4 border-t-2 border-emerald-300 dark:border-emerald-700 flex justify-between items-center">
              <span class="font-bold text-slate-800 dark:text-slate-200">{t.netPay}</span>
              <span class="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">৳ {formatMoney(calculatedResult.proposed.net)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Increase Banner -->
      <div class="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[2rem] p-6 md:p-8 text-white shadow-xl shadow-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in-up mt-2">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
            <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <div>
            <div class="text-emerald-100 font-bold tracking-wide uppercase text-sm mb-1">{t.increase}</div>
            <div class="text-3xl md:text-4xl font-black">৳ {formatMoney(calculatedResult.increaseAmount)}</div>
          </div>
        </div>
        <div class="bg-white text-emerald-600 px-6 py-3 rounded-xl font-black text-2xl shadow-sm">
          +{fmtNum(Math.round(calculatedResult.increasePercent))}%
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in-up {
    animation: fadeInUp 0.5s ease-out forwards;
  }
</style>
