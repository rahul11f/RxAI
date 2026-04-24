import React, { useState, useEffect, useRef } from 'react';
import { drugAPI, interAPI, healthAPI } from '../utils/api';
import { useStore } from '../store/useStore';
import { Chart, registerables } from 'chart.js';
import toast from 'react-hot-toast';
Chart.register(...registerables);

const SB = s=>({ valid:'b-green', warning:'b-orange', invalid:'b-red' }[s]||'b-blue');
const TC = '#4a5a78', GC = '#1e2a42';

// ═══ HISTORY ═══════════════════════════════════════════════════
export function History() {
  const { prescriptions } = useStore();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('');

  const STATIC = [
    { id:'RX-2024-0087',date:'2024-11-20',doctor:'Dr. Anjali Sharma',status:'valid',   confidence:0.94, drugs:[{matchedDrug:'Metformin',dosageValue:500,dosageUnit:'mg',frequency:'BD'},{matchedDrug:'Atorvastatin',dosageValue:20,dosageUnit:'mg',frequency:'OD'}] },
    { id:'RX-2024-0082',date:'2024-11-15',doctor:'Dr. Pradeep Verma', status:'warning', confidence:0.81, drugs:[{matchedDrug:'Warfarin',dosageValue:5,dosageUnit:'mg',frequency:'OD'},{matchedDrug:'Aspirin',dosageValue:75,dosageUnit:'mg',frequency:'OD'}] },
    { id:'RX-2024-0076',date:'2024-11-08',doctor:'Dr. Anjali Sharma', status:'valid',   confidence:0.96, drugs:[{matchedDrug:'Amoxicillin',dosageValue:500,dosageUnit:'mg',frequency:'TDS'}] },
    { id:'RX-2024-0069',date:'2024-10-28',doctor:'Dr. Rakesh Gupta',  status:'valid',   confidence:0.89, drugs:[{matchedDrug:'Paracetamol',dosageValue:500,dosageUnit:'mg',frequency:'TDS'}] },
    { id:'RX-2024-0054',date:'2024-10-10',doctor:'Dr. Pradeep Verma', status:'invalid', confidence:0.42, drugs:[] },
  ];

  const all = [...prescriptions.map(p=>({...p, confidence:p.confidence||0.9})), ...STATIC];
  const display = all.filter(rx=>
    (!q || rx.id?.toLowerCase().includes(q.toLowerCase()) || rx.doctor?.toLowerCase().includes(q.toLowerCase())) &&
    (!filter || rx.status===filter)
  );

  const getDrugs = rx => {
    if (rx.drugs?.length) return rx.drugs.map(d=>typeof d==='string'?d:`${d.matchedDrug||d.drugName||d.name||'?'} ${d.dosageValue||''}${d.dosageUnit||''}`);
    return ['—'];
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div><h1 className="page-title">Prescription History</h1><p className="page-sub">All validated prescriptions</p></div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <input className="input" style={{width:200}} placeholder="🔍 Search…" value={q} onChange={e=>setQ(e.target.value)}/>
          <select className="input" style={{width:140}} value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="valid">Valid</option><option value="warning">Warning</option><option value="invalid">Invalid</option>
          </select>
        </div>
      </div>
      <div className="tbl-wrap">
        <table>
          <thead><tr><th>Rx ID</th><th>Date</th><th>Doctor</th><th>Medications</th><th>Status</th><th>Confidence</th><th>Actions</th></tr></thead>
          <tbody>
            {display.map(rx=>(
              <tr key={rx.id}>
                <td><strong style={{fontSize:13}}>{rx.id}</strong></td>
                <td style={{color:'var(--text3)',fontSize:12}}>{(rx.date||rx.createdAt||'').slice(0,10)}</td>
                <td style={{fontSize:13}}>{rx.doctor||'—'}</td>
                <td>{getDrugs(rx).slice(0,3).map((d,i)=><span key={i} className="tag">{d}</span>)}</td>
                <td><span className={`badge ${SB(rx.status)}`}>{rx.status}</span></td>
                <td>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{flex:1,minWidth:60}}>
                      <div className="progress"><div className="progress-fill" style={{width:`${(rx.confidence||0)*100}%`}}/></div>
                    </div>
                    <span style={{fontSize:12,color:'var(--text3)',minWidth:30}}>{((rx.confidence||0)*100).toFixed(0)}%</span>
                  </div>
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={()=>toast(`Viewing ${rx.id}`)}>👁</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>{
                    const c=`ID,Date,Doctor,Status\n${rx.id},${rx.date||''},${rx.doctor||''},${rx.status}`;
                    const b=new Blob([c],{type:'text/csv'});const u=URL.createObjectURL(b);
                    const a=document.createElement('a');a.href=u;a.download=`${rx.id}.csv`;a.click();
                    toast.success('CSV downloaded');
                  }}>📄</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {display.length===0&&<div className="empty"><div className="empty-icon">📋</div><div className="empty-title">No prescriptions found</div></div>}
    </div>
  );
}

// ═══ MEDICATIONS ════════════════════════════════════════════════
export function Medications() {
  const MEDS = [
    {name:'Metformin',dose:'500mg',freq:'BD',days:30,refill:12,color:'#2d6a4f',dr:'Dr. Anjali Sharma',cond:'Type 2 Diabetes',times:['8:00 AM','8:00 PM']},
    {name:'Atorvastatin',dose:'20mg',freq:'OD',days:30,refill:5,color:'#1d4ed8',dr:'Dr. Anjali Sharma',cond:'Hypercholesterolaemia',times:['10:00 PM']},
    {name:'Omeprazole',dose:'20mg',freq:'OD',days:14,refill:3,color:'#6d28d9',dr:'Dr. Pradeep Verma',cond:'GERD',times:['7:30 AM (before breakfast)']},
    {name:'Aspirin',dose:'75mg',freq:'OD',days:90,refill:45,color:'#c96a1a',dr:'Dr. Pradeep Verma',cond:'Cardiovascular prevention',times:['After lunch']},
    {name:'Levothyroxine',dose:'50mcg',freq:'OD',days:30,refill:18,color:'#b45309',dr:'Dr. Rakesh Gupta',cond:'Hypothyroidism',times:['Empty stomach — 30min before breakfast']},
  ];
  return (
    <div className="fade-in">
      <div className="page-header"><h1 className="page-title">My Medications</h1><p className="page-sub">Active prescriptions and refill status</p></div>
      <div className="g" style={{gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))'}}>
        {MEDS.map(m=>(
          <div key={m.name} className="card card-hover" style={{borderTop:`3px solid ${m.color}`}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
              <div><div style={{fontWeight:700,fontSize:15}}>{m.name}</div><div style={{fontSize:12,color:'var(--text3)'}}>{m.cond}</div></div>
              <span className="tag" style={{borderColor:m.color,color:m.color}}>{m.dose}</span>
            </div>
            <div style={{display:'flex',gap:8,marginBottom:10}}>
              <span className="badge b-blue">{m.freq}</span>
              <span className="badge b-green">{m.days}d supply</span>
            </div>
            <div style={{fontSize:12,color:'var(--text3)',marginBottom:6}}>⏰ {m.times.join(' · ')}</div>
            <div style={{fontSize:12,color:'var(--text3)',marginBottom:10}}>Prescribed by: {m.dr}</div>
            <div style={{marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                <span>Supply remaining</span>
                <span style={{color:m.refill<7?'var(--red)':'var(--text3)',fontWeight:m.refill<7?700:400}}>{m.refill} days</span>
              </div>
              <div className="progress"><div className="progress-fill" style={{width:`${(m.refill/m.days)*100}%`,background:m.refill<7?'var(--red)':'var(--accent)'}}/></div>
            </div>
            {m.refill<7&&<div className="info info-warn" style={{fontSize:12,padding:'7px 10px',marginBottom:10}}><span>⚠️</span> Refill soon — only {m.refill} days left</div>}
            <button className="btn btn-outline btn-sm btn-full" onClick={()=>toast.success(`Refill requested for ${m.name}`)}>🔄 Request Refill</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ DRUG DATABASE ══════════════════════════════════════════════
export function DrugDB() {
  const [drugs, setDrugs] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(()=>{
    drugAPI.list().then(r=>{setDrugs(r.data.data);setLoading(false);}).catch(()=>setLoading(false));
  },[]);

  const PC = {A:'#00e5ff',B:'#448aff',C:'#ffd740',D:'#ff9100',X:'#ff3d5a'};
  const filtered = drugs.filter(d=>!q||d.name.toLowerCase().includes(q.toLowerCase())||d.class.toLowerCase().includes(q.toLowerCase())||d.brands?.some(b=>b.toLowerCase().includes(q.toLowerCase()))||d.indications?.some(i=>i.toLowerCase().includes(q.toLowerCase())));

  if (selected) return (
    <div className="fade-in">
      <button className="btn btn-ghost" style={{marginBottom:16}} onClick={()=>setSelected(null)}>← Back to Database</button>
      <div className="card">
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10}}>
          <div>
            <h1 style={{fontFamily:'var(--serif)',fontSize:28}}>{selected.name}</h1>
            <p style={{color:'var(--text3)',marginTop:4}}>{selected.class}</p>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <span style={{background:`${PC[selected.pregnancy]}22`,color:PC[selected.pregnancy],padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:700}}>Pregnancy Category {selected.pregnancy}</span>
            {selected.freq?.map(f=><span key={f} className="tag">{f}</span>)}
          </div>
        </div>

        <div className="g g2" style={{marginBottom:16}}>
          <div><div className="label">Dosage Range</div><div style={{fontFamily:'var(--serif)',fontSize:22}}>{selected.min}–{selected.max} mg</div></div>
          <div><div className="label">Max Daily Dose</div><div style={{fontFamily:'var(--serif)',fontSize:22}}>{selected.maxDaily} mg</div></div>
          <div><div className="label">Half-Life</div><div style={{fontWeight:600}}>{selected.halfLife}</div></div>
          <div><div className="label">Route</div><div style={{fontWeight:600}}>{selected.route}</div></div>
        </div>

        <div style={{marginBottom:16}}>
          <div className="label">Brand Names</div>
          <div>{selected.brands?.map(b=><span key={b} className="tag">{b}</span>)}</div>
        </div>

        <div style={{marginBottom:16}}>
          <div className="label">Mechanism of Action</div>
          <p style={{fontSize:13.5,lineHeight:1.65,color:'var(--text2)'}}>{selected.mechanism}</p>
        </div>

        <div className="g g2">
          <div>
            <div className="label">Indications</div>
            <ul style={{fontSize:13,lineHeight:2,paddingLeft:18,color:'var(--text2)'}}>
              {selected.indications?.map((x,i)=><li key={i}>{x}</li>)}
            </ul>
          </div>
          <div>
            <div className="label">Side Effects</div>
            <ul style={{fontSize:13,lineHeight:2,paddingLeft:18,color:'var(--text2)'}}>
              {selected.sideEffects?.map((x,i)=><li key={i}>{x}</li>)}
            </ul>
          </div>
          <div>
            <div className="label">Contraindications</div>
            <ul style={{fontSize:13,lineHeight:2,paddingLeft:18,color:'var(--red)'}}>
              {selected.contraindications?.map((x,i)=><li key={i}>{x}</li>)}
            </ul>
          </div>
          <div>
            <div className="label">Monitoring Requirements</div>
            <ul style={{fontSize:13,lineHeight:2,paddingLeft:18,color:'var(--text2)'}}>
              {selected.monitoring?.map((x,i)=><li key={i}>{x}</li>)}
            </ul>
          </div>
        </div>

        <div style={{marginTop:16}}>
          <div className="label">Food & Drug Interactions</div>
          {selected.foodInteractions?.map((x,i)=>(
            <div key={i} className="info info-warn" style={{marginBottom:8,fontSize:13}}><span>🍽️</span><span>{x}</span></div>
          ))}
        </div>

        {selected.criticalNote && (
          <div className="info info-error" style={{marginTop:16}}>
            <span>🚨</span><div><strong>Critical Note:</strong> {selected.criticalNote}</div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div className="page-header" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div><h1 className="page-title">Drug Database</h1><p className="page-sub">{drugs.length} drugs with complete clinical profiles · Click any card for full details</p></div>
        <input className="input" style={{width:280}} placeholder="🔍 Search name, class, brand, indication…" value={q} onChange={e=>setQ(e.target.value)}/>
      </div>
      {loading
        ? <div style={{textAlign:'center',padding:48}}><div className="spinner" style={{width:36,height:36,margin:'0 auto'}}/></div>
        : <div className="g" style={{gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))'}}>
            {filtered.map(d=>(
              <div key={d.id} className="card card-hover" style={{cursor:'pointer'}} onClick={()=>setSelected(d)}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
                  <div><div style={{fontWeight:700,fontSize:15}}>{d.name}</div><div style={{fontSize:12,color:'var(--text3)'}}>{d.class}</div></div>
                  <span style={{background:`${PC[d.pregnancy]}22`,color:PC[d.pregnancy],padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:700}}>Cat {d.pregnancy}</span>
                </div>
                <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
                  {d.freq?.map(f=><span key={f} className="tag">{f}</span>)}
                </div>
                <div style={{fontSize:12.5,color:'var(--text3)',marginBottom:6}}>Dose: <strong style={{color:'var(--text)'}}>{d.min}–{d.max}mg</strong> · Max: <strong style={{color:'var(--text)'}}>{d.maxDaily}mg/day</strong></div>
                <div style={{fontSize:12,marginBottom:8}}>Brands: {d.brands?.slice(0,3).map(b=><span key={b} className="tag">{b}</span>)}</div>
                <div style={{fontSize:12,color:'var(--text3)',borderTop:'1px solid var(--border)',paddingTop:8,marginTop:4}}>
                  ⏱ {d.halfLife} · {d.route}
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}

// ═══ INTERACTIONS ════════════════════════════════════════════════
export function Interactions() {
  const [drugs, setDrugs] = useState([]);
  const [all, setAll] = useState([]);
  const [drugA, setDrugA] = useState('');
  const [drugB, setDrugB] = useState('');
  const [result, setResult] = useState(null);
  const cvs = useRef();

  useEffect(()=>{
    drugAPI.list().then(r=>setDrugs(r.data.data));
    interAPI.list().then(r=>setAll(r.data.data||[]));
  },[]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{ if(drugs.length&&all.length) drawGraph(); },[drugs,all]);

  const drawGraph = ()=>{
    const c=cvs.current; if(!c)return;
    const ctx=c.getContext('2d');
    c.width=c.offsetWidth||420; c.height=320;
    // eslint-disable-next-line no-unused-vars
    const dark=true;
    ctx.clearRect(0,0,c.width,c.height);
    const nodes=drugs.slice(0,12).map((d,i)=>{
      const a=(i/12)*Math.PI*2-Math.PI/2,r=120;
      return {id:d.id,name:d.name,x:c.width/2+r*Math.cos(a),y:c.height/2+r*Math.sin(a)};
    });
    const sc={minor:'#00e5ff',moderate:'#ffd740',severe:'#ff3d5a',contraindicated:'#b388ff'};
    all.forEach(inter=>{
      const a=nodes.find(n=>n.id===inter.drugA),b=nodes.find(n=>n.id===inter.drugB);
      if(!a||!b)return;
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
      ctx.strokeStyle=sc[inter.severity]||'#888';
      ctx.lineWidth=(inter.severity==='severe'||inter.severity==='contraindicated')?3:1.8;
      ctx.globalAlpha=0.8;ctx.stroke();ctx.globalAlpha=1;
    });
    nodes.forEach(n=>{
      ctx.beginPath();ctx.arc(n.x,n.y,20,0,Math.PI*2);
      ctx.fillStyle='#0d1f2d';
      ctx.strokeStyle='#00e5ff';
      ctx.lineWidth=2;ctx.fill();ctx.stroke();
      ctx.fillStyle='#e0e6f0';
      ctx.font='9px DM Sans';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(n.name.slice(0,10),n.x,n.y);
    });
  };

  const check=async()=>{
    if(!drugA||!drugB){toast.error('Select both drugs');return;}
    if(drugA===drugB){setResult({found:false,message:'Select two different drugs'});return;}
    const {data}=await interAPI.check(drugA,drugB);
    setResult(data);
  };

  const SEV_INFO={minor:'info-success',moderate:'info-warn',severe:'info-error',contraindicated:'info-error'};
  const SEV_CLS={minor:'b-green',moderate:'b-yellow',severe:'b-red',contraindicated:'b-purple'};

  return (
    <div className="fade-in">
      <div className="page-header"><h1 className="page-title">Drug Interaction Checker</h1><p className="page-sub">Check interactions from our clinical database of 8 known major interactions</p></div>
      <div className="g g2" style={{alignItems:'start'}}>
        <div>
          <div className="card" style={{marginBottom:14}}>
            <div className="section-title">🔍 Check Two Drugs</div>
            <div className="frow">
              <div className="fg">
                <label className="label">Drug A</label>
                <select className="input" value={drugA} onChange={e=>setDrugA(e.target.value)}>
                  <option value="">Select drug…</option>
                  {drugs.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="fg">
                <label className="label">Drug B</label>
                <select className="input" value={drugB} onChange={e=>setDrugB(e.target.value)}>
                  <option value="">Select drug…</option>
                  {drugs.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-primary btn-full" onClick={check}>Check Interaction</button>

            {result && (
              <div style={{marginTop:14}}>
                {result.found ? (
                  <div className={`info ${SEV_INFO[result.data?.severity]||'info-warn'}`}>
                    <span>{result.data?.severity==='severe'||result.data?.severity==='contraindicated'?'🚨':'⚠️'}</span>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:6}}>
                        <strong>{result.data?.severity?.toUpperCase()} — {result.data?.drugAName} + {result.data?.drugBName}</strong>
                        <span className={`badge ${SEV_CLS[result.data?.severity]}`}>{result.data?.severity}</span>
                      </div>
                      <div style={{fontSize:12.5,marginBottom:4}}><strong>Mechanism:</strong> {result.data?.mechanism}</div>
                      <div style={{fontSize:12.5,marginBottom:4}}><strong>Effect:</strong> {result.data?.effect}</div>
                      <div style={{fontSize:12.5,marginBottom:4}}><strong>Management:</strong> {result.data?.management}</div>
                      {result.data?.clinicalPearl&&<div style={{fontSize:12,fontStyle:'italic',color:'var(--blue)',marginTop:4}}>💡 {result.data.clinicalPearl}</div>}
                    </div>
                  </div>
                ) : (
                  <div className="info info-success"><span>✅</span><div><strong>No known interaction</strong> between these drugs in our database.<br/><span style={{fontSize:12}}>This does not guarantee safety — always check with your pharmacist.</span></div></div>
                )}
              </div>
            )}
          </div>

          <div className="card">
            <div className="section-title">📋 All Known Interactions ({all.length})</div>
            {all.map((i,idx)=>(
              <div key={idx} style={{padding:'10px 0',borderBottom:idx<all.length-1?'1px solid var(--border)':'none'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5,flexWrap:'wrap'}}>
                  <span style={{fontWeight:600,fontSize:13}}>{i.drugAName}</span>
                  <span style={{color:'var(--text3)'}}>+</span>
                  <span style={{fontWeight:600,fontSize:13}}>{i.drugBName}</span>
                  <span className={`badge ${SEV_CLS[i.severity]||'b-orange'}`} style={{marginLeft:'auto'}}>{i.severity}</span>
                </div>
                <div style={{fontSize:12,color:'var(--text2)'}}>{i.effect?.slice(0,120)}…</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-title">🕸️ Interaction Network (top 12 drugs)</div>
          <canvas ref={cvs} style={{width:'100%',height:320,borderRadius:'var(--r-sm)',background:'var(--bg3)'}}/>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:12,fontSize:12}}>
            {[{l:'Minor',c:'#3fb950'},{l:'Moderate',c:'#e3b341'},{l:'Severe',c:'#f85149'},{l:'Contraindicated',c:'#bc8cff'}].map(x=>(
              <span key={x.l} style={{display:'flex',alignItems:'center',gap:5}}>
                <span style={{width:20,height:3,background:x.c,borderRadius:2,display:'inline-block'}}/>
                {x.l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══ HEALTH TRACKING ═════════════════════════════════════════════
export function Health() {
  const bpRef=useRef(),glRef=useRef();
  const ch=useRef({});
  const [form,setForm]=useState({type:'bp',systolic:'',diastolic:'',glucose:'',weight:''});
  const [saving,setSaving]=useState(false);
  // eslint-disable-next-line no-unused-vars
  const [metrics,setMetrics]=useState([]);

  useEffect(()=>{
    healthAPI.list().then(r=>setMetrics(r.data.data||[])).catch(()=>{});
    drawCharts();
    const charts = ch.current;
    return()=>Object.values(charts).forEach(c=>c?.destroy());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const drawCharts=()=>{
    const tc=TC,gc=GC;
    const L=['Jan','Feb','Mar','Apr','May','Jun','Jul'];
    if(ch.current.bp)ch.current.bp.destroy();
    ch.current.bp=new Chart(bpRef.current,{type:'line',data:{labels:L,datasets:[
      {label:'Systolic',data:[128,124,122,125,120,118,120],borderColor:'#ff3d5a',backgroundColor:'rgba(255,61,90,.1)',fill:true,tension:.4,pointRadius:4},
      {label:'Diastolic',data:[84,82,80,83,80,78,80],borderColor:'#ff9100',backgroundColor:'rgba(255,145,0,.1)',fill:true,tension:.4,pointRadius:4},
    ]},options:{plugins:{legend:{labels:{font:{family:'Inter'},color:tc}}},scales:{x:{ticks:{color:tc,font:{family:'JetBrains Mono',size:10}},grid:{display:false}},y:{ticks:{color:tc,font:{family:'JetBrains Mono',size:10}},grid:{color:gc}}},responsive:true}});
    if(ch.current.gl)ch.current.gl.destroy();
    ch.current.gl=new Chart(glRef.current,{type:'line',data:{labels:L,datasets:[
      {label:'Fasting',data:[112,108,110,105,103,107,105],borderColor:'#448aff',backgroundColor:'rgba(68,138,255,.1)',fill:true,tension:.4,pointRadius:4},
      {label:'Post-meal',data:[152,148,145,150,142,138,145],borderColor:'#b388ff',backgroundColor:'rgba(179,136,255,.1)',fill:true,tension:.4,pointRadius:4},
    ]},options:{plugins:{legend:{labels:{font:{family:'Inter'},color:tc}}},scales:{x:{ticks:{color:tc,font:{family:'JetBrains Mono',size:10}},grid:{display:false}},y:{ticks:{color:tc,font:{family:'JetBrains Mono',size:10}},grid:{color:gc}}},responsive:true}});
  };

  const save=async()=>{
    setSaving(true);
    try{
      if(form.type==='bp'){
        await healthAPI.create({type:'bp_systolic',value:form.systolic,unit:'mmHg'});
        await healthAPI.create({type:'bp_diastolic',value:form.diastolic,unit:'mmHg'});
      } else if(form.type==='glucose'){
        await healthAPI.create({type:'blood_glucose',value:form.glucose,unit:'mg/dL'});
      } else {
        await healthAPI.create({type:'weight',value:form.weight,unit:'kg'});
      }
      toast.success('Metric saved ✓');
      setForm({type:form.type,systolic:'',diastolic:'',glucose:'',weight:''});
    }catch(e){toast.error('Save failed');}finally{setSaving(false);}
  };

  return (
    <div className="fade-in">
      <div className="page-header"><h1 className="page-title">Health Tracking</h1><p className="page-sub">Monitor blood pressure, glucose, weight trends</p></div>
      <div className="g g3" style={{marginBottom:20}}>
        {[{l:'Blood Pressure',v:'120/80 mmHg',s:'✓ Normal',c:'var(--red)'},
          {l:'Blood Glucose',v:'105 mg/dL',s:'⚠ Slightly elevated',c:'var(--blue)'},
          {l:'BMI / Weight',v:'23.4 / 72 kg',s:'✓ Healthy weight',c:'var(--accent)'}].map(m=>(
          <div key={m.l} className="card" style={{borderTop:`3px solid ${m.c}`}}>
            <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',color:'var(--text3)',marginBottom:8}}>{m.l}</div>
            <div style={{fontFamily:'var(--serif)',fontSize:26}}>{m.v}</div>
            <div style={{fontSize:12,color:m.s.startsWith('✓')?'var(--accent)':'var(--yellow)',marginTop:4}}>{m.s}</div>
          </div>
        ))}
      </div>
      <div className="g g2" style={{marginBottom:20}}>
        <div className="card"><div className="section-title">❤️ Blood Pressure Trend</div><canvas ref={bpRef} height={200}/></div>
        <div className="card"><div className="section-title">🩸 Blood Glucose Trend</div><canvas ref={glRef} height={200}/></div>
      </div>
      <div className="card" style={{maxWidth:520}}>
        <div className="section-title">+ Log Health Metric</div>
        <div className="fg"><label className="label">Type</label>
          <select className="input" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
            <option value="bp">Blood Pressure</option>
            <option value="glucose">Blood Glucose</option>
            <option value="weight">Weight</option>
          </select>
        </div>
        {form.type==='bp'&&<div className="frow">
          <div className="fg"><label className="label">Systolic (mmHg)</label><input className="input" type="number" placeholder="120" value={form.systolic} onChange={e=>setForm(f=>({...f,systolic:e.target.value}))}/></div>
          <div className="fg"><label className="label">Diastolic (mmHg)</label><input className="input" type="number" placeholder="80" value={form.diastolic} onChange={e=>setForm(f=>({...f,diastolic:e.target.value}))}/></div>
        </div>}
        {form.type==='glucose'&&<div className="fg"><label className="label">Blood Glucose (mg/dL)</label><input className="input" type="number" placeholder="100" value={form.glucose} onChange={e=>setForm(f=>({...f,glucose:e.target.value}))}/></div>}
        {form.type==='weight'&&<div className="fg"><label className="label">Weight (kg)</label><input className="input" type="number" placeholder="72" value={form.weight} onChange={e=>setForm(f=>({...f,weight:e.target.value}))}/></div>}
        <button className="btn btn-primary" disabled={saving} onClick={save}>{saving?'Saving…':'Save Metric'}</button>
      </div>
    </div>
  );
}

// ═══ EMERGENCY ════════════════════════════════════════════════════
export function Emergency() {
  const [drugs,setDrugs]=useState([]);
  const [odDrug,setOdDrug]=useState('');
  const [odRes,setOdRes]=useState(null);
  useEffect(()=>{ drugAPI.list().then(r=>setDrugs(r.data.data)); },[]);

  return (
    <div className="fade-in">
      <div className="page-header"><h1 className="page-title" style={{color:'var(--red)'}}>🚨 Emergency</h1><p className="page-sub">Quick access to emergency resources and overdose information</p></div>
      <div className="info info-error" style={{marginBottom:20,fontSize:14}}>
        <span>⚠️</span><div><strong>If someone has collapsed, is not breathing, or has a life-threatening emergency — call 112 immediately.</strong></div>
      </div>
      <div className="g g3" style={{marginBottom:20}}>
        {[{href:'tel:112',icon:'📞',title:'Emergency: 112',sub:'India National Emergency',c:'var(--red)'},
          {href:'tel:18001801104',icon:'☠️',title:'Poison Control',sub:'1800-180-1104 (Toll-free)',c:'var(--orange)'},
          {href:'https://www.google.com/maps/search/pharmacy+near+me',icon:'🗺️',title:'Nearby Pharmacy',sub:'Opens Google Maps',c:'var(--blue)'}].map(x=>(
          <a key={x.title} href={x.href} target={x.href.startsWith('http')?'_blank':'_self'} rel="noreferrer"
            className="card card-hover" style={{textAlign:'center',cursor:'pointer',border:`2px solid ${x.c}`,textDecoration:'none',display:'block'}}>
            <div style={{fontSize:40,marginBottom:8}}>{x.icon}</div>
            <div style={{fontSize:16,fontWeight:700,color:x.c}}>{x.title}</div>
            <div style={{fontSize:12,color:'var(--text3)',marginTop:4}}>{x.sub}</div>
          </a>
        ))}
      </div>
      <div className="g g2">
        <div className="card">
          <div className="section-title">💊 Overdose Risk Lookup</div>
          <div className="fg"><label className="label">Select Drug</label>
            <select className="input" value={odDrug} onChange={e=>setOdDrug(e.target.value)}>
              <option value="">Select drug…</option>
              {drugs.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <button className="btn btn-danger btn-full" onClick={()=>{
            const d=drugs.find(x=>x.id===parseInt(odDrug));
            if(!d){toast.error('Select a drug');return;}
            setOdRes(d);
          }}>Check Overdose Risk</button>
          {odRes&&(
            <div className="info info-error" style={{marginTop:14}}>
              <span>🚨</span>
              <div>
                <strong>{odRes.name} — Overdose Information</strong><br/>
                <span style={{fontSize:12.5}}>Max safe daily dose: <strong>{odRes.maxDaily}mg</strong></span><br/>
                <span style={{fontSize:12.5}}>Overdose signs: {odRes.sideEffects?.slice(-2).join(', ')}</span><br/>
                {odRes.overdoseInfo&&<span style={{fontSize:12,display:'block',marginTop:6}}>{odRes.overdoseInfo}</span>}
                <strong style={{fontSize:14,display:'block',marginTop:8}}>📞 Poison Control: 1800-180-1104</strong>
              </div>
            </div>
          )}
        </div>
        <div className="card">
          <div className="section-title">🚑 First Aid Guide</div>
          {[{icon:'🤢',title:'Medication overdose suspected',steps:['Call 1800-180-1104 (Poison Control) immediately','Do NOT induce vomiting unless instructed','Note: drug name, dose, time taken','Stay with the person — do not leave them alone']},
            {icon:'💊',title:'Signs of serious overdose',steps:['Very slow, shallow, or stopped breathing','Unresponsive or cannot be woken up','Lips or fingernails turning blue','Seizures or loss of bladder control']},
            {icon:'🏃',title:'Call 112 immediately if',steps:['Person is unconscious or unresponsive','Suspected anaphylaxis (throat swelling, hives)','Chest pain or cardiac symptoms','Seizures lasting more than 5 minutes']}].map(g=>(
            <div key={g.title} style={{marginBottom:14}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:6}}>{g.icon} {g.title}</div>
              {g.steps.map((s,i)=><div key={i} style={{display:'flex',gap:8,fontSize:12.5,color:'var(--text2)',marginBottom:3}}><span style={{color:'var(--text3)'}}>{i+1}.</span>{s}</div>)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══ PHARMACIST ════════════════════════════════════════════════
export function Pharmacist() {
  const [queue,setQueue]=useState([
    {id:'RX-2024-0091',patient:'Amit Sharma',time:'2 min ago',drugs:['Warfarin 5mg OD','Aspirin 75mg OD'],risk:'high',note:'SEVERE interaction detected'},
    {id:'RX-2024-0090',patient:'Meera Patel',time:'8 min ago',drugs:['Metformin 500mg BD','Glimepiride 1mg OD'],risk:'low',note:'Validated — minor hypoglycaemia risk'},
    {id:'RX-2024-0089',patient:'Suresh Kumar',time:'15 min ago',drugs:['Amoxicillin 500mg TDS'],risk:'low',note:'Validated'},
    {id:'RX-2024-0088',patient:'Deepa Nair',time:'22 min ago',drugs:['Atorvastatin 40mg OD','Azithromycin 500mg OD'],risk:'medium',note:'Moderate CYP3A4 interaction — monitor CK'},
    {id:'RX-2024-0086',patient:'Rajesh Singh',time:'35 min ago',drugs:['Lisinopril 10mg OD','Ibuprofen 400mg TDS'],risk:'medium',note:'ACE inhibitor + NSAID — monitor renal function'},
  ]);
  const ref=useRef();const ch=useRef();

  useEffect(()=>{
    const tc=TC,gc=GC;
    if(ch.current)ch.current.destroy();
    ch.current=new Chart(ref.current,{type:'bar',data:{
      labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      datasets:[
        {label:'Approved',data:[24,18,31,28,22,15,18],backgroundColor:'rgba(0,229,255,.6)',borderRadius:6},
        {label:'Rejected',data:[2,4,1,3,2,1,3],backgroundColor:'rgba(255,61,90,.6)',borderRadius:6},
      ]},options:{plugins:{legend:{labels:{font:{family:'Inter'},color:tc}}},scales:{x:{ticks:{color:tc,font:{family:'JetBrains Mono',size:10}},grid:{display:false}},y:{ticks:{color:tc,font:{family:'JetBrains Mono',size:10}},grid:{color:gc}}},responsive:true}});
    const chart = ch.current;
    return()=>chart?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const approve=id=>{setQueue(q=>q.filter(x=>x.id!==id));toast.success(`${id} approved ✓`);};
  const reject=id=>{setQueue(q=>q.filter(x=>x.id!==id));toast.error(`${id} rejected`);};
  const rc={high:'var(--red)',medium:'var(--orange)',low:'var(--accent)'};

  return (
    <div className="fade-in">
      <div className="page-header"><h1 className="page-title">Pharmacist Portal</h1><p className="page-sub">Review AI-validated prescriptions and approve or reject</p></div>
      <div className="g g4" style={{marginBottom:20}}>
        {[{i:'⏳',l:'Pending Review',v:queue.length,bg:'var(--yellow-light)'},{i:'✅',l:'Approved Today',v:18,bg:'var(--accent-light)'},{i:'❌',l:'Rejected',v:3,bg:'var(--red-light)'},{i:'⚡',l:'Avg Process Time',v:'8.2s',bg:'var(--blue-light)'}].map(s=>(
          <div key={s.l} className="stat"><div className="stat-icon" style={{background:s.bg}}>{s.i}</div><div><div className="stat-label">{s.l}</div><div className="stat-value">{s.v}</div></div></div>
        ))}
      </div>
      <div className="g g2" style={{alignItems:'start'}}>
        <div className="card">
          <div className="section-title">⏳ Pending Queue ({queue.length})</div>
          {queue.length===0?<div className="empty"><div className="empty-icon">✅</div><div className="empty-title">Queue empty</div></div>
          :queue.map(rx=>(
            <div key={rx.id} className="card card-sm" style={{marginBottom:10,borderLeft:`3px solid ${rc[rx.risk]}`}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:6}}>
                <div><div style={{fontWeight:700}}>{rx.id}</div><div style={{fontSize:12,color:'var(--text3)'}}>{rx.patient} · {rx.time}</div></div>
                <span className={`badge ${rx.risk==='high'?'b-red':rx.risk==='medium'?'b-orange':'b-green'}`}>{rx.risk} risk</span>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:6}}>{rx.drugs.map(d=><span key={d} className="tag">{d}</span>)}</div>
              <div style={{fontSize:12,color:rx.risk==='high'?'var(--red)':'var(--text3)',marginBottom:10}}>AI note: {rx.note}</div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-primary btn-sm" style={{flex:1}} onClick={()=>approve(rx.id)}>✅ Approve</button>
                <button className="btn btn-danger btn-sm" style={{flex:1}} onClick={()=>reject(rx.id)}>❌ Reject</button>
              </div>
            </div>
          ))}
        </div>
        <div className="card"><div className="section-title">📊 Weekly Analytics</div><canvas ref={ref} height={220}/></div>
      </div>
    </div>
  );
}

// ═══ DOCTOR ══════════════════════════════════════════════════════
export function Doctor() {
  const [drugs,setDrugs]=useState([]);
  const [items,setItems]=useState([]);
  const [form,setForm]=useState({patient:'',drug:'',dose:'',freq:'OD',dur:'',notes:''});
  useEffect(()=>{ drugAPI.list().then(r=>setDrugs(r.data.data)); },[]);

  const addItem=()=>{
    if(!form.drug||!form.dose){toast.error('Select drug and dose');return;}
    const d=drugs.find(x=>x.id===parseInt(form.drug));
    setItems(it=>[...it,{...form,drugName:d?.name}]);
    setForm(f=>({...f,drug:'',dose:'',notes:''}));
    toast.success(`${d?.name} added`);
  };

  const submit=()=>{
    if(!form.patient){toast.error('Enter patient name');return;}
    if(!items.length){toast.error('Add at least one medication');return;}
    setItems([]);toast.success(`E-Prescription sent to ${form.patient} ✓`);
  };

  const PATIENTS=[
    {name:'Rahul Kumar',age:26,cond:'Type 2 DM, Hypertension'},
    {name:'Priya Sharma',age:34,cond:'Hypothyroidism, PCOS'},
    {name:'Amit Verma',age:52,cond:'CAD, Hypercholesterolaemia'},
    {name:'Sunita Patel',age:45,cond:'GERD, Anxiety disorder'},
  ];

  return (
    <div className="fade-in">
      <div className="page-header"><h1 className="page-title">Doctor Portal</h1><p className="page-sub">Write e-prescriptions with real-time AI validation</p></div>
      <div className="g g2" style={{alignItems:'start'}}>
        <div className="card">
          <div className="section-title">✍️ Write E-Prescription</div>
          <div className="fg"><label className="label">Patient Name</label>
            <input className="input" placeholder="Search patient…" value={form.patient} onChange={e=>setForm(f=>({...f,patient:e.target.value}))}/>
          </div>
          <div className="frow">
            <div className="fg"><label className="label">Medication</label>
              <select className="input" value={form.drug} onChange={e=>setForm(f=>({...f,drug:e.target.value}))}>
                <option value="">Select drug…</option>
                {drugs.map(d=><option key={d.id} value={d.id}>{d.name} ({d.min}-{d.max}mg)</option>)}
              </select>
            </div>
            <div className="fg"><label className="label">Dosage</label>
              <input className="input" placeholder="e.g. 500mg" value={form.dose} onChange={e=>setForm(f=>({...f,dose:e.target.value}))}/>
            </div>
          </div>
          <div className="frow">
            <div className="fg"><label className="label">Frequency</label>
              <select className="input" value={form.freq} onChange={e=>setForm(f=>({...f,freq:e.target.value}))}>
                {['OD','BD','TDS','QDS','SOS'].map(x=><option key={x}>{x}</option>)}
              </select>
            </div>
            <div className="fg"><label className="label">Duration (days)</label>
              <input className="input" type="number" placeholder="7" value={form.dur} onChange={e=>setForm(f=>({...f,dur:e.target.value}))}/>
            </div>
          </div>
          <div className="fg"><label className="label">Instructions</label>
            <textarea className="input" rows={2} placeholder="Take with food, avoid alcohol…" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-primary" style={{flex:1}} onClick={addItem}>+ Add Drug</button>
            <button className="btn btn-outline" onClick={submit}>✉️ Send Prescription</button>
          </div>
          {items.length>0&&<div style={{marginTop:14}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',marginBottom:8}}>PRESCRIPTION ITEMS ({items.length})</div>
            {items.map((it,i)=>(
              <div key={i} className="card card-sm" style={{marginBottom:6,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:13}}><strong>{it.drugName}</strong> {it.dose} — {it.freq} × {it.dur||'?'} days{it.notes?` · ${it.notes}`:''}</span>
                <button className="btn btn-ghost btn-sm" onClick={()=>setItems(a=>a.filter((_,j)=>j!==i))}>✕</button>
              </div>
            ))}
          </div>}
        </div>
        <div className="card">
          <div className="section-title">👥 My Patients</div>
          {PATIENTS.map(p=>(
            <div key={p.name} className="card card-sm" style={{marginBottom:10,display:'flex',alignItems:'center',gap:12,cursor:'pointer'}} onClick={()=>setForm(f=>({...f,patient:p.name}))}>
              <div className="avatar" style={{width:38,height:38}}>{p.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600}}>{p.name} <span style={{color:'var(--text3)',fontWeight:400,fontSize:12}}>Age {p.age}</span></div>
                <div style={{fontSize:12,color:'var(--text3)'}}>{p.cond}</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={e=>{e.stopPropagation();setForm(f=>({...f,patient:p.name}));}}>Select</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══ ADMIN ════════════════════════════════════════════════════════
export function Admin() {
  const ref=useRef();const ch=useRef();
  useEffect(()=>{
    const tc=TC,gc=GC;
    if(ch.current)ch.current.destroy();
    ch.current=new Chart(ref.current,{type:'line',data:{
      labels:['Wk1','Wk2','Wk3','Wk4','Wk5','Wk6','Wk7'],
      datasets:[
        {label:'Prescriptions',data:[180,230,195,310,280,245,312],borderColor:'#448aff',fill:false,tension:.4,pointRadius:3},
        {label:'Users',data:[1100,1140,1165,1200,1230,1255,1284],borderColor:'#00e5ff',fill:false,tension:.4,pointRadius:3,yAxisID:'y1'},
      ]},options:{plugins:{legend:{labels:{font:{family:'Inter'},color:tc}}},scales:{x:{ticks:{color:tc,font:{family:'JetBrains Mono',size:10}},grid:{display:false}},y:{ticks:{color:tc,font:{family:'JetBrains Mono',size:10}},grid:{color:gc}},y1:{position:'right',ticks:{color:tc,font:{family:'JetBrains Mono',size:10}},grid:{display:false}}},responsive:true}});
    const chart = ch.current;
    return()=>chart?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const USERS=[
    {name:'Rahul Kumar',email:'patient@rxai.com',role:'patient',status:'active',login:'2 min ago',count:24},
    {name:'Priya Mehta',email:'pharma@rxai.com',role:'pharmacist',status:'active',login:'5 min ago',count:156},
    {name:'Dr. Anjali Sharma',email:'doctor@rxai.com',role:'doctor',status:'active',login:'1 hr ago',count:89},
    {name:'Arun Singh',email:'admin@rxai.com',role:'admin',status:'active',login:'30 min ago',count:0},
  ];

  return (
    <div className="fade-in">
      <div className="page-header"><h1 className="page-title">Admin Panel</h1><p className="page-sub">System overview, user management, and audit logs</p></div>
      <div className="g g4" style={{marginBottom:20}}>
        {[{i:'👥',l:'Total Users',v:'1,284',s:'↑ 48 this week',bg:'var(--blue-light)'},
          {i:'📋',l:'Prescriptions',v:'8,491',s:'↑ 312 today',bg:'var(--accent-light)'},
          {i:'🤖',l:'AI Accuracy',v:'89%',s:'Target met ✓',bg:'var(--purple-light)'},
          {i:'⚡',l:'Avg Latency',v:'7.8s',s:'<10s target',bg:'var(--yellow-light)'}].map(s=>(
          <div key={s.l} className="stat"><div className="stat-icon" style={{background:s.bg}}>{s.i}</div><div><div className="stat-label">{s.l}</div><div className="stat-value">{s.v}</div><div className="stat-sub">{s.s}</div></div></div>
        ))}
      </div>
      <div className="g g2" style={{marginBottom:16}}>
        <div className="card"><div className="section-title">📈 System Activity</div><canvas ref={ref} height={200}/></div>
        <div className="card">
          <div className="section-title">🔐 Audit Logs</div>
          {[{u:'patient@rxai.com',a:'Prescription validated (OCR)',t:'2 min ago'},
            {u:'pharma@rxai.com',a:'RX-2024-0091 approved',t:'15 min ago'},
            {u:'doctor@rxai.com',a:'E-prescription sent',t:'1 hr ago'},
            {u:'admin@rxai.com',a:'User role updated',t:'3 hrs ago'},
            {u:'patient@rxai.com',a:'Login from 192.168.1.5',t:'4 hrs ago'}].map((a,i)=>(
            <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500}}>{a.a}</div>
                <div style={{fontSize:11,color:'var(--text3)'}}>{a.u}</div>
              </div>
              <div style={{fontSize:11,color:'var(--text3)',whiteSpace:'nowrap'}}>{a.t}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="section-title">👥 User Management</div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Last Login</th><th>Rx Count</th><th>Action</th></tr></thead>
            <tbody>{USERS.map(u=>(
              <tr key={u.email}>
                <td><div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div className="avatar" style={{width:28,height:28,fontSize:10}}>{u.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
                  <div><div style={{fontWeight:600}}>{u.name}</div><div style={{fontSize:11,color:'var(--text3)'}}>{u.email}</div></div>
                </div></td>
                <td><span className="badge b-blue">{u.role}</span></td>
                <td><span className={`badge ${u.status==='active'?'b-green':'b-orange'}`}>{u.status}</span></td>
                <td style={{color:'var(--text3)',fontSize:12}}>{u.login}</td>
                <td>{u.count}</td>
                <td><button className="btn btn-ghost btn-sm" onClick={()=>toast(`Managing ${u.name}`)}>Edit</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
