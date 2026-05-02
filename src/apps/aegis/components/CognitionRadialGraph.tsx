
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { CognitionKey, ContextVisualizationData } from '../domain/visualization/contextVisualization.types';
import { ConversionStage } from '../core/context';

// ── 타입 ──────────────────────────────────────────────────────────────────────

type Props = {
  data: ContextVisualizationData;
  conversionStage?: ConversionStage;
  width?: number;
  height?: number;
};

// ── 상수 ──────────────────────────────────────────────────────────────────────

// 항상 고정 순서 — 렌더링 일관성 확보
const COGNITION_ORDER: CognitionKey[] = ['informational', 'exploratory', 'commercial', 'transactional'];

const COG_CFG: Record<CognitionKey, {
  label: string;
  labelKo: string;
  color: string;
  sectorFill: string;
}> = {
  informational: { label: 'INFO',  labelKo: '정보탐색', color: '#38bdf8', sectorFill: 'rgba(56,189,248,0.06)'  },
  exploratory:   { label: 'EXPL',  labelKo: '탐색비교', color: '#818cf8', sectorFill: 'rgba(129,140,248,0.06)' },
  commercial:    { label: 'COMM',  labelKo: '상업의도', color: '#fbbf24', sectorFill: 'rgba(251,191,36,0.06)'   },
  transactional: { label: 'TRAN',  labelKo: '구매전환', color: '#10b981', sectorFill: 'rgba(16,185,129,0.06)'  },
};

const CDJ_COLOR: Record<ConversionStage, string> = {
  awareness:      '#94a3b8',
  consideration:  '#38bdf8',
  decision:       '#fbbf24',
  post_purchase:  '#10b981',
};

const CDJ_LABEL: Record<ConversionStage, string> = {
  awareness:      'AWARENESS',
  consideration:  'CONSIDER',
  decision:       'DECISION',
  post_purchase:  'POST-BUY',
};

// ── D3 arc 헬퍼 ───────────────────────────────────────────────────────────────

function makeArc(ir: number, or: number, sa: number, ea: number): string {
  const fn = d3.arc<null>()
    .innerRadius(ir).outerRadius(or)
    .startAngle(sa).endAngle(ea);
  return fn(null) ?? '';
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

const CognitionRadialGraph: React.FC<Props> = ({
  data,
  conversionStage,
  width = 400,
  height = 400,
}) => {
  const svgRef     = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data.keywords) return;

    // ── 기본 치수 ──────────────────────────────────────────────────────────
    const cx = width  / 2;
    const cy = height / 2;
    const outerR   = Math.min(width, height) / 2 - 28; // 전체 반경
    const centerR  = 38;                                 // 중앙 노드 반경
    const ringIn   = centerR + 16;                       // Cognition 링 내경
    const ringOut  = centerR + 36;                       // Cognition 링 외경
    const kwInR    = outerR * 0.58;                      // 키워드 내부 링 반경
    const kwOutR   = outerR * 0.80;                      // 키워드 외부 링 반경
    const labelR   = outerR * 0.935;                     // 섹터 레이블 반경

    // ── SVG 초기화 ─────────────────────────────────────────────────────────
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    // defs: 중앙 노드 그라디언트
    const defs = svg.append('defs');
    const grad = defs.append('radialGradient')
      .attr('id', `cg-center-${data.contextId}`)
      .attr('cx', '40%').attr('cy', '40%').attr('r', '60%');
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#6366f1').attr('stop-opacity', 1);
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#1e1b4b').attr('stop-opacity', 1);

    const g = svg.append('g').attr('transform', `translate(${cx},${cy})`);
    const tooltip = d3.select(tooltipRef.current);

    // ── 가이드 링 (보조선) ─────────────────────────────────────────────────
    [ringOut + 4, kwInR, kwOutR].forEach(r => {
      g.append('circle')
        .attr('r', r)
        .attr('fill', 'none')
        .attr('stroke', '#e2e8f0')
        .attr('stroke-width', 0.5)
        .attr('stroke-dasharray', '3 4')
        .attr('stroke-opacity', 0.35);
    });

    // ── 각도 스케일 ────────────────────────────────────────────────────────
    const angleScale = d3.scaleBand<CognitionKey>()
      .domain(COGNITION_ORDER)
      .range([0, Math.PI * 2]);
    const BW = angleScale.bandwidth(); // π/2 (90°)

    // ── 키워드 그룹핑 ─────────────────────────────────────────────────────
    const kwGroups = new Map<CognitionKey, typeof data.keywords>();
    COGNITION_ORDER.forEach(cog => {
      kwGroups.set(cog, data.keywords.filter(kw =>
        kw.cognition === cog || (kw as any).intent === cog
      ));
    });

    // ── 섹터별 렌더링 ─────────────────────────────────────────────────────
    COGNITION_ORDER.forEach((cog, si) => {
      const sa = angleScale(cog)!;
      const ea = sa + BW;
      const ca = sa + BW / 2; // 섹터 중심 각도
      const cfg = COG_CFG[cog];

      // 1) 섹터 배경 호 (Cognition 구역 색상 구분)
      const bgPath = makeArc(ringIn - 2, outerR - 3, sa + 0.03, ea - 0.03);
      if (bgPath) {
        g.append('path')
          .attr('d', bgPath)
          .attr('fill', cfg.sectorFill)
          .attr('stroke', cfg.color)
          .attr('stroke-width', 0.5)
          .attr('stroke-opacity', 0.2);
      }

      // 2) Cognition 링 호 (중앙 주변 컬러 밴드)
      const ringPath = makeArc(ringIn, ringOut, sa + 0.06, ea - 0.06);
      if (ringPath) {
        g.append('path')
          .attr('d', ringPath)
          .attr('fill', cfg.color)
          .attr('fill-opacity', 0.18)
          .attr('stroke', cfg.color)
          .attr('stroke-width', 1.5)
          .attr('stroke-opacity', 0.55);
      }

      // 3) 섹터 분리선 (섹터 경계 얇은 방사선)
      g.append('line')
        .attr('x1', Math.sin(sa) * (ringIn - 2))
        .attr('y1', -Math.cos(sa) * (ringIn - 2))
        .attr('x2', Math.sin(sa) * (outerR - 3))
        .attr('y2', -Math.cos(sa) * (outerR - 3))
        .attr('stroke', cfg.color)
        .attr('stroke-width', 0.8)
        .attr('stroke-opacity', 0.2);

      // 4) Cognition 링 레이블 (내부 호 중심)
      const cogR = (ringIn + ringOut) / 2;
      const cogX = Math.sin(ca) * cogR;
      const cogY = -Math.cos(ca) * cogR;
      g.append('text')
        .attr('x', cogX).attr('y', cogY)
        .attr('text-anchor', 'middle').attr('dy', '0.35em')
        .attr('fill', cfg.color)
        .style('font-size', '7px')
        .style('font-weight', '900')
        .style('letter-spacing', '0.04em')
        .text(cfg.label);

      // 5) 외곽 섹터 레이블 (2줄: 영문 + 한글)
      const lx = Math.sin(ca) * labelR;
      const ly = -Math.cos(ca) * labelR;
      const labelGroup = g.append('g').attr('transform', `translate(${lx},${ly})`);
      labelGroup.append('text')
        .attr('text-anchor', 'middle').attr('dy', '-0.3em')
        .attr('fill', cfg.color).attr('fill-opacity', 0.85)
        .style('font-size', '8px').style('font-weight', '900').style('letter-spacing', '0.06em')
        .text(cfg.label);
      labelGroup.append('text')
        .attr('text-anchor', 'middle').attr('dy', '0.85em')
        .attr('fill', cfg.color).attr('fill-opacity', 0.55)
        .style('font-size', '7px').style('font-weight', '600')
        .text(cfg.labelKo);

      // 6) 키워드 팬 스프레드 배치
      const kws = kwGroups.get(cog) || [];
      if (kws.length === 0) return;

      const sorted = [...kws]
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 8);

      const maxVol = d3.max(sorted, d => d.volume) || 1;
      const minVol = d3.min(sorted, d => d.volume) || 0;
      const rScale = d3.scaleSqrt()
        .domain([minVol, maxVol])
        .range([3.5, 9.5]);

      // 내/외 2개 링으로 분배
      const halfN = Math.ceil(sorted.length / 2);
      const inner = sorted.slice(0, halfN);
      const outer = sorted.slice(halfN);

      type KwEntry = typeof sorted[0];

      const placeGroup = (
        items: KwEntry[],
        ringR: number,
        fanRatio: number,
        delay: number
      ) => {
        const fan = BW * fanRatio;
        items.forEach((kw, i) => {
          const kwAngle = items.length === 1
            ? ca
            : ca - fan / 2 + (i / (items.length - 1)) * fan;

          const kx = Math.sin(kwAngle) * ringR;
          const ky = -Math.cos(kwAngle) * ringR;

          // 키워드 → 링 연결선
          const connR = ringOut + (ringR - ringOut) * 0.25;
          g.append('line')
            .attr('x1', Math.sin(kwAngle) * (ringOut + 2))
            .attr('y1', -Math.cos(kwAngle) * (ringOut + 2))
            .attr('x2', Math.sin(kwAngle) * connR)
            .attr('y2', -Math.cos(kwAngle) * connR)
            .attr('stroke', cfg.color)
            .attr('stroke-width', 0.7)
            .attr('stroke-opacity', 0.18);

          // 키워드 원
          const circle = g.append('circle')
            .attr('cx', kx).attr('cy', ky)
            .attr('r', 0)
            .attr('fill', cfg.color)
            .attr('fill-opacity', 0.22)
            .attr('stroke', cfg.color)
            .attr('stroke-width', 1.5)
            .attr('stroke-opacity', 0.65)
            .style('cursor', 'pointer')
            .on('mouseover', function(event: MouseEvent) {
              d3.select(this)
                .transition().duration(150)
                .attr('r', rScale(kw.volume) + 4)
                .attr('fill-opacity', 0.8);
              tooltip
                .style('opacity', 1)
                .html(`
                  <div style="font-weight:900;font-size:11px;margin-bottom:4px;color:#f1f5f9">${kw.keyword}</div>
                  <div style="color:#94a3b8;font-size:9px;line-height:1.6">
                    검색량: ${kw.volume.toLocaleString()}
                    ${kw.cpc ? `<br/>CPC: ₩${kw.cpc.toLocaleString()}` : ''}
                    ${kw.competition ? `<br/>경쟁: ${kw.competition}` : ''}
                  </div>
                `)
                .style('left', `${event.pageX + 14}px`)
                .style('top',  `${event.pageY - 22}px`);
            })
            .on('mouseout', function() {
              d3.select(this)
                .transition().duration(150)
                .attr('r', rScale(kw.volume))
                .attr('fill-opacity', 0.22);
              tooltip.style('opacity', 0);
            });

          circle.transition()
            .duration(700)
            .delay(delay + i * 55)
            .ease(d3.easeCubicOut)
            .attr('r', rScale(kw.volume));

          // 키워드 텍스트 레이블 (6자 절단 + 페이드인)
          const truncated = kw.keyword.length > 7
            ? kw.keyword.slice(0, 6) + '…'
            : kw.keyword;

          g.append('text')
            .attr('x', kx)
            .attr('y', ky + rScale(kw.volume) + 9)
            .attr('text-anchor', 'middle')
            .attr('fill', cfg.color)
            .attr('fill-opacity', 0)
            .style('font-size', '7px')
            .style('font-weight', '700')
            .text(truncated)
            .transition()
            .duration(600)
            .delay(delay + i * 55 + 200)
            .attr('fill-opacity', 0.75);
        });
      };

      placeGroup(inner, kwInR,  0.60, si * 120);
      if (outer.length > 0)
        placeGroup(outer, kwOutR, 0.72, si * 120 + 60);
    });

    // ── 중앙 노드 ─────────────────────────────────────────────────────────

    // CDJ 단계 점선 링 (optional)
    if (conversionStage) {
      g.append('circle')
        .attr('r', centerR + 8)
        .attr('fill', 'none')
        .attr('stroke', CDJ_COLOR[conversionStage])
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.5)
        .attr('stroke-dasharray', '4 3');
    }

    // 중앙 원
    g.append('circle')
      .attr('r', centerR)
      .attr('fill', `url(#cg-center-${data.contextId})`)
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 2);

    // CEP 레이블 (2줄 처리)
    const raw    = data.contextLabel || 'CEP';
    const words  = raw.split(/\s+/);
    const maxChr = 7;

    if (raw.length > maxChr && words.length > 1) {
      const mid   = Math.ceil(words.length / 2);
      const line1 = words.slice(0, mid).join(' ');
      const line2 = words.slice(mid).join(' ');
      g.append('text').attr('text-anchor', 'middle').attr('dy', '-0.55em')
        .attr('fill', '#f8fafc').style('font-size', '9px').style('font-weight', '900')
        .text(line1.length > maxChr + 1 ? line1.slice(0, maxChr) + '…' : line1);
      g.append('text').attr('text-anchor', 'middle').attr('dy', '0.75em')
        .attr('fill', '#f8fafc').style('font-size', '9px').style('font-weight', '900')
        .text(line2.length > maxChr + 1 ? line2.slice(0, maxChr) + '…' : line2);
    } else {
      g.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em')
        .attr('fill', '#f8fafc').style('font-size', '9px').style('font-weight', '900')
        .text(raw.length > maxChr + 1 ? raw.slice(0, maxChr) + '…' : raw);
    }

    // CDJ 단계 뱃지 (중앙 아래)
    if (conversionStage) {
      const badgeY   = centerR + 20;
      const badgeW   = 52;
      const badgeH   = 13;
      const stageCol = CDJ_COLOR[conversionStage];
      const stageLbl = CDJ_LABEL[conversionStage];

      g.append('rect')
        .attr('x', -badgeW / 2).attr('y', badgeY - badgeH / 2)
        .attr('width', badgeW).attr('height', badgeH)
        .attr('rx', 6)
        .attr('fill', stageCol).attr('fill-opacity', 0.12)
        .attr('stroke', stageCol).attr('stroke-width', 1).attr('stroke-opacity', 0.45);

      g.append('text')
        .attr('text-anchor', 'middle').attr('y', badgeY + 1)
        .attr('dy', '0.35em')
        .attr('fill', stageCol)
        .style('font-size', '6.5px').style('font-weight', '800').style('letter-spacing', '0.05em')
        .text(stageLbl);
    }

  }, [data, width, height, conversionStage]);

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full flex flex-col items-center gap-3">
      <svg ref={svgRef} className="overflow-visible" />

      {/* 하단 인덱스 */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-2">
        {COGNITION_ORDER.map(cog => (
          <div key={cog} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: COG_CFG[cog].color }}
            />
            <span
              className="text-[9px] font-bold"
              style={{ color: COG_CFG[cog].color, opacity: 0.8 }}
            >
              {COG_CFG[cog].labelKo}
            </span>
          </div>
        ))}
        {conversionStage && (
          <>
            <div className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-0.5 rounded-full"
                style={{ backgroundColor: CDJ_COLOR[conversionStage], opacity: 0.7 }}
              />
              <span
                className="text-[9px] font-bold"
                style={{ color: CDJ_COLOR[conversionStage], opacity: 0.8 }}
              >
                {CDJ_LABEL[conversionStage]}
              </span>
            </div>
          </>
        )}
      </div>

      {/* 툴팁 */}
      <div
        ref={tooltipRef}
        className="fixed z-[200] px-3 py-2 text-xs bg-slate-900 dark:bg-slate-800 border border-white/10 rounded-xl shadow-2xl pointer-events-none transition-opacity duration-150 opacity-0 max-w-[180px]"
        style={{ fontFamily: '"Malgun Gothic", "Apple SD Gothic Neo", sans-serif' }}
      />
    </div>
  );
};

export default CognitionRadialGraph;
