// boosters/etc.js
// ETC(미지원 도메인) 범용 부스터 — 알려진 커뮤니티 목록에 없는 URL도 클라우드 경로로 부스트한다.
module.exports = async (page, url, addLog) => {
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));

        // 본문 셀렉터가 있으면 대기, 없어도 진행
        await page.waitForSelector('article, .article, .post, .content, #content, .board-view, .view, .xe_content', { timeout: 8000 })
            .catch(() => { if (addLog) addLog('[ETC] 본문 셀렉터 미검출 — 그래도 진행'); });

        // 자연스러운 스크롤
        await page.evaluate(async () => {
            const loops = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < loops; i++) {
                window.scrollBy({ top: 250 + Math.random() * 350, behavior: 'smooth' });
                await new Promise(r => setTimeout(r, 700 + Math.random() * 600));
            }
            window.scrollBy({ top: -150, behavior: 'smooth' });
        });

        const stay = 8000 + Math.random() * 5000;
        const host = (() => { try { return new URL(url).hostname; } catch (e) { return 'unknown'; } })();
        if (addLog) addLog(`[ETC] ${host} 체류 ${(stay / 1000).toFixed(1)}초`);
        await new Promise(r => setTimeout(r, stay));

        // 조회수 표기 best-effort 탐지 (규칙 미등록 사이트는 미검증으로 집계됨)
        const cnt = await page.evaluate(() => {
            const t = document.body ? document.body.innerText : '';
            const m = t.match(/(?:조회\s*수?|views?|hits?)\s*[:：]?\s*([\d,]+)/i);
            return m ? m[1] : null;
        }).catch(() => null);
        if (addLog) addLog(`[ETC] 조회수 표기: ${cnt || '미검출'}`);
        return true;
    } catch (e) {
        if (e.message.includes('Target closed') || e.message.includes('Session closed')) return false;
        if (addLog) addLog(`[ETC] 에러: ${e.message}`);
        return false;
    }
};
