/* factory3_io_script.js */
(function() {
    'use strict';

    let state = { currentDate: null, isEditMode: false, fp: null, isAdmin: false };
    let elements = {};

    const utils = {
        getTodayStr: () => {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        },
        formatKoDate: (str) => {
            if (!str) return '';
            const d = new Date(str);
            const days = ['일', '월', '화', '수', '목', '금', '토'];
            return `${d.getFullYear()}년 ${String(d.getMonth() + 1).padStart(2, '0')}월 ${String(d.getDate()).padStart(2, '0')}일 (${days[d.getDay()]})`;
        },
        addDays: (dateStr, days) => {
            const d = new Date(dateStr);
            d.setDate(d.getDate() + days);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
    };

    function confirmLeaveEditMode() {
        if (state.isEditMode) {
            return confirm('저장되지 않은 변경사항이 있습니다. 나가시겠습니까?');
        }
        return true;
    }

    function setCurrentDate(dateStr) {
        state.currentDate = dateStr;
        elements.dateText.innerText = utils.formatKoDate(dateStr);
        if (state.fp) {
            state.fp.setDate(dateStr, false);
        }
    }

    function toggleEditMode() {
        if (!state.isAdmin) return;
        state.isEditMode = !state.isEditMode;

        if (state.isEditMode) {
            elements.wrapper.classList.add('edit-mode');
            elements.editBtn.textContent = '보기';
            elements.saveBtn.disabled = false;
            elements.wrapper.querySelectorAll('.gf3-td.editable .gf3-input').forEach(input => {
                input.readOnly = false;
            });
        } else {
            elements.wrapper.classList.remove('edit-mode');
            elements.editBtn.textContent = '수정';
            elements.saveBtn.disabled = true;
            elements.wrapper.querySelectorAll('.gf3-td.editable .gf3-input').forEach(input => {
                input.readOnly = true;
            });
        }
    }

    function exportToExcel() {
        const btnInner = elements.excelBtn.innerHTML;
        elements.excelBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px; margin-right: 4px;">hourglass_empty</span>처리중...';
        elements.excelBtn.disabled = true;

        setTimeout(() => {
            elements.excelBtn.innerHTML = btnInner;
            elements.excelBtn.disabled = false;
            alert('엑셀 저장 기능은 준비 중입니다.');
        }, 400);
    }

    const Factory3IoModule = {
        init: function() {
            const savedRole = sessionStorage.getItem('gf3_role');

            if (savedRole === 'admin') {
                state.isAdmin = true;
            } else if (savedRole === 'readonly') {
                state.isAdmin = false;
            } else {
                const pwInput = prompt('접속 비밀번호를 입력하세요:');
                if (pwInput === 'edit0000') {
                    state.isAdmin = true;
                    sessionStorage.setItem('gf3_role', 'admin');
                } else if (pwInput === 'mk1324') {
                    state.isAdmin = false;
                    sessionStorage.setItem('gf3_role', 'readonly');
                } else {
                    alert('비밀번호가 올바르지 않습니다.');
                    location.href = 'about:blank';
                    return;
                }
            }

            window.addEventListener('beforeunload', function(e) {
                if (state.isEditMode) {
                    e.preventDefault();
                    e.returnValue = '';
                }
            });

            elements.wrapper = document.querySelector('.gf3-wrapper');
            if (!elements.wrapper) return;

            elements.dateText = document.getElementById('gf3IoDateText');
            elements.prevBtn = document.getElementById('gf3IoPrevBtn');
            elements.nextBtn = document.getElementById('gf3IoNextBtn');
            elements.todayBtn = document.getElementById('gf3IoTodayBtn');
            elements.editBtn = document.getElementById('gf3IoEditBtn');
            elements.saveBtn = document.getElementById('gf3IoSaveBtn');
            elements.excelBtn = document.getElementById('gf3IoExcelBtn');

            if (state.isAdmin) {
                elements.editBtn.disabled = false;
            }

            const today = utils.getTodayStr();
            state.currentDate = utils.addDays(today, -1);
            elements.dateText.innerText = utils.formatKoDate(state.currentDate);

            let justClosed = false;

            state.fp = flatpickr('#gf3IoFlatpickr', {
                locale: 'ko',
                dateFormat: 'Y-m-d',
                defaultDate: state.currentDate,
                positionElement: elements.dateText,
                position: 'auto center',
                clickOpens: false,
                onReady: function(selectedDates, dateStr, instance) {
                    instance.calendarContainer.style.marginTop = '10px';
                },
                onChange: (dates, str) => {
                    if (!confirmLeaveEditMode()) {
                        state.fp.setDate(state.currentDate, false);
                        return;
                    }
                    setCurrentDate(str);
                },
                onClose: () => {
                    justClosed = true;
                    setTimeout(() => { justClosed = false; }, 200);
                }
            });

            elements.dateText.addEventListener('click', (e) => {
                e.stopPropagation();
                if (justClosed) return;
                if (state.fp) state.fp.toggle();
            });

            elements.prevBtn.addEventListener('click', () => {
                if (!confirmLeaveEditMode()) return;
                setCurrentDate(utils.addDays(state.currentDate, -1));
            });

            elements.nextBtn.addEventListener('click', () => {
                if (!confirmLeaveEditMode()) return;
                setCurrentDate(utils.addDays(state.currentDate, 1));
            });

            elements.todayBtn.addEventListener('click', () => {
                const todayStr = utils.getTodayStr();
                if (state.currentDate !== todayStr) {
                    if (!confirmLeaveEditMode()) return;
                    setCurrentDate(todayStr);
                }
            });

            elements.editBtn.addEventListener('click', toggleEditMode);
            elements.excelBtn.addEventListener('click', exportToExcel);

            elements.saveBtn.addEventListener('click', () => {
                if (!state.isEditMode) return;
                alert('저장 기능은 준비 중입니다.');
            });
        },
        destroy: function() {
            if (state.fp) {
                state.fp.destroy();
                state.fp = null;
            }
        }
    };

    window.Factory3IoModule = Factory3IoModule;

    document.addEventListener('DOMContentLoaded', function() {
        Factory3IoModule.init();
    });
})();
