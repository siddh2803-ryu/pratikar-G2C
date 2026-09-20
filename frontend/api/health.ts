export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'healthy',
    service: 'pratikar-engine',
    timestamp: new Date().toISOString(),
    warmed: true,
  });
}
