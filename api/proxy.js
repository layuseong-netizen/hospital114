// api/proxy.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { endpoint, ...params } = req.query;

    if (!endpoint) {
      return res.status(400).json({ error: 'endpoint 파라미터가 없습니다' });
    }

    const ALLOWED = [
      'apis.data.go.kr/B551182/hospInfoServicev2',
      'apis.data.go.kr/B551182/pharmacyInfoService',
    ];

    const isAllowed = ALLOWED.some(a => endpoint.includes(a));
    if (!isAllowed) {
      return res.status(403).json({ error: '허용되지 않은 엔드포인트' });
    }

    // 파라미터 재조합 (serviceKey 인코딩 주의)
    const qs = Object.entries(params)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');

    const url = `https://${endpoint}?${qs}`;
    console.log('Fetching:', url);

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    const text = await response.text();

    // XML로 왔을 경우 처리
    if (text.trim().startsWith('<')) {
      return res.status(200).send(text);
    }

    const data = JSON.parse(text);
    return res.status(200).json(data);

  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
