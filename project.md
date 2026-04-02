Now let me build this comprehensive full-stack application. I'll create the complete Node.js backend + stunning frontend dashboard.Now the stunning frontend:Here's the complete **AquaTrace** full-stack application — 2,500+ lines across 6 files. Here's what's inside:

---

## 📁 File Structure

```
groundwater-app/
├── server.js              ← Express server (port 3000)
├── package.json           ← Dependencies
├── routes/api.js          ← All 8 REST endpoints
├── data/bangalore-data.js ← GRACE + IoT + zone data for 12 North BLR zones
├── public/index.html      ← Full dashboard frontend (1,959 lines)
└── README.md              ← Full documentation
```

---

## 🖥 6 Dashboard Pages

| Page | What It Shows |
|---|---|
| **01 Dashboard** | Live map (Leaflet) of 12 zones colored by water level, zone list with depth bars, GRACE time-series chart |
| **02 GRACE Satellite** | TWS anomaly bar chart, how GRACE works, peak depletion -22.4cm, AI downscaling explanation |
| **03 IoT Sensors** | 12 sensor cards with live pH, TDS, turbidity, temperature, battery % |
| **04 Recharge Zones** | Geospatial map with polygon overlays for Nandi Hills, Arkavathi, Yelahanka catchment areas |
| **05 AI Predict** | Input your zone/plot size → get risk level, harvesting potential (liters/year), ranked solutions by ROI |
| **06 Rainfall Analysis** | Monthly rainfall bars, percolation rates by soil type, recharge potential dual-axis chart |

---

## 🚀 To Run

```bash
npm install
npm start
# → http://localhost:3000
```

The frontend works **standalone** too (open `index.html` directly) — it falls back to built-in mock data when the backend isn't running.