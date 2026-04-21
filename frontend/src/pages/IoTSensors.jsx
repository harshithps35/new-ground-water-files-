import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { MOCK_ZONES, STATUS_COLORS, depthToPercent } from '../data/mockData';

export default function IoTSensors() {
  const [sensors, setSensors] = useState([]);
  const [health, setHealth] = useState({ total_sensors: 12, online: 11, offline: 1, avg_battery: 75 });

  useEffect(() => {
    (async () => {
      const data = await apiFetch('/api/iot/sensors');
      if (data?.success) { setSensors(data.data); setHealth(data.network_health); }
      else {
        setSensors(MOCK_ZONES.map(z => ({
          sensor_id: z.iotSensorId, zone: z.name,
          readings: { water_table_depth_m: +(z.groundwaterLevel + (Math.random()-0.5)*0.3).toFixed(2), ph: +(Math.random()*2+6.5).toFixed(2), tds_ppm: +(Math.random()*400+200).toFixed(0), turbidity_ntu: +(Math.random()*15+0.5).toFixed(1), temperature_c: +(Math.random()*5+24).toFixed(1), battery_percent: Math.floor(Math.random()*40+60), online: Math.random() > 0.1 }
        })));
      }
    })();
  }, []);

  return (
    <div>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div className="stat-card" style={{ '--stat-accent': '#3b82f6' }}><div className="stat-label">Total</div><div className="stat-value" style={{ color: '#3b82f6' }}>{health.total_sensors}</div></div>
        <div className="stat-card" style={{ '--stat-accent': '#10b981' }}><div className="stat-label">Online</div><div className="stat-value" style={{ color: '#10b981' }}>{health.online}</div></div>
        <div className="stat-card" style={{ '--stat-accent': '#f43f5e' }}><div className="stat-label">Offline</div><div className="stat-value" style={{ color: '#f43f5e' }}>{health.offline}</div></div>
        <div className="stat-card" style={{ '--stat-accent': '#f59e0b' }}><div className="stat-label">Avg Battery</div><div className="stat-value" style={{ color: '#f59e0b' }}>{health.avg_battery}%</div></div>
      </div>

      <div className="grid-auto">
        {sensors.map((s, i) => {
          const zone = MOCK_ZONES.find(z => z.iotSensorId === s.sensor_id) || {};
          const col = STATUS_COLORS[zone.status] || '#3b82f6';
          const r = s.readings;
          return (
            <div className="sensor-card" key={i} style={{ opacity: r.online ? 1 : 0.5 }}>
              <div className="sensor-header">
                <div>
                  <div className="sensor-id">{s.sensor_id}</div>
                  <div className="sensor-zone">{s.zone}</div>
                </div>
                <div className={r.online ? 'dot-on' : 'dot-off'} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span className="metric-label">Water Table</span>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: col }}>{r.water_table_depth_m}m</span>
                </div>
                <div className="bar-track"><div className="bar-fill" style={{ width: depthToPercent(r.water_table_depth_m) + '%', background: col }} /></div>
              </div>
              <div className="metric-grid">
                <div className="metric-box"><div className="metric-label">pH</div><div className={`metric-val ${r.ph < 6.5 || r.ph > 8.5 ? 'alert' : ''}`}>{r.ph}</div></div>
                <div className="metric-box"><div className="metric-label">TDS (ppm)</div><div className={`metric-val ${r.tds_ppm > 500 ? 'alert' : ''}`}>{r.tds_ppm}</div></div>
                <div className="metric-box"><div className="metric-label">Turbidity</div><div className="metric-val">{r.turbidity_ntu} NTU</div></div>
                <div className="metric-box"><div className="metric-label">Temp</div><div className="metric-val">{r.temperature_c}°C</div></div>
              </div>
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="bar-track" style={{ height: 3 }}>
                  <div className="bar-fill" style={{ width: r.battery_percent + '%', background: r.battery_percent > 30 ? '#10b981' : '#f43f5e', height: 3 }} />
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>🔋 {r.battery_percent}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
