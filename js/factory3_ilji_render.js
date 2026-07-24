/* factory3_ilji_render.js */
(function() {
    'use strict';
    
    const App = window.Factory3Ilji;
    if (!App) return;

    // 집계 레벨 (0, 1, 2) 관리
    App.midLevel = 0;

    App.getMidLevel = function() {
        return App.midLevel || 0;
    };

    App.updateRightSideSummaryRows = function(level) {
        const valTotal = document.getElementById('statTotalUsage')?.value || '';
        const valReal = document.getElementById('statRealUsage')?.value || '';
        const valDiff = document.getElementById('statDiff')?.value || '';

        const r2 = document.querySelector('.target-calc[data-row="2"]')?.closest('tr');
        const r3 = document.querySelector('.target-calc[data-row="3"]')?.closest('tr');
        const m1_1 = document.getElementById('f3iMidUsageRow1');
        const m1_2 = document.getElementById('f3iMidBalRow1');
        const r4 = document.querySelector('.target-calc[data-row="4"]')?.closest('tr');
        const r5 = document.querySelector('.target-calc[data-row="5"]')?.closest('tr');
        const m2_1 = document.getElementById('f3iMidUsageRow2');
        const m2_2 = document.getElementById('f3iMidBalRow2');
        const r6 = document.querySelector('.target-calc[data-row="6"]')?.closest('tr');
        const r7 = document.querySelector('.target-calc[data-row="7"]')?.closest('tr');

        const allRows = [r2, r3, m1_1, m1_2, r4, r5, m2_1, m2_2, r6, r7].filter(Boolean);

        let targetRows = [r3, r4, r5];
        if (level === 1) targetRows = [m1_1, m1_2, r4];
        else if (level === 2) targetRows = [m1_2, r4, r5];

        allRows.forEach(row => {
            row.querySelectorAll('.special-cell').forEach(el => el.remove());
        });

        allRows.forEach(row => {
            if (row === targetRows[0]) {
                row.insertAdjacentHTML('beforeend', '<th class="f3i-th special-cell special-label">사용량 총계:</th><td class="f3i-td editable special-cell"><input type="text" class="f3i-input" id="statTotalUsage" readonly></td>');
            } else if (row === targetRows[1]) {
                row.insertAdjacentHTML('beforeend', '<th class="f3i-th special-cell special-label">실사용량:</th><td class="f3i-td special-cell"><input type="text" class="f3i-input" id="statRealUsage" readonly></td>');
            } else if (row === targetRows[2]) {
                row.insertAdjacentHTML('beforeend', '<th class="f3i-th special-cell special-label">증감:</th><td class="f3i-td special-cell"><input type="text" class="f3i-input" id="statDiff" readonly></td>');
            } else {
                row.insertAdjacentHTML('beforeend', '<td class="f3i-td special-cell" colspan="2"></td>');
            }
        });

        if (document.getElementById('statTotalUsage')) document.getElementById('statTotalUsage').value = valTotal;
        if (document.getElementById('statRealUsage')) document.getElementById('statRealUsage').value = valReal;
        if (document.getElementById('statDiff')) document.getElementById('statDiff').value = valDiff;
    };

    App.setMidLevel = function(level) {
        App.midLevel = Math.max(0, Math.min(2, parseInt(level, 10) || 0));
        const uRow1 = document.getElementById('f3iMidUsageRow1');
        const bRow1 = document.getElementById('f3iMidBalRow1');
        const uRow2 = document.getElementById('f3iMidUsageRow2');
        const bRow2 = document.getElementById('f3iMidBalRow2');

        const th1 = document.getElementById('f3iWanTh1');
        const th2 = document.getElementById('f3iWanTh2');
        const th3 = document.getElementById('f3iWanTh3');

        const btnGroup = document.querySelector('.f3i-mid-btn-group');
        const box1 = th1?.querySelector('.f3i-wan-title-box');
        const box2 = th2?.querySelector('.f3i-wan-title-box');
        const box3 = th3?.querySelector('.f3i-wan-title-box');

        const addBtn = document.getElementById('f3iAddMidBtn');
        const remBtn = document.getElementById('f3iRemoveMidBtn');

        if (App.midLevel === 0) {
            if (uRow1) uRow1.classList.remove('show');
            if (bRow1) bRow1.classList.remove('show');
            if (uRow2) uRow2.classList.remove('show');
            if (bRow2) bRow2.classList.remove('show');

            if (th1) { th1.rowSpan = 6; th1.style.display = ""; }
            if (th2) { th2.style.display = "none"; }
            if (th3) { th3.style.display = "none"; }

            if (btnGroup && box1 && btnGroup.parentElement !== box1) {
                box1.appendChild(btnGroup);
            }

            if (addBtn) { addBtn.style.display = ""; addBtn.title = "1차 집계 추가"; }
            if (remBtn) { remBtn.style.display = "none"; }
        } else if (App.midLevel === 1) {
            if (uRow1) uRow1.classList.add('show');
            if (bRow1) bRow1.classList.add('show');
            if (uRow2) uRow2.classList.remove('show');
            if (bRow2) bRow2.classList.remove('show');

            if (th1) { th1.rowSpan = 2; th1.style.display = ""; }
            if (th2) { th2.rowSpan = 4; th2.style.display = ""; }
            if (th3) { th3.style.display = "none"; }

            if (btnGroup && box2 && btnGroup.parentElement !== box2) {
                box2.appendChild(btnGroup);
            }

            if (addBtn) { addBtn.style.display = ""; addBtn.title = "2차 집계 추가"; }
            if (remBtn) { remBtn.style.display = ""; remBtn.title = "1차 집계 삭제"; }
        } else if (App.midLevel === 2) {
            if (uRow1) uRow1.classList.add('show');
            if (bRow1) bRow1.classList.add('show');
            if (uRow2) uRow2.classList.add('show');
            if (bRow2) bRow2.classList.add('show');

            if (th1) { th1.rowSpan = 2; th1.style.display = ""; }
            if (th2) { th2.rowSpan = 2; th2.style.display = ""; }
            if (th3) { th3.rowSpan = 2; th3.style.display = ""; }

            if (btnGroup && box3 && btnGroup.parentElement !== box3) {
                box3.appendChild(btnGroup);
            }

            if (addBtn) { addBtn.style.display = "none"; }
            if (remBtn) { remBtn.style.display = ""; remBtn.title = "2차 집계 삭제"; }
        }

        App.updateRightSideSummaryRows(App.midLevel);

        // 1차/2차 집계 행이 늘거나 줄면 기본 테이블의 높이 자체가 바뀌므로,
        // 3적층 모드인 경우 우측 패널 높이도 함께 재계산
        if (typeof App.syncSidePanelHeight === 'function') App.syncSidePanelHeight();
    };

    App.isMidRowsVisible = function() {
        return App.getMidLevel() > 0;
    };

    App.setMidRowsVisibility = function(visible) {
        App.setMidLevel(visible ? (App.getMidLevel() || 1) : 0);
    };

    // 자동 수식 계산
    App.calculateAutoFields = function() {
        let usageD = 0; let usageA = 0; let endBalD = 0; let endBalA = 0; 
        let sumTodayRollD = 0; let sumTodayRollA = 0;
        const midLevel = App.getMidLevel();

        ['B','C','D','E','F','G'].forEach(col => {
            const factor = (col === 'B') ? App.FACTOR_788 : App.FACTOR_1576;
            const startBal = App.utils.parseNum(document.querySelector(`.target-calc[data-col="${col}"][data-row="1"]`)?.value);
            
            let wanKgSum = 0;
            let wanKgSum2_3 = 0;
            let wanKgSum4_5 = 0;
            let wanKgSum6_7 = 0;

            for(let r=2; r<=7; r++) {
                let cellVal = App.utils.parseNum(document.querySelector(`.target-calc[data-col="${col}"][data-row="${r}"]`)?.value);
                let rowKg = 0;
                if (cellVal >= 20) {
                    rowKg = cellVal;
                } else {
                    rowKg = (cellVal * factor);
                    if (cellVal > 0 && cellVal <= 19) {
                        if (col === 'B') sumTodayRollD += cellVal;
                        else sumTodayRollA += cellVal;
                    }
                }
                wanKgSum += rowKg;
                if (r === 2 || r === 3) wanKgSum2_3 += rowKg;
                else if (r === 4 || r === 5) wanKgSum4_5 += rowKg;
                else if (r === 6 || r === 7) wanKgSum6_7 += rowKg;
            }
            
            const beforeSum = startBal + wanKgSum;
            const beforeInput = document.querySelector(`.f3i-input[data-col="${col}"][data-row="8"]`);
            if (beforeInput) beforeInput.value = beforeSum > 0 ? beforeSum.toLocaleString() : "";

            const midBalInput1 = document.querySelector(`.f3i-input[data-col="${col}"][data-type="mid_bal_1"]`);
            const midUsageInput1 = document.querySelector(`.f3i-input[data-col="${col}"][data-type="mid_usage_1"]`);
            const midBalVal1 = App.utils.parseNum(midBalInput1?.value);
            const paperBeforeMid1 = startBal + wanKgSum2_3;

            if (midLevel >= 1) {
                if (midUsageInput1 && midUsageInput1.dataset.fixedUsage !== undefined && midUsageInput1.dataset.fixedUsage !== "") {
                    const fixedVal = Number(midUsageInput1.dataset.fixedUsage);
                    midUsageInput1.value = fixedVal > 0 ? fixedVal.toLocaleString() : "0";
                } else if (midBalVal1 > 0 && paperBeforeMid1 > 0) {
                    const computedMidUsage1 = paperBeforeMid1 - midBalVal1;
                    if (midUsageInput1) {
                        midUsageInput1.dataset.fixedUsage = computedMidUsage1;
                        midUsageInput1.value = computedMidUsage1 > 0 ? computedMidUsage1.toLocaleString() : "0";
                    }
                } else if (midUsageInput1) {
                    midUsageInput1.value = "";
                }
            } else {
                if (midUsageInput1) { midUsageInput1.value = ""; delete midUsageInput1.dataset.fixedUsage; }
                if (midBalInput1) { midBalInput1.value = ""; }
            }

            const midBalInput2 = document.querySelector(`.f3i-input[data-col="${col}"][data-type="mid_bal_2"]`);
            const midUsageInput2 = document.querySelector(`.f3i-input[data-col="${col}"][data-type="mid_usage_2"]`);
            const midBalVal2 = App.utils.parseNum(midBalInput2?.value);
            const startingPaperForMid2 = (midBalVal1 > 0) ? midBalVal1 : paperBeforeMid1;
            const paperBeforeMid2 = startingPaperForMid2 + wanKgSum4_5;

            if (midLevel >= 2) {
                if (midUsageInput2 && midUsageInput2.dataset.fixedUsage !== undefined && midUsageInput2.dataset.fixedUsage !== "") {
                    const fixedVal = Number(midUsageInput2.dataset.fixedUsage);
                    midUsageInput2.value = fixedVal > 0 ? fixedVal.toLocaleString() : "0";
                } else if (midBalVal2 > 0 && paperBeforeMid2 > 0) {
                    const computedMidUsage2 = paperBeforeMid2 - midBalVal2;
                    if (midUsageInput2) {
                        midUsageInput2.dataset.fixedUsage = computedMidUsage2;
                        midUsageInput2.value = computedMidUsage2 > 0 ? computedMidUsage2.toLocaleString() : "0";
                    }
                } else if (midUsageInput2) {
                    midUsageInput2.value = "";
                }
            } else {
                if (midUsageInput2) { midUsageInput2.value = ""; delete midUsageInput2.dataset.fixedUsage; }
                if (midBalInput2) { midBalInput2.value = ""; }
            }

            const endBal = App.utils.parseNum(document.querySelector(`.target-calc[data-col="${col}"][data-row="10"]`)?.value);
            if (col === 'B') endBalD = endBal;
            else endBalA += endBal;

            let usage = 0;
            let hasUsage = false;
            const usageInput = document.querySelector(`.f3i-input[data-col="${col}"][data-row="9"]`);
            if (beforeSum > 0 && endBal > 0) {
                 usage = beforeSum - endBal;
                 hasUsage = true;
            }
            // 핀아웃에서 발생한 사용량(계산된 값)을 해당 열의 사용량에 더해준다.
            const pinoutUsageExtra = (App.state.pinoutUsageByCol && App.state.pinoutUsageByCol[col]) || 0;
            if (pinoutUsageExtra !== 0) {
                usage += pinoutUsageExtra;
                hasUsage = true;
            }
            if (usageInput) {
                usageInput.value = hasUsage ? (usage !== 0 ? usage.toLocaleString() : "0") : "";
            }

            if (col === 'B') usageD = usage;
            else usageA += usage;
        });

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
        // 핀아웃 잔량(발생 후 아직 남아있는 분)도 일단 급지 재고에 포함해 반영한다.
        // (추후 처리 방식이 바뀌면 이 부분만 조정하면 됨)
        const pinoutBalD = (App.state.pinoutBalance && App.state.pinoutBalance.D) || 0;
        const pinoutBalA = (App.state.pinoutBalance && App.state.pinoutBalance.A) || 0;
        const geupD = endBalD + (wanD * App.FACTOR_788) + pinoutBalD;
        const geupA = endBalA + (wanA * App.FACTOR_1576) + pinoutBalA;

        const elGeupA = document.getElementById('sideGeupA');
        const elGeupD = document.getElementById('sideGeupD');
        
        if(elGeupA) elGeupA.value = geupA > 0 ? geupA.toLocaleString() + " kg" : "0 kg";
        if(elGeupD) elGeupD.value = geupD > 0 ? geupD.toLocaleString() + " kg" : "0 kg";

        // 핀아웃 발생 시 사용 전 잔량이 20 미만의 롤 단위로 입력되면 신규 출고로 간주하여
        // 급지 출고 값에 그대로 더해준다. (B열 = 788 계열/D, C~G열 = 1576 계열/A)
        let pinoutRollD = 0; let pinoutRollA = 0;
        if (App.state.pinoutRollByCol) {
            Object.keys(App.state.pinoutRollByCol).forEach(col => {
                const roll = App.state.pinoutRollByCol[col] || 0;
                if (col === 'B') pinoutRollD += roll;
                else pinoutRollA += roll;
            });
        }

        const rawChulgoA = App.state.prevWanA - (sumTodayRollA + wanA);
        const rawChulgoD = App.state.prevWanD - (sumTodayRollD + wanD);
        const chulgoA = Math.abs(rawChulgoA) + pinoutRollA;
        const chulgoD = Math.abs(rawChulgoD) + pinoutRollD;

        const elChulgoA = document.getElementById('sideChulgoA');
        const elChulgoD = document.getElementById('sideChulgoD');

        if(elChulgoA) elChulgoA.value = chulgoA.toLocaleString() + " R/L";
        if(elChulgoD) elChulgoD.value = chulgoD.toLocaleString() + " R/L";
    };

    // 포맷 변환기 바인딩
    App.bindInputFormatters = function() {
        App.headerApi.elements.wrapper.querySelectorAll('.target-calc, #sideWanA, #sideWanD, #statTotalUsage, .pinout-input').forEach(input => {
            input.addEventListener('focus', function() {
                if(this.readOnly) return;
                let v = App.utils.parseNum(this.value);
                this.value = v === 0 ? "" : v;
            });
            input.addEventListener('input', function() {
                if (App.swapState && App.swapState.active) return;
                const type = this.dataset.type;
                const col = this.dataset.col;
                if (type === 'mid_bal_1') {
                    const uInp = document.querySelector(`.f3i-input[data-col="${col}"][data-type="mid_usage_1"]`);
                    if (uInp) delete uInp.dataset.fixedUsage;
                } else if (type === 'mid_bal_2') {
                    const uInp = document.querySelector(`.f3i-input[data-col="${col}"][data-type="mid_usage_2"]`);
                    if (uInp) delete uInp.dataset.fixedUsage;
                }
                if (this.classList.contains('pinout-input')) {
                    if (this.dataset.pinRow === '1') {
                        // 사용자가 사용 전 잔량을 직접 수정하면, 전날 이월값이 아니라
                        // 새로 입력한 값으로 취급한다 (롤/kg 판별 로직을 다시 적용).
                        delete this.dataset.pinoutCarried;
                    } else if (this.dataset.pinRow === '3') {
                        // 사용 후 잔량을 사용자가 직접 다뤘음을 표시 (0으로 완전히 비워도
                        // "아직 입력 안 한 상태"로 되돌아가 이월값이 다시 뜨는 것을 방지)
                        this.dataset.userTouched = '1';
                    }
                }
            });
            input.addEventListener('blur', function() {
                if(this.readOnly) return;
                let v = App.utils.parseNum(this.value);
                if (v === 0 && this.classList.contains('pinout-input') && this.dataset.pinRow === '3') {
                    // 핀아웃 "사용 후 잔량"은 0이어도 빈칸이 아니라 "완전 소진"을 의미하므로
                    // 값을 지우지 않고 명시적으로 0 kg으로 표시한다.
                    this.value = "0 kg";
                } else if (v === 0) {
                    this.value = "";
                } else {
                    if (this.id === 'statTotalUsage') {
                        this.value = v.toLocaleString() + " kg";
                    } else if (this.id === 'sideWanA' || this.id === 'sideWanD') {
                        this.value = v.toLocaleString() + " R/L";
                    } else if (this.classList.contains('pinout-input')) {
                        // 핀아웃 "사용 후 잔량"(pin-row 3)은 롤 단위 환산 없이 항상 kg으로 표시한다.
                        if (this.dataset.pinRow === '3') {
                            this.value = v.toLocaleString() + " kg";
                        } else {
                            this.value = v >= 20 ? v.toLocaleString() + " kg" : v.toLocaleString() + " R/L";
                        }
                    } else {
                        const row = parseInt(this.dataset.row, 10);
                        if (row >= 2 && row <= 7) {
                            this.value = v >= 20 ? v.toLocaleString() + " kg" : v.toLocaleString() + " R/L";
                        } else {
                            this.value = v.toLocaleString();
                        }
                    }
                }
                // 핀아웃 입력값이 바뀌면, 급지 출고/사용량 반영 계산이
                // calculateAutoFields보다 먼저 최신 상태로 갱신되어야 한다.
                if (this.classList.contains('pinout-input')) {
                    App.calculatePinoutBalance();
                }
                App.calculateAutoFields();
            });
        });

        // 핀아웃 발생 / 사용 동적 버튼 이벤트 연결
        App.bindPinoutEvents();
    };

    // 사이드 패널 적층 상태 갱신 (핀아웃 잔량 유무에 따라 3적층 / 4적층 전환)
    App.updateSideLayerState = function(showPinoutBox) {
        const sideBox = document.getElementById('f3iSidePinoutBox');
        const sidePanel = document.getElementById('f3iSidePanel') || document.querySelector('.f3i-side-panel');

        if (sideBox) sideBox.style.display = showPinoutBox ? '' : 'none';

        if (sidePanel) {
            if (showPinoutBox) {
                // 핀아웃 잔량 존재 → 4적층 구조 (기존 자연 높이 유지)
                sidePanel.classList.remove('f3i-side-fill');
            } else {
                // 핀아웃 잔량 없음 → 3적층 구조, 좌측 테이블 높이에 맞춰 균등 확장
                sidePanel.classList.add('f3i-side-fill');
            }
        }

        // 핀아웃 "상세 입력" 영역이 열려있는지 여부와 무관하게, 항상 기본 메인 테이블 높이만
        // 기준으로 우측 패널 높이를 갱신한다 (핀아웃 발생/사용 버튼 클릭으로 인한 흔들림 방지)
        App.syncSidePanelHeight();
    };

    // 우측 사이드 패널(3적층 모드) 높이를 좌측 "기본" 테이블 기준으로 고정 지정
    // 핀아웃 상세 입력 영역(f3iPinoutSection)은 계산에서 제외하여,
    // 그 영역을 열고 닫아도 우측 3적층 레이아웃의 높이가 흔들리지 않도록 함
    App.syncSidePanelHeight = function() {
        const sidePanel = document.getElementById('f3iSidePanel') || document.querySelector('.f3i-side-panel');
        if (!sidePanel) return;

        if (!sidePanel.classList.contains('f3i-side-fill')) {
            // 4적층(자연 높이) 모드에서는 인라인 높이 지정을 제거해 기존 동작을 유지
            sidePanel.style.height = '';
            return;
        }

        const mainBox = document.querySelector('.f3i-main-table-box');
        const mainTable = mainBox ? mainBox.querySelector('table.f3i-table.border-outer') : null;
        if (mainTable && mainBox) {
            // 좌측 카드(.f3i-main-table-box)는 표 바깥에 자체 padding/border를 갖고 있으므로,
            // 표 높이만으로 맞추면 카드 하단 여백만큼 우측 패널이 짧아져 아래쪽이 어긋난다.
            // 표 높이 + 카드의 상하 padding/border를 모두 더해야 카드의 실제 바깥 높이와 정확히 일치한다.
            const boxStyle = window.getComputedStyle(mainBox);
            const extra = (parseFloat(boxStyle.paddingTop) || 0) + (parseFloat(boxStyle.paddingBottom) || 0)
                        + (parseFloat(boxStyle.borderTopWidth) || 0) + (parseFloat(boxStyle.borderBottomWidth) || 0);
            sidePanel.style.height = (mainTable.offsetHeight + extra) + 'px';
        }
    };

    // 핀아웃 사용 후 잔량을 기준으로 핀아웃 잔량 사이드 박스 값과 표시 여부 계산
    App.calculatePinoutBalance = function() {
        let balD = 0; // col B (788mm 계열)
        let balA = 0; // col C~G (1576mm 계열)

        ['B', 'C', 'D', 'E', 'F', 'G'].forEach(col => {
            const factor = (col === 'B') ? App.FACTOR_788 : App.FACTOR_1576;
            const afterInput = document.querySelector(`.pinout-input[data-pin-row="3"][data-col="${col}"]`);
            const beforeInput = document.querySelector(`.pinout-input[data-pin-row="1"][data-col="${col}"]`);

            // 핀아웃 "사용 후 잔량"은 20 미만이어도 롤로 환산하지 않고 무조건 kg 그대로 취급한다.
            const afterVal = App.utils.parseNum(afterInput?.value);
            const afterTouched = afterInput && afterInput.dataset.userTouched === '1';

            let kgVal = 0;
            if (afterVal > 0) {
                // 사용 후 잔량이 입력되어 있으면 그 값을 그대로 잔량으로 사용
                kgVal = afterVal;
            } else if (!afterTouched) {
                // 아직 사용 후 잔량을 입력하지 않은 상태(전날 이월 직후 등)라면,
                // 사용 전 잔량(이월분 또는 신규 발생분)을 잠정 핀아웃 잔량으로 대신 표시한다.
                const beforeRaw = App.utils.parseNum(beforeInput?.value);
                const isCarried = beforeInput && beforeInput.dataset.pinoutCarried === '1';
                if (beforeRaw > 0) {
                    kgVal = (isCarried || beforeRaw >= 20) ? beforeRaw : beforeRaw * factor;
                }
            }
            // afterVal이 0이고 사용자가 사용 후 잔량을 직접 입력/터치했다면(완전 소진) kgVal은 0으로 유지되어
            // 이 열에서는 잔량이 없는 것으로 처리된다.

            if (col === 'B') balD += kgVal;
            else balA += kgVal;
        });

        const elPinoutA = document.getElementById('sidePinoutA');
        const elPinoutD = document.getElementById('sidePinoutD');
        if (elPinoutA) elPinoutA.value = balA > 0 ? balA.toLocaleString() + " kg" : "";
        if (elPinoutD) elPinoutD.value = balD > 0 ? balD.toLocaleString() + " kg" : "";

        // 급지 재고 계산(calculateAutoFields)에서 핀아웃 잔량을 더해줄 수 있도록 상태에 저장
        App.state.pinoutBalance = { A: balA, D: balD };

        const hasPinout = (balA + balD) > 0;
        App.updateSideLayerState(hasPinout);

        // 사용 전 잔량 / 사용 후 잔량이 바뀔 때마다 사용량 행도 함께 재계산
        App.calculatePinoutUsage();

        return hasPinout;
    };

    // 핀아웃 "사용량" 행(2행) 자동 계산: 사용 전 잔량(1행) - 사용 후 잔량(3행)
    // - 사용 전 잔량: 788(B열)은 롤 단위(20 미만)일 때 571을, R51~R55(C~G열)는 1143을 곱해 무게(kg)로 환산한다.
    //   (입력값이 20 이상이면 이미 kg 단위로 입력된 것으로 간주해 그대로 사용)
    //   단, 사용 전 잔량이 20 미만의 롤 단위로 "신규" 입력된 경우는 "신규 출고"가 발생한 것이므로,
    //   해당 롤 수량을 App.state.pinoutRollByCol 에 기록해 급지 출고 값에 더해지도록 한다.
    //   (전날 이월된 값 - dataset.pinoutCarried='1' - 은 이미 이전에 출고 처리된 실물이므로 롤 환산/출고 가산에서 제외)
    // - 사용 후 잔량: 20 미만이어도 롤 환산 없이 항상 kg 값 그대로 사용한다.
    // 계산된 열별 사용량은 App.state.pinoutUsageByCol 에 기록해, 해당 열의 본표 사용량(9행)에도 더해지도록 한다.
    App.calculatePinoutUsage = function() {
        const pinoutUsageByCol = {};
        const pinoutRollByCol = {};

        ['B', 'C', 'D', 'E', 'F', 'G'].forEach(col => {
            const factor = (col === 'B') ? App.FACTOR_788 : App.FACTOR_1576;

            const beforeInput = document.querySelector(`.pinout-input[data-pin-row="1"][data-col="${col}"]`);
            const afterInput = document.querySelector(`.pinout-input[data-pin-row="3"][data-col="${col}"]`);
            const usageInput = document.querySelector(`.pinout-input[data-pin-row="2"][data-col="${col}"]`);

            const beforeRaw = App.utils.parseNum(beforeInput?.value);
            const isCarried = beforeInput && beforeInput.dataset.pinoutCarried === '1';
            // 사용 후 잔량은 무조건 kg 값으로 취급 (롤 환산 없음)
            const afterKg = App.utils.parseNum(afterInput?.value);
            // 사용자가 사용 후 잔량을 실제로 입력/터치했는지 여부 (0을 명시적으로 입력한 "완전 소진"도 포함)
            const afterEntered = afterKg > 0 || (afterInput && afterInput.dataset.userTouched === '1');

            let beforeKg = 0;
            if (beforeRaw > 0) {
                if (!isCarried && beforeRaw < 20) {
                    // 20 미만 = 무게가 아닌 롤 단위의 신규 입력 → 신규 출고 발생
                    pinoutRollByCol[col] = beforeRaw;
                    beforeKg = beforeRaw * factor;
                } else {
                    // 20 이상으로 입력됐거나, 전날 이월된 값(항상 kg)인 경우
                    beforeKg = beforeRaw;
                }
            }

            if (usageInput) {
                if (beforeRaw > 0 && afterEntered) {
                    const usageKg = beforeKg - afterKg;
                    usageInput.value = usageKg.toLocaleString() + " kg";
                    pinoutUsageByCol[col] = usageKg;
                } else {
                    usageInput.value = "";
                }
            }
        });

        App.state.pinoutUsageByCol = pinoutUsageByCol;
        App.state.pinoutRollByCol = pinoutRollByCol;
    };

    // 핀아웃 버튼 이벤트
    App.bindPinoutEvents = function() {
        const occurBtn = document.getElementById('f3iPinoutOccurBtn');
        const useBtn = document.getElementById('f3iPinoutUseBtn');
        const closeBtn = document.getElementById('f3iPinoutCloseBtn');
        const section = document.getElementById('f3iPinoutSection');
        const titleText = document.getElementById('f3iPinoutTitleText');
        const headLabel = document.getElementById('f3iPinoutTableHeadLabel');

        if (occurBtn) {
            occurBtn.addEventListener('click', function() {
                if (section) {
                    section.style.display = 'block';
                    if (titleText) titleText.textContent = '핀아웃 발생';
                    if (headLabel) headLabel.textContent = '핀아웃 발생';
                    section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        }

        if (useBtn) {
            useBtn.addEventListener('click', function() {
                if (section) {
                    section.style.display = 'block';
                    if (titleText) titleText.textContent = '핀아웃 사용';
                    if (headLabel) headLabel.textContent = '핀아웃 사용';
                    section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                if (section) section.style.display = 'none';
                // 닫기는 입력 상세 영역만 접을 뿐, 사이드 잔량 요약 박스는
                // 실제 핀아웃 잔량 값 유무에 따라 계속 표시/숨김이 결정됨
            });
        }

        // 초기 상태 계산: 저장된 핀아웃 잔량이 없으면 3적층 구조로 시작
        App.calculatePinoutBalance();

        // 창 크기 변경 시에도 기본 테이블 높이 기준으로 3적층 높이를 재계산
        if (!App._sidePanelResizeBound) {
            window.addEventListener('resize', function() {
                if (typeof App.syncSidePanelHeight === 'function') App.syncSidePanelHeight();
            });
            App._sidePanelResizeBound = true;
        }
    };

    // 키보드 이동 로직
    App.bindKeyboardNavigation = function() {
        App.headerApi.elements.wrapper.addEventListener('keydown', function(e) {
            const target = e.target;
            if (!target.classList.contains('f3i-input')) return;

            const row = parseInt(target.dataset.row, 10);
            const col = target.dataset.col;
            if (!row || !col) return;

            const cols = ['B', 'C', 'D', 'E', 'F', 'G'];
            const colIdx = cols.indexOf(col);
            if (colIdx === -1) return;

            let nextRow = row; let nextColIdx = colIdx; let shouldMove = false;

            if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); nextRow = row + 1; shouldMove = true; } 
            else if (e.key === 'ArrowUp') { e.preventDefault(); nextRow = row - 1; shouldMove = true; } 
            else if (e.key === 'ArrowLeft') { e.preventDefault(); nextColIdx = colIdx - 1; shouldMove = true; } 
            else if (e.key === 'ArrowRight') { e.preventDefault(); nextColIdx = colIdx + 1; shouldMove = true; }

            if (shouldMove) {
                if (nextRow === 8 || nextRow === 9) {
                    if (e.key === 'ArrowDown' || e.key === 'Enter') nextRow = 10;
                    if (e.key === 'ArrowUp') nextRow = 7;
                }
                if (nextRow >= 1 && nextRow <= 10 && nextColIdx >= 0 && nextColIdx < cols.length) {
                    const nextCol = cols[nextColIdx];
                    const nextInput = App.headerApi.elements.wrapper.querySelector(`.f3i-input[data-row="${nextRow}"][data-col="${nextCol}"]`);
                    if (nextInput && !nextInput.readOnly) {
                        nextInput.focus(); nextInput.select();
                    }
                }
            }
        });
    };

    // PDF 출력 내보내기
    App.exportToPDF = function() {
        if (!window.html2canvas || !window.jspdf) {
            alert("PDF 모듈을 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        const pdfBtn = App.headerApi.elements.excelBtn;
        const btnInner = pdfBtn.innerHTML;
        pdfBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px; margin-right: 4px;">hourglass_empty</span>처리중...';
        pdfBtn.disabled = true;

        const wrapper = App.headerApi.elements.wrapper;
        const currentDate = App.headerApi.getCurrentDate();

        const todayBtn = App.headerApi.elements.todayBtn;
        const editBtn = App.headerApi.elements.editBtn;
        const saveBtn = App.headerApi.elements.saveBtn;
        const hideTargets = [todayBtn, editBtn, saveBtn, pdfBtn].filter(Boolean);
        const prevDisplay = hideTargets.map(el => el.style.display);
        hideTargets.forEach(el => { el.style.display = 'none'; });

        const restore = () => {
            hideTargets.forEach((el, i) => { el.style.display = prevDisplay[i]; });
            pdfBtn.innerHTML = btnInner;
            pdfBtn.disabled = false;
        };

        setTimeout(() => {
            const rect = wrapper.getBoundingClientRect();
            const pxToMm = 25.4 / 96;
            const pageWidthMm = rect.width * pxToMm;
            const pageHeightMm = rect.height * pxToMm;

            html2canvas(wrapper, {
                scale: 1.5,
                useCORS: true,
                backgroundColor: '#f5f5f7'
            }).then(canvas => {
                restore();

                const { jsPDF } = window.jspdf;
                const imgData = canvas.toDataURL('image/jpeg', 0.75);

                const pdf = new jsPDF({
                    orientation: pageWidthMm >= pageHeightMm ? 'landscape' : 'portrait',
                    unit: 'mm',
                    format: [pageWidthMm, pageHeightMm],
                    compress: true
                });

                pdf.addImage(imgData, 'JPEG', 0, 0, pageWidthMm, pageHeightMm, undefined, 'FAST');
                pdf.save(`3공장_급지일지_${currentDate}.pdf`);
            }).catch(err => {
                restore();
                alert("PDF 생성 중 오류가 발생했습니다: " + err.message);
            });
        }, 100);
    };

    // 위치 변경 (맞교환) 기능 구현
    App.swapState = {
        active: false,
        firstSelectedCell: null
    };

    App.disableSwapMode = function() {
        App.swapState.active = false;
        App.swapState.firstSelectedCell = null;
        
        const infoBar = document.getElementById('f3iSwapInfoBar');
        if (infoBar) {
            infoBar.style.display = 'none';
            infoBar.textContent = '';
        }
        
        document.querySelectorAll('.f3i-td.editable').forEach(td => {
            td.classList.remove('swap-candidate', 'swap-selected');
        });
        
        document.querySelectorAll('.f3i-swap-btn').forEach(btn => {
            btn.style.backgroundColor = '#007AFF';
            btn.textContent = '위치 변경';
        });
    };

    App.bindSwapFeature = function() {
        const infoBar = document.getElementById('f3iSwapInfoBar');
        const swapBtns = document.querySelectorAll('.f3i-swap-btn');
        
        if (!swapBtns || swapBtns.length === 0) return;
        
        swapBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                if (App.swapState.active) {
                    App.disableSwapMode();
                } else {
                    App.swapState.active = true;
                    App.swapState.firstSelectedCell = null;
                    
                    document.querySelectorAll('.f3i-swap-btn').forEach(b => {
                        b.style.backgroundColor = '#ff9500';
                        b.textContent = '변경 취소';
                    });
                    
                    if (infoBar) {
                        infoBar.textContent = '변경하려는 잔량을 선택해 주세요';
                        infoBar.style.display = 'block';
                    }
                    
                    document.querySelectorAll('.f3i-td.editable').forEach(td => {
                        const inp = td.querySelector('input.target-calc[data-row="1"], input.target-calc[data-type^="mid_bal"], input.target-calc[data-row="10"]');
                        if (inp) {
                            td.classList.add('swap-candidate');
                        }
                    });
                }
            });
        });
        
        const wrapper = document.querySelector('.f3i-wrapper');
        if (wrapper) {
            wrapper.addEventListener('click', function(e) {
                if (!App.swapState.active) return;
                
                const td = e.target.closest('td.swap-candidate');
                if (!td) return;
                
                e.preventDefault();
                e.stopPropagation();
                
                const input = td.querySelector('input');
                if (!input) return;
                
                if (!App.swapState.firstSelectedCell) {
                    App.swapState.firstSelectedCell = td;
                    td.classList.add('swap-selected');
                    if (infoBar) {
                        infoBar.textContent = '변경할 잔량 대상을 선택해 주세요';
                    }
                } else {
                    if (App.swapState.firstSelectedCell === td) {
                        td.classList.remove('swap-selected');
                        App.swapState.firstSelectedCell = null;
                        if (infoBar) {
                            infoBar.textContent = '변경하려는 잔량을 선택해 주세요';
                        }
                    } else {
                        const input1 = App.swapState.firstSelectedCell.querySelector('input');
                        const input2 = input;
                        
                        const tempVal = input1.value;
                        input1.value = input2.value;
                        input2.value = tempVal;
                        
                        App.calculateAutoFields();
                        App.disableSwapMode();
                    }
                }
            });
        }
        
        const editBtn = document.getElementById('f3iEditBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                setTimeout(() => {
                    if (App.headerApi && !App.headerApi.isEditMode()) {
                        App.disableSwapMode();
                    }
                }, 100);
            });
        }
        
        const saveBtn = document.getElementById('f3iSaveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                setTimeout(() => {
                    App.disableSwapMode();
                }, 100);
            });
        }
    };
})();