
import React from 'react';

const guideData = [
  {
    level: 'Level 1',
    title: '광범위한 주제 / 제품 카테고리',
    description: '시장의 전반적인 트렌드를 파악하고, 잠재고객의 초기 관심사를 발굴하고 싶을 때 사용합니다.',
    examples: ['친환경 여행', 'AI 마케팅 툴', '1인 가구 인테리어'],
    outcome: '주로 \'인지\'와 \'고려\' 단계의 키워드가 많이 추출됩니다. 시장의 수요와 고객의 일반적인 질문들을 파악하는 데 유용합니다.',
    borderColor: 'border-blue-500',
  },
  {
    level: 'Level 2',
    title: '특정 분야 / 브랜드',
    description: '특정 브랜드나 서비스에 대한 고객의 인식을 분석하고, 경쟁 환경을 파악하고 싶을 때 적합합니다.',
    examples: ['제주도 전기차 렌트', 'Gemini API', '오늘의집 서비스'],
    outcome: '모든 CDJ 단계의 키워드가 비교적 고르게 분포됩니다. 특히 \'고려\'와 \'결정\' 단계의 비교, 평가 관련 키워드를 통해 인사이트를 얻을 수 있습니다.',
    borderColor: 'border-purple-500',
  },
  {
    level: 'Level 3',
    title: '구체적인 제품 / 서비스명',
    description: '특정 제품의 구매를 고려하거나 이미 사용 중인 고객을 위한 콘텐츠 전략을 수립할 때 효과적입니다.',
    examples: ['아이오닉 5 롱레인지', 'Gemini 1.5 Pro 가격', '밀리의 서재 구독 방법'],
    outcome: '주로 \'결정\'과 \'사후 관리\' 단계의 키워드가 집중적으로 추출됩니다. 구매 전환율을 높이거나 고객 만족도를 향상시키는 콘텐츠 아이디어를 얻을 수 있습니다.',
    borderColor: 'border-green-500',
  },
];

export const InputGuide: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto mt-12">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-300">어떤 주제를 입력해야 할까요?</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {guideData.map((item) => (
          <div key={item.level} className={`bg-brand-light rounded-lg shadow-lg p-5 border-t-4 ${item.borderColor}`}>
            <p className="font-bold text-brand-gold">{item.level}</p>
            <h3 className="text-lg font-semibold text-white mt-1 mb-2">{item.title}</h3>
            <p className="text-sm text-gray-400 mb-4">{item.description}</p>
            
            <div className="text-sm">
                <p className="font-semibold text-gray-300 mb-1">입력 예시:</p>
                <ul className="list-disc list-inside text-gray-400 space-y-1 mb-4">
                    {item.examples.map(ex => <li key={ex}>{ex}</li>)}
                </ul>
                <p className="font-semibold text-gray-300 mb-1">예상 결과:</p>
                <p className="text-gray-400">{item.outcome}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
