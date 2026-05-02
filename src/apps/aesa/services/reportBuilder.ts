export function buildStrategyReport(data: any) {
  return {
    title: "Market Intelligence Report",
    sections: [
      {
        title: "Executive Summary",
        content: data.summary,
      },
      {
        title: "Market Overview",
        content: data.market,
      },
      {
        title: "Competitive Landscape",
        content: data.competition,
      },
      {
        title: "Consumer Insight",
        content: data.consumer,
      },
      {
        title: "Strategic Direction",
        content: data.strategy,
      },
      {
        title: "Action Guide",
        content: data.actions,
      },
    ],
  };
}

export function buildSlides(report: any) {
  return [
    { title: "Market Snapshot", content: report.market },
    { title: "Key Trends", content: report.trends },
    { title: "Competitive Landscape", content: report.competition },
    { title: "Consumer Insight", content: report.consumer },
    { title: "Strategic Direction", content: report.strategy },
    { title: "Action Guide", content: report.actions },
  ];
}
