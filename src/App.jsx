import { useState, useMemo, useCallback, useEffect, lazy, Suspense } from "react";
import { loadAll, crearProyecto, editarProyecto, crearAvance, crearContrato, crearPago } from "./api.js";
import { C, font, PHASES, PHASE_INDEX, STATUSES, STATUS_CONFIG, INNOVATION_TYPES, fmtD, btnP, imgUrl, formatLocations, radSm, radMd, radLg } from "./tokens.js";

import { AuthCtx, EDITOR_KEY, useAuth } from "./context.js";

const LOGO_SRC = import.meta.env.BASE_URL + "logo.png";

const ProjectDetail  = lazy(() => import("./Detail.jsx"));
const ModalRenderer  = lazy(() => import("./Modals.jsx"));

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = e => setMatches(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

/* ─── Loading Spinner ─── */
function Spinner({ text = "Cargando..." }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:60 }}>
      <div style={{ width:32,height:32,border:`3px solid ${C.borderLight}`,borderTop:`3px solid ${C.teal}`,borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/>
      <p style={{ marginTop:12,fontSize:13,color:C.textMuted,fontWeight:600 }}>{text}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Auth Bar ─── */
function AuthBar({ isEditor, onLogin, onLogout, dark }) {
  const [show, setShow] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const inpStyle = { width:"100%",padding:"10px 12px",borderRadius:radMd,fontSize:13,border:`1px solid ${C.border}`,fontFamily:font,fontWeight:500,color:C.textPrimary,background:C.white,outline:"none",boxSizing:"border-box" };
  if (isEditor) return (
    <div style={{ display:"flex",alignItems:"center",gap:10 }}>
      <span style={{ fontSize:10,fontWeight:700,color:"#16a34a",background:"#f0fdf4",border:"1px solid #bbf7d0",padding:"4px 10px",borderRadius:radSm,textTransform:"uppercase",letterSpacing:"0.06em",display:"inline-flex",alignItems:"center",gap:6 }}><span style={{ width:6,height:6,borderRadius:"50%",background:"#16a34a",display:"inline-block" }}/>Editor</span>
      <button onClick={onLogout} style={{ background:"none",border:"none",fontSize:11,color:dark?"rgba(255,255,255,0.7)":C.textMuted,cursor:"pointer",fontFamily:font,fontWeight:600,textDecoration:"underline" }}>Salir</button>
    </div>
  );
  if (show) return (
    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
      <input type="password" placeholder="Clave" value={pw} onChange={e=>{setPw(e.target.value);setErr(false);}} onKeyDown={e=>{if(e.key==="Enter"){if(pw===EDITOR_KEY){onLogin();setShow(false);setPw("");}else setErr(true);}}} style={{...inpStyle,width:130,padding:"6px 10px",fontSize:12,borderColor:err?"#dc2626":C.border}} autoFocus/>
      <button onClick={()=>{if(pw===EDITOR_KEY){onLogin();setShow(false);setPw("");}else setErr(true);}} style={{...btnP,padding:"6px 14px",fontSize:11}}>Entrar</button>
      <button onClick={()=>{setShow(false);setPw("");setErr(false);}} style={{background:"none",border:"none",fontSize:16,color:dark?"rgba(255,255,255,0.7)":C.textMuted,cursor:"pointer",lineHeight:1}}>✕</button>
    </div>
  );
  return <button onClick={()=>setShow(true)} style={{background:dark?"rgba(255,255,255,0.1)":"none",border:dark?"0.5px solid rgba(255,255,255,0.25)":`1px solid ${C.border}`,borderRadius:radMd,padding:"5px 12px",fontSize:10,fontWeight:700,color:dark?"rgba(255,255,255,0.9)":C.textMuted,cursor:"pointer",fontFamily:font,letterSpacing:"0.06em",textTransform:"uppercase"}}>Acceso editor</button>;
}

/* ─── Phase Bar (compact, used in ProjectCard) ─── */
function PhaseBar({phase}){
  const idx=PHASE_INDEX[phase]??0;
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
        <span style={{fontSize:11,fontWeight:700,color:C.teal,background:"#EEF7F8",border:`1px solid #B8DDE2`,padding:"2px 9px",borderRadius:radSm,letterSpacing:"0.01em"}}>{phase}</span>
        <span style={{fontSize:10,color:C.textMuted,fontWeight:600}}>{idx+1}/{PHASES.length}</span>
      </div>
      <div style={{display:"flex",gap:2}}>
        {PHASES.map((_,i)=><div key={i} style={{flex:1,height:3,borderRadius:radSm,background:i<=idx?C.teal:C.borderLight}}/>)}
      </div>
    </div>
  );
}

/* ─── Project Card ─── */
function ProjectCard({project:p,onClick}){
  const it = INNOVATION_TYPES[p.innovationType] || INNOVATION_TYPES["Otro"];
  const lastAdv = p.advances[0];
  const phaseIdx = PHASE_INDEX[p.phase] ?? 0;
  const pct = ((phaseIdx + 1) / PHASES.length * 100).toFixed(1);
  const loc = formatLocations(p.sede);

  const daysSince = lastAdv
    ? Math.floor((Date.now() - new Date(lastAdv.date + "T12:00:00")) / 86400000)
    : null;
  const stale = daysSince !== null && daysSince > 30;

  return(
    <div onClick={onClick} style={{background:C.white,borderRadius:radMd,cursor:"pointer",border:"1px solid #e2e8f0",overflow:"hidden",transition:"box-shadow 0.2s",display:"flex",height:128}}
      onMouseEnter={e=>e.currentTarget.style.boxShadow="0 2px 8px rgba(15,23,42,0.08)"}
      onMouseLeave={e=>e.currentTarget.style.boxShadow=""}>

      {/* Thumbnail */}
      <div style={{width:110,flexShrink:0,background:`linear-gradient(135deg, ${it.accent}14, ${it.accent}26)`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
        {p.fotoPrincipal
          ? <img src={imgUrl(p.fotoPrincipal,220)} alt="foto" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center",display:"block"}}/>
          : <span style={{fontSize:34,fontWeight:700,color:it.accent,letterSpacing:"-0.02em",fontFamily:font}}>{(p.name||"·").charAt(0).toUpperCase()}</span>
        }
      </div>

      {/* Contenido */}
      <div style={{flex:1,padding:"12px 14px",display:"flex",flexDirection:"column",justifyContent:"space-between",minWidth:0}}>

        {/* Bloque superior: tipo + actividad */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:6}}>
          <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:it.accent,whiteSpace:"nowrap"}}>{it.label}</span>
          {daysSince === null
            ? <span style={{fontSize:10,color:"#94a3b8",whiteSpace:"nowrap"}}>Sin avances</span>
            : stale
              ? <span style={{fontSize:10,fontWeight:600,background:"#fef3c7",color:"#78350f",padding:"2px 7px",borderRadius:radSm,whiteSpace:"nowrap",border:"1px solid #fde68a"}}>Sin cambios {daysSince}d</span>
              : <span style={{fontSize:10,color:"#94a3b8",whiteSpace:"nowrap"}}>Act. hace {daysSince}d</span>
          }
        </div>

        {/* Bloque central: título + responsable */}
        <div style={{marginBottom:8,minWidth:0}}>
          <h3 style={{fontSize:15,fontWeight:500,color:"#0f172a",margin:"0 0 2px",lineHeight:1.25,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{p.name}</h3>
          <p style={{fontSize:11,color:"#64748b",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {p.responsible}{loc ? ` · ${loc}` : ""}
          </p>
        </div>

        {/* Bloque inferior: fase + barra + contador */}
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:10,fontWeight:500,color:"#0f172a",whiteSpace:"nowrap"}}>{p.phase}</span>
          <div style={{flex:1,height:3,background:"#f1f5f9",borderRadius:radSm,overflow:"hidden"}}>
            <div style={{width:`${pct}%`,height:"100%",background:it.barFill,borderRadius:radSm}}/>
          </div>
          <span style={{fontSize:10,fontWeight:500,color:"#64748b",fontVariantNumeric:"tabular-nums",whiteSpace:"nowrap"}}>{phaseIdx+1}/7</span>
        </div>

      </div>
    </div>
  );
}

/* ─── App ─── */
export default function App(){
  const[projects,setProjects]=useState([]);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState(null);
  const[selId,setSelId]=useState(null);
  const[filter,setFilter]=useState("Todos");
  const[modal,setModal]=useState(null);
  const[payContract,setPayContract]=useState(null);
  const[isEditor,setIsEditor]=useState(false);
  const isMobile=useMediaQuery("(max-width: 640px)");

  const reload = useCallback(async () => {
    try {
      const data = await loadAll();
      setProjects(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const sel = projects.find(p => p.id === selId) || null;
  const filtered = useMemo(() => filter === "Todos" ? projects : projects.filter(p => p.status === filter), [filter, projects]);
  const stats = useMemo(() => {
    const activos = projects.filter(p => p.status === "En curso");
    return {
      activos:       activos.length,
      prototipado:   activos.filter(p => p.phase === "Prototipado").length,
      piloto:        activos.filter(p => p.phase === "Piloto").length,
      implementacion:activos.filter(p => p.phase === "Implementación").length,
    };
  }, [projects]);

  const closeModal   = useCallback(() => setModal(null), []);
  const closePayment = useCallback(() => { setModal(null); setPayContract(null); }, []);

  const handleCreateProject = useCallback(async (data) => { await crearProyecto(data);           setModal(null); await reload(); }, [reload]);
  const handleEditProject   = useCallback(async (data) => { await editarProyecto(data);          setModal(null); await reload(); }, [reload]);
  const handleAddAdvance    = useCallback(async (data) => { await crearAvance(selId, data);      setModal(null); await reload(); }, [selId, reload]);
  const handleAddContract   = useCallback(async (data) => { await crearContrato(selId, data);    setModal(null); await reload(); }, [selId, reload]);
  const handleAddPayment    = useCallback(async (data) => { await crearPago(payContract.id, data); setModal(null); setPayContract(null); await reload(); }, [payContract, reload]);

  if (loading) return (
    <div style={{ minHeight:"100vh",background:C.bg,fontFamily:font,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <Spinner text="Cargando portafolio..." />
    </div>
  );

  if (error) return (
    <div style={{ minHeight:"100vh",background:C.bg,fontFamily:font,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ textAlign:"center",padding:40 }}>
        <p style={{ fontSize:16,color:"#dc2626",fontWeight:700,marginBottom:8 }}>Error al cargar datos</p>
        <p style={{ fontSize:13,color:C.textSecondary,marginBottom:16 }}>{error}</p>
        <button onClick={()=>{ setLoading(true); setError(null); reload(); }} style={btnP}>Reintentar</button>
      </div>
    </div>
  );

  const content = sel ? (
    <Suspense fallback={<Spinner text="Cargando detalle..." />}>
      <ProjectDetail
        project={sel}
        onBack={()=>{ setSelId(null); setModal(null); }}
        onEdit={()=>setModal("edit")}
        onAddAdvance={()=>setModal("advance")}
        onAddContract={()=>setModal("contract")}
        onAddPayment={c=>{ setPayContract(c); setModal("payment"); }}
      />
    </Suspense>
  ) : (
    <div style={{ padding:isMobile?"12px 10px":"22px 16px" }}>
      <div style={{ maxWidth:1100,margin:"0 auto" }}>

        {/* Header sobre el azul */}
        <div style={{ display:"flex",flexDirection:isMobile?"column":"row",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:20 }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ background:C.white,borderRadius:radMd,padding:"4px 6px",flexShrink:0,display:"flex",alignItems:"center" }}>
              <img src={LOGO_SRC} alt="I+D" style={{ height:isMobile?30:40,display:"block" }} />
            </div>
            <div>
              <h1 style={{ fontSize:isMobile?22:28,fontWeight:700,color:"#FFD40A",margin:0,letterSpacing:"-0.01em" }}>Portafolio de Proyectos de Innovación</h1>
            </div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <AuthBar isEditor={isEditor} onLogin={()=>setIsEditor(true)} onLogout={()=>setIsEditor(false)} dark />
            {isEditor&&<button onClick={()=>setModal("create")} style={{...btnP,fontSize:12,padding:isMobile?"8px 14px":"10px 24px"}}>+ Nuevo proyecto</button>}
          </div>
        </div>

        {/* KPIs — isla blanca */}
        <div style={{ background:C.white,borderRadius:radLg,overflow:"hidden",marginBottom:16 }}>
          <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)" }}>
            {[
              {label:"Activos",           value:stats.activos,        accent:C.teal},
              {label:"En prototipado",    value:stats.prototipado,    accent:null},
              {label:"En piloto",         value:stats.piloto,         accent:null},
              {label:"En implementación", value:stats.implementacion, accent:null},
            ].map((s,i)=>(
              <div key={i} style={{ padding:isMobile?"12px 14px":"16px 24px",borderRight:(!isMobile&&i<3)||(isMobile&&i%2===0)?`1px solid ${C.borderLight}`:"none",borderBottom:isMobile&&i<2?`1px solid ${C.borderLight}`:"none" }}>
                <p style={{ fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.textMuted,margin:"0 0 4px" }}>{s.label}</p>
                <p style={{ fontSize:isMobile?26:30,fontWeight:500,color:s.accent||C.textPrimary,margin:0,lineHeight:1 }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filtros — flotando sobre el azul */}
        <div style={{ display:"flex",gap:5,flexWrap:isMobile?"nowrap":"wrap",overflowX:isMobile?"auto":"visible",paddingBottom:isMobile?4:0,marginBottom:20 }}>
          {["Todos",...STATUSES].map(f=>{ const a=filter===f; const cfg=f!=="Todos"?STATUS_CONFIG[f]:null; return(
            <button key={f} onClick={()=>setFilter(f)} style={{ padding:isMobile?"8px 12px":"6px 14px",minHeight:36,borderRadius:radMd,border:a?"none":"0.5px solid rgba(255,255,255,0.25)",background:a?C.white:"rgba(255,255,255,0.1)",color:a?C.dark:C.white,fontWeight:a?500:700,fontSize:11,cursor:"pointer",fontFamily:font,flexShrink:0,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:7 }}>{cfg&&<span style={{ width:7,height:7,borderRadius:"50%",background:cfg.color,display:"inline-block" }}/>}{f}</button>
          ); })}
        </div>

        {/* Grid de tarjetas */}
        <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill, minmax(300px, 1fr))",gap:14 }}>
          {filtered.map(p=><ProjectCard key={p.id} project={p} onClick={()=>setSelId(p.id)}/>)}
        </div>
        {filtered.length===0&&<div style={{ textAlign:"center",padding:60,color:"rgba(255,255,255,0.4)",fontSize:13 }}>No hay proyectos{filter!=="Todos"?` con estado "${filter}"`:"."}</div>}
        <div style={{ display:"flex",height:4,borderRadius:radSm,marginTop:32,overflow:"hidden" }}>
          <div style={{ flex:3,background:C.navy }}/><div style={{ flex:1,background:C.orange }}/>
        </div>

      </div>
    </div>
  );

  return (
    <AuthCtx.Provider value={{ isEditor, isMobile }}>
      <div style={{ minHeight:"100vh",background:C.dark,fontFamily:font }}>
        {content}
        {modal && (
          <Suspense fallback={null}>
            <ModalRenderer
              modal={modal} sel={sel} payContract={payContract}
              onCreateProject={handleCreateProject} onEditProject={handleEditProject}
              onAddAdvance={handleAddAdvance} onAddContract={handleAddContract}
              onAddPayment={handleAddPayment}
              onCancel={closeModal} onCancelPayment={closePayment}
            />
          </Suspense>
        )}
      </div>
    </AuthCtx.Provider>
  );
}
