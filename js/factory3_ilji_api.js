/* factory3_ilji_api.js */
(function() {
    'use strict';
    
    const App = window.Factory3Ilji;
    if (!App) return;

    const supabase = Factory3Utils.initSupabase();

    // 데이터 불러오기 개조 (과거 고정식 vs 신규 가변 구조 정교한 스위칭)
    App.loadData = async function(dateStr) {
        if (App.headerApi && App.headerApi.isEditMode()) App.headerApi.toggleEditMode();
        
        try {
            const { data, error } = await supabase
                .from('factory3_geupji_real')
                .select('*')
                .eq('date', dateStr);

            if (error) { console.error("Supabase 로드 에러:", error); return; }

            // 인풋 및 상태 객체 초기화 클리어링
            document.querySelectorAll('.f3i-input').forEach(input => input.value = "");
            App.state.prevWanA = 0; App.state.prevWanD = 0;
            App.state.sessions = [];
            App.state.isLegacyMode = true;

            // 정적 컴포넌트 롤백 처리 호출용 초기화
            const tbody = document.querySelector('.f3i-table tbody');
            if(tbody && tbody.querySelector('.session-divider-row')) {
                // 가변 세션 잔해가 존재하는 상태에서 날짜 변경 시 정적 구조 임시 확보 복원
                location.reload(); return; 
            }

            // 가변 데이터 메타 인덱스 감지 및 전처리 체킹
            const sessionMetaRecord = data?.find(item => item.item_type === 'session_json');

            if (sessionMetaRecord && sessionMetaRecord.memo) {
                // [가변 분기] 동적 가변 레이아웃 구성 개시
                App.state.isLegacyMode = false;
                App.state.sessions = JSON.parse(sessionMetaRecord.memo);
                App.renderDynamicSessions();

                // 가변 상태 UI 매핑 값 주입 루프
                data.forEach(item => {
                    const c = item.col_id;
                    const valNum = item.value ? Number(item.value) : 0;
                    if (valNum === 0 && !item.memo) return;

                    if (item.item_type === 'start_bal_1') {
                        const el = document.querySelector(`.f3i-input[data-row="1"][data-col="${c}"]`);
                        if (el) el.value = valNum.toLocaleString();
                        if (item.memo) {
                            const memoEl = document.querySelector(`.f3i-input[data-row="1"][data-col="H"]`);
                            if (memoEl) memoEl.value = item.memo;
                        }
                    } else if (item.item_type === 'stat_total_usage') {
                        const el = document.getElementById('statTotalUsage');
                        if (el) el.value = valNum.toLocaleString() + " kg";
                    } else if (item.item_type.startsWith('side_wan')) {
                        const el = document.getElementById(`sideWan${c}`);
                        if (el) el.value = valNum.toLocaleString() + " R/L";
                    }
                });
            } else {
                // [하위 호환] 과거 레거시 6행 고정 파싱 적용
                App.state.isLegacyMode = true;
                const loadedStartBalCols = new Set();

                if (data && data.length > 0) {
                    data.forEach(item => {
                        const typeTokens = item.item_type.split('_');
                        const r = typeTokens[typeTokens.length - 1]; 
                        const baseType = item.item_type.replace(`_${r}`, ''); 
                        const c = item.col_id;
                        const valNum = item.value ? Number(item.value) : 0;
                        let val = "";
                        
                        if (valNum !== 0) {
                            if (item.item_type === 'stat_total_usage') {
                                val = valNum.toLocaleString() + " kg";
                            } else if (item.item_type.startsWith('side_wan')) {
                                val = valNum.toLocaleString() + " R/L";
                            } else {
                                const rInt = parseInt(r, 10);
                                if (rInt >= 2 && rInt <= 7) {
                                    val = valNum >= 20 ? valNum.toLocaleString() + " kg" : valNum.toLocaleString() + " R/L";
                                } else {
                                    val = valNum.toLocaleString();
                                }
                            }
                        }

                        if (item.item_type === 'start_bal_1') loadedStartBalCols.add(c);
                        
                        if (baseType === 'side_wan') {
                            const el = document.getElementById(`sideWan${c}`);
                            if (el) el.value = val;
                        } else if (item.item_type === 'stat_total_usage') {
                            const el = document.getElementById('statTotalUsage');
                            if (el) el.value = val;
                        } else {
                            const el = document.querySelector(`.f3i-input[data-row="${r}"][data-col="${c}"]`);
                            if (el) el.value = val;
                            if (r === "1" && item.memo) {
                                const memoEl = document.querySelector(`.f3i-input[data-row="1"][data-col="H"]`);
                                if (memoEl) memoEl.value = item.memo;
                            }
                        }
                    });
                }

                // 전일 잔량 인입 지원 유틸리티 가동
                const cols = ['B', 'C', 'D', 'E', 'F', 'G'];
                const missingStartBalCols = cols.filter(col => !loadedStartBalCols.has(col));
                const prevDate = Factory3Utils.addDays(dateStr, -1);
                const { data: prevData, error: prevError } = await supabase
                    .from('factory3_geupji_real')
                    .select('*')
                    .eq('date', prevDate);
                
                if (!prevError && prevData) {
                    prevData.forEach(item => {
                        if (item.item_type === 'end_bal_10' && missingStartBalCols.includes(item.col_id)) {
                            const valNum = item.value ? Number(item.value) : 0;
                            if (valNum !== 0) {
                                const el = document.querySelector(`.f3i-input[data-row="1"][data-col="${item.col_id}"]`);
                                if (el) el.value = valNum.toLocaleString();
                            }
                        }
                        if (item.item_type === 'side_wan_1') {
                            if (item.col_id === 'A') App.state.prevWanA = item.value ? Number(item.value) : 0;
                            if (item.col_id === 'D') App.state.prevWanD = item.value ? Number(item.value) : 0;
                        }
                    });
                }
            }

            // 추가적인 수집형 플러스 버튼 가상 배치 인터페이스 트리거 확보 설정
            if (App.state.isLegacyMode) {
                const legacyWanHeaderCell = document.querySelector('.f3i-table tbody tr:nth-child(2) td:first-child, .f3i-table tbody tr:nth-child(2) th:first-child');
                if (legacyWanHeaderCell && !document.getElementById('f3iAddSessionBtn')) {
                    legacyWanHeaderCell.style.position = 'relative';
                    legacyWanHeaderCell.innerHTML += `<span class="material-symbols-outlined f3i-add-session-btn" id="f3iAddSessionBtn" style="font-size: 16px; position: absolute; right: 4px; top: 50%; transform: translateY(-50%); color: #007AFF; cursor:pointer;" title="사용량 집계 추가">add_circle</span>`;
                    document.getElementById('f3iAddSessionBtn')?.addEventListener('click', App.addSessionClick);
                }
            }

            App.calculateAutoFields();
        } catch (err) {
            console.error("시스템 에러:", err);
        }
    };

    // 데이터 저장 프로세스 개조 (EAV 구조 준수 및 격리 통계용 매핑 데이터 자동 연동)
    App.handleSave = async function() {
        const currentDate = App.headerApi.getCurrentDate();
        const finalInsertData = [];
        const cols = ['B', 'C', 'D', 'E', 'F', 'G'];
        const extractVal = (el) => el ? el.value.replace(/,/g, '').replace(/kg/g, '').replace(/R\/L/g, '').trim() : "";

        // 1. 공통 헤더 잔량 및 비고(H) 수집
        cols.forEach(col => {
            const startEl = document.querySelector(`.f3i-input[data-row="1"][data-col="${col}"]`);
            const memoEl = document.querySelector(`.f3i-input[data-row="1"][data-col="H"]`);
            if (extractVal(startEl) || (memoEl && memoEl.value)) {
                finalInsertData.push({
                    date: currentDate, item_type: 'start_bal_1', col_id: col,
                    value: parseInt(extractVal(startEl), 10) || 0, memo: memoEl ? memoEl.value : ""
                });
            }
        });

        if (App.state.isLegacyMode) {
            // [하위 호환형] 정적 6행 개별 레코드 적재
            cols.forEach(col => {
                for (let r = 2; r <= 7; r++) {
                    const wanEl = document.querySelector(`.f3i-input[data-row="${r}"][data-col="${col}"]`);
                    const valNum = parseInt(extractVal(wanEl), 10) || 0;
                    if (valNum !== 0) finalInsertData.push({ date: currentDate, item_type: `wan_roll_${r}`, col_id: col, value: valNum, memo: "" });
                }
                const endEl = document.querySelector(`.f3i-input[data-row="10"][data-col="${col}"]`);
                const endValNum = parseInt(extractVal(endEl), 10) || 0;
                if (endValNum !== 0) finalInsertData.push({ date: currentDate, item_type: 'end_bal_10', col_id: col, value: endValNum, memo: "" });
            });
        } else {
            // [가변 세션형] 수집 구조체 갱신 및 직렬화 메타 레코드 생성
            App.state.sessions.forEach((session, sIdx) => {
                cols.forEach(col => {
                    for (let rIdx = 0; rIdx < 3; rIdx++) {
                        const inputEl = document.querySelector(`input[data-session="${sIdx}"][data-type="wan"][data-row-idx="${rIdx}"][data-col="${col}"]`);
                        session.wanRolls[rIdx][col] = inputEl ? inputEl.value : "";
                    }
                    const endBalInput = document.querySelector(`input[data-session="${sIdx}"][data-type="end-bal"][data-col="${col}"]`);
                    session.endBal[col] = endBalInput ? endBalInput.value : "";
                });
            });

            finalInsertData.push({
                date: currentDate, item_type: 'session_json', col_id: 'Z',
                value: 0, memo: JSON.stringify(App.state.sessions)
            });

            // 우측 마스터 패널 및 통계 분석 모듈 지원을 위한 가상 최종 마감 처리 대입 데이터 확보 생성
            const lastSessionIdx = App.state.sessions.length - 1;
            cols.forEach(col => {
                const finalEndVal = parseInt(App.state.sessions[lastSessionIdx].endBal[col].replace(/[^0-9.-]+/g, ""), 10) || 0;
                if (finalEndVal !== 0) {
                    finalInsertData.push({ date: currentDate, item_type: 'end_bal_10', col_id: col, value: finalEndVal, memo: "" });
                }
            });
        }

        // 2. 우측 마스터 패널 정보 수집 매핑
        const sideItems = [
            { id: 'sideWanA', type: 'side_wan_1', col: 'A' }, { id: 'sideWanD', type: 'side_wan_1', col: 'D' },
            { id: 'sideGeupA', type: 'geup_real', col: 'A' }, { id: 'sideGeupD', type: 'geup_real', col: 'D' },
            { id: 'sideChulgoA', type: 'geup_out', col: 'A' }, { id: 'sideChulgoD', type: 'geup_out', col: 'D' },
            { id: 'statTotalUsage', type: 'stat_total_usage', col: 'H' }
        ];
        sideItems.forEach(item => {
            const valNum = parseInt(extractVal(document.getElementById(item.id)), 10) || 0;
            if (valNum !== 0) finalInsertData.push({ date: currentDate, item_type: item.type, col_id: item.col, value: valNum, memo: "" });
        });

        try {
            const { error: deleteError } = await supabase.from('factory3_geupji_real').delete().eq('date', currentDate);
            if (deleteError) { alert('기존 데이터 초기화 실패: ' + deleteError.message); return; }

            if (finalInsertData.length > 0) {
                const { error: insertError } = await supabase.from('factory3_geupji_real').insert(finalInsertData);
                if (insertError) { alert('저장 실패: ' + insertError.message); }
                else { alert('저장 완료되었습니다.'); App.headerApi.toggleEditMode(); App.loadData(currentDate); }
            } else {
                alert('저장 완료되었습니다. (모든 값이 비어 초기화 처리되었습니다.)');
                App.headerApi.toggleEditMode(); App.loadData(currentDate);
            }
        } catch (err) {
            alert('네트워크 오류가 발생했습니다: ' + err.message);
        }
    };
})();