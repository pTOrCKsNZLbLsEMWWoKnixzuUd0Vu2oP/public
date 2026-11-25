const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const UserAgent = require('user-agents');

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

// ===== 조회수 검증 규칙 =====
// 로컬 엔진에서 실제 조회수 읽기가 확인된 사이트만 등록한다.
// sel: 후보 셀렉터(콤마 구분), re: 조회수 텍스트 패턴(캡처 1 = 숫자).
// re가 없으면 선택 요소의 첫 숫자를 조회수로 본다.
const COUNT_RULES = {
    PPOMPPU:    { sel: '.topTitle-mainbox, .bbs.view .info, .info', re: '(?:조회수|조회)\\s*[:]?\\s*([\\d,]+)' },
    INVEN:      { sel: '.articleHit, .viewCount, .hit, .article-info', re: '(?:조회|Views|Hit)\\s*[:]?\\s*([\\d,]+)' },
    RULIWEB:    { sel: '.hit strong, .hit_low strong, .hit_medium strong, .hit_high strong' },
    DCINSIDE:   { sel: '.gall_count, .gallview_head .gall_count, .view_info .gall_count, .fr .gall_count' },
    DONPPU:     { sel: '.count_read, .count' },
    DIMITORY:   { sel: '.side.fr span:nth-child(1) b, .rd_hd .side.fr b, .btm_area .side.fr b' },
    THREDIC:    { sel: '.all.read .hit, .hit' },
    NATEPANN:   { sel: '.post-tit-info .count' },
    MLBPARK:    { sel: '.text2', re: '조회\\s*([\\d,]+)' },
    EOMISAE:    { sel: '._hd .btm_area, .btm_area' },
    SLRCLUB:    { sel: 'td.click, .click' },
    JAYOUNG:    { sel: '.rb_bbs_for_btm_info dd:first-child span' },
    DEALBADA:   { sel: '#bo_v_info', re: '조회\\s*([\\d,]+)' },
    TE31:       { sel: '.mbox', re: '([\\d,]+)\\s*명이 읽었어요' },
    ARCALIVE:   { sel: '.article-info', re: '(?:Views|조회수)\\s*([\\d,]+)' },
    THEQOO:     { sel: '.rd_hd .count_container, .theqoo_document_header .count_container' },
    FEMCO:      { sel: '.rd_hd .btm_area .side.fr', re: '조회\\s*수?\\s*([\\d,]+)' },
};

// 페이지에서 조회수를 읽는다. 규칙이 없거나 읽기 실패면 null(검증 불가).
async function readCount(page, siteType) {
    const rule = COUNT_RULES[siteType];
    if (!rule) return null;
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

    const canVerify = !!COUNT_RULES[siteType];
    console.log(`🚀 [사용자: ${userId}] 워커 ${workerId} 가동 (대상: ${siteType}, 목표: ${myIterations}회, 검증: ${canVerify ? '조회수 비교' : '불가(규칙 없음)'})`);

    // 💡 [최적화 1] 반복문 진입 전 MongoDB 커넥션을 딱 1번만 연결합니다.
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
    let lastSeen = null;       // 마지막으로 관측한 절대 조회수
    let countedTotal = 0;      // 실제 반영 확인된 횟수
    let unverifiedTotal = 0;   // 검증 불가로 집계한 횟수
    const docKey = { userId: userId, url: targetUrl, siteName: siteType };

    // 이전 실행에서 남은 lastCount가 있으면 기준으로 사용
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

                // 무작위 UA 대신 신뢰도 높은 최신 Chrome UA 고정 사용 (Stealth 플러그인과 궁합이 좋음)
                await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

                // 우회를 위한 기본 헤더 추가
                await page.setExtraHTTPHeaders({
                    'referer': 'https://www.google.com/',
                    'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
                });

                await page.setRequestInterception(true);
                page.on('request', (req) => {
                    const url = req.url();
                    const type = req.resourceType();
                    const allowedDomains = ['naver.com', 'naver.net', 'daum.net', 'daumcdn.net', 'kakao.com', 'nate.com'];
                    if (allowedDomains.some(domain => url.includes(domain))) return req.continue();
                    if (['image', 'font', 'media'].includes(type)) return req.abort();
                    req.continue();
                });

                const runBooster = boosters[siteType];
                let isSuccess = false;

                if (runBooster) {
                    isSuccess = await runBooster(page, targetUrl, (msg) => 
                        console.log(`[${userId}][W${workerId}] ${msg}`)
                    ).then(() => true).catch(e => {
                        console.log(`[${userId}][W${workerId}] 시도 실패: ${e.message}`);
                        return false;
                    });
                } else {
                    console.log(`[${userId}][W${workerId}] 미지원 사이트: ${siteType}`);
                    if (context !== browser) await context.close().catch(() => {});
                    break; 
                }

                // 부스터 종료 직후 같은 페이지에서 조회수를 읽어 실제 반영 여부를 판정한다.
                let cur = null;
                if (isSuccess && canVerify) {
                    cur = await readCount(page, siteType);
                }

                if (context !== browser) await context.close().catch(() => {});
                else await page.close().catch(() => {});

                if (isSuccess) {
                    if (!canVerify) {
                        // 조회수를 읽을 수 없는 사이트 — 전송만 확인, 미검증으로 집계
                        unverifiedTotal += 1;
                        await record({ counted: false, unverified: true, cur: null });
                        console.log(`[MongoDB] ${siteType} 미검증 집계 (조회수 규칙 없음)`);
                    } else if (cur == null) {
                        // 규칙은 있으나 이번 로드에서 읽기 실패 — 판정 보류, 기준만 유지
                        await record({ counted: false, unverified: false, cur: null });
                        console.log(`[검증] ${siteType} 조회수 읽기 실패 — 판정 보류`);
                    } else if (lastSeen == null) {
                        // 첫 관측: 기준값만 저장 (이 회차는 판정하지 않음)
                        lastSeen = cur;
                        await record({ counted: false, unverified: false, cur: cur });
                        console.log(`[검증] ${siteType} 기준 조회수 설정: ${cur}`);
                    } else if (cur > lastSeen) {
                        countedTotal += 1;
                        lastSeen = cur;
                        await record({ counted: true, unverified: false, cur: cur });
                        console.log(`[검증] ${siteType} 조회수 증가 확인 → 집계 (현재 ${cur})`);
                    } else {
                        await record({ counted: false, unverified: false, cur: cur });
                        console.log(`[검증] ${siteType} 조회수 미반영 (${lastSeen} → ${cur}) — 미집계`);
                    }
                }
                
                // delay 변수를 활용한 대기 시간
                await new Promise(r => setTimeout(r, (delay * 1000) + Math.random() * 2000));

            } catch (iterationError) {
                console.error(`[${userId}][W${workerId}] 에러 발생:`, iterationError.message);
                await new Promise(r => setTimeout(r, 5000));
            }
        }

        // 마지막 회차 보정: 반복 종료 후 한 번 더 읽어 미집계분을 확정한다.
        if (canVerify && countedTotal < myIterations) {
            let page2 = null;
            try {
                page2 = await browser.newPage();
                await page2.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
                await page2.setExtraHTTPHeaders({ 'referer': 'https://www.google.com/', 'accept-language': 'ko-KR,ko;q=0.9' });
                await page2.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {});
                const cur = await readCount(page2, siteType);
                if (cur != null && lastSeen != null && cur > lastSeen) {
                    const gained = Math.min(cur - lastSeen, myIterations - countedTotal);
                    if (gained > 0) {
                        countedTotal += gained;
                        await record({ counted: true, unverified: false, cur: cur });
                        console.log(`[검증] ${siteType} 최종 확인 +${gained} (현재 ${cur})`);
                    }
                }
            } catch (e) { /* 무시 */ }
            finally { if (page2) await page2.close().catch(() => {}); }
        }
    } catch (e) {
        console.error(`[${userId}][W${workerId}] 치명적 에러:`, e.message);
    } finally {
        console.log(`🏁 [${userId}][W${workerId}] 집계 결과 — 검증 ${countedTotal}회 / 미검증 ${unverifiedTotal}회 / 할당 ${myIterations}회`);
        if (browser) await browser.close().catch(() => {});
        // 💡 [최적화 3] 워커 종료 시 DB 커넥션을 1회 안전하게 닫아줌
        if (dbClient) await dbClient.close().catch(() => {});
        console.log(`🏁 [${userId}][W${workerId}] 작업 완료 및 종료.`);
        process.exit(0);
    }
}

start();
