
import type { AnalysisPeriod } from './analysisPeriod.types';

export const ANALYSIS_PERIOD_OPTIONS: {
  value: AnalysisPeriod;
  label: string;
  comment: string;
}[] = [
  {
    value: '1w',
    label: '최근 1주',
    comment: '단기 이슈 및 급상승 트렌드 감지에 적합합니다.',
  },
  {
    value: '1m',
    label: '최근 1개월',
    comment: '캠페인 반응 및 단기 수요 변화를 분석합니다.',
  },
  {
    value: '3m',
    label: '최근 3개월',
    comment: '안정적인 Context 패턴과 반복 검색 행동을 파악합니다.',
  },
  {
    value: '6m',
    label: '최근 6개월',
    comment: '중기 트렌드와 구조적 수요를 분석하기에 적합합니다.',
  },
  {
    value: '1y',
    label: '최근 1년',
    comment: '계절성 및 장기 Context 구조를 파악할 수 있습니다.',
  },
];
