import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Droplets, Radio, Satellite, MapPin, TrendingDown } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { apiFetch } from '../api';
import { MAP_CONFIG } from '../mapConfig';
import { MOCK_ZONES, GRACE_DATA, STATUS_COLORS, STATUS_LABELS, depthToPercent } from '../data/mockData';
import 'leaflet/dist/leaflet.css';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [zones, setZones] = useState([]);
  const [graceData, setGraceData] = useState([]);

  useEffect(() => {
    (async () => {
      // Fetch summary
      const s = await apiFetch('/api/summary');
      const b = await apiFetch('/api/borewells');
      if (s?.success) {
        const finalSummary = { ...s.data };
        if (b?.success) finalSummary.total_borewells_monitored = b.count;
        setSummary(finalSummary);
      } else {
        setSummary({ 
          critical_zones: 7, 
          average_water_table_depth_m: '15.6', 
          total_borewells_monitored: b?.success ? b.count : 7438, 
          overall_grace_anomaly_cm: -8.6, 
          iot_sensors_online: 11, 
          total_zones_monitored: 12 
        });
      }

      // Fetch zones from backend (live data with real-time simulation)
      const z = await apiFetch('/api/zones');
      setZones(z?.success ? z.data : MOCK_ZONES);

      // Fetch GRACE data from backend
      const g = await apiFetch('/api/grace');
      setGraceData(g?.success ? g.data : GRACE_DATA);
    })();
  }, []);

  const stats = summary ? [
    { label: 'Critical Zones', value: summary.critical_zones, color: '#f43f5e', icon: <AlertTriangle size={16} />, sub: 'Require immediate action' },
    { label: 'Avg Depth', value: summary.average_water_table_depth_m + 'm', color: '#f59e0b', icon: <TrendingDown size={16} />, sub: 'Below ground level' },
    { label: 'Borewells', value: summary.total_borewells_monitored.toLocaleString(), color: '#3b82f6', icon: <MapPin size={16} />, sub: 'Monitored across zones' },
    { label: 'GRACE Anomaly', value: summary.overall_grace_anomaly_cm + ' cm', color: '#f43f5e', icon: <Satellite size={16} />, sub: 'Water equivalent' },
    { label: 'IoT Online', value: summary.iot_sensors_online + '/12', color: '#10b981', icon: <Radio size={16} />, sub: 'Sensors active' },
    { label: 'Zones', value: summary.total_zones_monitored, color: '#6366f1', icon: <Droplets size={16} />, sub: 'North Bangalore' },
  ] : [];

  const chartData = graceData.map(d => ({ ...d, fill: d.anomaly >= 0 ? '#10b981' : '#f43f5e' }));

  return (
    <div>
      <div className="stat-grid">
        {stats.map((s, i) => (
          <div className="stat-card" key={i} style={{ '--stat-accent': s.color }}>
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: s.color }}>{s.icon}</span> {s.label}
            </div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* MAP */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title"><MapPin size={16} /> Groundwater Depth Map — North Bangalore</div>
          <div className="card-badge">Live · Leaflet + GRACE</div>
        </div>
        <div style={{ height: 380 }}>
          {zones.length > 0 && (
            <MapContainer 
              {...MAP_CONFIG}
              style={{ height: '100%', width: '100%', background: '#0a0a0f', borderRadius: '0 0 12px 12px' }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OSM &copy; CARTO" />
              {zones.map(zone => {
                const col = STATUS_COLORS[zone.status];
                const graceSign = zone.graceAnomaly > 0 ? '+' : '';
                return (
                  <CircleMarker key={zone.id} center={[zone.lat, zone.lng]}
                    radius={12 + Math.min(zone.groundwaterLevel, 15) * 0.5}
                    fillColor={col} color={col} fillOpacity={0.35} weight={2} opacity={0.8}>
                    <Popup>
                      <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 180 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 6 }}>{zone.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: 3 }}>Status: <span style={{ color: col, fontWeight: 700 }}>{STATUS_LABELS[zone.status]}</span></div>
                        <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: 3 }}>Depth: <strong>{zone.groundwaterLevel}m</strong></div>
                        <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: 3 }}>GRACE: <span style={{ color: zone.graceAnomaly < 0 ? '#f43f5e' : '#10b981', fontWeight: 600 }}>{graceSign}{zone.graceAnomaly} cm</span></div>
                        <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: 3 }}>Recharge: <strong>{zone.rechargeRate} mm/day</strong></div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>Borewells: <strong>{zone.borewellCount.toLocaleString()}</strong></div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20, gridTemplateColumns: '1fr 360px' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Satellite size={16} /> GRACE TWS Anomaly Trend</div>
            <div className="card-badge">15-Month</div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="graceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis dataKey="month" tick={{ fill: '#55556a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#55556a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: 8, color: '#f0f0f5', fontSize: 13 }} />
                <Area type="monotone" dataKey="anomaly" stroke="#f43f5e" fill="url(#graceGrad)" strokeWidth={2} dot={{ fill: '#f43f5e', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title"><MapPin size={16} /> Zone Readings</div>
            <div className="card-badge">{zones.length} Zones</div>
          </div>
          <div className="card-body" style={{ padding: '12px 14px' }}>
            <div className="zone-list">
              {zones.map(zone => {
                const pct = depthToPercent(zone.groundwaterLevel);
                const col = STATUS_COLORS[zone.status];
                return (
                  <div className="zone-item" key={zone.id}>
                    <div className="zone-top">
                      <div className="zone-name">{zone.name}</div>
                      <div className="zone-status" style={{ background: col + '18', color: col, border: `1px solid ${col}30` }}>
                        {STATUS_LABELS[zone.status]}
                      </div>
                    </div>
                    <div className="bar-wrap">
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: pct + '%', background: col }} />
                      </div>
                      <div className="bar-label" style={{ color: col }}>{zone.groundwaterLevel}m</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
