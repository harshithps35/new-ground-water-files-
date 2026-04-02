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

// GET /api/rainfall - Monthly rainfall analysis
router.get('/rainfall', (req, res) => {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const yearlyData = Object.entries(monthlyRainfallData).map(([year, values]) => ({
    year,
    data: values.map((v, i) => ({ month: months[i], rainfall_mm: v })),
    total: values.reduce((a, b) => a + b, 0).toFixed(1),
    average: (values.filter(v => v > 0).reduce((a, b) => a + b, 0) / values.filter(v => v > 0).length).toFixed(1)
  }));

  res.json({
    success: true,
    data: yearlyData,
    percolation_analysis: {
      optimal_months_for_recharge: ["Jun", "Jul", "Aug", "Sep", "Oct"],
      percolation_rate_mm_per_hour: {
        sandy_loam: 12.5,
        red_laterite: 6.2,
        clay: 1.8,
        alluvial: 18.3
      },
      recommended_pond_capacity_liters: {
        residential_100sqm: 45000,
        commercial_500sqm: 225000,
        industrial_1000sqm: 450000
      }
    }
  });
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

module.exports = router;
