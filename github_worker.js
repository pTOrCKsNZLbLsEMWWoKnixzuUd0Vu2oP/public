const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const https = require('https');
const http = require('http');

const runInstiz = require('./boosters/instiz');
const runTheqoo = require('./boosters/theqoo');
const runPpomppu = require('./boosters/ppomppu');
const runFemco = require('./boosters/fmkorea');
const runNaver = require('./boosters/naver');
const runRuliweb = require('./boosters/ruliweb');
const runQuasarzone = require('./boosters/quasarzone');
const runArcalive = require('./boosters/arcalive');
const runInven = require('./boosters/inven');
const runDogdrip = require('./boosters/dogdrip');
const runDcinside = require('./boosters/dcinside');
const runDonppu = require('./boosters/donppu');
const runDaum = require('./boosters/daum');
const runDimitory = require('./boosters/dimitory');
const runFancug = require('./boosters/fancug');
const runThredic = require('./boosters/thredic');
const runEtoland = require('./boosters/etoland');
const runNatepann = require('./boosters/natepann'); 
const runBobaedream = require('./boosters/bobaedream');
const runMlbpark = require('./boosters/mlbpark'); 
const runEomisae = require('./boosters/eomisae');
const runMimint = require('./boosters/mimint');
const runJayoung = require('./boosters/jayoung');
const runNaverKin = require('./boosters/naver_kin');
const runBlind = require('./boosters/blind');
const runYgosu = require('./boosters/ygosu');
const runDealbada = require('./boosters/dealbada');
const runTe31 = require('./boosters/te');
const runZod = require('./boosters/zod');
const runCity = require('./boosters/city');
const runDasaja = require('./boosters/dasaja');
const runDeokjil = require('./boosters/deokjil');
const runSlrclub = require('./boosters/slrclub');
const runNaverStock = require('./boosters/naver_stock');

const stealth = StealthPlugin();
stealth.enabledEvasions.delete('user-agent-override');
puppeteer.use(stealth);

const boosters = {
    INSTIZ: runInstiz, THEQOO: runTheqoo, PPOMPPU: runPpomppu,
    FEMCO: runFemco, NAVER: runNaver, RULIWEB: runRuliweb, NAVER_KIN: runNaverKin,
    QUASARZONE: runQuasarzone, ARCALIVE: runArcalive, INVEN: runInven,
    DOGDRIP: runDogdrip, DCINSIDE: runDcinside, DONPPU: runDonppu, DAUM: runDaum,
    DIMITORY: runDimitory, FANCUG: runFancug, THREDIC: runThredic, ETOLAND: runEtoland,
    NATEPANN: runNatepann, BOBAEDREAM: runBobaedream, MLBPARK: runMlbpark,
    EOMISAE: runEomisae, MIMINT: runMimint, JAYOUNG: runJayoung, YGOSU: runYgosu,
    BLIND: runBlind, DEALBADA: runDealbada, TE31: runTe31, ZOD: runZod,
    DASAJA: runDasaja, DEOKJIL: runDeokjil, SLRCLUB: runSlrclub,
    NAVER_STOCK: runNaverStock, CITY: runCity
};

// ===== HTTP fetch helper =====
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function httpGet(url, opts = {}) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const mod = u.protocol === 'https:' ? https : http;
        const req = mod.get(url, {
            headers: { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9', ...(opts.headers || {}) },
            timeout: opts.timeout || 12000,
        }, (res) => {
            if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}`));
            let encoding = opts.encoding || 'utf-8';
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => {
                let body = Buffer.concat(chunks);
                if (encoding === 'euc-kr' || encoding === 'euc_kr') {
                    try { body = require('iconv-lite').decode(body, 'euc-kr'); } catch (e) { body = body.toString('utf-8'); }
                } else {
                    body = body.toString(encoding);
                }
                resolve(body);
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });
}

// ===== HTTP-based view count readers (ported from server.py) =====
const HTTP_COUNT = {
    INSTIZ: async (url) => {
        const norm = url.replace('m.instiz.net', 'www.instiz.net');
        const html = await httpGet(norm, { headers: { Referer: 'https://www.instiz.net/pt' } });
        const m = html.match(/id="hit">\s*([\d,]+)/);
        return m ? parseInt(m[1].replace(/,/g, ''), 10) : null;
    },
    ZOD: async (url) => {
        const html = await httpGet(url);
        const m = html.match(/조회수<\/dt>\s*<dd[^>]*>\s*(?:<i[^>]*>.*?<\/i>\s*)?(\d[\d,]*)/s);
        return m ? parseInt(m[1].replace(/,/g, ''), 10) : null;
    },
    PPOMPPU: async (url) => {
        const html = await httpGet(url, { headers: { Referer: 'https://www.ppomppu.co.kr/' }, encoding: 'euc-kr' });
        const m = html.match(/조회수\s*([\d,]+)/);
        return m ? parseInt(m[1].replace(/,/g, ''), 10) : null;
    },
    BBASAK: async (url) => {
        const html = await httpGet(url);
        const m = html.match(/조회\s*<span class="fwb">([\d,]+)<\/span>/);
        return m ? parseInt(m[1].replace(/,/g, ''), 10) : null;
    },
    DASAJA: async (url) => {
        const html = await httpGet(url);
        const m = html.match(/조회:\s*([\d,]+)/);
        return m ? parseInt(m[1].replace(/,/g, ''), 10) : null;
    },
    QUASARZONE: async (url) => {
        const html = await httpGet(url);
        const m = html.match(/v2-sep"><\/span>조회\s*([\d,]+)/);
        return m ? parseInt(m[1].replace(/,/g, ''), 10) : null;
    },
    ARCALIVE: async (url) => {
        const html = await httpGet(url, { headers: { Referer: 'https://arca.live/' } });
        const m = html.match(/조회수<\/span>\s*<span class="body">([\d,]+)<\/span>/);
        return m ? parseInt(m[1].replace(/,/g, ''), 10) : null;
    },
    YGOSU: async (url) => {
        const html = await httpGet(url, { headers: { Referer: 'https://ygosu.com/' } });
        const m = html.match(/READ<\/strong>\s*:?\s*([\d,]+)/);
        return m ? parseInt(m[1].replace(/,/g, ''), 10) : null;
    },
    MIMINT: async (url) => {
        try {
            const mm = url.match(/\/bbs\/view\/([^/]+)\/([^/]+)\/(\d+)/);
            if (!mm) return null;
            const [board, btype, pid] = [mm[1], mm[2], mm[3]];
            const html = await httpGet(`https://www.mimint.co.kr/bbs/list/${board}/${btype}`);
            const m2 = html.match(new RegExp(`/bbs/view/${board}/${btype}/${pid}"[^>]*>.*?col view">\\s*([\\d,]+)`, 's'));
            return m2 ? parseInt(m2[1].replace(/,/g, ''), 10) : null;
        } catch (e) { return null; }
    },
    MLBPARK: async (url) => {
        try {
            const bm = url.match(/[?&]b=([a-z0-9_]+)/);
            const pid = url.match(/[?&]id=(\d+)/) || url.match(/\/(\d{5,})/);
            if (!bm || !pid) return null;
            const html = await httpGet(`https://mlbpark.donga.com/mp/b.php?b=${bm[1]}`);
            const m2 = html.match(new RegExp(`id=${pid[1]}[^>]*>.*?class='viewV'>\\s*([\\d,]+)`, 's'));
            return m2 ? parseInt(m2[1].replace(/,/g, ''), 10) : null;
        } catch (e) { return null; }
    },
    DVDPRIME: async (url) => {
        const html = await httpGet(url);
        const m = html.match(/id="view_hit"[^>]*>\s*(?:<i[^>]*><\/i>)?(?:&nbsp;|\s)*([\d,]+)/);
        return m ? parseInt(m[1].replace(/,/g, ''), 10) : null;
    },
};

// ===== Puppeteer-based COUNT_RULES (fallback when HTTP fails) =====
const COUNT_RULES = {
    INVEN:      { sel: '.articleHit, .viewCount, .hit, .article-info', re: '(?:조회|Views|Hit)\\s*[:]?\\s*([\\d,]+)' },
    RULIWEB:    { sel: '.hit strong, .hit_low strong, .hit_medium strong, .hit_high strong, .user_info' },
    DCINSIDE:   { sel: '.gall_count, .gallview_head .gall_count, .view_info .gall_count, .fr .gall_count' },
    DONPPU:     { sel: '.count_read, .count' },
    DIMITORY:   { sel: '.side.fr span:nth-child(1) b, .rd_hd .side.fr b, .btm_area .side.fr b' },
    THREDIC:    { sel: '.all.read .hit, .hit' },
    NATEPANN:   { sel: '.post-tit-info .count' },
    EOMISAE:    { sel: '._hd .btm_area, .btm_area' },
    SLRCLUB:    { sel: 'td.click, .click.bbs_ct_small' },
    JAYOUNG:    { sel: '.rb_bbs_for_btm_info dd:first-child span' },
    DEALBADA:   { sel: '#bo_v_info', re: '조회\\s*([\\d,]+)' },
    TE31:       { sel: '.mbox', re: '([\\d,]+)\\s*명이 읽었어요' },
    THEQOO:     { sel: '.rd_hd .count_container, .theqoo_document_header .count_container' },
    FEMCO:      { sel: '.rd_hd .btm_area .side.fr', re: '조회\\s*수?\\s*([\\d,]+)' },
    DOGDRIP:    { sel: '.fa-eye, .article-head span.text-muted:last-child, .ed.view-count' },
    FMKOREA:    { sel: '.rd_hd .btm_area .side.fr', re: '조회\\s*수?\\s*([\\d,]+)' },
    FANCUG:     { sel: '.post-info .hit, .hit' },
    BOBAEDREAM:{ sel: '.countGroup .txtType, .util .data4' },
    DEOKJIL:    { sel: '.btm_area .side.fr span:nth-child(1) b' },
    FOOTSELL:   { sel: '.view_count, .hit, .read' },
    CITY:       { sel: '.post_info .count, .count, .hit' },
    NAVER_KIN:  { sel: '.userInfo.userInfo__bullet .infoItem, .endContents .count' },
    ETOLAND:    { sel: '#view-header, .mw_basic_view_hit, .hit' },
    DAUM:       { sel: '.num_view, .article_info .num, .num_count' },
    NAVER:      { sel: '.article_info .count, .count' },
};

// ===== Puppeteer DOM 기반 조회수 읽기 =====
async function readCountPuppeteer(page, siteType) {
    const rule = COUNT_RULES[siteType];
    if (!rule || !page) return null;
    try {
        const val = await page.evaluate((sel, reSrc) => {
            let re = null;
            try { re = reSrc ? new RegExp(reSrc) : null; } catch (e) { re = null; }
            const els = document.querySelectorAll(sel);
            for (const el of els) {
                const text = (el.textContent || '').replace(/\\s+/g, ' ');
                if (re) {
                    const m = text.match(re);
                    if (m && m[1]) {
                        const n = parseInt(m[1].replace(/,/g, ''), 10);
                        if (n > 0) return n;
                    }
                } else {
                    const m = text.match(/([\\d,]{1,12})/);
                    if (m && m[1]) {
                        const n = parseInt(m[1].replace(/,/g, ''), 10);
                        if (n > 0) return n;
                    }
                }
            }
            return null;
        }, rule.sel, rule.re || null);
        return (typeof val === 'number' && val > 0) ? val : null;
    } catch (e) {
        return null;
    }
}

async function start() {
    const targetUrl = process.argv[2];
    const siteType = process.argv[3];
    const totalCount = parseInt(process.argv[4] || "0");
    const userId = process.argv[5] || "UnknownUser"; 
    const delay = parseInt(process.argv[6] || "5", 10);
    const workerId = parseInt(process.env.WORKER_ID || "1");

    if (!targetUrl || totalCount <= 0) {
        console.log(`[${userId}] 실행 조건 미충족. 종료.`);
        process.exit(0);
    }

    let myIterations = Math.floor(totalCount / 20);
    if (workerId <= (totalCount % 20)) {
        myIterations += 1;
    }

    if (myIterations <= 0) {
        console.log(`[${userId}][Worker ${workerId}] 할당량 없음.`);
        process.exit(0);
    }

    const hasHttpReader = !!HTTP_COUNT[siteType];
    const hasRule = !!COUNT_RULES[siteType];
    const canVerify = hasHttpReader || hasRule;
    console.log(`🚀 [사용자: ${userId}] 워커 ${workerId} 가동 (대상: ${siteType}, 목표: ${myIterations}회, 검증: ${canVerify ? (hasHttpReader ? 'HTTP 우선' : '브라우저') : '불가(규칙 없음)'})`);

    // MongoDB 연결
    const { MongoClient } = require('mongodb');
    const uri = process.env.MONGODB_URI;
    let dbClient = null;
    let progressCollection = null;

    if (uri) {
        try {
            dbClient = new MongoClient(uri);
            await dbClient.connect();
            progressCollection = dbClient.db('global_auth_center').collection('cloud_progress');
            console.log(`[${userId}][W${workerId}] MongoDB 실시간 집계 연결 성공`);
        } catch (initDbErr) {
            console.error(`[${userId}][W${workerId}] MongoDB 초기 연결 실패:`, initDbErr.message);
        }
    } else {
        console.log("[MongoDB 오류] MONGODB_URI 환경변수가 누락되었습니다.");
    }

    const launchBrowser = async (retries = 3) => {
        for (let i = 0; i < retries; i++) {
            try {
                return await puppeteer.launch({
                    executablePath: '/usr/bin/google-chrome',
                    headless: "new",
                    timeout: 60000, 
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-blink-features=AutomationControlled',
                        '--window-size=1280,800',
                        '--disable-gpu',
                        '--no-first-run',
                        '--js-flags="--max-old-space-size=512"'
                    ]
                });
            } catch (e) {
                console.log(`[${userId}][Retry ${i+1}] 브라우저 실행 실패: ${e.message}`);
                if (i === retries - 1) throw e;
                await new Promise(r => setTimeout(r, 5000));
            }
        }
    };

    const browser = await launchBrowser();
    let lastSeen = null;
    let countedTotal = 0;
    let unverifiedTotal = 0;
    const docKey = { userId: userId, url: targetUrl, siteName: siteType };

    if (progressCollection) {
        try {
            const prev = await progressCollection.findOne(docKey);
            if (prev && typeof prev.lastCount === 'number' && prev.lastCount > 0) {
                lastSeen = prev.lastCount;
                console.log(`[${userId}][W${workerId}] 기준 조회수 복원: ${lastSeen}`);
            }
        } catch (e) { /* 무시 */ }
    }

    const record = async ({ counted, unverified, cur }) => {
        if (!progressCollection) return;
        const inc = { attempts: 1 };
        if (counted) inc.count = 1;
        if (unverified) inc.unverified = 1;
        if (!counted && !unverified) inc.notCounted = 1;
        const set = { updatedAt: new Date() };
        if (typeof cur === 'number' && cur > 0) set.lastCount = cur;
        try {
            await progressCollection.updateOne(docKey, { $inc: inc, $set: set }, { upsert: true });
        } catch (dbErr) {
            console.log(`MongoDB 기록 실패: ${dbErr.message}`);
        }
    };

    try {
        for (let i = 1; i <= myIterations; i++) {
            try {
                console.log(`[${userId}][W${workerId}] 진행: ${i}/${myIterations}`);

                let context = await browser.createIncognitoBrowserContext().catch(() => browser);
                const page = await (context === browser ? browser.newPage() : context.newPage());
                
                page.setDefaultNavigationTimeout(45000);
                page.setDefaultTimeout(45000);

                await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

                await page.setExtraHTTPHeaders({
                    'referer': 'https://www.google.com/',
                    'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
                });

                await page.setRequestInterception(true);
                page.on('request', (req) => {
                    const url = req.url();
                    const type = req.resourceType();
                    if (['image', 'font', 'media'].includes(type)) return req.abort();
                    req.continue();
                });

                // ===== 1) 부스터 실행 전 기준 조회수 확보 =====
                // HTTP가 가능하면 먼저 시도. 안 되면 브라우저 페이지 로드 후 DOM에서 읽는다.
                let before = null;
                if (hasHttpReader) {
                    try { before = await HTTP_COUNT[siteType](targetUrl); } catch(e) {}
                    if (before != null) console.log(`[${userId}][W${workerId}] [HTTP-before] ${before}`);
                }

                // ===== 2) 부스터 실행 =====
                const runBooster = boosters[siteType];
                if (!runBooster) {
                    console.log(`[${userId}][W${workerId}] 미지원 사이트: ${siteType}`);
                    if (context !== browser) await context.close().catch(() => {});
                    break; 
                }

                const boosterResult = await runBooster(page, targetUrl, (msg) => 
                    console.log(`[${userId}][W${workerId}] ${msg}`)
                ).catch(e => {
                    console.log(`[${userId}][W${workerId}] 부스터 예외: ${e.message}`);
                    return false;
                });

                // ===== 3) 부스터 직후, 페이지가 열려있는 상태에서 조회수 읽기 =====
                let cur = null;
                // 3a) HTTP 우선 (브라우저와 무관, 가장 정확)
                if (hasHttpReader) {
                    try { cur = await HTTP_COUNT[siteType](targetUrl); } catch(e) {}
                    if (cur != null) console.log(`[${userId}][W${workerId}] [HTTP-after] ${cur}`);
                }
                // 3b) HTTP 실패 → Puppeteer DOM에서 직접 읽기 (페이지가 아직 열려있음)
                if (cur == null && hasRule) {
                    cur = await readCountPuppeteer(page, siteType);
                    if (cur != null) console.log(`[${userId}][W${workerId}] [DOM-after] ${cur}`);
                }
                // 3c) before도 없으면 Puppeteer DOM에서 before도 읽기
                if (before == null && hasRule) {
                    before = await readCountPuppeteer(page, siteType);
                    if (before != null) console.log(`[${userId}][W${workerId}] [DOM-before] ${before}`);
                }

                // 페이지 정리
                if (context !== browser) await context.close().catch(() => {});
                else await page.close().catch(() => {});

                // ===== 4) 델타 검증 =====
                if (!canVerify) {
                    unverifiedTotal += 1;
                    await record({ counted: false, unverified: true, cur: null });
                    console.log(`[MongoDB] ${siteType} 미검증 집계 (조회수 규칙 없음)`);
                } else if (cur == null) {
                    await record({ counted: false, unverified: false, cur: before });
                    console.log(`[검증] ${siteType} 조회수 읽기 실패 — 판정 보류 (before=${before})`);
                } else if (lastSeen == null) {
                    // 첫 관측: 기준값만 저장
                    lastSeen = before != null ? before : cur;
                    await record({ counted: false, unverified: false, cur: cur });
                    console.log(`[검증] ${siteType} 기준 조회수 설정: ${lastSeen} (현재=${cur})`);
                } else if (cur > lastSeen) {
                    countedTotal += 1;
                    lastSeen = cur;
                    await record({ counted: true, unverified: false, cur: cur });
                    console.log(`[검증] ${siteType} 조회수 증가 확인 → 집계 (${lastSeen} → ${cur}, +${cur - lastSeen})`);
                } else {
                    await record({ counted: false, unverified: false, cur: cur });
                    console.log(`[검증] ${siteType} 조회수 미반영 (${lastSeen} → ${cur})`);
                }
                
                await new Promise(r => setTimeout(r, (delay * 1000) + Math.random() * 2000));

            } catch (iterationError) {
                console.error(`[${userId}][W${workerId}] 에러 발생:`, iterationError.message);
                await new Promise(r => setTimeout(r, 5000));
            }
        }

        // 최종 확인 (HTTP-only — 브라우저 없이 직접 요청)
        if (canVerify && countedTotal < myIterations) {
            let cur = null;
            if (HTTP_COUNT[siteType]) {
                try { cur = await HTTP_COUNT[siteType](targetUrl); } catch (e) {}
            }
            if (cur != null && lastSeen != null && cur > lastSeen) {
                const gained = Math.min(cur - lastSeen, myIterations - countedTotal);
                if (gained > 0) {
                    countedTotal += gained;
                    await record({ counted: true, unverified: false, cur: cur });
                    console.log(`[검증] ${siteType} 최종 확인 +${gained} (현재 ${cur})`);
                }
            }
        }
    } catch (e) {
        console.error(`[${userId}][W${workerId}] 치명적 에러:`, e.message);
    } finally {
        console.log(`🏁 [${userId}][W${workerId}] 집계 결과 — 검증 ${countedTotal}회 / 미검증 ${unverifiedTotal}회 / 할당 ${myIterations}회`);
        if (browser) await browser.close().catch(() => {});
        if (dbClient) await dbClient.close().catch(() => {});
        console.log(`🏁 [${userId}][W${workerId}] 작업 완료 및 종료.`);
        process.exit(0);
    }
}

start();
