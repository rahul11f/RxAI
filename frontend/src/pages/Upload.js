import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { rxAPI } from '../utils/api';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

const STEPS = [
  { icon:'◎', label:'Preprocessing — grayscale, sharpen, threshold, upscale' },
  { icon:'◉', label:'Tesseract.js LSTM OCR — text extraction' },
  { icon:'◈', label:'OCR correction — fixing common misreads (l/1/I/0)' },
  { icon:'⬡', label:'Named Entity Recognition — drugs, dosages, frequencies' },
  { icon:'◧', label:'Fuzzy drug matching (Fuse.js) — 30-drug database' },
  { icon:'⚠', label:'Drug-drug interaction matrix scan (8 interactions)' },
  { icon:'◫', label:'Dosage validation — ranges, daily max, frequency' },
  { icon:'▤', label:'Generating clinical validation report' },
];

const SEV_CLS = { minor:'b-green', moderate:'b-yellow', severe:'b-red', contraindicated:'b-purple' };
const SEV_INFO = { minor:'info-success', moderate:'info-warn', severe:'info-error', contraindicated:'info-error' };

const SAMPLE = `Dr. Anjali Sharma, MBBS MD (Medicine)
City Medical Centre, Lucknow - 226001
Phone: 0522-XXXXXXX | Reg. No.: MCI/UP/12345
Date: ${new Date().toLocaleDateString('en-IN')}

Patient: Rahul Kumar    Age: 26 years    Sex: Male
Weight: 72 kg           Blood Group: O+

Rx:
1. Metformin 500mg BD × 30 days (after meals)
2. Atorvastatin 20mg OD × 30 days (at night)
3. Aspirin 75mg OD × 90 days (after breakfast)
4. Omeprazole 20mg OD × 14 days (30 min before breakfast)

Instructions:
- Monitor blood glucose weekly
- Avoid grapefruit with Atorvastatin
- Follow up after 4 weeks

Dr. Anjali Sharma
Signature: _____________`;

export default function Upload() {
  const { addPrescription } = useStore();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mode, setMode] = useState('file');
  const [text, setText] = useState('');
  const [step, setStep] = useState(-1);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const onDrop = useCallback(accepted => {
    if (!accepted.length) return;
    const f = accepted[0];
    setFile(f);
    setResult(null);
    if (f.type.startsWith('image/')) setPreview(URL.createObjectURL(f));
    else setPreview(null);
    toast.success(`${f.name} loaded`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept:{'image/*':[],'application/pdf':[]}, maxFiles:1, maxSize:10*1024*1024,
  });

  const validate = async () => {
    if (mode==='file' && !file && !text) { toast.error('Upload image or enter text'); return; }
    if (mode==='text' && !text.trim())   { toast.error('Enter prescription text'); return; }

    setProcessing(true); setResult(null); setStep(0);

    const iv = setInterval(()=>setStep(s=>{ if(s>=STEPS.length-1){clearInterval(iv);return s;} return s+1; }), 800);

    try {
      const fd = new FormData();
      if (mode==='file' && file) fd.append('image', file);
      else fd.append('text', text || SAMPLE);

      const { data } = await rxAPI.validate(fd);
      clearInterval(iv);
      setStep(STEPS.length-1);
      await new Promise(r=>setTimeout(r,500));
      setResult(data.data);
      addPrescription(data.data);
      toast.success('Validation complete');
    } catch(err) {
      clearInterval(iv);
      toast.error(err.response?.data?.error || 'Validation failed — check backend');
    } finally { setProcessing(false); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Scan & Validate</h1>
        <p className="page-sub">OCR + NER + CLINICAL DB VALIDATION · SHARP PREPROCESSING</p>
      </div>

      <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
        {[['file','◎ IMAGE/PDF'],['text','◈ MANUAL TEXT']].map(([m,l])=>(
          <button key={m} className={`btn ${mode===m?'btn-primary':'btn-outline'}`}
            style={{fontFamily:'var(--heading)',fontSize:11,letterSpacing:'.03em'}} onClick={()=>setMode(m)}>{l}</button>
        ))}
        <button className="btn btn-outline" style={{marginLeft:'auto',fontFamily:'var(--mono)',fontSize:11}} onClick={()=>{setMode('text');setText(SAMPLE);toast('Sample loaded');}}>
          LOAD SAMPLE RX
        </button>
      </div>

      <div className="g g2" style={{alignItems:'start'}}>
        <div>
          {mode==='file' ? (
            <div className="card" style={{marginBottom:14}}>
              <div className="section-title">◎ Prescription Image</div>
              <div {...getRootProps()} className={`drop-zone ${isDragActive?'active':''}`}>
                <input {...getInputProps()}/>
                {preview
                  ? <img src={preview} alt="preview" style={{maxHeight:200,borderRadius:10,marginBottom:10}}/>
                  : <><span className="drop-zone-icon" style={{fontFamily:'var(--heading)',color:'var(--accent)'}}>◎</span></>
                }
                <div style={{fontWeight:600,fontSize:14,marginBottom:6,fontFamily:'var(--heading)',letterSpacing:'.03em'}}>
                  {isDragActive ? 'DROP HERE' : file ? `✓ ${file.name}` : 'DROP PRESCRIPTION IMAGE'}
                </div>
                <div style={{color:'var(--text3)',fontSize:12,fontFamily:'var(--mono)'}}>PNG, JPG, PDF · Max 10 MB</div>
              </div>
            </div>
          ) : (
            <div className="card" style={{marginBottom:14}}>
              <div className="section-title">◈ Prescription Text</div>
              <textarea className="input" rows={12} value={text} onChange={e=>setText(e.target.value)}
                placeholder={SAMPLE} style={{resize:'vertical',fontFamily:'var(--mono)',fontSize:12,lineHeight:1.6}}/>
              <p className="hint" style={{marginTop:6,fontFamily:'var(--mono)'}}>Include drug names, dosages (mg/mcg), frequencies (OD/BD/TDS)</p>
            </div>
          )}
          <button className="btn btn-primary btn-full btn-lg" onClick={validate} disabled={processing}
            style={{fontFamily:'var(--heading)',letterSpacing:'.05em'}}>
            {processing
              ? <><span className="spinner" style={{width:18,height:18}}/> PROCESSING…</>
              : '◈ VALIDATE WITH AI'}
          </button>
        </div>

        <div>
          {processing && (
            <div className="card fade-in" style={{marginBottom:14}}>
              <div className="section-title">⚙ AI Pipeline</div>
              {STEPS.map((s,i)=>(
                <div key={i} className={`step-item ${i<step?'done':i===step?'active':'pending'}`}>
                  <div className="step-num">
                    {i<step ? '✓' : i===step ? <span className="spinner" style={{width:12,height:12}}/> : i+1}
                  </div>
                  <span style={{fontSize:12,fontFamily:'var(--mono)'}}><span style={{marginRight:6,color:'var(--accent)'}}>{s.icon}</span>{s.label}</span>
                </div>
              ))}
              <div style={{marginTop:14}}>
                <div className="progress">
                  <div className="progress-fill" style={{width:`${Math.round(((step+1)/STEPS.length)*100)}%`}}/>
                </div>
                <div style={{fontSize:11,color:'var(--text3)',textAlign:'right',marginTop:4,fontFamily:'var(--mono)'}}>
                  {Math.round(((step+1)/STEPS.length)*100)}%
                </div>
              </div>
            </div>
          )}

          {result && <ValidationResult result={result}/>}

          {!processing && !result && (
            <div className="card">
              <div className="empty"><div className="empty-icon" style={{fontFamily:'var(--heading)',color:'var(--accent)',fontSize:56}}>◎</div>
                <div className="empty-title">Ready to Scan</div>
                <p style={{fontFamily:'var(--mono)',fontSize:12}}>Upload image or enter text, then validate.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ValidationResult({ result }) {
  const { status, confidence, drugs=[], interactions=[], ocrText='', pipeline, processingMs } = result;

  const cfg = {
    valid:   { cls:'val-valid',   icon:'✓', title:'VALIDATED',           sub:'All drugs pass clinical checks' },
    warning: { cls:'val-warning', icon:'⚠', title:'REVIEW REQUIRED', sub:'Interaction(s) detected' },
    invalid: { cls:'val-invalid', icon:'✗', title:'INVALID',          sub:'Safety issue found' },
  }[status] || { cls:'val-warning', icon:'⚠', title:'REVIEW', sub:'' };

  const exportPDF = () => {
    const w = window.open('','_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>RxAI Report — ${result.id}</title>
    <style>body{font-family:'Inter',sans-serif;padding:30px;max-width:700px;color:#e0e6f0;background:#060a13}
    h1{color:#00e5ff;border-bottom:2px solid #00e5ff;padding-bottom:8px;font-family:'Orbitron',sans-serif;letter-spacing:.05em}
    h2{color:#00e5ff;margin-top:24px;font-size:14px;font-family:'Orbitron',sans-serif;letter-spacing:.05em}
    table{width:100%;border-collapse:collapse;margin:12px 0}
    th,td{border:1px solid #1e2a42;padding:8px 12px;text-align:left;font-size:13px}
    th{background:#141c2e;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:.05em}
    .badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600}
    .valid{background:rgba(0,229,255,.1);color:#00e5ff}.warning{background:rgba(255,145,0,.1);color:#ff9100}
    .invalid{background:rgba(255,61,90,.1);color:#ff3d5a}.severe{background:rgba(255,61,90,.1);color:#ff3d5a}
    .moderate{background:rgba(255,215,64,.1);color:#ffd740}.minor{background:rgba(0,229,255,.1);color:#00e5ff}
    pre{background:#141c2e;padding:12px;border-radius:6px;font-size:11px;white-space:pre-wrap;line-height:1.5;color:#8a9bb8;border:1px solid #1e2a42}
    footer{margin-top:32px;padding-top:12px;border-top:1px solid #1e2a42;font-size:11px;color:#4a5a78}
    </style></head><body>
    <h1>◈ RxAI Validation Report</h1>
    <p><strong>Report ID:</strong> ${result.id}</p>
    <p><strong>Generated:</strong> ${new Date().toLocaleString('en-IN')}</p>
    <p><strong>Status:</strong> <span class="badge ${status}">${status.toUpperCase()}</span></p>
    <p><strong>AI Confidence:</strong> ${(confidence*100).toFixed(1)}%</p>
    <p><strong>Processing:</strong> ${processingMs}ms</p>
    <p><strong>Engine:</strong> ${pipeline?.ocr?.engine||'Tesseract.js'} (${pipeline?.ocr?.characters||0} chars)</p>
    <h2>Extracted Medications (${drugs.length})</h2>
    <table><tr><th>Drug</th><th>Extracted As</th><th>Dose</th><th>Freq</th><th>Duration</th><th>Valid</th><th>Notes</th></tr>
    ${drugs.map(d=>`<tr>
      <td><strong>${d.drugName}</strong><br/><small style="color:#4a5a78">${d.drug?.class||''}</small></td>
      <td>${d.extractedName} <small>(${d.matchScore}%)</small></td>
      <td>${d.dosageValue}${d.dosageUnit}</td><td>${d.frequency}</td><td>${d.durationDays}d</td>
      <td><span class="badge ${d.valid?'valid':'invalid'}">${d.valid?'✓':'✗'}</span></td>
      <td style="font-size:12px">${[...d.issues,...d.warnings].join('; ')||'—'}</td>
    </tr>`).join('')}
    </table>
    ${interactions.length?`<h2>⚠ Interactions (${interactions.length})</h2>
    <table><tr><th>Drug A</th><th>Drug B</th><th>Severity</th><th>Effect</th><th>Management</th></tr>
    ${interactions.map(i=>`<tr>
      <td>${i.drugAName}</td><td>${i.drugBName}</td>
      <td><span class="badge ${i.severity}">${i.severity}</span></td>
      <td style="font-size:12px">${i.effect}</td>
      <td style="font-size:12px">${i.management}</td>
    </tr>`).join('')}</table>`:'<h2>✓ No Interactions Detected</h2>'}
    <h2>OCR Output</h2><pre>${ocrText}</pre>
    <footer>RxAI — AI Prescription Validation · BBD University Group 132 · Ms. Kratika Chandra · 2024-25<br/>
    This report is AI-generated. Verify with a licensed pharmacist.</footer>
    </body></html>`);
    w.document.close(); w.print();
    toast.success('PDF opened');
  };

  const exportJSON = () => {
    const b = new Blob([JSON.stringify(result,null,2)],{type:'application/json'});
    const u = URL.createObjectURL(b); const a = document.createElement('a');
    a.href=u; a.download=`${result.id}.json`; a.click(); URL.revokeObjectURL(u);
    toast.success('JSON downloaded');
  };

  return (
    <div className="fade-in" style={{borderRadius:'var(--r)',overflow:'hidden',border:'1px solid var(--border)'}}>
      <div className={`val-header ${cfg.cls}`}>
        <div className="val-icon" style={{fontFamily:'var(--heading)',fontSize:20}}>{cfg.icon}</div>
        <div>
          <div className="val-title">{cfg.title}</div>
          <div className="val-sub">
            CONF: {(confidence*100).toFixed(1)}% · {processingMs}ms · {drugs.length} DRUG(S)
          </div>
        </div>
      </div>

      <div className="val-body">
        {drugs.length > 0 ? (
          <>
            <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:'var(--text3)',marginBottom:12,letterSpacing:'.08em',fontFamily:'var(--heading)'}}>
              Extracted Medications ({drugs.length})
            </div>
            {drugs.map((d,i)=>(
              <div key={i} className="drug-row">
                <div className="drug-dot" style={{background:d.valid?'var(--accent)':'var(--red)',color:d.valid?'var(--accent)':'var(--red)'}}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14}}>{d.drugName}
                    <span style={{color:'var(--text3)',fontWeight:400,fontSize:12,fontFamily:'var(--mono)'}}> {d.dosageValue}{d.dosageUnit} · {d.frequency} · {d.durationDays}d</span>
                    {d.matchScore < 100 && <span className="badge b-blue" style={{marginLeft:8,fontSize:10}}>FUZZY {d.matchScore}%</span>}
                  </div>
                  <div style={{fontSize:12,color:'var(--text3)',marginTop:2,fontFamily:'var(--mono)'}}>{d.drug?.class}</div>
                  {d.issues.length>0 && d.issues.map((iss,j)=>(
                    <div key={j} style={{fontSize:12,color:'var(--red)',marginTop:3}}>⚠ {iss}</div>
                  ))}
                  {d.warnings.length>0 && d.warnings.map((w,j)=>(
                    <div key={j} style={{fontSize:12,color:'var(--orange)',marginTop:3}}>⚡ {w}</div>
                  ))}
                  {d.valid && d.issues.length===0 && d.warnings.length===0 && (
                    <div style={{fontSize:12,color:'var(--accent)',marginTop:3}}>✓ Validated — within clinical guidelines</div>
                  )}
                </div>
                <span className={`badge ${d.valid?'b-green':'b-red'}`}>{d.valid?'✓ VALID':'✗ ISSUE'}</span>
              </div>
            ))}
          </>
        ) : (
          <div className="info info-warn" style={{marginBottom:14}}>
            <span>⚠</span>
            <div>No drug names recognized. Try a clearer image or use manual text mode.</div>
          </div>
        )}

        {interactions.length > 0 && (
          <div style={{marginTop:16}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:'var(--text3)',marginBottom:10,letterSpacing:'.08em',fontFamily:'var(--heading)'}}>
              Drug Interactions ({interactions.length})
            </div>
            {interactions.map((inter,i)=>(
              <div key={i} className={`info ${SEV_INFO[inter.severity]||'info-warn'}`} style={{marginBottom:10}}>
                <span>{inter.severity==='severe'||inter.severity==='contraindicated'?'⚠':'⚡'}</span>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    <strong>{inter.drugAName} + {inter.drugBName}</strong>
                    <span className={`badge ${SEV_CLS[inter.severity]}`}>{inter.severity.toUpperCase()}</span>
                  </div>
                  <div style={{fontSize:12,marginTop:6,lineHeight:1.55}}>
                    <strong>Effect:</strong> {inter.effect}
                  </div>
                  <div style={{fontSize:12,marginTop:5,color:'var(--text2)',lineHeight:1.55}}>
                    <strong>Mechanism:</strong> {inter.mechanism}
                  </div>
                  <div style={{fontSize:12,marginTop:5,lineHeight:1.55}}>
                    <strong>Management:</strong> {inter.management}
                  </div>
                  {inter.clinicalPearl && (
                    <div style={{fontSize:12,marginTop:5,color:'var(--blue)',fontStyle:'italic'}}>
                      ◈ {inter.clinicalPearl}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {ocrText && (
          <details style={{marginTop:14}}>
            <summary>◉ RAW OCR OUTPUT ({pipeline?.ocr?.characters||0} CHARS)</summary>
            <div className="details-body"><pre style={{fontSize:11}}>{ocrText}</pre></div>
          </details>
        )}

        <div style={{marginTop:16}}>
          <details>
            <summary>⚙ PIPELINE DETAILS</summary>
            <div className="details-body">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:12,fontFamily:'var(--mono)'}}>
                <div><strong>Engine:</strong> {pipeline?.ocr?.engine}</div>
                <div><strong>Characters:</strong> {pipeline?.ocr?.characters}</div>
                <div><strong>NER:</strong> {pipeline?.ner?.method}</div>
                <div><strong>Drugs found:</strong> {pipeline?.ner?.drugsFound}</div>
                <div><strong>Pairs checked:</strong> {pipeline?.interactions?.pairsChecked}</div>
                <div><strong>Interactions:</strong> {pipeline?.interactions?.found}</div>
                <div><strong>Confidence:</strong> {pipeline?.confidence?.method}</div>
                <div><strong>Score:</strong> {(confidence*100).toFixed(1)}%</div>
              </div>
            </div>
          </details>
        </div>

        {drugs.length>0 && drugs.some(d=>d.drug) && (
          <details style={{marginTop:8}}>
            <summary>◧ DRUG INFO CARDS</summary>
            <div className="details-body">
              {drugs.filter(d=>d.drug).map((d,i)=>(
                <div key={i} style={{marginBottom:16,paddingBottom:16,borderBottom:i<drugs.length-1?'1px solid var(--border)':'none'}}>
                  <div style={{fontWeight:700,fontSize:14,marginBottom:6,fontFamily:'var(--heading)',letterSpacing:'.02em'}}>{d.drugName} <span style={{fontWeight:400,color:'var(--text3)',fontSize:11,fontFamily:'var(--sans)'}}>({d.drug.class})</span></div>
                  <div style={{fontSize:12,marginBottom:4}}><strong>Mechanism:</strong> {d.drug.mechanism}</div>
                  <div style={{fontSize:12,marginBottom:4}}><strong>Indications:</strong> {d.drug.indications?.slice(0,3).join(', ')}</div>
                  <div style={{fontSize:12,marginBottom:4}}><strong>Side effects:</strong> {d.drug.sideEffects?.slice(0,4).join(', ')}</div>
                  <div style={{fontSize:12,marginBottom:4}}><strong>Food:</strong> {d.drug.foodInteractions?.[0]}</div>
                  <div style={{fontSize:12,marginBottom:4}}><strong>Monitoring:</strong> {d.drug.monitoring?.join(', ')}</div>
                  <div style={{fontSize:12,marginBottom:4}}><strong>Half-life:</strong> {d.drug.halfLife} · <strong>Pregnancy:</strong> Cat {d.drug.pregnancyCategory}</div>
                  {d.drug.criticalNote && (
                    <div className="info info-error" style={{marginTop:8,fontSize:12}}>
                      <span>⚠</span><div>{d.drug.criticalNote}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}

        <div style={{display:'flex',gap:8,marginTop:16,flexWrap:'wrap'}}>
          <button className="btn btn-outline btn-sm" style={{fontFamily:'var(--mono)',fontSize:11}} onClick={exportPDF}>PDF REPORT</button>
          <button className="btn btn-outline btn-sm" style={{fontFamily:'var(--mono)',fontSize:11}} onClick={exportJSON}>JSON EXPORT</button>
          <button className="btn btn-primary btn-sm" style={{fontFamily:'var(--mono)',fontSize:11}} onClick={()=>toast.success('Saved ✓')}>SAVE</button>
        </div>
      </div>
    </div>
  );
}
