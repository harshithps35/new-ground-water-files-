import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ComposedChart } from 'recharts';
import { apiFetch } from '../api';
import { MOCK_ZONES } from '../data/mockData';
import { MapPin, Calendar, Droplets, TrendingUp, AlertTriangle, CheckCircle, Zap, Info } from 'lucide-react';

const RISK_LEVEL_COLORS = {
  'CRITICAL': '#f43f5e',
  'HIGH': '#f59e0b',
  'MODERATE': '#fb923c',
  'LOW': '#3b82f6',
  'IMPROVING': '#10b981',
  'EXCELLENT': '#6366f1'
};

export default function WaterManagement() {
  const [selectedZone, setSelectedZone] = useState('zone_001');
  const [rainfallShort, setRainfallShort] = useState([]);
  const [rainfallFull, setRainfallFull] = useState(null);
  const [gwPredictions, setGwPredictions] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('rainfall2m'); // rainfall2m, rainfallyear, groundwater, recommendations

  const currentZone = MOCK_ZONES.find(z => z.id === selectedZone);

  useEffect(() => {
    if (selectedZone) {
      fetchPredictions();
    }
  }, [selectedZone]);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      // Fetch 2-month rainfall predictions
      const rainfall2m = await apiFetch('/api/predict/rainfall-next-months?monthsAhead=2');
      if (rainfall2m?.success) {
        setRainfallShort(rainfall2m.data);
      }

      // Fetch full-year rainfall predictions
      const rainfallYear = await apiFetch('/api/predict/rainfall-full-year');
      if (rainfallYear?.success) {
        setRainfallFull(rainfallYear);
      }

      // Fetch groundwater predictions for selected zone
      const gwRes = await fetch('/api/predict/groundwater-levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone_id: selectedZone, months_ahead: 2 })
      });
      const gwData = await gwRes.json();
      if (gwData.success) {
        setGwPredictions(gwData.predictions);
      }

      // Fetch management recommendations
      const recRes = await fetch('/api/predict/water-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone_id: selectedZone, months_ahead: 2 })
      });
      const recData = await recRes.json();
      if (recData.success) {
        setRecommendations(recData);
      }
    } catch (err) {
      console.error('Error fetching predictions:', err);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <MapPin size={24} style={{ color: '#6366f1' }} />
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Water Management & Predictions</h1>
        </div>
        <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0 }}>
          Monitor rainfall patterns, groundwater levels, and get actionable management recommendations for North Bangalore
        </p>
      </div>

      {/* Region Selection */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title"><MapPin size={16} /> Select Region (North Bangalore)</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {MOCK_ZONES.map(zone => (
              <button
                key={zone.id}
                onClick={() => setSelectedZone(zone.id)}
                style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: selectedZone === zone.id ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
                  background: selectedZone === zone.id ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                  color: selectedZone === zone.id ? '#fff' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: selectedZone === zone.id ? 700 : 500,
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: 700 }}>{zone.name}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: 4 }}>
                  Depth: {zone.groundwaterLevel}m · Status: {zone.status}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.1)', overflowX: 'auto', paddingBottom: 12 }}>
        {[
          { id: 'rainfall2m', label: '📊 Rainfall (Next 2 Months)', icon: '📊' },
          { id: 'rainfallyear', label: '📈 Full Year Forecast', icon: '📈' },
          { id: 'groundwater', label: '💧 Groundwater Levels', icon: '💧' },
          { id: 'recommendations', label: '⚡ Management Actions', icon: '⚡' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: activeTab === tab.id ? '#6366f1' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
          <p style={{ color: '#94a3b8' }}>Loading predictions...</p>
        </div>
      ) : (
        <>
          {/* Tab 1: Rainfall (Next 2 Months) */}
          {activeTab === 'rainfall2m' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title"><Calendar size={16} /> Rainfall Forecast (Next 2 Months)</div>
                <div className="card-badge">SHORT-TERM</div>
              </div>
              <div className="card-body">
                {rainfallShort.length > 0 ? (
                  <>
                    <div style={{ marginBottom: 24 }}>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={rainfallShort}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '0.8rem' }} />
                          <YAxis stroke="#94a3b8" style={{ fontSize: '0.8rem' }} />
                          <Tooltip
                            contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                            formatter={(value) => [`${value} mm`, 'Rainfall']}
                          />
                          <Bar dataKey="predicted_rainfall_mm" radius={[8, 8, 0, 0]}>
                            {rainfallShort.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={
                                entry.riskLevel === 'HIGH' ? '#f43f5e' :
                                entry.riskLevel === 'MEDIUM' ? '#fb923c' :
                                '#10b981'
                              } />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
                      {rainfallShort.map((pred, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: 16,
                            borderRadius: 8,
                            background: `${RISK_LEVEL_COLORS[pred.riskLevel]}15`,
                            border: `1px solid ${RISK_LEVEL_COLORS[pred.riskLevel]}40`
                          }}
                        >
                          <div style={{ fontWeight: 700, marginBottom: 8 }}>{pred.month}</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: RISK_LEVEL_COLORS[pred.riskLevel], marginBottom: 8 }}>
                            {pred.predicted_rainfall_mm} mm
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>
                            Risk: <span style={{ color: RISK_LEVEL_COLORS[pred.riskLevel], fontWeight: 600 }}>{pred.riskLevel}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            Confidence: {(parseFloat(pred.confidence) * 100).toFixed(0)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No data available</p>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Full Year Rainfall */}
          {activeTab === 'rainfallyear' && rainfallFull && (
            <div className="card">
              <div className="card-header">
                <div className="card-title"><TrendingUp size={16} /> Annual Rainfall Forecast</div>
                <div className="card-badge">FULL YEAR 2026</div>
              </div>
              <div className="card-body">
                {/* Summary Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
                  <div style={{ padding: 16, background: 'rgba(99,102,241,0.05)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)' }}>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>PREDICTED ANNUAL TOTAL</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#6366f1' }}>
                      {rainfallFull.annualPredictedTotal} <span style={{ fontSize: '0.9rem' }}>mm</span>
                    </div>
                  </div>
                  <div style={{ padding: 16, background: 'rgba(59,130,246,0.05)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.2)' }}>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>vs LPA (1991-2020)</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6' }}>
                      {rainfallFull.comparison_with_lpa.predicted_vs_lpa_percent}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                      {rainfallFull.comparison_with_lpa.trend}
                    </div>
                  </div>
                  <div style={{ padding: 16, background: 'rgba(16,185,129,0.05)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>MONSOON SEASON (Jun-Oct)</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>
                      {rainfallFull.monsoonSeason.predictedTotal} <span style={{ fontSize: '0.9rem' }}>mm</span>
                    </div>
                  </div>
                </div>

                {/* Chart */}
                <div style={{ marginBottom: 24 }}>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={rainfallFull.yearlyForecast}>
                      <defs>
                        <linearGradient id="colorRainfall" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '0.8rem' }} />
                      <YAxis stroke="#94a3b8" style={{ fontSize: '0.8rem' }} />
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                        formatter={(value) => [`${value} mm`, 'Rainfall']}
                      />
                      <Area type="monotone" dataKey="predicted_rainfall_mm" stroke="#6366f1" fillOpacity={1} fill="url(#colorRainfall)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Monthly breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                  {rainfallFull.yearlyForecast.map((month, idx) => (
                    <div key={idx} style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 6 }}>{month.month}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: RISK_LEVEL_COLORS[month.riskLevel] }}>
                        {month.predicted_rainfall_mm} mm
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 4 }}>
                        Conf: {(parseFloat(month.confidence) * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Groundwater Predictions */}
          {activeTab === 'groundwater' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title"><Droplets size={16} /> Groundwater Level Predictions</div>
                <div className="card-badge">{currentZone?.name}</div>
              </div>
              <div className="card-body">
                {gwPredictions.length > 0 ? (
                  <>
                    <div style={{ marginBottom: 24 }}>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={gwPredictions}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '0.8rem' }} />
                          <YAxis stroke="#94a3b8" style={{ fontSize: '0.8rem' }} label={{ value: 'Depth (m)', angle: -90, position: 'insideLeft' }} />
                          <Tooltip
                            contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                            formatter={(value) => [`${value} m`, 'Depth']}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="predicted_level_m" stroke="#f43f5e" strokeWidth={2} name="Water Table Depth" />
                          <Line type="monotone" dataKey="rainfall_mm" stroke="#6366f1" strokeWidth={1} name="Rainfall (mm)" yAxisId="right" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                      {gwPredictions.map((pred, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: 16,
                            borderRadius: 8,
                            background: `${RISK_LEVEL_COLORS[pred.risk_level]}15`,
                            border: `1px solid ${RISK_LEVEL_COLORS[pred.risk_level]}40`
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div style={{ fontWeight: 700 }}>{pred.month}</div>
                            <div style={{ fontSize: '0.75rem', color: RISK_LEVEL_COLORS[pred.risk_level], fontWeight: 600, background: `${RISK_LEVEL_COLORS[pred.risk_level]}25`, padding: '4px 8px', borderRadius: 4 }}>
                              {pred.risk_level}
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                            <div>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 4 }}>Water Table</div>
                              <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                                {pred.predicted_level_m} <span style={{ fontSize: '0.8rem' }}>m</span>
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 4 }}>Rainfall</div>
                              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#6366f1' }}>
                                {pred.rainfall_mm} <span style={{ fontSize: '0.8rem' }}>mm</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8', borderTop: `1px solid ${RISK_LEVEL_COLORS[pred.risk_level]}30`, paddingTop: 8 }}>
                            Trend: <span style={{ color: RISK_LEVEL_COLORS[pred.trend], fontWeight: 600 }}>{pred.trend}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No predictions available</p>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Management Recommendations */}
          {activeTab === 'recommendations' && recommendations && (
            <div>
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header">
                  <div className="card-title"><Zap size={16} /> Actionable Insights</div>
                  <div className="card-badge">PRIORITY</div>
                </div>
                <div className="card-body">
                  <div style={{ display: 'grid', gap: 12 }}>
                    <div style={{ padding: 16, background: 'rgba(244,63,94,0.05)', borderRadius: 8, border: '1px solid rgba(244,63,94,0.2)' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <AlertTriangle size={20} style={{ color: '#f43f5e', marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>Immediate Priority</div>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1' }}>
                            {recommendations.actionable_insights.immediate_priority}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: 16, background: 'rgba(59,130,246,0.05)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.2)' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <Droplets size={20} style={{ color: '#3b82f6', marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>Seasonal Planning</div>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1' }}>
                            {recommendations.actionable_insights.seasonal_planning}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: 16, background: 'rgba(99,102,241,0.05)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <Calendar size={20} style={{ color: '#6366f1', marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>Monitoring Frequency</div>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1' }}>
                            {recommendations.actionable_insights.monitoring_frequency}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {recommendations.recommendations.criticalActions.length > 0 && (
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card-header">
                    <div className="card-title">🚨 Critical Actions</div>
                  </div>
                  <div className="card-body">
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {recommendations.recommendations.criticalActions.map((action, idx) => (
                        <li key={idx} style={{ padding: '12px 0', borderBottom: idx < recommendations.recommendations.criticalActions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'flex', gap: 12 }}>
                          <div style={{ color: '#f43f5e', fontWeight: 700, marginTop: 2 }}>•</div>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1' }}>{action}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {recommendations.recommendations.preventiveMeasures.length > 0 && (
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card-header">
                    <div className="card-title">📋 Preventive Measures</div>
                  </div>
                  <div className="card-body">
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {recommendations.recommendations.preventiveMeasures.map((measure, idx) => (
                        <li key={idx} style={{ padding: '12px 0', borderBottom: idx < recommendations.recommendations.preventiveMeasures.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'flex', gap: 12 }}>
                          <div style={{ color: '#f59e0b', fontWeight: 700, marginTop: 2 }}>◆</div>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1' }}>{measure}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {recommendations.recommendations.harvestingStrategy.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">🌊 Harvesting Strategy</div>
                  </div>
                  <div className="card-body">
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {recommendations.recommendations.harvestingStrategy.map((strategy, idx) => (
                        <li key={idx} style={{ padding: '12px 0', borderBottom: idx < recommendations.recommendations.harvestingStrategy.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'flex', gap: 12 }}>
                          <div style={{ color: '#10b981', fontWeight: 700, marginTop: 2 }}>✓</div>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1' }}>{strategy}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
