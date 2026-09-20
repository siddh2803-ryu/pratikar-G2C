import { getDemoData } from '../../../../src/api/demoData';
import { generateAppealPdfBytes } from '../../../../src/utils/generatePdf';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { id, docId } = req.query;
  const analysis = getDemoData(id as string);

  if (!analysis || !analysis.claim_record || !analysis.verdict) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(404).json({ error: { message: 'Document or analysis session not found' } });
  }

  try {
    const pdfBytes = await generateAppealPdfBytes({
      claimRecord: analysis.claim_record,
      verdict: analysis.verdict,
      appealKind: analysis.appeal_kind || 'gro_letter',
      language: 'en',
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="appeal_${docId}.pdf"`);
    return res.status(200).send(Buffer.from(pdfBytes));
  } catch (err: any) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: { message: err.message || 'PDF generation failed' } });
  }
}
