// 전 사이트 조회수 판독기 — 렌더링 후 DOM에서 읽는다
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SITES = JSON.parse(fs.readFileSync(process.argv[2] || 'test_urls.json', 'utf8'));

// 사이트별 DOM 셀렉터 (있으면 우선 사용)
const SELECTORS = {
  RULIWEB: ['.hit strong', '.user_info .hit'],
  QUASARZONE: ['.v2-meta', '.qz-view-head .v2-meta'],
  INSTIZ: ['#hit', '.memo_view .hit'],
  ARCALIVE: ['.article-info', '.article-meta', '.info-row'],
  EOMISAE: ['.btm_area', '._hd'],
  NATEPANN: ['.post-tit-info .count', '.count'],
  DCINSIDE: ['.gall_count', '.gallview_head'],
  PPOMPPU: ['.view_info', '.board-view-info'],
  THEQOO: ['.count_container', '.rd_hd .btm_area'],
  FMKOREA: ['.rd_hd .btm_area .side.fr', '.side.fr'],
  DOGDRIP: ['.article-head', '.fa-eye', '.text-muted'],
  INVEN: ['.articleHit', '.viewCount', '.article-info'],
  DONPPU: ['.count_read', '.atc_info_right'],
  DIMITORY: ['.side.fr', '.rd_hd .side.fr'],
  FANCUG: ['.hit', 'header .hit'],
  THREDIC: ['.hit'],
  BOBAEDREAM: ['.countGroup', '.util .data4'],
  MLBPARK: ['.view_info', 'span.val'],
  MIMINT: ['.meta-item', '.reply'],
  SLRCLUB: ['td.click', '.click'],
  CITY: ['.post_info', '.side.fr'],
  DEALBADA: ['#bo_v_info', '.bo_v_info'],
  TE31: ['.mbox', '#view-header'],
  DEOKJIL: ['.side.fr', '.btm_area'],
  DVDPRIME: ['#view_hit', '.hit'],
  FOOTSELL: ['#view_hit', '.hit'],
  JAYOUNG: ['.rb_bbs_for_btm_info', '.side.fr'],
  NAVER_KIN: ['.userInfo', '.endContents'],
  ETOLAND: ['#view-header', '.hit'],
  BBASAK: ['.bo_v_info', '.fwb'],
  ZOD: ['.app-list-meta', '.article-head'],
  DASAJA: ['.bo_v_info', '#bo_v_info'],
  YGOSU: ['.date', 'div.date'],
  NAVER: ['.count', '.article_info'],
  DAUM: ['.num_view', '.article_info'],
  BLIND: ['.view_count', 'div[class*=count]'],
};

const TEXT_PATTERNS = [
  /조회\s*수?\s*[:：]?\s*([\d,]{1,12})/,
  /READ\s*[:：]?\s*([\d,]{1,12})/i,
  /([\d,]{1,12})\s*명이\s*읽었어요/,
  /([\d,]{1,12})\s*Hit/i,
  /Views?\s*[:：]?\s*([\d,]{1,12})/i,
];

async function readOne(page, site, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await new Promise(r => setTimeout(r, 3000));
  // 스크롤 유도
  await page.evaluate(async () => {
    for (let i = 0; i < 3; i++) { window.scrollBy(0, 300); await new Promise(r => setTimeout(r, 400)); }
  }).catch(() => {});
  await new Promise(r => setTimeout(r, 1200));

  return await page.evaluate((sels, pats) => {
    const norm = s => (s || '').replace(/\s+/g, ' ').trim();
    const parse = (s) => {
      const m = s.match(/([\d,]{1,12})/);
      return m ? parseInt(m[1].replace(/,/g, ''), 10) : null;
    };
    // 1) 사이트 셀렉터
    for (const sel of sels) {
      const els = document.querySelectorAll(sel);
      for (const el of els) {
        const t = norm(el.textContent);
        for (const p of pats) {
          const m = t.match(p);
          if (m) { const n = parseInt(m[1].replace(/,/g, ''), 10); if (n > 0) return { v: n, how: 'sel:' + sel }; }
        }
      }
    }
    // 2) 셀렉터에 숫자만 있는 케이스
    for (const sel of sels) {
      const el = document.querySelector(sel);
      if (el) { const n = parse(norm(el.textContent)); if (n && n > 0) return { v: n, how: 'selnum:' + sel }; }
    }
    // 3) 전체 본문 텍스트
    const body = norm(document.body ? document.body.innerText : '').slice(0, 20000);
    for (const p of pats) {
      const m = body.match(p);
      if (m) { const n = parseInt(m[1].replace(/,/g, ''), 10); if (n > 0) return { v: n, how: 'text' }; }
    }
    return { v: null, how: 'none' };
  }, SELECTORS[site] || [], TEXT_PATTERNS.map(p => p.source));
}

(async () => {
  const outPath = process.argv[3] || 'counts_out.json';
  const only = process.argv[4] ? process.argv[4].split(',') : null;
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--lang=ko-KR', '--blink-settings=imagesEnabled=false', '--disable-gpu'],
  });
  const out = {};
  for (const [site, v] of Object.entries(SITES)) {
    if (only && !only.includes(site)) continue;
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({ 'accept-language': 'ko-KR,ko;q=0.9' });
    let rec = { url: v.url, count: null, how: null, err: null };
    try {
      const r = await readOne(page, site, v.url);
      rec.count = r.v; rec.how = r.how;
    } catch (e) { rec.err = e.message.slice(0, 80); }
    out[site] = rec;
    console.log(`${site.padEnd(11)} ${String(rec.count ?? '-').padStart(6)}  [${rec.how || rec.err || '-'}]`);
    await page.close().catch(() => {});
  }
  fs.writeFileSync(outPath, JSON.stringify(out, null, 1));
  await browser.close();
})();
