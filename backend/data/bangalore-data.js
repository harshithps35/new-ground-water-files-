// North Bangalore Groundwater Data - GRACE Satellite + IoT Sensors
// Real coordinates for North Bangalore zones

const northBangaloreZones = [
  {
    id: "zone_001",
    name: "Yelahanka",
    lat: 13.1007,
    lng: 77.5963,
    groundwaterLevel: 18.4,    // meters below ground
    graceAnomaly: -12.3,       // cm water equivalent (negative = depletion)
    rechargeRate: 0.8,          // mm/day
    status: "critical",
    iotSensorId: "IOT-YLK-001",
    lastUpdated: "2024-01-15T08:30:00Z",
    rainfall30Days: 12.4,
    borewellCount: 847,
    percolationPondExists: false
  },
  {
    id: "zone_002",
    name: "Hebbal",
    lat: 13.0358,
    lng: 77.5970,
    groundwaterLevel: 22.1,
    graceAnomaly: -18.7,
    rechargeRate: 0.4,
    status: "extremely_low",
    iotSensorId: "IOT-HBL-002",
    lastUpdated: "2024-01-15T08:31:00Z",
    rainfall30Days: 10.2,
    borewellCount: 1243,
    percolationPondExists: false
  },
  {
    id: "zone_003",
    name: "Devanahalli",
    lat: 13.2483,
    lng: 77.7109,
    groundwaterLevel: 9.2,
    graceAnomaly: 4.1,
    rechargeRate: 2.3,
    status: "moderate",
    iotSensorId: "IOT-DVH-003",
    lastUpdated: "2024-01-15T08:32:00Z",
    rainfall30Days: 28.6,
    borewellCount: 312,
    percolationPondExists: true
  },
  {
    id: "zone_004",
    name: "Doddaballapur",
    lat: 13.2956,
    lng: 77.5373,
    groundwaterLevel: 11.8,
    graceAnomaly: -3.2,
    rechargeRate: 1.6,
    status: "low",
    iotSensorId: "IOT-DBP-004",
    lastUpdated: "2024-01-15T08:33:00Z",
    rainfall30Days: 19.3,
    borewellCount: 528,
    percolationPondExists: false
  },
  {
    id: "zone_005",
    name: "Thanisandra",
    lat: 13.0654,
    lng: 77.6317,
    groundwaterLevel: 24.6,
    graceAnomaly: -22.4,
    rechargeRate: 0.2,
    status: "extremely_low",
    iotSensorId: "IOT-TNS-005",
    lastUpdated: "2024-01-15T08:34:00Z",
    rainfall30Days: 8.1,
    borewellCount: 1567,
    percolationPondExists: false
  },
  {
    id: "zone_006",
    name: "Kogilu",
    lat: 13.0785,
    lng: 77.6098,
    groundwaterLevel: 20.3,
    graceAnomaly: -15.8,
    rechargeRate: 0.5,
    status: "critical",
    iotSensorId: "IOT-KGL-006",
    lastUpdated: "2024-01-15T08:35:00Z",
    rainfall30Days: 11.7,
    borewellCount: 934,
    percolationPondExists: false
  },
  {
    id: "zone_007",
    name: "Jakkur",
    lat: 13.0743,
    lng: 77.5978,
    groundwaterLevel: 17.9,
    graceAnomaly: -10.1,
    rechargeRate: 1.1,
    status: "critical",
    iotSensorId: "IOT-JKR-007",
    lastUpdated: "2024-01-15T08:36:00Z",
    rainfall30Days: 15.4,
    borewellCount: 721,
    percolationPondExists: true
  },
  {
    id: "zone_008",
    name: "Bagalur",
    lat: 13.1652,
    lng: 77.7388,
    groundwaterLevel: 7.4,
    graceAnomaly: 8.9,
    rechargeRate: 3.1,
    status: "high",
    iotSensorId: "IOT-BGL-008",
    lastUpdated: "2024-01-15T08:37:00Z",
    rainfall30Days: 42.1,
    borewellCount: 187,
    percolationPondExists: true
  },
  {
    id: "zone_009",
    name: "Bellary Road Corridor",
    lat: 13.1104,
    lng: 77.6156,
    groundwaterLevel: 21.7,
    graceAnomaly: -19.3,
    rechargeRate: 0.3,
    status: "extremely_low",
    iotSensorId: "IOT-BRC-009",
    lastUpdated: "2024-01-15T08:38:00Z",
    rainfall30Days: 9.8,
    borewellCount: 1893,
    percolationPondExists: false
  },
  {
    id: "zone_010",
    name: "Nandi Hills Foothills",
    lat: 13.3703,
    lng: 77.6839,
    groundwaterLevel: 4.1,
    graceAnomaly: 14.2,
    rechargeRate: 4.7,
    status: "extremely_high",
    iotSensorId: "IOT-NDH-010",
    lastUpdated: "2024-01-15T08:39:00Z",
    rainfall30Days: 67.3,
    borewellCount: 94,
    percolationPondExists: true
  },
  {
    id: "zone_011",
    name: "Chikkajala",
    lat: 13.1893,
    lng: 77.6587,
    groundwaterLevel: 13.2,
    graceAnomaly: -5.6,
    rechargeRate: 1.4,
    status: "low",
    iotSensorId: "IOT-CKJ-011",
    lastUpdated: "2024-01-15T08:40:00Z",
    rainfall30Days: 16.8,
    borewellCount: 445,
    percolationPondExists: false
  },
  {
    id: "zone_012",
    name: "Virgonagar",
    lat: 13.0236,
    lng: 77.7112,
    groundwaterLevel: 16.8,
    graceAnomaly: -9.4,
    rechargeRate: 0.9,
    status: "critical",
    iotSensorId: "IOT-VGN-012",
    lastUpdated: "2024-01-15T08:41:00Z",
    rainfall30Days: 13.6,
    borewellCount: 612,
    percolationPondExists: false
  }
];

const monthlyRainfallData = {
  "2023": [8.2, 12.1, 31.4, 48.7, 89.3, 124.6, 98.4, 87.2, 134.8, 112.3, 22.1, 6.4],
  "2024": [5.1, 9.8, 28.7, 52.3, 94.1, 0, 0, 0, 0, 0, 0, 0] // partial year
};

const graceTimeSeriesData = [
  { month: "Jan 2023", anomaly: -8.2 },
  { month: "Feb 2023", anomaly: -9.1 },
  { month: "Mar 2023", anomaly: -7.8 },
  { month: "Apr 2023", anomaly: -5.4 },
  { month: "May 2023", anomaly: -2.1 },
  { month: "Jun 2023", anomaly: 3.4 },
  { month: "Jul 2023", anomaly: 6.7 },
  { month: "Aug 2023", anomaly: 8.1 },
  { month: "Sep 2023", anomaly: 9.4 },
  { month: "Oct 2023", anomaly: 7.2 },
  { month: "Nov 2023", anomaly: 2.8 },
  { month: "Dec 2023", anomaly: -3.6 },
  { month: "Jan 2024", anomaly: -11.3 },
  { month: "Feb 2024", anomaly: -13.8 },
  { month: "Mar 2024", anomaly: -15.2 }
];

const rechargeZones = [
  {
    id: "rz_001",
    name: "Nandi Hills Watershed",
    type: "natural_recharge",
    area: 142.3,
    potentialRecharge: "Very High",
    soilType: "Sandy Loam",
    coordinates: [[13.35, 77.65], [13.40, 77.72], [13.38, 77.70], [13.33, 77.66]]
  },
  {
    id: "rz_002",
    name: "Arkavathi River Basin",
    type: "river_recharge",
    area: 87.6,
    potentialRecharge: "High",
    soilType: "Alluvial",
    coordinates: [[13.20, 77.52], [13.28, 77.58], [13.22, 77.62], [13.15, 77.56]]
  },
  {
    id: "rz_003",
    name: "Yelahanka Lake Catchment",
    type: "lake_recharge",
    area: 34.2,
    potentialRecharge: "Moderate",
    soilType: "Red Laterite",
    coordinates: [[13.09, 77.58], [13.12, 77.62], [13.10, 77.65], [13.07, 77.61]]
  }
];

const aiRecommendations = {
  extremely_low: {
    immediate: ["Emergency borewell moratorium", "Deploy mobile water tankers", "Activate crisis water management protocol"],
    shortTerm: ["Construct percolation ponds (3-5 units)", "Install rooftop rainwater harvesting in all buildings", "Create check dams on storm drains"],
    longTerm: ["Managed Aquifer Recharge (MAR) program", "Large-scale watershed restoration", "Recharge shaft construction (50+ units)"],
    priority: "CRITICAL",
    estimatedRecoveryTime: "18-24 months with intervention"
  },
  critical: {
    immediate: ["Regulate borewell extraction hours", "Install flow meters on all borewells", "Identify and seal illegal borewells"],
    shortTerm: ["Construct 2-3 percolation ponds", "Community rainwater harvesting program", "Storm drain diversion to recharge pits"],
    longTerm: ["Phased aquifer recharge program", "Lake restoration and deepening", "Permeable pavement installation in parking areas"],
    priority: "HIGH",
    estimatedRecoveryTime: "12-18 months with intervention"
  },
  low: {
    immediate: ["Monitor extraction rates closely", "Public awareness campaign on water conservation"],
    shortTerm: ["Build 1-2 percolation ponds", "Soak pits in residential complexes", "Green infrastructure corridors"],
    longTerm: ["Maintain current intervention programs", "Expand recharge zones"],
    priority: "MEDIUM",
    estimatedRecoveryTime: "6-12 months with intervention"
  },
  moderate: {
    immediate: ["Continue monitoring", "Maintain existing recharge structures"],
    shortTerm: ["Optimize existing percolation infrastructure", "Educational programs in schools"],
    longTerm: ["Preventive maintenance of recharge zones", "Expand lake network"],
    priority: "WATCH",
    estimatedRecoveryTime: "Stable - maintain current measures"
  },
  high: {
    immediate: ["Document best practices", "Share recharge methodology"],
    shortTerm: ["Replicate successful models in low zones", "Establish groundwater banking"],
    longTerm: ["Sustain recharge programs", "Expand green cover"],
    priority: "GOOD",
    estimatedRecoveryTime: "Positive trajectory - sustain"
  },
  extremely_high: {
    immediate: ["Monitor to prevent waterlogging", "Document recharge success factors"],
    shortTerm: ["Export model to depleted zones", "Balance extraction for equity"],
    longTerm: ["Groundwater banking and inter-zone transfers", "Carbon credit for recharge programs"],
    priority: "EXCELLENT",
    estimatedRecoveryTime: "Optimal - replicate model"
  }
};

module.exports = {
  northBangaloreZones,
  monthlyRainfallData,
  graceTimeSeriesData,
  rechargeZones,
  aiRecommendations
};
