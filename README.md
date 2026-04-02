# 🌊 AquaTrace — North Bangalore Groundwater Intelligence System

A full-stack geospatial web app for monitoring groundwater levels in North Bangalore using GRACE satellite data + IoT sensors + AI predictions.

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JS |
| **Maps** | Leaflet.js (OpenStreetMap / CartoDB Dark Tiles) |
| **Charts** | Chart.js 4 |
| **Backend** | Node.js + Express.js |
| **Satellite Data** | GRACE-FO (NASA JPL) — simulated integration |
| **IoT Sensors** | Simulated real-time sensor network |
| **AI Predictions** | Rule-based AI with zone-specific recommendations |

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open in browser
http://localhost:3000
```

For development with auto-reload:
```bash
npm run dev
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/zones` | All 12 groundwater zones |
| GET | `/api/zones/:id` | Single zone with AI recommendations |
| GET | `/api/grace` | GRACE satellite time-series data |
| GET | `/api/rainfall` | Monthly rainfall + percolation analysis |
| GET | `/api/recharge-zones` | Identified recharge areas |
| GET | `/api/iot/sensors` | Live IoT sensor readings |
| GET | `/api/summary` | Dashboard summary statistics |
| POST | `/api/predict` | AI prediction for a specific location |
| GET | `/health` | Server health check |

### POST /api/predict — Request Body
```json
{
  "lat": 13.1007,
  "lng": 77.5963,
  "area_sqm": 300,
  "building_type": "residential",
  "rainfall_mm": 860
}
```

---

## 🗺 Monitored Zones (North Bangalore)

| Zone | Coordinates | Status |
|---|---|---|
| Yelahanka | 13.10°N, 77.59°E | Critical |
| Hebbal | 13.03°N, 77.59°E | Extremely Low |
| Devanahalli | 13.24°N, 77.71°E | Moderate |
| Doddaballapur | 13.29°N, 77.53°E | Low |
| Thanisandra | 13.06°N, 77.63°E | Extremely Low |
| Kogilu | 13.07°N, 77.60°E | Critical |
| Jakkur | 13.07°N, 77.59°E | Critical |
| Bagalur | 13.16°N, 77.73°E | High |
| Bellary Road | 13.11°N, 77.61°E | Extremely Low |
| Nandi Hills | 13.37°N, 77.68°E | Extremely High |
| Chikkajala | 13.18°N, 77.65°E | Low |
| Virgonagar | 13.02°N, 77.71°E | Critical |

---

## 🛰 GRACE Satellite Integration

The system uses **GRACE-FO (Gravity Recovery and Climate Experiment Follow-On)** data from NASA JPL:

- **Measurement**: Terrestrial Water Storage (TWS) anomaly in cm water equivalent
- **Baseline**: 2004–2009 mean
- **Resolution**: ~300km spatial, monthly temporal
- **Downscaling**: AI fusion with IoT ground-truth to reach 1–5km local resolution
- **Current Status**: -8.6 cm anomaly (below baseline = groundwater depletion)

**Data Source**: https://grace.jpl.nasa.gov/data/get-data/

---

## 📡 IoT Sensor Measurements

Each sensor provides:
- Water table depth (m)
- pH level
- TDS (Total Dissolved Solids) in ppm
- Turbidity (NTU)
- Temperature (°C)
- Battery level + signal strength

---

## 💧 Water Level Scale

| Level | Depth | Status |
|---|---|---|
| Extremely High | < 4m | 🟢 Optimal |
| High | 4–8m | 🟢 Good |
| Moderate | 8–12m | 🔵 Acceptable |
| Low | 12–15m | 🟡 Warning |
| Critical | 15–20m | 🟠 Alert |
| Extremely Low | > 20m | 🔴 Emergency |

---

## 🤖 AI Recommendations

The AI system analyzes each zone and recommends:
1. **Percolation Ponds** — Shallow excavations for rainwater infiltration
2. **Recharge Shafts** — Deep borings to bypass low-permeability layers
3. **Check Dams** — Barriers on seasonal streams
4. **Rooftop RWH** — Rainwater harvesting systems
5. **Soak Pit Networks** — Distributed infiltration points

---

## 🔮 Future Enhancements

- [ ] Real GRACE API integration (NASA Earthdata)
- [ ] Real IoT hardware integration (ESP32 + LoRa)
- [ ] ML-based groundwater level prediction (LSTM)
- [ ] BBMP/BWSSB regulatory alert integration
- [ ] Mobile app (React Native)
- [ ] Satellite image analysis (Google Earth Engine)
- [ ] Time-lapse water table visualization
- [ ] Community reporting portal

---

## 📜 License
MIT — Built for the North Bangalore Water Management Challenge
