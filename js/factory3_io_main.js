/* js/factory3_io_main.js */
window.Factory3Io = window.Factory3Io || {};

Factory3Io.Main = {
    // 한 번에 로드할 날짜 범위 설정 (필요시 조정 가능)
    CHUNK_DAYS: 21,

    init: async function () {
        // 초기 로딩 시 어제 날짜 기준으로 기간을 설정하여 데이터를 로드합니다.
        const endStr = Factory3Io.Utils.yesterdayStr();
        const endDate = new Date(endStr + 'T00:00:00');
        
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - (this.CHUNK_DAYS - 1));
        const startStr = Factory3Io.Utils.fmtDate(startDate);

        // 최초 데이터 로드 영역 고정
        Factory3Io.currentStartDate = startStr;
        Factory3Io.currentEndDate = endStr;

        // 화면 텍스트 업데이트 및 로딩 시작
        Factory3Io.Render.updateDateText(`${startStr} ~ ${endStr}`);
        Factory3Io.dataCache = {};
        Factory3Io.baselineRow = null;

        await this.loadDataChunk(startStr, endStr);
    },

    /* ─────────────────────────────────────────
       핵심: 데이터 로드 및 최적화 오케스트레이션
    ───────────────────────────────────────── */
    loadDataChunk: async function (start, end) {
        try {
            // 1. 화면에 로딩 상태 표시
            Factory3Io.Render.showLoading();

            // 2. 누적 재고의 시작 기준점이 되는 Baseline 데이터 선행 조회
            await Factory3Io.API.fetchBaseline(start);

            // 3. [성능 최적화 핵심]: 의존성이 없는 3개의 API를 동시에 병렬 호출합니다.
            // 순차 호출(await A -> await B) 대비 통신 대기 시간이 드라마틱하게 줄어듭니다.
            await Promise.all([
                Factory3Io.API.loadIoTableRange(start, end),
                Factory3Io.API.loadOutgoingRange(start, end),
                Factory3Io.API.loadUsageDataRange(start, end)
            ]);

            // 4. 로드 완료된 데이터를 기반으로 순방향 롤링 재고 재계산
            Factory3Io.API.recalcAllStocks();

            // 5. 날짜별로 정렬하여 화면 초기 렌더링 수행
            const dates = Object.keys(Factory3Io.dataCache).sort();
            const rows = dates.map(ds => Factory3Io.Render.buildRow(ds));
            
            Factory3Io.Render.renderInitial(rows);

        } catch (err) {
            console.error('Data Load Error:', err);
            Factory3Io.Render.showError('데이터를 가져오는 중 오류가 발생했습니다. 다시 시도해 주세요.');
        }
    },

    /* ─────────────────────────────────────────
       이전 내역 더보기 기능 (스크롤 또는 버튼 연동용)
    ───────────────────────────────────────── */
    loadPrevChunk: async function () {
        if (!Factory3Io.currentStartDate) return;

        const currStart = new Date(Factory3Io.currentStartDate + 'T00:00:00');
        
        // 새로운 종료일은 기존 시작일의 하루 전
        const newEnd = new Date(currStart);
        newEnd.setDate(newEnd.getDate() - 1);
        
        // 새로운 시작일 계산
        const newStart = new Date(newEnd);
        newStart.setDate(newStart.getDate() - (this.CHUNK_DAYS - 1));

        const startStr = Factory3Io.Utils.fmtDate(newStart);
        const endStr = Factory3Io.Utils.fmtDate(newEnd);

        // 기준 데이터 글로벌 전역 범위 확장
        Factory3Io.currentStartDate = startStr;
        Factory3Io.Render.updateDateText(`${startStr} ~ ${Factory3Io.currentEndDate}`);

        // 기존 캐시를 유지한 채로 과거 청크 데이터 병렬 추가 로드
        await this.loadDataChunk(startStr, Factory3Io.currentEndDate);
    }
};

// DOM 생성 완료 시 즉시 구동 시작
document.addEventListener('DOMContentLoaded', () => {
    if (Factory3Io.Main && typeof Factory3Io.Main.init === 'function') {
        Factory3Io.Main.init();
    }
});