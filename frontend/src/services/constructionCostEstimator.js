/**
 * Civil Construction Cost Estimator & Bill of Quantities (BOQ)
 * Calculated per standard Indian Building Norms (IS 456 / CPWD DSR Rates).
 */

export const CONSTRUCTION_PACKAGES = {
  economy: {
    name: 'Economy Class',
    ratePerSqFt: 1400,
    desc: 'Standard Red Brick, Fe500 Steel, Standard Vitrified Tiles, Semi-Gloss Emulsion'
  },
  standard: {
    name: 'Standard Executive',
    ratePerSqFt: 1850,
    desc: 'AAC Blockwork, Fe550D TMT Rebar, 2×2 Polished Vitrified, Premium Emulsion, Teak Wood Doors'
  },
  premium: {
    name: 'Luxury Premium',
    ratePerSqFt: 2500,
    desc: 'High-Grade RMC M25, Italian Marble / Wooden Flooring, UPVC Double Glazed, Jaguar/Kohler CP'
  }
};

export function calculateConstructionBOQ(builtUpAreaSqFt, packageType = 'standard', customRate = null) {
  const rate = customRate || (CONSTRUCTION_PACKAGES[packageType]?.ratePerSqFt || 1850);
  const totalCost = Math.round(builtUpAreaSqFt * rate);

  // Material Estimation Constants per sq.ft of Built-Up Area:
  // Cement: ~0.40 bags / sq.ft
  const cementBags = Math.round(builtUpAreaSqFt * 0.40);
  const cementCost = Math.round(cementBags * 410); // ₹410 per 50kg bag

  // Steel (TMT Rebars Fe550D): ~3.5 kg / sq.ft => metric tonnes
  const steelKg = Math.round(builtUpAreaSqFt * 3.6);
  const steelTonnes = Math.round((steelKg / 1000) * 100) / 100;
  const steelCost = Math.round(steelKg * 68); // ₹68/kg

  // Bricks / Blocks: ~18 bricks / sq.ft
  const bricksCount = Math.round(builtUpAreaSqFt * 18);
  const bricksCost = Math.round(bricksCount * 11); // ₹11/brick

  // River Sand / M-Sand: ~1.8 cu.ft / sq.ft
  const sandCuFt = Math.round(builtUpAreaSqFt * 1.8);
  const sandCost = Math.round(sandCuFt * 55); // ₹55/cu.ft

  // Aggregate (10mm/20mm): ~1.3 cu.ft / sq.ft
  const aggregateCuFt = Math.round(builtUpAreaSqFt * 1.3);
  const aggregateCost = Math.round(aggregateCuFt * 42); // ₹42/cu.ft

  // Vitrified Flooring Tiles: ~1.15 × built-up area
  const tilesSqFt = Math.round(builtUpAreaSqFt * 1.15);
  const tilesCost = Math.round(tilesSqFt * 75); // ₹75/sq.ft installed

  // Paint & Primer: ~0.18 liters / sq.ft
  const paintLiters = Math.round(builtUpAreaSqFt * 0.18);
  const paintCost = Math.round(paintLiters * 320);

  // Plumbing, Electrical, Doors & Windows Allowance (~18% of total)
  const fittingsCost = Math.round(totalCost * 0.18);

  // Labor / Masonry / Shuttering Workforce charges (~28% of total)
  const laborCost = Math.round(totalCost * 0.28);

  const materialsTotal = cementCost + steelCost + bricksCost + sandCost + aggregateCost + tilesCost + paintCost;

  return {
    builtUpAreaSqFt,
    ratePerSqFt: rate,
    packageType,
    totalCost,
    totalCostInLakhs: (totalCost / 100000).toFixed(2),
    materialBreakdown: [
      { item: 'Cement (OPC/PPC 53 Grade)', quantity: `${cementBags} bags (50kg)`, cost: cementCost, sharePct: Math.round((cementCost / totalCost) * 100) },
      { item: 'TMT Steel Rebars (Fe550D)', quantity: `${steelTonnes} MT (${steelKg} kg)`, cost: steelCost, sharePct: Math.round((steelCost / totalCost) * 100) },
      { item: 'Bricks / AAC Blockwork', quantity: `${bricksCount.toLocaleString()} units`, cost: bricksCost, sharePct: Math.round((bricksCost / totalCost) * 100) },
      { item: 'River / Manufactured Sand', quantity: `${sandCuFt.toLocaleString()} cu.ft`, cost: sandCost, sharePct: Math.round((sandCost / totalCost) * 100) },
      { item: 'Coarse Aggregate (20mm)', quantity: `${aggregateCuFt.toLocaleString()} cu.ft`, cost: aggregateCost, sharePct: Math.round((aggregateCost / totalCost) * 100) },
      { item: 'Vitrified Flooring & Dado Tiles', quantity: `${tilesSqFt.toLocaleString()} sq.ft`, cost: tilesCost, sharePct: Math.round((tilesCost / totalCost) * 100) },
      { item: 'Interior & Exterior Emulsion Paint', quantity: `${paintLiters} Liters`, cost: paintCost, sharePct: Math.round((paintCost / totalCost) * 100) },
      { item: 'Plumbing, Wiring & Fixtures', quantity: 'Turnkey allowance', cost: fittingsCost, sharePct: Math.round((fittingsCost / totalCost) * 100) },
      { item: 'Labor, Shuttering & Masonry', quantity: 'Turnkey workforce', cost: laborCost, sharePct: Math.round((laborCost / totalCost) * 100) }
    ],
    materialsTotal,
    laborCost,
    fittingsCost
  };
}
