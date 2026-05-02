# Marketing Pivot · Project AEGIS
## UX/UI & 워크플로우 개선 로드맵

> 작성일: 2026-05-03  
> 기준 커밋: `9f24015` (main)

---

## 1. 프로젝트 구성 현황

### 앱 목록

| 앱 | 경로 | 역할 | 상태 |
|---|---|---|---|
| AESA Radar | `/tools/aesa` | 시장·경쟁 분석 (PEST·3C·SWOT·STP) | ✅ 안정 |
| C³ Cube Strategy | `/tools/c3` | 전략 수립 핵심 — Context·ExecutionPlan 생성 | ✅ 안정 |
| Pathfinder | `/tools/pathfinder` | 고객 구매여정(CDJ) 분석 | ✅ 안정 |
| Signal | `/tools/signal` | 키워드·CEP 분석 + AEO 콘텐츠 생성 | ✅ 안정 |
| Vision | `/tools/video` | 영상 멀티모달 분석 | ✅ 안정 |
| **FORGE** | `/tools/forge` | AI 크리에이티브 제작 (Reels·광고·블로그) | ⚠️ 전략 연결 미구현 |
| Blog Editor | `/admin/blog` | 콘텐츠 작성·게시 | ✅ 안정 |

---

## 2. 설계 의도 vs 현재 상태

### 목표 전략 흐름

```
AESA Radar ──────────────────────────────┐
(시장·경쟁 분석)                          │
                                          ▼
Pathfinder ──→  C³ Cube Strategy  ──→  FORGE  ──→  Blog Editor
(CDJ 분석)      (전략 수립·실행계획)    (콘텐츠)      (게시)
Signal ──────────────────────────────────┘
(CEP·키워드)
```

### 현재 문제

각 앱이 **독립적으로만 작동** — 전략 데이터가 앱 간에 흐르지 않음.

| 연결 구간 | 현황 |
|---|---|
| C³ ExecutionPlan → FORGE | ❌ veoPrompts 생성되지만 전달 안 됨 |
| Signal AEO 콘텐츠 → Blog Editor | ❌ 복사·붙여넣기만 가능 |
| Pathfinder CDJ → C³ 전략 | ❌ 별도 앱으로만 존재 |
| AESA 분석 결과 → C³ 초기값 | ❌ 수동 재입력 필요 |
| C³ ForgeStudio ↔ 독립 FORGE | ⚠️ 중복 구현 |

---

## 3. 순차적 개선 로드맵

---

### 🔴 P0 — 즉시 (핵심 연결)

#### ① C³ ExecutionPlan → FORGE Reels 연동
**임팩트**: 높음 · **공수**: 낮음

- `StrategicBrief`의 `veoPrompts` Copy 버튼 옆에 **"FORGE에서 열기"** 버튼 추가
- URL 파라미터(`?veo15s=...&veo30s=...&context=...`)로 FORGE Reels 탭에 데이터 전달
- FORGE Reels 탭에서 URL 파라미터 감지 시 자동 주입

**관련 파일**
```
src/apps/aegis/components/StrategicBrief.tsx  ← "FORGE에서 열기" 버튼
src/apps/forge/App.tsx                         ← URL 파라미터 수신·주입
```

---

#### ② FORGE 레이아웃에 "전략 컨텍스트 배너" 추가
**임팩트**: 중 · **공수**: 낮음

- C³에서 진입 시 상단에 전략 요약(`situationSummary`) 배너 표시
- 직접 진입 시 빈 상태(현재와 동일)

---

### 🟠 P1 — 단기 (UX 완성도)

#### ③ Signal AEO 콘텐츠 → Blog Editor 연결
**임팩트**: 높음 · **공수**: 중

- Signal 콘텐츠 완성 후 **"Blog Editor에서 편집"** 버튼
- 생성된 콘텐츠를 `localStorage` 임시 저장 → Blog Editor에서 불러오기

**관련 파일**
```
src/apps/cep/                ← "Blog Editor에서 편집" CTA
src/apps/blog-editor/App.tsx ← localStorage 불러오기 처리
```

---

#### ④ FORGE — AEO 블로그 초안 탭 추가
**임팩트**: 높음 · **공수**: 중

현재 3탭(Reels / 광고이미지 / 블로그이미지)에 **AEO 블로그 초안** 탭 추가:
- Signal/C³ 데이터 기반 완성형 블로그 본문 생성
- SEO·AEO·GEO 레이어 자동 적용
- Blog Editor로 바로 내보내기

---

#### ⑤ Pathfinder(CDJ) → C³ 인사이트 전달
**임팩트**: 중 · **공수**: 중

- CDJ 분석 완료 후 **"C³에서 전략 수립"** CTA
- Journey Intent 데이터를 C³ 배틀필드 초기값으로 전달

---

### 🟡 P2 — 중기 (통합 & 정리)

#### ⑥ C³ ForgeStudio ↔ 독립 FORGE 통합
**임팩트**: 중 · **공수**: 높음

- C³ 내부 `ForgeStudio` 컴포넌트를 독립 FORGE 앱으로 리디렉션 또는 통합
- 중복 AI 호출 로직 제거

**관련 파일**
```
src/apps/aegis/components/ForgeStudio.tsx
src/apps/forge/App.tsx
src/apps/aegis/ai/forge.ts
```

---

#### ⑦ 앱 네비게이션 — "전략 흐름" 가이드 표시
**임팩트**: 중 · **공수**: 낮음

- 현재: 6개 메뉴 독립 나열
- 개선: 상단 서브헤더에 단계 표시
  ```
  [1 AESA] → [2 C³] → [3 Pathfinder/Signal] → [4 FORGE] → [5 Blog]
  ```
- 현재 활성 단계 하이라이트

---

#### ⑧ AESA 분석 결과 → C³ 초기값 주입
**임팩트**: 중 · **공수**: 중

- AESA STP/SWOT 완성 후 **"C³에서 전략 수립"** 버튼
- 경쟁사 목록, 카테고리, 핵심 키워드 → C³ 배틀필드 설정 자동 입력

---

### 🟢 P3 — 장기 (성숙 단계)

#### ⑨ 전략 세션 저장·불러오기 (프로젝트 관리)
- 현재: 세션 종료 시 데이터 소실
- localStorage → IndexedDB 기반 프로젝트 단위 저장
- 앱 간 공유 가능한 프로젝트 스냅샷

#### ⑩ 번들 크기 최적화
- 현재 최대 청크: **1.6MB (gzip 533KB)**
- 앱별 `dynamic import()` code-splitting 적용
- 예상 효과: 초기 로딩 50% 단축

#### ⑪ Vision → FORGE Reels 파이프라인
- 영상 분석 결과에서 **"개선된 Reels 기획"** 버튼
- 현재 Vision은 분석만 하고 콘텐츠 생성으로 이어지지 않음

---

## 4. 최근 완료된 수정 이력

| 날짜 | 커밋 | 내용 |
|---|---|---|
| 2026-05-03 | `9f24015` | `.gitignore` — `.claude/settings.local.json` 추가 |
| 2026-05-03 | `64a9656` | Vision: `gemini-2.0-flash` → `gemini-3-flash-preview` |
| 2026-05-03 | `78d486a` | AESA: PDF 한국어 폰트 URL 수정, 인쇄 레이아웃 개선 |
| 2026-05-03 | `cacaed4` | AEGIS: FORGE Veo 프롬프트 생성 + 중복 디렉토리 100개 제거 |
| 2026-05-02 | `a78c91e` | Blog Editor: AI 이미지 생성 (Signal → 공유 imageService) |
| 2026-05-02 | `45ed0ce` | AEO/GEO 스키마 완성 (HowTo, Quotation, Speakable 등) |

---

## 5. 기술 스택 참고

| 영역 | 스택 |
|---|---|
| UI | React 19 + TypeScript + Tailwind CSS |
| 라우팅 | React Router v6 |
| 에디터 | Tiptap (WYSIWYG) |
| 시각화 | Chart.js, D3 (force-graph), Recharts |
| AI | `@google/genai ^1.38.0` (gemini-3-pro/flash-preview) |
| 외부 API | Serper (Google SERP), Naver 검색/트렌드 |
| 배포 | Vercel (Vite + API Functions) |
| 빌드 | API Key는 빌드 타임 embed (`vite.config.ts define`) |

---

*이 문서는 개선 작업 진행에 따라 업데이트 예정*
