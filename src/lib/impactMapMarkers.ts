import type { ImpactLayerType } from './impactMap'

export const IMPACT_MARKER_COLORS: Record<
  ImpactLayerType,
  { fill: string; ring: string }
> = {
  volunteer: { fill: '#059669', ring: '#047857' },
  civic_action: { fill: '#4f46e5', ring: '#4338ca' },
  issue: { fill: '#e11d48', ring: '#be123c' },
  relief: { fill: '#d97706', ring: '#b45309' },
}

/** SVG pin for Google Maps Marker icon */
export function createImpactMarkerIconUrl(
  layerType: ImpactLayerType,
  selected: boolean,
): string {
  const { fill, ring } = IMPACT_MARKER_COLORS[layerType]
  const size = selected ? 36 : 28
  const border = selected ? 3 : 2
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - border}" fill="${fill}" stroke="white" stroke-width="${border}"/>
    ${selected ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="none" stroke="${ring}" stroke-width="2"/>` : ''}
  </svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}
