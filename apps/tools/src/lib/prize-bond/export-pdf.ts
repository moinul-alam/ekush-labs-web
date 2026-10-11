import type { MatchWin } from './matcher';
import type { PrizeBondRules } from './draw-store';
import { englishToBanglaDigits } from './parse-input';

const tierNamesBn: Record<number, string> = {
  1: '১ম পুরস্কার',
  2: '২য় পুরস্কার',
  3: '৩য় পুরস্কার',
  4: '৪র্থ পুরস্কার',
  5: '৫ম পুরস্কার',
};

const tierNamesEn: Record<number, string> = {
  1: '1st Prize',
  2: '2nd Prize',
  3: '3rd Prize',
  4: '4th Prize',
  5: '5th Prize',
};

function formatAmount(amount: number, lang: 'bn' | 'en'): string {
  if (lang === 'bn') {
    return englishToBanglaDigits(amount.toLocaleString('en-IN')) + ' টাকা';
  }
  return '৳ ' + amount.toLocaleString('en-US');
}

/**
 * Renders the comprehensive report off-screen and exports it directly as a downloadable .pdf file,
 * without opening the system print dialog.
 */
export async function generateWinnersPdf(
  matches: MatchWin[],
  rules: PrizeBondRules | null,
  lang: 'bn' | 'en' = 'bn'
): Promise<void> {
  if (!matches || matches.length === 0) return;

  const totalPrizeSum = matches.reduce((acc, m) => acc + m.totalPrize, 0);

  const directives = lang === 'bn'
    ? (rules?.claim?.stepsBn || [
        '১. মূল প্রাইজবন্ডটি নিরাপদে ও যত্নে রাখুন (কোনো প্রকার ভাঁজ, দাগ বা কাটাছেঁড়া করা যাবে না)।',
        '২. বাংলাদেশ ব্যাংকের অফিসিয়াল নোটিশ বা দৈনিক পত্রিকার ড্র তালিকার সাথে নম্বরটি পুনঃযাচাই করুন।',
        '৩. বাংলাদেশ ব্যাংকের যেকোনো কার্যালয় অথবা নির্ধারিত ব্যাংকে দাবি ফরম পূরণ করে জমা দিন।',
        '৪. প্রয়োজনীয় কাগজপত্র: মূল প্রাইজবন্ড, জাতীয় পরিচয়পত্রের ফটোকপি এবং ব্যাংক হিসাবের চেক/বিবরণী।',
        '৫. সরকারের বিদ্যমান আয়কর আইন অনুযায়ী ২০% উৎসে কর কর্তন করে অবশিষ্ট অর্থ ব্যাংক একাউন্টে জমা হবে।',
        '৬. ড্র অনুষ্ঠানের তারিখ হতে ২ (দুই) বছরের মধ্যে পুরস্কার দাবি করতে হবে। মেয়াদ শেষ হলে অর্থ সরকারি কোষাগারে জমা হয়।',
      ])
    : (rules?.claim?.stepsEn || [
        '1. Keep the original prize bond safe and intact without marks or folding.',
        '2. Confirm officially via Bangladesh Bank publication or website before taking action.',
        '3. Submit claim at any Bangladesh Bank office or scheduled commercial bank branch.',
        '4. Required documents: Original winning bond, National ID (NID) copy, and bank account details.',
        '5. 20% tax at source is deducted from the prize sum according to government regulations.',
        '6. Prizes must be claimed within 2 years (24 months) of the draw date.',
      ]);

  const websiteFontFamily = lang === 'bn'
    ? "'Kalpurush', 'Barlow', -apple-system, BlinkMacSystemFont, sans-serif"
    : "'Barlow', -apple-system, BlinkMacSystemFont, sans-serif";

  const displayFontFamily = lang === 'bn'
    ? "'LiSirajee', 'Kalpurush', 'Bebas Neue', sans-serif"
    : "'Bebas Neue', 'Barlow Condensed', sans-serif";

  // Build winner cards in clean vertical flow
  const winnerRowsHtml = matches.map((match) => {
    return match.wins.map((win) => {
      const tierLabel = lang === 'bn' ? tierNamesBn[win.tier] || `${win.tier}ম পুরস্কার` : tierNamesEn[win.tier] || `Tier ${win.tier}`;
      const drawText = lang === 'bn'
        ? `${englishToBanglaDigits(win.drawNumber)}তম ড্র (${englishToBanglaDigits(win.date)})`
        : `Draw #${win.drawNumber} (${win.date})`;
      const deadlineText = lang === 'bn'
        ? englishToBanglaDigits(win.claimableUntil)
        : win.claimableUntil;
      const statusText = win.isExpired
        ? (lang === 'bn' ? 'মেয়াদোত্তীর্ণ হতে পারে' : 'Expired')
        : (lang === 'bn' ? 'দাবিযোগ্য' : 'Claimable');

      return `
        <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; font-family: ${websiteFontFamily};">
          <div>
            <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">
              ${lang === 'bn' ? 'বন্ড নম্বর' : 'Bond Number'}
            </div>
            <div style="font-size: 20px; font-weight: 800; font-family: ${websiteFontFamily}; color: #0f172a; letter-spacing: 0.5px;">
              ${lang === 'bn' ? englishToBanglaDigits(match.bondNumber) : match.bondNumber}
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 3px;">
              ${lang === 'bn' ? 'ড্র: ' : 'Draw: '} <strong>${drawText}</strong>
            </div>
          </div>

          <div style="text-align: right;">
            <div>
              <span style="background: #eff6ff; color: #1d4ed8; font-weight: 700; font-size: 12px; padding: 3px 8px; border-radius: 6px; border: 1px solid #bfdbfe; font-family: ${websiteFontFamily};">
                ${tierLabel}
              </span>
            </div>
            <div style="font-size: 18px; font-weight: 800; color: #059669; margin-top: 4px; font-family: ${websiteFontFamily};">
              ${formatAmount(win.amount, lang)}
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
              ${lang === 'bn' ? 'দাবির শেষ তারিখ: ' : 'Deadline: '} ${deadlineText} (${statusText})
            </div>
          </div>
        </div>
      `;
    }).join('');
  }).join('');

  const reportDate = new Date().toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Create an offscreen container with exact A4 proportions (750px width)
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '750px';
  container.style.background = '#ffffff';
  container.style.color = '#0f172a';
  container.style.padding = '35px';
  container.style.boxSizing = 'border-box';
  container.style.fontFamily = websiteFontFamily;
  container.style.lineHeight = '1.5';

  container.innerHTML = `
    <div style="border-bottom: 2px solid #2563eb; padding-bottom: 14px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; font-family: ${displayFontFamily}; letter-spacing: -0.01em;">
          ${lang === 'bn' ? 'বাংলাদেশ প্রাইজবন্ড ড্র ফলাফল রিপোর্ট' : 'Bangladesh Prize Bond Draw Report'}
        </h1>
        <p style="margin: 3px 0 0 0; font-size: 11px; color: #64748b; font-family: ${websiteFontFamily};">
          ${lang === 'bn' ? 'বাংলাদেশ ব্যাংক ১০০ টাকা মূল্যমান প্রাইজবন্ড যাচাইকরণ প্রতিবেদন' : 'Official 100 Taka Prize Bond Verification Report'}
        </p>
      </div>
      <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <img src="/assets/logo.png" alt="EkushLabs" style="height: 22px; width: auto; object-fit: contain;" />
          <span style="font-size: 16px; font-weight: 800; color: #1d4ed8; font-family: ${websiteFontFamily};">EkushLabs</span>
        </div>
        <div style="font-size: 10px; color: #94a3b8; margin-top: 3px; font-family: ${websiteFontFamily};">${reportDate}</div>
      </div>
    </div>

    <!-- Summary Box -->
    <div style="display: flex; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; margin-bottom: 18px; justify-content: space-around; font-family: ${websiteFontFamily};">
      <div style="text-align: center;">
        <div style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">
          ${lang === 'bn' ? 'মোট বিজয়ী বন্ড' : 'Winning Bonds'}
        </div>
        <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 2px;">
          ${lang === 'bn' ? englishToBanglaDigits(matches.length) : matches.length}টি
        </div>
      </div>
      <div style="text-align: center;">
        <div style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">
          ${lang === 'bn' ? 'মোট অর্জিত পুরস্কার' : 'Total Prize'}
        </div>
        <div style="font-size: 20px; font-weight: 800; color: #059669; margin-top: 2px;">
          ${formatAmount(totalPrizeSum, lang)}
        </div>
      </div>
    </div>

    <!-- Winners list -->
    <div style="margin-bottom: 20px; font-family: ${websiteFontFamily};">
      <div style="font-size: 12px; font-weight: 700; color: #334155; text-transform: uppercase; margin-bottom: 8px;">
        ${lang === 'bn' ? 'বিজয়ী বন্ড ও পুরস্কারের বিবরণ:' : 'Winning Bonds & Prize Details:'}
      </div>
      ${winnerRowsHtml}
    </div>

    <!-- Directives card -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 8px; padding: 14px 16px; margin-bottom: 25px; font-family: ${websiteFontFamily};">
      <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">
        📌 ${lang === 'bn' ? 'সাধারণ নির্দেশনা ও দাবি প্রক্রিয়া:' : 'Claim Directives & Steps:'}
      </div>
      ${directives.map((d) => `<div style="font-size: 11px; color: #475569; margin-bottom: 4px; line-height: 1.5;">${d}</div>`).join('')}
    </div>

    <!-- Branding Footer -->
    <div style="border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #64748b; font-family: ${websiteFontFamily};">
      <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; color: #0f172a;">
        <img src="/assets/logo.png" alt="EkushLabs" style="height: 16px; width: auto; object-fit: contain;" />
        <span>EkushLabs.com | Tools</span>
      </div>
      <div>tools.ekushlabs.com/prize-bond-result-checker</div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // Dynamic import to keep main bundle ultra lightweight
    const [{ jsPDF }, html2canvasModule] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);
    const html2canvas = html2canvasModule.default || html2canvasModule;

    const canvas = await html2canvas(container, {
      scale: 2, // High DPI for crisp text
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width mm
    const pageHeight = 297; // A4 height mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const filename = `ekush-prize-bond-report-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}
