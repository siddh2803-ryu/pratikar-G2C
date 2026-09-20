import { getDemoData } from '../../src/api/demoData';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { id } = req.query;
  const analysis = getDemoData(id as string);

  if (analysis) {
    return res.status(200).json(analysis);
  }

  return res.status(404).json({
    error: {
      code: 'ANALYSIS_NOT_FOUND',
      message: `Analysis session '${id}' was not found.`,
    },
  });
}
