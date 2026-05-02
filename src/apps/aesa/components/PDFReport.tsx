import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';
import { AnalysisResult, MarketingReport } from '../types';

// ─── 폰트 등록 — Pretendard (jsDelivr CDN, 버전 고정, TTF) ───────
// Google Fonts v27 URL은 deprecated → Pretendard로 교체
// https://github.com/orioncactus/pretendard
const FONT_BASE = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/static/alternative/TrueType';

Font.register({
  family: 'NotoSansKR',
  fonts: [
    { src: `${FONT_BASE}/Pretendard-Regular.ttf`,   fontWeight: 400 },
    { src: `${FONT_BASE}/Pretendard-Medium.ttf`,    fontWeight: 500 },
    { src: `${FONT_BASE}/Pretendard-SemiBold.ttf`,  fontWeight: 600 },
    { src: `${FONT_BASE}/Pretendard-Bold.ttf`,      fontWeight: 700 },
    { src: `${FONT_BASE}/Pretendard-ExtraBold.ttf`, fontWeight: 800 },
  ],
});

Font.registerHyphenationCallback(word => [word]);

// ─── 공통 색상 ────────────────────────────────────────────────────
const C = {
  navy: '#002d72',
  blue: '#0047bb',
  lightBlue: '#E6F1FB',
  green: '#27500A',
  lightGreen: '#EAF3DE',
  amber: '#633806',
  lightAmber: '#FAEEDA',
  red: '#A32D2D',
  slate900: '#0f172a',
  slate700: '#334155',
  slate500: '#64748b',
  slate300: '#cbd5e1',
  slate100: '#f1f5f9',
  slate50: '#f8fafc',
  white: '#ffffff',
  borderGray: '#e2e8f0',
};

// ─── 스타일 정의 ──────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    fontFamily: 'NotoSansKR',
    backgroundColor: C.white,
    padding: 0,
  },
  // 커버
  coverPage: {
    fontFamily: 'NotoSansKR',
    backgroundColor: C.navy,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverInner: {
    padding: 60,
    width: '100%',
  },
  coverTag: {
    fontSize: 9,
    color: '#93c5fd',
    letterSpacing: 3,
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  coverTitle: {
    fontSize: 32,
    fontWeight: 700,
    color: C.white,
    marginBottom: 12,
    lineHeight: 1.3,
  },
  coverSubtitle: {
    fontSize: 14,
    color: '#93c5fd',
    marginBottom: 40,
  },
  coverDivider: {
    width: 60,
    height: 3,
    backgroundColor: '#3b82f6',
    marginBottom: 40,
  },
  coverMeta: {
    fontSize: 10,
    color: '#64748b',
  },
  // 공통 페이지 레이아웃
  pageHeader: {
    backgroundColor: C.navy,
    padding: '14 40',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTag: {
    fontSize: 7,
    fontWeight: 700,
    color: C.white,
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: C.white,
  },
  pageNum: {
    fontSize: 8,
    color: '#93c5fd',
  },
  // 헤드메시지
  headMsg: {
    backgroundColor: C.lightBlue,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    padding: '10 16',
    margin: '10 40',
    borderRadius: 4,
  },
  headMsgText: {
    fontSize: 10,
    fontWeight: 700,
    color: C.navy,
    lineHeight: 1.6,
  },
  // 본문 영역
  body: {
    padding: '8 40 20 40',
    flexDirection: 'row',
    gap: 16,
    flex: 1,
  },
  bodyLeft: {
    flex: 7,
  },
  bodyRight: {
    flex: 5,
    backgroundColor: C.slate50,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: C.borderGray,
  },
  colLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: C.slate500,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.borderGray,
  },
  // 불릿 아이템
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 7,
    gap: 6,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3b82f6',
    marginTop: 4,
    flexShrink: 0,
  },
  bulletText: {
    fontSize: 9,
    color: C.slate700,
    lineHeight: 1.6,
    flex: 1,
  },
  // RTB 박스
  rtbBox: {
    backgroundColor: C.white,
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: C.borderGray,
    marginTop: 8,
  },
  rtbTag: {
    fontSize: 7,
    fontWeight: 700,
    color: '#1d4ed8',
    marginBottom: 4,
    letterSpacing: 1,
  },
  rtbText: {
    fontSize: 8,
    color: C.slate700,
    lineHeight: 1.5,
  },
  rtbSource: {
    fontSize: 7,
    color: C.slate500,
    marginTop: 3,
    fontStyle: 'italic',
  },
  // PEST 그리드
  pestGrid: {
    flexDirection: 'row',
    gap: 8,
    padding: '8 40',
    flex: 1,
  },
  pestCol: {
    flex: 1,
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: C.borderGray,
  },
  pestColTitle: {
    fontSize: 8,
    fontWeight: 700,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.borderGray,
  },
  // SWOT 그리드
  swotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: '8 40',
  },
  swotCell: {
    width: '48%',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    minHeight: 100,
  },
  swotLabel: {
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 1.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  // 3C 그리드
  threeCGrid: {
    flexDirection: 'row',
    gap: 8,
    padding: '8 40',
    flex: 1,
  },
  threeCCol: {
    flex: 1,
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: C.borderGray,
  },
  threeCColTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: C.navy,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.borderGray,
  },
  // STP
  stpSegGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: '6 40',
  },
  stpSegCell: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a78bfa',
    backgroundColor: '#faf5ff',
    overflow: 'hidden',
  },
  stpSegHeader: {
    backgroundColor: '#ede9fe',
    padding: '5 8 4 8',
    borderBottomWidth: 1,
    borderBottomColor: '#c4b5fd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stpSegLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: '#5b21b6',
    marginBottom: 2,
  },
  stpSegName: {
    fontSize: 8,
    fontWeight: 700,
    color: C.slate900,
    lineHeight: 1.3,
    flex: 1,
    marginRight: 4,
  },
  stpSegSize: {
    fontSize: 7,
    color: '#7c3aed',
    fontWeight: 700,
    textAlign: 'right',
  },
  stpSegBody: {
    padding: '5 8',
  },
  stpSegCriteriaLabel: {
    fontSize: 6,
    fontWeight: 700,
    color: C.slate500,
    letterSpacing: 0.8,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  stpSegCriteria: {
    fontSize: 7,
    color: C.slate700,
    lineHeight: 1.4,
    marginBottom: 4,
  },
  stpSegDesc: {
    fontSize: 7,
    color: C.slate700,
    lineHeight: 1.4,
  },
  // 4P 그리드
  fourPGrid: {
    flexDirection: 'row',
    gap: 8,
    padding: '8 40',
    flex: 1,
  },
  fourPCol: {
    flex: 1,
    borderRadius: 6,
    padding: 10,
    borderTopWidth: 3,
  },
  fourPLabel: {
    fontSize: 8,
    fontWeight: 700,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // 참고문헌
  refSection: {
    padding: '8 40',
  },
  refTierLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginTop: 12,
  },
  refTierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  refTierText: {
    fontSize: 8,
    fontWeight: 700,
  },
  refGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  refItem: {
    width: '48%',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  refIndex: {
    fontSize: 7,
    fontWeight: 700,
    minWidth: 28,
  },
  refTitle: {
    fontSize: 7,
    color: C.slate700,
    flex: 1,
    lineHeight: 1.4,
  },
  refUri: {
    fontSize: 6,
    color: C.slate500,
  },
  // 페이지 푸터
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: C.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  footerText: {
    fontSize: 7,
    color: '#64748b',
  },
  // 커뮤니케이션
  commBox: {
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  commLabel: {
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 1.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  commText: {
    fontSize: 9,
    lineHeight: 1.6,
  },
  // 타겟 페르소나
  personaBox: {
    borderRadius: 8,
    backgroundColor: '#4c1d95',
    padding: 16,
    marginBottom: 10,
  },
  personaLabel: {
    fontSize: 7,
    color: '#c4b5fd',
    fontWeight: 700,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  personaName: {
    fontSize: 16,
    fontWeight: 700,
    color: C.white,
    marginBottom: 8,
  },
  personaRationale: {
    fontSize: 8,
    color: '#ddd6fe',
    lineHeight: 1.6,
  },
  personaQuote: {
    fontSize: 9,
    fontStyle: 'italic',
    color: C.white,
    lineHeight: 1.6,
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
  },
  personaImage: {
    width: '100%',
    height: 160,
    objectFit: 'cover',
    borderRadius: 8,
    marginBottom: 8,
  },
});

// ─── 공통 컴포넌트 ────────────────────────────────────────────────

const PageHeader: React.FC<{ tag: string; title: string; pageNum: number }> = ({ tag, title, pageNum }) => (
  <View style={S.pageHeader}>
    <View style={S.pageHeaderLeft}>
      <Text style={S.sectionTag}>{tag}</Text>
      <Text style={S.pageTitle}>{title}</Text>
    </View>
    <Text style={S.pageNum}>P. {pageNum}</Text>
  </View>
);

const HeadMessage: React.FC<{ text: string }> = ({ text }) => (
  <View style={S.headMsg}>
    <Text style={S.headMsgText}>{text}</Text>
  </View>
);

const BulletItem: React.FC<{ text: string }> = ({ text }) => (
  <View style={S.bulletItem}>
    <View style={S.bullet} />
    <Text style={S.bulletText}>{text}</Text>
  </View>
);

const PageFooter: React.FC<{ company: string }> = ({ company }) => (
  <View style={S.footer}>
    <Text style={S.footerText}>AESA Marketing Strategy Report · Confidential</Text>
    <Text style={S.footerText}>{company}</Text>
  </View>
);

// ─── 슬라이드 1: 표지 ─────────────────────────────────────────────
const CoverSlide = ({ result, report }: { result: AnalysisResult; report: MarketingReport }) => (
  <Page size="A4" style={S.coverPage}>
    <View style={S.coverInner}>
      <Text style={S.coverTag}>Marketing Strategy Report</Text>
      <Text style={S.coverTitle}>{report.title || 'Marketing Strategy Analysis'}</Text>
      <Text style={S.coverSubtitle}>{report.subtitle || ''}</Text>
      <View style={S.coverDivider} />
      <Text style={S.coverMeta}>
        {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} · Powered by AESA
      </Text>
    </View>
  </Page>
);

// ─── 슬라이드 2: 시장 규모 ────────────────────────────────────────
const MarketSlide = ({ result }: { result: AnalysisResult }) => {
  const m = result.marketTrend;
  return (
    <Page size="A4" style={S.page}>
      <PageHeader tag="시장 규모" title="1. 시장 규모 및 성장률" pageNum={2} />
      <HeadMessage text={`현재 시장 규모 ${m.currentMarketSize} (${m.unit}) · 과거 CAGR ${m.cagrHistorical} · 향후 CAGR ${m.cagrForecast} 전망`} />
      <View style={S.body}>
        <View style={S.bodyLeft}>
          <Text style={S.colLabel}>시장 규모 추이 및 전망</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
            {[...m.historicalData, ...m.forecastData].slice(0, 12).map((d, i) => (
              <View key={i} style={{
                padding: '4 8',
                borderRadius: 4,
                backgroundColor: d.isForecast ? C.lightBlue : C.slate100,
                borderWidth: 1,
                borderColor: d.isForecast ? '#93c5fd' : C.borderGray,
                minWidth: 70,
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 7, color: C.slate500 }}>{d.year}{d.isForecast ? '(E)' : ''}</Text>
                <Text style={{ fontSize: 9, fontWeight: 700, color: d.isForecast ? '#1d4ed8' : C.slate900 }}>
                  {d.value.toFixed(1)}
                </Text>
              </View>
            ))}
          </View>
          <Text style={{ fontSize: 8, color: C.slate500, marginTop: 8, fontStyle: 'italic' }}>
            단위: {m.unit} · (E) = 예측값
          </Text>
          <Text style={{ fontSize: 8, color: C.slate700, marginTop: 10, lineHeight: 1.6 }}>{m.description}</Text>
        </View>
        <View style={S.bodyRight}>
          <Text style={S.colLabel}>핵심 지표</Text>
          <View style={S.rtbBox}>
            <Text style={S.rtbTag}>현재 시장 규모</Text>
            <Text style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{m.currentMarketSize}</Text>
            <Text style={S.rtbSource}>{m.unit}</Text>
          </View>
          <View style={[S.rtbBox, { marginTop: 8 }]}>
            <Text style={S.rtbTag}>과거 CAGR</Text>
            <Text style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>{m.cagrHistorical}</Text>
          </View>
          <View style={[S.rtbBox, { marginTop: 8 }]}>
            <Text style={S.rtbTag}>미래 CAGR 전망</Text>
            <Text style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8' }}>{m.cagrForecast}</Text>
          </View>
        </View>
      </View>
      <PageFooter company="" />
    </Page>
  );
};

// ─── 슬라이드 3: PEST ─────────────────────────────────────────────
const PestSlide = ({ result }: { result: AnalysisResult }) => {
  const p = result.pest;
  const cols = [
    { label: 'POLITICAL (정치)', items: p.political, color: '#dbeafe', border: '#93c5fd', text: '#1e3a8a' },
    { label: 'ECONOMIC (경제)', items: p.economic, color: '#dcfce7', border: '#86efac', text: '#14532d' },
    { label: 'SOCIAL (사회)', items: p.social, color: '#fef9c3', border: '#fde047', text: '#713f12' },
    { label: 'TECHNOLOGICAL (기술)', items: p.technological, color: '#fce7f3', border: '#f9a8d4', text: '#831843' },
  ];
  return (
    <Page size="A4" style={S.page}>
      <PageHeader tag="PEST 환경분석" title="2. PEST 분석 및 시사점" pageNum={3} />
      <HeadMessage text={p.implications?.[0] || 'PEST 분석 결과'} />
      <View style={S.pestGrid}>
        {cols.map((col, i) => (
          <View key={i} style={[S.pestCol, { backgroundColor: col.color, borderColor: col.border }]}>
            <Text style={[S.pestColTitle, { color: col.text, borderBottomColor: col.border }]}>{col.label}</Text>
            {col.items.slice(0, 4).map((item, j) => (
              <BulletItem key={j} text={item} />
            ))}
          </View>
        ))}
      </View>
      {p.implications?.length > 1 && (
        <View style={{ padding: '0 40 8 40' }}>
          <View style={{ backgroundColor: C.slate100, borderRadius: 6, padding: 10, borderLeftWidth: 3, borderLeftColor: C.navy }}>
            <Text style={{ fontSize: 7, fontWeight: 700, color: C.navy, marginBottom: 4, letterSpacing: 1 }}>PEST 전략적 시사점</Text>
            {p.implications.slice(1, 3).map((imp, i) => (
              <BulletItem key={i} text={imp} />
            ))}
          </View>
        </View>
      )}
      <PageFooter company="" />
    </Page>
  );
};

// ─── 슬라이드 4: 3C ───────────────────────────────────────────────
const ThreeCSlide = ({ result }: { result: AnalysisResult }) => {
  const c = result.threeC;
  return (
    <Page size="A4" style={S.page}>
      <PageHeader tag="3C 분석" title="3. 3C 분석 및 시사점" pageNum={4} />
      <HeadMessage text={`${c.company.name} — ${c.company.currentPosition}`} />
      <View style={S.threeCGrid}>
        <View style={[S.threeCCol, { borderColor: '#93c5fd', backgroundColor: '#eff6ff' }]}>
          <Text style={S.threeCColTitle}>COMPANY (자사)</Text>
          <Text style={{ fontSize: 8, fontWeight: 700, color: C.navy, marginBottom: 6 }}>{c.company.name}</Text>
          {c.company.strengths.slice(0, 4).map((s, i) => <BulletItem key={i} text={s} />)}
        </View>
        <View style={[S.threeCCol, { borderColor: '#86efac', backgroundColor: '#f0fdf4' }]}>
          <Text style={[S.threeCColTitle, { color: '#14532d', borderBottomColor: '#86efac' }]}>COMPETITOR (경쟁사)</Text>
          {c.competitor.rivals.slice(0, 3).map((r, i) => (
            <View key={i} style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 8, fontWeight: 700, color: '#14532d', marginBottom: 3 }}>{r.name}</Text>
              <Text style={{ fontSize: 8, color: C.slate700, lineHeight: 1.5 }}>{r.strategy}</Text>
            </View>
          ))}
        </View>
        <View style={[S.threeCCol, { borderColor: '#fde047', backgroundColor: '#fefce8' }]}>
          <Text style={[S.threeCColTitle, { color: '#713f12', borderBottomColor: '#fde047' }]}>CUSTOMER (고객)</Text>
          {c.customer.needs.slice(0, 3).map((n, i) => <BulletItem key={i} text={n} />)}
          <Text style={{ fontSize: 7, fontWeight: 700, color: '#713f12', marginTop: 6, marginBottom: 3 }}>트렌드</Text>
          {c.customer.trends.slice(0, 2).map((t, i) => <BulletItem key={i} text={t} />)}
        </View>
      </View>
      <PageFooter company="" />
    </Page>
  );
};

// ─── 슬라이드 5: SWOT ─────────────────────────────────────────────
const SwotSlide = ({ result }: { result: AnalysisResult }) => {
  const s = result.swot;
  const cells = [
    { label: 'STRENGTHS (강점)', items: s.strengths, bg: '#f0fdf4', border: '#86efac', color: '#14532d' },
    { label: 'WEAKNESSES (약점)', items: s.weaknesses, bg: '#fef2f2', border: '#fca5a5', color: '#7f1d1d' },
    { label: 'OPPORTUNITIES (기회)', items: s.opportunities, bg: '#eff6ff', border: '#93c5fd', color: '#1e3a8a' },
    { label: 'THREATS (위협)', items: s.threats, bg: '#fff7ed', border: '#fdba74', color: '#7c2d12' },
  ];
  return (
    <Page size="A4" style={S.page}>
      <PageHeader tag="SWOT 매트릭스" title="4. SWOT 분석 및 전략 방향" pageNum={5} />
      <View style={S.swotGrid}>
        {cells.map((cell, i) => (
          <View key={i} style={[S.swotCell, { backgroundColor: cell.bg, borderColor: cell.border }]}>
            <Text style={[S.swotLabel, { color: cell.color }]}>{cell.label}</Text>
            {cell.items.slice(0, 3).map((item, j) => <BulletItem key={j} text={item} />)}
          </View>
        ))}
      </View>
      <View style={{ padding: '0 40 8 40' }}>
        <View style={{ backgroundColor: C.navy, borderRadius: 8, padding: 14 }}>
          <Text style={{ fontSize: 8, fontWeight: 700, color: '#93c5fd', marginBottom: 8, letterSpacing: 1 }}>전략 방향성 도출</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 7, color: '#86efac', fontWeight: 700, marginBottom: 4 }}>SO 전략 (강점-기회)</Text>
              <Text style={{ fontSize: 8, color: C.white, lineHeight: 1.5 }}>{s.strategies?.SO || ''}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 7, color: '#fca5a5', fontWeight: 700, marginBottom: 4 }}>WT 전략 (약점-위협)</Text>
              <Text style={{ fontSize: 8, color: C.white, lineHeight: 1.5 }}>{s.strategies?.WT || ''}</Text>
            </View>
          </View>
        </View>
      </View>
      <PageFooter company="" />
    </Page>
  );
};

// ─── 슬라이드 6: STP ─────────────────────────────────────────────
const StpSlide = ({ result }: { result: AnalysisResult }) => {
  const stp = result.stp;
  return (
    <Page size="A4" style={S.page}>
      <PageHeader tag="STP 전략 수립" title="5. STP 분석" pageNum={6} />
      <HeadMessage text={stp.segmentationLogic || '시장 세분화 및 타겟팅 전략'} />
      <View style={{ padding: '8 40 0 40' }}>
        <Text style={S.colLabel}>시장 세분화 (Segmentation)</Text>
      </View>
      <View style={S.stpSegGrid}>
        {stp.segmentation.slice(0, 5).map((seg, i) => {
          const count = Math.min(stp.segmentation.length, 5);
          const cellWidth = count <= 3
            ? '32%'
            : count === 4
            ? '48%'
            : '31%';
          return (
            <View key={i} style={[S.stpSegCell, { width: cellWidth }]}>
              {/* 헤더 */}
              <View style={S.stpSegHeader}>
                <View style={{ flex: 1, marginRight: 4 }}>
                  <Text style={S.stpSegLabel}>세그먼트 {i + 1}</Text>
                  <Text style={S.stpSegName}>{seg.name}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 6, color: C.slate500, marginBottom: 1 }}>규모</Text>
                  <Text style={S.stpSegSize}>{seg.size}</Text>
                </View>
              </View>
              {/* 본문 */}
              <View style={S.stpSegBody}>
                <Text style={S.stpSegCriteriaLabel}>분류 기준</Text>
                <Text style={S.stpSegCriteria}>{seg.criteria}</Text>
                <Text style={S.stpSegCriteriaLabel}>프로필</Text>
                <Text style={S.stpSegDesc}>{seg.description}</Text>
              </View>
            </View>
          );
        })}
      </View>
      <View style={{ padding: '8 40 4 40', flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1, backgroundColor: '#4c1d95', borderRadius: 8, padding: 12 }}>
          <Text style={{ fontSize: 7, color: '#c4b5fd', fontWeight: 700, marginBottom: 4, letterSpacing: 1 }}>타겟 세그먼트</Text>
          <Text style={{ fontSize: 12, fontWeight: 700, color: C.white, marginBottom: 6 }}>{stp.targeting.selectedSegment}</Text>
          <Text style={{ fontSize: 8, color: '#ddd6fe', lineHeight: 1.5 }}>{stp.targeting.rationale}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: C.lightBlue, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#93c5fd' }}>
          <Text style={{ fontSize: 7, color: C.navy, fontWeight: 700, marginBottom: 4, letterSpacing: 1 }}>포지셔닝 선언문</Text>
          <Text style={{ fontSize: 9, color: C.navy, lineHeight: 1.6, fontWeight: 700 }}>"{stp.positioning.statement}"</Text>
          <Text style={{ fontSize: 8, color: C.slate700, marginTop: 6, lineHeight: 1.5 }}>{stp.positioning.differentiation}</Text>
        </View>
      </View>
      <PageFooter company="" />
    </Page>
  );
};

// ─── 슬라이드 7: 4P Mix ──────────────────────────────────────────
const FourPSlide = ({ result }: { result: AnalysisResult }) => {
  const mix = result.marketingMix;
  const cols = [
    { label: 'PRODUCT (제품)', items: mix.product, color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' },
    { label: 'PRICE (가격)', items: mix.price, color: '#059669', bg: '#f0fdf4', border: '#86efac' },
    { label: 'PLACE (유통)', items: mix.place, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    { label: 'PROMOTION (촉진)', items: mix.promotion, color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  ];
  return (
    <Page size="A4" style={S.page}>
      <PageHeader tag="실행 전략" title="6. 4P's Marketing Mix" pageNum={7} />
      <HeadMessage text="시장 분석 및 STP 전략을 기반으로 도출한 마케팅 믹스 실행 전략" />
      <View style={S.fourPGrid}>
        {cols.map((col, i) => (
          <View key={i} style={[S.fourPCol, {
            backgroundColor: col.bg,
            borderColor: col.border,
            borderTopColor: col.color,
            borderWidth: 1,
          }]}>
            <Text style={[S.fourPLabel, { color: col.color }]}>{col.label}</Text>
            {col.items.slice(0, 4).map((item, j) => <BulletItem key={j} text={item} />)}
          </View>
        ))}
      </View>
      <PageFooter company="" />
    </Page>
  );
};

// ─── 슬라이드 8: 커뮤니케이션 전략 ──────────────────────────────
const CommSlide = ({ result }: { result: AnalysisResult }) => {
  const comm = result.communication;
  return (
    <Page size="A4" style={S.page}>
      <PageHeader tag="크리에이티브 전략" title="7. 커뮤니케이션 전략" pageNum={8} />
      <View style={S.body}>
        <View style={S.bodyLeft}>
          <View style={[S.commBox, { backgroundColor: C.navy, borderColor: C.navy }]}>
            <Text style={[S.commLabel, { color: '#93c5fd' }]}>크리에이티브 컨셉</Text>
            <Text style={[S.commText, { color: C.white, fontSize: 13, fontWeight: 700 }]}>{comm.mainConcept}</Text>
          </View>
          <View style={[S.commBox, { backgroundColor: '#7f1d1d', borderColor: '#7f1d1d' }]}>
            <Text style={[S.commLabel, { color: '#fca5a5' }]}>핵심 슬로건</Text>
            <Text style={[S.commText, { color: C.white, fontSize: 12, fontWeight: 700 }]}>"{comm.slogan}"</Text>
          </View>
          <View style={[S.commBox, { backgroundColor: C.slate50, borderColor: C.borderGray }]}>
            <Text style={[S.commLabel, { color: C.navy }]}>브랜드 스토리</Text>
            <Text style={[S.commText, { color: C.slate700 }]}>{comm.brandStory}</Text>
          </View>
        </View>
        <View style={S.bodyRight}>
          <Text style={S.colLabel}>톤앤매너 / 키워드</Text>
          <View style={[S.rtbBox, { marginBottom: 8 }]}>
            <Text style={S.rtbTag}>톤앤매너</Text>
            <Text style={S.rtbText}>{comm.toneAndVoice}</Text>
          </View>
          <Text style={[S.colLabel, { marginTop: 8 }]}>핵심 키워드</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {comm.keyKeywords.map((kw, i) => (
              <View key={i} style={{ backgroundColor: C.lightBlue, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                <Text style={{ fontSize: 8, color: C.navy, fontWeight: 700 }}>#{kw}</Text>
              </View>
            ))}
          </View>
          <Text style={[S.colLabel, { marginTop: 12 }]}>실행 계획</Text>
          {comm.actionPlan.slice(0, 4).map((a, i) => <BulletItem key={i} text={a} />)}
        </View>
      </View>
      <PageFooter company="" />
    </Page>
  );
};

// ─── 슬라이드 9: 참고문헌 ────────────────────────────────────────
const ReferencesSlide = ({ result }: { result: AnalysisResult }) => {
  const verified = (result.sources || []).filter(s => s.uri && s.uri.startsWith('http'));
  const aiTextSources = [
    ...(result.pest?.sources || []),
    ...(result.threeC?.company?.sources || []),
    ...(result.threeC?.competitor?.sources || []),
    ...(result.threeC?.customer?.sources || []),
    ...(result.swot?.sources || []),
  ];
  const verifiedTitles = new Set(verified.map(s => s.title?.toLowerCase()));
  const aiGenerated = Array.from(new Set(aiTextSources)).filter(
    s => s && s.trim().length > 3 && !verifiedTitles.has(s.toLowerCase())
  );

  return (
    <Page size="A4" style={S.page}>
      <PageHeader tag="참고문헌" title="참고문헌 및 데이터 출처" pageNum={9} />
      <View style={S.refSection}>
        {verified.length > 0 && (
          <>
            <View style={S.refTierLabel}>
              <View style={[S.refTierDot, { backgroundColor: '#10b981' }]} />
              <Text style={[S.refTierText, { color: '#065f46' }]}>
                검증된 출처 — 링크 확인 가능 ({verified.length}건)
              </Text>
            </View>
            <View style={S.refGrid}>
              {verified.map((s, i) => (
                <View key={i} style={S.refItem}>
                  <Text style={[S.refIndex, { color: '#10b981' }]}>[V{i + 1}]</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={S.refTitle}>{s.title}</Text>
                    <Text style={S.refUri}>{s.uri}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
        {aiGenerated.length > 0 && (
          <>
            <View style={[S.refTierLabel, { marginTop: 16 }]}>
              <View style={[S.refTierDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={[S.refTierText, { color: '#92400e' }]}>
                AI 추론 기반 — 원문 확인 권장 ({aiGenerated.length}건)
              </Text>
            </View>
            <View style={S.refGrid}>
              {aiGenerated.map((s, i) => (
                <View key={i} style={S.refItem}>
                  <Text style={[S.refIndex, { color: '#f59e0b' }]}>[A{i + 1}]</Text>
                  <Text style={S.refTitle}>{s}</Text>
                </View>
              ))}
            </View>
            <Text style={{ fontSize: 7, color: C.slate500, fontStyle: 'italic', marginTop: 8, lineHeight: 1.5 }}>
              ※ AI 추론 기반 출처는 분석 모델이 Fact Sheet를 해석하는 과정에서 생성된 참조입니다.
            </Text>
          </>
        )}
      </View>
      <PageFooter company="" />
    </Page>
  );
};

// ─── 메인 PDF Document ────────────────────────────────────────────
interface PDFReportProps {
  result: AnalysisResult;
  report: MarketingReport;
}

const PDFReport = ({ result, report }: PDFReportProps) => (
  <Document>
    <CoverSlide result={result} report={report} />
    <MarketSlide result={result} />
    <PestSlide result={result} />
    <ThreeCSlide result={result} />
    <SwotSlide result={result} />
    <StpSlide result={result} />
    <FourPSlide result={result} />
    <CommSlide result={result} />
    <ReferencesSlide result={result} />
  </Document>
);

export default PDFReport;
