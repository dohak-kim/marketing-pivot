import { SerpRawRow } from "../types/serpRaw";

export function groupByCluster(rows: SerpRawRow[]) {
  return rows.reduce((acc, row) => {
    if (!acc[row.context_cluster_id]) {
      acc[row.context_cluster_id] = [];
    }
    acc[row.context_cluster_id].push(row);
    return acc;
  }, {} as Record<string, SerpRawRow[]>);
}