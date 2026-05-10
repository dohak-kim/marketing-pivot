# AEGIS C³ Cube Strategy — Modeling Specification

> 문서 유형: 내부 기술 사양 / 논문 참조용  
> 작성일: 2026-05-11  
> 버전: v2.7 (기준 커밋: `380e4bf`)  
> 관련 프로젝트: Project AEGIS · MAP HACK (marketing-pivot)

---

## 목차

1. [프레임워크 개요](#1-프레임워크-개요)
2. [C³ 벡터 정의](#2-c³-벡터-정의)
3. [데이터 수집 파이프라인](#3-데이터-수집-파이프라인)
4. [CEP 추출 및 클러스터링](#4-cep-추출-및-클러스터링)
5. [Cognition 벡터 해석 모델](#5-cognition-벡터-해석-모델)
6. [Brand SOV 및 경쟁 강도 정규화](#6-brand-sov-및-경쟁-강도-정규화)
7. [Priority Score 산출 공식](#7-priority-score-산출-공식)
8. [5 Strategy Framework 분류 로직](#8-5-strategy-framework-분류-로직)
9. [CDJ Journey Ladder 매핑](#9-cdj-journey-ladder-매핑)
10. [Hub & Spoke Triple Media 전략 구조](#10-hub--spoke-triple-media-전략-구조)
11. [Temporal CEP 매칭 알고리즘](#11-temporal-cep-매칭-알고리즘)
12. [분석 결과 해석 가이드](#12-분석-결과-해석-가이드)
13. [수식 참조 색인](#13-수식-참조-색인)

---

## 1. 프레임워크 개요

### 1.1 C³ Cube Strategy란

C³ Cube Strategy는 검색 시장의 소비자 행동을 **Context(검색 상황) × Conversion(구매 여정) × Cognition(인지 의도)** 세 축의 곱으로 분해하여, 전략적 우선순위와 콘텐츠 실행 계획을 자동 도출하는 마케팅 인텔리전스 모델이다.

```
C³ = Context × Conversion × Cognition
```

각 축은 독립적 차원이 아니라 **상호 작용하는 텐서 공간**을 형성한다. 특정 검색 상황(Context)은 소비자가 구매 여정(Conversion)의 어느 단계에 위치하는지를 시사하며, 동시에 해당 검색의 인지적 목적(Cognition)을 내포한다. 이 세 축의 교차점에서 **CEP(Context Entry Point)** 가 생성된다.

### 1.2 CEP (Context Entry Point)

CEP는 C³ Cube의 최소 분석 단위로, 소비자가 특정 필요 또는 문제 인식 상황에서 검색 엔진에 접속하는 진입 맥락을 구조화한 객체이다.

```typescript
interface CEP {
  situation:        string;        // 소비자 상황 서술
  queryGroup:       string;        // 시맨틱 클러스터명
  cognition:        CognitionKey;  // 4유형 의도 분류
  cognitionVector:  CognitionVector; // 4차원 확률 벡터
  conversionStage:  CDJStage;      // 4단계 여정 위치
  brandPresence:    BrandMention[]; // SERP 내 브랜드 언급
  marketSignal:     MarketSignal;  // 우선순위 및 트렌드
  dataProvenance:   'api' | 'grounding_estimate';
}
```

단일 분석 세션에서 최대 **15개의 CEP**를 추출하며, 각 CEP는 독립적인 전략 실행 단위로 작동한다.

---

## 2. C³ 벡터 정의

### 2.1 Context 축 (C¹)

Context는 소비자가 검색을 발생시키는 **상황적 트리거(Situational Trigger)**이다. 단순 키워드가 아니라, 키워드 배후의 상황적 필요를 자연어로 서술한다.

- **입력**: 카테고리명, 브랜드명, 경쟁사, 검색 데이터
- **출력**: 시맨틱 클러스터별 상황 서술 (한국어)
- **특성**: 동일 키워드도 상황에 따라 다른 CEP로 분리됨

### 2.2 Conversion 축 (C²)

Conversion은 **CDJ(Customer Decision Journey)** 4단계 모델을 기반으로, 소비자가 현재 구매 의사결정 과정의 어느 위치에 있는지를 나타낸다.

| 단계 | 영문 | 소비자 상태 |
|---|---|---|
| 인지 | Awareness | 문제·필요를 막 인식, 정보 탐색 시작 |
| 고려 | Consideration | 해결책 비교·평가 단계 |
| 결정 | Decision | 구매 직전 최종 확인 |
| 사후 관리 | Post-Purchase | 기존 사용자의 심화 탐색·재구매 |

### 2.3 Cognition 축 (C³)

Cognition은 검색 행위 배후의 **인지적 목적(Cognitive Intent)**을 4유형으로 분류한 것이다.

| 유형 | 코드 | 정의 | 전략 가중치 |
|---|---|---|---|
| 정보 탐색 | `informational` | 지식 습득, 개념 이해 | 0.40 |
| 탐색적 | `exploratory` | 옵션 발견, 비교 시작 | 0.60 |
| 상업적 | `commercial` | 구매 비교, 평가 | 0.80 |
| 전환 | `transactional` | 구매·예약·신청 실행 | 1.00 |

가중치는 전환 기여도에 비례하며, Priority Score 산출 시 핵심 승수로 활용된다.

---

## 3. 데이터 수집 파이프라인

### 3.1 이중 경로 아키텍처

AEGIS는 **RAG(Retrieval-Augmented Generation) 모드**와 **Grounding 폴백 모드**의 이중 경로를 운영한다.

```
[입력: 카테고리 + 브랜드 + 경쟁사]
        ↓
  API 키 존재 여부 확인
  ┌─────────────────────────────┐
  │ YES: RAG Mode               │  NO: Grounding Mode
  │  1. 시드 키워드 생성 (LLM)  │    → Gemini Google Search 활용
  │  2. Serper SERP 수집        │    → AI 추정 기반 CEP 생성
  │  3. Naver 검색량/트렌드 수집 │    → dataProvenance='grounding_estimate'
  │  4. LLM 시맨틱 클러스터링   │
  │  dataProvenance='api'       │
  └─────────────────────────────┘
        ↓
  CEP 추출 (최대 15개)
```

### 3.2 실측 데이터 소스

| 소스 | 제공 데이터 | 환경변수 |
|---|---|---|
| Serper.dev | Google SERP Top 10, PAA, Featured Snippet, AI Overview | `VITE_SERPER_API_KEY` |
| Naver 검색 API | 블로그·뉴스 콘텐츠, 검색 결과 | `VITE_NAVER_CLIENT_ID/SECRET` |
| Naver 검색광고 API | 월간 PC·모바일 검색량 범위 | `VITE_NAVER_AD_API_KEY` 등 |
| Naver DataLab | 검색어 트렌드 (0-100 상대지수) | 동일 |

### 3.3 SERP Feature Flags

실측 데이터 수집 시 각 키워드에 대한 **SERP 피처 존재 여부**를 플래그로 기록하여, 이후 AEO/GEO 전략 트리거에 활용한다.

```typescript
interface SerpFeatureFlags {
  hasFeaturedSnippet: boolean; // AEO 트리거
  hasPAA:             boolean; // People Also Ask → AEO 시딩
  hasAIOverview:      boolean; // GEO 트리거
  hasShopping:        boolean; // Transactional 보정
  hasVideoCarousel:   boolean; // 영상 콘텐츠 기회
}
```

---

## 4. CEP 추출 및 클러스터링

### 4.1 시맨틱 클러스터링 (RAG Mode)

실측 SERP 데이터가 존재하는 경우, LLM은 사전 수집된 키워드 팩트를 기반으로 **의미론적 클러스터링(Semantic Clustering)**만 수행한다. 데이터를 생성하는 것이 아니라 **분류(Classification)** 역할에 한정됨으로써 환각(Hallucination)을 최소화한다.

```
[키워드 팩트 데이터]
  keyword, naverVolRange, hasFeaturedSnippet, hasPAA, 
  hasAIOverview, topTitles, trendData
        ↓
  LLM 역할: 시맨틱 클러스터링 전용
  1. queryGroup: 의미론적 클러스터 명칭
  2. situation: 구체적 소비자 상황 서술
  3. cognition: 4유형 분류
  4. conversionStage: CDJ 단계 매핑
  5. actions: 권장 마케팅 액션 3-4개
```

### 4.2 CEP 목표 수량 산출

추출 목표 CEP 수량은 검색 깊이(Retrieval Density) 설정으로 결정된다:

```
targetCount = min(15, max(3, (googleDepth + naverDepth) × 1.2))
```

- 최소 보장: 3개 (데이터 밀도와 무관)
- 최대 상한: 15개 (분석 정밀도 기준)
- 단계별 쿼리 용량: Google 약 5,000 queries/level, Naver 약 4,000 queries/level

---

## 5. Cognition 벡터 해석 모델

### 5.1 멀티시그널 Cognition 결정 로직

단일 LLM 판단이 아닌 **5개 신호의 가산(Additive) 모델**로 최종 인지 유형을 결정한다.

```
scores = {informational: 0, exploratory: 0, commercial: 0, transactional: 0}

[Signal 1] Gemini 기본 분류         → 기저값 +2.0 (dominant key)
[Signal 2] 구매 키워드 감지          → transactional  +3.0
           (구매/가격/주문/예약/결제/신청)
[Signal 3] 비교 키워드 감지          → commercial     +2.0
           (비교/추천/리뷰/후기/vs/순위)
[Signal 4] 정보 키워드 감지          → exploratory    +1.5
           (종류/방법/가이드/정리/개념)
[Signal 5a] SERP Shopping 피처       → transactional  +2.0
[Signal 5b] SERP 광고 피처           → commercial     +1.5
                                       transactional  +1.0
[Signal 6] 자사 브랜드명 포함        → exploratory    +1.0
                                       transactional  +1.0
[Signal 7] 경쟁사명 포함             → commercial     +2.0
                                       (상업적 비교 의도 강시그널)

최종 판정: argmax(scores)
```

### 5.2 Hybrid Cognition

LLM 1차 분류(`cognition`)와 멀티시그널 보정(`hybridCognition`)이 불일치할 경우, **hybridCognition이 우선** 적용된다. 이는 SERP 실측 데이터가 LLM 추정보다 신뢰도가 높다는 전제에 기반한다.

```typescript
// 우선순위: hybridCognition > cognition (LLM raw)
const effectiveCognition = cep.hybridCognition || cep.cognition;
```

### 5.3 CognitionVector 4차원 구조

각 CEP는 단일 레이블이 아닌 4차원 확률 벡터로 표현된다:

```
CognitionVector = {
  informational: v₁,   // 0 ≤ v₁ ≤ 1
  exploratory:   v₂,   // 0 ≤ v₂ ≤ 1
  commercial:    v₃,   // 0 ≤ v₃ ≤ 1
  transactional: v₄    // 0 ≤ v₄ ≤ 1
}
```

벡터의 dominant 성분이 해당 CEP의 주된 인지 유형으로 분류되며, 나머지 성분은 **혼합 의도(Blended Intent)** 의 강도를 나타낸다.

---

## 6. Brand SOV 및 경쟁 강도 정규화

### 6.1 기본 Share of Voice 계산

SERP 상위 결과에서 추출한 브랜드 언급 수를 기반으로 자사·경쟁사 점유율을 산출한다.

```
brandShare      = myCount / totalMentions               … (1)
competitorShare = competitorTotalCount / totalMentions  … (2)
totalMentions   = Σ(all brand mentions) ≥ 1             … (3)
```

### 6.2 경쟁사 수 정규화 (공정 비교)

단순 brandShare는 경쟁사 수가 다를 때 불공정한 비교를 야기한다.

**문제 사례**:
- 시나리오 A: 경쟁사 1명. 자사 43%, 경쟁사 57%
- 시나리오 B: 경쟁사 5명. 자사 23%, 각 경쟁사 15%

단순 비교 시 시나리오 B가 더 열세로 보이나, 실질 경쟁력은 동등하다.

**정규화 공식**:

```
expectedEqualShare = 1 / (n + 1)                        … (4)
  (n = 경쟁사 수; 자사 포함 전체 브랜드가 동등 분배 시 각자의 기대 점유율)

relativeStrength = brandShare / expectedEqualShare       … (5)

normalizedStrength = min(1, max(0, relativeStrength / 2)) … (6)
  (relativeStrength ≥ 2.0 → 완전 지배, cap = 1.0)

ownershipGap = 1 − normalizedStrength                   … (7)
  (0 = 완전 지배, 1 = 완전 부재; 전략 분류 및 Priority Score에 사용)
```

### 6.3 경쟁 압력 정규화

개별 경쟁사 평균 점유율에 경쟁사 수의 제곱근을 승수로 적용한다. 이는 **분산된 다수 경쟁보다 집중된 소수 경쟁이 더 위협적**이라는 현실을 반영한다.

```
avgCompShare = competitorShare / n                       … (8)

normalizedCompetitivePressure = avgCompShare × √(max(1, n)) … (9)
```

**검증 사례**:
- 경쟁사 1명, 점유율 20%: 압력 = 20% × √1 = **20%**
- 경쟁사 5명, 각 4%:     압력 = 4% × √5 ≈ **8.9%** (분산 경쟁은 실질 위협 낮음)

---

## 7. Priority Score 산출 공식

### 7.1 핵심 공식

Priority Score는 각 CEP의 **전략적 즉시 실행 가치**를 0-100 척도로 수치화한 지표이다.

```
rawPriority = cognitionWeight × ownershipGap × (1 + normalizedCompetitivePressure)  … (10)

finalPriority = min(100, max(10, round(rawPriority × 50)))                          … (11)
```

- **하한(10)**: 어떤 CEP도 최소한의 전략적 가치를 보유
- **상한(100)**: 스케일 표준화
- **×50 승수**: rawPriority의 이론적 최대값 약 2.0을 100점 만점으로 변환

### 7.2 입력 변수 요약

| 변수 | 범위 | 역할 | 수식 참조 |
|---|---|---|---|
| `cognitionWeight` | 0.4 – 1.0 | 전환 기여 가중치 | §5 |
| `ownershipGap` | 0 – 1 | 브랜드 공략 여지 | (7) |
| `normalizedCompetitivePressure` | 0 – 1+ | 경쟁 압력 보정 | (9) |

### 7.3 Priority Score 해석

| 점수 구간 | 전략적 의미 |
|---|---|
| 70 – 100 | **즉시 실행** — 높은 전환 의도 + 브랜드 공략 여지 + 경쟁 압력 공존 |
| 40 – 69  | **단기 계획** — 양호한 기회, 자원 배분 후 실행 |
| 10 – 39  | **모니터링** — 낮은 전환 의도 또는 이미 지배적 위치 |

---

## 8. 5 Strategy Framework 분류 로직

### 8.1 분류 알고리즘

Priority Score와 독립적으로, **규칙 기반 결정 트리(Rule-Based Decision Tree)**로 전략 유형을 분류한다.

```
Input: cognitionWeight (W), ownershipGap (G), competitiveHeat (H)

where:
  H = competitiveHeat = avgCompShare × √(max(1, n))     … (12)

Decision Tree:
  IF W ≥ 0.7 AND G < 0.4   → Defensive Hold
  IF W ≥ 0.7 AND G ≥ 0.6   → Offensive Expansion
  IF W ≤ 0.6 AND H ≤ 0.15 AND G ≥ 0.5  → Niche Capture
  IF W < 0.7 AND G ≥ 0.6   → Brand Build
  ELSE                       → Monitor
```

### 8.2 전략 유형 정의

| 전략 | 조건 | 시장 상황 | 핵심 방향 |
|---|---|---|---|
| **Offensive Expansion** | W≥0.7, G≥0.6 | 고전환 의도 + 브랜드 공백 | 전환 키워드 선점, 경쟁사 비교 콘텐츠 |
| **Defensive Hold** | W≥0.7, G<0.4 | 고전환 의도 + 이미 지배적 | AI 검색 권위 수성, 리뷰 신뢰도 강화 |
| **Niche Capture** | W≤0.6, H≤0.15, G≥0.5 | 블루오션 저경쟁 카테고리 | 카테고리 최초 정의, 선점 콘텐츠 발행 |
| **Brand Build** | W<0.7, G≥0.6 | 브랜드 인지 부재 | GEO 엔티티 구축, Thought Leadership |
| **Monitor** | 상기 외 | 모호한 기회 | 최소 대응 유지, 변화 감지 |

### 8.3 Niche Capture 이중 모드

Niche Capture 전략은 Priority Score 및 트렌드 방향에 따라 **선점 모드**와 **검증 모드**로 분기된다:

```
IF priorityScore ≥ 60 OR trendDirection == 'UP':
  → 선점 모드: 공격적 콘텐츠 선점 + 광고 동시 집행
ELSE:
  → 검증 모드: 최소 테스트 → 반응 확인 후 확대 결정
```

---

## 9. CDJ Journey Ladder 매핑

### 9.1 4단계 구조

CDJ(Customer Decision Journey) Ladder는 소비자 의사결정 과정을 4개의 수직 단계로 시각화한다.

```
[POST-PURCHASE] ← 재구매·심화 탐색
      ↑
  [DECISION]    ← 구매 직전 확인
      ↑
[CONSIDERATION] ← 비교·평가
      ↑
  [AWARENESS]   ← 문제 인식·최초 탐색
```

### 9.2 Cognition × CDJ 상관 관계

| CDJ 단계 | 주도적 Cognition | 2차 Cognition |
|---|---|---|
| Awareness | Informational | Exploratory |
| Consideration | Exploratory | Commercial |
| Decision | Commercial | Transactional |
| Post-Purchase | Informational | Exploratory |

단, 이는 통계적 경향이며, 개별 CEP는 실측 데이터 기반으로 독립적으로 분류된다.

### 9.3 VizSummary AI 해석

Journey Ladder의 단계별 CEP 분포를 AI가 자동 해석하여 마케팅 액션으로 변환한다:

- **Awareness 과다**: 인지 단계에 묶인 수요 → 고려 단계로 유도하는 비교 콘텐츠 필요
- **Decision 부재**: 구매 직전 소비자가 없음 → Transactional 키워드 공략 필요
- **Post-Purchase 강세**: 기존 고객 참여도 높음 → 충성도 프로그램 및 업셀링 기회

---

## 10. Hub & Spoke Triple Media 전략 구조

### 10.1 3-Tier 아키텍처

```
           ┌─────────────────────────────────┐
           │        Owned Hub (Primary)       │
           │  SEO + AEO (JSON-LD) + GEO       │
           └──────────────┬──────────────────┘
                          │ ← 트래픽 집중
           ┌──────────────┴──────────────────┐
Spoke1    │          Earned Media            │  Spoke2
(Earned)  │  GEO Co-occurrence + AEO PAA     │  (Paid)
→ Hub     │  시딩 → Hub 신뢰도 증폭          │  → Hub
           └──────────────┬──────────────────┘
                          │
                   Paid Media
              SEM SEO 공백 보완
```

**핵심 원칙**: Hub는 Single Source of Truth. Spoke는 Hub로의 트래픽 구동자.

화살표 방향: `Earned → Hub ← Paid` (Closed-Loop)

### 10.2 SEO × AEO × GEO 레이어 분기

| 미디어 유형 | SEO | AEO | GEO |
|---|---|---|---|
| Owned Hub Primary | ✅ | ✅ (JSON-LD 포함) | ✅ |
| Owned Hub Derived | ✅ (내부링크) | ✗ | ✗ |
| Earned press_release | ✗ | ✗ | ✅ (Co-occurrence) |
| Earned community_post | ✗ | ✅ (PAA 시딩) | ✗ |
| Paid landing_copy | ✗ | ✅ (직접답변+FAQ) | ✗ |
| Paid search_ad | ✅ (품질점수) | ✗ | ✗ |

- **SEO**: 검색엔진 노출 최적화 (H1~H3 구조, E-E-A-T)
- **AEO**: Answer Engine Optimization (Featured Snippet, PAA, 구조화 데이터)
- **GEO**: Generative Engine Optimization (ChatGPT·Perplexity·Gemini 인용 최적화)

---

## 11. Temporal CEP 매칭 알고리즘

### 11.1 목적

두 시점(Period A, Period B)의 CEP 집합을 비교하여, 각 CEP가 **유지(matched)** / **신규 출현(emerging)** / **소멸(disappeared)** 중 어느 상태인지 분류한다.

### 11.2 Multi-Signal 매칭 스코어

단순 텍스트 유사도만 사용하면 LLM이 동일 개념을 매 실행마다 다르게 표현하는 **AI 패러프레이즈 문제**가 발생한다. AEGIS는 5개 신호를 결합한 Multi-Signal 스코어를 사용한다.

```
score(CEP_A, CEP_B) = textSim × w_t + kwSim × w_k
                    + cognitionBonus + stageBonus + priorityBonus  … (13)
```

#### 신호별 계산

**① Text Similarity (Jaccard)**

```
tokenize(text) → 형태소 어미 제거 후 토큰 집합
(예: "남성스킨케어의" → "남성스킨케어")

textSim = |tokens_A ∩ tokens_B| / |tokens_A ∪ tokens_B|           … (14)

입력 텍스트: clusterName + queryGroup + situation + description[:120]
```

**② Keyword Jaccard**

```
kwSim = |KW_A ∩ KW_B| / |KW_A ∪ KW_B|                           … (15)
  (각 CEP의 metadata.keywords 집합 기반)
```

**③ Cognition Alignment Bonus**

```
cognitionBonus = 0.12   if effectiveCognition(A) == effectiveCognition(B)
               = 0       otherwise                                  … (16)

effectiveCognition(cep) = cep.hybridCognition || cep.cognition
```

**④ CDJ Stage Bonus**

```
stageBonus = 0.08   if conversionStage(A) == conversionStage(B)
           = 0       otherwise                                      … (17)
```

**⑤ Priority Proximity Bonus**

```
priorityBonus = 0.06   if |priorityScore(A) − priorityScore(B)| ≤ 25
              = 0       otherwise                                   … (18)
```

#### 가중치 구성

| 신호 | 가중치/값 | 비고 |
|---|---|---|
| textSim × w_t | 0 – 0.50 | w_t = 0.50 (기본) |
| kwSim × w_k | 0 – 0.15 | w_k = 0.15 (키워드 없을 시 0) |
| cognitionBonus | 0 or 0.12 | 이진 |
| stageBonus | 0 or 0.08 | 이진 |
| priorityBonus | 0 or 0.06 | 이진 |
| **최대값** | **≈ 0.91** | 텍스트 완전 일치 + 모든 보너스 |

### 11.3 매칭 임계값 및 Greedy 선택

```
MATCH_THRESHOLD = 0.12

매칭 절차:
1. 모든 (CEP_A, CEP_B) 조합에 대해 score 계산
2. score ≥ 0.12인 쌍을 후보로 수집
3. score 내림차순 정렬 (Best-First)
4. Greedy: 이미 사용된 CEP_A 또는 CEP_B 제외 후 순서대로 매칭 확정
5. CEP_A 미매칭 → disappeared
   CEP_B 미매칭 → emerging
```

### 11.4 변화 유형 분류

매칭된 CEP 쌍에 대해 Priority Score 변화율로 성장/유지/쇠퇴를 판정한다:

```
scoreChange    = priorityScore_B − priorityScore_A               … (19)
scoreChangePct = (scoreChange / priorityScore_A) × 100           … (20)

changeType = 'growing'   if scoreChangePct > +12%
           = 'declining'  if scoreChangePct < −12%
           = 'stable'     otherwise                              … (21)
```

**±12% 임계값**: 소규모 fluctuation(AI 생성 특성상 ±5-10% 노이즈)을 제외하고 실질적 시장 변화만 감지하기 위한 dead-band 설정.

### 11.5 Intent Transition 감지

```
cognitionShift = (effectiveCognition(A) ≠ effectiveCognition(B))  … (22)
```

동일 검색 상황(CEP)의 지배적 의도 유형이 기간 사이에 변화한 경우 ⟳ 표시. 예) Commercial → Transactional 전환은 해당 카테고리에서 구매 결정이 가속화됨을 시사한다.

---

## 12. 분석 결과 해석 가이드

### 12.1 Priority Score 분포 해석

| 분석 패턴 | 시장 해석 | 권장 대응 |
|---|---|---|
| 고점수(70+) CEP 집중 | 명확한 전략적 우선순위 존재 | 즉시 실행 집중 |
| 전반적 중간대(40-69) | 경쟁 균형 상태 | 차별화 포인트 발굴 |
| 전반적 저점수(10-39) | 브랜드 지배적 또는 시장 미성숙 | 방어 또는 시장 개척 |

### 12.2 Temporal Comparison 해석

| 변화 패턴 | 해석 | 전략 시사점 |
|---|---|---|
| Growing + Intent Shift(→ Commercial/Transactional) | 구매 의사결정 가속화 | 즉시 전환 최적화 콘텐츠 투입 |
| Declining + 경쟁사 Emerging | 경쟁사 영역 침식 | 방어 콘텐츠 및 광고 긴급 투입 |
| Emerging (신규 CEP) | 새로운 시장 수요 발생 | 선점 기회 여부 검토 |
| Disappeared (소멸) | 계절성 또는 수요 소멸 | 해당 콘텐츠 보존 or 폐기 검토 |

### 12.3 Brand SOV 해석

```
ownershipGap 해석:
  0.0 – 0.2: 강한 시장 지배 → Defensive Hold 유력
  0.2 – 0.5: 경쟁 균형 → Priority Score로 세부 판단
  0.5 – 0.8: 브랜드 공백 → 공략 가능 영역
  0.8 – 1.0: 브랜드 부재 → Brand Build 또는 신시장 개척
```

### 12.4 데이터 출처별 신뢰도

| 배지 | dataProvenance | 신뢰도 수준 |
|---|---|---|
| ✅ 실측 API (emerald) | `'api'` | 높음 — Serper/Naver 실측 데이터 기반 |
| 🟡 AI 추정값 (amber) | `'grounding_estimate'` | 중간 — Gemini Google Search Grounding 기반 추정 |

AI 추정값 결과는 방향성 참고로 활용하되, 실제 의사결정에는 API 실측 데이터 활성화 후 재분석을 권장한다.

---

## 13. 수식 참조 색인

| 수식 번호 | 내용 | 적용 섹션 |
|---|---|---|
| (1) | brandShare = myCount / totalMentions | §6.1 |
| (2) | competitorShare = competitorTotal / totalMentions | §6.1 |
| (3) | totalMentions = Σ(all brand mentions) ≥ 1 | §6.1 |
| (4) | expectedEqualShare = 1 / (n+1) | §6.2 |
| (5) | relativeStrength = brandShare / expectedEqualShare | §6.2 |
| (6) | normalizedStrength = min(1, max(0, relativeStrength/2)) | §6.2 |
| (7) | ownershipGap = 1 − normalizedStrength | §6.2 |
| (8) | avgCompShare = competitorShare / n | §6.3 |
| (9) | normalizedCompetitivePressure = avgCompShare × √(max(1,n)) | §6.3 |
| (10) | rawPriority = W × ownershipGap × (1 + NCP) | §7.1 |
| (11) | finalPriority = min(100, max(10, round(rawPriority × 50))) | §7.1 |
| (12) | competitiveHeat = avgCompShare × √(max(1,n)) | §8.1 |
| (13) | score = textSim×w_t + kwSim×w_k + bonuses | §11.2 |
| (14) | textSim = \|A∩B\| / \|A∪B\| (Jaccard on tokens) | §11.2 |
| (15) | kwSim = \|KW_A∩KW_B\| / \|KW_A∪KW_B\| | §11.2 |
| (16) | cognitionBonus = 0.12 if same cognition else 0 | §11.2 |
| (17) | stageBonus = 0.08 if same CDJ stage else 0 | §11.2 |
| (18) | priorityBonus = 0.06 if \|pA−pB\| ≤ 25 else 0 | §11.2 |
| (19) | scoreChange = pB − pA | §11.4 |
| (20) | scoreChangePct = scoreChange / pA × 100 | §11.4 |
| (21) | changeType: growing/stable/declining (±12% threshold) | §11.4 |
| (22) | cognitionShift = effectiveCognition(A) ≠ effectiveCognition(B) | §11.5 |

---

## 부록 A. 주요 파라미터 요약표

| 파라미터 | 값 | 근거 |
|---|---|---|
| CEP 최대 추출 수 | 15개 | 분석 정밀도 vs. 처리 비용 균형 |
| Cognition 가중치 (inf/exp/comm/trans) | 0.4 / 0.6 / 0.8 / 1.0 | 전환 기여 비례 선형 스케일 |
| Priority Score 스케일 승수 | ×50 | rawPriority 이론 최대값 2.0 → 100점 변환 |
| Priority Score 하한 | 10 | 최소 전략 가치 보장 |
| changeType ±임계값 | 12% | AI 생성 노이즈(±5-10%) 제거용 dead-band |
| CEP 매칭 임계값 | 0.12 | (구) 0.25 → 패러프레이즈 오류 방지용 완화 |
| textSim 가중치 (w_t) | 0.50 | 다중 필드 형태소 텍스트 우선 |
| kwSim 가중치 (w_k) | 0.15 | 키워드 존재 시에만 적용 |
| cognitionBonus | 0.12 | 의도 일치 → 동일 시장 현상 고확률 |
| stageBonus | 0.08 | CDJ 단계 일치 → 동일 여정 위치 |
| priorityBonus | 0.06 | 시장 규모 유사 → 동일 클러스터 |
| Priority 근접 임계값 | ±25점 | 유사 시장 규모 판정 기준 |

---

## 부록 B. 용어 정의

| 용어 | 정의 |
|---|---|
| CEP (Context Entry Point) | C³ 분석의 최소 단위. 소비자 검색 진입 맥락 객체 |
| SOV (Share of Voice) | 특정 키워드/상황에서 전체 브랜드 언급 중 자사 비중 |
| ownershipGap | 경쟁사 수 정규화 후 자사 브랜드 공략 여지 (0=지배, 1=부재) |
| NCP (Normalized Competitive Pressure) | 분산 경쟁을 보정한 실질 경쟁 압력 지수 |
| hybridCognition | Gemini 1차 분류 + 멀티시그널 보정을 결합한 최종 의도 분류 |
| dataProvenance | 분석 데이터의 출처 및 신뢰도 등급 ('api' / 'grounding_estimate') |
| Hub & Spoke | Owned Media를 Hub로, Earned/Paid를 Spoke로 구성하는 Triple Media 구조 |
| AEO (Answer Engine Optimization) | Featured Snippet·PAA 등 질의응답 엔진 최적화 |
| GEO (Generative Engine Optimization) | ChatGPT·Gemini 등 생성형 AI 검색 인용 최적화 |
| Temporal CEP Matching | 두 기간의 CEP를 Multi-Signal 스코어로 동일성 판정하는 알고리즘 |
| changeType | Priority Score 변화율 기반 성장/유지/쇠퇴 분류 (±12% dead-band) |
| cognitionShift | 동일 CEP의 기간 사이 지배적 의도 유형 변화 여부 |

---

*본 문서는 AEGIS v2.7 소스 코드(기준 커밋 `380e4bf`)를 직접 분석하여 작성한 기술 명세서입니다.*  
*논문 인용 시 구현 코드와의 일치 여부를 기준 커밋 기반으로 재확인하시기 바랍니다.*
