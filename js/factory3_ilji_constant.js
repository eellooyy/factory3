/* factory3_ilji_constant.js */
(function() {
    'use strict';
    
    // 전역 공유 객체 초기화
    window.Factory3Ilji = window.Factory3Ilji || {};
    
    // 연산용 상수
    Factory3Ilji.FACTOR_788 = 571;
    Factory3Ilji.FACTOR_1576 = 1143;

    // 공통 유틸리티
    Factory3Ilji.utils = {
        parseNum: (val) => {
            if (!val) return 0;
            return parseInt(String(val).replace(/[^0-9.-]+/g, "")) || 0;
        },
        formatKg: (num) => {
            return num.toLocaleString() + " kg";
        }
    };

    // 전역 상태 및 헤더 API 플레이스홀더 확장
    Factory3Ilji.state = { 
        prevWanA: 0, 
        prevWanD: 0,
        sessions: [],        // 동적 가변 세션 데이터 리스트
        isLegacyMode: true   // 과거 데이터 호환을 위한 플래그 (기본값 true)
    };
    Factory3Ilji.headerApi = null;
})();