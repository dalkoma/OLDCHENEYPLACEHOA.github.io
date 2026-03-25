import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";

const BIRDS_PER_ROUND = 25;

// ── Theme system ──
const DARK = {
  bg:"#0f0c08",bgGrad:"radial-gradient(ellipse at 50% 0%, #2a1a08 0%, #0f0c08 70%)",
  card:"rgba(20,14,4,0.8)",cardActive:"rgba(30,20,5,0.95)",cardInactive:"rgba(15,10,3,0.7)",
  border:"#2a1a08",borderActive:"#d4830a",
  text:"#e8d5a0",textMuted:"#6a5020",textDim:"#4a3010",textDimmer:"#3a2a10",
  accent:"#f5c060",accentBold:"#f5a020",
  hit:"#f5a020",hitBorder:"#f5c060",miss:"#e05040",missBorder:"#c03030",missCircle:"#902020",
  good:"#4adf80",warn:"#f5c060",bad:"#e05040",
  inputBg:"rgba(255,255,255,0.04)",scoreBg:"rgba(10,7,2,0.5)",
  stationBg:"rgba(255,255,255,0.02)",stationActive:"rgba(200,100,0,0.12)",
  hitBtn:"linear-gradient(160deg,#b86000,#7a3800)",hitBtnBorder:"#e08820",
  missBtn:"linear-gradient(160deg,#901818,#5a0808)",missBtnBorder:"#c02020",
  disabledBg:"#0a0702",disabledBorder:"#1a1005",disabledText:"#2a1a08",
  smallBtnBg:"rgba(255,255,255,0.04)",smallBtnBorder:"#2a1a08",smallBtnText:"#8a7040",
  highlightBg:"rgba(60,120,40,0.25)",highlightBorder:"#4a9030",highlightText:"#80d060",
  dotEmpty:"#1e1408",dotEmptyBorder:"#2a1a08",
  flashHit:"#f5a020",flashMiss:"#e05040",
  flashHitShadow:"0 0 30px rgba(245,160,32,0.6)",flashMissShadow:"0 0 30px rgba(224,80,64,0.6)",
  leaderFirst:"rgba(200,100,0,0.1)",leaderRest:"rgba(20,14,4,0.6)",
  toggleOn:"rgba(200,100,0,0.4)",toggleOff:"rgba(255,255,255,0.05)",
  toggleDot:"#f5a020",toggleDotOff:"#3a2a10",
  streak:"#ff9020",streakHot:"#ff6020",
  tabActive:"rgba(200,100,0,0.2)",tabInactive:"rgba(255,255,255,0.03)",tabText:"#4a3010",
  saveBg:"rgba(60,120,40,0.2)",saveBorder:"#4a9030",saveText:"#80d060",
};
const SUN = {
  bg:"#ffffff",bgGrad:"none",
  card:"#f0f0f0",cardActive:"#ffffff",cardInactive:"#f5f5f5",
  border:"#bbb",borderActive:"#cc6600",
  text:"#000000",textMuted:"#555",textDim:"#777",textDimmer:"#999",
  accent:"#cc6600",accentBold:"#cc4400",
  hit:"#006600",hitBorder:"#008800",miss:"#cc0000",missBorder:"#aa0000",missCircle:"#cc0000",
  good:"#006600",warn:"#cc6600",bad:"#cc0000",
  inputBg:"#ffffff",scoreBg:"#e8e8e8",
  stationBg:"#f0f0f0",stationActive:"#fff3e0",
  hitBtn:"linear-gradient(160deg,#008800,#006600)",hitBtnBorder:"#00aa00",
  missBtn:"linear-gradient(160deg,#cc0000,#990000)",missBtnBorder:"#ee0000",
  disabledBg:"#e0e0e0",disabledBorder:"#ccc",disabledText:"#aaa",
  smallBtnBg:"#e8e8e8",smallBtnBorder:"#bbb",smallBtnText:"#333",
  highlightBg:"#d4edda",highlightBorder:"#28a745",highlightText:"#155724",
  dotEmpty:"#ddd",dotEmptyBorder:"#bbb",
  flashHit:"#006600",flashMiss:"#cc0000",
  flashHitShadow:"0 0 40px rgba(0,102,0,0.5)",flashMissShadow:"0 0 40px rgba(204,0,0,0.5)",
  leaderFirst:"#fff3e0",leaderRest:"#f5f5f5",
  toggleOn:"#cc6600",toggleOff:"#ddd",toggleDot:"#ffffff",toggleDotOff:"#999",
  streak:"#cc4400",streakHot:"#ff0000",
  tabActive:"#cc6600",tabInactive:"#e8e8e8",tabText:"#555",
  saveBg:"#d4edda",saveBorder:"#28a745",saveText:"#155724",
};

const trophyLabel = (pct) => {
  if (pct === 100) return "\u{1F3C6} PERFECT";
  if (pct >= 92) return "\u{1F947} Expert";
  if (pct >= 80) return "\u{1F948} Sharp";
  if (pct >= 64) return "\u{1F949} Marksman";
  return "\u{1F3AF} Training";
};

const getStreak = (history) => {
  let s = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i] === "hit") s++; else break;
  }
  return s;
};

// ── localStorage-backed state ──
function useLS(key, defaultVal) {
  const [val, setVal] = useState(() => {
    try {
      const stored = localStorage.getItem("trap_" + key);
      return stored !== null ? JSON.parse(stored) : defaultVal;
    } catch { return defaultVal; }
  });
  useEffect(() => {
    try { localStorage.setItem("trap_" + key, JSON.stringify(val)); } catch {}
  }, [key, val]);
  return [val, setVal];
}

// ── Device & metadata helpers ──
function getDeviceInfo() {
  const ua = navigator.userAgent || "";
  let device = "Unknown";
  if (/iPhone/.test(ua)) device = "iPhone";
  else if (/iPad/.test(ua)) device = "iPad";
  else if (/Android/.test(ua)) device = "Android";
  else if (/Windows/.test(ua)) device = "Windows";
  else if (/Mac/.test(ua)) device = "Mac";
  else if (/Linux/.test(ua)) device = "Linux";
  return { device, userAgent: ua };
}

// ── Error tracking ──
const errorLog = [];
function trackError(type, message, extra = {}) {
  const entry = { type, message, ...extra, device: getDeviceInfo().device, ts: new Date().toISOString() };
  errorLog.push(entry);
  // Push to cloud (fire-and-forget)
  try {
    fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "errors:" + new Date().toISOString().slice(0,10), data: { entry, id: Date.now() }, append: true }),
    }).catch(() => {});
  } catch {}
}

// Global error handler — catches unhandled exceptions and promise rejections
if (typeof window !== "undefined" && !window.__trapErrorsSetup) {
  window.__trapErrorsSetup = true;
  window.addEventListener("error", (e) => {
    trackError("unhandled", e.message, { file: e.filename, line: e.lineno, col: e.colno });
  });
  window.addEventListener("unhandledrejection", (e) => {
    trackError("promise", String(e.reason), {});
  });
}

// Silent IP-based geolocation (no permission prompt)
async function getLocationSilent() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) { trackError("geo", `IP geolocation failed: ${res.status}`); return null; }
    const data = await res.json();
    if (data.city) {
      return {
        lat: data.latitude, lng: data.longitude,
        name: [data.city, data.region].filter(Boolean).join(", "),
      };
    }
    return null;
  } catch (e) { trackError("geo", e.message); return null; }
}

// ── Responsive screen size hook ──
function useScreenSize() {
  const calc = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const landscape = w > h;
    let sz = "phone"; // default
    if (w < 320) sz = "tiny";      // Z Flip cover
    else if (w < 400) sz = "phone"; // iPhone SE, small Android, Z Fold closed
    else if (w < 600) sz = "phone-lg"; // iPhone, Pixel, Galaxy S
    else if (w < 820) sz = "tablet-sm"; // Z Fold open, iPad mini
    else if (w < 1100) sz = "tablet";   // iPad Air/Pro portrait
    else if (w < 1500) sz = "laptop";   // iPad landscape, laptops
    else if (w < 2000) sz = "desktop";  // Desktop
    else sz = "ultra";                   // Ultra-wide, TV
    return { w, h, landscape, sz };
  };
  const [info, setInfo] = useState(calc);
  useEffect(() => {
    const onResize = () => setInfo(calc());
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", () => setTimeout(onResize, 100));
    return () => { window.removeEventListener("resize", onResize); window.removeEventListener("orientationchange", onResize); };
  }, []);
  return info;
}

// ── Cloud sync helpers ──
const genCode = () => {
  const arr = new Uint8Array(4);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(36).padStart(2, "0")).join("").slice(0, 6).toUpperCase();
};

async function cloudSave(key, data) {
  try {
    const res = await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, data }),
    });
    if (!res.ok) trackError("cloud-save", `Save failed: ${res.status}`, { key });
  } catch (e) { trackError("cloud-save", e.message, { key }); }
}

async function cloudLoad(key) {
  try {
    const res = await fetch("/api/state?key=" + encodeURIComponent(key));
    if (!res.ok) { trackError("cloud-load", `Load failed: ${res.status}`, { key }); return null; }
    const data = await res.json();
    return data;
  } catch (e) { trackError("cloud-load", e.message, { key }); return null; }
}

const freshShooter = (name, gun, choke) => ({
  name: name || "SHOOTER", gun: gun || "", choke: choke || "",
  hits: 0, misses: 0, history: [], rounds: [], roundNum: 1,
});

// ── Feedback hook ──
function useFeedback(vibOn, sndOn) {
  const audioCtx = useRef(null);
  const getCtx = () => {
    if (!audioCtx.current) {
      try { audioCtx.current = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}
    }
    return audioCtx.current;
  };
  const playTone = (freq, type, dur, gain) => {
    if (!sndOn) return;
    try {
      const ctx = getCtx(); if (!ctx) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = type; osc.frequency.setValueAtTime(freq, ctx.currentTime);
      g.gain.setValueAtTime(gain, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      osc.start(); osc.stop(ctx.currentTime + dur);
    } catch(e){}
  };
  return {
    feedbackHit: () => { if (vibOn && navigator.vibrate) navigator.vibrate(40); playTone(880,"sine",0.12,0.18); },
    feedbackMiss: () => { if (vibOn && navigator.vibrate) navigator.vibrate([30,20,30]); playTone(220,"triangle",0.18,0.14); },
  };
}

// ── Excel helpers ──
function exportEventExcel(eventData) {
  const { eventName, weather, notes, traps, squads, scores } = eventData;
  const rows = [];
  squads.forEach(sq => {
    traps.forEach(trapNum => {
      const key = `${sq.num}-${trapNum}`;
      const shooterStates = scores[key] || [];
      sq.shooters.forEach((info, si) => {
        const state = shooterStates[si];
        if (!state) {
          rows.push({
            Event: eventName, Squad: sq.num, Trap: trapNum, Weather: weather, Notes: notes,
            Shooter: info.name, Gun: info.gun, Choke: info.choke,
            Round:"", Hits:"", Misses:"", Pct:"", S1:"",S2:"",S3:"",S4:"",S5:"",
          });
          return;
        }
        const allRounds = [...state.rounds];
        if (state.hits + state.misses > 0) {
          const p = state.hits+state.misses>0?Math.round((state.hits/(state.hits+state.misses))*100):0;
          allRounds.push({ round: state.roundNum, hits: state.hits, misses: state.misses, pct: p });
        }
        if (allRounds.length === 0) {
          rows.push({
            Event: eventName, Squad: sq.num, Trap: trapNum, Weather: weather, Notes: notes,
            Shooter: info.name, Gun: info.gun, Choke: info.choke,
            Round:"", Hits:"", Misses:"", Pct:"", S1:"",S2:"",S3:"",S4:"",S5:"",
          });
        }
        allRounds.forEach(r => {
          rows.push({
            Event: eventName, Squad: sq.num, Trap: trapNum, Weather: weather, Notes: notes,
            Shooter: info.name, Gun: info.gun, Choke: info.choke,
            Round: r.round, Hits: r.hits, Misses: r.misses, Pct: r.pct,
            S1:"",S2:"",S3:"",S4:"",S5:"",
          });
        });
      });
    });
  });
  if (rows.length === 0) return;
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [{wch:20},{wch:6},{wch:5},{wch:14},{wch:16},{wch:18},{wch:16},{wch:12},{wch:6},{wch:5},{wch:6},{wch:5},{wch:4},{wch:4},{wch:4},{wch:4},{wch:4}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Scores");
  const date = new Date().toISOString().slice(0,10);
  XLSX.writeFile(wb, `trap-event-${date}.xlsx`);
}

function importExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);
        if (!rows.length) { reject("Empty spreadsheet"); return; }
        const first = rows[0];
        const eventName = (first.Event || "").toString();
        const weather = (first.Weather || "").toString();
        const notes = (first.Notes || "").toString();
        // Collect unique traps and squads
        const trapSet = new Set();
        const squadMap = {}; // squadNum -> { num, shooterMap }
        const scoreData = {}; // "squadNum-trapNum" -> shooterName -> rounds[]
        rows.forEach(r => {
          const trapNum = parseInt(r.Trap) || 1;
          const squadNum = parseInt(r.Squad) || 1;
          const name = (r.Shooter || "").toString().toUpperCase().trim();
          if (!name) return;
          trapSet.add(trapNum);
          if (!squadMap[squadNum]) squadMap[squadNum] = { num: squadNum, shooterMap: {} };
          if (!squadMap[squadNum].shooterMap[name]) {
            squadMap[squadNum].shooterMap[name] = {
              name, gun: (r.Gun||"").toString().toUpperCase(), choke: (r.Choke||"").toString().toUpperCase(),
            };
          }
          const key = `${squadNum}-${trapNum}`;
          if (!scoreData[key]) scoreData[key] = {};
          if (!scoreData[key][name]) scoreData[key][name] = [];
          if (r.Round !== undefined && r.Round !== "") {
            scoreData[key][name].push({
              round: parseInt(r.Round)||1, hits: parseInt(r.Hits)||0,
              misses: parseInt(r.Misses)||0, pct: parseInt(r.Pct)||0,
            });
          }
        });
        const traps = [...trapSet].sort((a,b)=>a-b);
        const squads = Object.values(squadMap).sort((a,b)=>a.num-b.num).map(sq => ({
          num: sq.num,
          shooters: Object.values(sq.shooterMap),
        }));
        // Build scores state
        const scores = {};
        Object.entries(scoreData).forEach(([key, shooterRounds]) => {
          const squadNum = parseInt(key.split("-")[0]);
          const sq = squads.find(s => s.num === squadNum);
          if (!sq) return;
          scores[key] = sq.shooters.map(info => {
            const rnds = shooterRounds[info.name] || [];
            return {
              name: info.name, gun: info.gun, choke: info.choke,
              hits: 0, misses: 0, history: [], rounds: rnds,
              roundNum: rnds.length + 1,
            };
          });
        });
        resolve({ eventName, weather, notes, traps, squads, scores });
      } catch (err) { reject("Could not read spreadsheet: " + err.message); }
    };
    reader.onerror = () => reject("File read error");
    reader.readAsArrayBuffer(file);
  });
}

function exportTemplate() {
  const rows = [
    { Event:"SPRING SHOOT 2026", Squad:1, Trap:1, Weather:"SUNNY 75F", Notes:"LEAGUE",
      Shooter:"JOHN DOE", Gun:"BERETTA 686", Choke:"MOD", Round:1, Hits:22, Misses:3, Pct:88, S1:5,S2:4,S3:5,S4:4,S5:4 },
    { Event:"SPRING SHOOT 2026", Squad:1, Trap:1, Weather:"SUNNY 75F", Notes:"LEAGUE",
      Shooter:"JANE SMITH", Gun:"BROWNING CITORI", Choke:"IC", Round:1, Hits:24, Misses:1, Pct:96, S1:5,S2:5,S3:5,S4:5,S5:4 },
    { Event:"SPRING SHOOT 2026", Squad:1, Trap:2, Weather:"SUNNY 75F", Notes:"LEAGUE",
      Shooter:"JOHN DOE", Gun:"BERETTA 686", Choke:"MOD", Round:1, Hits:20, Misses:5, Pct:80, S1:4,S2:4,S3:4,S4:4,S5:4 },
    { Event:"SPRING SHOOT 2026", Squad:1, Trap:2, Weather:"SUNNY 75F", Notes:"LEAGUE",
      Shooter:"JANE SMITH", Gun:"BROWNING CITORI", Choke:"IC", Round:1, Hits:23, Misses:2, Pct:92, S1:5,S2:5,S3:4,S4:5,S5:4 },
    { Event:"SPRING SHOOT 2026", Squad:2, Trap:1, Weather:"SUNNY 75F", Notes:"LEAGUE",
      Shooter:"BOB JONES", Gun:"REMINGTON 1100", Choke:"FULL", Round:1, Hits:19, Misses:6, Pct:76, S1:4,S2:3,S3:4,S4:4,S5:4 },
    { Event:"SPRING SHOOT 2026", Squad:2, Trap:1, Weather:"SUNNY 75F", Notes:"LEAGUE",
      Shooter:"SUE MILLER", Gun:"BENELLI M2", Choke:"MOD", Round:1, Hits:25, Misses:0, Pct:100, S1:5,S2:5,S3:5,S4:5,S5:5 },
  ];
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [{wch:20},{wch:6},{wch:5},{wch:14},{wch:16},{wch:18},{wch:16},{wch:12},{wch:6},{wch:5},{wch:6},{wch:5},{wch:4},{wch:4},{wch:4},{wch:4},{wch:4}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Scores");
  XLSX.writeFile(wb, "trap-event-template.xlsx");
}

// ── UI Components ──
function FlashLabel({ label, t }) {
  if (!label) return null;
  const isHit = label === "HIT";
  return (
    <div style={{
      position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
      fontSize:64,fontWeight:"900",letterSpacing:10,
      color:isHit?t.flashHit:t.flashMiss,
      textShadow:isHit?t.flashHitShadow:t.flashMissShadow,
      fontFamily:"'Courier New',Courier,monospace",
      pointerEvents:"none",zIndex:999,opacity:1,
      animation:"fadeFlash 0.65s ease-out forwards",
    }}>{label}</div>
  );
}

function StationBar({ history, t }) {
  return (
    <div style={{marginBottom:12}}>
      <div style={{fontSize:10,letterSpacing:3,color:t.textMuted,marginBottom:6,textAlign:"center",fontWeight:"bold"}}>STATIONS</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4}}>
        {[1,2,3,4,5].map(st=>{
          const shots=history.slice((st-1)*5,st*5);
          const stHits=shots.filter(s=>s==="hit").length;
          const isActive=Math.floor(history.length/5)+1===st&&history.length<25;
          const isDone=shots.length===5;
          return(
            <div key={st} style={{background:isActive?t.stationActive:t.stationBg,border:`2px solid ${isActive?t.borderActive:t.border}`,borderRadius:6,padding:"5px 2px",textAlign:"center",overflow:"hidden",minWidth:0}}>
              <div style={{fontSize:9,color:isActive?t.borderActive:t.textDimmer,letterSpacing:1,marginBottom:3,fontWeight:"bold"}}>{isActive?"\u25B6S":"S"}{st}</div>
              <div style={{display:"flex",gap:2,justifyContent:"center"}}>
                {[0,1,2,3,4].map(j=>{
                  const shot=shots[j];
                  return <div key={j} style={{width:8,height:8,borderRadius:"50%",background:shot==="hit"?t.hit:shot==="miss"?t.missCircle:t.dotEmpty,border:`1.5px solid ${shot==="hit"?t.hitBorder:shot==="miss"?t.missBorder:t.dotEmptyBorder}`}}/>;
                })}
              </div>
              {isDone&&<div style={{fontSize:10,fontWeight:"bold",color:stHits>=4?t.good:stHits>=3?t.warn:t.bad,marginTop:2}}>{stHits}/5</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ShooterCard({ shooter, onChange, onSave, active, onSelect, feedbackHit, feedbackMiss, setFlashLabel, t, sun }) {
  const { name, hits, misses, history, rounds, roundNum } = shooter;
  const total=hits+misses;
  const remaining=BIRDS_PER_ROUND-total;
  const pct=total>0?Math.round((hits/total)*100):0;
  const done=total>=BIRDS_PER_ROUND;
  const streak=getStreak(history);
  const allHits=rounds.reduce((a,r)=>a+r.hits,0)+hits;
  const allShots=rounds.reduce((a,r)=>a+r.hits+r.misses,0)+total;
  const allPct=allShots>0?Math.round((allHits/allShots)*100):0;
  const [editName,setEditName]=useState(false);

  const record=(type)=>{
    if(done)return;
    if(type==="hit"){feedbackHit();setFlashLabel("HIT");}
    else{feedbackMiss();setFlashLabel("MISS");}
    onChange({hits:type==="hit"?hits+1:hits,misses:type==="miss"?misses+1:misses,history:[...history,type]});
  };
  const undo=()=>{
    if(!history.length)return;
    const h=[...history];const last=h.pop();
    onChange({hits:last==="hit"?hits-1:hits,misses:last==="miss"?misses-1:misses,history:h});
  };

  const btnS=(enabled,type)=>({
    padding:"20px 0",background:!enabled?t.disabledBg:type==="hit"?t.hitBtn:t.missBtn,
    border:`3px solid ${!enabled?t.disabledBorder:type==="hit"?t.hitBtnBorder:t.missBtnBorder}`,
    borderRadius:10,color:!enabled?t.disabledText:"#fff",fontSize:18,fontWeight:"900",letterSpacing:4,
    cursor:!enabled?"not-allowed":"pointer",fontFamily:"'Courier New',Courier,monospace",
    boxShadow:enabled?"0 4px 16px rgba(0,0,0,0.2)":"none",transition:"all 0.15s",
  });
  const smBtn=(disabled,hl=false)=>({
    padding:"12px 0",background:disabled?t.disabledBg:hl?t.highlightBg:t.smallBtnBg,
    border:`2px solid ${disabled?t.disabledBorder:hl?t.highlightBorder:t.smallBtnBorder}`,
    borderRadius:6,color:disabled?t.disabledText:hl?t.highlightText:t.smallBtnText,
    fontSize:11,fontWeight:"bold",letterSpacing:2,cursor:disabled?"not-allowed":"pointer",
    fontFamily:"'Courier New',Courier,monospace",transition:"all 0.15s",
  });

  return(
    <div onClick={()=>!active&&onSelect()} style={{
      background:active?t.cardActive:t.cardInactive,
      border:`3px solid ${active?t.borderActive:t.border}`,
      borderRadius:10,padding:active?"14px":"12px 14px",marginBottom:12,
      cursor:active?"default":"pointer",transition:"all 0.2s",overflow:"hidden",boxSizing:"border-box",
      boxShadow:active?(sun?"0 2px 8px rgba(0,0,0,0.15)":"0 0 20px rgba(200,100,0,0.15)"):"none",
    }}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:active?12:0}}>
        {editName&&active
          ?<input autoFocus value={name} onChange={e=>onChange({name:e.target.value.toUpperCase()})}
            onBlur={()=>setEditName(false)} onKeyDown={e=>e.key==="Enter"&&setEditName(false)}
            style={{background:"transparent",border:"none",borderBottom:`3px solid ${t.borderActive}`,color:t.accent,fontSize:16,fontWeight:"900",letterSpacing:3,outline:"none",width:"55%",fontFamily:"inherit"}}/>
          :<div onClick={e=>{if(active){e.stopPropagation();setEditName(true);}}}
            style={{fontSize:15,fontWeight:"900",letterSpacing:3,color:active?t.accent:t.textMuted,cursor:active?"pointer":"default"}}>
            {name} {active&&"\u270E"}
          </div>
        }
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          {streak>=3&&active&&<span style={{fontSize:13,fontWeight:"bold",color:t.streak}}>{"\u{1F525}"}{streak}</span>}
          <span style={{fontSize:13,fontWeight:"bold",color:t.textMuted,letterSpacing:2}}>R{roundNum}</span>
          {!active&&<span style={{fontSize:14,fontWeight:"bold",color:total>0?(pct>=80?t.good:t.warn):t.textDimmer}}>{total>0?`${hits}/${total} (${pct}%)`:"\u2013"}</span>}
          {active&&done&&<span style={{fontSize:11,fontWeight:"bold",color:t.good,letterSpacing:2}}>{"\u25CF"} DONE</span>}
        </div>
      </div>
      {active&&<>
        {(shooter.gun||shooter.choke)&&
          <div style={{fontSize:12,fontWeight:"bold",color:t.textDim,letterSpacing:2,marginBottom:10,textAlign:"center"}}>
            {shooter.gun}{shooter.gun&&shooter.choke?"  \u00B7  ":""}{shooter.choke}
          </div>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:t.scoreBg,borderRadius:10,padding:"12px 10px",marginBottom:12,border:`2px solid ${t.border}`,boxSizing:"border-box"}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:44,fontWeight:"900",color:t.hit,lineHeight:1}}>{hits}</div>
            <div style={{fontSize:11,fontWeight:"bold",letterSpacing:3,color:t.textMuted}}>HITS</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:32,fontWeight:"900",color:pct>=80?t.good:pct>=60?t.warn:t.bad,lineHeight:1}}>{pct}%</div>
            <div style={{fontSize:11,fontWeight:"bold",color:t.textMuted,marginTop:2}}>{trophyLabel(pct)}</div>
            {streak>0&&<div style={{fontSize:12,fontWeight:"bold",color:streak>=5?t.streakHot:t.streak,marginTop:2}}>{"\u{1F525}"} {streak} streak</div>}
            <div style={{fontSize:11,fontWeight:"bold",color:t.textDim,marginTop:2}}>{remaining>0?`${remaining} left`:"DONE"}</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:44,fontWeight:"900",color:t.miss,lineHeight:1}}>{misses}</div>
            <div style={{fontSize:11,fontWeight:"bold",letterSpacing:3,color:t.textMuted}}>MISS</div>
          </div>
        </div>
        <StationBar history={history} t={t}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <button onClick={()=>record("hit")} disabled={done} style={btnS(!done,"hit")}>{"\u2713"} HIT</button>
          <button onClick={()=>record("miss")} disabled={done} style={btnS(!done,"miss")}>{"\u2715"} MISS</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          <button onClick={undo} disabled={!history.length} style={smBtn(!history.length)}>{"\u21A9"} UNDO</button>
          <button onClick={onSave} disabled={!total} style={smBtn(!total,total>0)}>{"\u2714"} SAVE RND</button>
          <button onClick={()=>onChange({hits:0,misses:0,history:[]})} style={smBtn(false)}>{"\u27F3"} RESET</button>
        </div>
        {rounds.length>0&&<div style={{marginTop:12,borderTop:`2px solid ${t.border}`,paddingTop:10}}>
          <div style={{fontSize:11,fontWeight:"bold",letterSpacing:3,color:t.textDim,marginBottom:6}}>SESSION LOG</div>
          {rounds.map(r=>(
            <div key={r.round} style={{display:"flex",justifyContent:"space-between",fontSize:13,fontWeight:"bold",padding:"4px 0",borderBottom:`1px solid ${t.border}`}}>
              <span style={{color:t.textMuted}}>RND {r.round}</span>
              <span style={{color:t.accentBold}}>{r.hits}/25</span>
              <span style={{color:r.pct>=80?t.good:t.warn}}>{r.pct}%</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:"900",paddingTop:6}}>
            <span style={{color:t.textMuted,letterSpacing:2}}>TOTAL</span>
            <span style={{color:t.accent}}>{allHits}/{allShots}</span>
            <span style={{color:allPct>=80?t.good:t.warn}}>{allPct}%</span>
          </div>
        </div>}
      </>}
    </div>
  );
}

function EventLeaderboard({ squads, scores, traps, t }) {
  // Aggregate all shooter data across all traps
  const shooterTotals = {};
  squads.forEach(sq => {
    sq.shooters.forEach((info, si) => {
      const uid = `${sq.num}-${info.name}`;
      if (!shooterTotals[uid]) {
        shooterTotals[uid] = { name: info.name, gun: info.gun, choke: info.choke, squad: sq.num, totalHits: 0, totalShots: 0, trapScores: {} };
      }
      traps.forEach(trapNum => {
        const key = `${sq.num}-${trapNum}`;
        const states = scores[key];
        if (!states || !states[si]) return;
        const s = states[si];
        const h = s.rounds.reduce((a,r)=>a+r.hits,0) + s.hits;
        const sh = s.rounds.reduce((a,r)=>a+r.hits+r.misses,0) + s.hits + s.misses;
        shooterTotals[uid].totalHits += h;
        shooterTotals[uid].totalShots += sh;
        if (sh > 0) shooterTotals[uid].trapScores[trapNum] = { hits: h, shots: sh, pct: Math.round((h/sh)*100) };
      });
    });
  });
  const ranked = Object.values(shooterTotals).sort((a,b) => b.totalHits - a.totalHits || (b.totalShots>0?b.totalHits/b.totalShots:0) - (a.totalShots>0?a.totalHits/a.totalShots:0));
  const medals = ["\u{1F947}","\u{1F948}","\u{1F949}"];
  return (
    <div>
      <div style={{fontSize:12,fontWeight:"bold",letterSpacing:4,color:t.textMuted,textAlign:"center",marginBottom:16}}>EVENT LEADERBOARD</div>
      {ranked.map((s,i) => {
        const pct = s.totalShots>0 ? Math.round((s.totalHits/s.totalShots)*100) : 0;
        return (
          <div key={i} style={{background:i===0?t.leaderFirst:t.leaderRest,border:`2px solid ${i===0?t.borderActive:t.border}`,borderRadius:8,padding:"14px 16px",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:i<3?24:14,minWidth:36,textAlign:"center",color:t.textMuted,fontWeight:"bold"}}>{medals[i]||`${i+1}.`}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:"900",color:i===0?t.accent:t.textMuted,letterSpacing:2}}>{s.name}</div>
                <div style={{fontSize:10,fontWeight:"bold",color:t.textDim,marginTop:2}}>SQ {s.squad}{s.gun?` \u00B7 ${s.gun}`:""}{s.choke?` \u00B7 ${s.choke}`:""}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:26,fontWeight:"900",color:t.accentBold}}>{s.totalHits}</div>
                <div style={{fontSize:11,fontWeight:"bold",color:t.textMuted}}>{s.totalShots>0?`${pct}%`:"\u2013"}</div>
              </div>
              <div style={{fontSize:11,fontWeight:"bold",color:t.textDim}}>{trophyLabel(pct)}</div>
            </div>
            {Object.keys(s.trapScores).length > 1 && (
              <div style={{display:"flex",gap:8,marginTop:8,marginLeft:48,flexWrap:"wrap"}}>
                {Object.entries(s.trapScores).map(([tn,ts])=>(
                  <span key={tn} style={{fontSize:10,fontWeight:"bold",color:t.textDim,background:t.stationBg,border:`1px solid ${t.border}`,borderRadius:4,padding:"2px 6px"}}>
                    T{tn}: {ts.hits}/{ts.shots} ({ts.pct}%)
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Toggle({label,value,onChange,icon,t}) {
  return(
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <span style={{fontSize:16}}>{icon}</span>
      <span style={{fontSize:11,fontWeight:"bold",letterSpacing:2,color:t.textMuted,flex:1}}>{label}</span>
      <div onClick={()=>onChange(!value)} style={{width:46,height:26,borderRadius:13,background:value?t.toggleOn:t.toggleOff,border:`2px solid ${value?t.borderActive:t.border}`,cursor:"pointer",position:"relative",transition:"all 0.2s"}}>
        <div style={{position:"absolute",top:3,left:value?22:3,width:18,height:18,borderRadius:"50%",background:value?t.toggleDot:t.toggleDotOff,transition:"all 0.2s"}}/>
      </div>
      <span style={{fontSize:11,fontWeight:"bold",color:value?t.accent:t.textDimmer,letterSpacing:1,minWidth:24}}>{value?"ON":"OFF"}</span>
    </div>
  );
}

function NumInput({label,value,onChange,min=1,max=99,t}) {
  return(
    <div style={{textAlign:"center"}}>
      <div style={{fontSize:11,fontWeight:"bold",letterSpacing:3,color:t.textMuted,marginBottom:6}}>{label}</div>
      <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
        <button onClick={()=>onChange(Math.max(min,value-1))} style={{width:36,height:36,background:t.smallBtnBg,border:`2px solid ${t.border}`,borderRadius:6,color:t.smallBtnText,fontSize:20,fontWeight:"bold",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center"}}>{"\u2212"}</button>
        <div style={{fontSize:32,fontWeight:"900",color:t.accent,width:52,textAlign:"center"}}>{value}</div>
        <button onClick={()=>onChange(Math.min(max,value+1))} style={{width:36,height:36,background:t.smallBtnBg,border:`2px solid ${t.border}`,borderRadius:6,color:t.smallBtnText,fontSize:20,fontWeight:"bold",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
      </div>
    </div>
  );
}

// ── Main App ──
export default function TrapCounter() {
  const scr = useScreenSize();
  const [booting, setBooting] = useState(() => !sessionStorage.getItem("trap_booted"));
  const [bootPhase, setBootPhase] = useState(0);
  // 0=scene, shooter silhouette + clay launches  1=gun fires, shot chases clay  2=clay hit, explosion  3=fade out

  useEffect(() => {
    if (!booting) return;
    const timers = [
      setTimeout(() => setBootPhase(1), 1200),   // clay in flight, gun fires
      setTimeout(() => setBootPhase(2), 2200),   // shot catches clay — BOOM
      setTimeout(() => setBootPhase(3), 3600),   // fade out
      setTimeout(() => { setBooting(false); sessionStorage.setItem("trap_booted","1"); }, 4200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [booting]);

  // Mode: "quick" = single trap/squad, "event" = multi-trap/multi-squad
  const [mode, setMode] = useLS("mode", "quick");
  const [screen, setScreen] = useLS("screen", "setup");
  const [sunMode, setSunMode] = useLS("sunMode", true);
  const [sunManual, setSunManual] = useLS("sunManual", false);
  const [vibOn, setVibOn] = useLS("vibOn", true);
  const [sndOn, setSndOn] = useLS("sndOn", true);
  const [flashLabel, setFlashLabelRaw] = useState(null);
  const [importMsg, setImportMsg] = useState(null);
  const flashTimer = useRef(null);
  const fileInput = useRef(null);

  // Quick mode state
  const [qSquad, setQSquad] = useLS("qSquad", 1);
  const [qTrap, setQTrap] = useLS("qTrap", 1);
  const [qNumShooters, setQNumShooters] = useLS("qNumShooters", 1);
  const [qSetup, setQSetup] = useLS("qSetup", Array.from({length:5},(_,i)=>({name:`SHOOTER ${i+1}`,gun:"",choke:""})));
  const [qShooters, setQShooters] = useLS("qShooters", []);
  const [qActiveIdx, setQActiveIdx] = useLS("qActiveIdx", 0);

  // Event mode state
  const [eventName, setEventName] = useLS("eventName", "");
  const [weather, setWeather] = useLS("weather", "");
  const [notes, setNotes] = useLS("notes", "");
  const [locationName, setLocationName] = useLS("locationName", "");
  const [numTraps, setNumTraps] = useLS("numTraps", 2);
  const [numSquads, setNumSquads] = useLS("numSquads", 2);
  const [squadSetups, setSquadSetups] = useLS("squadSetups", {}); // squadNum -> { shooterCount, shooters: [{name,gun,choke}] }
  const [scores, setScores] = useLS("scores", {}); // "squadNum-trapNum" -> [shooterState, ...]
  const [curTrap, setCurTrap] = useLS("curTrap", 1);
  const [curSquad, setCurSquad] = useLS("curSquad", 1);
  const [activeIdx, setActiveIdx] = useLS("activeIdx", 0);

  // Past shoots history
  const [pastShoots, setPastShoots] = useLS("pastShoots", []);
  const [showHistory, setShowHistory] = useState(false);

  // Cloud sync
  const [sessionId, setSessionId] = useLS("sessionId", "");
  const [syncOn, setSyncOn] = useLS("syncOn", false);
  const [syncStatus, setSyncStatus] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const syncRef = useRef(null);
  const skipNextPull = useRef(false);
  const appRef = useRef(null);
  const locationRef = useRef(null);

  // Auto-detect location silently via IP (no permission prompt)
  useEffect(() => {
    getLocationSilent().then(loc => {
      if (loc) {
        locationRef.current = { lat: loc.lat, lng: loc.lng };
        if (!locationName && loc.name) setLocationName(loc.name.toUpperCase());
      }
    });
  }, []);

  // Auto-migrate: on first load after update, if there's existing data and no sync, push to cloud
  useEffect(() => {
    const migrated = localStorage.getItem("trap_migrated");
    if (migrated) return;
    localStorage.setItem("trap_migrated", "1");
    // If there's existing shooter data, auto-save to a session
    const hasData = qShooters.length > 0 || Object.keys(scores).length > 0;
    if (hasData && !syncOn) {
      const code = genCode();
      setSessionId(code);
      setSyncOn(true);
      localStorage.setItem("trap_lastSync", "0");
    }
  }, []);

  // Build metadata for cloud payload
  const buildMeta = () => {
    const { device, userAgent } = getDeviceInfo();
    return {
      device, userAgent,
      location: locationRef.current,
      date: new Date().toISOString(),
    };
  };

  // Push state to cloud on changes (debounced)
  const pushTimer = useRef(null);
  useEffect(() => {
    if (!syncOn || !sessionId) return;
    if (skipNextPull.current) { skipNextPull.current = false; return; }
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      const now = Date.now();
      localStorage.setItem("trap_lastSync", String(now));
      const payload = {
        mode, eventName, weather, notes, locationName,
        qSquad, qTrap, qNumShooters, qSetup, qShooters, qActiveIdx,
        numTraps, numSquads, squadSetups, scores,
        curTrap, curSquad, activeIdx,
        updatedAt: now,
        _meta: buildMeta(),
      };
      cloudSave("session:" + sessionId, payload);
    }, 300);
  }, [syncOn, sessionId, mode, eventName, weather, notes, locationName, qSquad, qTrap, qNumShooters, qSetup, qShooters, qActiveIdx, numTraps, numSquads, squadSetups, scores, curTrap, curSquad, activeIdx]);

  // Poll cloud for updates every 3s
  useEffect(() => {
    if (!syncOn || !sessionId) return;
    const poll = async () => {
      const data = await cloudLoad("session:" + sessionId);
      if (!data || !data.updatedAt) return;
      const localTime = parseInt(localStorage.getItem("trap_lastSync") || "0");
      if (data.updatedAt <= localTime) return;
      localStorage.setItem("trap_lastSync", String(data.updatedAt));
      skipNextPull.current = true;
      if (data.mode !== undefined) setMode(data.mode);
      if (data.eventName !== undefined) setEventName(data.eventName);
      if (data.weather !== undefined) setWeather(data.weather);
      if (data.notes !== undefined) setNotes(data.notes);
      if (data.locationName !== undefined) setLocationName(data.locationName);
      if (data.qSquad !== undefined) setQSquad(data.qSquad);
      if (data.qTrap !== undefined) setQTrap(data.qTrap);
      if (data.qNumShooters !== undefined) setQNumShooters(data.qNumShooters);
      if (data.qSetup !== undefined) setQSetup(data.qSetup);
      if (data.qShooters !== undefined) setQShooters(data.qShooters);
      if (data.qActiveIdx !== undefined) setQActiveIdx(data.qActiveIdx);
      if (data.numTraps !== undefined) setNumTraps(data.numTraps);
      if (data.numSquads !== undefined) setNumSquads(data.numSquads);
      if (data.squadSetups !== undefined) setSquadSetups(data.squadSetups);
      if (data.scores !== undefined) setScores(data.scores);
      if (data.curTrap !== undefined) setCurTrap(data.curTrap);
      if (data.curSquad !== undefined) setCurSquad(data.curSquad);
      if (data.activeIdx !== undefined) setActiveIdx(data.activeIdx);
      setSyncStatus("synced");
    };
    syncRef.current = setInterval(poll, 3000);
    poll();
    return () => clearInterval(syncRef.current);
  }, [syncOn, sessionId]);

  // Merge cloud history with local (union by id, keep newest version, sort by date desc)
  const mergeHistory = async (code) => {
    const cloudHistory = await cloudLoad("history:" + code);
    if (!cloudHistory || !Array.isArray(cloudHistory)) return;
    setPastShoots(prev => {
      const map = new Map();
      [...prev, ...cloudHistory].forEach(s => {
        const existing = map.get(s.id);
        if (!existing || new Date(s.date) > new Date(existing.date)) map.set(s.id, s);
      });
      return [...map.values()].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 50);
    });
  };

  const startSync = () => {
    const code = genCode();
    setSessionId(code);
    setSyncOn(true);
    setSyncStatus("synced");
    localStorage.setItem("trap_lastSync", "0");
    // Push existing local history to cloud
    if (pastShoots.length > 0) cloudSave("history:" + code, pastShoots);
  };

  const joinSync = async (code) => {
    if (!code || code.length < 4) return;
    const upper = code.toUpperCase();
    setSessionId(upper);
    setSyncOn(true);
    setSyncStatus("synced");
    localStorage.setItem("trap_lastSync", "0");
    // Pull cloud history
    await mergeHistory(upper);
  };

  const stopSync = () => {
    setSyncOn(false);
    setSessionId("");
    setSyncStatus("");
    clearInterval(syncRef.current);
  };

  // On app load, if already synced, pull cloud history
  useEffect(() => {
    if (syncOn && sessionId) mergeHistory(sessionId);
  }, []);

  // Track current shoot session ID for upsert
  const [currentShootId, setCurrentShootId] = useLS("currentShootId", null);

  // Save current shoot to past history (upserts: updates existing entry for this session)
  const saveToHistory = () => {
    const shooters = mode === "quick" ? qShooters : [];
    const hasData = shooters.length > 0 || Object.keys(scores).length > 0;
    if (!hasData) return;
    const shootId = currentShootId || Date.now();
    if (!currentShootId) setCurrentShootId(shootId);
    const entry = {
      id: shootId,
      date: new Date().toISOString(),
      eventName: eventName || "Quick Shoot",
      mode, weather, notes, locationName,
      sessionId: sessionId || null,
      qSquad, qTrap, qShooters: mode === "quick" ? qShooters : [],
      scores: mode === "event" ? scores : {},
      squadSetups: mode === "event" ? squadSetups : {},
      numTraps, numSquads,
      device: getDeviceInfo().device,
      location: locationRef.current,
    };
    setPastShoots(prev => {
      const idx = prev.findIndex(s => s.id === shootId);
      let updated;
      if (idx >= 0) { updated = [...prev]; updated[idx] = entry; }
      else { updated = [entry, ...prev].slice(0, 50); }
      // Push history to cloud so all devices can see it
      if (syncOn && sessionId) cloudSave("history:" + sessionId, updated);
      return updated;
    });
  };

  // Auto-save to history whenever scores change
  const autoSaveTimer = useRef(null);
  useEffect(() => {
    if (screen !== "range" && screen !== "leaderboard") return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveToHistory(), 500);
  }, [screen, qShooters, scores]);

  // Screenshot
  const takeScreenshot = async () => {
    if (!appRef.current) return;
    try {
      const canvas = await html2canvas(appRef.current, { backgroundColor: sunMode ? "#ffffff" : "#0f0c08", scale: 2 });
      const link = document.createElement("a");
      link.download = `trapscore-${new Date().toISOString().slice(0,10)}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch {}
  };

  const t = sunMode ? SUN : DARK;
  const { feedbackHit, feedbackMiss } = useFeedback(vibOn, sndOn);

  // Auto-detect system light/dark mode unless user manually toggled
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: light)");
    if (!mq) return;
    const handler = (e) => { if (!sunManual) setSunMode(e.matches); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [sunManual]);

  const toggleSunMode = () => {
    setSunManual(true);
    setSunMode(s => !s);
  };

  const setFlashLabel = (label) => {
    setFlashLabelRaw(label);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashLabelRaw(null), 650);
  };

  // ── Quick mode helpers ──
  const updateQSetup = (i,field,val) => setQSetup(p=>p.map((s,idx)=>idx===i?{...s,[field]:val.toUpperCase()}:s));
  const startQuick = () => {
    setCurrentShootId(Date.now());
    setQShooters(Array.from({length:qNumShooters},(_,i)=>freshShooter(qSetup[i].name,qSetup[i].gun,qSetup[i].choke)));
    setQActiveIdx(0); setScreen("range");
  };
  // Instant quick start — 1 shooter, no setup needed
  const instantStart = () => {
    setMode("quick");
    setCurrentShootId(Date.now());
    setQShooters([freshShooter(qSetup[0].name, qSetup[0].gun, qSetup[0].choke)]);
    setQActiveIdx(0); setScreen("range");
  };
  const updateQShooter = (i,changes) => setQShooters(p=>p.map((s,idx)=>idx===i?{...s,...changes}:s));
  const saveQRound = (i) => setQShooters(p=>p.map((s,idx)=>{
    if(idx!==i)return s;
    const pct=s.hits+s.misses>0?Math.round((s.hits/(s.hits+s.misses))*100):0;
    return{...s,rounds:[...s.rounds,{round:s.roundNum,hits:s.hits,misses:s.misses,pct}],roundNum:s.roundNum+1,hits:0,misses:0,history:[]};
  }));
  const handleQuickExcel = () => {
    const data = { eventName, weather, notes, traps:[qTrap], squads:[{num:qSquad,shooters:qShooters.map(s=>({name:s.name,gun:s.gun,choke:s.choke}))}], scores:{[`${qSquad}-${qTrap}`]:qShooters} };
    exportEventExcel(data);
  };

  // ── Event mode helpers ──
  const getSquadSetup = (sqNum) => {
    if (squadSetups[sqNum]) return squadSetups[sqNum];
    return { shooterCount: 5, shooters: Array.from({length:5},(_,i)=>({name:`SHOOTER ${i+1}`,gun:"",choke:""})) };
  };
  const updateSquadSetup = (sqNum, changes) => {
    setSquadSetups(p => ({ ...p, [sqNum]: { ...getSquadSetup(sqNum), ...changes } }));
  };
  const updateSquadShooter = (sqNum, si, field, val) => {
    const ss = getSquadSetup(sqNum);
    const newShooters = ss.shooters.map((s,i) => i===si ? {...s,[field]:val.toUpperCase()} : s);
    updateSquadSetup(sqNum, { shooters: newShooters });
  };

  const traps = Array.from({length:numTraps},(_,i)=>i+1);
  const squadNums = Array.from({length:numSquads},(_,i)=>i+1);

  const startEvent = () => {
    setCurrentShootId(Date.now());
    // Initialize scores for all squad/trap combos
    const newScores = {};
    squadNums.forEach(sqNum => {
      const ss = getSquadSetup(sqNum);
      traps.forEach(trapNum => {
        const key = `${sqNum}-${trapNum}`;
        if (!scores[key]) {
          newScores[key] = Array.from({length:ss.shooterCount},(_,i) =>
            freshShooter(ss.shooters[i]?.name, ss.shooters[i]?.gun, ss.shooters[i]?.choke)
          );
        } else {
          newScores[key] = scores[key];
        }
      });
    });
    setScores(newScores);
    setCurTrap(1); setCurSquad(1); setActiveIdx(0);
    setScreen("range");
  };

  const curKey = `${curSquad}-${curTrap}`;
  const curShooters = scores[curKey] || [];

  const updateEventShooter = (i, changes) => {
    setScores(p => {
      const arr = [...(p[curKey]||[])];
      arr[i] = { ...arr[i], ...changes };
      return { ...p, [curKey]: arr };
    });
  };
  const saveEventRound = (i) => {
    setScores(p => {
      const arr = [...(p[curKey]||[])];
      const s = arr[i];
      const pct = s.hits+s.misses>0 ? Math.round((s.hits/(s.hits+s.misses))*100) : 0;
      arr[i] = { ...s, rounds:[...s.rounds,{round:s.roundNum,hits:s.hits,misses:s.misses,pct}], roundNum:s.roundNum+1, hits:0, misses:0, history:[] };
      return { ...p, [curKey]: arr };
    });
  };
  const handleEventExcel = () => {
    const squads = squadNums.map(n => {
      const ss = getSquadSetup(n);
      return { num: n, shooters: ss.shooters.slice(0, ss.shooterCount) };
    });
    exportEventExcel({ eventName, weather, notes, traps, squads, scores });
  };

  // ── Import handler ──
  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importExcel(file);
      setImportMsg(`Loaded ${data.squads.length} squad(s), ${data.traps.length} trap(s)`);
      setTimeout(() => setImportMsg(null), 3000);

      if (data.traps.length <= 1 && data.squads.length <= 1) {
        // Single trap/squad - use quick mode
        setMode("quick");
        const sq = data.squads[0] || { num:1, shooters:[] };
        setQSquad(sq.num);
        setQTrap(data.traps[0] || 1);
        setQNumShooters(sq.shooters.length || 1);
        const newSetup = Array.from({length:5},(_,i)=>{
          if(i<sq.shooters.length) return sq.shooters[i];
          return {name:`SHOOTER ${i+1}`,gun:"",choke:""};
        });
        setQSetup(newSetup);
        setEventName(data.eventName);
        setWeather(data.weather);
        setNotes(data.notes);
        // If there are scores, load into quick mode
        const key = `${sq.num}-${data.traps[0]||1}`;
        if (data.scores[key]) {
          setQShooters(data.scores[key]);
          setQActiveIdx(0);
          setScreen("range");
        }
      } else {
        // Multi trap/squad - use event mode
        setMode("event");
        setEventName(data.eventName);
        setWeather(data.weather);
        setNotes(data.notes);
        setNumTraps(data.traps.length);
        setNumSquads(data.squads.length);
        const newSetups = {};
        data.squads.forEach(sq => {
          const shooters = Array.from({length:5},(_,i)=>{
            if(i<sq.shooters.length) return sq.shooters[i];
            return {name:`SHOOTER ${i+1}`,gun:"",choke:""};
          });
          newSetups[sq.num] = { shooterCount: sq.shooters.length, shooters };
        });
        setSquadSetups(newSetups);
        setScores(data.scores);
        setCurTrap(data.traps[0]||1);
        setCurSquad(data.squads[0]?.num||1);
        setActiveIdx(0);
        setScreen("range");
      }
    } catch (err) {
      setImportMsg("Error: " + err);
      setTimeout(() => setImportMsg(null), 4000);
    }
    if (fileInput.current) fileInput.current.value = "";
  };

  // ── Responsive helpers ──
  const isWide = scr.sz === "tablet" || scr.sz === "laptop" || scr.sz === "desktop" || scr.sz === "ultra";
  const isTiny = scr.sz === "tiny";
  const isTablet = scr.sz === "tablet-sm" || scr.sz === "tablet";
  const containerMax = isWide ? 720 : (isTablet ? 600 : 480);
  const basePad = isTiny ? 8 : (isWide ? 28 : 14);
  const baseFontMult = isTiny ? 0.85 : (isWide ? 1.15 : 1);

  // ── Styles ──
  const pageStyle = {minHeight:"100vh",background:t.bg,backgroundImage:t.bgGrad,fontFamily:"'Courier New',Courier,monospace",color:t.text,padding:`20px ${isTiny?6:isWide?24:12}px`,maxWidth:"100vw",overflowX:"hidden",boxSizing:"border-box"};
  const sectionStyle = {background:t.card,border:`2px solid ${t.border}`,borderRadius:10,padding:basePad,marginBottom:14,overflow:"hidden"};
  const inputStyle = {background:t.inputBg,border:`2px solid ${t.border}`,borderRadius:6,color:t.text,fontSize:Math.round(13*baseFontMult),fontWeight:"bold",padding:isWide?"12px 14px":"9px 10px",fontFamily:"inherit",outline:"none",letterSpacing:1,boxSizing:"border-box",width:"100%",minWidth:0};
  const pillBtn = (active) => ({
    padding:isWide?"12px 20px":"10px 16px",background:active?t.tabActive:t.tabInactive,
    border:`2px solid ${active?t.borderActive:t.border}`,borderRadius:20,
    color:active?(sunMode?"#fff":t.accent):t.tabText,fontSize:Math.round(11*baseFontMult),fontWeight:"900",
    letterSpacing:2,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s",
  });

  // ════════════════════════════
  // ── BOOT SCREEN ──
  // ════════════════════════════
  if (booting) return (
    <div style={{position:"fixed",inset:0,background:"linear-gradient(180deg,#1a2840 0%,#0f1a28 25%,#182030 50%,#1a1a10 75%,#0a0804 100%)",zIndex:9999,overflow:"hidden",opacity:bootPhase===3?0:1,transition:"opacity 0.6s ease-out",fontFamily:"'Courier New',Courier,monospace"}}>
      <style>{`
        @keyframes recoilKick{0%{transform:translate(0,0)}12%{transform:translate(-8px,3px)}40%{transform:translate(-3px,1px)}100%{transform:translate(0,0)}}
        @keyframes muzzleFlare{0%{opacity:0;transform:scale(0.2)}8%{opacity:1;transform:scale(1.3)}25%{opacity:0.7;transform:scale(1)}100%{opacity:0;transform:scale(0.4)}}
        @keyframes smokeUp{0%{opacity:0.4;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(var(--sc))}}
        @keyframes clayFly{0%{left:5%;top:58%;transform:rotate(0deg) scale(0.7)}40%{top:32%;transform:rotate(-8deg) scale(1)}100%{left:72%;top:28%;transform:rotate(-15deg) scale(1)}}
        @keyframes shotSpread{0%{left:22%;top:42%;opacity:0.7}100%{left:72%;top:28%;opacity:0.15}}
        @keyframes screenFlash{0%{opacity:0}4%{opacity:0.9}12%{opacity:0.4}100%{opacity:0}}
        @keyframes boomBall{0%{transform:scale(0.1);opacity:1}20%{transform:scale(1);opacity:1}100%{transform:scale(5);opacity:0}}
        @keyframes shardFly{0%{opacity:1;transform:translate(0,0) rotate(0deg) scale(1)}100%{opacity:0;transform:translate(var(--ex),var(--ey)) rotate(var(--er)) scale(0.15)}}
        @keyframes sparkOut{0%{opacity:1;transform:translate(0,0)}100%{opacity:0;transform:translate(var(--sx),var(--sy))}}
        @keyframes dustGrow{0%{transform:scale(0.3);opacity:0.6}100%{transform:scale(5);opacity:0}}
        @keyframes textPop{0%{opacity:0;transform:translateY(15px) scale(0.9)}100%{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes bootGlow{0%,100%{opacity:0.5}50%{opacity:1}}
        @keyframes shellTumble{0%{opacity:1;transform:translate(0,0) rotate(0deg)}100%{opacity:0;transform:translate(15px,40px) rotate(220deg)}}
        @keyframes hatBrim{0%{transform:translateX(0)}15%{transform:translateX(-2px)}100%{transform:translateX(0)}}
      `}</style>

      {/* ── SKY — dusk with a few stars ── */}
      {[...Array(15)].map((_,i)=>(
        <div key={i} style={{position:"absolute",top:`${3+Math.random()*35}%`,left:`${Math.random()*100}%`,width:1.5+Math.random(),height:1.5+Math.random(),borderRadius:"50%",background:`rgba(200,210,240,${0.15+Math.random()*0.25})`}}/>
      ))}
      {/* Horizon glow — sunset remnant */}
      <div style={{position:"absolute",top:"40%",left:0,right:0,height:"20%",background:"linear-gradient(180deg,transparent,rgba(80,40,15,0.15),transparent)"}}/>

      {/* ── GROUND — grass/dirt ── */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:"32%",background:"linear-gradient(180deg,#1a2010,#151a0c,#0f1408)"}}/>
      {/* Ground texture lines */}
      {[0,1,2,3].map(i=>(
        <div key={`g${i}`} style={{position:"absolute",bottom:`${4+i*7}%`,left:0,right:0,height:1,background:`rgba(30,40,15,${0.3-i*0.06})`}}/>
      ))}

      {/* ── TRAP HOUSE — low structure center-left ── */}
      <div style={{position:"absolute",bottom:"30%",left:"12%",width:60,height:20,background:"linear-gradient(180deg,#3a3a2a,#2a2a1a)",borderRadius:"2px 2px 0 0",border:"1px solid #4a4a3a",borderBottom:"none"}}>
        <div style={{position:"absolute",top:-4,left:-3,right:-3,height:5,background:"linear-gradient(180deg,#4a4a3a,#3a3a2a)",borderRadius:"2px 2px 0 0"}}/>
        {/* Opening slot where clay comes out */}
        <div style={{position:"absolute",top:4,right:-2,width:8,height:6,background:"#1a1a10",borderRadius:1}}/>
      </div>

      {/* ── SHOOTER SILHOUETTE — left side, facing right ── */}
      <div style={{position:"absolute",bottom:"30%",left:"5%",animation:bootPhase===1?"recoilKick 0.25s ease-out forwards":"none"}}>
        {/* Body — dark silhouette */}
        <div style={{position:"relative",width:50,height:90}}>
          {/* Hat */}
          <div style={{position:"absolute",top:0,left:8,width:30,height:8,background:"#1a1510",borderRadius:"4px 12px 2px 2px",animation:bootPhase===1?"hatBrim 0.25s ease-out forwards":"none"}}>
            <div style={{position:"absolute",bottom:0,left:-4,right:-2,height:3,background:"#1a1510",borderRadius:2}}/>
          </div>
          {/* Head */}
          <div style={{position:"absolute",top:6,left:12,width:20,height:22,background:"#1a1510",borderRadius:"50% 50% 45% 45%"}}/>
          {/* Ear pro / muffs */}
          <div style={{position:"absolute",top:12,left:8,width:8,height:10,background:"#252015",borderRadius:3}}/>
          <div style={{position:"absolute",top:12,left:28,width:8,height:10,background:"#252015",borderRadius:3}}/>
          {/* Neck */}
          <div style={{position:"absolute",top:26,left:16,width:12,height:8,background:"#1a1510"}}/>
          {/* Shoulders + torso */}
          <div style={{position:"absolute",top:32,left:2,width:44,height:30,background:"#1a1510",borderRadius:"8px 8px 4px 4px"}}/>
          {/* Vest detail */}
          <div style={{position:"absolute",top:36,left:8,width:32,height:20,background:"#1f1a12",borderRadius:4}}/>
          {/* Front arm (holding forend) — reaching forward */}
          <div style={{position:"absolute",top:36,left:38,width:30,height:10,background:"#1a1510",borderRadius:4,transform:"rotate(-15deg)"}}/>
          {/* Rear arm (on grip) */}
          <div style={{position:"absolute",top:38,left:-2,width:14,height:9,background:"#1a1510",borderRadius:4,transform:"rotate(10deg)"}}/>
          {/* Legs (just top visible above ground line) */}
          <div style={{position:"absolute",top:60,left:6,width:14,height:30,background:"#1a1510",borderRadius:3}}/>
          <div style={{position:"absolute",top:60,left:24,width:14,height:30,background:"#151210",borderRadius:3}}/>
        </div>

        {/* ── GUN — shouldered, pointing right and slightly up ── */}
        <div style={{position:"absolute",top:28,left:32,transform:"rotate(-12deg)",transformOrigin:"left center"}}>
          {/* Stock (behind shoulder) */}
          <div style={{position:"absolute",top:2,left:-30,width:32,height:11,background:"linear-gradient(180deg,#3a2510,#2a1a0a,#3a2510)",borderRadius:"6px 3px 3px 8px",border:"1px solid #4a3018"}}>
            {[3,6,9].map(y=><div key={y} style={{position:"absolute",top:y,left:4,right:6,height:0.5,background:"rgba(80,50,15,0.25)"}}/>)}
          </div>
          {/* Receiver */}
          <div style={{position:"absolute",top:1,left:0,width:22,height:12,background:"linear-gradient(180deg,#444,#2a2a2a,#383838)",borderRadius:2,border:"1px solid #555"}}/>
          {/* Barrel */}
          <div style={{position:"absolute",top:2,left:20,width:isTiny?80:120,height:7,background:"linear-gradient(180deg,#4a4a4a,#303030,#3a3a3a)",borderRadius:"1px 2px 2px 1px",border:"1px solid #555"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:1.5,background:"rgba(255,255,255,0.04)",borderRadius:1}}/>
            {/* Front bead */}
            <div style={{position:"absolute",top:-2,right:1,width:3,height:3,borderRadius:"50%",background:"#ff8800",boxShadow:"0 0 3px rgba(255,136,0,0.5)"}}/>
          </div>
          {/* Forend */}
          <div style={{position:"absolute",top:5,left:18,width:30,height:9,background:"linear-gradient(180deg,#3a2510,#2a1a0a)",borderRadius:2,border:"1px solid #4a3018"}}/>
        </div>

        {/* Shell ejecting on fire */}
        {bootPhase>=1&&bootPhase<2&&(
          <div style={{position:"absolute",top:22,left:38,width:5,height:12,background:"linear-gradient(180deg,#d4a030,#b88820)",borderRadius:"2px 2px 1px 1px",border:"1px solid #ddb040",animation:"shellTumble 0.7s ease-out forwards"}}>
            <div style={{position:"absolute",bottom:0,left:0.5,right:0.5,height:2,background:"#c83030",borderRadius:"0 0 1px 1px"}}/>
          </div>
        )}
      </div>

      {/* ── MUZZLE FLASH — at end of barrel, right side ── */}
      {bootPhase>=1&&bootPhase<2&&(
        <div style={{position:"absolute",top:"35%",left:isTiny?"32%":"38%",pointerEvents:"none"}}>
          <div style={{position:"absolute",top:-30,left:-30,width:60,height:60,borderRadius:"50%",background:"radial-gradient(circle, rgba(255,255,220,0.95) 0%, rgba(255,200,50,0.7) 25%, rgba(255,120,0,0.3) 50%, transparent 70%)",animation:"muzzleFlare 0.3s ease-out forwards"}}/>
          <div style={{position:"absolute",top:-45,left:-45,width:90,height:90,borderRadius:"50%",background:"radial-gradient(circle, rgba(255,180,50,0.4) 0%, rgba(255,100,0,0.15) 40%, transparent 65%)",animation:"muzzleFlare 0.45s ease-out 0.02s forwards"}}/>
          {/* Smoke drifting right and up from muzzle */}
          {[0,1,2,3,4].map(i=>(
            <div key={i} style={{position:"absolute",top:-10-i*4,left:10+i*8,width:18+i*12,height:18+i*12,borderRadius:"50%",background:`rgba(160,150,130,${0.2-i*0.03})`,opacity:0,"--dx":`${20+i*15}px`,"--dy":`${-30-i*12}px`,"--sc":2+i*0.5,animation:`smokeUp ${1.5+i*0.4}s ease-out ${0.05+i*0.06}s forwards`}}/>
          ))}
        </div>
      )}

      {/* ── CLAY PIGEON — launches from trap house, arcs up-right ── */}
      {bootPhase>=0&&bootPhase<2&&(
        <div style={{position:"absolute",animation:bootPhase>=0?"clayFly 2.2s ease-out forwards":"none",pointerEvents:"none"}}>
          <div style={{width:isTiny?28:38,height:isTiny?9:12,background:"linear-gradient(180deg,#ff6530,#dd4020,#bb2a10)",borderRadius:"50%",border:"1.5px solid #ff7540",boxShadow:"0 0 8px rgba(255,80,30,0.3)",position:"relative"}}>
            <div style={{position:"absolute",top:1,left:"20%",right:"20%",height:3,background:"rgba(255,255,255,0.12)",borderRadius:"50%"}}/>
            <div style={{position:"absolute",top:"45%",left:"12%",right:"12%",height:1,background:"rgba(0,0,0,0.15)"}}/>
          </div>
        </div>
      )}

      {/* ── SHOT PATTERN — visible dots chasing clay after fire ── */}
      {bootPhase>=1&&bootPhase<2&&[0,1,2,3,4,5].map(i=>(
        <div key={`sh${i}`} style={{position:"absolute",width:3,height:3,borderRadius:"50%",background:`rgba(200,180,140,${0.5-i*0.06})`,boxShadow:"0 0 3px rgba(200,180,140,0.3)",animation:`shotSpread ${0.9+i*0.04}s ease-in ${i*0.02}s forwards`,top:`${-2+i*1.5}%`,left:`${-1+i*0.8}%`}}/>
      ))}

      {/* ── EXPLOSION — right side of screen where clay was ── */}
      {bootPhase>=2&&(
        <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
          {/* Full screen flash */}
          <div style={{position:"absolute",inset:0,background:"rgba(255,240,200,0.85)",animation:"screenFlash 0.5s ease-out forwards"}}/>

          {/* Fireball — centered on impact point (right side, upper area) */}
          <div style={{position:"absolute",top:"25%",left:"70%",transform:"translate(-50%,-50%)"}}>
            <div style={{position:"absolute",top:"-20vmin",left:"-20vmin",width:"40vmin",height:"40vmin",borderRadius:"50%",background:"radial-gradient(circle, rgba(255,255,210,1) 0%, rgba(255,190,40,0.9) 15%, rgba(255,110,0,0.7) 35%, rgba(200,50,0,0.4) 55%, transparent 75%)",animation:"boomBall 0.9s ease-out forwards"}}/>
            <div style={{position:"absolute",top:"-15vmin",left:"-15vmin",width:"30vmin",height:"30vmin",borderRadius:"50%",background:"radial-gradient(circle, rgba(255,220,120,0.7) 0%, rgba(255,140,20,0.3) 45%, transparent 75%)",animation:"boomBall 0.7s ease-out 0.04s forwards"}}/>
            {/* Smoke/dust expanding */}
            <div style={{position:"absolute",top:"-25vmin",left:"-25vmin",width:"50vmin",height:"50vmin",borderRadius:"50%",background:"radial-gradient(circle, rgba(160,100,40,0.35) 0%, rgba(100,70,30,0.15) 40%, transparent 70%)",animation:"dustGrow 1.4s ease-out 0.08s forwards"}}/>
          </div>

          {/* Clay shards — orange pieces flying from impact point across entire screen */}
          {[
            {ex:"-50vw",ey:"-30vh",er:"700deg",w:20,h:8},{ex:"30vw",ey:"-40vh",er:"-500deg",w:16,h:7},
            {ex:"-40vw",ey:"35vh",er:"480deg",w:22,h:9},{ex:"28vw",ey:"30vh",er:"-600deg",w:14,h:6},
            {ex:"-30vw",ey:"-45vh",er:"400deg",w:18,h:7},{ex:"25vw",ey:"-20vh",er:"-450deg",w:12,h:5},
            {ex:"-45vw",ey:"10vh",er:"550deg",w:15,h:6},{ex:"20vw",ey:"40vh",er:"-380deg",w:24,h:9},
            {ex:"-20vw",ey:"-35vh",er:"620deg",w:13,h:5},{ex:"15vw",ey:"45vh",er:"-520deg",w:17,h:7},
            {ex:"-55vw",ey:"25vh",er:"440deg",w:11,h:5},{ex:"10vw",ey:"-48vh",er:"-660deg",w:19,h:8},
            {ex:"-35vw",ey:"-15vh",er:"360deg",w:16,h:6},{ex:"35vw",ey:"15vh",er:"-420deg",w:21,h:8},
            {ex:"-25vw",ey:"48vh",er:"580deg",w:10,h:4},{ex:"40vw",ey:"-35vh",er:"-540deg",w:18,h:7},
            {ex:"-48vw",ey:"-40vh",er:"500deg",w:14,h:6},{ex:"45vw",ey:"20vh",er:"-470deg",w:20,h:8},
          ].map((s,i)=>{
            const colors = ["#e05020","#ff6030","#c03010","#ff7040","#d04020","#bb2a10"];
            const c = colors[i%colors.length];
            return <div key={i} style={{position:"absolute",top:"25%",left:"70%",width:s.w,height:s.h,background:`linear-gradient(135deg,${c},${c}cc)`,borderRadius:2,boxShadow:`0 0 5px ${c}66`,"--ex":s.ex,"--ey":s.ey,"--er":s.er,animation:`shardFly ${0.5+i*0.03}s ease-out ${i*0.015}s forwards`}}/>;
          })}

          {/* Hot sparks — white/yellow/orange dots from impact */}
          {[...Array(24)].map((_,i)=>{
            const a = (i/24)*Math.PI*2+Math.random()*0.4;
            const d = 25+Math.random()*45;
            const colors = ["#fff","#ffe880","#ffcc30","#ff9900","#fff"];
            return <div key={`k${i}`} style={{position:"absolute",top:"25%",left:"70%",width:2+Math.random()*3,height:2+Math.random()*3,borderRadius:"50%",background:colors[i%colors.length],boxShadow:`0 0 ${3+Math.random()*4}px ${colors[i%colors.length]}`,"--sx":`${Math.cos(a)*d}vw`,"--sy":`${Math.sin(a)*d}vh`,animation:`sparkOut ${0.3+Math.random()*0.5}s ease-out ${Math.random()*0.08}s forwards`}}/>;
          })}

          {/* Lingering smoke clouds after explosion */}
          {[0,1,2,3].map(i=>(
            <div key={`c${i}`} style={{position:"absolute",top:`${18+i*5}%`,left:`${60+i*6}%`,width:50+i*25,height:50+i*25,borderRadius:"50%",background:`rgba(${130+i*12},${110+i*10},${80+i*8},${0.12-i*0.02})`,animation:`dustGrow ${1.8+i*0.4}s ease-out ${0.15+i*0.1}s forwards`}}/>
          ))}
        </div>
      )}

      {/* ── TEXT OVERLAY ── */}
      <div style={{position:"absolute",bottom:"5%",left:0,right:0,textAlign:"center",zIndex:10}}>
        {bootPhase<1&&(
          <div style={{animation:"bootGlow 1.2s ease-in-out infinite"}}>
            <div style={{fontSize:9,fontWeight:"bold",letterSpacing:7,color:"#3a5060",marginBottom:5}}>{"\u2B21"} RANGE SCORE TRACKER {"\u2B21"}</div>
            <div style={{fontSize:isTiny?20:28,fontWeight:"900",letterSpacing:5,color:"#f5c060"}}>TRAP COUNTER</div>
          </div>
        )}
        {bootPhase===1&&(
          <div style={{animation:"textPop 0.25s ease-out forwards"}}>
            <div style={{fontSize:isTiny?26:40,fontWeight:"900",letterSpacing:8,color:"#f5c060",textShadow:"0 0 20px rgba(245,192,96,0.5)"}}>PULL!</div>
          </div>
        )}
        {bootPhase>=2&&bootPhase<3&&(
          <div style={{animation:"textPop 0.2s ease-out forwards"}}>
            <div style={{fontSize:isTiny?22:34,fontWeight:"900",letterSpacing:5,color:"#ff4020",textShadow:"0 0 30px rgba(255,64,32,0.6)"}}>DEAD BIRD!</div>
            <div style={{fontSize:10,fontWeight:"bold",letterSpacing:5,color:"#f5c060",marginTop:8}}>TRAP COUNTER</div>
          </div>
        )}
      </div>
    </div>
  );

  // ════════════════════════════
  // ── SETUP SCREEN ──
  // ════════════════════════════
  if (screen === "setup") return (
    <div style={pageStyle}>
      <style>{`@keyframes fadeFlash{0%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}100%{opacity:0;transform:translate(-50%,-60%) scale(0.9)}}`}</style>
      <input type="file" ref={fileInput} accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={handleImport}/>
      <div style={{maxWidth:containerMax,margin:"0 auto",width:"100%",boxSizing:"border-box"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          {!isTiny&&<div style={{fontSize:10,fontWeight:"bold",letterSpacing:8,color:t.textMuted}}>{"\u2B21"} RANGE SCORE TRACKER {"\u2B21"}</div>}
          <div style={{fontSize:isTiny?20:Math.round(26*baseFontMult),fontWeight:"900",letterSpacing:4,color:t.accent,marginTop:isTiny?0:6}}>TRAP COUNTER</div>
        </div>

        {/* Sun mode */}
        <div style={{...sectionStyle,display:"flex",alignItems:"center",justifyContent:"center",gap:16,padding:"12px 16px"}}>
          <span style={{fontSize:11,fontWeight:"900",letterSpacing:3,color:sunMode?t.accent:t.textMuted}}>
            {sunMode?"\u2600\uFE0F SUN MODE":"\u{1F319} NIGHT MODE"}
          </span>
          <div onClick={toggleSunMode} style={{width:52,height:28,borderRadius:14,background:sunMode?"#ff8800":"#222",border:`2px solid ${sunMode?"#cc6600":"#555"}`,cursor:"pointer",position:"relative",transition:"all 0.2s"}}>
            <div style={{position:"absolute",top:3,left:sunMode?27:3,width:20,height:20,borderRadius:"50%",background:sunMode?"#fff":"#666",transition:"all 0.2s"}}/>
          </div>
        </div>
        {!sunManual&&<div style={{fontSize:9,fontWeight:"bold",letterSpacing:2,color:t.textDim,textAlign:"center",marginTop:-10,marginBottom:10}}>AUTO — follows your phone settings</div>}

        {/* Quick Start — one tap, start scoring instantly */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          <button onClick={instantStart} style={{
            padding:"16px 0",
            background:sunMode?"linear-gradient(160deg,#cc4400,#993300)":"linear-gradient(160deg,#ff5500,#cc4400)",
            border:`2px solid ${t.accent}`,borderRadius:10,color:"#fff",
            fontSize:14,fontWeight:"900",letterSpacing:3,cursor:"pointer",fontFamily:"inherit",
          }}>{"\u26A1"} QUICK START</button>
          <button onClick={mode==="quick"?startQuick:startEvent} style={{
            padding:"16px 0",
            background:sunMode?"linear-gradient(160deg,#007700,#005500)":"linear-gradient(160deg,#228B22,#006400)",
            border:`2px solid ${t.good}`,borderRadius:10,color:"#fff",
            fontSize:14,fontWeight:"900",letterSpacing:3,cursor:"pointer",fontFamily:"inherit",
          }}>{"\u25B6"} START</button>
        </div>
        <div style={{fontSize:9,color:t.textDim,textAlign:"center",marginTop:-6,marginBottom:10,letterSpacing:1}}>QUICK START = 1 shooter, instant go &nbsp;|&nbsp; START = use settings below</div>

        {/* Family Group Sync */}
        <div style={{...sectionStyle,padding:"14px 16px"}}>
          <div style={{fontSize:11,fontWeight:"bold",letterSpacing:3,color:t.textMuted,marginBottom:10,textAlign:"center"}}>FAMILY GROUP</div>
          {syncOn ? (
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:10,color:t.textDim,marginBottom:6}}>YOUR GROUP CODE — SHARE WITH FAMILY</div>
              <div style={{fontSize:32,fontWeight:"900",letterSpacing:8,color:t.accent,marginBottom:8,userSelect:"all"}}>{sessionId}</div>
              <div style={{fontSize:10,color:t.good,fontWeight:"bold",letterSpacing:2,marginBottom:4}}>CONNECTED</div>
              <div style={{fontSize:9,color:t.textDim,marginBottom:10,lineHeight:1.5}}>All scores & history sync across devices.<br/>Anyone with this code can see scores — even remotely.</div>
              <button onClick={stopSync} style={{padding:"8px 20px",background:t.smallBtnBg,border:`2px solid ${t.border}`,borderRadius:6,color:t.bad,fontSize:11,fontWeight:"bold",letterSpacing:2,cursor:"pointer",fontFamily:"inherit"}}>LEAVE GROUP</button>
            </div>
          ) : (
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                <button onClick={startSync} style={{padding:"12px 0",background:sunMode?"linear-gradient(160deg,#007700,#005500)":"linear-gradient(160deg,#228B22,#006400)",border:`2px solid ${t.good}`,borderRadius:6,color:"#fff",fontSize:11,fontWeight:"900",letterSpacing:2,cursor:"pointer",fontFamily:"inherit"}}>CREATE GROUP</button>
                <button onClick={()=>joinCode?joinSync(joinCode):null} style={{padding:"12px 0",background:t.smallBtnBg,border:`2px solid ${t.border}`,borderRadius:6,color:t.accent,fontSize:11,fontWeight:"900",letterSpacing:2,cursor:"pointer",fontFamily:"inherit"}}>JOIN GROUP</button>
              </div>
              <input placeholder="ENTER GROUP CODE" value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())}
                style={{...inputStyle,textAlign:"center",letterSpacing:6,fontSize:16,fontWeight:"900"}}/>
              <div style={{fontSize:10,color:t.textDim,marginTop:8,textAlign:"center",lineHeight:1.5}}>
                Create a group to get a code, or enter a code to join your family's group. All scores & shoot history sync across all devices — see scores even when you're out of town.
              </div>
            </div>
          )}
        </div>

        {/* Mode picker */}
        <div style={{...sectionStyle,padding:"12px 16px"}}>
          <div style={{fontSize:11,fontWeight:"bold",letterSpacing:3,color:t.textMuted,marginBottom:10,textAlign:"center"}}>SESSION TYPE</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <button onClick={()=>setMode("quick")} style={pillBtn(mode==="quick")}>{"\u{1F3AF}"} QUICK</button>
            <button onClick={()=>setMode("event")} style={pillBtn(mode==="event")}>{"\u{1F3C6}"} EVENT</button>
          </div>
          <div style={{fontSize:10,color:t.textDim,textAlign:"center",marginTop:8}}>
            {mode==="quick"?"One trap, one squad — fast scoring":"Full event — multiple traps & squads"}
          </div>
        </div>

        {/* Event name / location / weather / notes */}
        <div style={sectionStyle}>
          <input placeholder="EVENT NAME (OPTIONAL)" value={eventName} onChange={e=>setEventName(e.target.value.toUpperCase())}
            style={{...inputStyle,width:"100%",marginBottom:10,textAlign:"center",fontSize:14}}/>
          <input placeholder="LOCATION (AUTO-DETECTED)" value={locationName} onChange={e=>setLocationName(e.target.value.toUpperCase())}
            style={{...inputStyle,width:"100%",marginBottom:10,fontSize:12}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <input placeholder="WEATHER" value={weather} onChange={e=>setWeather(e.target.value.toUpperCase())} style={inputStyle}/>
            <input placeholder="NOTES" value={notes} onChange={e=>setNotes(e.target.value.toUpperCase())} style={inputStyle}/>
          </div>
        </div>

        {/* ── QUICK MODE SETUP ── */}
        {mode === "quick" && <>
          <div style={{...sectionStyle,padding:20}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
              <NumInput label="SQUAD #" value={qSquad} onChange={setQSquad} t={t}/>
              <NumInput label="TRAP #" value={qTrap} onChange={setQTrap} t={t}/>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:11,fontWeight:"bold",letterSpacing:3,color:t.textMuted,marginBottom:8}}>SHOOTERS</div>
              <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                {[1,2,3,4,5].map(n=>(
                  <button key={n} onClick={()=>setQNumShooters(n)} style={{width:48,height:48,background:qNumShooters===n?t.tabActive:t.smallBtnBg,border:`3px solid ${qNumShooters===n?t.borderActive:t.border}`,borderRadius:8,color:qNumShooters===n?t.accent:t.textMuted,fontSize:20,fontWeight:"900",cursor:"pointer",fontFamily:"inherit"}}>{n}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={sectionStyle}>
            <div style={{fontSize:11,fontWeight:"bold",letterSpacing:3,color:t.textMuted,marginBottom:12}}>SHOOTER DETAILS</div>
            {Array.from({length:qNumShooters},(_,i)=>(
              <div key={i} style={{marginBottom:i<qNumShooters-1?14:0}}>
                <div style={{fontSize:11,fontWeight:"bold",color:t.textDim,letterSpacing:2,marginBottom:5}}>SHOOTER {i+1}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  <input placeholder="NAME" value={qSetup[i].name}
                    onChange={e=>updateQSetup(i,"name",e.target.value)} style={{...inputStyle,gridColumn:"1/-1"}}/>
                  <input placeholder="GUN" value={qSetup[i].gun}
                    onChange={e=>updateQSetup(i,"gun",e.target.value)} style={inputStyle}/>
                  <input placeholder="CHOKE" value={qSetup[i].choke}
                    onChange={e=>updateQSetup(i,"choke",e.target.value)} style={inputStyle}/>
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* ── EVENT MODE SETUP ── */}
        {mode === "event" && <>
          <div style={{...sectionStyle,padding:20}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
              <NumInput label="# TRAPS" value={numTraps} onChange={setNumTraps} min={1} max={20} t={t}/>
              <NumInput label="# SQUADS" value={numSquads} onChange={setNumSquads} min={1} max={20} t={t}/>
            </div>
          </div>

          {/* Squad definitions */}
          {squadNums.map(sqNum => {
            const ss = getSquadSetup(sqNum);
            return (
              <div key={sqNum} style={sectionStyle}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontSize:13,fontWeight:"900",letterSpacing:3,color:t.accent}}>SQUAD {sqNum}</div>
                  <div style={{display:"flex",gap:4}}>
                    {[1,2,3,4,5].map(n=>(
                      <button key={n} onClick={()=>updateSquadSetup(sqNum,{shooterCount:n})}
                        style={{width:28,height:28,background:ss.shooterCount===n?t.tabActive:t.smallBtnBg,border:`2px solid ${ss.shooterCount===n?t.borderActive:t.border}`,borderRadius:4,color:ss.shooterCount===n?t.accent:t.textDimmer,fontSize:12,fontWeight:"bold",cursor:"pointer",fontFamily:"inherit"}}>{n}</button>
                    ))}
                  </div>
                </div>
                {Array.from({length:ss.shooterCount},(_,si)=>(
                  <div key={si} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:si<ss.shooterCount-1?6:0}}>
                      <input placeholder="NAME" value={ss.shooters[si]?.name||""}
                        onChange={e=>updateSquadShooter(sqNum,si,"name",e.target.value)} style={{...inputStyle,fontSize:11,padding:"7px 8px",gridColumn:"1/-1"}}/>
                      <input placeholder="GUN" value={ss.shooters[si]?.gun||""}
                        onChange={e=>updateSquadShooter(sqNum,si,"gun",e.target.value)} style={{...inputStyle,fontSize:11,padding:"7px 8px"}}/>
                      <input placeholder="CHOKE" value={ss.shooters[si]?.choke||""}
                        onChange={e=>updateSquadShooter(sqNum,si,"choke",e.target.value)} style={{...inputStyle,fontSize:11,padding:"7px 8px"}}/>
                  </div>
                ))}
              </div>
            );
          })}
        </>}

        {/* Feedback settings */}
        <div style={sectionStyle}>
          <div style={{fontSize:11,fontWeight:"bold",letterSpacing:3,color:t.textMuted,marginBottom:12}}>FEEDBACK</div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <Toggle label="VIBRATE" value={vibOn} onChange={setVibOn} icon={"\u{1F4F3}"} t={t}/>
            <Toggle label="SOUND" value={sndOn} onChange={setSndOn} icon={"\u{1F514}"} t={t}/>
          </div>
        </div>

        {/* Spreadsheet */}
        <div style={sectionStyle}>
          <div style={{fontSize:11,fontWeight:"bold",letterSpacing:3,color:t.textMuted,marginBottom:12}}>SPREADSHEET</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <button onClick={()=>fileInput.current?.click()} style={{padding:"12px 0",background:t.smallBtnBg,border:`2px solid ${t.border}`,borderRadius:6,color:t.smallBtnText,fontSize:11,fontWeight:"bold",letterSpacing:2,cursor:"pointer",fontFamily:"inherit"}}>{"\u{1F4E5}"} IMPORT</button>
            <button onClick={exportTemplate} style={{padding:"12px 0",background:t.smallBtnBg,border:`2px solid ${t.border}`,borderRadius:6,color:t.smallBtnText,fontSize:11,fontWeight:"bold",letterSpacing:2,cursor:"pointer",fontFamily:"inherit"}}>{"\u{1F4CB}"} TEMPLATE</button>
          </div>
          <div style={{fontSize:10,color:t.textDim,marginTop:8,textAlign:"center",lineHeight:1.5}}>
            Import loads shooters, squads, traps & scores.
            <br/>Auto-detects quick vs event mode.
          </div>
        </div>

        {importMsg && <div style={{textAlign:"center",padding:"10px",marginBottom:12,borderRadius:6,background:importMsg.startsWith("Error")?t.bad:t.good,color:"#fff",fontSize:12,fontWeight:"bold"}}>{importMsg}</div>}

        {/* Past Shoots History */}
        {pastShoots.length > 0 && (
          <div style={sectionStyle}>
            <button onClick={()=>setShowHistory(h=>!h)} style={{width:"100%",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",padding:0,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:11,fontWeight:"bold",letterSpacing:3,color:t.textMuted}}>PAST SHOOTS ({pastShoots.length})</span>
              <span style={{fontSize:14,color:t.textMuted}}>{showHistory?"\u25B2":"\u25BC"}</span>
            </button>
            {showHistory && (
              <div style={{marginTop:10,maxHeight:300,overflowY:"auto"}}>
                {pastShoots.map((shoot,idx) => {
                  const d = new Date(shoot.date);
                  const dateStr = d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
                  const timeStr = d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});
                  const shooters = shoot.mode === "quick"
                    ? shoot.qShooters.map(s => {
                        const h = s.rounds.reduce((a,r)=>a+r.hits,0)+s.hits;
                        const t2 = s.rounds.reduce((a,r)=>a+r.hits+r.misses,0)+s.hits+s.misses;
                        return `${s.name}: ${h}/${t2}`;
                      }).join(", ")
                    : `${shoot.numSquads} squads, ${shoot.numTraps} traps`;
                  return (
                    <div key={shoot.id} style={{padding:"10px 0",borderBottom:`1px solid ${t.border}`,fontSize:11}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div>
                          <div style={{fontWeight:"900",color:t.accent,letterSpacing:1}}>{shoot.eventName}</div>
                          <div style={{color:t.textDim,marginTop:2}}>{dateStr} {timeStr}</div>
                          {shoot.locationName && <div style={{color:t.textDim}}>{shoot.locationName}</div>}
                          {shoot.weather && <div style={{color:t.textDim}}>{shoot.weather}</div>}
                          <div style={{color:t.textMuted,marginTop:2}}>{shooters}</div>
                          <div style={{color:t.textDimmer,marginTop:1,fontSize:9}}>{shoot.device}{shoot.sessionId ? ` \u00B7 ${shoot.sessionId}` : ""}</div>
                        </div>
                        <button onClick={()=>setPastShoots(p=>p.filter((_,i2)=>i2!==idx))} style={{background:"none",border:"none",color:t.bad,cursor:"pointer",fontSize:14,padding:4}}>{"\u2715"}</button>
                      </div>
                    </div>
                  );
                })}
                <button onClick={()=>{if(confirm("Clear all past shoots?"))setPastShoots([]);}} style={{marginTop:10,width:"100%",padding:"8px",background:t.smallBtnBg,border:`2px solid ${t.border}`,borderRadius:6,color:t.bad,fontSize:10,fontWeight:"bold",letterSpacing:2,cursor:"pointer",fontFamily:"inherit"}}>CLEAR ALL HISTORY</button>
              </div>
            )}
          </div>
        )}

        <div style={{textAlign:"center",marginTop:20,fontSize:10,fontWeight:"bold",letterSpacing:4,color:t.textDimmer}}>PULL!</div>
      </div>
    </div>
  );

  // ════════════════════════════
  // ── RANGE / LEADERBOARD SCREEN ──
  // ════════════════════════════
  const isEvent = mode === "event";
  const displayShooters = isEvent ? curShooters : qShooters;
  const displayActiveIdx = isEvent ? activeIdx : qActiveIdx;
  const setDisplayActiveIdx = isEvent ? setActiveIdx : setQActiveIdx;

  return (
    <div ref={appRef} style={pageStyle}>
      <style>{`@keyframes fadeFlash{0%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}100%{opacity:0;transform:translate(-50%,-60%) scale(0.85)}}`}</style>
      <FlashLabel label={flashLabel} t={t}/>
      <div style={{maxWidth:containerMax,margin:"0 auto",width:"100%",boxSizing:"border-box"}}>
        {/* Header — compact in landscape on phones */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:scr.landscape&&!isWide?6:12,borderBottom:`2px solid ${t.border}`,paddingBottom:scr.landscape&&!isWide?4:10}}>
          <button onClick={()=>{saveToHistory();setScreen("setup");}} style={{background:"none",border:"none",color:t.textDim,fontSize:12,fontWeight:"bold",letterSpacing:2,cursor:"pointer",fontFamily:"inherit"}}>{"\u2190"} SETUP</button>
          <div style={{textAlign:"center"}}>
            {eventName&&<div style={{fontSize:11,fontWeight:"900",color:t.accent,letterSpacing:2}}>{eventName}</div>}
            <div style={{fontSize:12,fontWeight:"bold",color:t.textMuted,letterSpacing:3}}>
              {isEvent?`SQ ${curSquad} \u00B7 TRAP ${curTrap}`:`SQ ${qSquad} \u00B7 TRAP ${qTrap}`}
            </div>
            {!(scr.landscape&&!isWide)&&locationName&&<div style={{fontSize:10,fontWeight:"bold",color:t.textDim,marginTop:2}}>{locationName}</div>}
            {!(scr.landscape&&!isWide)&&weather&&<div style={{fontSize:10,fontWeight:"bold",color:t.textDim}}>{weather}</div>}
            {syncOn&&<div style={{fontSize:9,fontWeight:"bold",letterSpacing:2,color:t.good,marginTop:2}}>GROUP {sessionId}</div>}
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <button onClick={toggleSunMode} title="Sun mode" style={{background:"none",border:"none",cursor:"pointer",fontSize:17}}>{sunMode?"\u2600\uFE0F":"\u{1F319}"}</button>
            <button onClick={()=>setVibOn(v=>!v)} title="Vibrate" style={{background:"none",border:"none",cursor:"pointer",fontSize:17,opacity:vibOn?1:0.3}}>{"\u{1F4F3}"}</button>
            <button onClick={()=>setSndOn(s=>!s)} title="Sound" style={{background:"none",border:"none",cursor:"pointer",fontSize:17,opacity:sndOn?1:0.3}}>{"\u{1F514}"}</button>
          </div>
        </div>

        {/* Event mode: Trap & Squad selector */}
        {isEvent && (
          <div style={{marginBottom:14}}>
            {/* Trap selector */}
            <div style={{marginBottom:8}}>
              <div style={{fontSize:10,fontWeight:"bold",letterSpacing:3,color:t.textMuted,marginBottom:6,textAlign:"center"}}>TRAP</div>
              <div style={{display:"flex",gap:4,justifyContent:"center",flexWrap:"wrap"}}>
                {traps.map(tn=>{
                  const hasScores = Object.keys(scores).some(k=>k.endsWith(`-${tn}`)&&scores[k]?.some(s=>s.hits+s.misses>0||s.rounds.length>0));
                  return(
                    <button key={tn} onClick={()=>{setCurTrap(tn);setActiveIdx(0);}} style={{
                      minWidth:40,padding:"6px 10px",
                      background:curTrap===tn?t.tabActive:t.smallBtnBg,
                      border:`2px solid ${curTrap===tn?t.borderActive:t.border}`,
                      borderRadius:6,color:curTrap===tn?t.accent:t.textMuted,
                      fontSize:13,fontWeight:"900",cursor:"pointer",fontFamily:"inherit",
                      position:"relative",
                    }}>
                      T{tn}
                      {hasScores&&<span style={{position:"absolute",top:2,right:2,width:6,height:6,borderRadius:"50%",background:t.good}}/>}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Squad selector */}
            <div>
              <div style={{fontSize:10,fontWeight:"bold",letterSpacing:3,color:t.textMuted,marginBottom:6,textAlign:"center"}}>SQUAD</div>
              <div style={{display:"flex",gap:4,justifyContent:"center",flexWrap:"wrap"}}>
                {squadNums.map(sn=>{
                  const key=`${sn}-${curTrap}`;
                  const hasScores = scores[key]?.some(s=>s.hits+s.misses>0||s.rounds.length>0);
                  return(
                    <button key={sn} onClick={()=>{setCurSquad(sn);setActiveIdx(0);}} style={{
                      minWidth:40,padding:"6px 10px",
                      background:curSquad===sn?t.tabActive:t.smallBtnBg,
                      border:`2px solid ${curSquad===sn?t.borderActive:t.border}`,
                      borderRadius:6,color:curSquad===sn?t.accent:t.textMuted,
                      fontSize:13,fontWeight:"900",cursor:"pointer",fontFamily:"inherit",
                      position:"relative",
                    }}>
                      SQ{sn}
                      {hasScores&&<span style={{position:"absolute",top:2,right:2,width:6,height:6,borderRadius:"50%",background:t.good}}/>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:4,marginBottom:14}}>
          {["range","leaderboard","export"].map(tab=>(
            <button key={tab} onClick={()=>{
              if(tab==="export"){isEvent?handleEventExcel():handleQuickExcel();return;}
              setScreen(tab);
            }} style={{
              padding:"10px 0",background:screen===tab?t.tabActive:t.tabInactive,
              border:`2px solid ${screen===tab?t.borderActive:t.border}`,borderRadius:6,
              color:screen===tab?(sunMode?"#fff":t.accent):t.tabText,
              fontSize:10,fontWeight:"900",letterSpacing:1,cursor:"pointer",fontFamily:"inherit",
            }}>
              {tab==="range"?"\u{1F3AF} RANGE":tab==="leaderboard"?"\u{1F3C6} BOARD":"\u{1F4CA} EXCEL"}
            </button>
          ))}
          <button onClick={takeScreenshot} style={{
            padding:"10px 0",background:t.tabInactive,
            border:`2px solid ${t.border}`,borderRadius:6,
            color:t.tabText,fontSize:10,fontWeight:"900",letterSpacing:1,cursor:"pointer",fontFamily:"inherit",
          }}>{"\u{1F4F7}"} SNAP</button>
          <button onClick={()=>{saveToHistory();setSyncStatus("saved!");setTimeout(()=>setSyncStatus(""),2000);}} style={{
            padding:"10px 0",background:t.saveBg,
            border:`2px solid ${t.saveBorder}`,borderRadius:6,
            color:t.saveText,fontSize:10,fontWeight:"900",letterSpacing:1,cursor:"pointer",fontFamily:"inherit",
          }}>{"\u{1F4BE}"} SAVE</button>
        </div>
        {syncStatus==="saved!"&&<div style={{textAlign:"center",padding:"6px",marginBottom:8,borderRadius:6,background:t.saveBg,border:`1px solid ${t.saveBorder}`,color:t.saveText,fontSize:11,fontWeight:"bold",letterSpacing:2}}>SHOOT SAVED TO HISTORY</div>}

        {/* Content */}
        {screen==="leaderboard"
          ? (isEvent
            ? <EventLeaderboard squads={squadNums.map(n=>({num:n,shooters:getSquadSetup(n).shooters.slice(0,getSquadSetup(n).shooterCount)}))} scores={scores} traps={traps} t={t}/>
            : <EventLeaderboard squads={[{num:qSquad,shooters:qShooters.map(s=>({name:s.name,gun:s.gun,choke:s.choke}))}]} scores={{[`${qSquad}-${qTrap}`]:qShooters}} traps={[qTrap]} t={t}/>
          )
          : displayShooters.map((s,i)=>(
              <ShooterCard key={`${curKey}-${i}`} shooter={s} active={displayActiveIdx===i}
                onSelect={()=>setDisplayActiveIdx(i)}
                onChange={changes=>isEvent?updateEventShooter(i,changes):updateQShooter(i,changes)}
                onSave={()=>isEvent?saveEventRound(i):saveQRound(i)}
                feedbackHit={feedbackHit} feedbackMiss={feedbackMiss}
                setFlashLabel={setFlashLabel} t={t} sun={sunMode}/>
            ))
        }
        <div style={{textAlign:"center",marginTop:8,fontSize:10,fontWeight:"bold",letterSpacing:4,color:t.textDimmer}}>PULL!</div>
      </div>
    </div>
  );
}
