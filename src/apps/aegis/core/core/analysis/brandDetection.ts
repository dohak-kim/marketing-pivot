import { SerpRawRow } from "../types/serpRaw";

export function calculateBrandPresence(
  rows: SerpRawRow[],
  myBrand: string,
  competitors: string[]
) {
  const brands = [myBrand, ...competitors];
  const counts: Record<string, number> = {};

  brands.forEach(b => {
    counts[b.toLowerCase()] = 0;
  });

  rows.forEach(row => {
    const text = (
      row.title + " " +
      row.snippet + " " +
      row.uri
    ).toLowerCase();

    brands.forEach(brand => {
      const b = brand.toLowerCase();
      if (text.includes(b)) {
        counts[b] += 1;
      }
    });
  });

  return brands.map(brand => ({
    brand,
    count: counts[brand.toLowerCase()]
  }));
}