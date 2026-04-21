import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Line, Legend, Cell, LineChart, ComposedChart } from 'recharts';
import { CloudRain, Droplets, Target, Calendar, Info, TrendingUp, TrendingDown, Zap, ThermometerSun, BarChart3 } from 'lucide-react';
import { apiFetch } from '../api';

export default function Rainfall() {
  const [allData, setAllData] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('2023');
  const [compareYear, setCompareYear] = useState('');
  const [lpa, setLpa] = useState(null);
  const [climate, setClimate] = useState(null);
  const [decadeAvg, setDecadeAvg] = useState([]);
  const [viewMode, setViewMode] = useState('monthly'); // monthly | decade | climate

  useEffect(() => {
    (async () => {
      const res = await apiFetch('/api/rainfall');
      if (res?.success) {
        setAllData(res.data);
        setYears(res.available_years || []);
        setLpa(res.lpa);
        setClimate(res.climate_analysis);
        setDecadeAvg(res.decade_averages || []);
        if (res.available_years?.includes('2023')) setSelectedYear('2023');
        else if (res.available_years?.length) setSelectedYear(res.available_years[res.available_years.length - 1]);
      }
    })();
  }, []);

  const yearData = useMemo(() => allData.find(y => y.year === selectedYear), [allData, selectedYear]);
  const compareData = useMemo(() => compareYear ? allData.find(y => y.year === compareYear) : null, [allData, compareYear]);

  const chartData = useMemo(() => {
    if (!yearData) return [];
    return yearData.data.map((d, i) => {
      const entry = { month: d.month, rainfall: d.rainfall_mm, recharge: +(d.rainfall_mm * 0.35).toFixed(1) };
      if (compareData) entry.compare = compareData.data[i]?.rainfall_mm || 0;
      if (lpa?.lpa_1991_2020) entry.lpa = lpa.lpa_1991_2020.data[i]?.rainfall_mm || 0;
      return entry;
    });
  }, [yearData, compareData, lpa]);

  const stats = useMemo(() => {
    if (!yearData) return null;
    const total = yearData.total;
    const peak = [...yearData.data].sort((a, b) => b.rainfall_mm - a.rainfall_mm)[0];
    const driest = [...yearData.data].sort((a, b) => a.rainfall_mm - b.rainfall_mm)[0];
    const monsoon = yearData.data.filter(d => ['Jun','Jul','Aug','Sep','Oct'].includes(d.month)).reduce((a, d) => a + d.rainfall_mm, 0);
    const lpaTotal = lpa?.lpa_1991_2020?.total || 1077;
    const deviation = (((total - lpaTotal) / lpaTotal) * 100).toFixed(1);
    return { total, peak: peak?.month, peakVal: peak?.rainfall_mm, driest: driest?.month, monsoon: monsoon.toFixed(0), deviation, elNino: yearData.elNino, laNina: yearData.laNina };
  }, [yearData, lpa]);

  return (
    <div>
      {/* Controls Bar */}
      <div className="card" style={{ marginBottom: 16, padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8' }}>Year</label>
            <select className="form-select" value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ width: 100, padding: '4px 8px', fontSize: '0.82rem' }}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8' }}>Compare</label>
            <select className="form-select" value={compareYear} onChange={e => setCompareYear(e.target.value)} style={{ width: 110, padding: '4px 8px', fontSize: '0.82rem' }}>
              <option value="">None</option>
              {years.filter(y => y !== selectedYear).map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
            {[['monthly', 'Monthly'], ['decade', 'Decades'], ['climate', 'Climate']].map(([k, l]) => (
              <button key={k} onClick={() => setViewMode(k)}
                style={{ padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                  background: viewMode === k ? '#6366f1' : 'rgba(255,255,255,0.05)', color: viewMode === k ? '#fff' : '#94a3b8', transition: 'all 0.2s' }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      {stats && (
        <div className="stat-grid" style={{ marginBottom: 16 }}>
          <div className="stat-card" style={{ '--stat-accent': '#6366f1' }}>
            <div className="stat-label"><CloudRain size={14} /> Annual Total</div>
            <div className="stat-value">{stats.total} <span style={{ fontSize: '0.9rem' }}>mm</span></div>
            <div className="stat-sub" style={{ color: parseFloat(stats.deviation) >= 0 ? '#10b981' : '#f43f5e' }}>
              {parseFloat(stats.deviation) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {stats.deviation}% vs LPA
            </div>
          </div>
          <div className="stat-card" style={{ '--stat-accent': '#10b981' }}>
            <div className="stat-label"><Droplets size={14} /> Wettest Month</div>
            <div className="stat-value" style={{ color: '#10b981' }}>{stats.peak}</div>
            <div className="stat-sub">{stats.peakVal} mm recorded</div>
          </div>
          <div className="stat-card" style={{ '--stat-accent': '#3b82f6' }}>
            <div className="stat-label"><BarChart3 size={14} /> Monsoon Total</div>
            <div className="stat-value" style={{ color: '#3b82f6' }}>{stats.monsoon} <span style={{ fontSize: '0.9rem' }}>mm</span></div>
            <div className="stat-sub">Jun–Oct contribution</div>
          </div>
          <div className="stat-card" style={{ '--stat-accent': stats.elNino ? '#f59e0b' : stats.laNina ? '#06b6d4' : '#94a3b8' }}>
            <div className="stat-label"><ThermometerSun size={14} /> ENSO Phase</div>
            <div className="stat-value" style={{ color: stats.elNino ? '#f59e0b' : stats.laNina ? '#06b6d4' : '#94a3b8', fontSize: '1.2rem' }}>
              {stats.elNino ? '🔥 El Niño' : stats.laNina ? '🌊 La Niña' : '— Neutral'}
            </div>
            <div className="stat-sub">{stats.elNino ? 'Typically drier' : stats.laNina ? 'Typically wetter' : 'Normal conditions'}</div>
          </div>
        </div>
      )}

      {/* MONTHLY VIEW */}
      {viewMode === 'monthly' && (
        <>
          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title"><CloudRain size={16} /> Rainfall Analysis — {selectedYear}{compareYear ? ` vs ${compareYear}` : ''}</div>
                <div className="card-badge">{compareYear ? 'COMPARISON' : 'MONTHLY'}</div>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={chartData}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.7} />
                      </linearGradient>
                      <linearGradient id="barGradHigh" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      contentStyle={{ background: '#12121a', border: '1px solid #2a2a3e', borderRadius: 12, color: '#f0f0f5', padding: '10px 14px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} />
                    <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="rainfall" name={selectedYear} radius={[6, 6, 0, 0]} barSize={compareYear ? 16 : 24}>
                      {chartData.map((e, i) => <Cell key={`cell-${i}`} fill={e.rainfall > 150 ? "url(#barGradHigh)" : "url(#barGrad)"} />)}
                    </Bar>
                    {compareYear && <Bar dataKey="compare" name={compareYear} radius={[6, 6, 0, 0]} barSize={16} fill="#f59e0b" fillOpacity={0.7} />}
                    <Line dataKey="lpa" name="LPA (1991-2020)" stroke="#f43f5e" strokeWidth={2} strokeDasharray="6 3" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title"><TrendingUp size={16} /> Cumulative Total (Year-to-Date)</div>
                <div className="card-badge">ACCUMULATION</div>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData.reduce((acc, d, i) => {
                    const prev = i > 0 ? acc[i-1].total : 0;
                    const prevComp = i > 0 ? acc[i-1].totalComp : 0;
                    acc.push({ ...d, total: prev + d.rainfall, totalComp: prevComp + (d.compare || 0) });
                    return acc;
                  }, [])}>
                    <defs>
                      <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#12121a', border: '1px solid #2a2a3e', borderRadius: 12, color: '#f0f0f5' }} />
                    <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="total" name={`${selectedYear} Cumulative`} stroke="#10b981" fill="url(#totalGrad)" strokeWidth={3} dot={{ r: 3, fill: '#10b981' }} />
                    {compareYear && <Line type="monotone" dataKey="totalComp" name={`${compareYear} Cumulative`} stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Percolation + Recharge Window */}
          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <div className="card-title"><Target size={16} /> Soil Percolation Rates</div>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { name: 'Alluvial', rate: 18.3 },
                    { name: 'Sandy Loam', rate: 12.5 },
                    { name: 'Red Laterite', rate: 6.2 },
                    { name: 'Clay', rate: 1.8 },
                  ]} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#f0f0f5', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip contentStyle={{ background: '#12121a', border: '1px solid #2a2a3e', borderRadius: 12, color: '#f0f0f5' }} />
                    <Bar dataKey="rate" radius={[0, 6, 6, 0]} barSize={18}>
                      <Cell fill="#10b981" /><Cell fill="#3b82f6" /><Cell fill="#f59e0b" /><Cell fill="#f43f5e" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><div className="card-title"><Calendar size={16} /> Recharge Window</div></div>
              <div className="card-body">
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.7, marginBottom: 14 }}>
                  <strong style={{ color: '#10b981' }}>Southwest Monsoon (Jun–Sep)</strong> and <strong style={{ color: '#3b82f6' }}>Northeast Monsoon (Oct–Nov)</strong> contribute <strong style={{ color: '#f59e0b' }}>~87%</strong> of annual rainfall.
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {['Jun','Jul','Aug','Sep','Oct'].map(m => (
                    <span key={m} style={{ background: '#10b981', color: '#fff', padding: '4px 14px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, boxShadow: '0 4px 12px rgba(16,185,129,0.15)' }}>{m}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: '#94a3b8' }}>
                  <Info size={14} /> Pre-monsoon infrastructure must be ready by <strong>May 31st</strong>.
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* DECADE VIEW */}
      {viewMode === 'decade' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title"><BarChart3 size={16} /> Decade-wise Average Rainfall (1901–2024)</div>
            <div className="card-badge">124 YEARS</div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={decadeAvg}>
                <defs>
                  <linearGradient id="decadeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
                <XAxis dataKey="decade" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} domain={[600, 1100]} />
                <Tooltip contentStyle={{ background: '#12121a', border: '1px solid #2a2a3e', borderRadius: 12, color: '#f0f0f5' }}
                  formatter={(v) => [`${v} mm`, 'Avg Rainfall']} />
                <Bar dataKey="avg" fill="url(#decadeGrad)" radius={[6, 6, 0, 0]} barSize={36}>
                  {decadeAvg.map((d, i) => <Cell key={i} fill={d.avg > 950 ? '#10b981' : d.avg > 850 ? '#6366f1' : '#f59e0b'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {lpa && (
              <div style={{ display: 'flex', gap: 16, marginTop: 16, justifyContent: 'center' }}>
                <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12, padding: '10px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.08em' }}>LPA 1991-2020</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#818cf8' }}>{lpa.lpa_1991_2020.total} mm</div>
                </div>
                <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 12, padding: '10px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.08em' }}>LPA 1981-2010</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa' }}>{lpa.lpa_1981_2010.total} mm</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CLIMATE VIEW */}
      {viewMode === 'climate' && climate && (
        <div>
          <div className="stat-grid" style={{ marginBottom: 16 }}>
            <div className="stat-card" style={{ '--stat-accent': '#f59e0b' }}>
              <div className="stat-label"><Zap size={14} /> El Niño Years</div>
              <div className="stat-value" style={{ color: '#f59e0b' }}>{climate.el_nino.count}</div>
              <div className="stat-sub">Avg: {climate.el_nino.avg_total} mm</div>
            </div>
            <div className="stat-card" style={{ '--stat-accent': '#06b6d4' }}>
              <div className="stat-label"><Droplets size={14} /> La Niña Years</div>
              <div className="stat-value" style={{ color: '#06b6d4' }}>{climate.la_nina.count}</div>
              <div className="stat-sub">Avg: {climate.la_nina.avg_total} mm</div>
            </div>
            <div className="stat-card" style={{ '--stat-accent': '#94a3b8' }}>
              <div className="stat-label"><BarChart3 size={14} /> Neutral Years</div>
              <div className="stat-value" style={{ color: '#94a3b8' }}>{climate.normal.count}</div>
              <div className="stat-sub">Avg: {climate.normal.avg_total} mm</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <div className="card-title"><ThermometerSun size={16} /> ENSO Impact on Rainfall</div>
                <div className="card-badge">CLIMATE</div>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { phase: 'El Niño 🔥', avg: climate.el_nino.avg_total, count: climate.el_nino.count },
                    { phase: 'La Niña 🌊', avg: climate.la_nina.avg_total, count: climate.la_nina.count },
                    { phase: 'Neutral', avg: climate.normal.avg_total, count: climate.normal.count },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
                    <XAxis dataKey="phase" tick={{ fill: '#f0f0f5', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} domain={[700, 1100]} />
                    <Tooltip contentStyle={{ background: '#12121a', border: '1px solid #2a2a3e', borderRadius: 12, color: '#f0f0f5' }} />
                    <Bar dataKey="avg" radius={[8, 8, 0, 0]} barSize={60}>
                      <Cell fill="#f59e0b" /><Cell fill="#06b6d4" /><Cell fill="#6366f1" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title"><TrendingUp size={16} /> Annual Rainfall Trend (Last 30 Years)</div>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={allData.filter(y => parseInt(y.year) >= 1995).map(y => ({
                    year: y.year, total: y.total,
                    flag: y.elNino ? '🔥' : y.laNina ? '🌊' : ''
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
                    <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#12121a', border: '1px solid #2a2a3e', borderRadius: 12, color: '#f0f0f5' }}
                      formatter={(v, n, p) => [`${v} mm ${p.payload.flag}`, 'Total']} />
                    <Area type="monotone" dataKey="total" stroke="#6366f1" fill="rgba(99,102,241,0.1)" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
