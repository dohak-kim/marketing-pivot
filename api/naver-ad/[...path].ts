import * as crypto from 'crypto';

function makeSignature(timestamp: string, method: string, path: string, secretKey: string): string {
  const message = `${timestamp}.${method}.${path}`;
  return crypto.createHmac('sha256', secretKey).update(message).digest('base64');
}

export default async function handler(req: any, res: any) {
  const accessLicense = process.env.VITE_NAVER_AD_API_KEY;
  const secretKey     = process.env.VITE_NAVER_AD_SECRET;
  const customerId    = process.env.VITE_NAVER_AD_CUSTOMER_ID;

  if (!accessLicense || !secretKey) {
    return res.status(500).json({ error: 'Naver AD API credentials not configured' });
  }

  const pathSegments = req.query.path as string[] | undefined;
  const subPath      = pathSegments ? pathSegments.join('/') : '';
  const queryString  = new URLSearchParams(req.query as Record<string, string>);
  queryString.delete('path');
  const qs          = queryString.toString();
  const pathForSign = `/${subPath}`;
  const apiPath     = `${pathForSign}${qs ? `?${qs}` : ''}`;
  const timestamp   = String(Date.now());
  const signature   = makeSignature(timestamp, req.method, pathForSign, secretKey);

  const targetUrl = `https://api.naver.com${apiPath}`;

  const response = await fetch(targetUrl, {
    method: req.method,
    headers: {
      'X-Timestamp':        timestamp,
      'X-API-KEY':          accessLicense,
      'X-Customer':         customerId || '',
      'X-Signature':        signature,
      'Content-Type':       'application/json',
    },
    ...(req.method !== 'GET' ? { body: JSON.stringify(req.body) } : {}),
  });

  const data = await response.json();
  res.status(response.status).json(data);
}
