import L from 'leaflet'
import type { ImpactLayerType } from '../../lib/impactMap'

const MARKER_COLORS: Record<ImpactLayerType, { bg: string; ring: string }> = {
  volunteer: { bg: '#059669', ring: '#047857' },
  civic_action: { bg: '#4f46e5', ring: '#4338ca' },
  issue: { bg: '#e11d48', ring: '#be123c' },
}

export function createImpactMarkerIcon(
  layerType: ImpactLayerType,
  selected: boolean,
): L.DivIcon {
  const { bg, ring } = MARKER_COLORS[layerType]
  const size = selected ? 36 : 28
  const border = selected ? 3 : 2

  return L.divIcon({
    className: 'impact-map-marker',
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:${size}px;height:${size}px;border-radius:50%;
      background:${bg};border:${border}px solid white;
      box-shadow:0 2px 8px rgba(15,23,42,0.35);
      outline:2px solid ${selected ? ring : 'transparent'};
    "></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}
