/* js/factory3_io_main.js */
window.Factory3Io = window.Factory3Io || {};

Factory3Io.Main = {
    // 한 번에 로드할 날짜 범위 설정 (21일치 청크)
    CHUNK_DAYS: 21,

    init: async function () {
        // [수정] 오늘 이후의 날짜 프레임도 강제로 노출시키기 위해 종료일을 '오늘 + 4일'로 잡음
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + 4); 
        const endStr = Factory3Io.Utils.fmtDate(endDate);
        
        // 시작일 계산
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

        // [추가] 이벤트 리스너(스크롤 동기화, 클릭 하이라이트) 선행 등록
        this.bindEvents();

        // 첫 청크 데이터 호출 및 빌드
        await this.loadDataChunk(startStr, endStr);

        // [추가] 오늘/어제 날짜 행이 가운데 상단(윗쪽)에 배치되도록 자동 스크롤 조절
        this.scrollToToday();
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

            // 3. 의존성이 없는 3개의 API를 동시에 병렬 호출
            await Promise.all([
                Factory3Io.API.loadIoTableRange(start, end),
                Factory3Io.API.loadOutgoingRange(start, end),
                Factory3Io.API.loadUsageDataRange(start, end)
            ]);

            // [추가 핵심]: DB에 데이터가 없거나 오늘 이후 미래 날짜여도 테이블에 행 프레임을 강제로 표시하도록 배열 생성
            const allDates = Factory3Io.Utils.getDatesRange(start, end);
            allDates.forEach(ds => {
                if (!Factory3Io.dataCache[ds]) {
                    Factory3Io.dataCache[ds] = {}; // 빈 데이터 껍데기 바인딩
                }
            });

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
       이전 내역 더보기 기능 (스크롤 연동 완료)
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
    },

    /* ─────────────────────────────────────────
       [추가] 이벤트 동기화 및 바인딩 관리 핸들러
    ───────────────────────────────────────── */
    bindEvents: function () {
        const panels = Factory3Io.PANEL_IDS.map(id => document.getElementById(id)).filter(Boolean);
        
        // 1. 3개 패널 세로 스크롤 완전 동기화 및 무한 스크롤 연동
        let isSyncing = false;
        panels.forEach(panel => {
            panel.addEventListener('scroll', async () => {
                // 패널 스크롤 동기화 가드
                if (!isSyncing) {
                    isSyncing = true;
                    const top = panel.scrollTop;
                    panels.forEach(p => {
                        if (p !== panel) p.scrollTop = top;
                    });
                    isSyncing = false;
                }

                // 최상단 도달 시 과거 DB 데이터 갱신 및 트리거 호출
                if (panel.scrollTop === 0 && !Factory3Io.state.isLoadingPrev) {
                    Factory3Io.state.isLoadingPrev = true;
                    
                    // 과거 데이터 렌더링 전 스크롤 높이 기록
                    const preScrollHeight = panel.scrollHeight;

                    await this.loadPrevChunk();
                    
                    // 갱신 완료 후 위치가 갑자기 맨 위로 튀지 않도록 이전 위치 유지 보정
                    setTimeout(() => {
                        const postScrollHeight = panel.scrollHeight;
                        const diff = postScrollHeight - preScrollHeight;
                        panels.forEach(p => p.scrollTop = diff > 0 ? diff : 10);
                        Factory3Io.state.isLoadingPrev = false;
                    }, 50);
                }
            });
        });

        // 2. 셀/행 클릭 이벤트 처리 (CSS 하이라이트 클래스 동적 변환)
        ['f3ioBody1', 'f3ioBody2', 'f3ioBody3'].forEach(bodyId => {
            const body = document.getElementById(bodyId);
            if (!body) return;

            body.addEventListener('click', (e) => {
                // 날짜 셀 또는 일반 데이터 셀 탐색
                const td = e.target.closest('.f3io-data-cell, .f3io-date-td');
                if (!td) return;
                
                const tr = td.closest('tr');
                if (!tr) return;
                
                const date = tr.getAttribute('data-date');
                if (!date) return;

                // 글로벌 상태 저장
                Factory3Io.state.selectedDate = date;
                Factory3Io.state.selectedCol = td.getAttribute('data-col');

                // 활성화되어 있던 기존 모든 하이라이트 디자인 청소
                document.querySelectorAll('.f3io-selected-row').forEach(r => r.classList.remove('f3io-selected-row'));
                document.querySelectorAll('.f3io-selected-cell').forEach(c => c.classList.remove('f3io-selected-cell'));

                // 클릭된 날짜와 매치되는 3개 패널의 모든 tr을 찾아 동시에 강조 색상 부여
                document.querySelectorAll(`tr[data-date="${date}"]`).forEach(r => {
                    r.classList.add('f3io-selected-row');
                });

                // 클릭한 그 셀 한 칸만 진한 테두리/폰트 강조 포인트 효과 부여
                if (td.classList.contains('f3io-data-cell')) {
                    td.classList.add('f3io-selected-cell');
                }
            });
        });
    },

    /* ─────────────────────────────────────────
       [추가] 위치 지정 가이드: 어제/오늘 날짜 중앙 포커스
    ───────────────────────────────────────── */
    scrollToToday: function () {
        setTimeout(() => {
            const todayStr = Factory3Io.Utils.todayStr();
            const todayRow = document.querySelector(`#f3ioBody1 tr[data-date="${todayStr}"]`);
            const panel1 = document.getElementById('f3ioScrollPanel1');
            const panels = Factory3Io.PANEL_IDS.map(id => document.getElementById(id)).filter(Boolean);
            
            if (todayRow && panel1) {
                // 오늘 데이터 행의 y위치에서 스크롤 패널 높이의 3분의 1을 빼주어 "가운데에서 상단 윗쪽"에 안착시킴
                const targetTop = todayRow.offsetTop - (panel1.clientHeight / 3);
                panels.forEach(p => p.scrollTop = targetTop);
            } else {
                // 실패 시 기본 안전장치로 최하단 정렬
                panels.forEach(p => p.scrollTop = p.scrollHeight);
            }
        }, 300);
    }
};

// DOM 생성 완료 시 즉시 구동 시작
document.addEventListener('DOMContentLoaded', () => {
    if (Factory3Io.Main && typeof Factory3Io.Main.init === 'function') {
        Factory3Io.Main.init();
    }
});