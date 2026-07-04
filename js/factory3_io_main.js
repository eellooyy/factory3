/* js/factory3_io_main.js */
window.Factory3Io = window.Factory3Io || {};

(function () {
    'use strict';

    const Utils = Factory3Io.Utils;
    const API = Factory3Io.API;
    const Render = Factory3Io.Render;

    /* ─────────────────────────────────────────
       초기 로드 (최근 3주치) 및 지연 로드 (이전 3주치) 컨트롤러
    ───────────────────────────────────────── */
    async function loadDataChunk(targetDateStr) {
        if (Factory3Io.state.loading) return;
        Factory3Io.state.loading = true;

        Factory3Io.dataCache = {}; 
        Factory3Io.baselineRow = null;
        Render.showLoading();

        try {
            const end = targetDateStr; 
            const start = Utils.addDays(end, -(Factory3Io.CHUNK_DAYS - 1));
            
            await API.fetchBaseline(start);
            await API.loadIoTableRange(start, end);
            await API.loadOutgoingRange(start, end);
            await API.loadUsageDataRange(start, end);
            
            API.recalcAllStocks();

            const dates = Utils.getDatesRange(start, end);
            const rows  = dates.map(ds => Render.buildRow(ds));
            Render.renderInitial(rows);

            Factory3Io.state.oldestLoadedDate = start;
            Factory3Io.state.initialLoaded = true;
            scrollToBottom();
            Render.updateDateText(end);

        } catch (err) {
            console.error('[factory3_io] 로드 실패:', err);
            Render.showError(`데이터 로드 실패: ${err.message}`);
        } finally {
            Factory3Io.state.loading = false;
        }
    }

    async function loadPrevChunk() {
        if (Factory3Io.state.isLoadingPrev || Factory3Io.state.loading || !Factory3Io.state.oldestLoadedDate) return;
        Factory3Io.state.isLoadingPrev = true;

        try {
            const end = Utils.addDays(Factory3Io.state.oldestLoadedDate, -1);
            const start = Utils.addDays(end, -(Factory3Io.CHUNK_DAYS - 1));

            await API.fetchBaseline(start);
            await API.loadIoTableRange(start, end);
            await API.loadOutgoingRange(start, end);
            await API.loadUsageDataRange(start, end);
            
            API.recalcAllStocks();

            const dates = Utils.getDatesRange(start, end);
            const rows  = dates.map(ds => Render.buildRow(ds));
            const htmls = Render.generateRowsHTML(rows);

            const panel1 = document.getElementById('f3ioScrollPanel1');
            const prevHeight = panel1 ? panel1.scrollHeight : 0;

            document.getElementById('f3ioBody1').insertAdjacentHTML('afterbegin', htmls.html1);
            document.getElementById('f3ioBody2').insertAdjacentHTML('afterbegin', htmls.html2);
            document.getElementById('f3ioBody3').insertAdjacentHTML('afterbegin', htmls.html3);

            Render.rerenderAllRows();
            Factory3Io.state.oldestLoadedDate = start;

            requestAnimationFrame(() => {
                if (panel1) {
                    const diff = panel1.scrollHeight - prevHeight;
                    Factory3Io.PANEL_IDS.forEach(id => { 
                        const p = document.getElementById(id); 
                        if (p) p.scrollTop += diff; 
                    });
                }
            });
        } catch (err) {
            console.error('[factory3_io] 이전 데이터 로드 오류:', err);
        } finally {
            Factory3Io.state.isLoadingPrev = false;
        }
    }

    async function handleSave() {
        if (!Factory3Io.state.selectedDate) return;
        const ds = Factory3Io.state.selectedDate;

        const row1   = document.querySelector(`#f3ioBody1 tr[data-date="${ds}"]`);
        const inputA = row1 ? row1.querySelector('td[data-col="1"] .f3io-in-input') : null;
        const inputD = row1 ? row1.querySelector('td[data-col="2"] .f3io-in-input') : null;

        const in_a = inputA ? (parseInt(inputA.value, 10) || 0) : (Factory3Io.dataCache[ds]?.in_a || 0);
        const in_d = inputD ? (parseInt(inputD.value, 10) || 0) : (Factory3Io.dataCache[ds]?.in_d || 0);

        const ok = await API.saveIncoming(ds, in_a, in_d);
        if (!ok) return;

        if (!Factory3Io.dataCache[ds]) Factory3Io.dataCache[ds] = {};
        Factory3Io.dataCache[ds].in_a = in_a;
        Factory3Io.dataCache[ds].in_d = in_d;
        
        API.recalcAllStocks();
        Render.rerenderAllRows();
        alert('저장 완료');
    }

    /* ─────────────────────────────────────────
       편집 모드 진입 / 종료 처리
    ───────────────────────────────────────── */
    function onEditModeEnter() {
        if (!Factory3Io.state.selectedDate) {
            alert('먼저 입고를 수정할 날짜 행을 클릭해 선택해주세요.');
            if (Factory3Io.state.headerApi) Factory3Io.state.headerApi.toggleEditMode();
            return;
        }
        const ds  = Factory3Io.state.selectedDate;
        const d   = Factory3Io.dataCache[ds] || {};
        const row = document.querySelector(`#f3ioBody1 tr[data-date="${ds}"]`);
        if (!row) return;

        const tdA = row.querySelector('td[data-col="1"]');
        const tdD = row.querySelector('td[data-col="2"]');

        function makeInput(val) {
            const inp = document.createElement('input');
            inp.type      = 'number';
            inp.min       = '0';
            inp.value     = val;
            inp.className = 'f3io-in-input';
            return inp;
        }

        if (tdA) {
            tdA.innerHTML = '';
            const inp = makeInput(d.in_a || 0);
            tdA.appendChild(inp);
            inp.addEventListener('keydown', e => {
                if (e.key === 'Tab' || e.key === 'Enter') {
                    e.preventDefault();
                    const inpD = row.querySelector('td[data-col="2"] .f3io-in-input');
                    if (inpD) { inpD.focus(); inpD.select(); }
                }
            });
            inp.focus(); inp.select();
        }
        if (tdD) {
            tdD.innerHTML = '';
            const inp = makeInput(d.in_d || 0);
            tdD.appendChild(inp);
            inp.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const saveBtn = document.getElementById('gf3IoSaveBtn');
                    if (saveBtn && !saveBtn.disabled) saveBtn.click();
                }
            });
        }
    }

    function onEditModeExit() {
        Render.rerenderAllRows();
    }

    /* ─────────────────────────────────────────
       스크롤 동기화 & 상단 도달 시 이전 데이터 로드
    ───────────────────────────────────────── */
    let _syncLock = false;

    function bindScrollSync() {
        Factory3Io.PANEL_IDS.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('scroll', () => {
                if (_syncLock) return;
                _syncLock = true;
                const top = el.scrollTop;
                Factory3Io.PANEL_IDS.filter(x => x !== id).forEach(tid => {
                    const t = document.getElementById(tid); if (t) t.scrollTop = top;
                });
                hideCursors();
                _syncLock = false;

                if (top <= 10 && !Factory3Io.state.isLoadingPrev && !Factory3Io.state.loading && Factory3Io.state.oldestLoadedDate) {
                    loadPrevChunk();
                }
            });
        });
    }

    function scrollToBottom() {
        setTimeout(() => requestAnimationFrame(() => {
            const panel1 = document.getElementById('f3ioScrollPanel1');
            if (!panel1) return;
            Factory3Io.PANEL_IDS.forEach(id => { 
                const p = document.getElementById(id); 
                if (p) p.scrollTop = p.scrollHeight; 
            });
        }), 50);
    }

    /* ─────────────────────────────────────────
       하이라이트 및 가상 포커스 커서 인터랙션
    ───────────────────────────────────────── */
    function hideCursors() {
        [1,2,3].forEach(i => { const c = document.getElementById(`f3ioCursor${i}`); if (c) c.classList.remove('active'); });
    }

    function showCursor(idx, td) {
        const cur = document.getElementById(`f3ioCursor${idx}`);
        const pan = document.getElementById(`f3ioScrollPanel${idx}`);
        if (!cur || !pan || !td) return;
        let top = 0, left = 0, el = td;
        while (el && el !== pan && el !== document.body) { top += el.offsetTop; left += el.offsetLeft; el = el.offsetParent; }
        cur.style.width  = td.offsetWidth  + 'px';
        cur.style.height = td.offsetHeight + 'px';
        cur.style.left   = left + 'px';
        cur.style.top    = top  + 'px';
        cur.classList.add('active');
    }

    function clearHighlights() {
        document.querySelectorAll('.f3io-selected-row').forEach(el => el.classList.remove('f3io-selected-row'));
        document.querySelectorAll('.f3io-selected-cell').forEach(el => el.classList.remove('f3io-selected-cell'));
        document.querySelectorAll('.f3io-header-active').forEach(el => el.classList.remove('f3io-header-active'));
        hideCursors();
    }

    function applyHighlight(panelIdx, ds, colDataCol) {
        if (Factory3Io.state.headerApi && Factory3Io.state.headerApi.isEditMode()) return;
        clearHighlights();
        Factory3Io.state.selectedDate  = ds;
        Factory3Io.state.selectedPanel = panelIdx;
        Factory3Io.state.selectedCol   = colDataCol;
        Render.updateDateText(ds);

        Factory3Io.PANEL_IDS.forEach((id, i) => {
            const body = document.getElementById(`f3ioBody${i+1}`);
            if (!body) return;
            const row = body.querySelector(`tr[data-date="${ds}"]`);
            if (row) row.classList.add('f3io-selected-row');
        });

        const clickedBody = document.getElementById(`f3ioBody${panelIdx}`);
        if (clickedBody && colDataCol !== null) {
            const row = clickedBody.querySelector(`tr[data-date="${ds}"]`);
            if (row) {
                const td = row.querySelector(`td[data-col="${colDataCol}"]`);
                if (td) { td.classList.add('f3io-selected-cell'); showCursor(panelIdx, td); }
            }
        }

        if (colDataCol !== null) {
            const pan = document.getElementById(`f3ioScrollPanel${panelIdx}`);
            if (pan) {
                const lv2 = pan.querySelector(`.f3io-thead-lv2 th[data-col="${colDataCol}"]`);
                if (lv2) {
                    lv2.classList.add('f3io-header-active');
                    const pg = lv2.getAttribute('data-parent-group');
                    if (pg) {
                        const lv1 = pan.querySelector(`.f3io-thead-lv1 th[data-group="${pg}"]`);
                        if (lv1) lv1.classList.add('f3io-header-active');
                    } else {
                        pan.querySelectorAll('.f3io-thead-lv1 th.f3io-top-group-th').forEach(th => th.classList.add('f3io-header-active'));
                    }
                }
            }
        }
    }

    /* ─────────────────────────────────────────
       키보드 네비게이션 & 클릭 바인딩
    ───────────────────────────────────────── */
    function bindKeyboardNav() {
        document.addEventListener('keydown', e => {
            if (Factory3Io.state.headerApi && Factory3Io.state.headerApi.isEditMode()) return;
            if (!Factory3Io.state.selectedDate || !Factory3Io.state.selectedPanel || !Factory3Io.state.selectedCol) return;
            if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return;
            e.preventDefault();

            let panelIdx = Number(Factory3Io.state.selectedPanel);
            let colNum   = Number(Factory3Io.state.selectedCol);
            const body   = document.getElementById(`f3ioBody${panelIdx}`);
            if (!body) return;
            const curRow = body.querySelector(`tr[data-date="${Factory3Io.state.selectedDate}"]`);
            if (!curRow) return;

            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                const target = e.key === 'ArrowUp' ? curRow.previousElementSibling : curRow.nextElementSibling;
                if (target && target.getAttribute('data-date')) {
                    applyHighlight(panelIdx, target.getAttribute('data-date'), String(colNum));
                    scrollToActiveCell(panelIdx);
                }
            } else {
                const colCount = { 1:6, 2:7, 3:2 };
                if (e.key === 'ArrowLeft') {
                    colNum--;
                    if (colNum < 1) { if (panelIdx > 1) { panelIdx--; colNum = colCount[panelIdx]; } else colNum = 1; }
                } else {
                    colNum++;
                    if (colNum > colCount[panelIdx]) { if (panelIdx < 3) { panelIdx++; colNum = 1; } else colNum = colCount[panelIdx]; }
                }
                applyHighlight(panelIdx, Factory3Io.state.selectedDate, String(colNum));
                scrollToActiveCell(panelIdx);
            }
        });
    }

    function scrollToActiveCell(idx) {
        const pan = document.getElementById(`f3ioScrollPanel${idx}`);
        const td  = document.querySelector(`#f3ioBody${idx} tr[data-date="${Factory3Io.state.selectedDate}"] td[data-col="${Factory3Io.state.selectedCol}"]`);
        if (!pan || !td) return;
        let top = 0, el = td;
        while (el && el !== pan && el !== document.body) { top += el.offsetTop; el = el.offsetParent; }
        const bot = top + td.offsetHeight;
        if (bot > pan.scrollTop + pan.clientHeight) pan.scrollTop = bot - pan.clientHeight + 10;
        else if (top < pan.scrollTop + 88)           pan.scrollTop = top - 88 - 10;
    }

    function bindBodyClicks() {
        [[1,'f3ioBody1'], [2,'f3ioBody2'], [3,'f3ioBody3']].forEach(([pi, bid]) => {
            const body = document.getElementById(bid);
            if (!body) return;
            body.addEventListener('click', e => {
                const td = e.target.closest('td');
                if (!td || td.classList.contains('f3io-date-td')) return;
                const tr = td.closest('tr[data-date]');
                if (!tr) return;
                applyHighlight(pi, tr.getAttribute('data-date'), td.getAttribute('data-col'));
            });
        });
    }

    /* ─────────────────────────────────────────
       모듈 외부에 노출할 인터페이스 선언
    ───────────────────────────────────────── */
    const Factory3IoModule = {
        init: function () {
            bindScrollSync();
            bindBodyClicks();
            bindKeyboardNav();

            Factory3Io.state.headerApi = window.Factory3Header.init({
                idPrefix: 'Io',
                onDateChange: (dateStr) => {
                    if (Factory3Io.state.headerApi && Factory3Io.state.headerApi.isEditMode()) {
                        onEditModeExit();
                    }
                    clearHighlights();
                    loadDataChunk(dateStr);
                },
                onSave: handleSave,
            });

            if (!Factory3Io.state.headerApi) return;

            const editBtn = document.getElementById('gf3IoEditBtn');
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    setTimeout(() => {
                        if (Factory3Io.state.headerApi.isEditMode()) {
                            onEditModeEnter();
                        } else {
                            onEditModeExit();
                        }
                    }, 0);
                });
            }

            const saveBtn = document.getElementById('gf3IoSaveBtn');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    setTimeout(() => {
                        if (!Factory3Io.state.headerApi.isEditMode()) onEditModeExit();
                    }, 300);
                });
            }

            ['gf3IoPrevBtn', 'gf3IoNextBtn', 'gf3IoExcelBtn'].forEach(id => {
                const btn = document.getElementById(id);
                if (btn) { btn.disabled = true; btn.style.opacity = '0.3'; btn.style.pointerEvents = 'none'; }
            });

            loadDataChunk(Utils.todayStr());
        },
        destroy: function () {}
    };

    window.Factory3IoModule = Factory3IoModule;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Factory3IoModule.init());
    } else {
        Factory3IoModule.init();
    }

})();