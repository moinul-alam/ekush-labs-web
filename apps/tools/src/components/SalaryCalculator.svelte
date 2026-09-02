<script>
  import { onMount } from "svelte";
  import { fmt as fmtLocalized } from "../utils/numbers";

  export let lang = "bn";

  const dict = {
    bn: {
      title: "সরকারি বেতন ক্যালকুলেটর",
      desc: "৮ম এবং ৯ম পে-স্কেলের তুলনামূলক বেতন ও বাস্তবায়ন ধাপের নির্ভুল হিসাব",
      devWarning:
        "এই অ্যাপটি ৯ম পে-স্কেল ২০২৬ এর অনুমোদিত ৪টি বাস্তবায়ন ধাপের কাঠামোর ভিত্তিতে প্রস্তুতকৃত।",
      grade: "গ্রেড নির্বাচন করুন (১-২০)",
      currentBasicStep: "বর্তমান মূল বেতন বা ধাপ (৮ম স্কেল)",
      stepLabel: "ধাপ",
      initialStep: "১ম ধাপ (প্রারম্ভিক)",
      location: "কর্মস্থল / বাসাভাড়ার এলাকা",
      locDhaka: "ঢাকা সিটি কর্পোরেশন (৫৫%)",
      locCityCorp: "অন্যান্য সিটি কর্পোরেশন (৪৫%)",
      locOther: "জেলা/উপজেলা বা অন্যান্য (৪০%)",
      calcButton: "বেতন হিসাব করুন",
      recalcButton: "পুনরায় হিসাব করুন",
      currentTitle: "বর্তমান বেতন (৮ম পে-স্কেল)",
      newTitle: "প্রস্তাবিত বেতন (৯ম পে-স্কেল)",
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
      phase3: "৩য় ধাপ: ১ জুলাই ২০২৭ (১০০% মূলবেতন + ৫% ইনক্রিমেন্ট)",
      phase4: "৪র্থ ধাপ: ১ জানুয়ারি ২০২৮ (সংশোধিত নতুন ভাতাসহ)",
      stepNotice:
        "যেহেতু ৯ম পে-স্কেলের চূড়ান্ত গেজেটের প্রতিটি ইনক্রিমেন্ট ধাপ এখনও প্রকাশিত হয়নি, তাই এখানে প্রকৃত গণনাকৃত মূল বেতন দেখানো হয়েছে। গেজেট প্রকাশের পর তা নিকটতম উচ্চতর ধাপে সমন্বয় করা হবে।",
      allowanceNotice:
        "৩য় ধাপে (১ জুলাই ২০২৭) মূল বেতনে ৫% বার্ষিক ইনক্রিমেন্ট যুক্ত হবে এবং বাসা ভাড়া ৮ম স্কেলের ইনক্রিমেন্ট-পরবর্তী মূল বেতন অনুযায়ী বৃদ্ধি পাবে। ৯ম স্কেলে 'বিশেষ সুবিধা' (১০%/১৫%) বাতিল হবে এবং ৪র্থ ধাপে (১ জানুয়ারি ২০২৮) নতুন ভাতার হার কার্যকর হবে।",
      currentStepInfo: "৮ম স্কেলের ধাপ",
      startingScale: "প্রারম্ভিক স্কেল",
      factorVal: "ফ্যাক্টর মান",
      diffVal: "পার্থক্য",
      phaseBasic: "মূল বেতন",
      phaseNetEst: "মোট প্রাপ্য বেতন",
      phaseIncBadge: "বৃদ্ধি",
      inputTitle: "বেতন সংক্রান্ত তথ্য নির্বাচন",
      calcCompleted: "হিসাব সম্পন্ন",
      basicOnlyNotice:
        "১ম থেকে ৩য় ধাপে শুধু মূল বেতন বৃদ্ধি পাবে। ৯ম স্কেলে 'বিশেষ সুবিধা' বাতিল হবে। নতুন ভাতার হার ২০২৮ সালের জানুয়ারি থেকে কার্যকর হবে।",
      ponjiTag: "অ্যান্ড্রয়েড অ্যাপ",
      ponjiTitle: "একুশ পঞ্জি - বাংলা ক্যালেন্ডার",
      ponjiDesc: "সম্পূর্ণ বাংলা ক্যালেন্ডার ও ছুটির তালিকা",
      ponjiBtn: "ডাউনলোড করুন",
    },
    en: {
      title: "Govt Salary Calculator",
      desc: "Accurate salary comparison and 4-phase implementation for 8th & 9th Pay Scales",
      devWarning:
        "This app is prepared based on the approved 9th Pay Scale 2026 across 4 rollout phases.",
      grade: "Select Grade (1-20)",
      currentBasicStep: "Current Basic Pay / Step (8th Scale)",
      stepLabel: "Step",
      initialStep: "1st Step (Starting)",
      location: "Workplace / House Rent Area",
      locDhaka: "Dhaka City Corporation (55%)",
      locCityCorp: "Other City Corporation (45%)",
      locOther: "District/Upazila or Other (40%)",
      calcButton: "Calculate Salary",
      recalcButton: "Recalculate",
      currentTitle: "Current Salary (8th Scale)",
      newTitle: "Proposed Salary (9th Scale)",
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
      phase3: "Phase 3: 1 July 2027 (100% Basic + 5% Annual Increment)",
      phase4: "Phase 4: 1 January 2028 (With Revised Allowances)",
      stepNotice:
        "As the official intermediate steps for the 9th Pay Scale are not gazetted yet, the exact calculated basic is shown without artificial rounding to higher steps.",
      allowanceNotice:
        "In Phase 3 (1 July 2027), a 5% annual increment is added to basic pay, and house rent is calculated based on the post-increment 8th scale step. Special benefit is abolished in 9th scale.",
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

  let showDiffTooltip = false;
  let showFactorTooltip = false;

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

  async function fetchPayScaleData() {
    loading = true;
    error = false;
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

      selectedStepIndex = 0;
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
  // Phase 3 (1 July 2027): 100% Full New Calculated Basic + 5% Annual Increment (1 July 2027).
  //                       House Rent is calculated based on 5% increment on existing 8th basic fixed to same/nearest step.
  // Phase 4 (1 Jan 2028): 100% Full New Calculated Basic (with Increment) + 9th Scale Revised Allowances
  //
  // Important Rules for 9th scale phases:
  // 1. 'বিশেষ সুবিধা' (Special Benefit) is ABOLISHED once 9th pay scale takes effect.
  // 2. Allowances (House Rent, Medical, Tiffin) in Phases 1 and 2 remain at current 8th pay scale amounts.
  // 3. In Phase 3 (1 July 2027), 5% annual increment is added to basic, and house rent is updated based on 8th scale post-increment basic.
  function calculate4Phases(
    newCalculatedBasic,
    current8thBasic,
    grade,
    current8thBreakdown,
    steps8th,
  ) {
    const isHigherGrade = grade <= 9;
    const phaseRates = isHigherGrade ? [0.4, 0.3, 0.3] : [0.5, 0.25, 0.25];
    const increasedBasic = Math.max(0, newCalculatedBasic - current8thBasic);

    // Cumulative basic additions for Phases 1 & 2
    const phase1Basic = current8thBasic + increasedBasic * phaseRates[0];
    const phase2Basic = phase1Basic + increasedBasic * phaseRates[1];

    // Phase 3 Basic: 100% new calculated basic + 5% annual increment
    const phase3Basic = Math.round(newCalculatedBasic * 1.05);
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
    const next8thBasic = (curr8thIdx !== -1 && curr8thIdx + 1 < steps8th.length)
      ? steps8th[curr8thIdx + 1]
      : Math.round(current8thBasic * 1.05);
    
    const allowances8th = payscaleData.allowances_8th;
    const houseRentRate8th = allowances8th.house_rent[location] || 0.55;
    const p3HouseRent = next8thBasic * houseRentRate8th;
    const p3Medical = p12Medical;
    const p3Tiffin = p12Tiffin;
    const p3Gross = phase3Basic + p3HouseRent + p3Medical + p3Tiffin;

    // Phase 4 Total (Revised 9th scale allowances take effect)
    const allowances9th = payscaleData.allowances_9th;
    const p4HouseRentRate = allowances9th.house_rent[location] || 0.55;
    const p4HouseRent = phase4Basic * p4HouseRentRate;
    const p4Medical = allowances9th.medical.amount;
    const p4Tiffin = getTiffin(allowances9th, grade);
    const p4Gross = phase4Basic + p4HouseRent + p4Medical + p4Tiffin;

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
        badge: "100% + 5%",
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

    // 1. Difference Addition Method (পার্থক্য যোগ পদ্ধতি)
    // Formula: 9th Starting Basic + (Current Step Basic - 8th Starting Basic)
    const diff = Math.max(0, currentBasicVal - start8th);
    const diffCalcBasic = start9th + diff; // Actual calculated basic without step elevation

    // 2. Increment Factor Method (ইনক্রিমেন্ট ফ্যাক্টর পদ্ধতি)
    // Formula: (Current Step Basic / 8th Starting Basic) * 9th Starting Basic
    const factor = start8th > 0 ? currentBasicVal / start8th : 1;
    const factorCalcBasic = Math.round(start9th * factor); // Actual calculated basic without step elevation

    // Current 8th breakdown (Gross & Allowances including special benefit in 8th scale)
    const current = compute8thBreakdown(currentBasicVal, grade);

    // 4 Phased rollouts for both methods
    const diffPhases = calculate4Phases(
      diffCalcBasic,
      currentBasicVal,
      grade,
      current,
      steps8th,
    );
    const factorPhases = calculate4Phases(
      factorCalcBasic,
      currentBasicVal,
      grade,
      current,
      steps8th,
    );

    calculatedResult = {
      grade,
      stepIndex: selectedStepIndex + 1,
      totalSteps: steps8th.length,
      start8th,
      start9th,
      diff,
      factor: factor.toFixed(5),
      current,
      methods: {
        difference: {
          calcBasic: diffCalcBasic,
          increasedBasic: diffCalcBasic - currentBasicVal,
          phases: diffPhases,
        },
        factor: {
          calcBasic: factorCalcBasic,
          increasedBasic: factorCalcBasic - currentBasicVal,
          phases: factorPhases,
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
    <div class="flex items-start gap-3">
      <span class="text-blue-600 dark:text-blue-400 text-xl mt-0.5">ℹ️</span>
      <div
        class="text-xs md:text-sm font-medium text-blue-900 dark:text-blue-200 leading-relaxed"
      >
        <span class="font-bold">{t.devWarning}</span>
        {payscaleData?.disclaimer?.[lang] || t.desc}
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
    <!-- Top Row: Entry Box Stays on Left, Current Salary Appears on Right -->
    <div
      class="grid grid-cols-1 {calculatedResult
        ? 'lg:grid-cols-12'
        : 'max-w-2xl mx-auto w-full'} gap-6 transition-all duration-500"
    >
      <!-- Entry Box / Form Card (Always on the LEFT when viewed) -->
      <div
        class="{calculatedResult
          ? 'lg:col-span-6'
          : 'w-full'} bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-slate-200/70 dark:border-slate-800/70 shadow-xl relative overflow-hidden transition-all duration-500"
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
      </div>

      <!-- Current Salary Card (Slides in smoothly on the RIGHT when calculated) -->
      {#if calculatedResult}
        <div
          class="lg:col-span-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-slate-200/70 dark:border-slate-800/70 shadow-xl relative overflow-hidden animate-slide-right"
        >
          <div
            class="absolute top-0 right-0 w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"
          ></div>

          <div
            class="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-slate-800 pb-3"
          >
            <div>
              <span
                class="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                >{lang === "bn"
                  ? "বর্তমান বেতন কাঠামো"
                  : "Current Pay Scale"}</span
              >
              <h3
                class="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"
              >
                🏛️ {t.currentTitle}
              </h3>
            </div>
            <span
              class="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold"
            >
              {lang === "bn"
                ? "গ্রেড " + fmtNum(calculatedResult.grade)
                : "Grade " + calculatedResult.grade} • {lang === "bn"
                ? "ধাপ " + fmtNum(calculatedResult.stepIndex)
                : "Step " + calculatedResult.stepIndex}
            </span>
          </div>

          <div class="flex flex-col gap-3 relative z-10 text-sm">
            <div
              class="flex justify-between items-center text-slate-600 dark:text-slate-400"
            >
              <span>{t.basic}</span>
              <span class="text-base font-bold text-slate-900 dark:text-white"
                >৳ {formatMoney(calculatedResult.current.basic)}</span
              >
            </div>
            <div
              class="flex justify-between items-center text-slate-600 dark:text-slate-400"
            >
              <span>{t.houseRent}</span>
              <span class="font-semibold text-slate-900 dark:text-slate-200"
                >৳ {formatMoney(calculatedResult.current.houseRent)}</span
              >
            </div>
            <div
              class="flex justify-between items-center text-slate-600 dark:text-slate-400"
            >
              <span>{t.medical}</span>
              <span class="font-semibold text-slate-900 dark:text-slate-200"
                >৳ {formatMoney(calculatedResult.current.medical)}</span
              >
            </div>
            {#if calculatedResult.current.tiffin > 0}
              <div
                class="flex justify-between items-center text-slate-600 dark:text-slate-400"
              >
                <span>{t.tiffin}</span>
                <span class="font-semibold text-slate-900 dark:text-slate-200"
                  >৳ {formatMoney(calculatedResult.current.tiffin)}</span
                >
              </div>
            {/if}
            <div
              class="flex justify-between items-center text-slate-600 dark:text-slate-400"
            >
              <span class="flex items-center gap-1.5">
                {t.specialBenefit}
                <span
                  class="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded"
                >
                  {calculatedResult.grade <= 9 ? "১০%" : "১৫%"}
                </span>
              </span>
              <span class="font-semibold text-slate-900 dark:text-slate-200"
                >৳ {formatMoney(calculatedResult.current.specialBenefit)}</span
              >
            </div>

            <div
              class="mt-4 pt-3 border-t-2 border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-xl"
            >
              <span
                class="font-bold text-slate-800 dark:text-slate-200 text-sm md:text-base"
                >{t.totalGross}</span
              >
              <span
                class="text-xl md:text-2xl font-black text-blue-700 dark:text-blue-400"
                >৳ {formatMoney(calculatedResult.current.gross)}</span
              >
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Below: Dual Fixation Methods & Phased Implementation Side by Side -->
    {#if calculatedResult}
      <div class="flex flex-col gap-6 animate-fade-in-up mt-2">
        <div
          class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 pt-2"
        >
          <div>
            <h2
              class="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2"
            >
              📊 {t.newTitle} - {lang === "bn"
                ? "ফিক্সেশন ও তুলনামূলক হিসাব"
                : "Dual Fixation Comparison"}
            </h2>
            <p
              class="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5"
            >
              {lang === "bn"
                ? "সার্ভিস রুলস অনুযায়ী দুটি ফিক্সেশন পদ্ধতি এবং ৪টি বাস্তবায়ন ধাপ নিচে পাশাপাশি দেওয়া হলো"
                : "Side by side comparison of both fixation methods and 4 rollout phases"}
            </p>
          </div>
        </div>

        <!-- Methods Comparison: 2 Columns Side by Side -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Method 1: Difference Addition Method (পার্থক্য যোগ পদ্ধতি) -->
          <div
            class="flex flex-col gap-5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-blue-200/80 dark:border-blue-900/50 shadow-xl relative overflow-hidden"
          >
            <div
              class="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"
            ></div>

            <!-- First Box: Header & Calculated Basic Only -->
            <div
              class="flex flex-col gap-3 border-b border-slate-100 dark:border-slate-800 pb-4"
            >
              <div class="flex items-center justify-between">
                <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                >
                  {lang === "bn" ? "পদ্ধতি ১" : "Method 1"}
                </span>
                <span class="text-xs font-bold text-slate-400"
                  >{t.methodDiffSub}</span
                >
              </div>
              <h3
                class="text-lg md:text-xl font-bold text-blue-700 dark:text-blue-400"
              >
                {t.methodDiffTitle}
              </h3>
              <p
                class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed"
              >
                {t.methodDiffDesc}
                <button
                  on:click={() => (showDiffTooltip = !showDiffTooltip)}
                  class="ml-1 inline-flex items-center font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2 transition-colors cursor-pointer"
                >
                  {showDiffTooltip ? t.closeDetails : t.clickDetails}
                </button>
              </p>

              <!-- Expandable Tooltip / Details Box -->
              {#if showDiffTooltip}
                <div
                  class="mt-2 bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 rounded-2xl p-4 text-xs flex flex-col gap-2 animate-fade-in-up"
                >
                  <div
                    class="font-bold text-blue-900 dark:text-blue-300 flex items-center justify-between"
                  >
                    <span>📐 {t.fixationFormula}</span>
                    <button
                      on:click={() => (showDiffTooltip = false)}
                      class="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
                      >✕</button
                    >
                  </div>
                  <div
                    class="text-slate-700 dark:text-slate-300 font-mono text-[11px] bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-blue-200/60 dark:border-blue-800/60 leading-relaxed"
                  >
                    {lang === "bn"
                      ? "১. পার্থক্য = বর্তমান বেসিক – ৮ম স্কেলের প্রারম্ভিক"
                      : "1. Diff = Current Basic - 8th Starting"}
                    <br />
                    = ৳{formatMoney(calculatedResult.current.basic)} – ৳{formatMoney(
                      calculatedResult.start8th,
                    )} = ৳{formatMoney(calculatedResult.diff)}
                    <br />
                    {lang === "bn"
                      ? "২. ৯ম স্কেলের মূল বেতন = ৯ম স্কেলের প্রারম্ভিক + পার্থক্য"
                      : "2. 9th Basic = 9th Starting + Diff"}
                    <br />
                    = ৳{formatMoney(calculatedResult.start9th)} + ৳{formatMoney(
                      calculatedResult.diff,
                    )} = ৳{formatMoney(
                      calculatedResult.methods.difference.calcBasic,
                    )}
                  </div>
                  <div
                    class="text-[11px] text-amber-700 dark:text-amber-300/90 pt-1 border-t border-blue-200/50 dark:border-blue-800/50"
                  >
                    💡 {t.stepNotice}
                  </div>
                </div>
              {/if}

              <!-- Calculated Basic Presentation in First Box -->
              <div
                class="bg-gradient-to-r from-blue-50 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-2xl p-4 flex items-center justify-between mt-1"
              >
                <div>
                  <span
                    class="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300"
                    >{t.calculatedBasic}</span
                  >
                  <div
                    class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5"
                  >
                    {t.basicOnlyNotice}
                  </div>
                </div>
                <div class="text-right">
                  <div
                    class="text-2xl md:text-3xl font-black text-blue-700 dark:text-blue-400"
                  >
                    ৳ {formatMoney(
                      calculatedResult.methods.difference.calcBasic,
                    )}
                  </div>
                  <div
                    class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400"
                  >
                    +৳{formatMoney(
                      calculatedResult.methods.difference.increasedBasic,
                    )}
                    {lang === "bn" ? "মূল বেতন বৃদ্ধি" : "Basic Increase"}
                  </div>
                </div>
              </div>
            </div>

            <!-- 4 Phased Implementation: Each Phase in Its Own Structured Box -->
            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <h4
                  class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5"
                >
                  🗓️ {t.phasesTitle}
                </h4>
                <span
                  class="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-semibold"
                >
                  {calculatedResult.grade <= 9
                    ? "৪০% + ৩০% + ৩০% + ভাতা"
                    : "৫০% + ২৫% + ২৫% + ভাতা"}
                </span>
              </div>

              {#each calculatedResult.methods.difference.phases as p}
                <div
                  class="bg-slate-50/90 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/70 dark:border-slate-700/70 text-xs flex flex-col gap-2 relative overflow-hidden"
                >
                  <div
                    class="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2"
                  >
                    <div
                      class="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2"
                    >
                      <span>{p.title}</span>
                      <span
                        class="text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-md font-bold"
                        >{p.badge}</span
                      >
                    </div>
                  </div>

                  <!-- Phase Breakdown: Basic, House Rent, Medical, Tiffin (No special benefit in 9th scale), Gross -->
                  <div
                    class="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-slate-600 dark:text-slate-400"
                  >
                    <div>
                      <span class="text-[10px] text-slate-400 uppercase"
                        >{t.basic}</span
                      >
                      <div
                        class="font-bold text-slate-900 dark:text-white text-xs"
                      >
                        ৳ {formatMoney(p.basic)}
                      </div>
                    </div>
                    <div>
                      <span class="text-[10px] text-slate-400 uppercase"
                        >{t.houseRent}</span
                      >
                      <div
                        class="font-semibold text-slate-800 dark:text-slate-200 text-xs"
                      >
                        ৳ {formatMoney(p.houseRent)}
                      </div>
                    </div>
                    <div>
                      <span class="text-[10px] text-slate-400 uppercase"
                        >{t.medical}</span
                      >
                      <div
                        class="font-semibold text-slate-800 dark:text-slate-200 text-xs"
                      >
                        ৳ {formatMoney(p.medical)}
                      </div>
                    </div>
                    {#if p.tiffin > 0}
                      <div>
                        <span class="text-[10px] text-slate-400 uppercase"
                          >{t.tiffin}</span
                        >
                        <div
                          class="font-semibold text-slate-800 dark:text-slate-200 text-xs"
                        >
                          ৳ {formatMoney(p.tiffin)}
                        </div>
                      </div>
                    {/if}
                  </div>

                  <div
                    class="mt-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex justify-between items-center bg-blue-50/50 dark:bg-blue-950/30 p-2.5 rounded-xl"
                  >
                    <span class="font-bold text-slate-800 dark:text-slate-200"
                      >{t.totalGross}</span
                    >
                    <span
                      class="text-base font-black text-blue-700 dark:text-blue-400"
                      >৳ {formatMoney(p.gross)}</span
                    >
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Method 2: Increment Factor Method (ইনক্রিমেন্ট ফ্যাক্টর পদ্ধতি) -->
          <div
            class="flex flex-col gap-5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-emerald-200/80 dark:border-emerald-900/50 shadow-xl relative overflow-hidden"
          >
            <div
              class="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"
            ></div>

            <!-- First Box: Header & Calculated Basic Only -->
            <div
              class="flex flex-col gap-3 border-b border-slate-100 dark:border-slate-800 pb-4"
            >
              <div class="flex items-center justify-between">
                <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                >
                  {lang === "bn" ? "পদ্ধতি ২" : "Method 2"}
                </span>
                <span class="text-xs font-bold text-slate-400"
                  >{t.methodFactorSub}</span
                >
              </div>
              <h3
                class="text-lg md:text-xl font-bold text-emerald-700 dark:text-emerald-400"
              >
                {t.methodFactorTitle}
              </h3>
              <p
                class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed"
              >
                {t.methodFactorDesc}
                <button
                  on:click={() => (showFactorTooltip = !showFactorTooltip)}
                  class="ml-1 inline-flex items-center font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline underline-offset-2 transition-colors cursor-pointer"
                >
                  {showFactorTooltip ? t.closeDetails : t.clickDetails}
                </button>
              </p>

              <!-- Expandable Tooltip / Details Box -->
              {#if showFactorTooltip}
                <div
                  class="mt-2 bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-4 text-xs flex flex-col gap-2 animate-fade-in-up"
                >
                  <div
                    class="font-bold text-emerald-900 dark:text-emerald-300 flex items-center justify-between"
                  >
                    <span>📐 {t.fixationFormula}</span>
                    <button
                      on:click={() => (showFactorTooltip = false)}
                      class="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
                      >✕</button
                    >
                  </div>
                  <div
                    class="text-slate-700 dark:text-slate-300 font-mono text-[11px] bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 leading-relaxed"
                  >
                    {lang === "bn"
                      ? "১. ফ্যাক্টর = বর্তমান বেসিক ÷ ৮ম স্কেলের প্রারম্ভিক"
                      : "1. Factor = Current Basic ÷ 8th Starting"}
                    <br />
                    = ৳{formatMoney(calculatedResult.current.basic)} ÷ ৳{formatMoney(
                      calculatedResult.start8th,
                    )} = {calculatedResult.factor}
                    <br />
                    {lang === "bn"
                      ? "২. ৯ম স্কেলের মূল বেতন = ৯ম স্কেলের প্রারম্ভিক × ফ্যাক্টর"
                      : "2. 9th Basic = 9th Starting × Factor"}
                    <br />
                    = ৳{formatMoney(calculatedResult.start9th)} × {calculatedResult.factor}
                    = ৳{formatMoney(calculatedResult.methods.factor.calcBasic)}
                  </div>
                  <div
                    class="text-[11px] text-amber-700 dark:text-amber-300/90 pt-1 border-t border-emerald-200/50 dark:border-emerald-800/50"
                  >
                    💡 {t.stepNotice}
                  </div>
                </div>
              {/if}

              <!-- Calculated Basic Presentation in First Box -->
              <div
                class="bg-gradient-to-r from-emerald-50 to-teal-50/60 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-4 flex items-center justify-between mt-1"
              >
                <div>
                  <span
                    class="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300"
                    >{t.calculatedBasic}</span
                  >
                  <div
                    class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5"
                  >
                    {t.basicOnlyNotice}
                  </div>
                </div>
                <div class="text-right">
                  <div
                    class="text-2xl md:text-3xl font-black text-emerald-700 dark:text-emerald-400"
                  >
                    ৳ {formatMoney(calculatedResult.methods.factor.calcBasic)}
                  </div>
                  <div
                    class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400"
                  >
                    +৳{formatMoney(
                      calculatedResult.methods.factor.increasedBasic,
                    )}
                    {lang === "bn" ? "মূল বেতন বৃদ্ধি" : "Basic Increase"}
                  </div>
                </div>
              </div>
            </div>

            <!-- 4 Phased Implementation: Each Phase in Its Own Structured Box -->
            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <h4
                  class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5"
                >
                  🗓️ {t.phasesTitle}
                </h4>
                <span
                  class="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-semibold"
                >
                  {calculatedResult.grade <= 9
                    ? "৪০% + ৩০% + ৩০% + ভাতা"
                    : "৫০% + ২৫% + ২৫% + ভাতা"}
                </span>
              </div>

              {#each calculatedResult.methods.factor.phases as p}
                <div
                  class="bg-slate-50/90 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/70 dark:border-slate-700/70 text-xs flex flex-col gap-2 relative overflow-hidden"
                >
                  <div
                    class="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2"
                  >
                    <div
                      class="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2"
                    >
                      <span>{p.title}</span>
                      <span
                        class="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-md font-bold"
                        >{p.badge}</span
                      >
                    </div>
                  </div>

                  <!-- Phase Breakdown: Basic, House Rent, Medical, Tiffin (No special benefit in 9th scale), Gross -->
                  <div
                    class="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-slate-600 dark:text-slate-400"
                  >
                    <div>
                      <span class="text-[10px] text-slate-400 uppercase"
                        >{t.basic}</span
                      >
                      <div
                        class="font-bold text-slate-900 dark:text-white text-xs"
                      >
                        ৳ {formatMoney(p.basic)}
                      </div>
                    </div>
                    <div>
                      <span class="text-[10px] text-slate-400 uppercase"
                        >{t.houseRent}</span
                      >
                      <div
                        class="font-semibold text-slate-800 dark:text-slate-200 text-xs"
                      >
                        ৳ {formatMoney(p.houseRent)}
                      </div>
                    </div>
                    <div>
                      <span class="text-[10px] text-slate-400 uppercase"
                        >{t.medical}</span
                      >
                      <div
                        class="font-semibold text-slate-800 dark:text-slate-200 text-xs"
                      >
                        ৳ {formatMoney(p.medical)}
                      </div>
                    </div>
                    {#if p.tiffin > 0}
                      <div>
                        <span class="text-[10px] text-slate-400 uppercase"
                          >{t.tiffin}</span
                        >
                        <div
                          class="font-semibold text-slate-800 dark:text-slate-200 text-xs"
                        >
                          ৳ {formatMoney(p.tiffin)}
                        </div>
                      </div>
                    {/if}
                  </div>

                  <div
                    class="mt-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-950/30 p-2.5 rounded-xl"
                  >
                    <span class="font-bold text-slate-800 dark:text-slate-200"
                      >{t.totalGross}</span
                    >
                    <span
                      class="text-base font-black text-emerald-700 dark:text-emerald-400"
                      >৳ {formatMoney(p.gross)}</span
                    >
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <!-- Footnotes / Directives -->
        <div
          class="flex flex-col gap-2 p-4 bg-slate-100/90 dark:bg-slate-800/70 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300"
        >
          <div class="flex items-start gap-2">
            <span class="text-base mt-0.5">📌</span>
            <p class="leading-relaxed">
              <span class="font-bold text-slate-900 dark:text-white"
                >{lang === "bn"
                  ? "বাস্তবায়ন, ইনক্রিমেন্ট ও বিশেষ সুবিধা সংক্রান্ত নির্দেশনা:"
                  : "Implementation, Increment & Special Benefit Notice:"}</span
              >
              {t.stepNotice}
              {t.allowanceNotice}
            </p>
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
