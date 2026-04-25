import { useState, useEffect } from 'react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { apiFetch } from '../api';
import { Brain, CloudRain, MapPin, AlertTriangle, Droplets, TreePine, Calendar, TrendingUp, Ruler, Building, Zap, Info, Trees, Activity } from 'lucide-react';

const RISK_COLORS = { CRITICAL:'#f43f5e', HIGH:'#f59e0b', MODERATE:'#fb923c', LOW:'#3b82f6', GOOD:'#10b981' };
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AiPredict({ selectedRegion, onPredictionsUpdate }) {
  const [activeTab, setActiveTab] = useState('rainfall');
  const [monthsAhead, setMonthsAhead] = useState(2);
  const [prevYearData, setPrevYearData] = useState(MONTHS_SHORT.map(() => ''));
  const [rainfallResult, setRainfallResult] = useState(null);
  const [criticalResult, setCriticalResult] = useState(null);
  const [rechargeResult, setRechargeResult] = useState(null);
  const [loading, setLoading] = useState(false);
  // Recharge form
  const [rArea, setRArea] = useState('500');
  const [rPlot, setRPlot] = useState('residential');
  const [rPrevRain, setRPrevRain] = useState('900');

  const zoneName = selectedRegion?.name || 'Unknown';

  // Load last year rainfall as defaults
  useEffect(() => {
    (async () => {
      const res = await apiFetch('/api/rainfall?year=2023');
      if (res?.success && res.data?.[0]) {
        setPrevYearData(res.data[0].data.map(d => String(d.rainfall_mm)));
        setRPrevRain(String(res.data[0].total));
      }
    })();
  }, []);

  const predictRainfall = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/predict/rainfall', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ months_ahead: monthsAhead, previous_year_data: prevYearData.map(Number) })
      });
      const d = await r.json();
      if (d.success) setRainfallResult(d);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const predictCritical = async () => {
    if (!rainfallResult) return alert('Run Rainfall Prediction first');
    setLoading(true);
    try {
      const r = await fetch('/api/predict/critical-areas', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ predicted_rainfall_mm: rainfallResult.annual_predicted_total, zone_id: selectedRegion?.id })
      });
      const d = await r.json();
      if (d.success) setCriticalResult(d);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const predictRecharge = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/predict/recharge-zones', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          zone_id: selectedRegion?.id,
          previous_year_rainfall_mm: Number(rPrevRain),
          area_sqm: Number(rArea),
          plot_type: rPlot,
          predicted_annual_rainfall_mm: rainfallResult?.annual_predicted_total || 950
        })
      });
      const d = await r.json();
      if (d.success) setRechargeResult(d);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    if (onPredictionsUpdate) {
      onPredictionsUpdate({
        rainfall: rainfallResult,
        critical: criticalResult,
        recharge: rechargeResult
      });
    }
  }, [rainfallResult, criticalResult, rechargeResult, onPredictionsUpdate]);

  const tabs = [
    { id:'rainfall', label:'🌧 Rainfall Predictor', icon: CloudRain },
    { id:'critical', label:'🚨 Critical Areas', icon: AlertTriangle },
    { id:'recharge', label:'🌿 Recharge Zones', icon: TreePine },
    { id:'borewell', label:'🔭 Borewell Observation', icon: Activity },
    { id:'management', label:'⚡ Water Management', icon: Zap },
  ];

  return (
    <div>
      {/* Region banner */}
      <div style={{ background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:12, padding:'12px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
        <MapPin size={18} style={{ color:'#6366f1' }} />
        <div>
          <div style={{ fontWeight:700, fontSize:'0.95rem' }}>Region: {zoneName}</div>
          <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>Depth: {selectedRegion?.groundwaterLevel}m · GRACE: {selectedRegion?.graceAnomaly}cm · Borewells: {selectedRegion?.borewellCount}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:20, borderBottom:'1px solid rgba(255,255,255,0.08)', paddingBottom:10 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding:'8px 18px', borderRadius:8, border:'none', cursor:'pointer', fontSize:'0.82rem', fontWeight:600,
            background: activeTab===t.id ? '#6366f1' : 'transparent', color: activeTab===t.id ? '#fff' : '#94a3b8', transition:'all 0.2s'
          }}>{t.label}</button>
        ))}
      </div>

      {/* TAB 1: Rainfall Predictor */}
      {activeTab === 'rainfall' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header"><div className="card-title"><CloudRain size={16}/> Previous Year Monthly Data (mm)</div><div className="card-badge">MANUAL INPUT</div></div>
            <div className="card-body">
              <p style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginBottom:16 }}>Enter or edit monthly rainfall data from previous year. The AI model uses this to calibrate predictions.</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
                {MONTHS_SHORT.map((m,i) => (
                  <div key={m} style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    <label style={{ fontSize:'0.68rem', fontWeight:600, color:'#94a3b8' }}>{m}</label>
                    <input type="number" value={prevYearData[i]} onChange={e => { const arr=[...prevYearData]; arr[i]=e.target.value; setPrevYearData(arr); }}
                      style={{ padding:'6px 8px', background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:6, color:'#f0f0f5', fontSize:'0.82rem', fontFamily:'Inter,sans-serif', width:'100%' }} />
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:16 }}>
                <label style={{ fontSize:'0.78rem', fontWeight:600, color:'#94a3b8' }}>Months Ahead:</label>
                <select value={monthsAhead} onChange={e => setMonthsAhead(Number(e.target.value))} className="form-select" style={{ width:80, padding:'4px 8px' }}>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <button className="btn-primary" onClick={predictRainfall} disabled={loading} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {loading ? '⏳ Predicting...' : <><Brain size={16}/> Predict Rainfall</>}
              </button>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title"><TrendingUp size={16}/> Prediction Results</div><div className="card-badge">HYDRA-ML V2</div></div>
            <div className="card-body">
              {!rainfallResult ? (
                <div style={{ textAlign:'center', padding:'3rem 0', color:'var(--text-muted)', fontSize:'0.85rem' }}>
                  <div style={{ fontSize:'2rem', marginBottom:12 }}>🤖</div>Enter previous year data and run the predictor.
                </div>
              ) : (
                <div className="fade-in">
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
                    <div style={{ padding:12, background:'rgba(99,102,241,0.06)', borderRadius:8, border:'1px solid rgba(99,102,241,0.15)', textAlign:'center' }}>
                      <div style={{ fontSize:'0.65rem', color:'#94a3b8', fontWeight:600, textTransform:'uppercase' }}>Annual Total</div>
                      <div style={{ fontSize:'1.4rem', fontWeight:800, color:'#6366f1' }}>{rainfallResult.annual_predicted_total}<span style={{ fontSize:'0.7rem' }}> mm</span></div>
                    </div>
                    <div style={{ padding:12, background:'rgba(16,185,129,0.06)', borderRadius:8, border:'1px solid rgba(16,185,129,0.15)', textAlign:'center' }}>
                      <div style={{ fontSize:'0.65rem', color:'#94a3b8', fontWeight:600, textTransform:'uppercase' }}>Monsoon</div>
                      <div style={{ fontSize:'1.4rem', fontWeight:800, color:'#10b981' }}>{rainfallResult.monsoon_predicted_total}<span style={{ fontSize:'0.7rem' }}> mm</span></div>
                    </div>
                    <div style={{ padding:12, background:'rgba(59,130,246,0.06)', borderRadius:8, border:'1px solid rgba(59,130,246,0.15)', textAlign:'center' }}>
                      <div style={{ fontSize:'0.65rem', color:'#94a3b8', fontWeight:600, textTransform:'uppercase' }}>vs LPA</div>
                      <div style={{ fontSize:'1.4rem', fontWeight:800, color:'#3b82f6' }}>{rainfallResult.lpa_comparison.percent_of_lpa}%</div>
                      <div style={{ fontSize:'0.65rem', color:'#94a3b8' }}>{rainfallResult.lpa_comparison.trend}</div>
                    </div>
                  </div>
                  <h4 style={{ fontSize:'0.8rem', color:'#94a3b8', marginBottom:8 }}>Next {monthsAhead} Month(s)</h4>
                  <div style={{ display:'grid', gap:8, marginBottom:16 }}>
                    {rainfallResult.upcoming_months.map((m,i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px',
                        background:`${RISK_COLORS[m.riskLevel]}10`, border:`1px solid ${RISK_COLORS[m.riskLevel]}25`, borderRadius:8 }}>
                        <div><div style={{ fontWeight:700, fontSize:'0.88rem' }}>{m.month}</div><div style={{ fontSize:'0.7rem', color:'#94a3b8' }}>Hist. avg: {m.historical_avg_mm}mm</div></div>
                        <div style={{ textAlign:'right' }}><div style={{ fontWeight:800, fontSize:'1.1rem', color:RISK_COLORS[m.riskLevel] }}>{m.predicted_rainfall_mm} mm</div>
                        <div style={{ fontSize:'0.65rem', color:RISK_COLORS[m.riskLevel] }}>{m.riskLevel} · {(m.confidence*100).toFixed(0)}% conf</div></div>
                      </div>
                    ))}
                  </div>
                  <h4 style={{ fontSize:'0.8rem', color:'#94a3b8', marginBottom:8 }}>Full Year Forecast</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={rainfallResult.full_year}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                      <XAxis dataKey="month" tick={{ fill:'#94a3b8', fontSize:9 }} axisLine={false} tickLine={false} tickFormatter={v => v.slice(0,3)} />
                      <YAxis tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background:'#12121a', border:'1px solid #1e1e2e', borderRadius:8, color:'#f0f0f5', fontSize:12 }} />
                      <Bar dataKey="predicted_rainfall_mm" radius={[4,4,0,0]}>
                        {rainfallResult.full_year.map((e,i) => <Cell key={i} fill={RISK_COLORS[e.riskLevel] || '#6366f1'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Critical Areas */}
      {activeTab === 'critical' && (
        <div>
          {!rainfallResult ? (
            <div className="card"><div className="card-body" style={{ textAlign:'center', padding:'3rem' }}>
              <div style={{ fontSize:'2rem', marginBottom:12 }}>⚠️</div>
              <p style={{ color:'var(--text-muted)' }}>Please run the <strong>Rainfall Predictor</strong> first. Critical area analysis uses predicted rainfall data.</p>
              <button className="btn-primary" onClick={() => setActiveTab('rainfall')} style={{ marginTop:12 }}>← Go to Rainfall Predictor</button>
            </div></div>
          ) : (
            <>
              <div style={{ marginBottom:16 }}>
                <button className="btn-primary" onClick={predictCritical} disabled={loading} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {loading ? '⏳ Analyzing...' : <><AlertTriangle size={16}/> Analyze Critical Areas (Predicted Rain: {rainfallResult.annual_predicted_total}mm)</>}
                </button>
              </div>
              {criticalResult && (
                <div className="fade-in">
                  <div className="stat-grid" style={{ marginBottom:16 }}>
                    <div className="stat-card" style={{ '--stat-accent':'#f43f5e' }}><div className="stat-label">Critical Zones</div><div className="stat-value" style={{ color:'#f43f5e' }}>{criticalResult.critical_count}</div></div>
                    <div className="stat-card" style={{ '--stat-accent':'#f59e0b' }}><div className="stat-label">High Risk</div><div className="stat-value" style={{ color:'#f59e0b' }}>{criticalResult.high_risk_count}</div></div>
                    <div className="stat-card" style={{ '--stat-accent':'#3b82f6' }}><div className="stat-label">Rain vs LPA</div><div className="stat-value" style={{ color:'#3b82f6' }}>{criticalResult.rainfall_vs_lpa_percent}%</div></div>
                    <div className="stat-card" style={{ '--stat-accent':'#6366f1' }}><div className="stat-label">Outlook</div><div className="stat-value" style={{ color:'#6366f1', fontSize:'0.9rem' }}>{criticalResult.overall_outlook.split(' - ')[0]}</div></div>
                  </div>
                  <div className="card"><div className="card-header"><div className="card-title"><AlertTriangle size={16}/> Zone Risk Assessment</div></div>
                    <div className="card-body">
                      <div style={{ display:'grid', gap:10 }}>
                        {criticalResult.zones.map((z,i) => {
                          const col = RISK_COLORS[z.severity] || '#3b82f6';
                          return (
                            <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px', background:`${col}08`, border:`1px solid ${col}20`, borderRadius:10 }}>
                              <div style={{ width:40, textAlign:'center' }}><div style={{ fontWeight:800, fontSize:'1.2rem', color:col }}>{z.risk_score}</div><div style={{ fontSize:'0.55rem', color:'#94a3b8' }}>RISK</div></div>
                              <div style={{ flex:1 }}>
                                <div style={{ fontWeight:700, fontSize:'0.88rem' }}>{z.zone_name}</div>
                                <div style={{ fontSize:'0.72rem', color:'#94a3b8' }}>Depth: {z.current_depth_m}m · GRACE: {z.grace_anomaly_cm}cm · Wells: {z.borewell_count}</div>
                              </div>
                              <div style={{ textAlign:'right' }}>
                                <div style={{ fontSize:'0.7rem', fontWeight:700, color:col, background:`${col}15`, padding:'3px 10px', borderRadius:20, border:`1px solid ${col}30` }}>{z.severity}</div>
                                <div style={{ fontSize:'0.65rem', color:'#94a3b8', marginTop:4 }}>{z.predicted_rainfall_impact.split(' - ')[0]}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 3: Recharge Zones */}
      {activeTab === 'recharge' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header"><div className="card-title"><TreePine size={16}/> Recharge Zone Input</div><div className="card-badge">MANUAL ENTRY</div></div>
            <div className="card-body">
              <p style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginBottom:16 }}>Enter area details to predict recharge potential. AI-predicted rainfall is auto-filled if available.</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                <div><label style={{ fontSize:'0.72rem', fontWeight:600, color:'#94a3b8', display:'block', marginBottom:4 }}><CloudRain size={11}/> Prev Year Rain (mm)</label>
                  <input type="number" value={rPrevRain} onChange={e => setRPrevRain(e.target.value)} className="form-input" style={{ width:'100%' }} /></div>
                <div><label style={{ fontSize:'0.72rem', fontWeight:600, color:'#94a3b8', display:'block', marginBottom:4 }}><Brain size={11}/> AI Predicted Rain (mm)</label>
                  <input type="number" value={rainfallResult?.annual_predicted_total || 950} readOnly className="form-input" style={{ width:'100%', opacity:0.7 }} /></div>
                <div><label style={{ fontSize:'0.72rem', fontWeight:600, color:'#94a3b8', display:'block', marginBottom:4 }}><Ruler size={11}/> Area (sqm)</label>
                  <input type="number" value={rArea} onChange={e => setRArea(e.target.value)} className="form-input" style={{ width:'100%' }} /></div>
                <div><label style={{ fontSize:'0.72rem', fontWeight:600, color:'#94a3b8', display:'block', marginBottom:4 }}><Building size={11}/> Plot Type</label>
                  <select value={rPlot} onChange={e => setRPlot(e.target.value)} className="form-select" style={{ width:'100%' }}>
                    <option value="residential">Residential</option><option value="commercial">Commercial</option>
                    <option value="apartment">Apartment</option><option value="industrial">Industrial</option>
                    <option value="open_land">Open Land</option><option value="park">Park / Garden</option>
                  </select></div>
              </div>
              <button className="btn-primary" onClick={predictRecharge} disabled={loading} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {loading ? '⏳ Computing...' : <><TreePine size={16}/> Predict Recharge Zones</>}
              </button>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title"><Droplets size={16}/> Recharge Analysis</div><div className="card-badge">RESULTS</div></div>
            <div className="card-body">
              {!rechargeResult ? (
                <div style={{ textAlign:'center', padding:'3rem 0', color:'var(--text-muted)', fontSize:'0.85rem' }}>
                  <div style={{ fontSize:'2rem', marginBottom:12 }}>🌿</div>Enter details and run the recharge predictor.
                </div>
              ) : (
                <div className="fade-in">
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                    <div style={{ padding:12, background:'rgba(16,185,129,0.06)', borderRadius:8, border:'1px solid rgba(16,185,129,0.15)', textAlign:'center' }}>
                      <div style={{ fontSize:'0.65rem', color:'#94a3b8', fontWeight:600, textTransform:'uppercase' }}>Harvest Potential</div>
                      <div style={{ fontSize:'1.3rem', fontWeight:800, color:'#10b981' }}>{(rechargeResult.harvest_potential_liters/1000).toFixed(1)}K<span style={{ fontSize:'0.7rem' }}> L/yr</span></div>
                    </div>
                    <div style={{ padding:12, background:'rgba(59,130,246,0.06)', borderRadius:8, border:'1px solid rgba(59,130,246,0.15)', textAlign:'center' }}>
                      <div style={{ fontSize:'0.65rem', color:'#94a3b8', fontWeight:600, textTransform:'uppercase' }}>Recharge Potential</div>
                      <div style={{ fontSize:'1.3rem', fontWeight:800, color:'#3b82f6' }}>{(rechargeResult.recharge_potential_liters/1000).toFixed(1)}K<span style={{ fontSize:'0.7rem' }}> L/yr</span></div>
                    </div>
                  </div>
                  {rechargeResult.zone_specific && (
                    <div style={{ padding:12, background:'rgba(99,102,241,0.06)', borderRadius:8, border:'1px solid rgba(99,102,241,0.15)', marginBottom:16 }}>
                      <div style={{ fontSize:'0.72rem', color:'#94a3b8', marginBottom:6 }}>Zone: <strong style={{ color:'#f0f0f5' }}>{rechargeResult.input_summary.zone}</strong></div>
                      <div style={{ fontSize:'0.72rem', color:'#94a3b8' }}>Potential improvement: <strong style={{ color:'#10b981' }}>+{rechargeResult.zone_specific.estimated_depth_improvement_m}m</strong> depth · Recharge rate: <strong style={{ color:'#6366f1' }}>{rechargeResult.zone_specific.potential_recharge_improvement} mm/day</strong></div>
                    </div>
                  )}
                  <h4 style={{ fontSize:'0.8rem', color:'#94a3b8', marginBottom:8 }}>Recommended Structures</h4>
                  <div style={{ display:'grid', gap:8 }}>
                    {rechargeResult.recommended_structures.map((s,i) => (
                      <div key={i} style={{ padding:12, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                          <div style={{ fontWeight:700, fontSize:'0.85rem' }}>{s.name}</div>
                          <div style={{ fontWeight:800, color:'#10b981', fontSize:'0.85rem' }}>₹{(s.cost_inr/1000).toFixed(0)}K</div>
                        </div>
                        <div style={{ fontSize:'0.72rem', color:'#94a3b8', marginBottom:4 }}>{s.description}</div>
                        <div style={{ fontSize:'0.68rem', color:'#94a3b8' }}>Capacity: {(s.capacity_liters/1000).toFixed(1)}K L · ROI: {s.roi_years}yr · {s.effectiveness}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:12, padding:10, background:'rgba(16,185,129,0.06)', borderRadius:8, display:'flex', gap:6, flexWrap:'wrap' }}>
                    <span style={{ fontSize:'0.7rem', color:'#94a3b8', fontWeight:600 }}>Best months:</span>
                    {rechargeResult.optimal_months.map(m => <span key={m} style={{ fontSize:'0.68rem', background:'#10b981', color:'#fff', padding:'2px 10px', borderRadius:12, fontWeight:600 }}>{m}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Water Management */}
      {activeTab === 'management' && (
        <div className="fade-in">
          {!(rainfallResult && rechargeResult) ? (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
              <h2 style={{ fontSize: '1.2rem', color: '#f0f0f5', marginBottom: '0.5rem' }}>AI Predictions Missing</h2>
              <p style={{ color: '#94a3b8', maxWidth: '400px', margin: '0 auto' }}>
                Please run the <strong>Rainfall Predictor</strong> and the <strong>Recharge Zones</strong> predictor first to generate management protocols.
              </p>
            </div>
          ) : (
            <div className="grid-2">
              <div className="card">
                <div className="card-header">
                  <div className="card-title"><Info size={16} /> AI Prediction Parameters</div>
                </div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <CloudRain size={16} style={{ color: '#3b82f6', marginBottom: 8 }} />
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Predicted Rainfall</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0f0f5' }}>{rainfallResult.annual_predicted_total} <span style={{ fontSize: '0.8rem' }}>mm/yr</span></div>
                    </div>
                    <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Ruler size={16} style={{ color: '#8b5cf6', marginBottom: 8 }} />
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Catchment Area</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0f0f5' }}>{rechargeResult.input_summary.area_sqm} <span style={{ fontSize: '0.8rem' }}>sqm</span></div>
                    </div>
                    <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Building size={16} style={{ color: '#f59e0b', marginBottom: 8 }} />
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Plot Type</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0f0f5', textTransform: 'capitalize' }}>{rechargeResult.input_summary.plot_type}</div>
                    </div>
                    <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Trees size={16} style={{ color: '#10b981', marginBottom: 8 }} />
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Runoff Coefficient</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0f0f5' }}>{rechargeResult.input_summary.runoff_coefficient}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-title"><Droplets size={16} /> Conservation Targets</div>
                  <div className="card-badge" style={{ background: '#10b98120', color: '#10b981' }}>ACTIONABLE</div>
                </div>
                <div className="card-body">
                  <div style={{ textAlign: 'center', marginBottom: 24, padding: 24, background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(59,130,246,0.1) 100%)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Target Water to Conserve</div>
                    <div style={{ fontSize: '3rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>
                      {((Math.round(rechargeResult.harvest_potential_liters * 0.8)) / 1000).toFixed(1)}K <span style={{ fontSize: '1rem', color: '#64748b' }}>Liters/year</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#3b82f6', marginTop: 8, fontWeight: 600 }}>
                      That's ~{Math.round((rechargeResult.harvest_potential_liters * 0.8) / 365)} liters per day!
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Based on the AI prediction of <strong>{rainfallResult.annual_predicted_total}mm</strong> annual rainfall over your <strong>{rechargeResult.input_summary.area_sqm} sqm</strong> {rechargeResult.input_summary.plot_type} plot, your maximum harvest potential is <strong>{(rechargeResult.harvest_potential_liters / 1000).toFixed(1)}K Liters</strong>. We recommend managing and conserving at least 80% of this runoff.
                  </p>
                </div>
              </div>
              
              <div style={{ gridColumn: '1 / -1' }}>
                <h2 style={{ fontSize: '1.2rem', margin: '8px 0 16px', color: '#f0f0f5' }}>Recommended Infrastructure Execution</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                  {rechargeResult.recommended_structures.map((struct, i) => (
                    <div key={i} className="card" style={{ borderLeft: '4px solid #6366f1' }}>
                      <div className="card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{struct.name}</div>
                          <div style={{ background: '#6366f120', color: '#818cf8', padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700 }}>
                            ₹{(struct.cost_inr / 1000).toFixed(0)}K Est.
                          </div>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 16, minHeight: 40 }}>
                          {struct.description}
                        </p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                          <div>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Management Capacity</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f0f0f5' }}>{(struct.capacity_liters / 1000).toFixed(1)}K L</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>ROI Timeline</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f0f0f5' }}>{struct.roi_years} Years</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Borewell Observation */}
      {activeTab === 'borewell' && (
        <div className="fade-in">
          {!rainfallResult ? (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔭</div>
              <h2 style={{ fontSize: '1.2rem', color: '#f0f0f5', marginBottom: '0.5rem' }}>AI Rainfall Data Required</h2>
              <p style={{ color: '#94a3b8', maxWidth: '400px', margin: '0 auto' }}>
                Please run the <strong>Rainfall Predictor</strong> first to calculate the impact on borewell levels.
              </p>
              <button className="btn-primary" onClick={() => setActiveTab('rainfall')} style={{ marginTop:16 }}>← Go to Rainfall Predictor</button>
            </div>
          ) : (
            (() => {
              const currentLevel = selectedRegion?.groundwaterLevel || 200;
              const borewells = selectedRegion?.borewellCount || 1500;
              const predRain = rainfallResult.annual_predicted_total;
              const baseRain = 950; // assuming historical base is ~950mm
              const rainDiff = predRain - baseRain;
              
              // Simple AI heuristic
              const levelChange = (rainDiff * 0.015).toFixed(1); // mm difference translates to meter change
              const newLevel = (currentLevel - parseFloat(levelChange)).toFixed(1);
              
              const isImprovement = rainDiff >= 0;
              
              const affectedBorewells = Math.abs(Math.round(rainDiff * 0.5));
              const activeCount = isImprovement ? borewells : Math.max(0, borewells - affectedBorewells);
              const inactiveCount = isImprovement ? 0 : Math.min(borewells, affectedBorewells);
              
              return (
                <div className="grid-2">
                  <div className="card">
                    <div className="card-header"><div className="card-title"><Activity size={16}/> Borewell Impact Analysis</div><div className="card-badge" style={{ background: isImprovement ? '#10b98120' : '#f43f5e20', color: isImprovement ? '#10b981' : '#f43f5e' }}>{isImprovement ? 'POSITIVE OUTLOOK' : 'CRITICAL OUTLOOK'}</div></div>
                    <div className="card-body">
                       <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                         <div style={{ padding:16, background:'rgba(255,255,255,0.03)', borderRadius:8, border:'1px solid rgba(255,255,255,0.06)' }}>
                           <div style={{ fontSize:'0.7rem', color:'#94a3b8', textTransform:'uppercase', fontWeight:600, marginBottom:4 }}>Current Water Level</div>
                           <div style={{ fontSize:'1.4rem', fontWeight:800, color:'#f0f0f5' }}>{currentLevel} <span style={{ fontSize:'0.8rem' }}>m</span></div>
                         </div>
                         <div style={{ padding:16, background: isImprovement ? 'rgba(16,185,129,0.06)' : 'rgba(244,63,94,0.06)', borderRadius:8, border: isImprovement ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(244,63,94,0.15)' }}>
                           <div style={{ fontSize:'0.7rem', color:'#94a3b8', textTransform:'uppercase', fontWeight:600, marginBottom:4 }}>Projected Level</div>
                           <div style={{ fontSize:'1.4rem', fontWeight:800, color: isImprovement ? '#10b981' : '#f43f5e' }}>{newLevel} <span style={{ fontSize:'0.8rem' }}>m</span></div>
                           <div style={{ fontSize:'0.75rem', color: isImprovement ? '#10b981' : '#f43f5e', fontWeight:600 }}>
                             {isImprovement ? '▲' : '▼'} {Math.abs(levelChange)}m {isImprovement ? 'Rise' : 'Drop'}
                           </div>
                         </div>
                       </div>
                       <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)', lineHeight:1.6 }}>
                         The AI model predicts a <strong>{isImprovement ? 'rise' : 'drop'}</strong> in groundwater levels by approximately <strong>{Math.abs(levelChange)}m</strong> due to the predicted annual rainfall of <strong>{predRain}mm</strong> (compared to historical baseline of {baseRain}mm).
                       </p>
                    </div>
                  </div>
                  
                  <div className="card">
                    <div className="card-header"><div className="card-title"><Droplets size={16}/> Borewell Yield Forecast</div></div>
                    <div className="card-body">
                       <div style={{ marginBottom:20 }}>
                         <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                           <span style={{ fontSize:'0.8rem', color:'#94a3b8', fontWeight:600 }}>Total Registered Borewells in Region</span>
                           <span style={{ fontSize:'0.9rem', color:'#f0f0f5', fontWeight:800 }}>{borewells}</span>
                         </div>
                         <div style={{ height:8, background:'#1e1e2e', borderRadius:4, overflow:'hidden', display:'flex' }}>
                           <div style={{ width:`${(activeCount/borewells)*100}%`, background: isImprovement ? '#10b981' : '#3b82f6' }}></div>
                           <div style={{ width:`${(inactiveCount/borewells)*100}%`, background:'#f43f5e' }}></div>
                         </div>
                         <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:'0.7rem' }}>
                           <span style={{ color: isImprovement ? '#10b981' : '#3b82f6', fontWeight:600 }}>{activeCount} Active / Healthy</span>
                           {inactiveCount > 0 && <span style={{ color:'#f43f5e', fontWeight:600 }}>{inactiveCount} Risk of Drying</span>}
                         </div>
                       </div>
                       
                       <div style={{ padding:12, background:'rgba(255,255,255,0.03)', borderRadius:8, border:'1px solid rgba(255,255,255,0.06)' }}>
                         <h4 style={{ fontSize:'0.75rem', color:'#f0f0f5', marginBottom:8, textTransform:'uppercase' }}>Observation Summary</h4>
                         {isImprovement ? (
                           <div style={{ fontSize:'0.8rem', color:'#94a3b8', lineHeight:1.5 }}>
                             Higher predicted rainfall will positively recharge aquifers in <strong>{zoneName}</strong>. Borewell yields are expected to stabilize, and no significant borewell drying events are forecasted for the upcoming period.
                           </div>
                         ) : (
                           <div style={{ fontSize:'0.8rem', color:'#94a3b8', lineHeight:1.5 }}>
                             Deficit rainfall predictions indicate significant stress on aquifers in <strong>{zoneName}</strong>. Approximately <strong>{inactiveCount}</strong> shallow borewells are at risk of drying up. Emergency conservation measures are strongly recommended.
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      <style>{`
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
