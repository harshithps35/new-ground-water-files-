import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Satellite, Globe, Calendar, Ruler, Droplets, Atom } from 'lucide-react';
import { apiFetch } from '../api';
import { GRACE_DATA } from '../data/mockData';

const SAT_STATS = [
  { icon: <Satellite size={20} />, val: 'GRACE-FO', lbl: 'Satellite Mission' },
  { icon: <Globe size={20} />, val: 'NASA JPL', lbl: 'Data Source' },
  { icon: <Calendar size={20} />, val: '30-Day', lbl: 'Granularity' },
  { icon: <Ruler size={20} />, val: '~300km', lbl: 'Resolution' },
  { icon: <Droplets size={20} />, val: '-8.6 cm', lbl: 'Current TWS' },
  { icon: <Atom size={20} />, val: 'Gravity', lbl: 'Method' },
];

const HOW_WORKS = [
  { icon: '🌍', title: 'Gravity Measurement', desc: 'GRACE-FO satellites detect minute variations in Earth\'s gravitational field caused by water mass changes.' },
  { icon: '💧', title: 'TWS Anomaly', desc: 'Terrestrial Water Storage deviation from 2004-2009 baseline. Negative = depletion.' },
  { icon: '📊', title: 'GW Isolation', desc: 'GRACE + soil moisture models (GLDAS) isolate the groundwater storage component.' },
  { icon: '🤖', title: 'AI Downscaling', desc: 'ML downscales ~300km to local zone-level (1-5km) via IoT ground truth fusion.' },
];

export default function GraceSatellite() {
  const [graceData, setGraceData] = useState([]);
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await apiFetch('/api/grace');
      if (res?.success) {
        setGraceData(res.data);
        setMetadata(res.metadata);
      } else {
        setGraceData(GRACE_DATA);
      }
    })();
  }, []);

  const chartData = graceData.map(d => ({ ...d, fill: d.anomaly >= 0 ? '#10b981' : '#f43f5e' }));

  return (
    <div>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {SAT_STATS.map((s, i) => (
          <div className="stat-card" key={i} style={{ '--stat-accent': '#6366f1', textAlign: 'center' }}>
            <div style={{ color: '#818cf8', marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#3b82f6' }}>{s.val}</div>
            <div className="stat-label" style={{ marginTop: 4, marginBottom: 0 }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title"><Satellite size={16} /> GRACE TWS Anomaly — North Bangalore</div>
          <div className="card-badge">{metadata?.region || 'JAN 2023 – MAR 2024'}</div>
        </div>
        <div className="card-body">
          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
            <div className="stat-card" style={{ '--stat-accent': '#f43f5e' }}><div className="stat-label">Peak Depletion</div><div className="stat-value" style={{ color: '#f43f5e', fontSize: '1.3rem' }}>-22.4 cm</div></div>
            <div className="stat-card" style={{ '--stat-accent': '#10b981' }}><div className="stat-label">Peak Recharge</div><div className="stat-value" style={{ color: '#10b981', fontSize: '1.3rem' }}>+9.4 cm</div></div>
            <div className="stat-card" style={{ '--stat-accent': '#f43f5e' }}><div className="stat-label">Trend</div><div className="stat-value" style={{ color: '#f43f5e', fontSize: '1.3rem' }}>↓ Declining</div></div>
            <div className="stat-card" style={{ '--stat-accent': '#f59e0b' }}><div className="stat-label">Annual Net Loss</div><div className="stat-value" style={{ color: '#f59e0b', fontSize: '1.3rem' }}>-6.2 cm/yr</div></div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="month" tick={{ fill: '#55556a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#55556a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: 8, color: '#f0f0f5' }} />
              <Bar dataKey="anomaly" radius={[3, 3, 0, 0]}>
                {chartData.map((d, i) => <rect key={i} fill={d.anomaly >= 0 ? '#10b981' : '#f43f5e'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">🔬 How GRACE Works</div></div>
        <div className="card-body">
          <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {HOW_WORKS.map((h, i) => (
              <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{h.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 6 }}>{h.title}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{h.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
