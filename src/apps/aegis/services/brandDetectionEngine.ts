
import { BrandPresence } from "../core/context";

// Interface compatible with RawDataItem from App.tsx
export interface SerpRow {
  title: string;
  snippet: string;
  uri: string;
  context_cluster_id: string;
  [key: string]: any;
}

export function calculateBrandPresence(
  serpRows: SerpRow[],
  myBrand: string,
  competitors: string[]
): BrandPresence[] {
  if (!myBrand) return [];

  // Normalize brands
  const targetBrands = [myBrand, ...competitors]
    .filter(b => b && b.trim().length > 0);

  // Initialize counters
  const stats: Record<string, number> = {};
  targetBrands.forEach(b => {
    stats[b.toLowerCase()] = 0;
  });

  // Scan rows
  serpRows.forEach(row => {
    const text = `${row.title || ""} ${row.snippet || ""} ${row.uri || ""}`.toLowerCase();
    
    targetBrands.forEach(brand => {
      if (text.includes(brand.toLowerCase())) {
        stats[brand.toLowerCase()] += 1;
      }
    });
  });

  return targetBrands.map(brand => ({
    brand,
    count: stats[brand.toLowerCase()]
  }));
}

export function groupByContext(serpRows: SerpRow[]) {
  return serpRows.reduce((acc, row) => {
    // Default to 'unknown' if cluster ID is missing
    const id = row.context_cluster_id || 'unknown';
    if (!acc[id]) {
      acc[id] = [];
    }
    acc[id].push(row);
    return acc;
  }, {} as Record<string, SerpRow[]>);
}
