export const MOCK_ZONES = [
  { id:"zone_001", name:"Yelahanka", lat:13.1007, lng:77.5963, groundwaterLevel:18.4, graceAnomaly:-12.3, rechargeRate:0.8, status:"critical", iotSensorId:"IOT-YLK-001", borewellCount:847 },
  { id:"zone_002", name:"Hebbal", lat:13.0358, lng:77.5970, groundwaterLevel:22.1, graceAnomaly:-18.7, rechargeRate:0.4, status:"extremely_low", iotSensorId:"IOT-HBL-002", borewellCount:1243 },
  { id:"zone_003", name:"Devanahalli", lat:13.2483, lng:77.7109, groundwaterLevel:9.2, graceAnomaly:4.1, rechargeRate:2.3, status:"moderate", iotSensorId:"IOT-DVH-003", borewellCount:312 },
  { id:"zone_004", name:"Doddaballapur", lat:13.2956, lng:77.5373, groundwaterLevel:11.8, graceAnomaly:-3.2, rechargeRate:1.6, status:"low", iotSensorId:"IOT-DBP-004", borewellCount:528 },
  { id:"zone_005", name:"Thanisandra", lat:13.0654, lng:77.6317, groundwaterLevel:24.6, graceAnomaly:-22.4, rechargeRate:0.2, status:"extremely_low", iotSensorId:"IOT-TNS-005", borewellCount:1567 },
  { id:"zone_006", name:"Kogilu", lat:13.0785, lng:77.6098, groundwaterLevel:20.3, graceAnomaly:-15.8, rechargeRate:0.5, status:"critical", iotSensorId:"IOT-KGL-006", borewellCount:934 },
  { id:"zone_007", name:"Jakkur", lat:13.0743, lng:77.5978, groundwaterLevel:17.9, graceAnomaly:-10.1, rechargeRate:1.1, status:"critical", iotSensorId:"IOT-JKR-007", borewellCount:721 },
  { id:"zone_008", name:"Bagalur", lat:13.1652, lng:77.7388, groundwaterLevel:7.4, graceAnomaly:8.9, rechargeRate:3.1, status:"high", iotSensorId:"IOT-BGL-008", borewellCount:187 },
  { id:"zone_009", name:"Bellary Road", lat:13.1104, lng:77.6156, groundwaterLevel:21.7, graceAnomaly:-19.3, rechargeRate:0.3, status:"extremely_low", iotSensorId:"IOT-BRC-009", borewellCount:1893 },
  { id:"zone_010", name:"Nandi Hills", lat:13.3703, lng:77.6839, groundwaterLevel:4.1, graceAnomaly:14.2, rechargeRate:4.7, status:"extremely_high", iotSensorId:"IOT-NDH-010", borewellCount:94 },
  { id:"zone_011", name:"Chikkajala", lat:13.1893, lng:77.6587, groundwaterLevel:13.2, graceAnomaly:-5.6, rechargeRate:1.4, status:"low", iotSensorId:"IOT-CKJ-011", borewellCount:445 },
  { id:"zone_012", name:"Virgonagar", lat:13.0236, lng:77.7112, groundwaterLevel:16.8, graceAnomaly:-9.4, rechargeRate:0.9, status:"critical", iotSensorId:"IOT-VGN-012", borewellCount:612 }
];

export const GRACE_DATA = [
  {month:"Jan 23",anomaly:-8.2},{month:"Feb 23",anomaly:-9.1},{month:"Mar 23",anomaly:-7.8},
  {month:"Apr 23",anomaly:-5.4},{month:"May 23",anomaly:-2.1},{month:"Jun 23",anomaly:3.4},
  {month:"Jul 23",anomaly:6.7},{month:"Aug 23",anomaly:8.1},{month:"Sep 23",anomaly:9.4},
  {month:"Oct 23",anomaly:7.2},{month:"Nov 23",anomaly:2.8},{month:"Dec 23",anomaly:-3.6},
  {month:"Jan 24",anomaly:-11.3},{month:"Feb 24",anomaly:-13.8},{month:"Mar 24",anomaly:-15.2}
];

export const STATUS_COLORS = {
  extremely_low: '#f43f5e', critical: '#f59e0b', low: '#fb923c',
  moderate: '#3b82f6', high: '#10b981', extremely_high: '#6366f1'
};

export const STATUS_LABELS = {
  extremely_low: 'Extremely Low', critical: 'Critical', low: 'Low',
  moderate: 'Moderate', high: 'High', extremely_high: 'Extremely High'
};

export const AI_RECS = {
  extremely_low: { priority:"CRITICAL", estimatedRecoveryTime:"18-24 months with intervention", immediate:["Emergency borewell moratorium","Deploy mobile water tankers","Activate crisis water management protocol"], shortTerm:["Construct percolation ponds (3-5 units)","Install rooftop rainwater harvesting","Create check dams on storm drains"], longTerm:["Managed Aquifer Recharge (MAR) program","Large-scale watershed restoration","Recharge shaft construction (50+ units)"] },
  critical: { priority:"HIGH", estimatedRecoveryTime:"12-18 months with intervention", immediate:["Regulate borewell extraction hours","Install flow meters on all borewells","Identify and seal illegal borewells"], shortTerm:["Construct 2-3 percolation ponds","Community rainwater harvesting program","Storm drain diversion to recharge pits"], longTerm:["Phased aquifer recharge program","Lake restoration and deepening","Permeable pavement installation"] },
  low: { priority:"MEDIUM", estimatedRecoveryTime:"6-12 months with intervention", immediate:["Monitor extraction rates closely","Public awareness campaign"], shortTerm:["Build 1-2 percolation ponds","Soak pits in residential complexes","Green infrastructure corridors"], longTerm:["Maintain intervention programs","Expand recharge zones"] },
  moderate: { priority:"WATCH", estimatedRecoveryTime:"Stable - maintain current measures", immediate:["Continue monitoring","Maintain existing recharge structures"], shortTerm:["Optimize percolation infrastructure"], longTerm:["Preventive maintenance","Expand lake network"] },
  high: { priority:"GOOD", estimatedRecoveryTime:"Positive trajectory", immediate:["Document best practices"], shortTerm:["Replicate successful models","Establish groundwater banking"], longTerm:["Sustain recharge programs"] },
  extremely_high: { priority:"EXCELLENT", estimatedRecoveryTime:"Optimal - replicate model", immediate:["Monitor to prevent waterlogging"], shortTerm:["Export model to depleted zones"], longTerm:["Groundwater banking","Carbon credits for recharge"] }
};

export const RAINFALL_2023 = [8.2, 12.1, 31.4, 48.7, 89.3, 124.6, 98.4, 87.2, 134.8, 112.3, 22.1, 6.4];
export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function depthToPercent(depth) {
  return Math.max(0, Math.min(100, 100 - (depth / 30) * 100));
}
