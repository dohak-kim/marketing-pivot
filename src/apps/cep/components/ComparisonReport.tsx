import React, { useState } from 'react';
import ErrorMessage from './ErrorMessage';
import Loader from './Loader';

interface ComparisonReportProps {
    onCompare: (period_a: string, period_b: string) => void;
    isLoading: boolean;
    report: string | null;
    error: string | null;
    query: string;
    // FIX: Add isLightMode to the props interface to resolve the type error in App.tsx
    isLightMode?: boolean;
}

const SimpleBarChart = () => {
    const data = [
        { label: '기존 관심도', value: 70, color: 'bg-teal-500' },
        { label: '신규 트렌드 유입', value: 30, color: 'bg-sky-500' },
    ];

    return (
        <div className="w-full bg-slate-900/50 p-4 rounded-lg mt-4">
            <h4 className="text-sm font-semibold text-slate-300 mb-3">관심도 변화 시각화 (예시)</h4>
            <div className="flex h-8 rounded-md overflow-hidden">
                {data.map(item => (
                    <div key={item.label} style={{ width: `${item.value}%` }} className={`${item.color} transition-all duration-500`}></div>
                ))}
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-2 px-1">
                {data.map(item => (
                    <div key={item.label} className="flex items-center">
                        <span className={`w-2 h-2 rounded-full ${item.color} mr-2`}></span>
                        {item.label} ({item.value}%)
                    </div>
                ))}
            </div>
        </div>
    );
};


const ComparisonReport: React.FC<ComparisonReportProps> = ({ onCompare, isLoading, report, error, query, isLightMode }) => {
    const [periodA, setPeriodA] = useState('qdr:y'); // 최근 1년
    const [periodB, setPeriodB] = useState('qdr:m'); // 최근 한 달

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCompare(periodA, periodB);
    };

    const formatReport = (text: string) => {
        return text
            .split('\n')
            .map((line, index) => {
                if (line.startsWith('## ')) {
                    return <h3 key={index} className="text-2xl font-bold text-teal-400 mt-6 mb-3">{line.substring(3)}</h3>;
                }
                if (line.startsWith('- ')) {
                    return <li key={index} className="ml-5 text-slate-300">{line.substring(2)}</li>;
                }
                return <p key={index} className="text-slate-400 mb-2">{line}</p>;
            });
    };

    return (
        <div className={`${isLightMode ? 'bg-white border-slate-200 shadow-xl' : 'bg-slate-800/50 border-slate-700 shadow-2xl'} border rounded-xl p-6 sm:p-8 transition-colors duration-500`}>
            <header className={`border-b ${isLightMode ? 'border-teal-500/20' : 'border-teal-500/30'} pb-4 mb-6`}>
                <h2 className={`text-3xl font-bold ${isLightMode ? 'text-slate-900' : 'text-slate-100'}`}>
                    📊 기간별 트렌드 비교 리포트
                </h2>
                <p className={`${isLightMode ? 'text-slate-600' : 'text-slate-400'} mt-1`}>
                    '{query}'에 대한 기간별 소비자 관심사 변화를 분석합니다.
                </p>
            </header>
            
            <form onSubmit={handleSubmit} className="flex items-end gap-4 flex-wrap">
                <div className="flex-1 min-w-[150px]">
                    <label htmlFor="period-a" className={`block text-sm font-semibold ${isLightMode ? 'text-slate-700' : 'text-slate-400'} mb-1`}>기준 기간 (Base)</label>
                    <select
                        id="period-a"
                        value={periodA}
                        onChange={(e) => setPeriodA(e.target.value)}
                        disabled={isLoading}
                        className={`w-full ${isLightMode ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-600 text-slate-300'} border rounded-lg p-2 focus:ring-1 focus:ring-teal-500 focus:border-teal-500`}
                    >
                        <option value="qdr:y">최근 1년</option>
                        <option value="qdr:m6">최근 6개월</option>
                    </select>
                </div>

                <div className="flex-1 min-w-[150px]">
                    <label htmlFor="period-b" className={`block text-sm font-semibold ${isLightMode ? 'text-slate-700' : 'text-slate-400'} mb-1`}>비교 기간 (Trend)</label>
                    <select
                        id="period-b"
                        value={periodB}
                        onChange={(e) => setPeriodB(e.target.value)}
                        disabled={isLoading}
                        className={`w-full ${isLightMode ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-600 text-slate-300'} border rounded-lg p-2 focus:ring-1 focus:ring-teal-500 focus:border-teal-500`}
                    >
                        <option value="qdr:w">최근 일주일</option>
                        <option value="qdr:m">최근 한 달</option>
                    </select>
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-300 shadow-lg"
                >
                    {isLoading ? '분석 중...' : '비교 리포트 생성'}
                </button>
            </form>

            <div className="mt-6">
                {isLoading && <Loader message="두 기간의 데이터를 대조 분석 중입니다..." />}
                {error && <ErrorMessage message={error} />}
                {report && (
                     <div className={`${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/30 border-slate-700'} border rounded-lg p-6 mt-4 animate-fade-in`}>
                        <SimpleBarChart />
                        <article className={`prose ${isLightMode ? 'prose-slate' : 'prose-invert'} prose-headings:text-teal-400 prose-strong:text-slate-200 max-w-none`}>
                            {formatReport(report)}
                        </article>
                    </div>
                )}
            </div>
             <style>{`
                @keyframes fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                animation: fade-in 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default ComparisonReport;