# 3공장 웹 프로젝트 리팩토링 및 버그 수정 계획서

무료 티어의 API 및 토큰 한도를 최우선으로 고려하여, 전체 파일을 덮어쓰지 않고 **바뀌는 부분만 정밀 타격하여 치환(Replace)**하는 효율적인 리팩토링을 진행합니다. 이 방식은 토큰 소모가 매우 적어 한도 초과 없이 안전하게 완료할 수 있습니다.

---

## 1. 개요 및 주요 변경 사항

본 계획은 보안 취약점인 "비밀번호 하드코딩"을 유지한 채, 나머지 종합 검토 의견을 모두 반영합니다.

1. **파일명 및 참조 경로 통일**: 
   * CSS 파일명에서 불필요한 `_style`을 제거합니다. (`factory3_io_style.css` -> `factory3_io.css`, `factory3_contrast_style.css` -> `factory3_contrast.css`)
   * JS 파일명에서 복수형을 단수형으로 일치시킵니다. (`factory3_io_constants.js` -> `factory3_io_constant.js`)
2. **미사용 레거시 코드 정리**:
   * 더 이상 사용하지 않는 목업 데이터 전용 스크립트인 `factory3_io_table_module.js`를 삭제합니다.
3. **Supabase 및 날짜 유틸 공통화**:
   * `factory3_utils.js`에 공통 Supabase 클라이언트 초기화 로직을 추가하여 중복 코드를 제거합니다.
   * 각 페이지별 중복 구현된 날짜 헬퍼를 공통 유틸 함수(`Factory3Utils`)로 위임하여 중복을 해소합니다.
4. **날짜 고정 버그 수정 (`factory3_contrast_constant.js`)**:
   * 최초 로드 시점에 고정되어 있던 날짜 객체를 매번 실시간으로 가져오도록 수정합니다.
5. **대조 페이지 네임스페이스 통일**:
   * `FC_`로 시작하던 임시 접두사를 `Factory3Contrast` 아래의 단일 구조로 리팩토링하여 일관성을 확보합니다.

---

## 2. 변경 대상 파일 상세 계획

### [Component: Common & Config]

#### [MODIFY] [factory3_utils.js](file:///c:/Users/지고/Documents/GitHub/factory3_web/js/factory3_utils.js)
* Supabase 클라이언트를 공통으로 생성하여 반환하는 `initSupabase()` 함수를 추가합니다.

---

### [Component: 3공장 일지 (Ilji)]

#### [MODIFY] [factory3_ilji_api.js](file:///c:/Users/지고/Documents/GitHub/factory3_web/js/factory3_ilji_api.js)
* 개별 Supabase 생성을 제거하고, `Factory3Utils.initSupabase()`를 사용하도록 변경합니다.

#### [MODIFY] [factory3_ilji_constant.js](file:///c:/Users/지고/Documents/GitHub/factory3_web/js/factory3_ilji_constant.js)
* 파일 내부의 Supabase Url/Key 중복 정의를 제거합니다.

---

### [Component: 3공장 입출고 대장 (Io)]

#### [MODIFY] [factory3_io.html](file:///c:/Users/지고/Documents/GitHub/factory3_web/factory3_io.html)
* 리네임된 CSS 파일명(`factory3_io.css`) 및 JS 파일명(`factory3_io_constant.js`)에 맞게 참조 경로를 변경합니다.

#### [RENAME] `css/factory3_io_style.css` ➔ `css/factory3_io.css`
* 파일명을 일관성 있게 변경합니다.

#### [RENAME] `js/factory3_io_constants.js` ➔ `js/factory3_io_constant.js`
* 파일명을 단수형으로 통일하고, 내부 Supabase Url/Key 중복 제거 및 날짜 헬퍼 로직을 `Factory3Utils`로 연결합니다.

#### [MODIFY] [factory3_io_api.js](file:///c:/Users/지고/Documents/GitHub/factory3_web/js/factory3_io_api.js)
* 개별 Supabase 클라이언트 생성을 공통 인스턴스 참조로 교체합니다.

#### [DELETE] [factory3_io_table_module.js](file:///c:/Users/지고/Documents/GitHub/factory3_web/js/factory3_io_table_module.js)
* 미사용 레거시 파일을 삭제합니다.

---

### [Component: 3공장 대조 (Contrast)]

#### [MODIFY] [factory3_contrast.html](file:///c:/Users/지고/Documents/GitHub/factory3_web/factory3_contrast.html)
* 리네임된 CSS 파일명(`factory3_contrast.css`) 경로를 변경합니다.

#### [RENAME] `css/factory3_contrast_style.css` ➔ `css/factory3_contrast.css`
* 파일명을 일관성 있게 변경합니다.

#### [MODIFY] [factory3_contrast_constant.js](file:///c:/Users/지고/Documents/GitHub/factory3_web/js/factory3_contrast_constant.js)
* 날짜 고정 버그를 해결하고 전역 네임스페이스를 `window.Factory3Contrast.constant`로 수정합니다.

#### [MODIFY] [factory3_contrast_api.js](file:///c:/Users/지고/Documents/GitHub/factory3_web/js/factory3_contrast_api.js)
* Supabase 클라이언트 공통화를 연동하고, 전역 네임스페이스를 `window.Factory3Contrast.api`로 수정합니다.

#### [MODIFY] [factory3_contrast_render.js](file:///c:/Users/지고/Documents/GitHub/factory3_web/js/factory3_contrast_render.js)
* 전역 네임스페이스를 `window.Factory3Contrast.render`로 수정하고 내부 변수 참조를 맞춥니다.

#### [MODIFY] [factory3_contrast_main.js](file:///c:/Users/지고/Documents/GitHub/factory3_web/js/factory3_contrast_main.js)
* 전역 네임스페이스를 `window.Factory3Contrast.main`으로 수정하고 내부 변수 참조를 맞춥니다.

---

## 3. 검증 계획

### 수동 검증
1. **각 페이지 접속 테스트**: 리액션, 스타일 깨짐 유무 및 콘솔 에러 발생 여부 확인.
2. **날짜 변경 및 데이터 동기화**: 이전/다음 버튼 및 달력 선택 시 정상 패치 검증.
3. **엑셀 다운로드 기능**: 기존 저장된 엑셀 기능이 정상 작동하는지 확인.
4. **입력 및 저장 흐름**: 수정 버튼 클릭 후 입력, 저장 시 Supabase DB에 무결하게 보존되는지 검증.
