module.exports = async (page, url) => {
    const isM = url.includes('m.ppomppu.co.kr');

    try {
        const client = await page.target().createCDPSession();
        await client.send('Network.clearBrowserCookies');
        await client.send('Network.clearBrowserCache');

        await page.setUserAgent(isM
            ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
            : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.setViewport(isM
            ? { width: 390, height: 844, isMobile: true, hasTouch: true }
            : { width: 1440, height: 900 });

        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            window.chrome = { runtime: {}, loadTimes: function() {}, csi: function() {}, app: {} };
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
            Object.defineProperty(navigator, 'languages', { get: () => ['ko-KR', 'ko', 'en-US', 'en'] });
        });

        const boardId = url.split('id=')[1]?.split('&')[0];
        // [수정] 목록 페이지 경로 정정: zboard/zboard.php(X) → zboard.php(O)
        const boardUrl = isM
            ? `https://m.ppomppu.co.kr/new/zboard.php?id=${boardId}`
            : `https://www.ppomppu.co.kr/zboard.php?id=${boardId}`;

        await page.setExtraHTTPHeaders({
            'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
        });

        // [추가] 1) 목록 페이지 선행 방문 — 세션 쿠키 발급 (뽐뿌 카운터는
        // 게시판 유입 세션이 있어야 조회수를 반영하는 것으로 추정)
        await page.goto(boardUrl, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
        await new Promise(r => setTimeout(r, 1200 + Math.random() * 1000));

        // 2) 게시글 진입 (목록 → 본문 자연 유입 흐름)
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

        await page.evaluate(async () => {
            const scrollHeight = document.body.scrollHeight;
            const targetDepth = scrollHeight * (0.5 + Math.random() * 0.3);
            const step = 200;
            for (let i = 0; i < targetDepth; i += step) {
                window.scrollBy({ top: step, behavior: 'smooth' });
                await new Promise(r => setTimeout(r, 200 + Math.random() * 150));
            }
        });

        await page.mouse.click(150 + Math.random() * 100, 200 + Math.random() * 100).catch(() => {});

        const stayTime = 5000 + Math.floor(Math.random() * 3000);
        await new Promise(r => setTimeout(r, stayTime));

        return true;
    } catch (e) {
        console.error("뽐뿌 부스팅 에러:", e.message);
        return false;
    }
};
