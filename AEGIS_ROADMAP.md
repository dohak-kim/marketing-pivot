# Marketing Pivot · Project AEGIS
## UX/UI & 워크플로우 개선 로드맵

> 최초 작성: 2026-05-03  
> 최종 업데이트: 2026-05-17  
> 기준 커밋: `11281d3` (main)

---

## 1. 프로젝트 구성 현황

### 앱 목록

| 앱 | 경로 | 역할 | 상태 |
|---|---|---|---|
| AESA Radar | `/tools/aesa` | 시장·경쟁 분석 (PEST·3C·SWOT·STP) | ✅ 안정 |
| C³ Cube Strategy | `/tools/c3` | 전략 수립 핵심 — Context·ExecutionPlan 생성 | ✅ 안정 |
| Pathfinder | `/tools/pathfinder` | 고객 구매여정(CDJ) 분석 + 실시간 SERP 파이프라인 | ✅ 안정 |
| Signal | `/tools/signal` | 키워드·CEP 분석 + AEO 콘텐츠 생성 | ✅ 안정 |
| Vision | `/tools/video` | 영상 멀티모달 분석 | ✅ 안정 |
| FORGE | `/tools/forge` | AI 크리에이티브 제작 (Reels·광고·블로그·AEO) | ✅ 안정 |
| Blog Editor | `/admin/blog` | 콘텐츠 작성·스키마 생성·게시 | ✅ 안정 |
| Blog 공개 화면 | `/blog` `/blog/:slug` | 인사이트 리포트 게시·열람 | ✅ 안정 |

---

## 2. 앱 간 연결 현황

### 목표 전략 흐름 — 전부 구현 완료 (2026-05-03)

```
AESA Radar ──────────────────────────────┐
(시장·경쟁 분석)   → C³ 초기값 자동 주입  │
                                          ▼
Pathfinder ──→  C³ Cube Strategy  ──→  FORGE  ──→  Blog Editor ──→ /blog
(CDJ 분석)      (전략 수립·실행계획)    (콘텐츠)      (편집·게시)     (공개)
Signal ──────────────────────────────────┘
(CEP·키워드)  → C³ 배틀필드 연결
```

### 연결 완료 현황

| 연결 구간 | 상태 |
|---|---|
| C³ ExecutionPlan → FORGE Reels | ✅ URL 파라미터 + 자동 주입 |
| Signal AEO 콘텐츠 → Blog Editor | ✅ sessionStorage 전달 |
| Pathfinder CDJ → C³ 전략 | ✅ Intent 데이터 초기값 주입 |
| AESA 분석 결과 → C³ 초기값 | ✅ 경쟁사·카테고리·키워드 자동 입력 |
| Signal(CEP) → C³ 배틀필드 | ✅ 컨텍스트 공유 |
| Vision → FORGE Reels 기획 | ✅ 영상 분석 결과 → Reels 파이프라인 |
| ForgeStudio → Blog Editor | ✅ 직접 전송 버튼 |
| FORGE AEO 블로그 → Blog Editor | ✅ AEO 탭 → 에디터 내보내기 |

---

## 3. 원래 로드맵 완료 현황 (전체 완료)

### 🔴 P0 — 완료

| 항목 | 커밋 | 완료일 |
|---|---|---|
| ① C³ ExecutionPlan → FORGE Reels 연동 | `feat(p0)` | 2026-05-03 |
| ② FORGE 전략 컨텍스트 배너 | `feat(p0)` | 2026-05-03 |

### 🟠 P1 — 완료

| 항목 | 커밋 | 완료일 |
|---|---|---|
| ③ Signal AEO 콘텐츠 → Blog Editor 연결 | `feat(p1-③)` | 2026-05-03 |
| ④ FORGE AEO 블로그 초안 탭 추가 | `feat(p1-④⑤)` | 2026-05-03 |
| ⑤ Pathfinder(CDJ) → C³ 인사이트 전달 | `feat(p1-④⑤)` | 2026-05-03 |

### 🟡 P2 — 완료

| 항목 | 커밋 | 완료일 |
|---|---|---|
| ⑥ ForgeStudio → Blog Editor 직접 전송 | `feat(p2-⑥)` | 2026-05-03 |
| ⑦ 전략 흐름 네비게이션 가이드 | `feat(p2-⑦⑧)` | 2026-05-03 |
| ⑧ AESA 분석 결과 → C³ 초기값 주입 | `feat(p2-⑦⑧)` | 2026-05-03 |

### 🟢 P3 — 완료

| 항목 | 커밋 | 완료일 |
|---|---|---|
| ⑨ 분석 세션 저장·불러오기 (IndexedDB) | `feat(p3-⑨)` | 2026-05-03 |
| ⑩ 번들 코드 스플리팅 최적화 | `feat(p3-⑩)` | 2026-05-03 |
| ⑪ Vision → FORGE Reels 파이프라인 | `feat(p3-⑪)` | 2026-05-03 |

---

## 4. 작업 이력

### 2026-05-11

| 커밋 | 내용 |
|---|---|
| `b06dd21` | **[버그수정]** cognitionShift 오판정 — hybridCognition 기반으로 통일 (Commercial→Commercial이 "인텐트 전환"으로 잘못 표시되던 버그) |
| `23ad25b` | **[버그수정]** 비교 모드 "AI 추정값" 해소 — SERP 파이프라인을 비교 모드에도 적용, `2y` period 처리 누락 수정 |
| `4a28576` | **[버그수정]** calcDays +1 inclusive 수정 (25.1.1~12.31 → 364일 오류 → 365일 정상) |
| `bd99466` | **[버그수정]** vite.config.ts — Naver/Serper API 키 define 블록 누락 추가 |
| `380e4bf` | **[인프라]** Vercel — `VITE_NAVER_AD_API_KEY` / `VITE_NAVER_AD_SECRET` / `VITE_NAVER_AD_CUSTOMER_ID` 등록 (전 환경) |
| `a315ef4` | **[버그수정]** pipeline.ts — 동적 env 접근자 → `process.env.VITE_*` 정적 참조로 교체 |
| `300ad13` | **[버그수정]** pipeline.ts — `import.meta.env.VITE_*` 직접 참조로 재수정 (Vite 프로덕션 빌드 호환) |
| `300ad13` | **[버그수정]** `api/naver/[...path].ts` — URL `/v1/` 이중 조합 버그 수정 (`/v1/v1/search/...` → `/v1/search/...`) |
| `e73aed3` | **[문서]** `AEGIS_C3_MODELING_SPEC.md` 신규 생성 — 논문용 C³ 모델링 명세서 (수식 22개, 알고리즘 5종) |
| `bb8cd33` | **[성능]** withRetry 파라미터 복원 (retries 5→3, baseDelay 3000→2000ms) |
| `bb8cd33` | **[안정성]** fetchAndClassifyRawData 실패 시 분석 중단 없이 graceful 폴백 처리 |
| `25ba79a` | **[성능]** fetchAndClassifyRawData 모델 `gemini-3-pro-preview` → `gemini-3-flash-preview` 교체 (503 발생률 감소) |
| `11281d3` | **[성능]** Serper 순차→5개씩 병렬 배치, Naver 블로그 순차→`Promise.all` 전체 병렬화 |
| `11281d3` | **[성능]** 시드 키워드 수 15개 → 10개 (데이터 수집 시간 30~40초 → 4~6초) |

### 2026-05-10

| 커밋 | 내용 |
|---|---|
| `65fa8b5` | **[버그수정]** `veoPrompts` responseSchema 위치 오류 수정 → "인사이트 생성 중 오류" 해결 |
| `65fa8b5` | **[버그수정]** vite.config.ts — AESA `/api/news`, `/api/datalab` 프록시 누락 추가 (Naver 인증 헤더 자동 주입) |
| `65fa8b5` | **[버그수정]** newsCollector.ts — Naver News 쿼리 파라미터 `q` → `query` 수정 |
| `65fa8b5` | **[버그수정]** 구 번들(`gemini-3-flash` 404) 제거 — 재빌드로 `gemini-3-flash-preview` 정상화, "AI 추정값" 배지 해소 |
| `b050423` | **[기능추가]** `AnalysisPeriod`에 `2y` (최근 2년) 프리셋 추가 |
| `b050423` | **[기능추가]** C³ 비교 모드 — "YoY 연간 비교" 원클릭 프리셋 버튼 추가 (A: 2년 전~1년 전 / B: 1년 전~오늘 자동 설정) |
| `b050423` | **[개선]** gemini.ts — `2y` 기간 한국어 레이블 처리 추가 |

---

### 2026-05-03 전체 작업 이력

### 오전 (02:55 ~ 12:31)

| 시각 | 커밋 | 내용 |
|---|---|---|
| 02:55 | `feat(p0)` | C³ ExecutionPlan → FORGE Reels 연동 + 로드맵 최초 작성 |
| 03:00 | `feat(p1-③)` | Signal AEO 콘텐츠 → Blog Editor 연결 |
| 03:04 | `feat(p1-④⑤)` | FORGE AEO 블로그 탭 + Pathfinder → C³ 연결 |
| 03:11 | `feat(c3)` | 시각화 3탭 AI 전략 해석 Summary 패널 추가 |
| 11:31 | `feat(c3)` | C³ 모델 정의 블록 (BattleFieldForm 히어로) |
| 11:36 | `feat(p2-⑦⑧)` | 전략 흐름 네비 + AESA → C³ 초기값 주입 |
| 11:37 | `feat(p3-⑪)` | Vision → FORGE Reels 파이프라인 연결 |
| 11:42 | `feat(p2-⑥)` | ForgeStudio → Blog Editor 직접 전송 |
| 11:46 | `feat(p3-⑨)` | 분석 세션 저장·불러오기 (IndexedDB) |
| 11:56 | `feat(p3-⑩)` | 번들 코드 스플리팅 (manualChunks) |
| 12:17 | `feat(①)` | 분석 세션 자동 저장 + 복원 배너 |
| 12:19 | `feat(⑪)` | @react-pdf/renderer 클릭 시점 지연 로딩 |
| 12:22 | `feat(⑦)` | Signal(CEP) → C³ 배틀필드 연결 |
| 12:31 | `fix` | API 키 불일치 + PDF 출력 로직 점검 수정 (5건) |

### 오후 (16:16 ~ 22:27)

| 시각 | 커밋 | 내용 |
|---|---|---|
| 16:16 | `feat` | 이미지 생성 엔진 통합 + 한글 텍스트 Canvas 합성 |
| 16:23 | `feat(c3-pdf)` | Journey Ladder / Heatmap / Similarity Network PDF 출력 개선 |
| 16:39 | `docs` | AEGIS_FEATURE_OVERVIEW.md 통합 기능·UX/UI 플로우 문서 추가 |
| 16:46 | `refactor(nav)` | '솔루션 열기' 개선 + 전략 흐름 서브바 → 6개 앱 탭 복원 |
| 17:21 | `feat(pathfinder)` | 소스 선택 UI → C³ SearchConfig 공유 컨텍스트 교체 |
| 17:29 | `feat(pathfinder)` | 실시간 Naver/Google SERP 데이터 수집 파이프라인 연동 (Option B) |
| 17:35 | `fix(pathfinder)` | 잘못된 모델명 수정 |
| 17:39 | `fix(pathfinder)` | 만료 모델 gemini-2.5-flash-preview-05-14 → gemini-3-flash-preview |
| 22:04 | `fix` | videoService.ts 동일 만료 모델 교체 |
| 22:23 | `feat(blog)` | **블로그 라이트 테마 적용** (에디터·목록·게시글 전면 라이트 전환) |
| 22:23 | `feat(blog)` | **1차 블로그 글 배포** '검색의 시대는 끝났다' (FAQ·HowTo·스키마 포함) |
| 22:27 | `fix(blog)` | 발행일 수정 2026-02-04 → 2026-05-03 |

---

## 5. 향후 작업 목록

### 🔴 N-P0 — 즉시 (핵심 인프라)

#### ① 실제 API 키 환경변수 연동
**임팩트**: 높음 · **공수**: 낮음 (설정만)

Vercel 프로젝트 환경변수에 아래 키를 등록하면 C³/AESA의 `dataProvenance`가 `'api'`(실데이터)로 전환됨.
(`/api/news`, `/api/datalab` 프록시는 2026-05-10 추가 완료 — API 키만 등록하면 즉시 활성)

```
SERPER_API_KEY          — Serper.dev Google SERP
NAVER_CLIENT_ID         — Naver 검색 API (뉴스 + 트렌드 + AESA DataLab)
NAVER_CLIENT_SECRET
NAVER_AD_API_KEY        — Naver 검색광고 API
NAVER_AD_SECRET
NAVER_AD_CUSTOMER_ID
```

**2026-05-11 완료**: `VITE_NAVER_AD_API_KEY/SECRET/CUSTOMER_ID` Vercel 등록 완료.  
`import.meta.env.VITE_*` 정적 참조 버그 수정으로 빌드 시 키값 정상 주입.  
현재: 키 등록 완료 → API 파이프라인 활성 → emerald 배지 (실측 데이터) ✅

---

#### ② 블로그 글 추가 게시 (콘텐츠 파이프라인 가동)
**임팩트**: 높음 · **공수**: 낮음

`src/data/posts/index.ts` 배열에 추가. Blog Editor에서 작성 → JSON 내보내기 → posts에 삽입 → 배포.

다음 예정 주제 (순서 무관):
- AEO vs SEO: 무엇이 다른가
- GEO(Generative Engine Optimization) 실전 가이드
- C³ Context 벡터 기반 전략 수립법
- CDJ Journey Ladder 활용 사례

---

### 🟠 N-P1 — 단기 (UX 완성도)

#### ③ 블로그 히어로 이미지 시스템
**임팩트**: 중 · **공수**: 중

- Blog Editor의 AI 이미지 생성으로 Hero Image URL 생성
- OG 태그(`og:image`) 자동 반영
- 글 목록 카드에 썸네일 표시

#### ④ 블로그 공개 페이지 — 메인 네비 연결
**임팩트**: 중 · **공수**: 낮음

- 현재 메인 사이트 네비에 `/blog` 링크 없음
- 헤더 네비에 "인사이트" 메뉴 추가

#### ⑤ Pathfinder SERP 데이터 → C³ 실시간 연동
**임팩트**: 높음 · **공수**: 중

- Pathfinder에서 수집한 실제 SERP 데이터를 C³ 컨텍스트로 전달
- 현재는 Pathfinder 독립 분석 후 수동으로 C³에 재입력하는 흐름
- 자동 전달 버튼 추가

---

### 🟡 N-P2 — 중기 (성장 단계)

#### ⑥ 유료화 티어 구현
**임팩트**: 매우 높음 · **공수**: 높음

현재 정의된 티어:
| 티어 | 가격 | 제한 |
|---|---|---|
| Free | 무료 | Lv.2, 5회/월 |
| Starter | ₩9,900/월 | - |
| Pro | ₩29,900/월 | - |
| Business | ₩79,900/월 | - |

구현 필요 사항: 결제 연동(Stripe/토스페이), 사용량 카운터, 로그인 시스템

#### ⑦ 모바일 반응형 전면 점검
**임팩트**: 중 · **공수**: 중

- 현재 3열 레이아웃(에디터, 좌우 패널)은 모바일 미지원
- 블로그 공개 화면은 반응형이나 툴 화면은 데스크탑 전용
- 최소 블로그 화면(`/blog`, `/blog/:slug`)은 모바일 최적화 권장

#### ⑧ 커스텀 도메인 연결
**임팩트**: 중 · **공수**: 낮음

- Vercel 프로젝트 설정에서 도메인 연결
- `marketing-pivot.vercel.app` → 실 도메인

---

### 🟢 N-P3 — 장기 (성숙 단계)

#### ⑨ 번들 사이즈 추가 최적화
현재 최대 청크: `@react-pdf` 1.4MB (gzip 491KB)  
`@react-pdf/renderer` dynamic import 심층 분리 — 현재 클릭 시점 lazy load 적용됐으나 청크 자체가 큼.

#### ⑩ 분석 세션 공유 (팀 협업)
현재 IndexedDB 기반 로컬 저장 → 클라우드 저장소 연동 (Supabase 또는 Firebase)  
팀 단위 세션 공유, 링크로 분석 결과 공유

#### ⑪ AEGIS API 분리 (SaaS 백엔드)
현재 Gemini API 키가 프론트엔드 빌드 타임에 embed됨 → 보안 취약.  
Vercel API Functions를 백엔드 레이어로 확장, 프론트에서는 내부 API만 호출.

---

## 6. 기술 스택 참고

| 영역 | 스택 |
|---|---|
| UI | React 19 + TypeScript + Tailwind CSS |
| 라우팅 | React Router v6 |
| 에디터 | Tiptap (WYSIWYG) |
| 시각화 | Chart.js, D3 (force-graph), Recharts |
| AI | `@google/genai ^1.38.0` (gemini-3-pro/flash-preview) |
| 외부 API | Serper (Google SERP), Naver 검색/트렌드 — **연동 준비 완료, 키 미설정** |
| 배포 | Vercel (Vite + API Functions) |
| 빌드 | API Key는 빌드 타임 embed (`vite.config.ts define`) |
| 세션 | IndexedDB (분석 세션 저장·불러오기) |

---

## 7. 토큰 원가 & 유료화 티어 (변경 없음)

### 토큰 원가
| 작업 | 비용 |
|---|---|
| Lv.2 분석 1회 | ~$0.086 / ~₩116, ~15s |
| Lv.3 분석 1회 | ~$0.123 / ~₩166, ~20s |
| CEP 오픈 per 1개 | ~$0.026 / ~₩35 |
| FORGE 1회 (~1000자) | ~$0.022 / ~₩30 |
| 완전 세션 (Lv.3+5CEP+FORGE) | ~$0.278 / ~₩375 |

### 유료화 티어
| 티어 | 가격 | 조건 |
|---|---|---|
| Free | 무료 | Lv.2, 5회/월 |
| Starter | ₩9,900/월 | - |
| Pro | ₩29,900/월 | - |
| Business | ₩79,900/월 | - |

---

*이 문서는 작업 진행에 따라 지속 업데이트 예정*
