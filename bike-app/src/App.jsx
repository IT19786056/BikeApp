import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Wrench, 
  CircleDot, 
  Plus, 
  Calendar, 
  Navigation, 
  ChevronRight, 
  User,
  Sparkles,
  Loader2,
  AlertCircle
} from 'lucide-react';

// --- ROBUST STYLING GUARD ---
// These styles work independently of Tailwind to ensure the cards look perfect on any device.
const GlobalStyles = () => (
  <style>{`
    body { 
      margin: 0; 
      padding: 0; 
      background-color: #F3F4F6; 
      font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
      color: #111827;
      -webkit-font-smoothing: antialiased;
    }

    .insurance-container {
      width: 100%;
      max-width: 440px;
      margin: 0 auto;
      background-color: #FFEB3B;
      border-radius: 14px;
      border: 1px solid #c9b000;
      box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      aspect-ratio: 1.58 / 1;
      display: flex;
      flex-direction: column;
      color: #000;
      /* Adjusted font scaling for better legibility on small screens */
      font-size: clamp(9px, 2.8vw, 12px);
      min-height: 240px;
    }

    .ins-header {
      background-color: #000;
      color: #fff;
      padding: 2.5% 3.5%;
      display: flex;
      align-items: center;
      gap: 3%;
    }

    .ins-logo-box {
      background-color: #fff;
      border-radius: 4px;
      padding: 2px;
      width: 13%;
      min-width: 44px;
      text-align: center;
      flex-shrink: 0;
    }

    .ins-body {
      padding: 3.5% 4.5%;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }

    .ins-grid {
      display: grid;
      grid-template-columns: 30% 1fr 18%;
      gap: 1.8% 3%;
      margin-top: 2%;
    }

    .ins-label { 
      font-weight: bold; 
      opacity: 0.8; 
      text-transform: uppercase; 
      font-size: 0.75em; 
      white-space: nowrap;
    }
    .ins-value { 
      font-weight: 800; 
      text-transform: uppercase;
      font-size: 0.95em;
      letter-spacing: -0.2px;
    }

    .revenue-circle {
      width: 100%;
      max-width: 340px;
      aspect-ratio: 1 / 1;
      border-radius: 50%;
      background-color: #E1D5E7;
      border: 12px solid #9271A3;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 6%;
      text-align: center;
      box-shadow: 0 15px 30px -10px rgba(0, 0, 0, 0.2);
      color: #4A235A;
    }

    .mobile-wrap { padding: 20px; width: 100%; box-sizing: border-box; }
    
    .nav-fixed { 
      position: fixed; bottom: 24px; left: 24px; right: 24px; 
      background: rgba(255, 255, 255, 0.95); 
      backdrop-filter: blur(12px); 
      -webkit-backdrop-filter: blur(12px);
      border-radius: 36px; 
      height: 72px;
      display: flex; justify-content: space-around; align-items: center;
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.15);
      z-index: 100;
      border: 1px solid rgba(0,0,0,0.05);
    }

    @keyframes pulse-gold {
      0% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(234, 179, 8, 0); }
      100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0); }
    }
    .ai-pulse { animation: pulse-gold 2s infinite; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 380px) {
      .ins-grid { grid-template-columns: 35% 1fr; }
      .ins-hide-small { display: none; }
    }
  `}</style>
);

const DATA = {
  ins: {
    vehicleNo: "159-5839",
    makeModel: "HONDA CD 125",
    policyNo: "CO06221M0000221",
    name: "Mr J.A. LAWRENCE",
    address: "NO: 13/18/G2 MOHOTTIGODA ROAD, THAKSHIL KAHA THUDUWA",
    period: "24-JAN-2026 To 23-JAN-2027",
    engine: "CD125TE1224262",
    chassis: "CD125T1402482",
    cardNo: "MCLH250562169"
  },
  rev: {
    year: "2014-10",
    licenceNo: "WP 7834651",
    class: "MOTOR CYCLE / PETROL / 122-9946",
    owner: "ABANS LTD",
    valid: "1991-10-17 To 2014-10-16",
    fee: "9,925.00"
  }
};

// Runtime environment provides apiKey, leave as empty string for integration
const apiKey = ""; 

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [aiInsight, setAiInsight] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Gemini API integration using gemini-2.5-flash-preview-09-2025 as per instructions.
   * Implements mandatory exponential backoff.
   */
  const callGemini = async (prompt, retryCount = 0) => {
    try {
      // Reverted to gemini-2.5-flash-preview-09-2025 as mandated for the preview environment
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { 
            parts: [{ text: "You are a specialized motorcycle mechanic assistant for a Honda CD 125. Provide concise, bullet-pointed maintenance advice based on provided data. Be professional and practical." }] 
          }
        })
      });

      if (response.status === 403) {
        throw new Error("Authentication failed. Please ensure a valid API key is set.");
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "API Connection failed");
      }
      
      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (err) {
      if (retryCount < 5 && !err.message.includes("Authentication")) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(res => setTimeout(res, delay));
        return callGemini(prompt, retryCount + 1);
      }
      throw err;
    }
  };

  const generateInsight = async () => {
    setIsAiLoading(true);
    setError(null);
    try {
      const prompt = `My bike is a ${DATA.ins.makeModel}. Current mileage is 12,450km. Insurance expires: ${DATA.ins.period.split(' To ')[1]}. Revenue license from: ${DATA.rev.year}. Suggest 3 priority maintenance tasks.`;
      const insight = await callGemini(prompt);
      setAiInsight(insight);
    } catch (err) {
      setError(err.message || "Something went wrong. Please check your connection.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const InsuranceView = () => (
    <div className="mobile-wrap">
      <div className="insurance-container">
        <div className="ins-header">
          <div className="ins-logo-box">
            <div style={{color:'#000', fontSize:'0.6em', fontWeight:'bold'}}>CEYLINCO</div>
            <div style={{backgroundColor:'#FFEB3B', color:'#000', fontWeight:'900', fontSize:'0.9em', padding:'0 2px'}}>VIP</div>
            <div style={{color:'#000', fontSize:'0.4em'}}>ON THE SPOT</div>
          </div>
          <div style={{flex:1, textAlign:'center'}}>
            <div style={{fontWeight:'bold', fontSize:'1em', textTransform:'uppercase', letterSpacing:'0.5px'}}>Ceylinco General Insurance Ltd</div>
            <div style={{fontSize:'0.6em', opacity:0.8, fontStyle:'italic'}}>'Ceylinco House', 69, Janadhipathi Mawatha, Colombo 1.</div>
            <div style={{fontWeight:'bold', fontSize:'1.1em', marginTop:'4px', borderTop:'1px solid rgba(255,255,255,0.3)', paddingTop:'2px'}}>Certificate of Insurance</div>
          </div>
        </div>

        <div className="ins-body">
          <div style={{position:'absolute', top:'4px', right:'12px', fontStyle:'italic', opacity:0.6, fontSize:'0.85em', fontWeight:'bold'}}>{DATA.ins.cardNo}</div>
          
          <div className="ins-grid">
            <div className="ins-label">Vehicle No</div>
            <div className="ins-value" style={{fontSize:'1.15em'}}>{DATA.ins.vehicleNo}</div>
            <div className="ins-value ins-hide-small" style={{textAlign:'right'}}>CD 125</div>

            <div className="ins-label">Make & Model</div>
            <div className="ins-value" style={{gridColumn:'span 2'}}>{DATA.ins.makeModel}</div>

            <div className="ins-label">Policy No</div>
            <div className="ins-value" style={{gridColumn:'span 2', color:'#0044cc'}}>{DATA.ins.policyNo}</div>

            <div className="ins-label">Name</div>
            <div className="ins-value" style={{gridColumn:'span 2'}}>{DATA.ins.name}</div>

            <div className="ins-label">Address</div>
            <div className="ins-value" style={{gridColumn:'span 2', fontSize:'0.8em', lineHeight:1.4}}>{DATA.ins.address}</div>

            <div className="ins-label">Period</div>
            <div className="ins-value" style={{gridColumn:'span 2'}}>{DATA.ins.period}</div>

            <div className="ins-label">Eng/Chassis</div>
            <div className="ins-value" style={{gridColumn:'span 2', fontSize:'0.85em'}}>{DATA.ins.engine} / {DATA.ins.chassis}</div>
          </div>

          <div style={{fontSize:'0.65em', opacity:0.6, borderTop:'1px solid rgba(0,0,0,0.12)', paddingTop:'5px', fontWeight:'500'}}>
            Subject to terms and conditions specified in the policy document.
          </div>
        </div>
      </div>
      
      <div style={{marginTop:'24px', display:'flex', gap:'12px'}}>
         <button style={{flex:1, background:'#fff', border:'1px solid #e5e7eb', padding:'16px', borderRadius:'16px', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'}}>
           <FileText size={18} color="#3b82f6" />
           <span style={{fontSize:'12px', textTransform:'uppercase'}}>Policy Info</span>
         </button>
         <button style={{flex:1, background:'#fff', border:'1px solid #e5e7eb', padding:'16px', borderRadius:'16px', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'}}>
           <ShieldCheck size={18} color="#10b981" />
           <span style={{fontSize:'12px', textTransform:'uppercase'}}>Valid</span>
         </button>
      </div>
    </div>
  );

  const RevenueView = () => (
    <div className="mobile-wrap" style={{display:'flex', justifyContent:'center'}}>
      <div className="revenue-circle">
        <div style={{fontSize:'0.8em', fontWeight:'bold'}}>වාහන ආදායම් බලපත්‍රය</div>
        <div style={{fontSize:'5em', fontWeight:'900', lineHeight:1, margin:'2% 0'}}>{DATA.rev.year}</div>
        <div style={{fontSize:'0.8em', fontWeight:'bold', textTransform:'uppercase', letterSpacing:'1px'}}>Vehicle Revenue Licence</div>
        
        <div style={{width:'100%', borderTop:'1px solid rgba(0,0,0,0.15)', borderBottom:'1px solid rgba(0,0,0,0.15)', margin:'12px 0', padding:'10px 0'}}>
          <div style={{fontSize:'1.1em', fontWeight:'bold'}}>LICENCE NO: {DATA.rev.licenceNo}</div>
          <div style={{fontSize:'0.9em', opacity:0.8, marginTop:'2px'}}>{DATA.rev.class}</div>
        </div>

        <div style={{fontSize:'0.75em', opacity:0.6, fontWeight:'bold'}}>OWNER</div>
        <div style={{fontSize:'1.3em', fontWeight:'bold', margin:'2px 0'}}>{DATA.rev.owner}</div>

        <div style={{fontSize:'1em', fontWeight:'bold', marginTop:'12px', color:'#dc2626'}}>
          VALID: {DATA.rev.valid}
        </div>
        
        <div style={{marginTop:'12px', backgroundColor:'rgba(255,255,255,0.5)', padding:'4px 14px', borderRadius:'12px', fontSize:'1.1em', fontWeight:'900', border:'1px solid rgba(0,0,0,0.05)'}}>
          RS. {DATA.rev.fee}
        </div>
      </div>
    </div>
  );

  const HomeView = () => (
    <div className="mobile-wrap">
      <div style={{backgroundColor:'#111827', borderRadius:'28px', padding:'28px', color:'#fff', position:'relative', overflow:'hidden', boxShadow:'0 20px 40px -10px rgba(0,0,0,0.3)'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:'36px', position:'relative', zIndex:2}}>
          <div style={{flex:1}}>
            <h1 style={{fontSize:'26px', fontWeight:'900', margin:0, letterSpacing:'-0.5px'}}>{DATA.ins.makeModel}</h1>
            <p style={{color:'#9ca3af', fontWeight:'bold', letterSpacing:'1.5px', fontSize:'14px', marginTop:'4px'}}>{DATA.ins.vehicleNo}</p>
          </div>
          <div style={{background:'rgba(255,255,255,0.1)', padding:'12px', borderRadius:'16px'}}>
            <Navigation style={{color:'#fff', width:'24px', height:'24px'}} />
          </div>
        </div>
        
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', position:'relative', zIndex:2}}>
          <div style={{background:'rgba(255,255,255,0.06)', padding:'18px', borderRadius:'20px', border:'1px solid rgba(255,255,255,0.05)'}}>
            <div style={{fontSize:'10px', color:'#9ca3af', fontWeight:'bold', textTransform:'uppercase', letterSpacing:'1px'}}>Milage</div>
            <div style={{fontSize:'20px', fontWeight:'900', marginTop:'4px'}}>12,450 <span style={{fontSize:'12px', fontWeight:'normal', opacity:0.5}}>km</span></div>
          </div>
          <div style={{background:'rgba(255,255,255,0.06)', padding:'18px', borderRadius:'20px', border:'1px solid rgba(255,255,255,0.05)'}}>
            <div style={{fontSize:'10px', color:'#9ca3af', fontWeight:'bold', textTransform:'uppercase', letterSpacing:'1px'}}>Status</div>
            <div style={{fontSize:'20px', fontWeight:'900', color:'#4ade80', marginTop:'4px'}}>GOOD</div>
          </div>
        </div>
      </div>

      {/* AI Maintenance Check - Unified Model Config */}
      <div style={{marginTop:'28px', width: '100%'}}>
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fefce8 100%)',
          borderRadius: '28px',
          padding: '24px',
          border: '1px solid #fef08a',
          boxShadow: '0 10px 25px -5px rgba(234, 179, 8, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: aiInsight || isAiLoading ? '16px' : '0'}}>
            <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{background:'#fef9c3', padding: '10px', borderRadius: '14px', display:'flex', alignItems:'center', justifyContent:'center', width:'40px', height:'40px'}}>
                <Sparkles size={20} color="#ca8a04" />
              </div>
              <div>
                <h3 style={{fontSize:'14px', fontWeight:'900', color:'#854d0e', margin:0}}>AI Mechanic</h3>
                <p style={{fontSize:'10px', color:'#a16207', fontWeight:'bold', margin:0}}>SMART ANALYSIS</p>
              </div>
            </div>
            {!aiInsight && !isAiLoading && (
              <button 
                onClick={generateInsight}
                className="ai-pulse"
                style={{background:'#000', color:'#fff', border:'none', padding:'8px 16px', borderRadius:'12px', fontSize:'11px', fontWeight:'bold', cursor:'pointer'}}
              >
                Scan ✨
              </button>
            )}
          </div>

          {isAiLoading && (
            <div style={{display:'flex', alignItems:'center', gap:'12px', padding:'12px 0'}}>
              <Loader2 className="animate-spin" size={20} color="#ca8a04" />
              <p style={{fontSize:'12px', color:'#854d0e', fontWeight:'bold'}}>Consulting AI Mechanic...</p>
            </div>
          )}

          {error && (
            <div style={{display:'flex', alignItems:'flex-start', gap:'8px', color:'#dc2626', fontSize:'12px', fontWeight:'bold', padding:'8px 0'}}>
              <AlertCircle size={16} style={{marginTop:'2px', flexShrink:0}} />
              <span>{error}</span>
            </div>
          )}

          {aiInsight && (
            <div style={{animation: 'fadeIn 0.5s ease-out'}}>
              <div style={{
                fontSize: '13px',
                color: '#422006',
                lineHeight: '1.6',
                whiteSpace: 'pre-line',
                fontWeight: '500'
              }}>
                {aiInsight}
              </div>
              <button 
                onClick={() => setAiInsight(null)}
                style={{marginTop:'12px', background:'none', border:'none', color:'#a16207', fontSize:'11px', fontWeight:'bold', textDecoration:'underline', cursor:'pointer'}}
              >
                Clear Insight
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginTop:'28px'}}>
        <button onClick={() => setActiveTab('insurance')} style={{background:'#fff', padding:'24px', borderRadius:'28px', border:'1px solid #f3f4f6', boxShadow: activeTab === 'insurance' ? '0 0 0 2px #000' : '0 4px 12px rgba(0,0,0,0.03)', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px', cursor:'pointer'}}>
          <div style={{background:'#fefce8', padding:'12px', borderRadius:'18px'}}><ShieldCheck style={{color:'#ca8a04', width:'30px', height:'30px'}} /></div>
          <span style={{fontSize:'11px', fontWeight:'900', textTransform:'uppercase', letterSpacing:'0.5px', color:'#4b5563'}}>Insurance</span>
        </button>
        <button onClick={() => setActiveTab('revenue')} style={{background:'#fff', padding:'24px', borderRadius:'28px', border:'1px solid #f3f4f6', boxShadow: activeTab === 'revenue' ? '0 0 0 2px #000' : '0 4px 12px rgba(0,0,0,0.03)', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px', cursor:'pointer'}}>
          <div style={{background:'#f5f3ff', padding:'12px', borderRadius:'18px'}}><FileText style={{color:'#7c3aed', width:'30px', height:'30px'}} /></div>
          <span style={{fontSize:'11px', fontWeight:'900', textTransform:'uppercase', letterSpacing:'0.5px', color:'#4b5563'}}>Revenue</span>
        </button>
      </div>
    </div>
  );

  return (
    <div style={{maxWidth:'450px', margin:'0 auto', minHeight:'100vh', paddingBottom:'120px', position:'relative'}}>
      <GlobalStyles />
      
      <header style={{padding:'24px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(243, 244, 246, 0.85)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)', position:'sticky', top:0, zIndex:50}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <div style={{backgroundColor:'#000', width:'38px', height:'38px', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <Navigation style={{color:'#fff', width:'20px', height:'20px'}} />
          </div>
          <span style={{fontWeight:'900', fontSize:'22px', letterSpacing:'-1px'}}>MOTO LOG</span>
        </div>
        <div style={{width:'42px', height:'42px', borderRadius:'14px', backgroundColor:'#fff', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #e5e7eb', boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
          <User style={{color:'#6b7280', width:'22px', height:'22px'}} />
        </div>
      </header>

      <main>
        {activeTab === 'home' && <HomeView />}
        {activeTab === 'insurance' && <InsuranceView />}
        {activeTab === 'revenue' && <RevenueView />}
        {activeTab === 'service' && <div style={{padding:'60px 20px', textAlign:'center', opacity:0.3, fontWeight:'900', fontSize:'14px', letterSpacing:'2px'}}>SERVICE LOGS</div>}
        {activeTab === 'tyres' && <div style={{padding:'60px 20px', textAlign:'center', opacity:0.3, fontWeight:'900', fontSize:'14px', letterSpacing:'2px'}}>TYRE RECORDS</div>}
      </main>

      <nav className="nav-fixed">
        <button onClick={() => setActiveTab('home')} style={{border:'none', background:'none', color: activeTab === 'home' ? '#000' : '#9ca3af', padding:'10px', cursor:'pointer'}}>
          <Navigation style={{width:'26px', height:'26px'}} />
        </button>
        <button onClick={() => setActiveTab('service')} style={{border:'none', background:'none', color: activeTab === 'service' ? '#000' : '#9ca3af', padding:'10px', cursor:'pointer'}}>
          <Wrench style={{width:'26px', height:'26px'}} />
        </button>
        <div style={{marginTop:'-44px'}}>
          <button style={{width:'64px', height:'64px', borderRadius:'22px', backgroundColor:'#000', border:'5px solid #F3F4F6', color:'#fff', boxShadow:'0 15px 30px rgba(0,0,0,0.25)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <Plus style={{width:'32px', height:'32px'}} />
          </button>
        </div>
        <button onClick={() => setActiveTab('tyres')} style={{border:'none', background:'none', color: activeTab === 'tyres' ? '#000' : '#9ca3af', padding:'10px', cursor:'pointer'}}>
          <CircleDot style={{width:'26px', height:'26px'}} />
        </button>
        <button onClick={() => (activeTab === 'insurance' || activeTab === 'revenue') ? setActiveTab('home') : setActiveTab('insurance')} style={{border:'none', background:'none', color: (activeTab === 'insurance' || activeTab === 'revenue') ? '#000' : '#9ca3af', padding:'10px', cursor:'pointer'}}>
          <ShieldCheck style={{width:'26px', height:'26px'}} />
        </button>
      </nav>
    </div>
  );
}