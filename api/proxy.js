// api/proxy.js  ← 파일명과 위치 정확히 이렇게 만드세요

export default async function handler(req, res) {
  // CORS 허용
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { endpoint, ...params } = req.query;

    // 허용된 공공API 엔드포인트만 통과
    const ALLOWED = [
      'apis.data.go.kr/B551182/hospInfoServicev2',
      'apis.data.go.kr/B551182/pharmacyInfoService',
    ];

    const isAllowed = ALLOWED.some(a => endpoint?.includes(a));
    if (!isAllowed) {
      return res.status(403).json({ error: '허용되지 않은 엔드포인트' });
    }

    // 쿼리 파라미터 조합
    const query = new URLSearchParams(params).toString();
    const url = `https://${endpoint}?${query}`;

    const response = await fetch(url);
    const data = await response.json();

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
