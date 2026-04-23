import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const DEMOS = [
  { role:'patient',    email:'patient@rxai.com',  label:'◉ Patient' },
  { role:'pharmacist', email:'pharma@rxai.com',   label:'⊞ Pharmacist' },
  { role:'doctor',     email:'doctor@rxai.com',   label:'⊡ Doctor' },
  { role:'admin',      email:'admin@rxai.com',    label:'⚙ Admin' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useStore();
  const [form, setForm] = useState({ email:'patient@rxai.com', password:'password123' });
  const [loading, setLoading] = useState(false);
  const [glitchText, setGlitchText] = useState('INITIALIZING');

  useEffect(() => {
    const texts = ['INITIALIZING', 'CONNECTING', 'AI READY', 'AUTHENTICATE'];
    let i = 0;
    const iv = setInterval(() => { i = (i + 1) % texts.length; setGlitchText(texts[i]); }, 2000);
    return () => clearInterval(iv);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      login(data.user, data.token);
      toast.success(`Welcome, ${data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Connection failed — is backend on port 5000?');
    } finally { setLoading(false); }
  };

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:20,position:'relative',overflow:'hidden'}}>
      {/* Animated grid background */}
      <div style={{position:'absolute',inset:0,opacity:.04,
        backgroundImage:'linear-gradient(var(--accent) 1px,transparent 1px),linear-gradient(90deg,var(--accent) 1px,transparent 1px)',
        backgroundSize:'50px 50px',animation:'gridMove 15s linear infinite',pointerEvents:'none'}}/>
      
      {/* Radial glow */}
      <div style={{position:'absolute',top:'30%',left:'50%',transform:'translate(-50%,-50%)',width:600,height:600,
        background:'radial-gradient(circle,rgba(0,229,255,.08) 0%,transparent 70%)',pointerEvents:'none'}}/>

      <div style={{width:'100%',maxWidth:440,position:'relative',zIndex:1}}>
        <div style={{textAlign:'center',marginBottom:36}}>
          <div style={{width:72,height:72,background:'linear-gradient(135deg,#00e5ff,#448aff,#b388ff)',borderRadius:16,
            display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:32,marginBottom:16,
            boxShadow:'0 0 40px rgba(0,229,255,.3)',fontFamily:'var(--heading)',color:'#000',fontWeight:900}}>◈</div>
          <h1 style={{fontFamily:'var(--heading)',fontSize:36,letterSpacing:'.1em',textTransform:'uppercase'}}>
            Rx<span style={{color:'var(--accent)',textShadow:'0 0 20px rgba(0,229,255,.5)'}}>AI</span>
          </h1>
          <p style={{color:'var(--text3)',marginTop:6,fontFamily:'var(--mono)',fontSize:12,letterSpacing:'.05em'}}>
            AI PRESCRIPTION VALIDATION SYSTEM
          </p>
          <p style={{fontSize:11,color:'var(--text3)',marginTop:4,fontFamily:'var(--mono)',opacity:.6}}>
            BBD University · Group 132 · 2024-25
          </p>
          <div style={{marginTop:12,fontFamily:'var(--mono)',fontSize:10,color:'var(--accent)',letterSpacing:'.15em',
            opacity:.7,animation:'blink 1.2s infinite'}}>
            [{glitchText}]
          </div>
        </div>

        <div className="card" style={{borderColor:'rgba(0,229,255,.15)'}}>
          <div style={{marginBottom:18}}>
            <div className="label" style={{marginBottom:10}}>Quick Access</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
              {DEMOS.map(d=>(
                <button key={d.role} className="btn btn-outline btn-sm"
                  style={{fontFamily:'var(--mono)',fontSize:11}}
                  onClick={()=>setForm({email:d.email,password:'password123'})}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divider">or authenticate</div>

          <form onSubmit={submit}>
            <div className="fg">
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email}
                onChange={e=>setForm(f=>({...f,email:e.target.value}))} required />
            </div>
            <div className="fg">
              <label className="label">Password</label>
              <input className="input" type="password" value={form.password}
                onChange={e=>setForm(f=>({...f,password:e.target.value}))} required />
              <p className="hint" style={{fontFamily:'var(--mono)'}}>Demo: <code>password123</code></p>
            </div>
            <button className="btn btn-primary btn-full btn-lg" style={{fontFamily:'var(--heading)',letterSpacing:'.05em'}} disabled={loading}>
              {loading ? <><span className="spinner" style={{width:16,height:16}} /> CONNECTING…</> : '→ AUTHENTICATE'}
            </button>
          </form>

          <div className="info info-info" style={{marginTop:16,fontSize:12}}>
            <span>◈</span>
            <span style={{fontFamily:'var(--mono)'}}>Backend must be active on <code>localhost:5000</code> before authentication.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
