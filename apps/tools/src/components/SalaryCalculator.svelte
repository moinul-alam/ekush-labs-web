<script>
  import { onMount } from "svelte";
  import { fmt as fmtLocalized } from "../utils/numbers";
  import { getLocalCache, setLocalCache } from "../utils/cache";

  export let lang = "bn";

  const dict = {
    bn: {
      title: "সরকারি বেতন ক্যালকুলেটর",
      desc: "বাংলাদেশ গেজেটে প্রকাশিত ৯ম জাতীয় বেতনস্কেল ২০২৬ এর ধাপ ও গেজেট ফিক্সেশন নিয়মে নির্ভুল হিসাব",
      devWarning:
        "এই অ্যাপটি ১৭ সেপ্টেম্বর ২০২৬ তারিখে প্রকাশিত ৯ম জাতীয় বেতনস্কেল গেজেট (এস.আর.ও. নং ৩৪৭-আইন/২০২৬) অনুযায়ী প্রস্তুতকৃত।",
      grade: "গ্রেড নির্বাচন করুন (১-২০)",
      currentBasicStep: "৩০/০৬/২০২৬ তারিখের মূল বেতন",
      stepLabel: "ধাপ",
      initialStep: "১ম ধাপ (প্রারম্ভিক)",
      location: "কর্মস্থল / বাসাভাড়ার এলাকা",
      locDhaka: "ঢাকা সিটি কর্পোরেশন (৫৫%)",
      locCityCorp: "অন্যান্য সিটি কর্পোরেশন (৪৫%)",
      locOther: "জেলা/উপজেলা বা অন্যান্য (৪০%)",
      calcButton: "বেতন হিসাব করুন",
      recalcButton: "পুনরায় হিসাব করুন",
      currentTitle: "বিদ্যমান বেতন কাঠামো (৮ম পে-স্কেল)",
      newTitle: "নতুন বেতন কাঠামো (৯ম পে-স্কেল)",
      existingScale: "বিদ্যমান বেতন কাঠামো",
      newScale: "নতুন বেতন কাঠামো",
      currentRunningTitle: "বর্তমানে চলমান বেতন কাঠামো",
      detailsBtn: "বিস্তারিত",
      basic: "মূল বেতন (Basic)",
      houseRent: "বাসা ভাড়া",
      medical: "চিকিৎসা ভাতা",
      tiffin: "টিফিন ভাতা",
      specialBenefit: "বিশেষ সুবিধা",
      totalGross: "মোট বেতন (Gross)",
      netPay: "প্রদেয় বেতন (Net Pay)",
      increase: "বেতন বৃদ্ধি",
      loading: "লোড হচ্ছে...",
      error: "তথ্য লোড করতে সমস্যা হয়েছে।",
      retry: "আবার চেষ্টা করুন",
      methodDiffTitle: "পার্থক্য যোগ পদ্ধতি",
      methodDiffSub: "Difference Addition Method",
      methodDiffDesc:
        "ইনক্রিমেন্ট-জনিত পার্থক্য যোগ করে নতুন স্কেলের মূল বেতন নির্ধারণ।",
      methodFactorTitle: "ইনক্রিমেন্ট ফ্যাক্টর পদ্ধতি",
      methodFactorSub: "Increment Factor Method",
      methodFactorDesc:
        "ইনক্রিমেন্ট অনুপাত গুণ করে নতুন স্কেলের মূল বেতন নির্ধারণ।",
      clickDetails: "বিস্তারিত জানতে ক্লিক করুন",
      closeDetails: "বন্ধ করুন",
      fixationFormula: "ফিক্সেশন সূত্র ও হিসাব প্রক্রিয়া",
      calculatedBasic: "গণনাকৃত মূল বেতন",
      fullProposedBasic: "নির্ধারিত সম্পূর্ণ মূল বেতন",
      phasesTitle: "বাস্তবায়ন ধাপভিত্তিক বেতন বিবরণী",
      phase1: "১ম ধাপ: ১ জুলাই ২০২৬ (৪০% বর্ধিত মূলবেতন)",
      phase1_10_20: "১ম ধাপ: ১ জুলাই ২০২৬ (৫০% বর্ধিত মূলবেতন)",
      phase2: "২য় ধাপ: ১ জানুয়ারি ২০২৭ (অতিরিক্ত ৩০% মূলবেতন)",
      phase2_10_20: "২য় ধাপ: ১ জানুয়ারি ২০২৭ (অতিরিক্ত ২৫% মূলবেতন)",
      phase3: "৩য় ধাপ: ১ জুলাই ২০২৭ (১০০% মূলবেতন + ১ ধাপ ইনক্রিমেন্ট)",
      phase4: "৪র্থ ধাপ: ১ জানুয়ারি ২০২৮ (সংশোধিত নতুন ভাতাসহ)",
      stepNotice:
        "গেজেট অনুচ্ছেদ ৫ অনুযায়ী: ৮ম স্কেলের প্রারম্ভিক হতে পার্থক্য ৯ম স্কেলের প্রারম্ভিক বেতনের সাথে যোগ করার পর যদি হুবহু কোনো ধাপের সমান না হয়, তবে পরবর্তী উচ্চতর ধাপে ফিক্সেশন হবে।",
      allowanceNotice:
        "১ জুলাই ২০২৬ থেকে নতুন (৯ম) স্কেলে এক ধাপ বার্ষিক ইনক্রিমেন্ট যুক্ত হবে। ৩য় ধাপে (১ জুলাই ২০২৭) আরও এক ধাপ ইনক্রিমেন্ট। ৪র্থ ধাপে (১ জানুয়ারি ২০২৮) নতুন গেজেটের গ্রেডভিত্তিক বাসাভাড়া হার (৪০%-৬০%), চিকিৎসা ভাতা (৩০০০/৪০০০), যাতায়াত (৬০০), মোবাইল ও অন্যান্য নতুন ভাতা কার্যকর হবে। ৯ম স্কেলে বিশেষ সুবিধা বিলুপ্ত।",
      julyIncrement9th: "৯ম স্কেলে জুলাই ইনক্রিমেন্ট (১ ধাপ)",
      currentStepInfo: "৮ম স্কেলের ধাপ",
      startingScale: "প্রারম্ভিক স্কেল",
      factorVal: "ফ্যাক্টর মান",
      diffVal: "পার্থক্য",
      phaseBasic: "মূল বেতন",
      phaseNetEst: "মোট প্রাপ্য বেতন",
      phaseIncBadge: "বৃদ্ধি",
      inputTitle: "বর্তমান বেতন সংক্রান্ত তথ্য",
      calcCompleted: "হিসাব সম্পন্ন",
      basicOnlyNotice:
        "১ম থেকে ৩য় ধাপে শুধু মূল বেতন বৃদ্ধি পাবে। ৯ম স্কেলে 'বিশেষ সুবিধা' বাতিল হবে। নতুন ভাতার হার ২০২৮ সালের জানুয়ারি থেকে কার্যকর হবে।",
      conveyance: "যাতায়াত ভাতা",
      mobile: "মোবাইল ভাতা",
      childEducation: "শিক্ষা সহায়ক ভাতা",
      gazetteElevationBadge: "গেজেট ধাপ ফিক্সেশন",
      candidateBasicLabel: "গণনাকৃত মূল",
      elevatedBasicLabel: "গেজেট নির্ধারিত মূল",
      ponjiTag: "অ্যান্ড্রয়েড অ্যাপ",
      ponjiTitle: "একুশ পঞ্জি - বাংলা ক্যালেন্ডার",
      ponjiDesc: "সম্পূর্ণ বাংলা ক্যালেন্ডার ও ছুটির তালিকা",
      ponjiBtn: "ডাউনলোড করুন",
    },
    en: {
      title: "Govt Salary Calculator",
      desc: "Accurate comparison and 4-phase implementation based on the 9th Pay Scale Gazette 2026",
      devWarning:
        "Prepared based on the officially published 9th National Pay Scale Gazette (S.R.O. No. 347-Law/2026).",
      grade: "Select Grade (1-20)",
      currentBasicStep: "Basic Pay as of 30/06/2026",
      stepLabel: "Step",
      initialStep: "1st Step (Starting)",
      location: "Workplace / House Rent Area",
      locDhaka: "Dhaka City Corporation (55%)",
      locCityCorp: "Other City Corporation (45%)",
      locOther: "District/Upazila or Other (40%)",
      calcButton: "Calculate Salary",
      recalcButton: "Recalculate",
      currentTitle: "Existing Salary (8th Scale)",
      newTitle: "New Salary (9th Scale)",
      existingScale: "Existing Pay Scale",
      newScale: "New Pay Scale",
      currentRunningTitle: "Currently Running Pay Scale",
      detailsBtn: "Details",
      basic: "Basic Salary",
      houseRent: "House Rent",
      medical: "Medical Allowance",
      tiffin: "Tiffin Allowance",
      specialBenefit: "Special Benefit",
      totalGross: "Total Gross Salary",
      netPay: "Net Pay",
      increase: "Net Increase",
      loading: "Loading...",
      error: "Failed to load data.",
      retry: "Retry",
      methodDiffTitle: "Difference Addition Method",
      methodDiffSub: "পার্থক্য যোগ পদ্ধতি",
      methodDiffDesc:
        "Calculates new basic salary by adding increment difference to new starting scale.",
      methodFactorTitle: "Increment Factor Method",
      methodFactorSub: "ইনক্রিমেন্ট ফ্যাক্টর পদ্ধতি",
      methodFactorDesc:
        "Calculates new basic salary by multiplying increment factor with new starting basic.",
      clickDetails: "Click for calculation details",
      closeDetails: "Close details",
      fixationFormula: "Fixation Formula & Calculation Breakdown",
      calculatedBasic: "Calculated Basic Salary",
      fullProposedBasic: "Full Proposed Basic Salary",
      phasesTitle: "Phase-wise Salary Breakdown",
      phase1: "Phase 1: 1 July 2026 (40% Basic Increase)",
      phase1_10_20: "Phase 1: 1 July 2026 (50% Basic Increase)",
      phase2: "Phase 2: 1 January 2027 (Additional 30% Basic Increase)",
      phase2_10_20: "Phase 2: 1 January 2027 (Additional 25% Basic Increase)",
      phase3: "Phase 3: 1 July 2027 (100% Basic + 1 Increment Step)",
      phase4: "Phase 4: 1 January 2028 (With Revised Allowances)",
      stepNotice:
        "Per Gazette Rule 5: Candidate basic is elevated to the immediate next higher official step in the 9th scale if it does not match an exact step.",
      allowanceNotice:
        "From 1 July 2026, one annual increment step applies on the new (9th) pay scale. Phase 3 (1 July 2027) adds another increment step. Phase 4 (1 Jan 2028) applies new gazetted allowances. Special benefit is abolished in 9th scale.",
      julyIncrement9th: "July increment on 9th scale (1 step)",
      currentStepInfo: "8th Scale Step",
      startingScale: "Starting Scale",
      factorVal: "Factor Value",
      diffVal: "Difference",
      phaseBasic: "Basic Pay",
      phaseNetEst: "Total Salary",
      phaseIncBadge: "Increase",
      inputTitle: "Salary Parameters Selection",
      calcCompleted: "Calculated",
      basicOnlyNotice:
        "In phases 1 to 3, only the basic salary increases. Special benefit is abolished in 9th scale.",
      conveyance: "Conveyance Allowance",
      mobile: "Mobile Allowance",
      childEducation: "Child Education Allowance",
      gazetteElevationBadge: "Gazette Step Fixation",
      candidateBasicLabel: "Candidate Basic",
      elevatedBasicLabel: "Gazette Fixed Basic",
      ponjiTag: "Android App",
      ponjiTitle: "Ekush Ponji - Bangla Calendar",
      ponjiDesc: "Complete Bangla calendar with holidays",
      ponjiBtn: "Download",
    },
  };

  $: t = dict[lang];

  let loading = true;
  let error = false;

  let payscaleData = null;
  let selectedGrade = 9;
  let selectedStepIndex = 0; // Default to 1st step (Starting basic ৳22,000 in Grade 9)
  let location = "dhaka_city_corp";
  let hasChildrenCount = 0; // 0, 1, or 2 children
  let isAgeOver50 = false; // Medical allowance 4000 if > 50

  let showDiffTooltip = false;
  let showRunningModal = false;

  let calculatedResult = null;

  function fmtNum(n) {
    if (lang === "en") return n.toString();
    return n.toString().replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
  }

  function formatMoney(amount) {
    if (isNaN(amount) || amount === null || amount === undefined) return "0";
    const rounded = Math.round(amount);
    const formatted = rounded.toString();
    if (lang === "en") return new Intl.NumberFormat("en-US").format(rounded);

    // Custom Bengali comma separation (lakh/crore system: 12,34,567)
    let parts = formatted.split(".");
    let num = parts[0];
    if (num.length > 3) {
      num =
        num.substring(0, num.length - 3).replace(/\B(?=(\d{2})+(?!\d))/g, ",") +
        "," +
        num.substring(num.length - 3);
    }
    num = num.replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
    return num;
  }

  // Reactive steps list for currently selected grade in 8th scale
  $: currentGradeData = payscaleData?.grades?.find(
    (g) => g.grade === selectedGrade,
  );
  $: current8thSteps = currentGradeData?.scale_8th?.steps || [];
  $: currentBasicValue =
    current8thSteps[selectedStepIndex] !== undefined
      ? current8thSteps[selectedStepIndex]
      : current8thSteps[0] || 0;

  const PAYSCALES_CACHE_KEY = "ekush_hub_payscales_combined";

  async function fetchPayScaleData(silent = false) {
    if (!silent) {
      loading = true;
      error = false;
    }
    try {
      let manifestRes;
      try {
        manifestRes = await fetch(
          "https://hub.ekushlabs.com/payscales/manifest.json",
        );
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
          if (text.startsWith("<!"))
            throw new Error("Received HTML instead of JSON");
          manifest = JSON.parse(text);
        } else {
          try {
            manifest = (
              await import("../../../../apps/hub/payscales/manifest.json")
            ).default;
          } catch (e) {
            throw new Error("Failed to load manifest");
          }
        }
      }

      const baseUrl = manifest.baseUrl || "https://hub.ekushlabs.com/payscales";
      const file8th =
        manifest.datasets?.payscales?.files?.["8th"] || "pay_scale_8th.json";
      const file9th =
        manifest.datasets?.payscales?.files?.["9th"] || "pay_scale_9th.json";

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
        if (!data8th) {
          data8th = (
            await import("../../../../apps/hub/payscales/pay_scale_8th.json")
          ).default;
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
        if (!data9th) {
          data9th = (
            await import("../../../../apps/hub/payscales/pay_scale_9th.json")
          ).default;
        }
      }

      if (!data8th || !data9th)
        throw new Error("Failed to load pay scale data");

      // Combine into unified structure
      const grades = [];
      for (let i = 0; i < 20; i++) {
        const g8 = data8th.grades.find((g) => g.grade === i + 1);
        const g9 = data9th.grades.find((g) => g.grade === i + 1);
        if (g8 && g9) {
          grades.push({
            grade: i + 1,
            scale_8th: g8,
            scale_9th: g9,
          });
        }
      }

      payscaleData = {
        meta_8th: data8th.meta || {},
        meta_9th: data9th.meta || {},
        allowances_8th: data8th.allowances,
        allowances_9th: data9th.allowances,
        disclaimer: {
          bn: data9th.meta?.disclaimer_bn || data8th.meta?.disclaimer_bn,
          en: data9th.meta?.disclaimer_en || data8th.meta?.disclaimer_en,
        },
        grades,
      };

      setLocalCache(PAYSCALES_CACHE_KEY, payscaleData);
      selectedStepIndex = 0;
    } catch (e) {
      console.error("[Salary Calculator] Data fetch failed:", e);
      if (!payscaleData) {
        error = true;
      }
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    // 1. Instant cache hydration (0ms load!)
    const cached = getLocalCache(PAYSCALES_CACHE_KEY, 24 * 3600 * 1000);
    if (cached?.data) {
      payscaleData = cached.data;
      loading = false;
    }

    // 2. Background revalidation if stale or missing
    if (!cached?.isFresh) {
      fetchPayScaleData(!!cached?.data);
    }
  });

  function handleGradeChange(e) {
    selectedGrade = parseInt(e.target.value);
    selectedStepIndex = 0;
    if (calculatedResult) {
      calculate();
    }
  }

  function handleStepChange(e) {
    selectedStepIndex = parseInt(e.target.value);
    if (calculatedResult) {
      calculate();
    }
  }

  // Special benefit (Only applicable in 8th Pay Scale):
  // 10% for grades 1-9 (min 1500), 15% for grades 10-20 (min 1500)
  function getSpecialBenefit(basic, grade) {
    if (grade >= 1 && grade <= 9) {
      return Math.max(basic * 0.1, 1500);
    } else if (grade >= 10 && grade <= 20) {
      return Math.max(basic * 0.15, 1500);
    }
    return 0;
  }

  function getTiffin(allowances, grade) {
    if (!allowances || !allowances.tiffin) return 0;
    const tiffin = allowances.tiffin;
    if (tiffin.grades) {
      const [minG, maxG] = tiffin.grades;
      if (grade >= minG && grade <= maxG) return tiffin.amount;
      return 0;
    }
    return tiffin.amount || 0;
  }

  // Calculate gross salary breakdown (no deductions)
  // For 8th scale breakdown (where special benefit is active)
  function compute8thBreakdown(basicVal, grade) {
    const allowances = payscaleData.allowances_8th;
    const houseRentRate = allowances.house_rent[location] || 0.55;
    const houseRent = basicVal * houseRentRate;
    const medical = allowances.medical.amount;
    const tiffin = getTiffin(allowances, grade);
    const specialBenefit = getSpecialBenefit(basicVal, grade);

    const gross = basicVal + houseRent + medical + tiffin + specialBenefit;

    return {
      basic: basicVal,
      houseRent,
      medical,
      tiffin,
      specialBenefit,
      gross,
      net: gross,
    };
  }

  // 4 Phased implementation:
  // User Rules:
  // Increased Basic = New Calculated Basic - Old Basic
  // Phase 1 (1 July 2026): Old Basic + (Increased Basic * 40% [Grades 1-9] or 50% [Grades 10-20])
  // Phase 2 (1 Jan 2027): Phase 1 Basic + (Increased Basic * 30% [Grades 1-9] or 25% [Grades 10-20])
  // From 1 July 2026: one increment on the newly fixed 9th-scale step (next official step).
  // Phase 3 (1 July 2027): 100% of that target basic + one more 9th-scale increment step.
  //                       House Rent is calculated based on 5% increment on existing 8th basic fixed to same/nearest step.
  // Phase 4 (1 Jan 2028): Same basic as Phase 3 + 9th Scale Revised Allowances
  //
  // Important Rules for 9th scale phases:
  // 1. 'বিশেষ সুবিধা' (Special Benefit) is ABOLISHED once 9th pay scale takes effect.
  // 2. Allowances (House Rent, Medical, Tiffin) in Phases 1 and 2 remain at current 8th pay scale amounts.
  // 3. In Phase 3 (1 July 2027), one 9th-scale increment step is added, and house rent is updated based on 8th scale post-increment basic.
  function nextGazetteStep(steps, basic) {
    const idx = steps.indexOf(basic);
    if (idx !== -1 && idx + 1 < steps.length) return steps[idx + 1];
    const nextHigher = steps.find((s) => s > basic);
    if (nextHigher !== undefined) return nextHigher;
    return Math.round(basic * 1.05);
  }

  function computeJulyRunningBreakdown(july9thBasic, current8thBreakdown) {
    const { houseRent, medical, tiffin } = current8thBreakdown;
    const gross = july9thBasic + houseRent + medical + tiffin;
    return {
      basic: july9thBasic,
      houseRent,
      medical,
      tiffin,
      specialBenefit: 0,
      gross,
      net: gross,
    };
  }

  function calculate4Phases(
    newCalculatedBasic,
    current8thBasic,
    grade,
    current8thBreakdown,
    steps8th,
    steps9th,
  ) {
    const isHigherGrade = grade <= 9;
    const phaseRates = isHigherGrade ? [0.4, 0.3, 0.3] : [0.5, 0.25, 0.25];
    const increasedBasic = Math.max(0, newCalculatedBasic - current8thBasic);

    // Cumulative basic additions for Phases 1 & 2
    const phase1Basic = current8thBasic + increasedBasic * phaseRates[0];
    const phase2Basic = phase1Basic + increasedBasic * phaseRates[1];

    // Phase 3 Basic: 100% target (incl. July 2026 increment on 9th scale) + one 9th-scale step (July 2027)
    const phase3Basic = nextGazetteStep(steps9th, newCalculatedBasic);
    const phase4Basic = phase3Basic;

    // Fixed 8th scale allowances for Phases 1 & 2
    const p12HouseRent = current8thBreakdown.houseRent;
    const p12Medical = current8thBreakdown.medical;
    const p12Tiffin = current8thBreakdown.tiffin;
    const p12AllowancesTotal = p12HouseRent + p12Medical + p12Tiffin;

    // Phase 1 Total
    const p1Gross = phase1Basic + p12AllowancesTotal;

    // Phase 2 Total
    const p2Gross = phase2Basic + p12AllowancesTotal;

    // Phase 3 House Rent Calculation:
    // Existing 8th basic + 5% increment, fixed to next step in 8th scale, multiplied by house rent %
    const curr8thIdx = steps8th.indexOf(current8thBasic);
    const next8thBasic =
      curr8thIdx !== -1 && curr8thIdx + 1 < steps8th.length
        ? steps8th[curr8thIdx + 1]
        : Math.round(current8thBasic * 1.05);

    const allowances8th = payscaleData.allowances_8th;
    const houseRentRate8th = allowances8th.house_rent[location] || 0.55;
    const p3HouseRent = next8thBasic * houseRentRate8th;
    const p3Medical = p12Medical;
    const p3Tiffin = p12Tiffin;
    const p3Gross = phase3Basic + p3HouseRent + p3Medical + p3Tiffin;

    // Phase 4 Total (Revised 9th scale allowances per official Gazette take effect)
    const allowances9th = payscaleData.allowances_9th;
    
    // Gazette Rule 15: House Rent by Grade Brackets
    // 16-20: Dhaka 60%, Other City Corp 50%, District/Upazila 45%
    // 10-15: Dhaka 50%, Other City Corp 40%, District/Upazila 35%
    // 5-9:   Dhaka 45%, Other City Corp 35%, District/Upazila 30%
    // 1-4:   Dhaka 40%, Other City Corp 30%, District/Upazila 25%
    let p4HouseRentRate = 0.45;
    if (grade >= 16 && grade <= 20) {
      p4HouseRentRate = location === "dhaka_city_corp" ? 0.60 : location === "other_city_corp" ? 0.50 : 0.45;
    } else if (grade >= 10 && grade <= 15) {
      p4HouseRentRate = location === "dhaka_city_corp" ? 0.50 : location === "other_city_corp" ? 0.40 : 0.35;
    } else if (grade >= 5 && grade <= 9) {
      p4HouseRentRate = location === "dhaka_city_corp" ? 0.45 : location === "other_city_corp" ? 0.35 : 0.30;
    } else {
      p4HouseRentRate = location === "dhaka_city_corp" ? 0.40 : location === "other_city_corp" ? 0.30 : 0.25;
    }
    const p4HouseRent = phase4Basic * p4HouseRentRate;
    
    // Gazette Rule 13: Medical Allowance (৳3,000 up to age 50, ৳4,000 above age 50)
    const p4Medical = isAgeOver50 ? 4000 : 3000;
    
    // Gazette Rule 19: Tiffin (৳500 for grades 11-20)
    const p4Tiffin = (grade >= 11 && grade <= 20) ? 500 : 0;
    
    // Gazette Rule 21: Conveyance (৳600 for grades 11-20 in City Corporation)
    const p4Conveyance = (grade >= 11 && grade <= 20 && location !== "district_upazila") ? 600 : 0;
    
    // Gazette Rule 22: Mobile (৳500 for grades 1-5, ৳150 for grades 6-20)
    const p4Mobile = grade <= 5 ? 500 : 150;
    
    // Gazette Rule 18: Child Education (৳500 per child, max 2 children)
    const p4Education = hasChildrenCount * 500;
    
    const p4Gross = phase4Basic + p4HouseRent + p4Medical + p4Tiffin + p4Conveyance + p4Mobile + p4Education;

    return [
      {
        phase: 1,
        title: isHigherGrade ? t.phase1 : t.phase1_10_20,
        badge: `${Math.round(phaseRates[0] * 100)}%`,
        basic: phase1Basic,
        houseRent: p12HouseRent,
        medical: p12Medical,
        tiffin: p12Tiffin,
        specialBenefit: 0,
        gross: p1Gross,
      },
      {
        phase: 2,
        title: isHigherGrade ? t.phase2 : t.phase2_10_20,
        badge: `${Math.round((phaseRates[0] + phaseRates[1]) * 100)}%`,
        basic: phase2Basic,
        houseRent: p12HouseRent,
        medical: p12Medical,
        tiffin: p12Tiffin,
        specialBenefit: 0,
        gross: p2Gross,
      },
      {
        phase: 3,
        title: t.phase3,
        badge: lang === "bn" ? "১০০% + ১ ধাপ" : "100% + 1 step",
        basic: phase3Basic,
        houseRent: p3HouseRent,
        medical: p3Medical,
        tiffin: p3Tiffin,
        specialBenefit: 0,
        gross: p3Gross,
      },
      {
        phase: 4,
        title: t.phase4,
        badge: lang === "bn" ? "সংশোধিত ভাতা" : "Allowances",
        basic: phase4Basic,
        houseRent: p4HouseRent,
        medical: p4Medical,
        tiffin: p4Tiffin,
        conveyance: p4Conveyance,
        mobile: p4Mobile,
        education: p4Education,
        specialBenefit: 0,
        gross: p4Gross,
      },
    ];
  }

  function calculate() {
    if (!payscaleData) return;

    const gradeData = payscaleData.grades.find((g) => g.grade == selectedGrade);
    if (!gradeData) return;

    const steps8th = gradeData.scale_8th.steps;
    const steps9th = gradeData.scale_9th.steps;

    const start8th = steps8th[0];
    const start9th = steps9th[0];

    const currentBasicVal = steps8th[selectedStepIndex] || steps8th[0];
    const grade = selectedGrade;

    // Gazette Rule 5 (অনুচ্ছেদ ৫): ৯ম জাতীয় বেতনস্কেলে বেতন নির্ধারণ
    // (ক) ও (খ) পার্থক্য = বর্তমান মূল বেতন - ৮ম স্কেলের প্রারম্ভিক ধাপ
    // পদাধিকার প্রাপ্ত প্রার্থী বেসিক = ৯ম স্কেলের প্রারম্ভিক ধাপ + পার্থক্য
    // যদি ইহা কোন ধাপের হুবহু সমান না হয়, তবে পরবর্তী উচ্চতর ধাপে ফিক্সেশন হইবে।
    const diff = Math.max(0, currentBasicVal - start8th);
    const rawCandidateBasic = start9th + diff;
    
    // Find matching or next higher step in 9th pay scale gazetted steps
    let fixedGazetteBasic = rawCandidateBasic;
    let matchingStepIndex = steps9th.indexOf(rawCandidateBasic);
    let elevated = false;
    
    if (matchingStepIndex !== -1) {
      fixedGazetteBasic = steps9th[matchingStepIndex];
    } else {
      const nextHigher = steps9th.find((s) => s >= rawCandidateBasic);
      if (nextHigher !== undefined) {
        fixedGazetteBasic = nextHigher;
        elevated = true;
      } else {
        fixedGazetteBasic = steps9th[steps9th.length - 1];
      }
    }

    // Current 8th breakdown (Gross & Allowances including special benefit in 8th scale)
    const current = compute8thBreakdown(currentBasicVal, grade);

    // One increment on the new 9th pay scale effective 1 July 2026 (next gazette step after fixation)
    const july9thIncrementBasic = nextGazetteStep(steps9th, fixedGazetteBasic);
    const julyIdx9th = steps9th.indexOf(july9thIncrementBasic);
    const july9thStepIndex = julyIdx9th !== -1 ? julyIdx9th + 1 : null;

    // 4 Phased rollout toward basic after July 2026 increment on 9th scale
    const diffPhases = calculate4Phases(
      july9thIncrementBasic,
      currentBasicVal,
      grade,
      current,
      steps8th,
      steps9th,
    );

    const runningBreakdown = computeJulyRunningBreakdown(
      july9thIncrementBasic,
      current,
    );

    const stepIndex9th = steps9th.indexOf(fixedGazetteBasic) !== -1 ? steps9th.indexOf(fixedGazetteBasic) + 1 : null;

    calculatedResult = {
      grade,
      stepIndex: selectedStepIndex + 1,
      totalSteps: steps8th.length,
      start8th,
      start9th,
      stepIndex9th,
      diff,
      rawCandidateBasic,
      fixedGazetteBasic,
      july9thIncrementBasic,
      july9thStepIndex,
      elevated,
      current,
      running: runningBreakdown,
      runningStepIndex: july9thStepIndex,
      methods: {
        difference: {
          calcBasic: july9thIncrementBasic,
          rawCalcBasic: rawCandidateBasic,
          increasedBasic: july9thIncrementBasic - currentBasicVal,
          phases: diffPhases,
        },
      },
    };
  }
</script>

<div class="max-w-6xl mx-auto flex flex-col gap-6">
  <!-- Status & Disclaimer Banner -->
  <div
    class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/60 dark:border-blue-800/40 rounded-2xl p-4 md:p-5 shadow-sm"
  >
    <div class="flex items-center gap-3">
      <span class="text-blue-600 dark:text-blue-400 text-lg shrink-0">ℹ️</span>
      <div
        class="text-xs md:text-sm font-medium text-blue-900 dark:text-blue-200 leading-relaxed"
      >
        <span>
          {lang === "bn"
            ? "এই অ্যাপটি ১৭ সেপ্টেম্বর ২০২৬ তারিখে প্রকাশিত ৯ম জাতীয় বেতনস্কেল গেজেট (এস.আর.ও. নং ৩৪৭-আইন/২০২৬) অনুযায়ী প্রস্তুতকৃত"
            : "This tool is prepared according to the 9th National Pay Scale Gazette published on 17 September 2026 (S.R.O. No. 347-Law/2026)"}
        </span>
        (<a
          href="https://mof.gov.bd/pages/notices/%E0%A6%B8%E0%A6%B0%E0%A6%95%E0%A6%BE%E0%A6%B0%E0%A6%BF-%E0%A6%9A%E0%A6%BE%E0%A6%95%E0%A7%81%E0%A6%B0%E0%A6%BF-%E0%A6%AC%E0%A7%87%E0%A6%A4%E0%A6%A8-%E0%A6%93-%E0%A6%AD%E0%A6%BE%E0%A6%A4%E0%A6%BF%E0%A6%A6%E0%A6%BF-%E0%A6%86%E0%A6%A6%E0%A7%87%E0%A6%B6-%E0%A7%A8%E0%A7%A6%E0%A7%A8%E0%A7%AC-llovuq-6aae43362e7225b38ad2a554"
          target="_blank"
          rel="noopener noreferrer"
          class="font-bold text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300"
        >{lang === "bn" ? "লিংক" : "Link"}</a>)
      </div>
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-24">
      <div
        class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"
      ></div>
    </div>
  {:else if error}
    <div
      class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-3xl p-8 text-center"
    >
      <div class="text-4xl mb-4">⚠️</div>
      <h3 class="text-lg font-bold text-red-600 dark:text-red-400 mb-4">
        {t.error}
      </h3>
      <button
        on:click={fetchPayScaleData}
        class="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
      >
        {t.retry}
      </button>
    </div>
  {:else}
    <!-- Top Row: Entry Box Stays on Left, Existing + New Pay Scale Widgets on Right -->
    <div
      class="grid grid-cols-1 {calculatedResult
        ? 'lg:grid-cols-12'
        : 'max-w-2xl mx-auto w-full'} gap-6 items-stretch transition-all duration-500"
    >
      <!-- Entry Box / Form Card (Always on the LEFT when viewed) -->
      <div
        class="{calculatedResult
          ? 'lg:col-span-6'
          : 'w-full'} bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-slate-200/70 dark:border-slate-800/70 shadow-xl relative overflow-hidden flex flex-col justify-between transition-all duration-500"
      >
        <!-- Glow -->
        <div
          class="absolute top-0 right-0 -mr-24 -mt-24 w-80 h-80 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 blur-3xl pointer-events-none"
        ></div>

        <div
          class="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-slate-800 pb-3"
        >
          <h3
            class="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"
          >
            ⚙️ {t.inputTitle}
          </h3>
          {#if calculatedResult}
            <span
              class="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold px-2.5 py-1 rounded-md"
            >
              ✓ {t.calcCompleted}
            </span>
          {/if}
        </div>

        <div class="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <!-- Grade Selection -->
          <div class="flex flex-col gap-1.5">
            <label
              for="grade-select"
              class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
              >{t.grade}</label
            >
            <div class="relative">
              <select
                id="grade-select"
                value={selectedGrade}
                on:change={handleGradeChange}
                class="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer"
              >
                {#each Array(20) as _, i}
                  <option value={i + 1}
                    >{lang === "bn"
                      ? "গ্রেড " + fmtNum(i + 1)
                      : "Grade " + (i + 1)}</option
                  >
                {/each}
              </select>
              <div
                class="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  /></svg
                >
              </div>
            </div>
          </div>

          <!-- 8th Pay Scale Steps Dropdown (Accurate official gazette steps for selected Grade) -->
          <div class="flex flex-col gap-1.5">
            <label
              for="step-select"
              class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
              >{t.currentBasicStep}</label
            >
            <div class="relative">
              <select
                id="step-select"
                value={selectedStepIndex}
                on:change={handleStepChange}
                class="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer"
              >
                {#if current8thSteps.length > 0}
                  {#each current8thSteps as step, idx}
                    <option value={idx}>
                      {idx === 0
                        ? t.initialStep
                        : `${t.stepLabel} ${fmtNum(idx + 1)}`}: ৳ {formatMoney(
                        step,
                      )}
                    </option>
                  {/each}
                {/if}
              </select>
              <div
                class="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  /></svg
                >
              </div>
            </div>
          </div>

          <!-- Location Selection -->
          <div class="flex flex-col gap-1.5 sm:col-span-2">
            <div
              class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
            >
              {t.location}
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label
                class="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors {location ===
                'dhaka_city_corp'
                  ? 'ring-2 ring-blue-500/50 border-blue-500 bg-blue-50/40 dark:bg-blue-900/20'
                  : ''}"
              >
                <input
                  type="radio"
                  bind:group={location}
                  value="dhaka_city_corp"
                  class="w-3.5 h-3.5 text-blue-600"
                />
                <span
                  class="text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >{t.locDhaka}</span
                >
              </label>
              <label
                class="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors {location ===
                'other_city_corp'
                  ? 'ring-2 ring-blue-500/50 border-blue-500 bg-blue-50/40 dark:bg-blue-900/20'
                  : ''}"
              >
                <input
                  type="radio"
                  bind:group={location}
                  value="other_city_corp"
                  class="w-3.5 h-3.5 text-blue-600"
                />
                <span
                  class="text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >{t.locCityCorp}</span
                >
              </label>
              <label
                class="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors {location ===
                'district_upazila'
                  ? 'ring-2 ring-blue-500/50 border-blue-500 bg-blue-50/40 dark:bg-blue-900/20'
                  : ''}"
              >
                <input
                  type="radio"
                  bind:group={location}
                  value="district_upazila"
                  class="w-3.5 h-3.5 text-blue-600"
                />
                <span
                  class="text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >{t.locOther}</span
                >
              </label>
            </div>
          </div>

          <!-- Extra Gazette Parameters: Children count (Education allowance) & Age (Medical allowance) -->
          <div class="flex flex-col gap-1.5 sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <!-- Children count -->
              <div class="flex flex-col gap-1">
                <label for="child-count" class="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {lang === "bn" ? "সন্তান সংখ্যা (শিক্ষা সহায়ক ভাতা)" : "Children (Education Allowance)"}
                </label>
                <select
                  id="child-count"
                  bind:value={hasChildrenCount}
                  class="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                >
                  <option value={0}>{lang === "bn" ? "সন্তান নেই (৳ ০)" : "None (৳ 0)"}</option>
                  <option value={1}>{lang === "bn" ? "১ জন সন্তান (৳ ৫০০)" : "1 Child (৳ 500)"}</option>
                  <option value={2}>{lang === "bn" ? "২ জন বা ততোধিক সন্তান (৳ ১,০০০)" : "2 or more (৳ 1,000)"}</option>
                </select>
              </div>

              <!-- Age > 50 toggle -->
              <div class="flex flex-col gap-1">
                <span class="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {lang === "bn" ? "বয়সসীমা (চিকিৎসা ভাতা)" : "Age Limit (Medical Allowance)"}
                </span>
                <label class="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-blue-300 transition-colors h-[38px]">
                  <input
                    type="checkbox"
                    bind:checked={isAgeOver50}
                    class="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                  <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {lang === "bn" ? "বয়স ৫০ বছরের ঊর্ধ্বে (৳ ৪,০০০)" : "Age 50+ (৳ 4,000)"}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <button
          on:click={calculate}
          class="w-full relative z-10 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base md:text-lg py-3.5 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            /></svg
          >
          {calculatedResult ? t.recalcButton : t.calcButton}
        </button>

        <!-- Currently Running Pay Scale (Inside Left Card below button) -->
        {#if calculatedResult}
          <div class="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3 relative z-10 animate-fade-in">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                🏛️ {t.currentRunningTitle}
              </h4>
              <span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-xs font-bold">
                {lang === "bn" ? "৯ম স্কেল ধাপ " + fmtNum(calculatedResult.runningStepIndex) : "9th scale step " + calculatedResult.runningStepIndex}
              </span>
            </div>

            <div class="bg-slate-50/90 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200/70 dark:border-slate-700/60 flex flex-col gap-2.5 text-xs md:text-sm">
              <div class="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>{t.basic} ({lang === "bn" ? `ধাপ ${fmtNum(calculatedResult.runningStepIndex)}` : `Step ${calculatedResult.runningStepIndex}`}):</span>
                <span class="font-bold text-slate-900 dark:text-white">৳ {formatMoney(calculatedResult.running.basic)}</span>
              </div>

              <div class="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div class="flex flex-col">
                  <span class="font-bold text-slate-700 dark:text-slate-300 text-xs">{t.totalGross}</span>
                  <span class="text-base md:text-lg font-black text-blue-700 dark:text-blue-400">৳ {formatMoney(calculatedResult.running.gross)}</span>
                </div>
                <button
                  type="button"
                  on:click={() => (showRunningModal = true)}
                  class="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer"
                >
                  <span>ℹ️ {t.detailsBtn}</span>
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Right Column: New Pay Scale (9th Pay Scale) with Exact 7 items -->
      {#if calculatedResult}
        <div class="lg:col-span-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-blue-200/80 dark:border-blue-800/60 shadow-xl relative overflow-hidden flex flex-col justify-between animate-slide-right">
          <div class="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

          <div>
            <div class="flex items-center justify-between mb-5 border-b border-blue-100 dark:border-blue-950 pb-3">
              <div>
                <h3 class="text-base md:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  💎 {lang === "bn" ? "৯ম পে-স্কেল অনুযায়ী নতুন বেতন কাঠামোর বিস্তারিত" : "9th Pay Scale Detailed Salary Breakdown"}
                </h3>
                <p class="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                  {lang === "bn" ? `${fmtNum(calculatedResult.grade)} তম গ্রেডের ক্ষেত্রে` : `For Grade ${calculatedResult.grade}`}
                </p>
              </div>
              {#if calculatedResult.stepIndex9th}
                <span class="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold">
                  {lang === "bn" ? "ধাপ " + fmtNum(calculatedResult.stepIndex9th) : "Step " + calculatedResult.stepIndex9th}
                </span>
              {/if}
            </div>

            <div class="flex flex-col gap-2.5 relative z-10 text-xs md:text-sm">
              <!-- ১. ৩০/০৬/২০২৬ তারিখের মূল বেতন -->
              <div class="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>{lang === "bn" ? "৩০/০৬/২০২৬ তারিখের মূল বেতন" : "Basic on 30/06/2026"}</span>
                <span class="font-bold text-slate-900 dark:text-white">৳ {formatMoney(calculatedResult.current.basic)}</span>
              </div>

              <!-- ২. প্রারম্ভিক মূল বেতন -->
              <div class="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>{lang === "bn" ? "প্রারম্ভিক মূল বেতন" : "8th Starting Basic"}</span>
                <span class="font-semibold text-slate-900 dark:text-slate-200">৳ {formatMoney(calculatedResult.start8th)}</span>
              </div>

              <!-- ৩. ইনক্রিমেন্ট পার্থক্য -->
              <div class="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>{lang === "bn" ? "ইনক্রিমেন্ট পার্থক্য" : "Increment Difference"}</span>
                <span class="font-semibold text-slate-900 dark:text-slate-200">৳ {formatMoney(calculatedResult.diff)}</span>
              </div>

              <!-- ৪. ৯ম পে স্কেল অনুযায়ী মূল বেতন -->
              <div class="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>{lang === "bn" ? "৯ম পে স্কেল অনুযায়ী মূল বেতন" : "9th Starting Basic"}</span>
                <span class="font-semibold text-slate-900 dark:text-slate-200">৳ {formatMoney(calculatedResult.start9th)}</span>
              </div>

              <!-- ৫. নির্ধারিত মূল বেতন -->
              <div class="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>{lang === "bn" ? "নির্ধারিত মূল বেতন" : "Determined Basic"}</span>
                <span class="font-semibold text-slate-900 dark:text-slate-200">৳ {formatMoney(calculatedResult.rawCandidateBasic)}</span>
              </div>

              <!-- ৬. চূড়ান্ত মূল বেতন -->
              <div class="flex justify-between items-center text-slate-700 dark:text-slate-300 bg-blue-50/70 dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/60">
                <span class="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  {lang === "bn" ? "চূড়ান্ত মূল বেতন" : "Final Basic Pay"}
                  {#if calculatedResult.elevated}
                    <span class="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                      {t.gazetteElevationBadge}
                    </span>
                  {/if}
                </span>
                <span class="font-black text-blue-700 dark:text-blue-400 text-sm md:text-base">৳ {formatMoney(calculatedResult.fixedGazetteBasic)}</span>
              </div>

              <!-- জুলাই ২০২৬: ৯ম স্কেলে ১ ধাপ ইনক্রিমেন্ট -->
              <div class="flex justify-between items-center text-slate-600 dark:text-slate-400 bg-indigo-50/60 dark:bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                <span class="font-semibold text-slate-800 dark:text-slate-200">{t.julyIncrement9th}</span>
                <span class="font-bold text-indigo-700 dark:text-indigo-300">৳ {formatMoney(calculatedResult.july9thIncrementBasic)}</span>
              </div>

              <!-- ৭. মূল বেতন নিট বৃদ্ধি -->
              <div class="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span class="font-semibold">{lang === "bn" ? "মূল বেতন নিট বৃদ্ধি" : "Basic Net Increase"}</span>
                <span class="font-black text-emerald-600 dark:text-emerald-400 text-sm md:text-base">+ ৳ {formatMoney(calculatedResult.methods.difference.increasedBasic)}</span>
              </div>

              <!-- বাস্তবায়ন ধাপ (শতকরা হার) -->
              <div class="mt-1 pt-2.5 border-t border-slate-200/70 dark:border-slate-800/80 flex flex-col gap-1.5">
                <div class="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {lang === "bn" ? "বাস্তবায়ন ধাপ:" : "Implementation Steps:"}
                </div>
                <div class="flex flex-col gap-1.5 text-xs">
                  <div class="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-xl px-3 py-1.5 flex justify-between items-center">
                    <span class="text-slate-600 dark:text-slate-400 font-medium">{lang === "bn" ? "০১/০৭/২০২৬ কার্যকর:" : "01/07/2026 Effective:"}</span>
                    <span class="font-bold text-blue-700 dark:text-blue-300">{calculatedResult.grade <= 9 ? (lang === "bn" ? "৪০%" : "40%") : (lang === "bn" ? "৫০%" : "50%")}</span>
                  </div>
                  <div class="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-xl px-3 py-1.5 flex justify-between items-center">
                    <span class="text-slate-600 dark:text-slate-400 font-medium">{lang === "bn" ? "০১/০১/২০২৭ কার্যকর:" : "01/01/2027 Effective:"}</span>
                    <span class="font-bold text-indigo-700 dark:text-indigo-300">{calculatedResult.grade <= 9 ? (lang === "bn" ? "৭০%" : "70%") : (lang === "bn" ? "৭৫%" : "75%")}</span>
                  </div>
                  <div class="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 rounded-xl px-3 py-1.5 flex justify-between items-center">
                    <span class="text-slate-600 dark:text-slate-400 font-medium">{lang === "bn" ? "০১/০৭/২০২৭ কার্যকর:" : "01/07/2027 Effective:"}</span>
                    <span class="font-bold text-emerald-700 dark:text-emerald-300">{lang === "bn" ? "১০০%" : "100%"}</span>
                  </div>
                  <div class="bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50 rounded-xl px-3 py-1.5 flex justify-between items-center">
                    <span class="text-slate-600 dark:text-slate-400 font-medium">{lang === "bn" ? "০১/০১/২০২৮ কার্যকর:" : "01/01/2028 Effective:"}</span>
                    <span class="font-bold text-purple-700 dark:text-purple-300">{lang === "bn" ? "১০০%+সকল ভাতা" : "100%+All Allowances"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer / Calculation Breakdown toggle -->
          <div class="mt-4 pt-3 border-t border-blue-100 dark:border-blue-950/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between relative z-10">
            <span>{calculatedResult.elevated ? (lang === "bn" ? "↳ ৯ম স্কেলের পরবর্তী উচ্চতর ধাপে সমন্বয়কৃত" : "↳ Adjusted to next step") : (lang === "bn" ? "↳ ৯ম স্কেলের নির্ধারিত ধাপের সাথে হুবহু মিলেছে" : "↳ Exact step match")}</span>
            <button
              type="button"
              on:click={() => (showDiffTooltip = !showDiffTooltip)}
              class="text-blue-600 dark:text-blue-400 hover:underline font-bold"
            >
              {showDiffTooltip ? (lang === "bn" ? "সূত্র লুকান" : "Hide Formula") : (lang === "bn" ? "হিসাব সূত্র" : "Formula")}
            </button>
          </div>

          {#if showDiffTooltip}
            <div class="mt-2 bg-blue-50/80 dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-xl p-3 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed animate-fade-in-up relative z-10">
              <div><strong>১. পার্থক্য:</strong> ৳{formatMoney(calculatedResult.current.basic)} (৩০/০৬/২৬ মূল) – ৳{formatMoney(calculatedResult.start8th)} (৮ম প্রারম্ভিক) = <strong>৳{formatMoney(calculatedResult.diff)}</strong></div>
              <div><strong>২. নির্ধারিত মূল:</strong> ৳{formatMoney(calculatedResult.start9th)} (৯ম প্রারম্ভিক) + ৳{formatMoney(calculatedResult.diff)} (পার্থক্য) = <strong>৳{formatMoney(calculatedResult.rawCandidateBasic)}</strong></div>
              {#if calculatedResult.elevated}
                <div class="text-emerald-700 dark:text-emerald-400 mt-1">↳ গেজেট অনুযায়ী পরবর্তী উচ্চতর ধাপ: <strong>৳{formatMoney(calculatedResult.fixedGazetteBasic)}</strong></div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Running Salary Modal (বিস্তারিত) -->
    {#if showRunningModal && calculatedResult}
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        on:click|self={() => (showRunningModal = false)}
      >
        <div
          class="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden flex flex-col gap-4 animate-scale-up"
        >
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 class="text-base md:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                🏛️ {t.currentRunningTitle}
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {lang === "bn" ? `গ্রেড ${fmtNum(calculatedResult.grade)} • ৯ম স্কেল ধাপ ${fmtNum(calculatedResult.runningStepIndex)} (১ জুলাই ২০২৬ — ১ ধাপ ইনক্রিমেন্ট)` : `Grade ${calculatedResult.grade} • 9th scale step ${calculatedResult.runningStepIndex} (1 July 2026 — 1 increment)`}
              </p>
            </div>
            <button
              type="button"
              on:click={() => (showRunningModal = false)}
              class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div class="flex flex-col gap-2.5 text-xs md:text-sm">
            <div class="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>{t.basic} ({lang === "bn" ? `ধাপ ${fmtNum(calculatedResult.runningStepIndex)}` : `Step ${calculatedResult.runningStepIndex}`}):</span>
              <span class="font-bold text-slate-900 dark:text-white">৳ {formatMoney(calculatedResult.running.basic)}</span>
            </div>
            <div class="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>{t.houseRent}:</span>
              <span class="font-semibold text-slate-900 dark:text-slate-200">৳ {formatMoney(calculatedResult.running.houseRent)}</span>
            </div>
            <div class="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>{t.medical}:</span>
              <span class="font-semibold text-slate-900 dark:text-slate-200">৳ {formatMoney(calculatedResult.running.medical)}</span>
            </div>
            {#if calculatedResult.running.tiffin > 0}
              <div class="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>{t.tiffin}:</span>
                <span class="font-semibold text-slate-900 dark:text-slate-200">৳ {formatMoney(calculatedResult.running.tiffin)}</span>
              </div>
            {/if}
            {#if calculatedResult.running.specialBenefit > 0}
              <div class="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span class="flex items-center gap-1.5">
                  {t.specialBenefit}
                  <span class="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded">
                    {calculatedResult.grade <= 9 ? "১০%" : "১৫%"}
                  </span>
                </span>
                <span class="font-semibold text-slate-900 dark:text-slate-200">৳ {formatMoney(calculatedResult.running.specialBenefit)}</span>
              </div>
            {/if}
          </div>

          <div class="pt-3 border-t-2 border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl">
            <span class="font-bold text-slate-900 dark:text-white text-sm">{t.totalGross}:</span>
            <span class="text-xl font-black text-blue-700 dark:text-blue-400">৳ {formatMoney(calculatedResult.running.gross)}</span>
          </div>

          <button
            type="button"
            on:click={() => (showRunningModal = false)}
            class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
          >
            {lang === "bn" ? "বন্ধ করুন" : "Close"}
          </button>
        </div>
      </div>
    {/if}

    <!-- Below: Proposed 9th Pay Scale Executive Dashboard -->
    {#if calculatedResult}
      <div class="flex flex-col gap-6 animate-fade-in-up mt-4">
        <!-- Section Title Header -->
        <div class="border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          <h2
            class="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5"
          >
            <span>🏛️</span>
            {t.newTitle}
          </h2>
        </div>

        <!-- 4 IMPLEMENTATION PHASE CARDS: Side-by-Side horizontally on Desktop/Tablet, Stacked on Mobile -->
        <div class="flex flex-col gap-4">

          <!-- 4 Distinctive, High-Contrast Colorful Cards Grid (Strictly 1 Single Row on Desktop/Tablet, Stacked on Mobile) -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3.5 lg:gap-4">
            <!-- Phase 1: Blue Theme -->
            <div
              class="rounded-3xl p-5 bg-white dark:bg-slate-900 border-2 border-blue-500/80 dark:border-blue-500 shadow-md flex flex-col justify-between relative"
            >
              <div>
                <div class="flex items-center justify-between gap-1.5 mb-3">
                  <span
                    class="px-2.5 py-1 rounded-xl bg-blue-600 text-white font-black text-xs shadow-sm shrink-0"
                  >
                    {lang === "bn" ? "১ম ধাপ" : "Phase 1"}
                  </span>
                  <span
                    class="px-2.5 py-1 rounded-xl border border-blue-500/60 dark:border-blue-400/60 bg-blue-50/70 dark:bg-blue-950/50 text-[11px] font-bold text-blue-900 dark:text-blue-200 text-right leading-none shrink-0"
                  >
                    {lang === "bn" ? "১ জুলাই ২০২৬ হতে কার্যকর" : "Effective 1 July 2026"}
                  </span>
                </div>

                <div
                  class="text-sm font-black text-blue-700 dark:text-blue-400 mt-1"
                >
                  {calculatedResult.grade <= 9
                    ? lang === "bn"
                      ? "৪০% বর্ধিত মূল বেতন"
                      : "40% Basic Increase"
                    : lang === "bn"
                      ? "৫০% বর্ধিত মূল বেতন"
                      : "50% Basic Increase"}
                </div>

                <div
                  class="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-1.5 text-xs"
                >
                  <div
                    class="flex justify-between items-center text-slate-600 dark:text-slate-400"
                  >
                    <span>{t.basic}:</span>
                    <span
                      class="font-bold text-slate-900 dark:text-slate-100 text-sm"
                      >৳ {formatMoney(
                        calculatedResult.methods.difference.phases[0].basic,
                      )}</span
                    >
                  </div>
                  <div
                    class="flex justify-between items-center text-slate-600 dark:text-slate-400"
                  >
                    <span>{t.houseRent}:</span>
                    <span class="font-semibold text-slate-800 dark:text-slate-200"
                      >৳ {formatMoney(
                        calculatedResult.methods.difference.phases[0].houseRent,
                      )}</span
                    >
                  </div>
                  <div
                    class="flex justify-between items-center text-slate-600 dark:text-slate-400"
                  >
                    <span>{t.medical}:</span>
                    <span class="font-semibold text-slate-800 dark:text-slate-200"
                      >৳ {formatMoney(
                        calculatedResult.methods.difference.phases[0].medical,
                      )}</span
                    >
                  </div>
                  {#if calculatedResult.methods.difference.phases[0].tiffin > 0}
                    <div
                      class="flex justify-between items-center text-slate-600 dark:text-slate-400"
                    >
                      <span>{t.tiffin}:</span>
                      <span class="font-semibold text-slate-800 dark:text-slate-200"
                        >৳ {formatMoney(
                          calculatedResult.methods.difference.phases[0].tiffin,
                        )}</span
                      >
                    </div>
                  {/if}
                </div>
              </div>

              <!-- Total Gross Salary Highlight (High-Contrast Solid Box) -->
              <div
                class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 bg-blue-50 dark:bg-blue-950/70 -mx-2 -mb-2 p-3 rounded-2xl border border-blue-200 dark:border-blue-900/60 flex items-center justify-between"
              >
                <span class="text-xs font-bold text-blue-900 dark:text-blue-200"
                  >{t.totalGross}</span
                >
                <span
                  class="text-xl font-black text-blue-700 dark:text-blue-400"
                >
                  ৳ {formatMoney(
                    calculatedResult.methods.difference.phases[0].gross,
                  )}
                </span>
              </div>
            </div>

            <!-- Phase 2: Purple / Indigo Theme -->
            <div
              class="rounded-3xl p-5 bg-white dark:bg-slate-900 border-2 border-purple-500/80 dark:border-purple-500 shadow-md flex flex-col justify-between relative"
            >
              <div>
                <div class="flex items-center justify-between gap-1.5 mb-3">
                  <span
                    class="px-2.5 py-1 rounded-xl bg-purple-600 text-white font-black text-xs shadow-sm shrink-0"
                  >
                    {lang === "bn" ? "২য় ধাপ" : "Phase 2"}
                  </span>
                  <span
                    class="px-2.5 py-1 rounded-xl border border-purple-500/60 dark:border-purple-400/60 bg-purple-50/70 dark:bg-purple-950/50 text-[11px] font-bold text-purple-900 dark:text-purple-200 text-right leading-none shrink-0"
                  >
                    {lang === "bn" ? "১ জানুয়ারি ২০২৭ হতে কার্যকর" : "Effective 1 Jan 2027"}
                  </span>
                </div>

                <div
                  class="text-sm font-black text-purple-700 dark:text-purple-400 mt-1"
                >
                  {calculatedResult.grade <= 9
                    ? lang === "bn"
                      ? "৭০% মূল বেতন"
                      : "70% Basic Salary"
                    : lang === "bn"
                      ? "৭৫% মূল বেতন"
                      : "75% Basic Salary"}
                </div>

                <div
                  class="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-1.5 text-xs"
                >
                  <div
                    class="flex justify-between items-center text-slate-600 dark:text-slate-400"
                  >
                    <span>{t.basic}:</span>
                    <span
                      class="font-bold text-slate-900 dark:text-slate-100 text-sm"
                      >৳ {formatMoney(
                        calculatedResult.methods.difference.phases[1].basic,
                      )}</span
                    >
                  </div>
                  <div
                    class="flex justify-between items-center text-slate-600 dark:text-slate-400"
                  >
                    <span>{t.houseRent}:</span>
                    <span class="font-semibold text-slate-800 dark:text-slate-200"
                      >৳ {formatMoney(
                        calculatedResult.methods.difference.phases[1].houseRent,
                      )}</span
                    >
                  </div>
                  <div
                    class="flex justify-between items-center text-slate-600 dark:text-slate-400"
                  >
                    <span>{t.medical}:</span>
                    <span class="font-semibold text-slate-800 dark:text-slate-200"
                      >৳ {formatMoney(
                        calculatedResult.methods.difference.phases[1].medical,
                      )}</span
                    >
                  </div>
                  {#if calculatedResult.methods.difference.phases[1].tiffin > 0}
                    <div
                      class="flex justify-between items-center text-slate-600 dark:text-slate-400"
                    >
                      <span>{t.tiffin}:</span>
                      <span class="font-semibold text-slate-800 dark:text-slate-200"
                        >৳ {formatMoney(
                          calculatedResult.methods.difference.phases[1].tiffin,
                        )}</span
                      >
                    </div>
                  {/if}
                </div>
              </div>

              <!-- Total Gross Salary Highlight (High-Contrast Solid Box) -->
              <div
                class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 bg-purple-50 dark:bg-purple-950/70 -mx-2 -mb-2 p-3 rounded-2xl border border-purple-200 dark:border-purple-900/60 flex items-center justify-between"
              >
                <span
                  class="text-xs font-bold text-purple-900 dark:text-purple-200"
                  >{t.totalGross}</span
                >
                <span
                  class="text-xl font-black text-purple-700 dark:text-purple-400"
                >
                  ৳ {formatMoney(
                    calculatedResult.methods.difference.phases[1].gross,
                  )}
                </span>
              </div>
            </div>

            <!-- Phase 3: Amber / Warm Gold Theme -->
            <div
              class="rounded-3xl p-5 bg-white dark:bg-slate-900 border-2 border-amber-500/80 dark:border-amber-500 shadow-md flex flex-col justify-between relative"
            >
              <div>
                <div class="flex items-center justify-between gap-1.5 mb-3">
                  <span
                    class="px-2.5 py-1 rounded-xl bg-amber-600 text-white font-black text-xs shadow-sm shrink-0"
                  >
                    {lang === "bn" ? "৩য় ধাপ" : "Phase 3"}
                  </span>
                  <span
                    class="px-2.5 py-1 rounded-xl border border-amber-500/60 dark:border-amber-400/60 bg-amber-50/70 dark:bg-amber-950/50 text-[11px] font-bold text-amber-900 dark:text-amber-200 text-right leading-none shrink-0"
                  >
                    {lang === "bn" ? "১ জুলাই ২০২৭ হতে কার্যকর" : "Effective 1 July 2027"}
                  </span>
                </div>

                <div
                  class="text-sm font-black text-amber-700 dark:text-amber-400 mt-1"
                >
                  {lang === "bn"
                    ? "১০০% মূল + ১ ধাপ ইনক্রিমেন্ট"
                    : "100% Basic + 1 Increment Step"}
                </div>

                <div
                  class="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-1.5 text-xs"
                >
                  <div
                    class="flex justify-between items-center text-slate-600 dark:text-slate-400"
                  >
                    <span>{t.basic}:</span>
                    <span
                      class="font-bold text-slate-900 dark:text-slate-100 text-sm"
                      >৳ {formatMoney(
                        calculatedResult.methods.difference.phases[2].basic,
                      )}</span
                    >
                  </div>
                  <div
                    class="flex justify-between items-center text-slate-600 dark:text-slate-400"
                  >
                    <span>{t.houseRent}:</span>
                    <span class="font-semibold text-slate-800 dark:text-slate-200"
                      >৳ {formatMoney(
                        calculatedResult.methods.difference.phases[2].houseRent,
                      )}</span
                    >
                  </div>
                  <div
                    class="flex justify-between items-center text-slate-600 dark:text-slate-400"
                  >
                    <span>{t.medical}:</span>
                    <span class="font-semibold text-slate-800 dark:text-slate-200"
                      >৳ {formatMoney(
                        calculatedResult.methods.difference.phases[2].medical,
                      )}</span
                    >
                  </div>
                  {#if calculatedResult.methods.difference.phases[2].tiffin > 0}
                    <div
                      class="flex justify-between items-center text-slate-600 dark:text-slate-400"
                    >
                      <span>{t.tiffin}:</span>
                      <span class="font-semibold text-slate-800 dark:text-slate-200"
                        >৳ {formatMoney(
                          calculatedResult.methods.difference.phases[2].tiffin,
                        )}</span
                      >
                    </div>
                  {/if}
                </div>
              </div>

              <!-- Total Gross Salary Highlight (High-Contrast Solid Box) -->
              <div
                class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 bg-amber-50 dark:bg-amber-950/70 -mx-2 -mb-2 p-3 rounded-2xl border border-amber-200 dark:border-amber-900/60 flex items-center justify-between"
              >
                <span
                  class="text-xs font-bold text-amber-900 dark:text-amber-200"
                  >{t.totalGross}</span
                >
                <span
                  class="text-xl font-black text-amber-700 dark:text-amber-400"
                >
                  ৳ {formatMoney(
                    calculatedResult.methods.difference.phases[2].gross,
                  )}
                </span>
              </div>
            </div>

            <!-- Phase 4: Emerald Green Theme -->
            <div
              class="rounded-3xl p-5 bg-white dark:bg-slate-900 border-2 border-emerald-500/90 dark:border-emerald-500 shadow-lg ring-2 ring-emerald-500/20 flex flex-col justify-between relative"
            >
              <div>
                <div class="flex items-center justify-between gap-1.5 mb-3">
                  <span
                    class="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-sm shrink-0"
                  >
                    {lang === "bn" ? "৪র্থ ধাপ" : "Phase 4"}
                  </span>
                  <span
                    class="px-2.5 py-1 rounded-xl border border-emerald-500/60 dark:border-emerald-400/60 bg-emerald-50/70 dark:bg-emerald-950/50 text-[11px] font-bold text-emerald-900 dark:text-emerald-200 text-right leading-none shrink-0"
                  >
                    {lang === "bn" ? "১ জানুয়ারি ২০২৮ হতে কার্যকর" : "Effective 1 Jan 2028"}
                  </span>
                </div>

                <div
                  class="text-sm font-black text-emerald-700 dark:text-emerald-400 mt-1"
                >
                  {lang === "bn"
                    ? "১০০% মূল বেতন ও নতুন ভাতাসহ"
                    : "100% Basic with New Allowances"}
                </div>

                <div
                  class="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-1.5 text-xs"
                >
                  <div
                    class="flex justify-between items-center text-slate-600 dark:text-slate-400"
                  >
                    <span>{t.basic}:</span>
                    <span
                      class="font-bold text-slate-900 dark:text-slate-100 text-sm"
                      >৳ {formatMoney(
                        calculatedResult.methods.difference.phases[3].basic,
                      )}</span
                    >
                  </div>
                  <div
                    class="flex justify-between items-center text-slate-600 dark:text-slate-400"
                  >
                    <span>{t.houseRent}:</span>
                    <span class="font-semibold text-slate-800 dark:text-slate-200"
                      >৳ {formatMoney(
                        calculatedResult.methods.difference.phases[3].houseRent,
                      )}</span
                    >
                  </div>
                  <div
                    class="flex justify-between items-center text-slate-600 dark:text-slate-400"
                  >
                    <span>{t.medical}:</span>
                    <span class="font-semibold text-slate-800 dark:text-slate-200"
                      >৳ {formatMoney(
                        calculatedResult.methods.difference.phases[3].medical,
                      )}</span
                    >
                  </div>
                  {#if calculatedResult.methods.difference.phases[3].tiffin > 0}
                    <div
                      class="flex justify-between items-center text-slate-600 dark:text-slate-400"
                    >
                      <span>{t.tiffin}:</span>
                      <span class="font-semibold text-slate-800 dark:text-slate-200"
                        >৳ {formatMoney(
                          calculatedResult.methods.difference.phases[3].tiffin,
                        )}</span
                      >
                    </div>
                  {/if}
                  {#if calculatedResult.methods.difference.phases[3].conveyance > 0}
                    <div
                      class="flex justify-between items-center text-slate-600 dark:text-slate-400"
                    >
                      <span>{t.conveyance}:</span>
                      <span class="font-semibold text-slate-800 dark:text-slate-200"
                        >৳ {formatMoney(
                          calculatedResult.methods.difference.phases[3].conveyance,
                        )}</span
                      >
                    </div>
                  {/if}
                  {#if calculatedResult.methods.difference.phases[3].mobile > 0}
                    <div
                      class="flex justify-between items-center text-slate-600 dark:text-slate-400"
                    >
                      <span>{t.mobile}:</span>
                      <span class="font-semibold text-slate-800 dark:text-slate-200"
                        >৳ {formatMoney(
                          calculatedResult.methods.difference.phases[3].mobile,
                        )}</span
                      >
                    </div>
                  {/if}
                  {#if calculatedResult.methods.difference.phases[3].education > 0}
                    <div
                      class="flex justify-between items-center text-slate-600 dark:text-slate-400"
                    >
                      <span>{t.childEducation}:</span>
                      <span class="font-semibold text-slate-800 dark:text-slate-200"
                        >৳ {formatMoney(
                          calculatedResult.methods.difference.phases[3].education,
                        )}</span
                      >
                    </div>
                  {/if}
                </div>
              </div>

              <!-- Total Gross Salary Highlight (High-Contrast Solid Box) -->
              <div
                class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-950/70 -mx-2 -mb-2 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between"
              >
                <span
                  class="text-xs font-bold text-emerald-900 dark:text-emerald-200"
                  >{t.totalGross}</span
                >
                <span
                  class="text-xl font-black text-emerald-700 dark:text-emerald-400"
                >
                  ৳ {formatMoney(
                    calculatedResult.methods.difference.phases[3].gross,
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footnotes / Directive -->
        <div
          class="p-5 md:p-6 bg-gradient-to-br from-amber-500/10 via-slate-50 to-blue-500/10 dark:from-slate-800/90 dark:via-slate-800/60 dark:to-slate-900/90 rounded-2xl border-2 border-amber-500/30 dark:border-amber-500/20 shadow-sm text-slate-800 dark:text-slate-200"
        >
          <div class="flex items-center gap-2.5 mb-3.5">
            <span class="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500 text-white font-bold shadow-sm shadow-amber-500/30 text-base">
              📌
            </span>
            <h4 class="font-extrabold text-base md:text-lg text-slate-900 dark:text-white tracking-tight">
              {lang === "bn"
                ? "বাস্তবায়ন ও ভাতা সংক্রান্ত জরুরি নোট"
                : "Implementation & Allowance Directives"}
            </h4>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs md:text-[13px] leading-relaxed">
            <div class="flex items-start gap-2.5 p-3 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
              <span class="text-amber-500 font-bold text-sm mt-0.5">🔹</span>
              <p>
                <strong class="font-bold text-slate-900 dark:text-slate-100">
                  {lang === "bn" ? "ধাপ ও ফিক্সেশন:" : "Step & Fixation:"}
                </strong>
                {t.stepNotice}
              </p>
            </div>
            <div class="flex items-start gap-2.5 p-3 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
              <span class="text-blue-500 font-bold text-sm mt-0.5">🔹</span>
              <p>
                <strong class="font-bold text-slate-900 dark:text-slate-100">
                  {lang === "bn" ? "ভাতা ও ইনক্রিমেন্ট:" : "Allowances & Increment:"}
                </strong>
                {t.allowanceNotice}
              </p>
            </div>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(14px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes slideRight {
    from {
      opacity: 0;
      transform: translateX(24px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  .animate-fade-in-up {
    animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .animate-slide-right {
    animation: slideRight 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
</style>
