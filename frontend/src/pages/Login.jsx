import { useState } from 'react';
import { Droplets, Mail, Phone, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [method, setMethod] = useState('email');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    const id = method === 'email' ? form.email.trim() : form.phone.trim();
    if (!id) return setMsg({ t: 'error', m: `Enter your ${method}.` });
    if (!form.password || form.password.length < 6) return setMsg({ t: 'error', m: 'Password must be at least 6 characters.' });
    if (mode === 'register') {
      if (!form.name.trim()) return setMsg({ t: 'error', m: 'Enter your full name.' });
      if (form.password !== form.confirm) return setMsg({ t: 'error', m: 'Passwords do not match.' });
    }

    const body = { password: form.password, [method]: id };
    if (mode === 'register') body.name = form.name.trim();

    setLoading(true);
    try {
      const res = await fetch(mode === 'login' ? '/api/auth/login' : '/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ t: 'success', m: data.message });
        if (mode === 'login') setTimeout(() => onLogin(data.user), 800);
        else setTimeout(() => setMode('login'), 1200);
      } else {
        setMsg({ t: 'error', m: data.message || 'Something went wrong.' });
      }
    } catch { setMsg({ t: 'error', m: 'Server unavailable.' }); }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />
      <div style={styles.container}>
        <div style={styles.logoRow}>
          <div style={styles.logoMark}><Droplets size={22} /></div>
          <div style={styles.logoText}>Aqua<span style={{ color: '#818cf8' }}>Trace</span></div>
        </div>
        <p style={styles.subtitle}>Groundwater Intelligence Platform</p>

        <div style={styles.tabs}>
          <button style={mode === 'login' ? styles.tabActive : styles.tab} onClick={() => { setMode('login'); setMsg(null); }}>Sign In</button>
          <button style={mode === 'register' ? styles.tabActive : styles.tab} onClick={() => { setMode('register'); setMsg(null); }}>Register</button>
        </div>

        {msg && <div style={{ ...styles.msg, ...(msg.t === 'error' ? styles.msgErr : styles.msgOk) }}>{msg.m}</div>}

        <form onSubmit={submit} style={styles.form}>
          {mode === 'register' && (
            <div style={styles.field}>
              <label style={styles.label}>Full Name</label>
              <div style={styles.inputWrap}>
                <User size={16} style={styles.inputIcon} />
                <input style={styles.input} placeholder="Your name" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
            </div>
          )}

          <div style={styles.chipRow}>
            <button type="button" style={method === 'email' ? styles.chipActive : styles.chip} onClick={() => setMethod('email')}><Mail size={14} /> Email</button>
            <button type="button" style={method === 'phone' ? styles.chipActive : styles.chip} onClick={() => setMethod('phone')}><Phone size={14} /> Phone</button>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>{method === 'email' ? 'Email Address' : 'Phone Number'}</label>
            <div style={styles.inputWrap}>
              {method === 'email' ? <Mail size={16} style={styles.inputIcon} /> : <Phone size={16} style={styles.inputIcon} />}
              <input style={styles.input} type={method === 'email' ? 'email' : 'tel'}
                placeholder={method === 'email' ? 'you@example.com' : '+91 98765 43210'}
                value={method === 'email' ? form.email : form.phone}
                onChange={e => set(method, e.target.value)} />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrap}>
              <Lock size={16} style={styles.inputIcon} />
              <input style={styles.input} type={showPwd ? 'text' : 'password'} placeholder="Min 6 characters" value={form.password} onChange={e => set('password', e.target.value)} />
              <button type="button" style={styles.eyeBtn} onClick={() => setShowPwd(!showPwd)}>{showPwd ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </div>

          {mode === 'register' && (
            <div style={styles.field}>
              <label style={styles.label}>Confirm Password</label>
              <div style={styles.inputWrap}>
                <Lock size={16} style={styles.inputIcon} />
                <input style={styles.input} type="password" placeholder="Re-enter password" value={form.confirm} onChange={e => set('confirm', e.target.value)} />
              </div>
            </div>
          )}

          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={styles.footer}>
          {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
          <a href="#" style={styles.link} onClick={e => { e.preventDefault(); setMode(mode === 'login' ? 'register' : 'login'); setMsg(null); }}>
            {mode === 'login' ? 'Create one' : 'Sign In'}
          </a>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', position: 'relative', overflow: 'hidden' },
  bgGlow1: { position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)', top: '-15%', left: '-10%' },
  bgGlow2: { position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)', bottom: '-10%', right: '-5%' },
  container: { position: 'relative', zIndex: 10, width: '100%', maxWidth: 420, padding: '40px 32px', background: 'rgba(18,18,26,0.9)', border: '1px solid #1e1e2e', borderRadius: 20, backdropFilter: 'blur(20px)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' },
  logoRow: { display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 6 },
  logoMark: { width: 40, height: 40, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' },
  logoText: { fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.03em' },
  subtitle: { textAlign: 'center', fontSize: '0.75rem', color: '#55556a', marginBottom: 28, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' },
  tabs: { display: 'flex', background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 10, padding: 3, marginBottom: 20, gap: 3 },
  tab: { flex: 1, padding: '9px 0', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#55556a', cursor: 'pointer', border: 'none', background: 'transparent', borderRadius: 8, fontFamily: 'inherit', transition: 'all 0.2s' },
  tabActive: { flex: 1, padding: '9px 0', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#fff', cursor: 'pointer', border: 'none', background: '#6366f1', borderRadius: 8, fontFamily: 'inherit' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: '0.72rem', fontWeight: 600, color: '#8888a0' },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 12, color: '#55556a', pointerEvents: 'none' },
  input: { width: '100%', padding: '11px 12px 11px 38px', background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 8, color: '#f0f0f5', fontFamily: 'Inter, sans-serif', fontSize: '0.88rem', outline: 'none' },
  eyeBtn: { position: 'absolute', right: 10, background: 'none', border: 'none', color: '#55556a', cursor: 'pointer', padding: 4 },
  chipRow: { display: 'flex', gap: 8 },
  chip: { display: 'flex', alignItems: 'center', gap: 5, padding: '5px 14px', border: '1px solid #1e1e2e', borderRadius: 20, background: 'transparent', color: '#55556a', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  chipActive: { display: 'flex', alignItems: 'center', gap: 5, padding: '5px 14px', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  btn: { width: '100%', padding: 13, border: 'none', borderRadius: 10, background: '#6366f1', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', marginTop: 6 },
  msg: { padding: '10px 14px', borderRadius: 8, fontSize: '0.78rem', marginBottom: 4 },
  msgErr: { background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: '#f43f5e' },
  msgOk: { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' },
  footer: { textAlign: 'center', marginTop: 20, fontSize: '0.8rem', color: '#55556a' },
  link: { color: '#818cf8', textDecoration: 'none', fontWeight: 600 },
};
