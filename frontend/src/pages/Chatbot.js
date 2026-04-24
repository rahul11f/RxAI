import React, { useState, useRef, useEffect } from 'react';
import { chatAPI } from '../utils/api';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

const QUICK = [
  'What is Metformin used for?',
  'Side effects of Atorvastatin?',
  'Can I take Aspirin with Warfarin?',
  'What if I miss a Levothyroxine dose?',
  'Foods to avoid with Warfarin?',
  'How does Omeprazole work?',
  'Max safe dose of Paracetamol per day?',
  'What is the Warfarin + Ibuprofen interaction?',
  'Explain the RxAI validation pipeline',
  'Ciprofloxacin — can I take with dairy?',
  'Signs of Metformin lactic acidosis?',
  'Amiodarone — what monitoring is needed?',
];

const WELCOME = `Hello! I'm **RxAI Assistant**, powered by **Anthropic Claude AI**.

I have access to complete clinical data for **30 drugs** including mechanisms, dosages, side effects, food interactions, and monitoring requirements — plus **8 major drug-drug interactions**.

**I can help you with:**
• Detailed drug information (mechanism, indications, side effects)
• Drug-drug and drug-food interaction details
• Safe dosage ranges and monitoring requirements
• Missed dose guidance
• How the RxAI AI pipeline works

*Educational information only. Always consult your doctor or pharmacist for personal medical decisions.*`;

export default function Chatbot() {
  const { chatHistory, addChatMsg, clearChat } = useStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const bottomRef = useRef();
  const inputRef = useRef();

  useEffect(()=>{
    if (chatHistory.length===0) addChatMsg({ role:'ai', content:WELCOME, ts:Date.now() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  },[chatHistory, loading]);

  const send = async (msg) => {
    const m = msg || input.trim();
    if (!m || loading) return;
    setInput('');
    addChatMsg({ role:'user', content:m, ts:Date.now() });
    setLoading(true);

    try {
      const apiHist = chatHistory.slice(-14).map(h=>({ role: h.role==='user'?'user':'assistant', content:h.content }));
      const { data } = await chatAPI.send(m, apiHist);
      addChatMsg({ role:'ai', content:data.reply, ts:Date.now(), model:data.model, fallback:data.fallback });
      setApiStatus(data.fallback ? 'fallback' : 'live');
    } catch(err) {
      addChatMsg({ role:'ai', content:'⚠ Connection to backend lost. Verify server status on port 5000.', ts:Date.now() });
      toast.error('Backend connection failed');
    } finally { setLoading(false); }
  };

  const voiceInput = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error('Voice not supported. Use Chrome.'); return; }
    const r = new SR(); r.lang='en-IN'; r.start();
    toast('Listening…', { duration:3000 });
    r.onresult = e => { setInput(e.results[0][0].transcript); inputRef.current?.focus(); };
    r.onerror  = () => toast.error('Voice recognition failed');
  };

  const fmt = txt => txt
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.*?)\*/g,'<em>$1</em>')
    .replace(/`(.*?)`/g,'<code>$1</code>')
    .replace(/\n/g,'<br/>');

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">AI Assistant</h1>
        <p className="page-sub">CLAUDE AI · 30 DRUGS · 8 INTERACTIONS · REAL-TIME ANALYSIS</p>
      </div>

      <div className="g g2" style={{alignItems:'start'}}>
        <div>
          <div className="chat-wrap">
            <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:40,height:40,background:'linear-gradient(135deg,#00e5ff,#448aff)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontFamily:'var(--heading)',color:'#000',fontWeight:900,boxShadow:'0 0 16px rgba(0,229,255,.3)'}}>◈</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontFamily:'var(--heading)',fontSize:13,letterSpacing:'.03em'}}>RXAI ASSISTANT</div>
                <div style={{fontSize:11,color:'var(--text3)',display:'flex',alignItems:'center',gap:6,fontFamily:'var(--mono)'}}>
                  <span style={{width:6,height:6,borderRadius:'50%',background:'#00e5ff',display:'inline-block',boxShadow:'0 0 8px #00e5ff'}}/>
                  {apiStatus==='live' ? 'LIVE · Claude AI' : apiStatus==='fallback' ? 'FALLBACK MODE' : 'READY'}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" style={{fontFamily:'var(--mono)',fontSize:10}} onClick={()=>{clearChat();toast('Chat cleared');}}>CLEAR</button>
            </div>

            <div className="chat-body">
              {chatHistory.map((msg,i)=>(
                <div key={i} className={`chat-msg ${msg.role}`}>
                  <div className="chat-av">{msg.role==='ai'?'◈':'◉'}</div>
                  <div>
                    <div className="chat-bubble" dangerouslySetInnerHTML={{__html:fmt(msg.content)}}/>
                    {msg.fallback && <div style={{fontSize:10,color:'var(--text3)',marginTop:3,textAlign:msg.role==='user'?'right':'left',fontFamily:'var(--mono)'}}>FALLBACK</div>}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="chat-msg ai">
                  <div className="chat-av">◈</div>
                  <div className="chat-bubble" style={{padding:'14px 18px'}}>
                    <div className="typing-wrap" style={{padding:0}}>
                      <span className="dot"/><span className="dot"/><span className="dot"/>
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            <div className="chat-footer">
              <button className="btn btn-ghost btn-icon" title="Voice input" onClick={voiceInput}>🎤</button>
              <input ref={inputRef} className="chat-input" value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();} }}
                placeholder="Query drug info, interactions, side effects…"
                disabled={loading}/>
              <button className="btn btn-primary btn-icon" onClick={()=>send()} disabled={loading||!input.trim()}>➤</button>
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{marginBottom:14}}>
            <div className="section-title">⚡ Quick Queries</div>
            <div style={{display:'flex',flexDirection:'column',gap:7}}>
              {QUICK.map(q=>(
                <button key={q} className="btn btn-outline btn-sm"
                  style={{textAlign:'left',justifyContent:'flex-start',lineHeight:1.4,fontFamily:'var(--mono)',fontSize:11}}
                  onClick={()=>send(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="info info-warn" style={{marginBottom:12}}>
              <span>⚠</span>
              <div><strong style={{fontFamily:'var(--heading)',fontSize:11,letterSpacing:'.03em'}}>MEDICAL DISCLAIMER</strong><br/>
                <span style={{fontSize:12}}>Educational information only. NOT a substitute for professional medical advice.</span>
              </div>
            </div>
            <div style={{fontSize:11,color:'var(--text3)',fontFamily:'var(--mono)'}}>
              POWERED BY <span style={{color:'var(--accent)'}}>ANTHROPIC CLAUDE</span><br/>
              RxAI Backend · BBD University 2024-25
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
