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

  const next2MonthsRain = (Math.random() * 50 + 100).toFixed(1);
  const wholeYearRain = (Math.random() * 200 + 800).toFixed(1);
  const predictedWaterLevel = (nearest.groundwaterLevel + (Math.random() * 2 - 1)).toFixed(2);

  res.json({
    success: true,
    location: { lat, lng },
    nearest_zone: nearest.name,
    groundwater_status: nearest.status,
    current_level_m: nearest.groundwaterLevel,
    grace_anomaly_cm: nearest.graceAnomaly,
    predictions: {
      rain_next_2_months_mm: next2MonthsRain,
      rain_whole_year_mm: wholeYearRain,
      water_level_m: predictedWaterLevel
    },
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

// ==========================================
// AI PREDICTION ROUTES
// ==========================================

// POST /api/predict/rainfall - Predict upcoming months' rainfall using previous year data
router.post('/predict/rainfall', (req, res) => {
  const { months_ahead, previous_year_data } = req.body;
  const mAhead = months_ahead || 2;

  // Use provided previous year data or load from historical records
  const allYears = parseRainfallRecords();
  const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  // Build historical monthly averages from all years
  const monthlyAvg = Array(12).fill(0);
  const monthlyCount = Array(12).fill(0);
  allYears.forEach(y => {
    y.data.forEach((d, i) => {
      if (d.rainfall_mm > 0) {
        monthlyAvg[i] += d.rainfall_mm;
        monthlyCount[i]++;
      }
    });
  });
  for (let i = 0; i < 12; i++) {
    monthlyAvg[i] = monthlyCount[i] > 0 ? +(monthlyAvg[i] / monthlyCount[i]).toFixed(1) : 0;
  }

  // If user provided previous year data, apply weighted adjustment
  let adjustmentFactor = 1.0;
  if (previous_year_data && previous_year_data.length > 0) {
    const userTotal = previous_year_data.reduce((a, v) => a + (parseFloat(v) || 0), 0);
    const avgTotal = monthlyAvg.reduce((a, v) => a + v, 0);
    adjustmentFactor = avgTotal > 0 ? userTotal / avgTotal : 1.0;
    // Clamp to reasonable range
    adjustmentFactor = Math.max(0.5, Math.min(1.8, adjustmentFactor));
  }

  // Current month index
  const now = new Date();
  const currentMonthIdx = now.getMonth();

  // Generate predictions for next N months
  const predictions = [];
  for (let m = 0; m < mAhead; m++) {
    const idx = (currentMonthIdx + m + 1) % 12;
    const baseVal = monthlyAvg[idx] * adjustmentFactor;
    const variance = (Math.random() - 0.5) * baseVal * 0.2;
    const predicted = Math.max(0, +(baseVal + variance).toFixed(1));
    const confidence = +(0.65 + Math.random() * 0.25).toFixed(2);

    let riskLevel = 'LOW';
    if (predicted < 20) riskLevel = 'HIGH'; // very dry
    else if (predicted < 50) riskLevel = 'MODERATE';
    else if (predicted > 150) riskLevel = 'HIGH'; // flood risk
    else riskLevel = 'LOW';

    predictions.push({
      month: MONTHS_FULL[idx],
      month_index: idx,
      predicted_rainfall_mm: predicted,
      historical_avg_mm: monthlyAvg[idx],
      confidence,
      riskLevel,
      adjustment_factor: +adjustmentFactor.toFixed(2)
    });
  }

  // Full year prediction
  const fullYear = MONTHS_FULL.map((month, idx) => {
    const baseVal = monthlyAvg[idx] * adjustmentFactor;
    const variance = (Math.random() - 0.5) * baseVal * 0.15;
    const predicted = Math.max(0, +(baseVal + variance).toFixed(1));
    const confidence = +(0.55 + Math.random() * 0.30).toFixed(2);
    let riskLevel = 'LOW';
    if (predicted < 20) riskLevel = 'HIGH';
    else if (predicted < 50) riskLevel = 'MODERATE';
    else if (predicted > 150) riskLevel = 'HIGH';

    return { month, month_index: idx, predicted_rainfall_mm: predicted, historical_avg_mm: monthlyAvg[idx], confidence, riskLevel };
  });

  const annualTotal = +fullYear.reduce((a, m) => a + m.predicted_rainfall_mm, 0).toFixed(1);
  const lpaTotal = getLPA().lpa_1991_2020.total || 1077;
  const monsoonTotal = +fullYear.filter(m => [4,5,6,7,8,9].includes(m.month_index)).reduce((a, m) => a + m.predicted_rainfall_mm, 0).toFixed(1);

  res.json({
    success: true,
    upcoming_months: predictions,
    full_year: fullYear,
    annual_predicted_total: annualTotal,
    monsoon_predicted_total: monsoonTotal,
    lpa_comparison: {
      lpa_total: lpaTotal,
      percent_of_lpa: +((annualTotal / lpaTotal) * 100).toFixed(1),
      trend: annualTotal > lpaTotal ? 'Above Normal' : annualTotal > lpaTotal * 0.9 ? 'Near Normal' : 'Below Normal'
    },
    data_source: 'Historical 124-year rainfall analysis + user-provided previous year data',
    model: 'HYDRA-ML V2 (Weighted Historical Average + Variance)'
  });
});

// POST /api/predict/critical-areas - Identify critical areas based on predicted rainfall
router.post('/predict/critical-areas', (req, res) => {
  const { predicted_rainfall_mm, zone_id } = req.body;
  const rainfall = parseFloat(predicted_rainfall_mm) || 800;

  const lpaTotal = getLPA().lpa_1991_2020.total || 1077;
  const rainfallRatio = rainfall / lpaTotal;

  // Assess each zone's criticality based on current status + predicted rainfall
  const assessments = northBangaloreZones.map(zone => {
    let riskScore = 0;

    // Base risk from current groundwater depth
    if (zone.groundwaterLevel > 20) riskScore += 40;
    else if (zone.groundwaterLevel > 15) riskScore += 25;
    else if (zone.groundwaterLevel > 10) riskScore += 15;
    else riskScore += 5;

    // GRACE anomaly impact
    if (zone.graceAnomaly < -15) riskScore += 25;
    else if (zone.graceAnomaly < -10) riskScore += 15;
    else if (zone.graceAnomaly < 0) riskScore += 8;
    else riskScore -= 5;

    // Rainfall deficit increases risk
    if (rainfallRatio < 0.7) riskScore += 25;
    else if (rainfallRatio < 0.9) riskScore += 12;
    else if (rainfallRatio > 1.1) riskScore -= 10;

    // Recharge rate impact
    if (zone.rechargeRate < 0.5) riskScore += 15;
    else if (zone.rechargeRate < 1.0) riskScore += 8;
    else riskScore -= 5;

    // Borewell density pressure
    if (zone.borewellCount > 1000) riskScore += 10;
    else if (zone.borewellCount > 500) riskScore += 5;

    riskScore = Math.max(0, Math.min(100, riskScore));

    let severity = 'LOW';
    if (riskScore >= 70) severity = 'CRITICAL';
    else if (riskScore >= 50) severity = 'HIGH';
    else if (riskScore >= 30) severity = 'MODERATE';

    const rec = aiRecommendations[zone.status];

    return {
      zone_id: zone.id,
      zone_name: zone.name,
      lat: zone.lat,
      lng: zone.lng,
      current_depth_m: zone.groundwaterLevel,
      grace_anomaly_cm: zone.graceAnomaly,
      recharge_rate: zone.rechargeRate,
      borewell_count: zone.borewellCount,
      risk_score: riskScore,
      severity,
      predicted_rainfall_impact: rainfallRatio < 0.9 ? 'DEFICIT - Worsening expected' : rainfallRatio > 1.1 ? 'SURPLUS - Recovery possible' : 'NORMAL - Stable',
      actions: rec.immediate.slice(0, 2),
      estimated_recovery: rec.estimatedRecoveryTime
    };
  });

  // Sort by risk score descending
  assessments.sort((a, b) => b.risk_score - a.risk_score);

  const critical = assessments.filter(a => a.severity === 'CRITICAL');
  const high = assessments.filter(a => a.severity === 'HIGH');

  res.json({
    success: true,
    predicted_annual_rainfall_mm: rainfall,
    rainfall_vs_lpa_percent: +((rainfallRatio) * 100).toFixed(1),
    total_zones_assessed: assessments.length,
    critical_count: critical.length,
    high_risk_count: high.length,
    zones: assessments,
    overall_outlook: rainfallRatio < 0.8 ? 'SEVERE DEFICIT - Multiple zones at critical risk' :
      rainfallRatio < 0.95 ? 'BELOW NORMAL - Monitor closely' :
      rainfallRatio <= 1.05 ? 'NORMAL - Standard monitoring' :
      'ABOVE NORMAL - Recharge opportunity',
    model: 'HYDRA-ML V2 Critical Area Assessment'
  });
});

// POST /api/predict/recharge-zones - Predict recharge zone suitability
router.post('/predict/recharge-zones', (req, res) => {
  const { zone_id, previous_year_rainfall_mm, area_sqm, plot_type, predicted_annual_rainfall_mm } = req.body;

  const prevRain = parseFloat(previous_year_rainfall_mm) || 900;
  const predRain = parseFloat(predicted_annual_rainfall_mm) || 950;
  const area = parseFloat(area_sqm) || 500;
  const plotType = plot_type || 'residential';

  // Runoff coefficients by plot type
  const runoffCoeff = {
    residential: 0.35,
    commercial: 0.50,
    apartment: 0.45,
    industrial: 0.60,
    open_land: 0.15,
    park: 0.10
  };

  const coeff = runoffCoeff[plotType] || 0.35;
  const harvestCoeff = 1 - coeff; // What can be harvested

  // Harvest potential in liters per year
  const harvestPotential = Math.round(area * (predRain / 1000) * harvestCoeff * 1000);

  // Recharge potential
  const rechargePotential = Math.round(area * (predRain / 1000) * harvestCoeff * 0.6 * 1000);

  // Per-zone recharge assessment
  const zone = zone_id ? northBangaloreZones.find(z => z.id === zone_id) : null;

  // Soil percolation rates (mm/hour)
  const soilTypes = [
    { name: 'Sandy Loam', rate: 12.5, suitability: 'Excellent' },
    { name: 'Alluvial', rate: 18.3, suitability: 'Excellent' },
    { name: 'Red Laterite', rate: 6.2, suitability: 'Good' },
    { name: 'Clay', rate: 1.8, suitability: 'Poor' },
  ];

  // Recommended recharge structures based on area and rainfall
  const structures = [];
  if (area >= 100) {
    structures.push({
      name: 'Soak Pit',
      capacity_liters: Math.round(area * 0.8),
      cost_inr: Math.round(area * 70),
      roi_years: 1.5,
      effectiveness: area < 300 ? 'High' : 'Medium',
      description: 'Simple underground pit filled with rubble for rainwater percolation'
    });
  }
  if (area >= 200) {
    structures.push({
      name: 'Rooftop RWH System',
      capacity_liters: Math.round(area * (predRain / 1000) * harvestCoeff * 500),
      cost_inr: Math.round(area * 150),
      roi_years: 2,
      effectiveness: 'High',
      description: 'Collects rooftop rainwater and channels to storage/recharge pit'
    });
  }
  if (area >= 500) {
    structures.push({
      name: 'Percolation Pond',
      capacity_liters: Math.round(area * 3),
      cost_inr: Math.round(area * 500),
      roi_years: 4,
      effectiveness: 'Very High',
      description: 'Shallow excavated pond allowing water to percolate into the aquifer'
    });
  }
  if (area >= 1000) {
    structures.push({
      name: 'Recharge Shaft',
      capacity_liters: Math.round(area * 1.5),
      cost_inr: 180000,
      roi_years: 3,
      effectiveness: 'Very High',
      description: 'Vertical boring (30-60m) bypassing impermeable layers for deep recharge'
    });
  }
  structures.push({
    name: 'Recharge Trench',
    capacity_liters: Math.round(area * 0.4),
    cost_inr: Math.round(area * 40),
    roi_years: 1,
    effectiveness: 'Medium',
    description: 'Shallow trench filled with gravel for surface runoff infiltration'
  });

  const rainfallTrend = predRain > prevRain ? 'INCREASING' : predRain < prevRain * 0.9 ? 'DECREASING' : 'STABLE';

  res.json({
    success: true,
    input_summary: {
      zone: zone ? zone.name : 'Custom Location',
      zone_id: zone_id || null,
      previous_year_rainfall_mm: prevRain,
      predicted_annual_rainfall_mm: predRain,
      area_sqm: area,
      plot_type: plotType,
      runoff_coefficient: coeff
    },
    rainfall_trend: rainfallTrend,
    harvest_potential_liters: harvestPotential,
    recharge_potential_liters: rechargePotential,
    water_saved_per_year_liters: harvestPotential,
    co2_offset_kg: +(harvestPotential * 0.0003).toFixed(1),
    recommended_structures: structures.sort((a, b) => a.roi_years - b.roi_years),
    soil_analysis: soilTypes,
    zone_specific: zone ? {
      current_depth_m: zone.groundwaterLevel,
      grace_anomaly_cm: zone.graceAnomaly,
      current_recharge_rate: zone.rechargeRate,
      potential_recharge_improvement: +(zone.rechargeRate * 1.5 + rechargePotential / 365000).toFixed(2),
      estimated_depth_improvement_m: +(rechargePotential / (area * 10) * 0.01).toFixed(2)
    } : null,
    optimal_months: ['June', 'July', 'August', 'September', 'October'],
    model: 'HYDRA-ML V2 Recharge Zone Predictor'
  });
});

module.exports = router;
