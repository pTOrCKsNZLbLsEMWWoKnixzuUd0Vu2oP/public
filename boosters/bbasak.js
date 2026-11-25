module.exports = async (page, url, addLog) => {
    try {
        await page.setExtraHTTPHeaders({
            'Referer': 'https://bbasak.com/bbs/board.php?bo_table=bbasak1',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8'
        });
        if (addLog) addLog('[BBASAK] 목록 페이지 선행 방문...');
        await page.goto('https://bbasak.com/bbs/board.php?bo_table=bbasak1', { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
        await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));

        if (addLog) addLog('[BBASAK] 본문 진입...');
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

        await page.waitForSelector('.bo_v_con, #bo_v_con, .view-content', { timeout: 12000 }).catch(() => {
            if (addLog) addLog('[BBASAK] 본문 셀렉터 대기 실패 — 그래도 진행');
        });

        await page.evaluate(async () => {
            const loops = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < loops; i++) {
                window.scrollBy({ top: 250 + Math.random() * 350, behavior: 'smooth' });
                await new Promise(r => setTimeout(r, 700 + Math.random() * 600));
            }
        });
        const stay = 4000 + Math.floor(Math.random() * 4000);
        if (addLog) addLog(`[BBASAK] 체류 ${(stay/1000).toFixed(1)}초`);
        await new Promise(r => setTimeout(r, stay));

        const cnt = await page.evaluate(() => {
            const t = document.body ? document.body.innerText : '';
            const m = t.match(/조회\s*수?\s*[:：]?\s*([\d,]+)/);
            return m ? m[1] : null;
        }).catch(() => null);
        if (addLog) addLog(`[BBASAK] 조회수 표기: ${cnt || '미검출'}`);
        return true;
    } catch (e) {
        if (addLog) addLog(`[BBASAK] 에러: ${e.message}`);
        return false;
    }
};
