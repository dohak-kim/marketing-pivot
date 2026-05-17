# Project AEGIS — 통합 기능 및 UX/UI 플로우

> 작성일: 2026-05-03  
> 최종 업데이트: 2026-05-17  
> 기준 커밋: `11281d3` (main)

---

## 전체 아키텍처

```
마케팅 플랫폼: marketing-pivot (Vercel, React 19 + TS + Vite + Tailwind)

전략 흐름 네비게이션 (상단 서브바):
[1 AESA] → [2 C³ Strategy] → [3 Pathfinder · Signal] → [4 FORGE] → [5 Blog]

URL 구조:
/tools/aesa        →  AEGIS AESA Radar      (시장·경쟁 분석)
/tools/c3          →  AEGIS C³ Strategy     (전략 수립 핵심)
/tools/pathfinder  →  AEGIS Pathfinder      (고객 여정 CDJ)
/tools/signal      →  AEGIS Signal          (CEP·키워드·AEO)
/tools/video       →  AEGIS Vision          (영상 멀티모달 분석)
/tools/forge       →  AEGIS FORGE           (AI 크리에이티브 제작)
/admin/blog        →  Blog Editor           (콘텐츠 작성·게시)
/                  →  마케팅 랜딩 페이지
```

---

## 앱 간 데이터 연결 맵

```
AESA ──────────────────────────────────────────────────┐
(category + brand + competitors)   sessionStorage        │
                                   aesa_to_c3            ▼
Signal ────────────────────────────────────────────▶  C³ Strategy
(keyword)                          aesa_to_c3            │
                                                         │  ExecutionPlan
Pathfinder ───────────────────────────────────────▶     │  (veoPrompts +
(CDJ insights)                     cdj_to_c3             │  situationSummary)
                                                         ▼
                                              AEGIS FORGE ──────▶ Blog Editor
                                              (forge_context)    signal_to_blog
Vision ──────────────────────────────────────────────────┘
(분석 요약 + actionItems)         forge_context(vision)

ForgeStudio (C³ 내부) ─────────────────────────────────▶ Blog Editor
(owned_hub 텍스트 콘텐츠)         signal_to_blog

Signal ─────────────────────────────────────────────────▶ Blog Editor
(AEO 콘텐츠)                      signal_to_blog
```

---

## 1. AEGIS AESA Radar `/tools/aesa`

**역할**: 시장·경쟁 지형을 클래식 전략 프레임워크로 분석, 전략 기반 수립

### 입력
- 분석 산업/카테고리 (필수)
- 자사 브랜드 (필수)
- 경쟁사 최대 4개
- 유관 키워드 (쉼표 구분)
- 추가 컨텍스트

### AI 분석 파이프라인 (`gemini-3.1-pro-preview`)
1. Query Optimization → Naver 최적 검색어 도출
2. Naver News API → 최신 뉴스 수집 (`/api/news` 프록시, 2026-05-10 수정)
3. Naver DataLab → 검색 트렌드 + 쇼핑 인사이트 (`/api/datalab` 프록시, 2026-05-10 추가)
4. Article Parser → 기사 본문 추출·정제
5. Fact Builder → 신뢰도 계층 구성
6. Fact Validator → 수치 데이터 정렬
7. Market Analysis → PEST·3C·SWOT 분석
8. STP Engine → CDJ·CEP 기반 세분화·타겟·포지셔닝

### 출력 리포트
- 시장 규모·PEST·3C(Company/Competitor/Customer)·SWOT
- STP (Segmentation · Targeting · Positioning) + 페르소나 초상화 (Imagen 3)
- 4P Mix 전략
- 커뮤니케이션 전략
- 9페이지 A4 PDF 다운로드 (`@react-pdf/renderer` — 보고서 생성 시점에만 지연 로드)

### → 후속 연결
- **"C³에서 전략 수립" 버튼** (분석 완료 시): `category + brand + competitors` → C³ BattleFieldForm 자동 입력

---

## 2. AEGIS C³ Cube Strategy `/tools/c3`

**역할**: C³(Context × Conversion × Cognition) 벡터 기반 전략 수립 핵심 엔진

### 히어로 화면
- **C¹ Context** (CEP 확장) / **C² Conversion** (CDJ 확장) / **C³ Cognition** (Intent 확장) — 3카드 가로 1행
- 기능 칩 8개 (CEP 분석/CDJ Ladder/5 Strategy/Hub&Spoke/SEO·AEO·GEO/AEGIS FORGE/Temporal/Brand SOV)

### 입력
- Target Category (필수)
- My Brand / Competitors (쉼표 구분)
- Configure Data Source (Google/Naver 깊이 레벨, 분석 기간)

### 외부 API 연동 (API 키 설정 시 활성)
- Serper.dev (Google SERP 실측)
- Naver 검색 + 트렌드 + 광고 API
- 데이터 출처 배지: `api` (실측, emerald) / `grounding_estimate` (AI 추정, amber)

### AI 분석 (`gemini-3-pro-preview`)
1. 시드 키워드 생성 → SERP 데이터 수집 (RAG Mode)
2. CEP 추출 (최대 15개) + Priority Score + Brand SOV
3. CDJ Journey Ladder 단계 분류 (4단계)
4. Cognition Vector 산출 (4유형)
5. 5 Strategy Framework 자동 분류 (offensive/defensive/niche/brand_build/monitor)
6. Hub & Spoke 3-Tier 전략 (Owned·Earned·Paid × SEO·AEO·GEO)
7. ExecutionPlan (Veo 프롬프트 포함)

### 전략 시각화 3탭

| 탭 | 시각화 | AI Summary |
|---|---|---|
| Journey Ladder | CDJ 4단계 계단형 맵 | AI 단계 분포 해석 (gemini-3-flash) |
| Strategic Heatmap | Context × Cognition 인텐시티 매트릭스 | AI 핫스팟 해석 |
| Similarity Network | D3 Force-Graph (노드=CEP, 색상=전략/Conversion) | AI 클러스터 패턴 해석 |

- 각 탭: VizSummaryPanel (헤드라인 + 인사이트 3개 + 권장 액션, 탭 전환 시 자동 생성·캐싱)
- PDF 출력 버튼 → PrintAnalysisViz 포털 (3페이지 강제 분리)

### PDF 출력 3섹션

| 페이지 | 내용 |
|---|---|
| Page 1 | Journey Ladder — CDJ 4단계 × CEP + Cognition 범례 |
| Page 2 | Strategic Heatmap — Context × Cognitive Intent 매트릭스 |
| Page 3 | Similarity Network — 좌: 전략 클러스터 목록 / 우: SVG 원형 네트워크 맵 |

### CEP 카드 · ContextModal

각 CEP 클릭 → ContextModal 3섹션 수직 레이아웃:
- **Section 01**: 컨텍스트 분석 (ContextSelector + CognitionRadialGraph + Fact Reading + 전략적 시사점)
- **Section 02**: AI 트리플 미디어 전략 (Hub & Spoke Closed-Loop 다이어그램 + KPI)
- **Section 03**: AEGIS FORGE Studio (텍스트 콘텐츠 단조, 항상 노출)

### ForgeStudio (C³ 내부)
- 3단계 설정: 미디어 타입(Hub/Earned/Paid) → 서브타입(12종) → 최적화 레이어(SEO/AEO/GEO) → 톤앤매너 → 분량
- 생성 후: 복사 / MD 복사 / 재단조
- **owned_hub 타입**: "Blog Editor에서 편집" 버튼 → `signal_to_blog` → `/admin/blog` 이동

### StrategicBrief
- Hub/Spoke1/Spoke2 미디어 섹션 (MediaSection 컴포넌트, 기본 펼침)
- **"FORGE에서 열기" 버튼**: `veoPrompts + situationSummary` → `forge_context` → `/tools/forge` (Reels 탭 자동 주입)

### 세션 관리
- **자동 저장**: 분석 완료 시 IndexedDB에 자동 기록 (`__auto__` ID)
- **복원 배너**: 재방문 시 7일 내 마지막 세션 복원 제안 (카테고리·브랜드·CEP 수·날짜 표시)
- **프로젝트 저장/불러오기 모달**: 최대 15개 수동 저장, 이름 지정, 불러오기 시 battleInput + contexts 완전 복원
- **Temporal 비교**: Period A vs B 분기 분석, Sankey 다이어그램 + 매칭 신뢰도 배지

### 기간 분석 옵션 (2026-05-10 업데이트)
- **분석 기간 프리셋**: 1주 / 1개월 / 3개월 / 6개월 / 1년 / **2년** (신규)
- **비교 모드 빠른 설정 — "YoY 연간 비교"** (신규):
  - 버튼 클릭 한 번으로 A(2년 전~1년 전) / B(1년 전~오늘) 자동 설정
  - 1년치 시즈널리티를 연도별로 분리해 Sankey 다이어그램으로 비교
  - 계절성 반복 CEP vs 신규 출현 CEP 즉시 식별 가능

### 버그 수정 및 안정화 (2026-05-11)
- **cognitionShift 오판정 수정**: `hybridCognition` 기준으로 통일 — Commercial→Commercial을 "인텐트 전환"으로 잘못 표시하던 버그 수정
- **기간 표시 정확도**: `calcDays` +1 inclusive 수정 (1.1~12.31 → 364일 오류 → 365일)
- **비교 모드 실측 배지**: SERP 파이프라인이 비교 모드에서도 정상 적용

### 실측 API 파이프라인 (2026-05-11 활성화)
- **Naver AD API 키 Vercel 등록 완료** — 키워드 월간 검색량 실측 데이터 활성
- `import.meta.env.VITE_*` 정적 참조로 수정 → 프로덕션 빌드에서 키값 정상 주입
- Naver URL `/v1/` 이중 조합 버그 수정 (`api/naver/[...path].ts`)
- **데이터 수집 병렬화**: Serper 5개씩 병렬, Naver 블로그 전체 병렬 → 수집 30~40초 → **4~6초**

---

## 3. AEGIS Pathfinder `/tools/pathfinder`

**역할**: 고객 구매 여정(CDJ) 상세 분석 + Reels 콘텐츠 기획

**입력**: 검색 토픽, 분석 기간, 데이터 볼륨

### 출력
- CDJ 4단계 여정 맵
- 단계별 키워드 + 검색 의도 분류
- Journey 기반 콘텐츠 전략
- Reels 스토리보드 자동 생성 + 씬 이미지 (Gemini 멀티모달) + Veo 영상
- 광고 이미지 생성 (로고/상품 참조 있음: Gemini 2.5 Flash, 없음: Imagen 3) + 한글 카피 Canvas 합성
- PDF 출력 (html2canvas + jsPDF)

### → 후속 연결
- **"C³에서 전략 수립" 버튼**: Journey Intent → C³ BattleFieldForm 카테고리 자동 입력

---

## 4. AEGIS Signal `/tools/signal`

**역할**: CEP 트렌드·타겟 페르소나·AEO 콘텐츠 분석

**입력**: 키워드 단일/배치, 기간 필터, 데이터 볼륨

### 단일 분석 파이프라인
1. Keyword Level Identification
2. Google SERP 데이터 수집 (Serper proxy)
3. 트렌드 분석 → CEP 추출 + 분류
4. 타겟 페르소나 클러스터 생성
5. AEO 콘텐츠 생성 (블로그/LinkedIn 포맷)
6. AEO 점수 진단 (0~100점)
7. 경쟁 기간 비교 분석

**배치 분석**: 다중 키워드 동시 처리, 진행률 표시

### AEO 콘텐츠 기능
- 생성 → 재작성 → 진단 기반 개선 사이클
- **"Blog Editor에서 편집" 버튼** → `signal_to_blog` → `/admin/blog`
- 섹션별 이미지 생성 (Imagen 3, 16:9)

### → 후속 연결
- **"C³에서 전략 수립" 버튼** (클러스터 완성 시): `currentQuery` → C³ 카테고리 자동 입력

---

## 5. AEGIS Vision `/tools/video`

**역할**: 영상 멀티모달 분석 (OCR + STT + 컨텍스트 + 메타데이터)

**입력**: 동영상 파일 업로드 + 타겟 키워드 + 플랫폼 선택

### 플랫폼별 가중치 시스템

| 플랫폼 | OCR | STT | Context | Metadata |
|---|---|---|---|---|
| YouTube Shorts / Reels / TikTok | 40 | 20 | 25 | 15 |
| YouTube Long-form | 15 | 35 | 20 | 30 |
| Video Ads (15s/30s) | 25 | 15 | 40 | 20 |

### 분석 출력
- 총점(0~100) + 등급(A~F)
- 레이더 차트 (4개 축) + 도넛 차트
- radarSummary + actionItems
- PDF 출력 (`html2pdf.js`)

### → 후속 연결
- **"FORGE Reels로 기획" 버튼** (분석 완료 시): `분석 요약 + actionItems` → `forge_context(source:'vision')` → FORGE Reels 탭 자동 주입, rose 테마 배너

---

## 6. AEGIS FORGE `/tools/forge`

**역할**: AI 크리에이티브 제작 스튜디오

### 탭 1: Reels 크리에이터
- Step 1: 광고 메시지 입력 + 자산 5종 업로드 (브랜드 로고/제품/모델/매장/배경)
- Step 2: AI 스토리보드 3개 생성 → 선택
- Step 3: 씬별 콘티 이미지 생성 (Gemini 2.5 Flash, 9:16)
- Step 4: Veo 영상 생성 (`veo-3.1-fast-generate-preview`) → 다운로드

**진입 배너**
- C³에서 진입: orange 배너 (15s/30s Veo 프롬프트 자동 주입)
- Vision에서 진입: rose 배너 (영상 분석 컨텍스트 표시)

### 탭 2: 광고 이미지
- 광고 메시지 (한글) + 로고/제품 이미지 + 비율(1:1/9:16) + 스타일 + 텍스트 위치/색상
- 배경 생성: 참조 없음 → **Imagen 3**, 참조 있음 → Gemini 2.5 Flash
- **한글 카피**: Canvas API 오버레이 합성 (프리뷰·다운로드 모두 텍스트 포함)

### 탭 3: 블로그 이미지
- 섹션 제목 + 맥락 + 스타일(유형/톤/색상) → **Imagen 3** (16:9)
- 재생성 지원

### 탭 4: AEO 블로그 초안
- 핵심 키워드 + 카테고리 5종 + 컨텍스트
- 구조화 생성: 제목 + 도입부 + H2 섹션 4~6개 + 결론
- **"Blog Editor에서 편집" 버튼** → `signal_to_blog` → `/admin/blog`

---

## 7. Blog Editor `/admin/blog`

**역할**: 전략 콘텐츠 작성·SEO/AEO/GEO 최적화·게시

### 에디터 (Tiptap WYSIWYG)
- 서식: Bold/Italic/Underline/Strike/H1~H3/인용/코드/수평선
- 들여쓰기, 텍스트 정렬, 텍스트 색상
- 테이블 (추가/삭제/편집 툴바)
- 이미지 삽입 (URL 또는 AI 생성)
- 링크 추가/편집

### AI 이미지 생성
- 섹션 제목 기준 블로그 이미지 즉시 생성 (**Imagen 3**, 16:9)
- 스타일 4종(인포그래픽/일러스트/포토/카툰) × 톤 4종 × 색상 5종

### SEO/AEO/GEO 스키마 자동 생성
- Article JSON-LD
- FAQ / HowTo / Quotation / Speakable 스키마
- 복사 버튼

### Signal/FORGE에서 자동 수신 (`signal_to_blog`)
- 제목·본문·태그·발췌 자동 주입
- 수신 배너 → "불러오기" 클릭 시 에디터 채움

### 발행 관리
- 임시저장 / 발행 상태 토글
- 태그, 발췌, 슬러그 설정
- 게시된 글 목록 `/blog`에 자동 반영

---

## 마케팅 페이지

| 경로 | 내용 |
|---|---|
| `/` | 랜딩 홈 |
| `/product` | 솔루션 소개 |
| `/guides` | 가이드 문서 |
| `/compare` | 경쟁 비교 |
| `/blog` | 인사이트 블로그 목록 |
| `/blog/:slug` | 블로그 포스트 상세 |
| `/pricing` | 요금제 |

---

## AI 엔진 현황

| 용도 | 모델 | 비고 |
|---|---|---|
| 전략 분석·전략 수립 (C³, FORGE Text) | `gemini-3-pro-preview` | |
| 경량 요약·분류·시드키워드·VizSummary | `gemini-3-flash-preview` | 2026-05-10 `-preview` 복구 |
| SERP 분류·fetchAndClassifyRawData | `gemini-3-flash-preview` | 2026-05-11 Pro→Flash 교체 (503 감소) |
| 시장 분석 (AESA) | `gemini-3.1-pro-preview` | |
| 스토리보드 이미지·멀티모달 합성 | `gemini-2.5-flash-preview-05-14` | |
| 블로그·섹션·페르소나 이미지 (순수 text→image) | `imagen-3.0-generate-002` | |
| 영상 생성 (Reels) | `veo-3.1-fast-generate-preview` | |

**한글 텍스트**: AI 모델에 렌더링 맡기지 않고 `src/lib/canvasTextOverlay.ts`로 Canvas 합성

---

## sessionStorage 연결 키 일람

| 키 | Write | Read | 데이터 |
|---|---|---|---|
| `aesa_to_c3` | AESA (분석 완료), Signal (클러스터 완성) | C³ App | `{ category, brandName, competitors }` |
| `cdj_to_c3` | Pathfinder (CDJ 완성) | C³ App | `{ category, brandName }` |
| `forge_context` | C³ StrategicBrief, Vision | FORGE App | `{ source, situationSummary, reels15s, shorts30s }` |
| `signal_to_blog` | Signal AeoDisplay, FORGE AEO탭, C³ ForgeStudio | Blog Editor | `{ title, content, tags, excerpt }` |

---

## 기술 인프라

| 영역 | 스택 |
|---|---|
| UI | React 19 + TypeScript + Tailwind CSS |
| 라우팅 | React Router v6 |
| 에디터 | Tiptap |
| 시각화 | D3 / react-force-graph-2d / Chart.js / Recharts |
| AI SDK | `@google/genai ^1.38.0` |
| 외부 API | Serper, Naver 검색·트렌드·광고 |
| 세션 저장 | IndexedDB (`aegis_db`) + localStorage (temporal snapshot) |
| 배포 | Vercel (Vite + Edge Functions) |
| 번들 최적화 | `manualChunks`: vendor-react / vendor-genai / vendor-charts / vendor-d3 / vendor-react-pdf |
| C³ 청크 크기 | 1,607KB → **397KB** (−75%) |

---

*이 문서는 기능 추가·변경 시 업데이트 예정*
