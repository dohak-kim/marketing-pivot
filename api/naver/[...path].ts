export default async function handler(req: any, res: any) {
  const clientId     = process.env.VITE_NAVER_CLIENT_ID;
  const clientSecret = process.env.VITE_NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Naver API credentials not configured' });
  }

  const pathSegments = req.query.path as string[] | undefined;
  const subPath      = pathSegments ? pathSegments.join('/') : '';
  const queryString  = new URLSearchParams(req.query as Record<string, string>);
  queryString.delete('path');
  const qs = queryString.toString();

  // subPath already contains the full path (e.g. 'v1/search/blog') — do not prepend /v1/ again
  const targetUrl = `https://openapi.naver.com/${subPath}${qs ? `?${qs}` : ''}`;

  const response = await fetch(targetUrl, {
    method: req.method,
    headers: {
      'X-Naver-Client-Id':     clientId,
      'X-Naver-Client-Secret': clientSecret,
      'Content-Type': 'application/json',
    },
    ...(req.method !== 'GET' ? { body: JSON.stringify(req.body) } : {}),
  });

  const data = await response.json();
  res.status(response.status).json(data);
}
