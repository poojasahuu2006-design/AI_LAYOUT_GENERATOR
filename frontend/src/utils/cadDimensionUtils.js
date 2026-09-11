/**
 * Architectural CAD Dimension & Unit Formatting Utility
 * Adheres to IS 962:1989 & standard architectural drafting conventions
 */

/**
 * Converts decimal feet value to architectural Feet & Inches string
 * Example: 26.417 -> 26'-5", 14.75 -> 14'-9", 30 -> 30'-0"
 */
export function formatFeetInches(valInFeet) {
  if (valInFeet === undefined || valInFeet === null || isNaN(valInFeet)) return "0'-0\"";
  const num = Math.max(0, Number(valInFeet));
  const feet = Math.floor(num);
  const inches = Math.round((num - feet) * 12);
  
  if (inches === 12) {
    return `${feet + 1}'-0"`;
  }
  return `${feet}'-${inches}"`;
}

/**
 * Formats a dimension according to active unit mode:
 * 'ft-in': "26'-5\""
 * 'ft': "26.5 ft"
 * 'm': "8.08 m"
 */
export function formatDimension(valInFeet, unitMode = 'ft-in') {
  if (valInFeet === undefined || valInFeet === null || isNaN(valInFeet)) return "0";
  const num = Math.max(0, Number(valInFeet));

  if (unitMode === 'ft-in') {
    return formatFeetInches(num);
  }
  if (unitMode === 'm') {
    const meters = Math.round((num * 0.3048) * 100) / 100;
    return `${meters} m`;
  }
  return `${Math.round(num * 10) / 10} ft`;
}

/**
 * Formats room dimensions as Width × Length
 * Example: "26'-5\" × 14'-9\""
 */
export function formatRoomDimensions(widthInFeet, heightInFeet, unitMode = 'ft-in') {
  const w = formatDimension(widthInFeet, unitMode);
  const h = formatDimension(heightInFeet, unitMode);
  return `${w} × ${h}`;
}

/**
 * Formats area according to active unit mode:
 * 'ft-in' or 'ft': "390.23 SQ.FT"
 * 'm': "36.25 SQ.M"
 */
export function formatArea(areaInSqFeet, unitMode = 'ft-in') {
  if (areaInSqFeet === undefined || areaInSqFeet === null || isNaN(areaInSqFeet)) return "0 SQ.FT";
  const num = Math.max(0, Number(areaInSqFeet));

  if (unitMode === 'm') {
    const sqM = Math.round((num * 0.092903) * 100) / 100;
    return `${sqM.toLocaleString('en-IN')} SQ.M`;
  }
  return `${(Math.round(num * 100) / 100).toLocaleString('en-IN')} SQ.FT`;
}

/**
 * Calculates standard setbacks according to NBC 2016 / Local bye-laws based on plot size
 */
export function calculateSetbacks(plotWidth, plotLength) {
  const front = plotLength >= 40 ? 5.0 : 3.5;
  const rear = plotLength >= 40 ? 3.0 : 2.5;
  const sideLeft = plotWidth >= 30 ? 2.5 : 1.5;
  const sideRight = plotWidth >= 30 ? 2.5 : 1.5;

  return {
    front,
    rear,
    sideLeft,
    sideRight,
    envelopeWidth: plotWidth + sideLeft + sideRight,
    envelopeLength: plotLength + front + rear
  };
}
