import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polygon, Popup, Tooltip as LTooltip } from 'react-leaflet';
import { MOCK_ZONES, STATUS_COLORS } from '../data/mockData';
import { MAP_CONFIG } from '../mapConfig';
import 'leaflet/dist/leaflet.css';

const RECHARGE = [
  { name: 'Nandi Hills Watershed', type: 'Natural Recharge', coords: [[13.35,77.65],[13.40,77.72],[13.38,77.70],[13.33,77.66]], color: '#10b981' },
  { name: 'Arkavathi River Basin', type: 'River Recharge', coords: [[13.20,77.52],[13.28,77.58],[13.22,77.62],[13.15,77.56]], color: '#3b82f6' },
  { name: 'Yelahanka Lake Catchment', type: 'Lake Recharge', coords: [[13.09,77.58],[13.12,77.62],[13.10,77.65],[13.07,77.61]], color: '#8b5cf6' },
];

const STRUCTURES = [
  { name: 'Percolation Ponds', desc: 'Shallow excavations that allow rainwater to seep into ground. Capacity: 45K–2.5L liters.', color: '#10b981' },
  { name: 'Recharge Shafts', desc: 'Vertical borings (30-60m) bypassing low-permeability layers. ROI: 3 years.', color: '#3b82f6' },
  { name: 'Check Dams', desc: 'Small barriers on seasonal streams to slow runoff and maximize infiltration.', color: '#f59e0b' },
  { name: 'Rooftop RWH', desc: 'Collects rooftop rainwater to sump/borewell pit. Mandatory >200 sqm. Payback: 2 years.', color: '#10b981' },
];

export default function RechargeZones() {
  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">🌿 Recharge Zone Map</div>
          <div className="card-badge">Geospatial</div>
        </div>
        <div style={{ height: 420 }}>
          <MapContainer 
            {...MAP_CONFIG}
            style={{ height: '100%', width: '100%', background: '#0a0a0f' }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OSM &copy; CARTO" />
            {MOCK_ZONES.map(z => (
              <CircleMarker key={z.id} center={[z.lat, z.lng]} radius={10} fillColor={STATUS_COLORS[z.status]} color={STATUS_COLORS[z.status]} fillOpacity={0.3} weight={1}>
                <LTooltip>{z.name}</LTooltip>
              </CircleMarker>
            ))}
            {RECHARGE.map((rz, i) => (
              <Polygon key={i} positions={rz.coords} pathOptions={{ color: rz.color, fillColor: rz.color, fillOpacity: 0.12, weight: 2, dashArray: '6,4' }}>
                <Popup><b style={{ color: rz.color }}>{rz.name}</b><br />{rz.type}</Popup>
              </Polygon>
            ))}
          </MapContainer>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">💦 Recharge Zones</div></div>
          <div className="card-body">
            {RECHARGE.map((rz, i) => (
              <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderLeft: `3px solid ${rz.color}`, borderRadius: 'var(--radius-sm)', padding: 12, marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: rz.color }}>{rz.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{rz.type}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">🏗 Recommended Structures</div></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {STRUCTURES.map((s, i) => (
              <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 12 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: s.color, marginBottom: 4 }}>{s.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
