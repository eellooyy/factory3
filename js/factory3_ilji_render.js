/* factory3_ilji_render.js */
(function() {
    'use strict';
    
    const App = window.Factory3Ilji;
    if (!App) return;

    // 공통 마스터 패널 및 우측 재고 현황 업데이트 함수
    App.updateMasterPanels = function(usageD, usageA, endBalD, endBalA, sumTodayRollD, sumTodayRollA) {
        const elUsageD = document.getElementById('statUsageD');
        const elUsageA = document.getElementById('statUsageA');
        const elRealUsage = document.getElementById('statRealUsage');
        const elDiff = document.getElementById('statDiff');

        if(elUsageD) elUsageD.value = usageD > 0 ? App.utils.formatKg(usageD) : "";
        if(elUsageA) elUsageA.value = usageA > 0 ? App.utils.formatKg(usageA) : "";
        
        const realUsage = usageD + usageA;
        if(elRealUsage) elRealUsage.value = realUsage > 0 ? App.utils.formatKg(realUsage) : "";

        let totalUsageVal = App.utils.parseNum(document.getElementById('statTotalUsage')?.value);
        if (totalUsageVal > 0 && realUsage > 0) {
             const diff = totalUsageVal - realUsage;
             elDiff.value = App.utils.formatKg(diff);
        } else {
             if(elDiff) elDiff.value = "";
        }

        const wanA = App.utils.parseNum(document.getElementById('sideWanA')?.value);
        const wanD = App.utils.parseNum(document.getElementById('sideWanD')?.value);
        const geupD = endBalD + (wanD * App.FACTOR_788);
        const geupA = endBalA + (wanA * App.FACTOR_1576);

        const elGeupA = document.getElementById('sideGeupA');
        const elGeupD = document.getElementById('sideGeupD');
        
        if(elGeupA) elGeupA.value = geupA > 0 ? geupA.toLocaleString() + " kg" : "0 kg";
        if(elGeupD) elGeupD.value = geupD > 0 ? geupD.toLocaleString() + " kg" : "0 kg";

        const rawChulgoA = App.state.prevWanA - (sumTodayRollA + wanA);
        const rawChulgoD = App.state.prevWanD - (sumTodayRollD + wanD);
        const chulgoA = Math.abs(rawChulgoA);
        const chulgoD = Math.abs(rawChulgoD);

        const elChulgoA = document.getElementById('sideChulgoA');
        const elChulgoD = document.getElementById('sideChulgoD');

        if(elChulgoA) elChulgoA.value = chulgoA.toLocaleString() + " R/L";
        if(elChulgoD) elChulgoD.value = chulgoD.toLocaleString() + " R/L";
    };

    // 자동 수식 계산 분기 및 연쇄 계산(Chaining) 구현
    App.calculateAutoFields = function() {
        if (App.state.isLegacyMode) {
            // [하위 호환] 과거 고정 6행 구조 계산식
            let usageD = 0; let usageA = 0; let endBalD = 0; let endBalA = 0; 
            let sumTodayRollD = 0; let sumTodayRollA = 0;

            ['B','C','D','E','F','G'].forEach(col => {
                const factor = (col === 'B') ? App.FACTOR_788 : App.FACTOR_1576;
                const startBal = App.utils.parseNum(document.querySelector(`.target-calc[data-col="${col}"][data-row="1"]`)?.value);
                
                let wanKgSum = 0;
                for(let r=2; r<=7; r++) {
                    let cellVal = App.utils.parseNum(document.querySelector(`.target-calc[data-col="${col}"][data-row="${r}"]`)?.value);
                    if (cellVal >= 20) {
                        wanKgSum += cellVal;
                    } else {
                        wanKgSum += (cellVal * factor);
                        if (cellVal > 0 && cellVal <= 19) {
                            if (col === 'B') sumTodayRollD += cellVal;
                            else sumTodayRollA += cellVal;
                        }
                    }
                }
                
                const beforeSum = startBal + wanKgSum;
                const beforeInput = document.querySelector(`.f3i-input[data-col="${col}"][data-row="8"]`);
                if (beforeInput) beforeInput.value = beforeSum > 0 ? beforeSum.toLocaleString() : "";

                const endBal = App.utils.parseNum(document.querySelector(`.target-calc[data-col="${col}"][data-row="10"]`)?.value);
                if (col === 'B') endBalD = endBal;
                else endBalA += endBal;

                let usage = 0;
                const usageInput = document.querySelector(`.f3i-input[data-col="${col}"][data-row="9"]`);
                if (usageInput) {
                    if (beforeSum > 0 && endBal > 0) {
                         usage = beforeSum - endBal;
                         usageInput.value = usage !== 0 ? usage.toLocaleString() : "0";
                    } else {
                         usageInput.value = ""; 
                    }
                }

                if (col === 'B') usageD = usage;
                else usageA += usage;
            });

            App.updateMasterPanels(usageD, usageA, endBalD, endBalA, sumTodayRollD, sumTodayRollA);
        } else {
            // [가변 세션] 동적 루프 연쇄 계산(Chaining)
            let totalUsageD = 0; let totalUsageA = 0;
            let finalEndBalD = 0; let finalEndBalA = 0;
            let totalTodayRollD = 0; let totalTodayRollA = 0;

            ['B','C','D','E','F','G'].forEach(col => {
                const factor = (col === 'B') ? App.FACTOR_788 : App.FACTOR_1576;
                // 최초 세션의 시작 잔량은 공통 상단 영역(row=1)에서 가져옴
                let currentStartBal = App.utils.parseNum(document.querySelector(`.f3i-input[data-row="1"][data-col="${col}"]`)?.value);
                
                App.state.sessions.forEach((session, sIdx) => {
                    let wanKgSum = 0;
                    
                    // 해당 세션의 완롤 입력행(3줄) 계산
                    for (let rIdx = 0; rIdx < 3; rIdx++) {
                        const inputEl = document.querySelector(`input[data-session="${sIdx}"][data-type="wan"][data-row-idx="${rIdx}"][data-col="${col}"]`);
                        let cellVal = App.utils.parseNum(inputEl?.value);
                        if (cellVal >= 20) {
                            wanKgSum += cellVal;
                        } else {
                            wanKgSum += (cellVal * factor);
                            if (cellVal > 0 && cellVal <= 19) {
                                if (col === 'B') totalTodayRollD += cellVal;
                                else totalTodayRollA += cellVal;
                            }
                        }
                    }

                    // 사용 전 합계 = 이전 잔량 + 현재 세션 완롤 합산
                    const beforeSum = currentStartBal + wanKgSum;
                    const beforeSumInput = document.querySelector(`input[data-session="${sIdx}"][data-type="before-sum"][data-col="${col}"]`);
                    if (beforeSumInput) beforeSumInput.value = beforeSum > 0 ? beforeSum.toLocaleString() : "";

                    // 사용자가 입력한 현재 세션의 사용 후 잔량 조회
                    const endBalInput = document.querySelector(`input[data-session="${sIdx}"][data-type="end-bal"][data-col="${col}"]`);
                    const endBal = App.utils.parseNum(endBalInput?.value);

                    // 현재 세션 사용량 = 사용 전 합계 - 사용 후 잔량
                    let usage = 0;
                    const usageInput = document.querySelector(`input[data-session="${sIdx}"][data-type="usage"][data-col="${col}"]`);
                    if (usageInput) {
                        if (beforeSum > 0 && endBal > 0) {
                            usage = beforeSum - endBal;
                            usageInput.value = usage !== 0 ? usage.toLocaleString() : "0";
                        } else {
                            usageInput.value = "";
                        }
                    }

                    if (col === 'B') totalUsageD += usage;
                    else totalUsageA += usage;

                    // [Chaining 핵심] 현재 세션의 사용 후 잔량을 다음 세션의 시작 잔량으로 업데이트
                    currentStartBal = endBal;

                    // 마지막 세션의 잔량을 마스터 패널용 최종 잔량으로 확정 지정
                    if (sIdx === App.state.sessions.length - 1) {
                        if (col === 'B') finalEndBalD = endBal;
                        else finalEndBalA += endBal;
                    }
                });
            });

            App.updateMasterPanels(totalUsageD, totalUsageA, finalEndBalD, finalEndBalA, totalTodayRollD, totalTodayRollA);
        }
    };

    // 가변 가상 세션 동적 뷰 생성 및 마운트 로직
    App.renderDynamicSessions = function() {
        const tbody = document.querySelector('.f3i-table tbody');
        if (!tbody) return;

        // 사용 전 잔량(row=1) 행만 수존하고 그 이하 입력 영역 엘리먼트를 초기화
        const row1 = tbody.querySelector('tr:has([data-row="1"])') || tbody.rows[0];
        tbody.innerHTML = '';
        tbody.appendChild(row1);

        const cols = ['B', 'C', 'D', 'E', 'F', 'G'];

        App.state.sessions.forEach((session, sIdx) => {
            // 1. 세션 경계 구분선 행 생성
            const trSep = document.createElement('tr');
            trSep.innerHTML = `<td colspan="9" class="session-divider-row" style="background: #e5e5ea; height: 26px; font-size: 12px; font-weight: bold; color: #1d1d1f; padding-left: 10px; text-align: left; vertical-align: middle;">${session.sessionName}</td>`;
            tbody.appendChild(trSep);

            // 2. 완롤 입력행 3줄 세트 바인딩
            for (let rIdx = 0; rIdx < 3; rIdx++) {
                const trWan = document.createElement('tr');
                if (rIdx === 0) {
                    trWan.innerHTML = `
                        <td class="f3i-th row-title" rowspan="3" style="position: relative;">
                            완 롤
                            <span class="material-symbols-outlined f3i-add-session-btn" id="f3iAddSessionBtn" style="font-size: 16px; position: absolute; right: 4px; top: 50%; transform: translateY(-50%); color: #007AFF; cursor:pointer;" title="사용량 집계 추가">add_circle</span>
                        </td>
                    `;
                }

                cols.forEach(col => {
                    const val = session.wanRolls[rIdx]?.[col] || "";
                    trWan.innerHTML += `
                        <td class="f3i-td editable">
                            <input type="text" class="f3i-input target-calc" data-session="${sIdx}" data-type="wan" data-row-idx="${rIdx}" data-col="${col}" value="${val}">
                        </td>
                    `;
                });

                // 우측 특집 공간 매핑 인터페이스 격리 보정
                if (sIdx === 0 && rIdx === 0) {
                    trWan.innerHTML += `<td class="f3i-td readonly special-cell special-label">사용량 총계:</td><td class="f3i-td readonly special-cell"><input type="text" id="statTotalUsage" class="f3i-input fw-bold" readonly></td>`;
                } else if (sIdx === 0 && rIdx === 1) {
                    trWan.innerHTML += `<td class="f3i-td readonly special-cell special-label">실사용량:</td><td class="f3i-td readonly special-cell"><input type="text" id="statRealUsage" class="f3i-input fw-bold" readonly></td>`;
                } else if (sIdx === 0 && rIdx === 2) {
                    trWan.innerHTML += `<td class="f3i-td readonly special-cell special-label">증감:</td><td class="f3i-td readonly special-cell"><input type="text" id="statDiff" class="f3i-input fw-bold" readonly></td>`;
                } else {
                    trWan.innerHTML += `<td class="special-cell"></td><td class="special-cell"></td>`;
                }
                tbody.appendChild(trWan);
            }

            // 3. 사용 전 합계 행 생성
            const trBeforeSum = document.createElement('tr');
            trBeforeSum.innerHTML = `<td class="f3i-th row-title calc-row">사용 전 합계</td>`;
            cols.forEach(col => {
                trBeforeSum.innerHTML += `<td class="f3i-td readonly"><input type="text" class="f3i-input fw-bold" data-session="${sIdx}" data-type="before-sum" data-col="${col}" readonly></td>`;
            });
            trBeforeSum.innerHTML += `<td class="special-cell"></td><td class="special-cell"></td>`;
            tbody.appendChild(trBeforeSum);

            // 4. 사용량 행 생성
            const trUsage = document.createElement('tr');
            trUsage.innerHTML = `<td class="f3i-th row-title calc-row">사용량</td>`;
            cols.forEach(col => {
                trUsage.innerHTML += `<td class="f3i-td readonly"><input type="text" class="f3i-input fw-bold" data-session="${sIdx}" data-type="usage" data-col="${col}" readonly></td>`;
            });
            if (sIdx === 0) {
                trUsage.innerHTML += `<td class="f3i-td readonly special-cell special-label">사용량 A (1576mm):</td><td class="f3i-td readonly special-cell"><input type="text" id="statUsageA" class="f3i-input fw-bold" readonly></td>`;
            } else if (sIdx === 1) {
                trUsage.innerHTML += `<td class="f3i-td readonly special-cell special-label">사용량 D (788mm):</td><td class="f3i-td readonly special-cell"><input type="text" id="statUsageD" class="f3i-input fw-bold" readonly></td>`;
            } else {
                trUsage.innerHTML += `<td class="special-cell"></td><td class="special-cell"></td>`;
            }
            tbody.appendChild(trUsage);

            // 5. 사용 후 잔량 행 생성
            const trEndBal = document.createElement('tr');
            trEndBal.innerHTML = `<td class="f3i-th row-title">사용 후 잔량</td>`;
            cols.forEach(col => {
                const val = session.endBal?.[col] || "";
                trEndBal.innerHTML += `
                    <td class="f3i-td editable">
                        <input type="text" class="f3i-input target-calc" data-session="${sIdx}" data-type="end-bal" data-col="${col}" value="${val}">
                    </td>
                `;
            });
            trEndBal.innerHTML += `<td class="special-cell"></td><td class="special-cell"></td>`;
            tbody.appendChild(trEndBal);
        });

        // 동적 인터커넥트 세션 클릭 리스너 재배치
        document.getElementById('f3iAddSessionBtn')?.addEventListener('click', App.addSessionClick);
        App.bindInputFormatters();
    };

    // 중간 정산 세션 가변 확장 추가 이벤트 연동
    App.addSessionClick = function() {
        const cols = ['B', 'C', 'D', 'E', 'F', 'G'];
        
        if (App.state.isLegacyMode) {
            App.state.isLegacyMode = false;
            // 기존 6행에 분산 입력되어 있던 수치들을 세션 1(오전) 구조로 안전하게 흡수 치환
            const session1 = {
                sessionName: "세션 1 (오전)",
                wanRolls: [{}, {}, {}],
                endBal: {}
            };
            for (let rIdx = 0; rIdx < 3; rIdx++) {
                cols.forEach(col => {
                    const legacyInput = document.querySelector(`.f3i-input[data-row="${rIdx + 2}"][data-col="${col}"]`);
                    session1.wanRolls[rIdx][col] = legacyInput ? legacyInput.value : "";
                });
            }
            cols.forEach(col => {
                const legacyEnd = document.querySelector(`.f3i-input[data-row="10"][data-col="${col}"]`);
                session1.endBal[col] = legacyEnd ? legacyEnd.value : "";
            });
            App.state.sessions = [session1];
        }

        // 신규 가변 정산 세션 블록 설계 구성 데이터 주입
        const newSessionIdx = App.state.sessions.length + 1;
        const newSession = {
            sessionName: `세션 ${newSessionIdx}`,
            wanRolls: [
                {"B":"","C":"","D":"","E":"","F":"","G":""},
                {"B":"","C":"","D":"","E":"","F":"","G":""},
                {"B":"","C":"","D":"","E":"","F":"","G":""}
            ],
            endBal: {"B":"","C":"","D":"","E":"","F":"","G":""}
        };
        App.state.sessions.push(newSession);

        App.renderDynamicSessions();
        App.calculateAutoFields();
    };

    // 포맷 변환기 바인딩 고도화 (정적/동적 동시 대응형)
    App.bindInputFormatters = function() {
        const wrapper = App.headerApi?.elements?.wrapper || document.querySelector('.f3i-wrapper');
        if (!wrapper) return;

        wrapper.querySelectorAll('.target-calc, #sideWanA, #sideWanD, #statTotalUsage').forEach(input => {
            if (input.dataset.bound) return; // 중복 리스너 처리 방지
            input.dataset.bound = "true";

            input.addEventListener('focus', function() {
                if(this.readOnly) return;
                let v = App.utils.parseNum(this.value);
                this.value = v === 0 ? "" : v;
            });
            input.addEventListener('blur', function() {
                if(this.readOnly) return;
                let v = App.utils.parseNum(this.value);
                if (v === 0) {
                    this.value = "";
                } else {
                    if (this.id === 'statTotalUsage') {
                        this.value = v.toLocaleString() + " kg";
                    } else if (this.id === 'sideWanA' || this.id === 'sideWanD') {
                        this.value = v.toLocaleString() + " R/L";
                    } else {
                        const isWanInput = this.dataset.type === 'wan' || (parseInt(this.dataset.row, 10) >= 2 && parseInt(this.dataset.row, 10) <= 7);
                        if (isWanInput) {
                            this.value = v >= 20 ? v.toLocaleString() + " kg" : v.toLocaleString() + " R/L";
                        } else {
                            this.value = v.toLocaleString();
                        }
                    }
                }
                App.calculateAutoFields();
            });
        });
    };

    // 키보드 이동 로직 일반화 (DOM 구조 탐색형 스위칭 체계 구현)
    App.bindKeyboardNavigation = function() {
        const wrapper = App.headerApi?.elements?.wrapper || document.querySelector('.f3i-wrapper');
        wrapper.addEventListener('keydown', function(e) {
            const target = e.target;
            if (!target.classList.contains('f3i-input')) return;

            const col = target.dataset.col;
            if (!col) return;

            const cols = ['B', 'C', 'D', 'E', 'F', 'G'];
            const colIdx = cols.indexOf(col);
            if (colIdx === -1) return;

            let nextTarget = null;

            if (e.key === 'ArrowLeft' && colIdx > 0) {
                e.preventDefault();
                nextTarget = target.closest('tr').querySelector(`input[data-col="${cols[colIdx - 1]}"]`);
            } else if (e.key === 'ArrowRight' && colIdx < cols.length - 1) {
                e.preventDefault();
                nextTarget = target.closest('tr').querySelector(`input[data-col="${cols[colIdx + 1]}"]`);
            } else if (e.key === 'Enter' || e.key === 'ArrowDown') {
                e.preventDefault();
                let nextTr = target.closest('tr').nextElementSibling;
                while (nextTr) {
                    const input = nextTr.querySelector(`input[data-col="${col}"]`);
                    if (input && !input.readOnly) { nextTarget = input; break; }
                    nextTr = nextTr.nextElementSibling;
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                let prevTr = target.closest('tr').previousElementSibling;
                while (prevTr) {
                    const input = prevTr.querySelector(`input[data-col="${col}"]`);
                    if (input && !input.readOnly) { nextTarget = input; break; }
                    prevTr = prevTr.previousElementSibling;
                }
            }

            if (nextTarget) {
                nextTarget.focus();
                if (typeof nextTarget.select === 'function') nextTarget.select();
            }
        });
    };

    // 엑셀 동적 출력 내보내기 고도화 수정
    App.exportToExcel = function() {
        if (!window.XLSX) {
            alert("엑셀 모듈을 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        const excelBtn = App.headerApi.elements.excelBtn;
        const btnInner = excelBtn.innerHTML;
        excelBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px; margin-right: 4px;">hourglass_empty</span>처리중...';
        excelBtn.disabled = true;

        setTimeout(() => {
            try {
                const val = (selector) => { const el = document.querySelector(selector); return el ? el.value : ""; };
                const currentDate = App.headerApi.getCurrentDate();

                const dateObj = new Date(currentDate);
                const dayNames = ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'];
                const formattedExcelDate = `${dateObj.getFullYear()}년 ${dateObj.getMonth()+1}월 ${dateObj.getDate()}일 ${dayNames[dateObj.getDay()]}`;

                // 공통 상단 데이터 초기화 구성
                const ws_data = [
                    ["", "", "", "", "", "", "", formattedExcelDate, "", "", "", ""],
                    [],
                    ["", "788", "R51", "R52", "R53", "R54", "R55", "특집", "", "", "완롤 잔량", ""],
                    ["사용 전 잔량", val('.f3i-input[data-row="1"][data-col="B"]'), val('.f3i-input[data-row="1"][data-col="C"]'), val('.f3i-input[data-row="1"][data-col="D"]'), val('.f3i-input[data-row="1"][data-col="E"]'), val('.f3i-input[data-row="1"][data-col="F"]'), val('.f3i-input[data-row="1"][data-col="G"]'), val('.f3i-input[data-row="1"][data-col="H"]'), "", "", "A", "D"]
                ];

                if (App.state.isLegacyMode) {
                    // [하위 호환형] 기존 고정 레이아웃 데이터 압축 주입
                    ws_data.push(["완 롤", val('[data-row="2"][data-col="B"]'), val('[data-row="2"][data-col="C"]'), val('[data-row="2"][data-col="D"]'), val('[data-row="2"][data-col="E"]'), val('[data-row="2"][data-col="F"]'), val('[data-row="2"][data-col="G"]'), "", "", "", val('#sideWanA'), val('#sideWanD')]);
                    ws_data.push(["", val('[data-row="3"][data-col="B"]'), val('[data-row="3"][data-col="C"]'), val('[data-row="3"][data-col="D"]'), val('[data-row="3"][data-col="E"]'), val('[data-row="3"][data-col="F"]'), val('[data-row="3"][data-col="G"]'), "사용량 총계:", val('#statTotalUsage'), "", "", ""]);
                    ws_data.push(["", val('[data-row="4"][data-col="B"]'), val('[data-row="4"][data-col="C"]'), val('[data-row="4"][data-col="D"]'), val('[data-row="4"][data-col="E"]'), val('[data-row="4"][data-col="F"]'), val('[data-row="4"][data-col="G"]'), "실사용량:", val('#statRealUsage'), "", "급지 재고", ""]);
                    ws_data.push(["", val('[data-row="5"][data-col="B"]'), val('[data-row="5"][data-col="C"]'), val('[data-row="5"][data-col="D"]'), val('[data-row="5"][data-col="E"]'), val('[data-row="5"][data-col="F"]'), val('[data-row="5"][data-col="G"]'), "증감:", val('#statDiff'), "", "A", "D"]);
                    ws_data.push(["", val('[data-row="6"][data-col="B"]'), val('[data-row="6"][data-col="C"]'), val('[data-row="6"][data-col="D"]'), val('[data-row="6"][data-col="E"]'), val('[data-row="6"][data-col="F"]'), val('[data-row="6"][data-col="G"]'), "", "", "", val('#sideGeupA'), val('#sideGeupD')]);
                    ws_data.push(["", val('[data-row="7"][data-col="B"]'), val('[data-row="7"][data-col="C"]'), val('[data-row="7"][data-col="D"]'), val('[data-row="7"][data-col="E"]'), val('[data-row="7"][data-col="F"]'), val('[data-row="7"][data-col="G"]'), "", "", "", "", ""]);
                    ws_data.push(["사용 전 합계", val('[data-row="8"][data-col="B"]'), val('[data-row="8"][data-col="C"]'), val('[data-row="8"][data-col="D"]'), val('[data-row="8"][data-col="E"]'), val('[data-row="8"][data-col="F"]'), val('[data-row="8"][data-col="G"]'), "사용량 A (1576mm):", val('#statUsageA'), "", "급지 출고", ""]);
                    ws_data.push(["사용량", val('[data-row="9"][data-col="B"]'), val('[data-row="9"][data-col="C"]'), val('[data-row="9"][data-col="D"]'), val('[data-row="9"][data-col="E"]'), val('[data-row="9"][data-col="F"]'), val('[data-row="9"][data-col="G"]'), "사용량 D (788mm):", val('#statUsageD'), "", "A", "D"]);
                    ws_data.push(["사용 후 잔량", val('[data-row="10"][data-col="B"]'), val('[data-row="10"][data-col="C"]'), val('[data-row="10"][data-col="D"]'), val('[data-row="10"][data-col="E"]'), val('[data-row="10"][data-col="F"]'), val('[data-row="10"][data-col="G"]'), "", "", "", val('#sideChulgoA'), val('#sideChulgoD')]);
                } else {
                    // [가변 세션형] 세션 개수에 맞춘 동적 로우 전개 기법 적용
                    App.state.sessions.forEach((session, sIdx) => {
                        ws_data.push([`[${session.sessionName}]`, "", "", "", "", "", "", "", "", "", "", ""]);
                        for (let rIdx = 0; rIdx < 3; rIdx++) {
                            const lbl = (rIdx === 0) ? "완 롤" : "";
                            const rCells = [
                                lbl,
                                val(`input[data-session="${sIdx}"][data-type="wan"][data-row-idx="${rIdx}"][data-col="B"]`),
                                val(`input[data-session="${sIdx}"][data-type="wan"][data-row-idx="${rIdx}"][data-col="C"]`),
                                val(`input[data-session="${sIdx}"][data-type="wan"][data-row-idx="${rIdx}"][data-col="D"]`),
                                val(`input[data-session="${sIdx}"][data-type="wan"][data-row-idx="${rIdx}"][data-col="E"]`),
                                val(`input[data-session="${sIdx}"][data-type="wan"][data-row-idx="${rIdx}"][data-col="F"]`),
                                val(`input[data-session="${sIdx}"][data-type="wan"][data-row-idx="${rIdx}"][data-col="G"]`)
                            ];
                            // 고정 배치 통계용 컴포넌트값 바인딩 우회 주입
                            if (sIdx === 0 && rIdx === 0) rCells.push("사용량 총계:", val('#statTotalUsage'), "", "완롤 잔량", "");
                            else if (sIdx === 0 && rIdx === 1) rCells.push("실사용량:", val('#statRealUsage'), "", "A", "D");
                            else if (sIdx === 0 && rIdx === 2) rCells.push("증감:", val('#statDiff'), "", val('#sideWanA'), val('#sideWanD'));
                            else rCells.push("", "", "", "", "");
                            ws_data.push(rCells);
                        }

                        const sumCells = ["사용 전 합계", val(`input[data-session="${sIdx}"][data-type="before-sum"][data-col="B"]`), val(`input[data-session="${sIdx}"][data-type="before-sum"][data-col="C"]`), val(`input[data-session="${sIdx}"][data-type="before-sum"][data-col="D"]`), val(`input[data-session="${sIdx}"][data-type="before-sum"][data-col="E"]`), val(`input[data-session="${sIdx}"][data-type="before-sum"][data-col="F"]`), val(`input[data-session="${sIdx}"][data-type="before-sum"][data-col="G"]`)];
                        if (sIdx === 0) sumCells.push("사용량 A (1576mm):", val('#statUsageA'), "", "급지 재고", "");
                        else sumCells.push("", "", "", "", "");
                        ws_data.push(sumCells);

                        const useCells = ["사용량", val(`input[data-session="${sIdx}"][data-type="usage"][data-col="B"]`), val(`input[data-session="${sIdx}"][data-type="usage"][data-col="C"]`), val(`input[data-session="${sIdx}"][data-type="usage"][data-col="D"]`), val(`input[data-session="${sIdx}"][data-type="usage"][data-col="E"]`), val(`input[data-session="${sIdx}"][data-type="usage"][data-col="F"]`), val(`input[data-session="${sIdx}"][data-type="usage"][data-col="G"]`)];
                        if (sIdx === 0) useCells.push("사용량 D (788mm):", val('#statUsageD'), "", "A", "D");
                        else useCells.push("", "", "", "", "");
                        ws_data.push(useCells);

                        const endCells = ["사용 후 잔량", val(`input[data-session="${sIdx}"][data-type="end-bal"][data-col="B"]`), val(`input[data-session="${sIdx}"][data-type="end-bal"][data-col="C"]`), val(`input[data-session="${sIdx}"][data-type="end-bal"][data-col="D"]`), val(`input[data-session="${sIdx}"][data-type="end-bal"][data-col="E"]`), val(`input[data-session="${sIdx}"][data-type="end-bal"][data-col="F"]`), val(`input[data-session="${sIdx}"][data-type="end-bal"][data-col="G"]`)];
                        if (sIdx === 0) endCells.push("", "", "", val('#sideGeupA'), val('#sideGeupD'));
                        else if (sIdx === 1) endCells.push("", "", "", "급지 출고", "");
                        else endCells.push("", "", "", "", "");
                        ws_data.push(endCells);
                    });
                    
                    // 연장 라인 마지막 공백 맞춤 및 출고 데이터 최종 인입 처리
                    ws_data.push(["", "", "", "", "", "", "", "", "", "", "A", "D"]);
                    ws_data.push(["", "", "", "", "", "", "", "", "", "", val('#sideChulgoA'), val('#sideChulgoD')]);
                }

                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.aoa_to_sheet(ws_data);

                // 가변 길이에 부합하는 동적 그리드 한계 설정 가속 적용
                const maxRowIdx = ws_data.length - 1;
                ws['!merges'] = [
                    { s: {r: 0, c: 7}, e: {r: 0, c: 11} }, { s: {r: 2, c: 7}, e: {r: 2, c: 8} },
                    { s: {r: 3, c: 7}, e: {r: 3, c: 8} }, { s: {r: 4, c: 0}, e: {r: 4, c: 0} }
                ];
                ws['!cols'] = [{wch: 15}, {wch: 9}, {wch: 9}, {wch: 9}, {wch: 9}, {wch: 9}, {wch: 9}, {wch: 20}, {wch: 17}, {wch: 1.3}, {wch: 10}, {wch: 10}];

                const thinB = { style: 'thin', color: {rgb: "8e8e93"} };
                for (let R = 0; R <= maxRowIdx; R++) {
                    const rRef = ws['!rows'] || []; rRef[R] = { hpt: 25 };
                    for (let C = 0; C <= 11; C++) {
                        const cell_ref = XLSX.utils.encode_cell({c: C, r: R});
                        if (!ws[cell_ref]) ws[cell_ref] = {t: 's', v: ''};
                        ws[cell_ref].s = {
                            font: { name: "맑은 고딕", sz: 10 },
                            alignment: { vertical: "center", horizontal: "center" },
                            border: (R >= 2 && C <= 8) ? { top: thinB, bottom: thinB, left: thinB, right: thinB } : {}
                        };
                    }
                }

                XLSX.utils.book_append_sheet(wb, ws, "일지");
                XLSX.writeFile(wb, `3공장_급지일지_${currentDate}.xlsx`);
            } catch (err) {
                alert("엑셀 생성 중 오류가 발생했습니다: " + err.message);
            } finally {
                excelBtn.innerHTML = btnInner;
                excelBtn.disabled = false;
            }
        }, 100); 
    };
})();