/* factory3_facility_comp.js — 3공장 콤프레셔 가동 페이지 */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        console.log('[factory3_facility_comp] 콤프레셔 가동 페이지 초기화');

        initLightbox();
    });

    /* ── 라이트박스 ── */
    function initLightbox() {
        const lightbox    = document.getElementById('f3comp-lightbox');
        const lbImg       = document.getElementById('f3comp-lightbox-img');
        const closeBtn    = document.getElementById('f3comp-lightbox-close');
        const imgWraps    = document.querySelectorAll('.f3comp-step-img-wrap');

        if (!lightbox || !lbImg || !closeBtn) return;

        // 각 이미지 클릭 시 라이트박스 열기
        imgWraps.forEach(function (wrap) {
            wrap.addEventListener('click', function () {
                const img = wrap.querySelector('.f3comp-step-img');
                if (!img) return;
                lbImg.src = img.src;
                lbImg.alt = img.alt;
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        });

        // 닫기 버튼
        closeBtn.addEventListener('click', closeLightbox);

        // 배경 클릭으로 닫기
        lightbox.addEventListener('click', function (e) {
            if (e.target === lightbox) closeLightbox();
        });

        // ESC 키로 닫기
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeLightbox();
        });

        function closeLightbox() {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // TODO: 필요한 경우 Supabase 등에서 가동 데이터를 불러와 이곳에 렌더링
    // 예: loadCompressorStatus();

})();
