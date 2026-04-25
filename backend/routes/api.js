const express = require('express');
const router = express.Router();
const {
  northBangaloreZones,
  monthlyRainfallData,
  graceTimeSeriesData,
  rechargeZones,
  aiRecommendations
} = require('../data/bangalore-data');

// GET /api/zones - All groundwater zones
router.get('/zones', (req, res) => {
  const { status } = req.query;
  let zones = northBangaloreZones;

  if (status) {
    zones = zones.filter(z => z.status === status);
  }

  // Add real-time simulation: small random variation
  const liveZones = zones.map(zone => ({
    ...zone,
    groundwaterLevel: +(zone.groundwaterLevel + (Math.random() - 0.5) * 0.2).toFixed(2),
    rechargeRate: +(zone.rechargeRate + (Math.random() - 0.5) * 0.05).toFixed(3),
    lastUpdated: new Date().toISOString()
  }));

  res.json({
    success: true,
    count: liveZones.length,
    data: liveZones,
    timestamp: new Date().toISOString()
  });
});

// GET /api/zones/:id - Single zone details
router.get('/zones/:id', (req, res) => {
  const zone = northBangaloreZones.find(z => z.id === req.params.id);
  if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });

  res.json({
    success: true,
    data: {
      ...zone,
      recommendations: aiRecommendations[zone.status],
      historicalRainfall: monthlyRainfallData
    }
  });
});

// GET /api/grace - GRACE satellite time series
router.get('/grace', (req, res) => {
  res.json({
    success: true,
    data: graceTimeSeriesData,
    metadata: {
      satellite: "GRACE-FO (Gravity Recovery and Climate Experiment Follow-On)",
      unit: "cm water equivalent anomaly",
      baseline: "2004-2009 mean",
      region: "North Bangalore (12.9°N - 13.4°N, 77.5°E - 77.8°E)",
      source: "NASA JPL GRACE Terrestrial Water Storage"
    }
  });
});

// Load historical rainfall JSON
const rainfallJSON = require('../data/rainfall-analysis.json');
const MONTHS_KEY = ['Jan','Feb','Mar','Apr','May','June','July','Aug','Sept','Oct','Nov','Dec'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function parseRainfallRecords() {
  return rainfallJSON.records
    .filter(r => r[1] && !r[1].startsWith('LPA'))
    .map(r => {
      const monthly = MONTHS_SHORT.map((m, i) => ({ month: m, rainfall_mm: parseFloat(r[i + 2]) || 0 }));
      const total = monthly.reduce((a, d) => a + d.rainfall_mm, 0);
      return {
        year: r[1],
        data: monthly,
        total: +total.toFixed(1),
        elNino: r[15] === 'Y',
        laNina: r[16] === 'Y'
      };
    });
}

function getLPA() {
  const lpa1 = rainfallJSON.records.find(r => r[1] && r[1].startsWith('LPA (1991'));
  const lpa2 = rainfallJSON.records.find(r => r[1] && r[1].startsWith('LPA (1981'));
  const parse = (row) => row ? MONTHS_SHORT.map((m, i) => ({ month: m, rainfall_mm: parseFloat(row[i + 2]) || 0 })) : [];
  return {
    lpa_1991_2020: { label: 'LPA 1991-2020', data: parse(lpa1), total: lpa1 ? parseFloat(lpa1[14]) || 0 : 0 },
    lpa_1981_2010: { label: 'LPA 1981-2010', data: parse(lpa2), total: lpa2 ? parseFloat(lpa2[14]) || 0 : 0 }
  };
}

// GET /api/rainfall - Full historical rainfall analysis
router.get('/rainfall', (req, res) => {
  const allYears = parseRainfallRecords();
  const { year, from, to } = req.query;

  let filtered = allYears;
  if (year) filtered = allYears.filter(y => y.year === year);
  else if (from || to) {
    const f = parseInt(from) || 1901, t = parseInt(to) || 2024;
    filtered = allYears.filter(y => parseInt(y.year) >= f && parseInt(y.year) <= t);
  }

  // Decade averages
  const decades = {};
  allYears.forEach(y => {
    const dec = Math.floor(parseInt(y.year) / 10) * 10 + 's';
    if (!decades[dec]) decades[dec] = [];
    decades[dec].push(y.total);
  });
  const decadeAvg = Object.entries(decades).map(([dec, vals]) => ({
    decade: dec, avg: +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1), count: vals.length
  }));

  // El Niño vs La Niña stats
  const elNinoYears = allYears.filter(y => y.elNino);
  const laNinaYears = allYears.filter(y => y.laNina);
  const normalYears = allYears.filter(y => !y.elNino && !y.laNina);

  res.json({
    success: true,
    data: filtered,
    total_years: allYears.length,
    available_years: allYears.map(y => y.year),
    lpa: getLPA(),
    decade_averages: decadeAvg,
    climate_analysis: {
      el_nino: { count: elNinoYears.length, avg_total: +(elNinoYears.reduce((a, y) => a + y.total, 0) / elNinoYears.length).toFixed(1) },
      la_nina: { count: laNinaYears.length, avg_total: +(laNinaYears.reduce((a, y) => a + y.total, 0) / laNinaYears.length).toFixed(1) },
      normal: { count: normalYears.length, avg_total: +(normalYears.reduce((a, y) => a + y.total, 0) / normalYears.length).toFixed(1) }
    },
    percolation_analysis: {
      optimal_months_for_recharge: ["Jun", "Jul", "Aug", "Sep", "Oct"],
      percolation_rate_mm_per_hour: { sandy_loam: 12.5, red_laterite: 6.2, clay: 1.8, alluvial: 18.3 },
      recommended_pond_capacity_liters: { residential_100sqm: 45000, commercial_500sqm: 225000, industrial_1000sqm: 450000 }
    }
  });
});

// GET /api/borewells - Borewell inventory data with zone filtering
router.get('/borewells', (req, res) => {
  try {
    const borewells = require('../data/borewells.json');
    const { zone } = req.query;

    // Zone distribution
    const zoneCounts = {};
    borewells.forEach(b => { zoneCounts[b.zone] = (zoneCounts[b.zone] || 0) + 1; });
    const zones = Object.entries(zoneCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    const filtered = zone && zone !== 'all' ? borewells.filter(b => b.zone === zone) : borewells;

    res.json({
      success: true,
      count: filtered.length,
      total: borewells.length,
      zones,
      data: filtered
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load borewell data' });
  }
});

// GET /api/recharge-zones - Identified recharge areas
router.get('/recharge-zones', (req, res) => {
  res.json({
    success: true,
    data: rechargeZones,
    summary: {
      total_zones: rechargeZones.length,
      total_area_sqkm: rechargeZones.reduce((a, z) => a + z.area, 0).toFixed(1),
      high_priority_zones: rechargeZones.filter(z => z.potentialRecharge === "Very High" || z.potentialRecharge === "High").length
    }
  });
});

// POST /api/predict - AI prediction for a specific location
router.post('/predict', (req, res) => {
  const { lat, lng, area_sqm, building_type, rainfall_mm } = req.body;

  if (!lat || !lng) {
    return res.status(400).json({ success: false, message: 'Latitude and longitude required' });
  }

  // Find nearest zone
  let nearest = northBangaloreZones[0];
  let minDist = Infinity;

  northBangaloreZones.forEach(zone => {
    const dist = Math.sqrt(Math.pow(zone.lat - lat, 2) + Math.pow(zone.lng - lng, 2));
    if (dist < minDist) { minDist = dist; nearest = zone; }
  });

  const rec = aiRecommendations[nearest.status];
  const harvestPotential = area_sqm ? (area_sqm * (rainfall_mm || 800) * 0.8 / 1000).toFixed(0) : null;

  res.json({
    success: true,
    location: { lat, lng },
    nearest_zone: nearest.name,
    groundwater_status: nearest.status,
    current_level_m: nearest.groundwaterLevel,
    grace_anomaly_cm: nearest.graceAnomaly,
    ai_prediction: {
      risk_level: rec.priority,
      estimated_recovery: rec.estimatedRecoveryTime,
      recommendations: rec,
      rainwater_harvest_potential_liters_year: harvestPotential,
      solutions_ranked: [
        { solution: "Percolation Pond", roi_years: 4, effectiveness: "High", cost_inr: 250000 },
        { solution: "Rooftop RWH", roi_years: 2, effectiveness: "Medium", cost_inr: 45000 },
        { solution: "Recharge Shaft", roi_years: 3, effectiveness: "Very High", cost_inr: 180000 },
        { solution: "Check Dam", roi_years: 7, effectiveness: "High", cost_inr: 850000 },
        { solution: "Soak Pit Network", roi_years: 2, effectiveness: "Medium", cost_inr: 35000 }
      ]
    }
  });
});

// GET /api/iot/sensors - All IoT sensor readings
router.get('/iot/sensors', (req, res) => {
  const sensors = northBangaloreZones.map(zone => ({
    sensor_id: zone.iotSensorId,
    zone: zone.name,
    lat: zone.lat,
    lng: zone.lng,
    readings: {
      water_table_depth_m: +(zone.groundwaterLevel + (Math.random() - 0.5) * 0.3).toFixed(2),
      turbidity_ntu: +(Math.random() * 15 + 0.5).toFixed(1),
      ph: +(Math.random() * 2 + 6.5).toFixed(2),
      tds_ppm: +(Math.random() * 400 + 200).toFixed(0),
      temperature_c: +(Math.random() * 5 + 24).toFixed(1),
      battery_percent: Math.floor(Math.random() * 40 + 60),
      signal_strength_dbm: -Math.floor(Math.random() * 40 + 50),
      online: Math.random() > 0.1
    },
    last_ping: new Date(Date.now() - Math.random() * 300000).toISOString()
  }));

  res.json({
    success: true,
    count: sensors.length,
    data: sensors,
    network_health: {
      total_sensors: sensors.length,
      online: sensors.filter(s => s.readings.online).length,
      offline: sensors.filter(s => !s.readings.online).length,
      avg_battery: (sensors.reduce((a, s) => a + s.readings.battery_percent, 0) / sensors.length).toFixed(0)
    }
  });
});

// GET /api/summary - Dashboard summary stats
router.get('/summary', (req, res) => {
  const critical = northBangaloreZones.filter(z => z.status === 'critical' || z.status === 'extremely_low').length;
  const avgLevel = (northBangaloreZones.reduce((a, z) => a + z.groundwaterLevel, 0) / northBangaloreZones.length).toFixed(1);
  const totalBorewells = northBangaloreZones.reduce((a, z) => a + z.borewellCount, 0);

  res.json({
    success: true,
    data: {
      total_zones_monitored: northBangaloreZones.length,
      critical_zones: critical,
      average_water_table_depth_m: avgLevel,
      total_borewells_monitored: totalBorewells,
      zones_with_percolation_ponds: northBangaloreZones.filter(z => z.percolationPondExists).length,
      overall_grace_anomaly_cm: -8.6,
      last_satellite_pass: "2024-01-14T23:47:00Z",
      iot_sensors_online: 11,
      alert_level: "HIGH"
    }
  });
});

// ==================== RAINFALL & GROUNDWATER PREDICTION ENDPOINTS ====================

// GET /api/predict/rainfall-next-months - Predict rainfall for next 2 months
router.get('/predict/rainfall-next-months', (req, res) => {
  const { monthsAhead = 2 } = req.query;
  const predictions = require('../utils/predictions');

  try {
    const allYears = parseRainfallRecords();
    const rainfallPredictions = predictions.predictRainfallARIMA(allYears, Math.min(parseInt(monthsAhead), 12));

    res.json({
      success: true,
      prediction_type: 'SHORT_TERM',
      months_ahead: parseInt(monthsAhead),
      forecast_date: new Date().toISOString(),
      data: rainfallPredictions,
      methodology: 'ARIMA time series analysis with seasonal decomposition',
      summary: {
        predicted_total_mm: rainfallPredictions.reduce((a, p) => a + p.predicted_rainfall_mm, 0).toFixed(1),
        average_confidence: (rainfallPredictions.reduce((a, p) => a + parseFloat(p.confidence), 0) / rainfallPredictions.length).toFixed(2),
        risk_distribution: {
          high: rainfallPredictions.filter(p => p.riskLevel === 'HIGH').length,
          medium: rainfallPredictions.filter(p => p.riskLevel === 'MEDIUM').length,
          low: rainfallPredictions.filter(p => p.riskLevel === 'LOW').length
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Prediction failed', error: err.message });
  }
});

// GET /api/predict/rainfall-full-year - Predict rainfall for entire year
router.get('/predict/rainfall-full-year', (req, res) => {
  const predictions = require('../utils/predictions');

  try {
    const allYears = parseRainfallRecords();
    const yearlyForecast = predictions.predictFullYearRainfall(allYears);

    res.json({
      success: true,
      prediction_type: 'FULL_YEAR',
      forecast_date: new Date().toISOString(),
      forecast_year: new Date().getFullYear(),
      ...yearlyForecast,
      methodology: 'Ensemble learning with trend analysis and seasonal patterns',
      comparison_with_lpa: {
        lpa_total_mm: 1077,
        predicted_vs_lpa_percent: ((yearlyForecast.annualPredictedTotal - 1077) / 1077 * 100).toFixed(1),
        trend: yearlyForecast.annualPredictedTotal > 1077 ? 'ABOVE_AVERAGE' : 'BELOW_AVERAGE'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Full year prediction failed', error: err.message });
  }
});

// POST /api/predict/groundwater-levels - Predict groundwater levels for a zone
router.post('/predict/groundwater-levels', (req, res) => {
  const { zone_id, months_ahead = 2 } = req.body;
  const predictions = require('../utils/predictions');

  try {
    // Find zone
    const zone = northBangaloreZones.find(z => z.id === zone_id);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Zone not found' });
    }

    // Get rainfall predictions
    const allYears = parseRainfallRecords();
    const rainfallPredictions = predictions.predictRainfallARIMA(allYears, parseInt(months_ahead));

    // Get groundwater predictions
    const gwPredictions = predictions.predictGroundwaterLevels(zone, rainfallPredictions);

    res.json({
      success: true,
      zone: {
        id: zone.id,
        name: zone.name,
        current_level_m: zone.groundwaterLevel,
        status: zone.status,
        lat: zone.lat,
        lng: zone.lng
      },
      predictions: gwPredictions,
      summary: {
        average_predicted_level_m: (gwPredictions.reduce((a, p) => a + p.predicted_level_m, 0) / gwPredictions.length).toFixed(2),
        level_trend: gwPredictions[gwPredictions.length - 1].predicted_level_m > gwPredictions[0].predicted_level_m ? 'DECLINING' : 'IMPROVING',
        critical_months: gwPredictions.filter(p => p.risk_level === 'CRITICAL').map(p => p.month),
        improving_months: gwPredictions.filter(p => p.risk_level === 'IMPROVING').map(p => p.month)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Groundwater prediction failed', error: err.message });
  }
});

// POST /api/predict/water-management - Get water management recommendations
router.post('/predict/water-management', (req, res) => {
  const { zone_id, months_ahead = 2 } = req.body;
  const predictions = require('../utils/predictions');

  try {
    // Find zone
    const zone = northBangaloreZones.find(z => z.id === zone_id);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Zone not found' });
    }

    // Get rainfall predictions
    const allYears = parseRainfallRecords();
    const rainfallPredictions = predictions.predictRainfallARIMA(allYears, parseInt(months_ahead));

    // Get groundwater predictions
    const gwPredictions = predictions.predictGroundwaterLevels(zone, rainfallPredictions);

    // Get management recommendations
    const recommendations = predictions.generateWaterManagementRecommendations(zone, gwPredictions);

    res.json({
      success: true,
      zone: zone.name,
      zone_id: zone.id,
      zone_status: zone.status,
      current_groundwater_level_m: zone.groundwaterLevel,
      current_grace_anomaly_cm: zone.graceAnomaly,
      forecast_period: `${parseInt(months_ahead)} months`,
      recommendations,
      actionable_insights: {
        immediate_priority: gwPredictions.filter(p => p.risk_level === 'CRITICAL').length > 0 ? 'Deploy emergency water conservation measures' : 'Monitor regularly',
        seasonal_planning: zone.status === 'critical' || zone.status === 'extremely_low' ? 'Critical water deficit - activate recharge structures' : 'Maintain current practices',
        monitoring_frequency: recommendations.monitoringPriority === 'CRITICAL' ? 'Daily' : recommendations.monitoringPriority === 'HIGH' ? 'Weekly' : 'Monthly'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Water management recommendations failed', error: err.message });
  }
});

// GET /api/zones/:id/analysis - Comprehensive zone analysis with predictions
router.get('/zones/:id/analysis', (req, res) => {
  const zone = northBangaloreZones.find(z => z.id === req.params.id);
  if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });

  const predictions = require('../utils/predictions');

  try {
    const allYears = parseRainfallRecords();
    const rainfallPredictions = predictions.predictRainfallARIMA(allYears, 2);
    const gwPredictions = predictions.predictGroundwaterLevels(zone, rainfallPredictions);
    const recommendations = predictions.generateWaterManagementRecommendations(zone, gwPredictions);

    res.json({
      success: true,
      zone_details: {
        id: zone.id,
        name: zone.name,
        lat: zone.lat,
        lng: zone.lng,
        status: zone.status,
        groundwater_level_m: zone.groundwaterLevel,
        grace_anomaly_cm: zone.graceAnomaly,
        recharge_rate_mm_day: zone.rechargeRate,
        rainfall_30_days_mm: zone.rainfall30Days,
        borewell_count: zone.borewellCount,
        percolation_pond_exists: zone.percolationPondExists
      },
      rainfall_predictions: rainfallPredictions,
      groundwater_predictions: gwPredictions,
      management_recommendations: recommendations,
      risk_assessment: {
        current_risk_level: zone.status,
        predicted_risk_level: gwPredictions[gwPredictions.length - 1].risk_level,
        trend: gwPredictions[gwPredictions.length - 1].trend
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Zone analysis failed', error: err.message });
  }
});

module.exports = router;
