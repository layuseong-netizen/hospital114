// api/proxy.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { serviceKey, type, ...rest } = req.query;

    if (!serviceKey) return res.status(400).json({ error: 'serviceKey 없음' });

    // 병원 또는 약국 엔드포인트 선택
    const BASE = type === 'pharm'
      ? 'https://apis.data.go.kr/B551182/pharmacyInfoService/getParmacyBasisList'
      : 'https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList';

    const qs = Object.entries(rest)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    const url = `${BASE}?serviceKey=${serviceKey}&${qs}`;
    console.log('URL:', url);

    const response = await fetch(url);
    const xml = await response.text();

    const totalCount = xml.match(/<totalCount>(\d+)<\/totalCount>/)?.[1] || '0';
    const resultCode = xml.match(/<resultCode>(\w+)<\/resultCode>/)?.[1] || '';
    const resultMsg = xml.match(/<resultMsg>([^<]+)<\/resultMsg>/)?.[1] || '';

    if (resultCode !== '00') {
      return res.status(200).json({ error: resultMsg, resultCode });
    }

    const items = [];
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
    for (const match of itemMatches) {
      const x = match[1];
      const get = (tag) => x.match(new RegExp(`<${tag}>([^<]*)<\/${tag}>`))?.[1]?.trim() || '';

      if (type === 'pharm') {
        // 약국 데이터
        items.push({
          yadmNm: get('yadmNm'),
          addr: get('addr'),
          telno: get('telno'),
          clCdNm: '약국',
          sidoCdNm: get('sidoCdNm'),
          sgguCdNm: get('sgguCdNm'),
          monTrmtStart: get('monTrmtStart'), monTrmtEnd: get('monTrmtEnd'),
          tueTrmtStart: get('tueTrmtStart'), tueTrmtEnd: get('tueTrmtEnd'),
          wedTrmtStart: get('wedTrmtStart'), wedTrmtEnd: get('wedTrmtEnd'),
          thuTrmtStart: get('thuTrmtStart'), thuTrmtEnd: get('thuTrmtEnd'),
          friTrmtStart: get('friTrmtStart'), friTrmtEnd: get('friTrmtEnd'),
          satTrmtStart: get('satTrmtStart'), satTrmtEnd: get('satTrmtEnd'),
          sunTrmtStart: get('sunTrmtStart'), sunTrmtEnd: get('sunTrmtEnd'),
        });
      } else {
        // 병원 데이터
        items.push({
          yadmNm: get('yadmNm'),
          addr: get('addr'),
          telno: get('telno'),
          clCdNm: get('clCdNm'),
          sidoCdNm: get('sidoCdNm'),
          sgguCdNm: get('sgguCdNm'),
          dgsbjtCdNm: get('dgsbjtCdNm'),
          monTrmtStart: get('monTrmtStart'), monTrmtEnd: get('monTrmtEnd'),
          tueTrmtStart: get('tueTrmtStart'), tueTrmtEnd: get('tueTrmtEnd'),
          wedTrmtStart: get('wedTrmtStart'), wedTrmtEnd: get('wedTrmtEnd'),
          thuTrmtStart: get('thuTrmtStart'), thuTrmtEnd: get('thuTrmtEnd'),
          friTrmtStart: get('friTrmtStart'), friTrmtEnd: get('friTrmtEnd'),
          satTrmtStart: get('satTrmtStart'), satTrmtEnd: get('satTrmtEnd'),
          sunTrmtStart: get('sunTrmtStart'), sunTrmtEnd: get('sunTrmtEnd'),
        });
      }
    }

    return res.status(200).json({
      response: {
        header: { resultCode, resultMsg },
        body: { totalCount: parseInt(totalCount), items: { item: items } }
      }
    });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
