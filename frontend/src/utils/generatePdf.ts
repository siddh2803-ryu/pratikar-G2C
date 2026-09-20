import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { StructuredClaimRecord, Verdict } from '../api/client';
import { translateDynamic } from '../i18n/translations';

export interface GeneratePdfOptions {
  claimRecord: StructuredClaimRecord;
  verdict: Verdict;
  appealKind: string;
  language?: string;
}

/**
 * Sanitizes text to pure WinAnsi-compatible characters for standard Helvetica.
 * Replaces currency symbols, typographic punctuation, and quotes.
 */
export function cleanAnsi(text: string): string {
  if (!text) return '';
  return text
    .replace(/₹/g, 'INR ')
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/•/g, '-')
    .replace(/·/g, '-')
    .replace(/[^\x00-\x7F\xA0-\xFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes text for TrueType Unicode rendering (Devanagari / Mukta).
 */
export function cleanUnicode(text: string): string {
  if (!text) return '';
  return text
    .replace(/₹/g, '₹ ')
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/•/g, '-')
    .replace(/·/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Wraps text into lines fitting within maxWidth.
 */
function wrapText(
  text: string,
  font: any,
  fontSize: number,
  maxWidth: number,
  isDevanagari: boolean = false
): string[] {
  const safeText = isDevanagari ? cleanUnicode(text) : cleanAnsi(text);
  const words = safeText.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    let width = 0;
    try {
      width = font.widthOfTextAtSize(testLine, fontSize);
    } catch {
      width = testLine.length * fontSize * 0.55;
    }
    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [''];
}

/**
 * Generates an official, publication-quality, ready-to-file PDF appeal document
 * matching 100% of the on-screen preview structure, text, and styling.
 */
export async function generateAppealPdfBytes(options: GeneratePdfOptions): Promise<Uint8Array> {
  const { claimRecord, verdict, appealKind, language = 'en' } = options;
  const isFlowC = appealKind === 'grounds_request' || verdict.flow === 'flow_c';
  const isHindi = language === 'hi';

  const doc = await PDFDocument.create();

  // Load standard Helvetica fonts as primary/fallback
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  let font = helvetica;
  let fontBold = helveticaBold;
  let fontOblique = helveticaOblique;
  let isDevanagari = false;

  // Attempt to embed Mukta font for Hindi if in browser environment
  if (isHindi && typeof window !== 'undefined') {
    try {
      doc.registerFontkit(fontkit);
      const fontRes = await fetch('/fonts/Mukta-Regular.ttf');
      if (fontRes.ok) {
        const fontData = await fontRes.arrayBuffer();
        const muktaFont = await doc.embedFont(fontData);
        font = muktaFont;
        fontBold = muktaFont;
        fontOblique = muktaFont;
        isDevanagari = true;
      }
    } catch (e) {
      console.warn('Mukta font could not be embedded, falling back to clean ANSI:', e);
    }
  }

  const clean = (txt: string) => (isDevanagari ? cleanUnicode(txt) : cleanAnsi(txt));

  const pageWidth = 595.28; // A4 width
  const pageHeight = 841.89; // A4 height
  const margin = 45;
  const contentWidth = pageWidth - margin * 2;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y - neededHeight < margin + 30) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      drawHeaderFooter();
    }
  };

  const drawHeaderFooter = () => {
    const footerNotice = isHindi && isDevanagari
      ? `प्रतिकार · आईआरडीएआई मास्टर परिपत्र 2024 अनुपालन · संदर्भ: ${clean(claimRecord.claim_reference || 'REF-DISPUTE')}`
      : `PRATIKAR - IRDAI Master Circular 2024 Compliance - Ref: ${clean(claimRecord.claim_reference || 'REF-DISPUTE')}`;

    page.drawText(clean(footerNotice), {
      x: margin,
      y: margin - 15,
      size: 8,
      font: fontOblique,
      color: rgb(0.5, 0.5, 0.5),
    });
  };

  drawHeaderFooter();

  // 1. Header Bar
  let titleText = isFlowC
    ? 'REQUEST FOR SPECIFIC GROUNDS AND CLAUSE OF CLAIM REPUDIATION'
    : 'FORMAL GRIEVANCE APPEAL UNDER IRDAI PROTECTION REGULATIONS';
  let subTitleText =
    'Prepared via Pratikar InsurTech Contest Engine · Filed Directly by Policyholder';

  if (isHindi && isDevanagari) {
    titleText = isFlowC
      ? 'दावा अस्वीकृति के विशिष्ट आधारों और खंड की मांग हेतु पत्र'
      : 'आईआरडीएआई (IRDAI) संरक्षण विनियमों के तहत औपचारिक शिकायत अपील';
    subTitleText = 'प्रतिकार इन्शुरटेक कॉन्टेस्ट इंजन द्वारा तैयार · पॉलिसीधारक द्वारा सीधे दाखिल';
  }

  page.drawRectangle({
    x: margin,
    y: y - 48,
    width: contentWidth,
    height: 48,
    color: rgb(0.08, 0.22, 0.38), // Brand Navy
  });

  page.drawText(clean(titleText), {
    x: margin + 12,
    y: y - 22,
    size: 10.5,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(clean(subTitleText), {
    x: margin + 12,
    y: y - 38,
    size: 8.5,
    font,
    color: rgb(0.85, 0.9, 0.95),
  });

  y -= 65;

  // 2. Addressee
  const toLabel = isHindi && isDevanagari ? 'सेवा में,' : 'To,';
  const groRole = isHindi && isDevanagari
    ? 'शिकायत निवारण अधिकारी (जी.आर.ओ.) / दावा विभाग'
    : 'The Grievance Redressal Officer (GRO) / Claims Department';

  page.drawText(clean(toLabel), { x: margin, y, size: 9.5, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  y -= 14;
  page.drawText(clean(groRole), {
    x: margin,
    y,
    size: 9.5,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 14;
  page.drawText(clean(claimRecord.insurer_name), {
    x: margin,
    y,
    size: 10.5,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 22;

  // 3. Subject Box
  const claimRef = clean(claimRecord.claim_reference || (isHindi && isDevanagari ? 'लागू नहीं' : 'N/A'));
  let subjectText = isFlowC
    ? `Subject: Demand for Specific Contractual Clause and Ground for Claim Repudiation Ref: ${claimRef}`
    : `Subject: Reconsideration Demand & Contest of Unlawful Claim Repudiation Ref: ${claimRef}`;

  if (isHindi && isDevanagari) {
    subjectText = isFlowC
      ? `विषय: दावा अस्वीकृति के विशिष्ट अनुबंधीय खंड और आधार की मांग संदर्भ: ${claimRef}`
      : `विषय: अस्वीकृत दावे के पुनर्विचार हेतु चुनौती एवं मांग संदर्भ: ${claimRef}`;
  }

  const subjectLines = wrapText(subjectText, fontBold, 9.5, contentWidth - 20, isDevanagari);
  const subjectBoxHeight = subjectLines.length * 14 + 12;

  page.drawRectangle({
    x: margin,
    y: y - subjectBoxHeight,
    width: contentWidth,
    height: subjectBoxHeight,
    color: rgb(0.95, 0.97, 0.99),
    borderColor: rgb(0.8, 0.85, 0.92),
    borderWidth: 1,
  });

  let subY = y - 14;
  for (const line of subjectLines) {
    page.drawText(clean(line), {
      x: margin + 10,
      y: subY,
      size: 9.5,
      font: fontBold,
      color: rgb(0.08, 0.22, 0.38),
    });
    subY -= 14;
  }
  y -= subjectBoxHeight + 14;

  // 4. Claim Particulars Box
  const policyholder = clean(
    claimRecord.policyholder_name || (isHindi && isDevanagari ? 'बीमित दावेदार' : 'Insured Claimant')
  );
  const policyNo = clean(
    claimRecord.policy_number || (isHindi && isDevanagari ? 'संलग्न पॉलिसी देखें' : 'Refer enclosed policy')
  );
  const amountStr = claimRecord.claim_amount
    ? (isDevanagari ? `₹${claimRecord.claim_amount.toLocaleString('en-IN')}` : `INR ${claimRecord.claim_amount.toLocaleString('en-IN')}`)
    : (isHindi && isDevanagari ? 'अस्पताल बिल के अनुसार' : 'As per hospital bills');
  const dateStr = clean(claimRecord.rejection_date || '');
  const groundRaw = isHindi ? translateDynamic(claimRecord.stated_ground, 'hi') : claimRecord.stated_ground;
  const groundStr = clean(groundRaw || (isHindi && isDevanagari ? 'विशिष्ट आधार उल्लिखित नहीं' : 'Repudiation terms not specified'));

  const particularHeading = isHindi && isDevanagari ? 'दावे का विवरण (CLAIM PARTICULARS)' : 'CLAIM PARTICULARS';
  const particulars = [
    { label: isHindi && isDevanagari ? 'पॉलिसीधारक का नाम:' : 'Policyholder Name:', value: policyholder },
    { label: isHindi && isDevanagari ? 'पॉलिसी संख्या:' : 'Policy Number:', value: policyNo },
    { label: isHindi && isDevanagari ? 'दावा संदर्भ संख्या:' : 'Claim Reference ID:', value: claimRef },
    { label: isHindi && isDevanagari ? 'अस्वीकृति की तिथि:' : 'Date of Repudiation:', value: dateStr },
    { label: isHindi && isDevanagari ? 'विवादित राशि:' : 'Disputed Amount:', value: amountStr },
    { label: isHindi && isDevanagari ? 'बीमाकर्ता द्वारा उल्लिखित आधार:' : 'Stated Insurer Ground:', value: groundStr },
  ];

  let particularsHeight = 24;
  for (const p of particulars) {
    const valLines = wrapText(p.value, font, 9, contentWidth - 170, isDevanagari);
    particularsHeight += Math.max(1, valLines.length) * 14 + 3;
  }

  page.drawRectangle({
    x: margin,
    y: y - particularsHeight,
    width: contentWidth,
    height: particularsHeight,
    color: rgb(0.98, 0.98, 0.99),
    borderColor: rgb(0.88, 0.88, 0.9),
    borderWidth: 1,
  });

  page.drawText(clean(particularHeading), {
    x: margin + 10,
    y: y - 16,
    size: 8.5,
    font: fontBold,
    color: rgb(0.4, 0.45, 0.5),
  });

  let partY = y - 32;
  for (const p of particulars) {
    page.drawText(clean(p.label), {
      x: margin + 10,
      y: partY,
      size: 9,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    const valLines = wrapText(p.value, font, 9, contentWidth - 170, isDevanagari);
    let valY = partY;
    for (const vLine of valLines) {
      page.drawText(clean(vLine), {
        x: margin + 160,
        y: valY,
        size: 9,
        font,
        color: rgb(0.15, 0.15, 0.15),
      });
      valY -= 13;
    }
    partY -= Math.max(1, valLines.length) * 14 + 3;
  }
  y -= particularsHeight + 16;

  // 5. Grounds Section
  checkPageBreak(80);
  const groundsHeader = isHindi && isDevanagari
    ? 'अपील के वैधानिक एवं अनुबंधीय आधार:'
    : 'STATUTORY & CONTRACTUAL GROUNDS:';

  page.drawText(clean(groundsHeader), {
    x: margin,
    y,
    size: 9.5,
    font: fontBold,
    color: rgb(0.08, 0.22, 0.38),
  });
  y -= 15;

  for (const rawReason of verdict.reasons) {
    const reason = isHindi ? translateDynamic(rawReason, 'hi') : rawReason;
    const reasonLines = wrapText(`• ${clean(reason)}`, font, 9, contentWidth - 10, isDevanagari);
    checkPageBreak(reasonLines.length * 13 + 6);
    for (const rLine of reasonLines) {
      page.drawText(clean(rLine), {
        x: margin + 5,
        y,
        size: 9,
        font,
        color: rgb(0.15, 0.15, 0.15),
      });
      y -= 13;
    }
    y -= 4;
  }
  y -= 8;

  // 6. Evidence Trail Section
  if (verdict.evidence_trail && verdict.evidence_trail.length > 0) {
    checkPageBreak(70);
    const evidenceHeader = isHindi && isDevanagari
      ? 'साक्ष्य एवं उद्धरण:'
      : 'EVIDENCE & DOCUMENT CITATIONS:';

    page.drawText(clean(evidenceHeader), {
      x: margin,
      y,
      size: 9.5,
      font: fontBold,
      color: rgb(0.08, 0.22, 0.38),
    });
    y -= 15;

    verdict.evidence_trail.forEach((ev, idx) => {
      const sourceLabel = ev.provision_ref
        ? (isHindi ? translateDynamic(ev.provision_ref, 'hi') : ev.provision_ref)
        : (isHindi && isDevanagari
            ? `पॉलिसी दस्तावेज़ पृष्ठ ${ev.page_number}`
            : `Policy Wording Page ${ev.page_number}`);
      const rawStatement = isHindi ? translateDynamic(ev.statement, 'hi') : ev.statement;
      const sourcePrefix = isHindi && isDevanagari ? 'स्रोत:' : 'Source:';
      const evText = `[${idx + 1}] ${rawStatement} (${sourcePrefix} ${sourceLabel})`;
      const evLines = wrapText(evText, font, 8.5, contentWidth - 10, isDevanagari);

      checkPageBreak(evLines.length * 12 + 6);
      for (const eLine of evLines) {
        page.drawText(clean(eLine), {
          x: margin + 5,
          y,
          size: 8.5,
          font,
          color: rgb(0.2, 0.25, 0.3),
        });
        y -= 12;
      }
      y -= 4;
    });
    y -= 8;
  }

  // 7. Demand & Timeline Box
  checkPageBreak(65);
  let demandText1 =
    'Demand for Redressal: Under IRDAI regulations, the insurer must dispose of this grievance in writing within 15 calendar days.';
  let demandText2 =
    'In the event this grievance is not resolved to satisfaction, this matter will be escalated to the Insurance Ombudsman under Rule 14 of the Insurance Ombudsman Rules, 2017 without further notice.';

  if (isHindi && isDevanagari) {
    demandText1 =
      'निवारण की मांग: आईआरडीएआई नियमों के तहत, बीमाकर्ता को 15 कैलेंडर दिनों के भीतर इस शिकायत का लिखित रूप से निपटारा करना अनिवार्य है।';
    demandText2 =
      'यदि इस शिकायत का संतोषजनक समाधान नहीं होता है, तो बिना किसी अग्रिम सूचना के बीमा लोकपाल नियम, 2017 के नियम 14 के तहत मामले को बीमा लोकपाल के समक्ष प्रस्तुत किया जाएगा।';
  }

  const d1Lines = wrapText(demandText1, fontBold, 8.5, contentWidth - 16, isDevanagari);
  const d2Lines = wrapText(demandText2, font, 8.5, contentWidth - 16, isDevanagari);
  const demandBoxHeight = (d1Lines.length + d2Lines.length) * 13 + 16;

  page.drawRectangle({
    x: margin,
    y: y - demandBoxHeight,
    width: contentWidth,
    height: demandBoxHeight,
    color: rgb(0.99, 0.97, 0.95),
    borderColor: rgb(0.9, 0.82, 0.75),
    borderWidth: 1,
  });

  let dY = y - 13;
  for (const line of d1Lines) {
    page.drawText(clean(line), {
      x: margin + 8,
      y: dY,
      size: 8.5,
      font: fontBold,
      color: rgb(0.6, 0.25, 0.05),
    });
    dY -= 13;
  }
  dY -= 2;
  for (const line of d2Lines) {
    page.drawText(clean(line), {
      x: margin + 8,
      y: dY,
      size: 8.5,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    dY -= 13;
  }
  y -= demandBoxHeight + 16;

  // 8. Signoff
  checkPageBreak(70);
  const signoffYours = isHindi && isDevanagari ? 'भवदीय,' : 'Yours faithfully,';
  const signoffRole = isHindi && isDevanagari ? 'पॉलिसीधारक / बीमित दावेदार' : 'Policyholder / Insured Claimant';
  const datePrefix = isHindi && isDevanagari ? 'दिनांक:' : 'Date:';

  page.drawText(clean(signoffYours), {
    x: margin,
    y,
    size: 9.5,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 22;

  page.drawText(clean(policyholder), {
    x: margin,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.08, 0.22, 0.38),
  });
  y -= 13;

  page.drawText(clean(signoffRole), {
    x: margin,
    y,
    size: 8.5,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 12;

  page.drawText(clean(`${datePrefix} ${dateStr}`), {
    x: margin,
    y,
    size: 8.5,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  return await doc.save();
}
