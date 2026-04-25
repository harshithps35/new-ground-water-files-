import { useState, useEffect } from 'react';
import { LayoutDashboard, Satellite, Radio, TreePine, Brain, CloudRain, LogOut, Droplets, Bell, ChevronLeft, ChevronRight, Map as MapIcon, Gauge, Zap } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import GraceSatellite from './pages/GraceSatellite';
import IoTSensors from './pages/IoTSensors';
import RechargeZones from './pages/RechargeZones';
import AiPredict from './pages/AiPredict';
import Rainfall from './pages/Rainfall';
import BorewellInventory from './pages/BorewellInventory';
import Login from './pages/Login';
import RegionSelect from './pages/RegionSelect';
import './App.css';

const NAV_ITEMS = [
  { id: 'predict', label: 'AI Predict', icon: Brain },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'satellite', label: 'GRACE Satellite', icon: Satellite },
  { id: 'borewells', label: 'Borewell Inventory', icon: MapIcon },
  { id: 'iot', label: 'IoT Sensors', icon: Radio },
  { id: 'recharge', label: 'Recharge Zones', icon: TreePine },
  { id: 'rainfall', label: 'Rainfall', icon: CloudRain },
];

export default function App() {
  const [page, setPage] = useState('predict');
  const [user, setUser] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [aiPredictions, setAiPredictions] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [clock, setClock] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('aquatrace_user');
    if (stored) setUser(JSON.parse(stored));
    const storedRegion = localStorage.getItem('aquatrace_region');
    if (storedRegion) setSelectedRegion(JSON.parse(storedRegion));
  }, []);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleLogin = (u) => {
    setUser(u);
    localStorage.setItem('aquatrace_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedRegion(null);
    localStorage.removeItem('aquatrace_user');
    localStorage.removeItem('aquatrace_region');
  };

  const handleRegionSelect = (region) => {
    setSelectedRegion(region);
    localStorage.setItem('aquatrace_region', JSON.stringify(region));
  };

  const handleChangeRegion = () => {
    setSelectedRegion(null);
    localStorage.removeItem('aquatrace_region');
  };

  // Step 1: Login
  if (!user) return <Login onLogin={handleLogin} />;
  
  // Step 2: Region Selection (after login, before dashboard)
  if (!selectedRegion) return <RegionSelect onSelect={handleRegionSelect} />;

  const renderPage = () => {
    switch (page) {
      case 'satellite': return <GraceSatellite selectedRegion={selectedRegion} />;
      case 'borewells': return <BorewellInventory />;
      case 'iot': return <IoTSensors selectedRegion={selectedRegion} />;
      case 'recharge': return <RechargeZones selectedRegion={selectedRegion} />;
      case 'predict': return <AiPredict selectedRegion={selectedRegion} onPredictionsUpdate={setAiPredictions} />;
      case 'rainfall': return <Rainfall />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-mark"><Droplets size={20} /></div>
            {!collapsed && <div className="logo-wordmark">Aqua<span>Trace</span></div>}
          </div>
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {!collapsed && <div className="sidebar-subtitle">Groundwater Intelligence</div>}

        {/* Region indicator */}
        {!collapsed && (
          <div style={{ padding: '8px 14px', margin: '0 10px 8px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.6rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Selected Region</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f0f0f5' }}>{selectedRegion.name}</div>
            <button onClick={handleChangeRegion} style={{ fontSize: '0.65rem', color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2, fontFamily: 'inherit', textDecoration: 'underline' }}>Change Region</button>
          </div>
        )}

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
              title={item.label}
            >
              <item.icon size={18} />
              {!collapsed && <span>{item.label}</span>}
              {page === item.id && <div className="nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {!collapsed && (
            <div className="user-card">
              <div className="user-avatar">{user.name?.[0] || '?'}</div>
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email || user.phone}</div>
              </div>
            </div>
          )}
          <button className="nav-item logout-btn" onClick={handleLogout} title="Sign Out">
            <LogOut size={18} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="page-title">{NAV_ITEMS.find(n => n.id === page)?.label || 'Dashboard'}</h1>
            <span className="breadcrumb">AquaTrace / {selectedRegion.name} / {NAV_ITEMS.find(n => n.id === page)?.label}</span>
          </div>
          <div className="topbar-right">
            <div className="status-pill live"><span className="pulse-dot" />Live</div>
            <div className="status-pill alert">⚠ {selectedRegion.name}</div>
            <button className="topbar-icon-btn"><Bell size={18} /></button>
            <div className="clock-display">{clock} IST</div>
          </div>
        </header>

        <main className="content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
