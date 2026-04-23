import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

const NAV = [
  { section: 'Core Systems' },
  { path:'/dashboard',    icon:'⬡', label:'Command Center' },
  { path:'/upload',       icon:'◎', label:'Scan & Validate' },
  { path:'/history',      icon:'▤', label:'Scan History' },
  { path:'/chatbot',      icon:'◈', label:'AI Assistant' },
  { section: 'Analytics' },
  { path:'/medications',  icon:'◉', label:'Active Meds' },
  { path:'/health',       icon:'◫', label:'Health Metrics' },
  { path:'/interactions', icon:'⬡', label:'Interaction Matrix' },
  { section: 'Portals' },
  { path:'/pharmacist',   icon:'⊞', label:'Pharmacist Hub', roles:['pharmacist','admin'], badge:5 },
  { path:'/doctor',       icon:'⊡', label:'Doctor Console',     roles:['doctor','admin'] },
  { path:'/admin',        icon:'⚙', label:'Admin Panel',       roles:['admin'] },
  { path:'/drugs',        icon:'◧', label:'Drug Database' },
  { section: 'Critical' },
  { path:'/emergency',    icon:'⚠', label:'Emergency' },
];

export default function Layout() {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  const initials = user?.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || 'U';

  const doLogout = () => {
    logout();
    navigate('/login');
    toast.success('Session terminated');
  };

  return (
    <div className="layout">
      <div className={`overlay ${open?'show':''}`} onClick={()=>setOpen(false)} />

      <aside className={`sidebar ${open?'open':''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">◈</div>
          <div className="brand-name">Rx<span>AI</span></div>
        </div>

        <nav style={{flex:1,paddingBottom:8}}>
          {NAV.map((n,i) => {
            if (n.section) return <div key={i} className="nav-section">{n.section}</div>;
            if (n.roles && !n.roles.includes(user?.role)) return null;
            return (
              <div key={n.path}
                className={`nav-item ${loc.pathname===n.path?'active':''}`}
                onClick={()=>{navigate(n.path);setOpen(false);}}>
                <span style={{fontSize:14,fontFamily:'var(--heading)',color:loc.pathname===n.path?'var(--accent)':'var(--text3)'}}>{n.icon}</span>
                <span style={{flex:1}}>{n.label}</span>
                {n.badge && <span className="nav-badge">{n.badge}</span>}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-pill" onClick={()=>navigate('/dashboard')}>
            <div className="avatar" style={{width:36,height:36}}>{initials}</div>
            <div>
              <div style={{fontWeight:600,fontSize:13,lineHeight:1.2}}>{user?.name||'User'}</div>
              <div style={{fontSize:10,color:'var(--text3)',textTransform:'uppercase',fontFamily:'var(--heading)',letterSpacing:'.05em'}}>{user?.role}</div>
            </div>
          </div>
          <div style={{display:'flex',gap:8,marginTop:10}}>
            <button className="btn btn-ghost btn-sm" style={{flex:1,fontFamily:'var(--mono)',fontSize:11}} onClick={doLogout}>↩ LOGOUT</button>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <button className="mobile-menu" onClick={()=>setOpen(true)}>☰</button>
            <span style={{fontSize:11,color:'var(--text3)',fontFamily:'var(--mono)',letterSpacing:'.05em'}}>
              SYS::{NAV.find(n=>n.path===loc.pathname)?.label?.toUpperCase()||'RXAI'}
            </span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:10,color:'var(--accent)',fontFamily:'var(--mono)',display:'flex',alignItems:'center',gap:6}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:'var(--accent)',display:'inline-block',boxShadow:'0 0 8px var(--accent)',animation:'iconPulse 2s infinite'}}/>
              AI ONLINE
            </span>
            <div className="avatar" style={{width:30,height:30,fontSize:10,cursor:'pointer'}}
              onClick={()=>navigate('/dashboard')} title={user?.name}>{initials}</div>
          </div>
        </header>

        <div className="page fade-in">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
