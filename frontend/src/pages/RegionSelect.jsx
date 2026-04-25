import { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { MAP_CONFIG } from '../mapConfig';
import { MOCK_ZONES, STATUS_COLORS, STATUS_LABELS } from '../data/mockData';
import { MapPin, ChevronRight, Droplets, Activity, Waves } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

export default function RegionSelect({ onSelect }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.logoRow}>
            <div style={styles.logoMark}><Droplets size={22} /></div>
            <div style={styles.logoText}>Aqua<span style={{ color: '#818cf8' }}>Trace</span></div>
          </div>
          <h2 style={styles.title}><MapPin size={20} style={{ color: '#6366f1' }} /> Select Your Region</h2>
          <p style={styles.subtitle}>Choose a North Bengaluru zone to monitor groundwater, rainfall, GRACE satellite data, and IoT sensors.</p>
        </div>

        {/* Map */}
        <div style={styles.mapCard}>
          <div style={{ height: 300, borderRadius: 12, overflow: 'hidden' }}>
            <MapContainer
              {...MAP_CONFIG}
              style={{ height: '100%', width: '100%', background: '#0a0a0f' }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OSM &copy; CARTO" />
              {MOCK_ZONES.map(zone => {
                const col = STATUS_COLORS[zone.status];
                return (
                  <CircleMarker
                    key={zone.id}
                    center={[zone.lat, zone.lng]}
                    radius={14}
                    fillColor={col}
                    color={col}
                    fillOpacity={0.4}
                    weight={2}
                    opacity={0.9}
                    eventHandlers={{
                      click: () => onSelect(zone),
                      mouseover: () => setHovered(zone.id),
                      mouseout: () => setHovered(null)
                    }}
                  >
                    <Popup>
                      <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 160 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: 4 }}>{zone.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>Depth: <strong>{zone.groundwaterLevel}m</strong></div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>GRACE: <strong style={{ color: zone.graceAnomaly < 0 ? '#f43f5e' : '#10b981' }}>{zone.graceAnomaly} cm</strong></div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>Status: <strong style={{ color: col }}>{STATUS_LABELS[zone.status]}</strong></div>
                        <button onClick={() => onSelect(zone)} style={{ marginTop: 8, padding: '4px 12px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>Select Zone →</button>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Zone Grid */}
        <div style={styles.grid}>
          {MOCK_ZONES.map(zone => {
            const col = STATUS_COLORS[zone.status];
            const isHov = hovered === zone.id;
            return (
              <button
                key={zone.id}
                onClick={() => onSelect(zone)}
                onMouseEnter={() => setHovered(zone.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  ...styles.zoneCard,
                  borderColor: isHov ? col : 'rgba(255,255,255,0.06)',
                  background: isHov ? `${col}10` : 'rgba(18,18,26,0.7)',
                  transform: isHov ? 'translateY(-2px)' : 'none',
                  boxShadow: isHov ? `0 8px 30px ${col}20` : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f0f0f5' }}>{zone.name}</div>
                  <div style={{
                    fontSize: '0.6rem', fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                    background: `${col}18`, color: col, border: `1px solid ${col}30`,
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>
                    {STATUS_LABELS[zone.status]}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                  <div style={styles.miniStat}>
                    <div style={styles.miniLabel}><Waves size={10} /> Depth</div>
                    <div style={{ ...styles.miniVal, color: col }}>{zone.groundwaterLevel}m</div>
                  </div>
                  <div style={styles.miniStat}>
                    <div style={styles.miniLabel}><Activity size={10} /> GRACE</div>
                    <div style={{ ...styles.miniVal, color: zone.graceAnomaly < 0 ? '#f43f5e' : '#10b981' }}>{zone.graceAnomaly}cm</div>
                  </div>
                  <div style={styles.miniStat}>
                    <div style={styles.miniLabel}><MapPin size={10} /> Wells</div>
                    <div style={{ ...styles.miniVal, color: '#3b82f6' }}>{zone.borewellCount}</div>
                  </div>
                </div>
                <div style={styles.selectArrow}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#818cf8' }}>Select</span>
                  <ChevronRight size={14} style={{ color: '#818cf8' }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0a0a0f', position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center' },
  bgGlow1: { position: 'fixed', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)', top: '-10%', left: '-5%', pointerEvents: 'none' },
  bgGlow2: { position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.06), transparent 70%)', bottom: '-10%', right: '-5%', pointerEvents: 'none' },
  container: { position: 'relative', zIndex: 10, width: '100%', maxWidth: 1100, padding: '40px 24px', margin: '0 auto' },
  header: { textAlign: 'center', marginBottom: 32 },
  logoRow: { display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 16 },
  logoMark: { width: 44, height: 44, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' },
  logoText: { fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.03em', color: '#f0f0f5' },
  title: { fontSize: '1.4rem', fontWeight: 800, color: '#f0f0f5', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' },
  subtitle: { fontSize: '0.85rem', color: '#55556a', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 },
  mapCard: { background: 'rgba(18,18,26,0.9)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 4, marginBottom: 28, boxShadow: '0 8px 40px rgba(0,0,0,0.4)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 },
  zoneCard: {
    padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)',
    cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif',
    transition: 'all 0.25s ease', position: 'relative'
  },
  miniStat: { textAlign: 'center' },
  miniLabel: { fontSize: '0.6rem', color: '#55556a', fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 },
  miniVal: { fontSize: '0.8rem', fontWeight: 800 },
  selectArrow: { display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 10, opacity: 0.7 },
};
