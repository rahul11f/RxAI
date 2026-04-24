import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart, registerables } from 'chart.js';
import { useStore } from '../store/useStore';
Chart.register(...registerables);

const MEDS = [
  { name:'Metformin',    dose:'500mg', time:'8:00 AM',       taken:true,  color:'#00e5ff' },
  { name:'Atorvastatin', dose:'20mg',  time:'10:00 PM',      taken:false, color:'#448aff' },
  { name:'Omeprazole',   dose:'20mg',  time:'Before breakfast',taken:true, color:'#b388ff' },
  { name:'Aspirin',      dose:'75mg',  time:'After lunch',   taken:false, color:'#ff9100' },
  { name:'Levothyroxine',dose:'50mcg', time:'Empty stomach',taken:true,  color:'#ffd740' },
];

const RECENT = [
  { id:'RX-2024-0087', date:'20 Nov 2024', doctor:'Dr. Anjali Sharma', status:'valid',   conf:0.94 },
  { id:'RX-2024-0082', date:'15 Nov 2024', doctor:'Dr. Pradeep Verma',  status:'warning', conf:0.81 },
  { id:'RX-2024-0076', date:'08 Nov 2024', doctor:'Dr. Anjali Sharma', status:'valid',   conf:0.96 },
  { id:'RX-2024-0069', date:'28 Oct 2024', doctor:'Dr. Rakesh Gupta',  status:'valid',   conf:0.89 },
];

const SB = s=>({ valid:'b-green', warning:'b-orange', invalid:'b-red' }[s]||'b-blue');

export default function Dashboard() {
  const { user } = useStore();
  const navigate = useNavigate();
  const r1 = useRef(), r2 = useRef();
  const ch = useRef({});

  useEffect(()=>{
    const tc = '#4a5a78', gc = '#1e2a42';

    if(ch.current.a) ch.current.a.destroy();
    ch.current.a = new Chart(r1.current,{
      type:'doughnut',
      data:{
        labels:['Valid (87.5%)','Warning (8.3%)','Invalid (4.2%)'],
        datasets:[{data:[21,2,1],backgroundColor:['#00e5ff','#ff9100','#ff3d5a'],borderWidth:0,borderRadius:4}]
      },
      options:{plugins:{legend:{position:'bottom',labels:{font:{family:'Inter',size:11},color:tc,padding:14}}},cutout:'72%',responsive:true}
    });

    if(ch.current.b) ch.current.b.destroy();
    ch.current.b = new Chart(r2.current,{
      type:'line',
      data:{
        labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        datasets:[
          {label:'BP Systolic',data:[118,122,119,125,120,117,120],borderColor:'#ff3d5a',tension:.4,fill:false,pointRadius:3,borderWidth:2},
          {label:'Glucose',    data:[102,98,105,110,103,99,105], borderColor:'#448aff',tension:.4,fill:false,pointRadius:3,borderWidth:2},
        ]
      },
      options:{
        plugins:{legend:{labels:{font:{family:'Inter',size:11},color:tc}}},
        scales:{x:{ticks:{color:tc,font:{family:'JetBrains Mono',size:10}},grid:{display:false}},y:{ticks:{color:tc,font:{family:'JetBrains Mono',size:10}},grid:{color:gc}}},
        responsive:true
      }
    });
    const charts = ch.current;
    return()=>Object.values(charts).forEach(c=>c?.destroy());
  },[]);

  const first = user?.name?.split(' ')[0]||'Operator';
  const today = new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Welcome, <span style={{color:'var(--accent)',textShadow:'0 0 20px rgba(0,229,255,.3)'}}>{first}</span></h1>
        <p className="page-sub">{today} · {user?.role?.toUpperCase()} ACCESS</p>
      </div>

      <div className="g g4" style={{marginBottom:20}}>
        {[
          {icon:'▤',label:'Total Scans',value:'24',sub:'↑ 3 this month',bg:'rgba(0,229,255,.1)'},
          {icon:'◉',label:'Validated',           value:'21',sub:'87.5% pass rate', bg:'rgba(68,138,255,.1)'},
          {icon:'⚠',label:'Warnings',  value:'3', sub:'2 interactions found',bg:'rgba(255,145,0,.1)'},
          {icon:'◈',label:'Active Meds',  value:'5', sub:'3 due today',     bg:'rgba(179,136,255,.1)'},
        ].map(s=>(
          <div key={s.label} className="stat">
            <div className="stat-icon" style={{background:s.bg,color:'var(--accent)'}}>{s.icon}</div>
            <div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="g g2" style={{marginBottom:20}}>
        <div className="card">
          <div className="section-title">◫ Validation Accuracy</div>
          <canvas ref={r1} height={200}/>
        </div>
        <div className="card">
          <div className="section-title">◉ Today's Schedule</div>
          {MEDS.map((m,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'9px 0',borderBottom:i<MEDS.length-1?'1px solid var(--border)':'none'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:m.color,flexShrink:0,boxShadow:`0 0 8px ${m.color}`}}/>
                <div>
                  <div style={{fontWeight:600,fontSize:13}}>{m.name} <span style={{color:'var(--text3)',fontWeight:400,fontFamily:'var(--mono)',fontSize:11}}>{m.dose}</span></div>
                  <div style={{fontSize:11,color:'var(--text3)',fontFamily:'var(--mono)'}}>{m.time}</div>
                </div>
              </div>
              <span className={`badge ${m.taken?'b-green':'b-orange'}`}>{m.taken?'✓ DONE':'⏰ DUE'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="g g2">
        <div className="card">
          <div className="section-title">▤ Recent Scans</div>
          {RECENT.map(rx=>(
            <div key={rx.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'9px 0',borderBottom:'1px solid var(--border)',cursor:'pointer'}}
              onClick={()=>navigate('/history')}>
              <div>
                <div style={{fontWeight:600,fontSize:13,fontFamily:'var(--mono)'}}>{rx.id}</div>
                <div style={{fontSize:11,color:'var(--text3)'}}>{rx.doctor} · {rx.date}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:70}}>
                  <div className="progress"><div className="progress-fill" style={{width:`${rx.conf*100}%`}}/></div>
                  <div style={{fontSize:10,color:'var(--text3)',textAlign:'right',marginTop:2,fontFamily:'var(--mono)'}}>{(rx.conf*100).toFixed(0)}%</div>
                </div>
                <span className={`badge ${SB(rx.status)}`}>{rx.status.toUpperCase()}</span>
              </div>
            </div>
          ))}
          <button className="btn btn-outline btn-sm btn-full" style={{marginTop:12}} onClick={()=>navigate('/history')}>VIEW ALL →</button>
        </div>
        <div className="card">
          <div className="section-title">◫ Health Metrics</div>
          <canvas ref={r2} height={200}/>
        </div>
      </div>

      <div className="card" style={{marginTop:16}}>
        <div className="section-title">⚡ Quick Actions</div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <button className="btn btn-primary" onClick={()=>navigate('/upload')}>◎ SCAN RX</button>
          <button className="btn btn-outline" onClick={()=>navigate('/chatbot')}>◈ AI ASSISTANT</button>
          <button className="btn btn-outline" onClick={()=>navigate('/interactions')}>⬡ INTERACTIONS</button>
          <button className="btn btn-outline" onClick={()=>navigate('/drugs')}>◧ DRUG DB</button>
          <button className="btn btn-outline" style={{borderColor:'rgba(255,61,90,.3)',color:'var(--red)'}} onClick={()=>navigate('/emergency')}>⚠ EMERGENCY</button>
        </div>
      </div>
    </div>
  );
}
