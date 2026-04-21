import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { MOCK_ZONES, AI_RECS } from '../data/mockData';
import { Brain, CloudRain, Ruler, Building, Info, TrendingUp, History } from 'lucide-react';

const RISK_COLORS = { CRITICAL: '#f43f5e', HIGH: '#f59e0b', MEDIUM: '#fb923c', WATCH: '#3b82f6', GOOD: '#10b981', EXCELLENT: '#6366f1' };
const RISK_ICONS = { CRITICAL: '🚨', HIGH: '⚠️', MEDIUM: '⚡', WATCH: '👁', GOOD: '✅', EXCELLENT: '🌟' };

export default function AiPredict() {
  const [zone, setZone] = useState('');
  const [area, setArea] = useState('300');
  const [type, setType] = useState('residential');
  const [rain, setRain] = useState('1077'); // Default to LPA
  const [selectedYear, setSelectedYear] = useState('');
  const [yearsData, setYearsData] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await apiFetch('/api/rainfall');
      if (res?.success) {
        setYearsData(res.data);
      }
    })();
  }, []);

  const handleYearChange = (year) => {
    setSelectedYear(year);
    if (year === 'LPA') {
      setRain('1077');
    } else if (year === '') {
      // Keep manual
    } else {
      const data = yearsData.find(y => y.year === year);
      if (data) setRain(data.total.toString());
    }
  };

  const predict = async () => {
    if (!zone) return alert('Select a zone');
    const [lat, lng] = zone.split(',').map(Number);

    setLoading(true);
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, area_sqm: Number(area), building_type: type, rainfall_mm: Number(rain) })
      });
      const data = await res.json();

      if (data.success) {
        setResult({
          zoneName: data.nearest_zone,
          depth: data.current_level_m,
          graceAnomaly: data.grace_anomaly_cm,
          status: data.groundwater_status,
          priority: data.ai_prediction.risk_level,
          recovery: data.ai_prediction.estimated_recovery,
          harvest: data.ai_prediction.rainwater_harvest_potential_liters_year,
          recs: data.ai_prediction.recommendations,
          solutions: data.ai_prediction.solutions_ranked
        });
      }
    } catch {
      let nearest = MOCK_ZONES[0], minD = Infinity;
      MOCK_ZONES.forEach(z => { const d = Math.hypot(z.lat - lat, z.lng - lng); if (d < minD) { minD = d; nearest = z; } });
      const rec = AI_RECS[nearest.status];
      const harvest = (Number(area) * Number(rain) * 0.8 / 1000).toFixed(0);
      setResult({
        zoneName: nearest.name, depth: nearest.groundwaterLevel, graceAnomaly: nearest.graceAnomaly,
        status: nearest.status, priority: rec.priority, recovery: rec.estimatedRecoveryTime,
        harvest, recs: rec,
        solutions: [
          { solution: 'Soak Pit Network', roi_years: 2, effectiveness: 'Medium', cost_inr: 35000 },
          { solution: 'Rooftop RWH', roi_years: 2, effectiveness: 'Medium', cost_inr: 45000 },
          { solution: 'Recharge Shaft', roi_years: 3, effectiveness: 'Very High', cost_inr: 180000 },
          { solution: 'Percolation Pond', roi_years: 4, effectiveness: 'High', cost_inr: 250000 },
          { solution: 'Check Dam', roi_years: 7, effectiveness: 'High', cost_inr: 850000 },
        ]
      });
    }
    setLoading(false);
  };

  const col = result ? RISK_COLORS[result.priority] : null;

  return (
    <div className="grid-2 fade-in">
      <div className="card">
        <div className="card-header">
          <div className="card-title"><Brain size={16} /> AI Groundwater Predictor</div>
          <div className="card-badge">HYDRA-ML V2</div>
        </div>
        <div className="card-body">
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
            Simulate groundwater recharge and risk levels based on 124 years of historical rainfall data.
          </p>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Zone / Area</label>
              <select className="form-select" value={zone} onChange={e => setZone(e.target.value)}>
                <option value="">Select zone...</option>
                {MOCK_ZONES.map(z => <option key={z.id} value={`${z.lat},${z.lng}`}>{z.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label"><History size={12} /> Historical Reference</label>
              <select className="form-select" value={selectedYear} onChange={e => handleYearChange(e.target.value)}>
                <option value="">Manual Entry</option>
                <option value="LPA">LPA (1991-2020)</option>
                {yearsData.slice().reverse().map(y => <option key={y.year} value={y.year}>{y.year} ({y.total}mm)</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label"><Ruler size={12} /> Plot Area (sqm)</label>
              <input className="form-input" type="number" value={area} onChange={e => setArea(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label"><CloudRain size={12} /> Annual Rainfall (mm)</label>
              <input className="form-input" type="number" value={rain} onChange={e => setRain(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label"><Building size={12} /> Building Type</label>
              <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
                <option value="residential">Residential</option><option value="commercial">Commercial</option>
                <option value="apartment">Apartment</option><option value="industrial">Industrial</option>
              </select>
            </div>
            <div className="form-group full" style={{ marginTop: 10 }}>
              <button className="btn-primary" onClick={predict} disabled={loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? '⏳ Analyzing...' : <><Brain size={16} /> Run AI Prediction</>}
              </button>
            </div>
          </div>

          {result && (
            <div style={{ marginTop: 24 }} className="fade-in">
              <div className="risk-banner" style={{ background: col + '15', border: `1px solid ${col}40`, borderRadius: 12, padding: 16 }}>
                <div className="risk-icon" style={{ fontSize: '1.8rem' }}>{RISK_ICONS[result.priority]}</div>
                <div>
                  <div className="risk-title" style={{ color: col, fontWeight: 800, fontSize: '1.1rem' }}>{result.priority} Priority — {result.zoneName}</div>
                  <div className="risk-sub" style={{ fontSize: '0.8rem', opacity: 0.8 }}>Depth: {result.depth}m | GRACE: {result.graceAnomaly} cm | {result.recovery}</div>
                </div>
              </div>
              
              <div style={{ background: 'var(--accent-glow)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: 16, marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent-light)', letterSpacing: '0.08em', marginBottom: 2 }}>HARVEST POTENTIAL</div>
                  <div style={{ fontWeight: 800, fontSize: '1.6rem', color: 'var(--accent-light)' }}>{Number(result.harvest).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>L/year</span></div>
                </div>
                <TrendingUp size={24} style={{ color: 'var(--accent-light)', opacity: 0.3 }} />
              </div>

              {result.recs?.immediate && <div className="recs-section" style={{ marginTop: 16 }}><div className="recs-title" style={{ color: '#f43f5e' }}>⚡ Immediate Actions</div><ul className="recs-list">{result.recs.immediate.map((r, i) => <li key={i}>{r}</li>)}</ul></div>}
              {result.recs?.shortTerm && <div className="recs-section"><div className="recs-title" style={{ color: '#f59e0b' }}>📅 Short-Term Strategy</div><ul className="recs-list">{result.recs.shortTerm.map((r, i) => <li key={i}>{r}</li>)}</ul></div>}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">💡 Ranked Solutions</div>
          <div className="card-badge">ROI ANALYTICS</div>
        </div>
        <div className="card-body">
          {!result ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>🤖</div>
              Run the AI predictor to see<br />investment-ranked solutions.
            </div>
          ) : (
            <div className="solutions-grid" style={{ gridTemplateColumns: '1fr', gap: 12 }}>
              {(result.solutions || []).sort((a, b) => (a.roi_years || a.roi) - (b.roi_years || b.roi)).map((s, i) => (
                <div className="solution-card" key={i} style={{ background: i === 0 ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)', borderColor: i === 0 ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, background: i === 0 ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                      {s.solution.includes('Pond') ? '🏊' : s.solution.includes('RWH') ? '🏠' : s.solution.includes('Shaft') ? '🏗️' : '🛠️'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="solution-name" style={{ fontWeight: 700, fontSize: '0.9rem' }}>{s.solution}</div>
                      <div className="solution-meta" style={{ fontSize: '0.75rem', opacity: 0.7 }}>Cost: ₹{((s.cost_inr || s.cost) / 1000).toFixed(0)}K · ROI: {s.roi_years || s.roi}yr · {s.effectiveness}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: i === 0 ? '#10b981' : 'var(--text-primary)' }}>₹{((s.cost_inr || s.cost) / 1000).toFixed(0)}K</div>
                      {i === 0 && <div style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 700 }}>RECOM.</div>}
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 8, padding: 12, background: 'rgba(99,102,241,0.05)', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  ROI (Return on Investment) is calculated based on water savings vs utility costs in Bangalore. Effectiveness is based on local geological suitability.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        .fade-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
