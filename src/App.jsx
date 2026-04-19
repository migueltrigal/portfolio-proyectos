import { useState, useMemo, useCallback, useEffect, lazy, Suspense } from "react";
import { loadAll, crearProyecto, editarProyecto, crearAvance, crearContrato, crearPago } from "./api.js";
import { C, font, PHASES, PHASE_INDEX, STATUSES, STATUS_CONFIG, fmtD, btnP, imgUrl } from "./tokens.js";
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
function AuthBar({ isEditor, onLogin, onLogout }) {
  const [show, setShow] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const inpStyle = { width:"100%",padding:"10px 12px",borderRadius:6,fontSize:13,border:`1px solid ${C.border}`,fontFamily:font,fontWeight:500,color:C.textPrimary,background:C.white,outline:"none",boxSizing:"border-box" };
  if (isEditor) return (
    <div style={{ display:"flex",alignItems:"center",gap:10 }}>
      <span style={{ fontSize:10,fontWeight:700,color:"#16a34a",background:"#f0fdf4",border:"1px solid #bbf7d0",padding:"4px 10px",borderRadius:5,textTransform:"uppercase",letterSpacing:"0.06em" }}>● Editor</span>
      <button onClick={onLogout} style={{ background:"none",border:"none",fontSize:11,color:C.textMuted,cursor:"pointer",fontFamily:font,fontWeight:600,textDecoration:"underline" }}>Salir</button>
    </div>
  );
  if (show) return (
    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
      <input type="password" placeholder="Clave" value={pw} onChange={e=>{setPw(e.target.value);setErr(false);}} onKeyDown={e=>{if(e.key==="Enter"){if(pw===EDITOR_KEY){onLogin();setShow(false);setPw("");}else setErr(true);}}} style={{...inpStyle,width:130,padding:"6px 10px",fontSize:12,borderColor:err?"#dc2626":C.border}} autoFocus/>
      <button onClick={()=>{if(pw===EDITOR_KEY){onLogin();setShow(false);setPw("");}else setErr(true);}} style={{...btnP,padding:"6px 14px",fontSize:11}}>Entrar</button>
      <button onClick={()=>{setShow(false);setPw("");setErr(false);}} style={{background:"none",border:"none",fontSize:16,color:C.textMuted,cursor:"pointer",lineHeight:1}}>✕</button>
    </div>
  );
  return <button onClick={()=>setShow(true)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 12px",fontSize:10,fontWeight:700,color:C.textMuted,cursor:"pointer",fontFamily:font}}>🔑 Acceso editor</button>;
}

/* ─── Phase Bar (compact, used in ProjectCard) ─── */
function PhaseBar({phase}){
  const idx=PHASE_INDEX[phase]??0;
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
        <span style={{fontSize:11,fontWeight:700,color:C.teal,background:"#EEF7F8",border:`1px solid #B8DDE2`,padding:"2px 9px",borderRadius:4,letterSpacing:"0.01em"}}>{phase}</span>
        <span style={{fontSize:10,color:C.textMuted,fontWeight:600}}>{idx+1}/{PHASES.length}</span>
      </div>
      <div style={{display:"flex",gap:2}}>
        {PHASES.map((_,i)=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=idx?C.teal:C.borderLight}}/>)}
      </div>
    </div>
  );
}

/* ─── Project Card ─── */
function ProjectCard({project:p,onClick}){
  const sc=STATUS_CONFIG[p.status]||STATUS_CONFIG["En curso"];
  const lastAdv=p.advances[0];
  return(
    <div onClick={onClick} style={{background:C.cardBg,borderRadius:10,cursor:"pointer",border:`1px solid ${C.border}`,overflow:"hidden",transition:"all 0.3s cubic-bezier(.4,0,.2,1)",display:"flex",flexDirection:"column"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 12px 36px ${C.navy}18`;}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}>
      <div style={{height:4,background:sc.color}}/>
      <div style={{padding:"16px 18px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",color:sc.color,background:sc.bg,border:`1px solid ${sc.border}`,padding:"3px 9px",borderRadius:4}}>{sc.icon} {p.status}</span>
          <span style={{fontSize:10,color:C.textMuted,fontWeight:600}}>{lastAdv?fmtD(lastAdv.date):"Sin avances"}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {p.fotoPrincipal
            ? <img src={imgUrl(p.fotoPrincipal,100)} alt="foto" style={{width:44,height:44,borderRadius:6,objectFit:"cover",flexShrink:0,border:`1px solid ${C.border}`}}/>
            : <div style={{width:44,height:44,borderRadius:6,background:"#EEF7F8",border:`1px solid ${C.borderLight}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🌱</div>
          }
          <div>
            <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:"0 0 3px",lineHeight:1.3}}>{p.name}</h3>
            <p style={{fontSize:11,color:C.textSecondary,margin:"0 0 2px",fontWeight:600}}>{p.responsible}</p>
            {p.sede&&<p style={{fontSize:10,color:C.textMuted,margin:0,fontWeight:600}}>📍 {p.sede}</p>}
          </div>
        </div>
      </div>
      <div style={{height:1,background:C.borderLight}}/>
      <div style={{padding:"12px 18px"}}><PhaseBar phase={p.phase}/></div>
      <div style={{height:1,background:C.borderLight}}/>
      {lastAdv&&<div style={{padding:"12px 18px 16px"}}><p style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.textMuted,margin:"0 0 3px"}}>Próximo paso</p><p style={{fontSize:11,color:C.textPrimary,margin:0,lineHeight:1.5,fontWeight:500,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{lastAdv.nextStep}</p></div>}
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
  const stats = useMemo(() => ({
    enCurso:    projects.filter(p => p.status === "En curso").length,
    pausados:   projects.filter(p => p.status === "Pausado").length,
    completados:projects.filter(p => p.status === "Completado").length,
    cancelados: projects.filter(p => p.status === "Cancelado").length,
  }), [projects]);

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
    <div style={{ maxWidth:1100,margin:"0 auto" }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ display:"flex",flexDirection:isMobile?"column":"row",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:20 }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <img src={LOGO_SRC} alt="I+D" style={{ height:isMobile?36:48,flexShrink:0 }} />
            <div>
              <p style={{ fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",color:C.textMuted,margin:"0 0 2px" }}>Innovación y Transformación Digital</p>
              <h1 style={{ fontSize:isMobile?18:22,fontWeight:700,color:C.navy,margin:0,letterSpacing:"-0.01em" }}>Portafolio de Proyectos</h1>
            </div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <AuthBar isEditor={isEditor} onLogin={()=>setIsEditor(true)} onLogout={()=>setIsEditor(false)} />
            {isEditor&&<button onClick={()=>setModal("create")} style={{...btnP,fontSize:12,padding:isMobile?"8px 14px":"10px 24px"}}>+ Nuevo proyecto</button>}
          </div>
        </div>
        <div style={{ display:isMobile?"grid":"flex",gridTemplateColumns:"1fr 1fr",background:C.white,borderRadius:8,border:`1px solid ${C.border}`,overflow:"hidden",marginBottom:16 }}>
          {[{label:"En curso",value:stats.enCurso,accent:"#16a34a"},{label:"Pausados",value:stats.pausados,accent:"#64748b"},{label:"Completados",value:stats.completados,accent:C.teal},{label:"Cancelados",value:stats.cancelados,accent:stats.cancelados>0?"#dc2626":null}].map((s,i)=>(
            <div key={i} style={{ flex:1,padding:isMobile?"10px 12px":"14px 18px",borderRight:isMobile?(i%2===0?`1px solid ${C.borderLight}`:"none"):(i<3?`1px solid ${C.borderLight}`:"none"),borderBottom:isMobile&&i<2?`1px solid ${C.borderLight}`:"none" }}>
              <p style={{ fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.textMuted,margin:"0 0 2px" }}>{s.label}</p>
              <p style={{ fontSize:isMobile?17:20,fontWeight:700,color:s.accent||C.navy,margin:0 }}>{s.value}</p>
            </div>
          ))}
        </div>
        <div style={{ display:"flex",gap:5,flexWrap:isMobile?"nowrap":"wrap",overflowX:isMobile?"auto":"visible",paddingBottom:isMobile?4:0 }}>
          {["Todos",...STATUSES].map(f=>{ const a=filter===f; const cfg=f!=="Todos"?STATUS_CONFIG[f]:null; return(
            <button key={f} onClick={()=>setFilter(f)} style={{ padding:isMobile?"8px 12px":"6px 14px",minHeight:36,borderRadius:6,border:`1px solid ${a?C.navy:C.border}`,background:a?C.navy:C.white,color:a?C.white:C.textSecondary,fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:font,flexShrink:0,whiteSpace:"nowrap" }}>{cfg?cfg.icon+" ":""}{f}</button>
          ); })}
        </div>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill, minmax(300px, 1fr))",gap:14 }}>
        {filtered.map(p=><ProjectCard key={p.id} project={p} onClick={()=>setSelId(p.id)}/>)}
      </div>
      {filtered.length===0&&<div style={{ textAlign:"center",padding:60,color:C.textMuted,fontSize:13 }}>No hay proyectos{filter!=="Todos"?` con estado "${filter}"`:"."}</div>}
      <div style={{ display:"flex",height:4,borderRadius:2,marginTop:32,overflow:"hidden" }}>
        <div style={{ flex:3,background:C.navy }}/><div style={{ flex:1,background:C.orange }}/>
      </div>
    </div>
  );

  return (
    <AuthCtx.Provider value={{ isEditor, isMobile }}>
      <div style={{ minHeight:"100vh",background:C.bg,padding:isMobile?"12px 10px":"22px 16px",fontFamily:font }}>
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
