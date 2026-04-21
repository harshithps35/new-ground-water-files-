import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { apiFetch } from '../api';
import { Map as MapIcon, Table, Search, Droplets, Info, MapPin, Filter, ChevronDown } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const ZONE_COLORS = {
  'RR Nagar': '#f59e0b', 'Mahadevapura': '#6366f1', 'South': '#10b981', 'East': '#3b82f6',
  'West': '#f43f5e', 'Bommanahalli': '#8b5cf6', 'Yelahanka': '#06b6d4', 'Dasarahalli': '#ec4899', 'Other': '#94a3b8'
};

export default function BorewellInventory() {
  const [data, setData] = useState([]);
  const [zones, setZones] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedZone, setSelectedZone] = useState('all');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('map');

  const fetchData = async (zone = 'all') => {
    setLoading(true);
    const q = zone !== 'all' ? `?zone=${encodeURIComponent(zone)}` : '';
    const res = await apiFetch(`/api/borewells${q}`);
    if (res?.success) {
      setData(res.data);
      setTotalCount(res.total);
      if (res.zones) setZones(res.zones);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleZoneChange = (zone) => {
    setSelectedZone(zone);
    fetchData(zone);
  };

  const filtered = useMemo(() => {
    if (!search) return data;
    const s = search.toLowerCase();
    return data.filter(b =>
      b.id.toString().includes(s) ||
      b.pipe?.toLowerCase().includes(s) ||
      b.pump?.toLowerCase().includes(s) ||
      b.zone?.toLowerCase().includes(s)
    );
  }, [data, search]);

  const pipeStats = useMemo(() => {
    const gi = data.filter(d => d.pipe === 'GI').length;
    const pvc = data.filter(d => d.pipe === 'PVC').length;
    const other = data.length - gi - pvc;
    return { gi, pvc, other };
  }, [data]);

  const mapCenter = useMemo(() => {
    if (filtered.length === 0) return [12.9716, 77.5946];
    const avgLat = filtered.reduce((a, b) => a + b.lat, 0) / filtered.length;
    const avgLng = filtered.reduce((a, b) => a + b.lng, 0) / filtered.length;
    return [avgLat, avgLng];
  }, [filtered]);

  return (
    <div>
      {/* Zone Selector Cards */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        <button onClick={() => handleZoneChange('all')}
          style={{ padding: '10px 18px', borderRadius: 10, border: selectedZone === 'all' ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
            background: selectedZone === 'all' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)', color: selectedZone === 'all' ? '#818cf8' : '#94a3b8',
            cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap', transition: 'all 0.2s', flexShrink: 0 }}>
          All Zones <span style={{ opacity: 0.6, marginLeft: 4 }}>({totalCount})</span>
        </button>
        {zones.map(z => (
          <button key={z.name} onClick={() => handleZoneChange(z.name)}
            style={{ padding: '10px 18px', borderRadius: 10,
              border: selectedZone === z.name ? `2px solid ${ZONE_COLORS[z.name] || '#6366f1'}` : '1px solid rgba(255,255,255,0.08)',
              background: selectedZone === z.name ? (ZONE_COLORS[z.name] || '#6366f1') + '20' : 'rgba(255,255,255,0.03)',
              color: selectedZone === z.name ? ZONE_COLORS[z.name] || '#818cf8' : '#94a3b8',
              cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap', transition: 'all 0.2s', flexShrink: 0 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: ZONE_COLORS[z.name] || '#94a3b8', marginRight: 6 }} />
            {z.name} <span style={{ opacity: 0.6, marginLeft: 4 }}>({z.count})</span>
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <div className="stat-card" style={{ '--stat-accent': '#6366f1' }}>
          <div className="stat-label"><MapPin size={12} /> Active Borewells</div>
          <div className="stat-value">{data.length.toLocaleString()}</div>
          <div className="stat-sub">{selectedZone === 'all' ? 'All BBMP Zones' : selectedZone}</div>
        </div>
        <div className="stat-card" style={{ '--stat-accent': '#3b82f6' }}>
          <div className="stat-label"><Droplets size={12} /> GI Pipes</div>
          <div className="stat-value" style={{ color: '#3b82f6' }}>{pipeStats.gi.toLocaleString()}</div>
          <div className="stat-sub">Galvanized Iron</div>
        </div>
        <div className="stat-card" style={{ '--stat-accent': '#10b981' }}>
          <div className="stat-label"><Droplets size={12} /> PVC Pipes</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{pipeStats.pvc.toLocaleString()}</div>
          <div className="stat-sub">Polyvinyl Chloride</div>
        </div>
        <div className="stat-card" style={{ '--stat-accent': '#f59e0b' }}>
          <div className="stat-label"><Filter size={12} /> Coverage</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{zones.length}</div>
          <div className="stat-sub">BBMP Zones mapped</div>
        </div>
      </div>

      {/* Main Card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header" style={{ padding: '10px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input type="text" placeholder="Search ID, pipe, pump, zone..."
                className="form-input" style={{ paddingLeft: 32, width: '100%', fontSize: '0.8rem', padding: '6px 10px 6px 32px' }}
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 3 }}>
              {[['map', MapIcon, 'Map'], ['list', Table, 'List']].map(([k, Icon, label]) => (
                <button key={k} onClick={() => setView(k)}
                  style={{ padding: '5px 12px', border: 'none', background: view === k ? '#6366f1' : 'transparent',
                    color: view === k ? '#fff' : '#94a3b8', borderRadius: 6, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', fontWeight: 600 }}>
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ height: 440, position: 'relative' }}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,15,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
              <div className="spinner" />
              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Loading borewells...</div>
            </div>
          )}

          {view === 'map' ? (
            <MapContainer key={selectedZone} center={mapCenter} zoom={selectedZone === 'all' ? 11 : 12}
              style={{ height: '100%', width: '100%', borderRadius: '0 0 12px 12px' }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OSM &copy; CARTO' />
              {filtered.slice(0, 3000).map((b, i) => (
                <CircleMarker key={i} center={[b.lat, b.lng]} radius={3}
                  pathOptions={{ fillColor: ZONE_COLORS[b.zone] || '#6366f1', color: '#fff', weight: 0.4, fillOpacity: 0.85 }}>
                  <Popup>
                    <div style={{ color: '#12121a', padding: '2px 0', minWidth: 140 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: 3 }}>Borewell #{b.id}</div>
                      <div style={{ fontSize: '0.72rem', marginBottom: 1 }}><strong>Zone:</strong> {b.zone}</div>
                      <div style={{ fontSize: '0.72rem', marginBottom: 1 }}><strong>Pipe:</strong> {b.pipe}</div>
                      <div style={{ fontSize: '0.72rem', marginBottom: 1 }}><strong>Pump:</strong> {b.pump}</div>
                      <div style={{ fontSize: '0.72rem' }}><strong>Coords:</strong> {b.lat.toFixed(4)}, {b.lng.toFixed(4)}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          ) : (
            <div style={{ overflow: 'auto', height: '100%' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Zone</th><th>Pipe</th><th>Pump</th><th>Coordinates</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 200).map((b, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{b.id}</td>
                      <td><span style={{ color: ZONE_COLORS[b.zone] || '#94a3b8', fontWeight: 600 }}>{b.zone}</span></td>
                      <td><span className={`status-tag ${b.pipe === 'GI' ? 'live' : 'good'}`}>{b.pipe}</span></td>
                      <td>{b.pump}</td>
                      <td style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{b.lat.toFixed(5)}, {b.lng.toFixed(5)}</td>
                      <td><span className="status-tag good">Working</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > 200 && (
                <div style={{ padding: 12, textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  Showing 200 of {filtered.length.toLocaleString()} — use search or zone filter to refine.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="card">
        <div className="card-header"><div className="card-title"><Info size={16} /> Zone Legend & Dataset Info</div></div>
        <div className="card-body">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            {zones.map(z => (
              <div key={z.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#cbd5e1' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: ZONE_COLORS[z.name] || '#94a3b8', flexShrink: 0 }} />
                <strong>{z.name}</strong> ({z.count})
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6 }}>
            Source: <strong>BWSSB / BBMP</strong> via OpenCity Bengaluru. All {totalCount.toLocaleString()} borewells in this registry are classified as <strong style={{ color: '#10b981' }}>Working</strong> — the original dataset contains no failure/closure flags. Zones are derived from geographic coordinates mapped to BBMP ward boundaries.
          </p>
        </div>
      </div>
    </div>
  );
}
