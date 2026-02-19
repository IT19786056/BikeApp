import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, doc, setDoc, onSnapshot, collection, addDoc, deleteDoc
} from 'firebase/firestore';
import { 
  getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut
} from 'firebase/auth';
import { 
  ShieldCheck, Wrench, CircleDot, Plus, Navigation, 
  User, Sparkles, Loader2, AlertCircle, Clock, Trash2, LogOut
} from 'lucide-react';

// --- STYLING ---
const GlobalStyles = () => (
  <style>{`
    body { 
      margin: 0; padding: 0; background-color: #F3F4F6; 
      font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
      color: #111827; -webkit-font-smoothing: antialiased;
    }
    .insurance-container {
      width: 100%; max-width: 440px; margin: 0 auto; background-color: #FFEB3B;
      border-radius: 14px; border: 1px solid #c9b000; box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.15);
      overflow: hidden; aspect-ratio: 1.58 / 1; display: flex; flex-direction: column;
      color: #000; font-size: clamp(8.5px, 2.6vw, 11px); min-height: 250px;
    }
    .ins-header { background-color: #000; color: #fff; padding: 2% 3.5%; display: flex; align-items: center; gap: 3%; }
    .ins-logo-box { background-color: #fff; border-radius: 4px; padding: 2px; width: 13%; min-width: 44px; text-align: center; flex-shrink: 0; }
    .ins-body { padding: 3% 4%; flex: 1; display: flex; flex-direction: column; justify-content: space-between; position: relative; }
    .ins-grid { display: grid; grid-template-columns: 28% 1fr 18%; gap: 1.5% 3%; margin-top: 1%; }
    .ins-label { font-weight: bold; opacity: 0.8; text-transform: uppercase; font-size: 0.75em; white-space: nowrap; }
    .ins-value { font-weight: 800; text-transform: uppercase; font-size: 0.92em; letter-spacing: -0.1px; line-height: 1.1; }
    .revenue-circle {
      width: 100%; max-width: 330px; aspect-ratio: 1 / 1; border-radius: 50%;
      background-color: #E1D5E7; border: 12px solid #9271A3; margin: 0 auto;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 6%; text-align: center; box-shadow: 0 15px 30px -10px rgba(0, 0, 0, 0.2); color: #4A235A;
      position: relative; overflow: hidden;
    }
    .mobile-wrap { padding: 20px; width: 100%; box-sizing: border-box; }
    .nav-fixed { 
      position: fixed; bottom: 24px; left: 24px; right: 24px; 
      background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border-radius: 36px; height: 72px; display: flex; justify-content: space-around; align-items: center;
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.15); z-index: 100; border: 1px solid rgba(0,0,0,0.05);
    }
    .modal-scroll { max-height: 75vh; overflow-y: auto; padding-right: 8px; }
    @keyframes pulse-gold { 0% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(234, 179, 8, 0); } 100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0); } }
    .ai-pulse { animation: pulse-gold 2s infinite; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @media (max-width: 380px) { .ins-grid { grid-template-columns: 35% 1fr; } .ins-hide-small { display: none; } }
  `}</style>
);

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyA6qm-Hfh9tlog8SW_eAZvK8wzjNGQHvk4",
  authDomain: "mybikemanager-219f1.firebaseapp.com",
  projectId: "mybikemanager-219f1",
  storageBucket: "mybikemanager-219f1.firebasestorage.app",
  messagingSenderId: "159493239178",
  appId: "1:159493239178:web:f6ee957157508041121873"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const appId = typeof __app_id !== 'undefined' ? __app_id : 'bike-manager-v2';
const geminiApiKey = ""; 
setPersistence(auth, browserLocalPersistence);

const TYRE_BRANDS = {
  Michelin: { color: '#27509B', logo: 'M' }, Dunlop: { color: '#FCD116', logo: 'D' },
  Pirelli: { color: '#D52B1E', logo: 'P' }, MRF: { color: '#ED1C24', logo: 'MRF' },
  CEAT: { color: '#003399', logo: 'C' }, Other: { color: '#6b7280', logo: 'T' }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('home');
  const [docTab, setDocTab] = useState('insurance');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('service'); 

  const [formData, setFormData] = useState({ mileage: "", brand: "Michelin", details: "" });
  const [profileData, setProfileData] = useState({ bike: {}, insurance: {}, revenue: {} });
  
  const [bikeData, setBikeData] = useState({ currentMileage: 0, makeModel: "", vehicleNo: "" });
  const [insurance, setInsurance] = useState({});
  const [revenue, setRevenue] = useState({});
  const [services, setServices] = useState([]);
  const [tyres, setTyres] = useState([]);
  
  const [aiInsight, setAiInsight] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // AUTHENTICATION LISTENER
  // AUTHENTICATION LISTENER
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        console.log("Successfully logged in as:", currentUser.email);
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // DATA FETCHING (Only runs when a real user is logged in)
  useEffect(() => {
    if (!user) return;
    
    console.log("Logged in as:", user.email);
    const base = ['artifacts', appId, 'users', user.uid];
    
    const unsubBike = onSnapshot(doc(db, ...base, 'settings', 'bike'), (s) => s.exists() && setBikeData(s.data()));
    const unsubIns = onSnapshot(doc(db, ...base, 'documents', 'insurance'), (s) => s.exists() && setInsurance(s.data()));
    const unsubRev = onSnapshot(doc(db, ...base, 'documents', 'revenue'), (s) => s.exists() && setRevenue(s.data()));
    const unsubServices = onSnapshot(collection(db, ...base, 'services'), (s) => {
      setServices(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.mileage - a.mileage));
    });
    const unsubTyres = onSnapshot(collection(db, ...base, 'tyres'), (s) => {
      setTyres(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
    return () => { unsubBike(); unsubIns(); unsubRev(); unsubServices(); unsubTyres(); };
  }, [user]);

  // LOGIN / LOGOUT HANDLERS
 const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login Failed:", error.message);
      alert("Login failed. Please try again.");
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setBikeData({ currentMileage: 0, makeModel: "", vehicleNo: "" });
    setInsurance({});
    setRevenue({});
    setServices([]);
    setTyres([]);
  };

  // Logic Constants
  const lastServiceMileage = services.length > 0 ? services[0].mileage : 0;
  const milesSinceService = bikeData.currentMileage - lastServiceMileage;
  const serviceAlert = services.length > 0 && milesSinceService >= 3500;

  const parseDateStr = (dateStr) => {
    if (!dateStr) return new Date(0);
    if (dateStr.includes('-') && dateStr.split('-')[0].length !== 4) {
      const months = { JAN:0, FEB:1, MAR:2, APR:3, MAY:4, JUN:5, JUL:6, AUG:7, SEP:8, OCT:9, NOV:10, DEC:11 };
      const [d, m, y] = dateStr.split('-');
      return new Date(y, months[m.toUpperCase()], d);
    }
    return new Date(dateStr);
  };

  const isExpired = (dateStr) => dateStr ? new Date() > parseDateStr(dateStr) : false;
  const expiringSoon = (dateStr) => {
    if (!dateStr) return false;
    const diff = parseDateStr(dateStr) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 && days < 30;
  };

  const handleSave = async () => {
    if (!user) return;
    const path = ['artifacts', appId, 'users', user.uid];
    try {
      if (modalType === 'service' && formData.mileage) {
        const m = parseInt(formData.mileage);
        await addDoc(collection(db, ...path, 'services'), { mileage: m, date: new Date().toISOString().split('T')[0], details: formData.details || "Full Service" });
        if (m > bikeData.currentMileage) await setDoc(doc(db, ...path, 'settings', 'bike'), { ...bikeData, currentMileage: m }, { merge: true });
      } else if (modalType === 'tyre' && formData.mileage) {
        await addDoc(collection(db, ...path, 'tyres'), { brand: formData.brand, mileage: parseInt(formData.mileage), date: new Date().toISOString().split('T')[0] });
      } else if (modalType === 'profile') {
        await setDoc(doc(db, ...path, 'settings', 'bike'), profileData.bike, { merge: true });
        await setDoc(doc(db, ...path, 'documents', 'insurance'), profileData.insurance, { merge: true });
        await setDoc(doc(db, ...path, 'documents', 'revenue'), profileData.revenue, { merge: true });
      }
      setIsModalOpen(false);
      setFormData({ mileage: "", brand: "Michelin", details: "" });
    } catch (e) { console.error(e); }
  };

  const openProfileModal = () => {
    setProfileData({ bike: { ...bikeData }, insurance: { ...insurance }, revenue: { ...revenue } });
    setModalType('profile');
    setIsModalOpen(true);
  };

  const callAI = async () => {
    setIsAiLoading(true);
    try {
      const prompt = `Bike: ${bikeData.makeModel}. Mileage: ${bikeData.currentMileage}km. Last service: ${lastServiceMileage}km. Insurance Expiry: ${insurance.periodEnd}. Revenue Expiry: ${revenue.validTo}. Give 3 quick tips.`;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const result = await response.json();
      setAiInsight(result.candidates?.[0]?.content?.parts?.[0]?.text);
    } catch (e) { setAiInsight("Keep track of your oil levels. Service recommended at 3500km."); }
    finally { setIsAiLoading(false); }
  };

  // --- LOGIN SCREEN ---
  if (authLoading) return <div style={{display:'flex', height:'100vh', alignItems:'center', justifyContent:'center'}}><Loader2 className="animate-spin" size={32}/></div>;
  
  if (!user) return (
    <div style={{maxWidth:'450px', margin:'0 auto', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px'}}>
      <GlobalStyles />
      <div style={{backgroundColor:'#000', width:'64px', height:'64px', borderRadius:'20px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'24px', boxShadow:'0 20px 40px -10px rgba(0,0,0,0.3)'}}><Navigation style={{color:'#fff', width:'32px', height:'32px'}} /></div>
      <h1 style={{fontSize:'32px', fontWeight:'900', letterSpacing:'-1px', marginBottom:'8px', textAlign:'center'}}>MOTO LOG</h1>
      <p style={{color:'#6b7280', textAlign:'center', marginBottom:'40px', fontWeight:'bold'}}>Manage your bike's service history, documents, and health in one place.</p>
      
      <button onClick={handleGoogleLogin} style={{background:'#fff', border:'1px solid #e5e7eb', padding:'16px 24px', borderRadius:'16px', display:'flex', alignItems:'center', gap:'12px', width:'100%', justifyContent:'center', fontSize:'16px', fontWeight:'bold', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.05)', cursor:'pointer'}}>
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        Continue with Google
      </button>
    </div>
  );

  // --- MAIN APP VIEWS ---
  const HomeView = () => (
    <div className="mobile-wrap space-y-6">
      <div style={{backgroundColor:'#111827', borderRadius:'28px', padding:'28px', color:'#fff', position:'relative', overflow:'hidden', boxShadow:'0 20px 40px -10px rgba(0,0,0,0.3)'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:'32px'}}>
          <div>
            <h1 style={{fontSize:'26px', fontWeight:'900', margin:0}}>{bikeData.makeModel || "Setup Bike"}</h1>
            <p style={{color:'#9ca3af', fontWeight:'bold', fontSize:'14px'}}>{bikeData.vehicleNo || "N/A"}</p>
          </div>
          <div style={{background:'rgba(255,255,255,0.1)', padding:'12px', borderRadius:'16px'}}><Navigation size={22}/></div>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
          <div style={{background:'rgba(255,255,255,0.06)', padding:'18px', borderRadius:'20px'}}>
            <div style={{fontSize:'10px', color:'#9ca3af', fontWeight:'bold', textTransform:'uppercase'}}>Odometer</div>
            <div style={{fontSize:'20px', fontWeight:'900', marginTop:'4px'}}>{bikeData.currentMileage} <span style={{fontSize:'12px', fontWeight:'normal', opacity:0.5}}>km</span></div>
          </div>
          <div style={{background:'rgba(255,255,255,0.06)', padding:'18px', borderRadius:'20px'}}>
            <div style={{fontSize:'10px', color:'#9ca3af', fontWeight:'bold', textTransform:'uppercase'}}>Status</div>
            <div style={{fontSize:'20px', fontWeight:'900', color: serviceAlert ? '#f87171' : '#4ade80', marginTop:'4px'}}>{serviceAlert ? 'SERVICE' : 'GOOD'}</div>
          </div>
        </div>
      </div>

      {(serviceAlert || isExpired(insurance.periodEnd) || isExpired(revenue.validTo) || expiringSoon(insurance.periodEnd) || expiringSoon(revenue.validTo)) && (
        <div className="space-y-3">
          {serviceAlert && (
            <div style={{backgroundColor:'#fef2f2', border:'1px solid #fecaca', padding:'16px', borderRadius:'20px', display:'flex', gap:'12px'}}>
              <AlertCircle color="#dc2626" />
              <div>
                <p style={{fontSize:'13px', fontWeight:'bold', color:'#991b1b'}}>Service Overdue</p>
                <p style={{fontSize:'11px', color:'#dc2626'}}>{milesSinceService}km since last maintenance. Change oil now.</p>
              </div>
            </div>
          )}
          {(isExpired(insurance.periodEnd) || isExpired(revenue.validTo)) && (
            <div style={{backgroundColor:'#fffbeb', border:'1px solid #fef3c7', padding:'16px', borderRadius:'20px', display:'flex', gap:'12px'}}>
              <ShieldCheck color="#d97706" />
              <div>
                <p style={{fontSize:'13px', fontWeight:'bold', color:'#92400e'}}>Renewal Required</p>
                <p style={{fontSize:'11px', color:'#d97706'}}>One of your documents has expired. Check Docs section.</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{background: '#fff', borderRadius: '28px', padding: '24px', border: '1px solid #e5e7eb'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
            <Sparkles size={18} color="#ca8a04" />
            <h3 style={{fontWeight:'900', fontSize:'14px'}}>AI Mechanic Scan</h3>
          </div>
          <button onClick={callAI} className="ai-pulse" style={{background:'#000', color:'#fff', border:'none', padding:'6px 12px', borderRadius:'10px', fontSize:'10px', fontWeight:'bold', cursor:'pointer'}}>Analyze ✨</button>
        </div>
        {isAiLoading && <Loader2 className="animate-spin mt-4" size={16}/>}
        {aiInsight && <p style={{fontSize:'13px', marginTop:'12px', color:'#4b5563', lineHeight:1.6}}>{aiInsight}</p>}
      </div>
    </div>
  );

  const DocsView = () => {
    const expired = isExpired(docTab === 'insurance' ? insurance.periodEnd : revenue.validTo);
    return (
      <div className="mobile-wrap space-y-6">
        <div style={{display:'flex', backgroundColor:'#e5e7eb', padding:'4px', borderRadius:'16px'}}>
          <button onClick={() => setDocTab('insurance')} style={{flex:1, padding:'10px', borderRadius:'12px', border:'none', backgroundColor: docTab === 'insurance' ? '#fff' : 'transparent', fontWeight:'bold', fontSize:'12px'}}>Insurance</button>
          <button onClick={() => setDocTab('revenue')} style={{flex:1, padding:'10px', borderRadius:'12px', border:'none', backgroundColor: docTab === 'revenue' ? '#fff' : 'transparent', fontWeight:'bold', fontSize:'12px'}}>Revenue</button>
        </div>

        <div style={{textAlign:'center', padding:'8px 20px', borderRadius:'14px', backgroundColor: expired ? '#fee2e2' : '#dcfce7', color: expired ? '#dc2626' : '#16a34a', fontWeight:'900', fontSize:'12px', width:'fit-content', margin:'0 auto'}}>
          {expired ? 'EXPIRED' : 'VALID'}
        </div>

        {docTab === 'insurance' ? (
          <div className="insurance-container">
            <div className="ins-header">
              <div className="ins-logo-box">
                <div style={{fontSize:'0.6em', fontWeight:'bold'}}>CEYLINCO</div>
                <div style={{backgroundColor:'#FFEB3B', fontWeight:'900', fontSize:'0.9em', padding:'0 2px'}}>VIP</div>
                <div style={{fontSize:'0.4em', color:'#000'}}>ON THE SPOT</div>
              </div>
              <div style={{flex:1, textAlign:'center'}}>
                <div style={{fontWeight:'bold', fontSize:'1em', textTransform:'uppercase'}}>Ceylinco General Insurance Ltd <span style={{fontSize:'0.7em', verticalAlign:'top'}}>{insurance.regCode}</span></div>
                <div style={{fontSize:'0.6em', opacity:0.8, fontStyle:'italic'}}>'Ceylinco House', 69, Janadhipathi Mawatha, Colombo 1.</div>
                <div style={{fontWeight:'bold', fontSize:'1.1em', marginTop:'4px', borderTop:'1px solid rgba(255,255,255,0.3)', paddingTop:'2px'}}>Certificate of Insurance</div>
              </div>
            </div>
            <div className="ins-body">
              <div style={{position:'absolute', top:4, right:12, fontStyle:'italic', opacity:0.6, fontSize:'0.85em', fontWeight:'bold'}}>{insurance.cardNo}</div>
              <div className="ins-grid">
                <div className="ins-label">Vehicle No</div><div className="ins-value" style={{fontSize:'1.2em'}}>{bikeData.vehicleNo}</div><div></div>
                <div className="ins-label">Make & Model</div><div className="ins-value">{bikeData.makeModel}</div><div className="ins-value" style={{textAlign:'right'}}>CD 125</div>
                <div className="ins-label">Policy No</div><div className="ins-value" style={{gridColumn:'span 2', color:'#0044cc'}}>{insurance.policyNo}</div>
                <div className="ins-label">Name</div><div className="ins-value" style={{gridColumn:'span 2'}}>{insurance.name}</div>
                <div className="ins-label">Address</div><div className="ins-value" style={{gridColumn:'span 2', fontSize:'0.8em', lineHeight:1.3}}>{insurance.address}</div>
                <div className="ins-label">Period</div><div className="ins-value" style={{gridColumn:'span 2'}}>{insurance.periodStart} <span style={{fontWeight:'normal', opacity:0.4}}>To</span> {insurance.periodEnd}</div>
                <div className="ins-label">Eng/Chassis</div><div className="ins-value" style={{gridColumn:'span 2', fontSize:'0.85em'}}>{insurance.engineNo} / {insurance.chassisNo}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="revenue-circle">
            <div style={{fontSize:'8px', fontWeight:'bold'}}>වාහන ආදායම් බලපත්‍රය</div>
            <div style={{fontSize:'5.5em', fontWeight:'900', lineHeight:1}}>{revenue.year}</div>
            <div style={{fontSize:'8px', fontWeight:'bold', letterSpacing:'1px'}}>VEHICLE REVENUE LICENCE</div>
            <div style={{width:'100%', borderTop:'1px solid rgba(0,0,0,0.15)', borderBottom:'1px solid rgba(0,0,0,0.15)', margin:'10px 0', padding:'10px 0'}}>
              <div style={{fontSize:'1.1em', fontWeight:'bold'}}>LICENCE NO: {revenue.licenceNo}</div>
              <div style={{fontSize:'0.9em', opacity:0.8, marginTop:'2px'}}>{revenue.class}</div>
            </div>
            <div style={{fontSize:'0.75em', opacity:0.6, fontWeight:'bold'}}>OWNER: {revenue.owner}</div>
            <div style={{fontSize:'1em', fontWeight:'bold', marginTop:'6px', color:'#dc2626'}}>VALID TO: {revenue.validTo}</div>
            <div style={{fontSize:'0.7em', marginTop:'4px'}}>VET NO: {revenue.vetNo}</div>
            <div style={{marginTop:'8px', backgroundColor:'rgba(255,255,255,0.5)', padding:'4px 12px', borderRadius:'10px', fontSize:'1.1em', fontWeight:'900'}}>RS. {revenue.fee}</div>
            <div style={{fontSize:'0.6em', opacity:0.4, marginTop:'10px'}}>Issued on {revenue.issueDate}</div>
          </div>
        )}
      </div>
    );
  };

  const TyresView = () => (
    <div className="mobile-wrap space-y-4">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h2 style={{fontSize:'22px', fontWeight:'900'}}>Tyre Tracker</h2>
        <button onClick={() => { setModalType('tyre'); setIsModalOpen(true); }} style={{backgroundColor:'#000', color:'#fff', border:'none', width:'42px', height:'42px', borderRadius:'14px'}}><Plus/></button>
      </div>
      <div className="space-y-4">
        {tyres.length === 0 && <p className="text-center py-20 opacity-30 font-bold">No records yet.</p>}
        {tyres.map(t => {
          const b = TYRE_BRANDS[t.brand] || TYRE_BRANDS.Other;
          return (
            <div key={t.id} style={{background:'#fff', borderRadius:'26px', padding:'22px', display:'flex', alignItems:'center', gap:'18px', border:'1px solid #e5e7eb', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.02)'}}>
              <div style={{backgroundColor: b.color, width:'54px', height:'54px', borderRadius:'18px', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:'900', fontSize:'18px'}}>{b.logo}</div>
              <div style={{flex:1}}>
                <h4 style={{fontWeight:'900', fontSize:'16px'}}>{t.brand}</h4>
                <p style={{fontSize:'12px', color:'#6b7280'}}>Fitted at {t.mileage} km • {t.date}</p>
              </div>
              <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tyres', t.id))} style={{border:'none', background:'none', color:'#f87171', cursor:'pointer'}}><Trash2 size={18}/></button>
            </div>
          );
        })}
      </div>
    </div>
  );

  const ServiceView = () => (
    <div className="mobile-wrap space-y-4">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h2 style={{fontSize:'22px', fontWeight:'900'}}>Service Logs</h2>
        <button onClick={() => { setModalType('service'); setIsModalOpen(true); }} style={{backgroundColor:'#000', color:'#fff', border:'none', width:'42px', height:'42px', borderRadius:'14px'}}><Plus/></button>
      </div>
      <div className="space-y-3">
        {services.map((s, idx) => (
          <div key={s.id} style={{background:'#fff', padding:'24px', borderRadius:'28px', border:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
              <div style={{background: idx === 0 ? '#dcfce7' : '#f3f4f6', padding:'12px', borderRadius:'16px'}}><Wrench size={22} color={idx === 0 ? '#16a34a' : '#9ca3af'}/></div>
              <div>
                <p style={{fontWeight:'900', fontSize:'17px', color:'#1f2937'}}>{s.mileage} km</p>
                <p style={{fontSize:'12px', color:'#9ca3af', fontWeight:'bold', textTransform:'uppercase'}}>{s.date}</p>
              </div>
            </div>
            {idx === 0 && <div style={{fontSize:'10px', background:'#dcfce7', color:'#16a34a', fontWeight:'900', padding:'4px 10px', borderRadius:'10px'}}>LATEST</div>}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{maxWidth:'450px', margin:'0 auto', minHeight:'100vh', paddingBottom:'130px', position:'relative'}}>
      <GlobalStyles />
      <header style={{padding:'24px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(243, 244, 246, 0.85)', WebkitBackdropFilter:'blur(12px)', backdropFilter:'blur(12px)', position:'sticky', top:0, zIndex:50}}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <div style={{backgroundColor:'#000', width:'40px', height:'40px', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center'}}><Navigation style={{color:'#fff', width:'20px'}} /></div>
          <span style={{fontWeight:'900', fontSize:'24px', letterSpacing:'-1px'}}>MOTO LOG</span>
        </div>
        <button onClick={openProfileModal} style={{width:'44px', height:'44px', borderRadius:'16px', border:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', background:'#fff', cursor:'pointer', overflow:'hidden', padding:0}}>
          {user.photoURL ? <img src={user.photoURL} alt="User" style={{width:'100%', height:'100%', objectFit:'cover'}}/> : <User size={22} color="#000"/>}
        </button>
      </header>

      <main className="animate-in fade-in duration-500">
        {activeTab === 'home' && <HomeView />}
        {activeTab === 'docs' && <DocsView />}
        {activeTab === 'service' && <ServiceView />}
        {activeTab === 'tyres' && <TyresView />}
      </main>

      <nav className="nav-fixed">
        <button onClick={() => setActiveTab('home')} style={{border:'none', background:'none', color: activeTab === 'home' ? '#000' : '#9ca3af', padding:'10px'}}><Clock size={26}/></button>
        <button onClick={() => setActiveTab('service')} style={{border:'none', background:'none', color: activeTab === 'service' ? '#000' : '#9ca3af', padding:'10px'}}><Wrench size={26}/></button>
        <div style={{marginTop:'-50px'}}><button onClick={() => { setModalType('service'); setIsModalOpen(true); }} style={{width:'68px', height:'68px', borderRadius:'24px', backgroundColor:'#000', border:'6px solid #F3F4F6', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 15px 30px rgba(0,0,0,0.2)', cursor:'pointer'}}><Plus size={36}/></button></div>
        <button onClick={() => setActiveTab('tyres')} style={{border:'none', background:'none', color: activeTab === 'tyres' ? '#000' : '#9ca3af', padding:'10px'}}><CircleDot size={26}/></button>
        <button onClick={() => setActiveTab('docs')} style={{border:'none', background:'none', color: activeTab === 'docs' ? '#000' : '#9ca3af', padding:'10px'}}><ShieldCheck size={26}/></button>
      </nav>

      {isModalOpen && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', backdropFilter:'blur(4px)'}}>
          <div style={{background:'#fff', width:'100%', maxWidth:'360px', borderRadius:'32px', padding:'32px', animation:'fadeIn 0.3s ease-out', display:'flex', flexDirection:'column'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
              <h3 style={{fontWeight:'900', fontSize:'20px', margin:0}}>
                {modalType === 'service' ? 'Log New Service' : modalType === 'tyre' ? 'Fit New Tyre' : 'Profile & Settings'}
              </h3>
              {modalType === 'profile' && (
                <button onClick={handleLogout} style={{background:'none', border:'none', color:'#ef4444', display:'flex', alignItems:'center', gap:'4px', fontWeight:'bold', fontSize:'12px', cursor:'pointer'}}><LogOut size={16}/> Sign Out</button>
              )}
            </div>
            
            <div className={`space-y-5 ${modalType === 'profile' ? 'modal-scroll' : ''}`}>
              {modalType === 'tyre' && (
                <div>
                  <label style={{fontSize:'12px', fontWeight:'bold', color:'#9ca3af', textTransform:'uppercase'}}>Brand</label>
                  <select value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} style={{width:'100%', padding:'16px', borderRadius:'16px', border:'1px solid #e5e7eb', marginTop:'6px', fontWeight:'bold'}}>
                    {Object.keys(TYRE_BRANDS).map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              )}
              {modalType !== 'profile' ? (
                <div>
                  <label style={{fontSize:'12px', fontWeight:'bold', color:'#9ca3af', textTransform:'uppercase'}}>Mileage (km)</label>
                  <input type="number" value={formData.mileage} onChange={e => setFormData({...formData, mileage: e.target.value})} style={{width:'100%', padding:'16px', borderRadius:'16px', border:'1px solid #e5e7eb', marginTop:'6px', fontWeight:'bold', fontSize:'16px'}} placeholder="e.g. 12500" />
                </div>
              ) : (
                <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
                  {/* Bike Section */}
                  <div style={{background:'#f9fafb', padding:'16px', borderRadius:'16px', border:'1px solid #e5e7eb'}}>
                    <h4 style={{fontSize:'12px', fontWeight:'900', marginBottom:'12px', color:'#374151'}}>BIKE DETAILS</h4>
                    <input type="text" placeholder="Make & Model (e.g. HONDA CD 125)" value={profileData.bike.makeModel || ''} onChange={e => setProfileData({...profileData, bike: {...profileData.bike, makeModel: e.target.value}})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #d1d5db', marginBottom:'8px'}} />
                    <input type="text" placeholder="Vehicle No. (e.g. 159-5839)" value={profileData.bike.vehicleNo || ''} onChange={e => setProfileData({...profileData, bike: {...profileData.bike, vehicleNo: e.target.value}})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #d1d5db', marginBottom:'8px'}} />
                    <input type="number" placeholder="Current Mileage" value={profileData.bike.currentMileage || ''} onChange={e => setProfileData({...profileData, bike: {...profileData.bike, currentMileage: parseInt(e.target.value) || 0}})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #d1d5db'}} />
                  </div>
                  
                  {/* Insurance Section */}
                  <div style={{background:'#f9fafb', padding:'16px', borderRadius:'16px', border:'1px solid #e5e7eb'}}>
                    <h4 style={{fontSize:'12px', fontWeight:'900', marginBottom:'12px', color:'#374151'}}>INSURANCE</h4>
                    <input type="text" placeholder="Policy No" value={profileData.insurance.policyNo || ''} onChange={e => setProfileData({...profileData, insurance: {...profileData.insurance, policyNo: e.target.value}})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #d1d5db', marginBottom:'8px'}} />
                    <input type="text" placeholder="Card No" value={profileData.insurance.cardNo || ''} onChange={e => setProfileData({...profileData, insurance: {...profileData.insurance, cardNo: e.target.value}})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #d1d5db', marginBottom:'8px'}} />
                    <input type="text" placeholder="Owner Name" value={profileData.insurance.name || ''} onChange={e => setProfileData({...profileData, insurance: {...profileData.insurance, name: e.target.value}})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #d1d5db', marginBottom:'8px'}} />
                    <input type="text" placeholder="Address" value={profileData.insurance.address || ''} onChange={e => setProfileData({...profileData, insurance: {...profileData.insurance, address: e.target.value}})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #d1d5db', marginBottom:'8px'}} />
                    <input type="text" placeholder="Engine No" value={profileData.insurance.engineNo || ''} onChange={e => setProfileData({...profileData, insurance: {...profileData.insurance, engineNo: e.target.value}})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #d1d5db', marginBottom:'8px'}} />
                    <input type="text" placeholder="Chassis No" value={profileData.insurance.chassisNo || ''} onChange={e => setProfileData({...profileData, insurance: {...profileData.insurance, chassisNo: e.target.value}})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #d1d5db', marginBottom:'8px'}} />
                    <input type="text" placeholder="Reg Code (e.g. PB5184)" value={profileData.insurance.regCode || ''} onChange={e => setProfileData({...profileData, insurance: {...profileData.insurance, regCode: e.target.value}})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #d1d5db', marginBottom:'8px'}} />
                    <label style={{fontSize:'10px', fontWeight:'bold', display:'block', marginBottom:'4px'}}>Start Date</label>
                    <input type="date" placeholder="e.g. 24-JAN-2026" value={profileData.insurance.periodStart || ''} onChange={e => setProfileData({...profileData, insurance: {...profileData.insurance, periodStart: e.target.value}})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #d1d5db', marginBottom:'8px'}} />
                    <label style={{fontSize:'10px', fontWeight:'bold', display:'block', marginBottom:'4px'}}>Expiry Date</label>
                    <input type="date" placeholder="e.g. 23-JAN-2027" value={profileData.insurance.periodEnd || ''} onChange={e => setProfileData({...profileData, insurance: {...profileData.insurance, periodEnd: e.target.value}})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #d1d5db'}} />
                  </div>

                  {/* Revenue Section */}
                  <div style={{background:'#f9fafb', padding:'16px', borderRadius:'16px', border:'1px solid #e5e7eb'}}>
                    <h4 style={{fontSize:'12px', fontWeight:'900', marginBottom:'12px', color:'#374151'}}>REVENUE LICENSE</h4>
                    <input type="text" placeholder="Year (e.g. 2014-10)" value={profileData.revenue.year || ''} onChange={e => setProfileData({...profileData, revenue: {...profileData.revenue, year: e.target.value}})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #d1d5db', marginBottom:'8px'}} />
                    <input type="text" placeholder="Licence No" value={profileData.revenue.licenceNo || ''} onChange={e => setProfileData({...profileData, revenue: {...profileData.revenue, licenceNo: e.target.value}})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #d1d5db', marginBottom:'8px'}} />
                    <input type="text" placeholder="Class (e.g. MOTOR CYCLE...)" value={profileData.revenue.class || ''} onChange={e => setProfileData({...profileData, revenue: {...profileData.revenue, class: e.target.value}})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #d1d5db', marginBottom:'8px'}} />
                    <input type="text" placeholder="Owner" value={profileData.revenue.owner || ''} onChange={e => setProfileData({...profileData, revenue: {...profileData.revenue, owner: e.target.value}})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #d1d5db', marginBottom:'8px'}} />
                    <input type="text" placeholder="Vet No (e.g. L4625577)" value={profileData.revenue.vetNo || ''} onChange={e => setProfileData({...profileData, revenue: {...profileData.revenue, vetNo: e.target.value}})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #d1d5db', marginBottom:'8px'}} />
                    <input type="text" placeholder="Fee Total (e.g. 9,925.00)" value={profileData.revenue.fee || ''} onChange={e => setProfileData({...profileData, revenue: {...profileData.revenue, fee: e.target.value}})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #d1d5db', marginBottom:'8px'}} />
                    <input type="text" placeholder="Fee Breakdown" value={profileData.revenue.feeBreakdown || ''} onChange={e => setProfileData({...profileData, revenue: {...profileData.revenue, feeBreakdown: e.target.value}})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #d1d5db', marginBottom:'8px'}} />
                    <label style={{fontSize:'10px', fontWeight:'bold', display:'block', marginBottom:'4px'}}>Valid From</label>
                    <input type="date" placeholder="YYYY-MM-DD" value={profileData.revenue.validFrom || ''} onChange={e => setProfileData({...profileData, revenue: {...profileData.revenue, validFrom: e.target.value}})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #d1d5db', marginBottom:'8px'}} />
                    <label style={{fontSize:'10px', fontWeight:'bold', display:'block', marginBottom:'4px'}}>Valid To (Expiry)</label>
                    <input type="date" placeholder="YYYY-MM-DD" value={profileData.revenue.validTo || ''} onChange={e => setProfileData({...profileData, revenue: {...profileData.revenue, validTo: e.target.value}})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #d1d5db', marginBottom:'8px'}} />
                    <label style={{fontSize:'10px', fontWeight:'bold', display:'block', marginBottom:'4px'}}>Issue Date</label>
                    <input type="date" placeholder="YYYY-MM-DD" value={profileData.revenue.issueDate || ''} onChange={e => setProfileData({...profileData, revenue: {...profileData.revenue, issueDate: e.target.value}})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #d1d5db'}} />
                  </div>
                </div>
              )}
              
              <div style={{display:'flex', gap:'12px', marginTop:'30px', paddingTop:'10px'}}>
                <button onClick={() => setIsModalOpen(false)} style={{flex:1, padding:'16px', borderRadius:'18px', border:'none', background:'#f3f4f6', fontWeight:'bold', color:'#6b7280', cursor:'pointer'}}>Cancel</button>
                <button onClick={handleSave} style={{flex:2, padding:'16px', borderRadius:'18px', border:'none', background:'#000', color:'#fff', fontWeight:'bold', cursor:'pointer'}}>{modalType === 'profile' ? 'Save Profile' : 'Save Record'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}