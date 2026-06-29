/* js/factory3_io_table_module.js */
const Factory3IoTableModule = (function() {
    'use strict';

    let scrollAreas = [];
    let isSyncing = false;
    let activeCell = null;

    function init() {
        scrollAreas = [
            document.getElementById('scrollAreaLeft'),
            document.getElementById('scrollAreaMid'),
            document.getElementById('scrollAreaRight')
        ].filter(el => el !== null);

        setupScrollSync();
        renderMockData(); // 현재 월을 기준으로 데이터 생성
        setupInteractions();
        
        // 렌더링 완료 후 어제 날짜로 스크롤 이동
        setTimeout(scrollToYesterday, 100); 
    }

    // 1. 패널 3개 스크롤 동기화
    function setupScrollSync() {
        scrollAreas.forEach(area => {
            area.addEventListener('scroll', function(e) {
                if (isSyncing) return;
                isSyncing = true;
                
                const scrollTop = e.target.scrollTop;
                scrollAreas.forEach(otherArea => {
                    if (otherArea !== e.target) {
                        otherArea.scrollTop = scrollTop;
                    }
                });
                
                window.requestAnimationFrame(() => {
                    isSyncing = false;
                    updateCursorPosition(); 
                });
            });
        });
    }

    // 2. 가상의 테이블 데이터 (새로운 헤더 양식에 맞춤 + 현재 달 기준)
    function renderMockData() {
        const tbodyLeft = document.getElementById('tbodyLeft');
        const tbodyMid = document.getElementById('tbodyMid');
        const tbodyRight = document.getElementById('tbodyRight');

        if(!tbodyLeft || !tbodyMid || !tbodyRight) return;

        let leftHTML = ''; let midHTML = ''; let rightHTML = '';

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const todayDate = now.getDate();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        for (let i = 1; i <= daysInMonth; i++) {
            const isToday = i === todayDate;
            const rowClass = isToday ? 'gf3-row-today' : '';
            const currDateObj = new Date(year, month, i);
            const dayOfWeek = currDateObj.getDay(); 
            let dateColorClass = '';
            
            if(dayOfWeek === 0) dateColorClass = 'gf3-sun';
            else if(dayOfWeek === 6) dateColorClass = 'gf3-sat';

            // 날짜 포맷 (YYYY-MM-DD)
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const shortDate = `${month + 1}/${String(i).padStart(2, '0')}`;

            // 완제품 A (4칸), 완제품 D (4칸, 첫 칸은 gf3-sep)
            leftHTML += `<tr class="${rowClass}" data-date="${dateStr}">
                <td class="gf3-date-td ${dateColorClass}">${shortDate}</td>
                <td class="gf3-data-cell">10</td><td class="gf3-data-cell">5</td><td class="gf3-data-cell">2</td><td class="gf3-data-cell">13</td>
                <td class="gf3-data-cell gf3-sep">20</td><td class="gf3-data-cell">10</td><td class="gf3-data-cell">5</td><td class="gf3-data-cell">25</td>
            </tr>`;

            const mediaSum = 120 + i;
            const paperSum = (i % 5 === 0) ? mediaSum + 10 : mediaSum; // 불일치 경고 테스트용
            const mismatchClass = (mediaSum !== paperSum) ? 'gf3-sum-mismatch' : '';

            // 매체 사용량 (9칸 + 합계 1칸)
            midHTML += `<tr class="${rowClass}" data-date="${dateStr}">
                <td class="gf3-date-td gf3-responsive-date ${dateColorClass}">${shortDate}</td>
                <td class="gf3-data-cell">30</td><td class="gf3-data-cell">40</td><td class="gf3-data-cell">70</td>
                <td class="gf3-data-cell gf3-sep">10</td><td class="gf3-data-cell">15</td><td class="gf3-data-cell">25</td>
                <td class="gf3-data-cell gf3-sep">95</td>
                <td class="gf3-data-cell gf3-sep">80</td><td class="gf3-data-cell">40</td>
                <td class="gf3-data-cell gf3-sep gf3-sum-col ${mismatchClass}">${mediaSum}</td>
            </tr>`;

            // 용지 사용량 (2칸)
            rightHTML += `<tr class="${rowClass}" data-date="${dateStr}">
                <td class="gf3-date-td gf3-responsive-date ${dateColorClass}">${shortDate}</td>
                <td class="gf3-data-cell gf3-sum-col ${mismatchClass}">${paperSum}</td>
                <td class="gf3-data-cell">150</td>
            </tr>`;
        }

        tbodyLeft.innerHTML = leftHTML;
        tbodyMid.innerHTML = midHTML;
        tbodyRight.innerHTML = rightHTML;
    }

    // 3. 진입 시 어제 날짜로 스크롤을 가운데로 맞추는 기능
    function scrollToYesterday() {
        const today = new Date();
        today.setDate(today.getDate() - 1); // 어제
        
        const yStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const targetRow = document.querySelector(`#tbodyLeft tr[data-date="${yStr}"]`);
        
        if (targetRow && scrollAreas.length > 0) {
            const container = scrollAreas[0];
            const offsetTop = targetRow.offsetTop;
            // 화면 중앙에 오도록 계산
            const scrollPos = offsetTop - (container.clientHeight / 2) + (targetRow.clientHeight / 2);
            
            scrollAreas.forEach(area => {
                area.scrollTop = scrollPos;
            });
        }
    }

    // 4. 클릭 하이라이트 및 글래스 커서 (Zoom 배율 버그 픽스 포함)
    function setupInteractions() {
        const panelsOuter = document.querySelector('.gf3-panels-outer');
        if (!panelsOuter) return;

        panelsOuter.addEventListener('click', function(e) {
            const cell = e.target.closest('td.gf3-data-cell');
            if (cell) {
                if(activeCell) activeCell.classList.remove('gf3-selected-cell');
                document.querySelectorAll('.gf3-selected-row').forEach(row => row.classList.remove('gf3-selected-row'));

                activeCell = cell;
                activeCell.classList.add('gf3-selected-cell');
                
                const tr = cell.closest('tr');
                const dateVal = tr.getAttribute('data-date');
                if(dateVal) {
                    document.querySelectorAll(`tr[data-date="${dateVal}"]`).forEach(r => r.classList.add('gf3-selected-row'));
                }

                moveCursorToCell(cell);
            }
        });

        window.addEventListener('resize', updateCursorPosition);
    }

    function moveCursorToCell(cell) {
        const cursor = document.getElementById('gf3Cursor');
        const panelsOuter = document.querySelector('.gf3-panels-outer');
        if(!cursor || !panelsOuter || !cell) return;

        const cellRect = cell.getBoundingClientRect();
        const outerRect = panelsOuter.getBoundingClientRect();

        // [중요] body에 걸린 zoom: 115% 때문에 getBoundingClientRect 좌표가 어긋나는 것을 방지하기 위해 zoom 배율 역산
        let zoomScale = parseFloat(getComputedStyle(document.body).zoom) || 1;
        
        // 크롬 등 일부 브라우저에서 zoom이 적용되었을 때의 실제 오차 보정
        const topPos = (cellRect.top - outerRect.top) / zoomScale;
        const leftPos = (cellRect.left - outerRect.left) / zoomScale;
        const width = cellRect.width / zoomScale;
        const height = cellRect.height / zoomScale;

        cursor.style.width = `${width}px`;
        cursor.style.height = `${height}px`;
        cursor.style.top = `${topPos}px`;
        cursor.style.left = `${leftPos}px`;
        cursor.classList.add('active');
    }

    function updateCursorPosition() {
        if(activeCell) moveCursorToCell(activeCell);
    }

    return {
        init: init
    };
})();