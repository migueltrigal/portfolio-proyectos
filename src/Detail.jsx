import { useState } from "react";
import { C, font, PHASES, PHASE_INDEX, STATUS_CONFIG, fmt, fmtS, fmtD, sumPay, sumVal, btnS, imgUrl, radSm, radMd, radLg } from "./tokens.js";
import { useAuth } from "./context.js";

function Section({title,accent,action,children,style:sx}){return(<div style={{background:C.cardBg,borderRadius:radLg,border:`1px solid ${C.border}`,overflow:"hidden",...sx}}>{title&&<div style={{padding:"13px 24px",borderBottom:`1px solid ${C.border}`,background:"#F7F9FB",display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:8}}>{accent&&<div style={{width:3,height:16,borderRadius:radSm,background:accent}}/>}<h3 style={{margin:0,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:C.textSecondary,fontFamily:font}}>{title}</h3></div>{action}</div>}{children}</div>);}

function PhaseStepper({currentPhase}){
  const{isMobile}=useAuth();
  const idx=PHASE_INDEX[currentPhase]??0;
  return(
    <div style={{overflowX:isMobile?"auto":"visible",WebkitOverflowScrolling:"touch",margin:isMobile?"0 -16px":0,padding:isMobile?"0 16px 4px":0}}>
    <div style={{display:"flex",alignItems:"flex-start",width:"100%",minWidth:isMobile?560:"auto"}}>
      {PHASES.map((p,i)=>{
        const done=i<idx,active=i===idx;
        return(
          <div key={p} style={{display:"flex",alignItems:"center",flex:i<PHASES.length-1?1:"none"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",zIndex:1}}>
              <div style={{width:active?34:20,height:active?34:20,borderRadius:"50%",background:done||active?C.teal:"#E8ECF2",border:active?`3px solid ${C.teal}55`:"2px solid transparent",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:active?`0 0 0 5px ${C.teal}18`:"none",flexShrink:0,transition:"all 0.2s"}}>
                {done&&<span style={{color:C.white,fontSize:10,fontWeight:800}}>{i+1}</span>}
                {active&&<span style={{color:C.white,fontSize:11,fontWeight:800}}>{i+1}</span>}
                {!done&&!active&&<span style={{color:"#94a3b8",fontSize:10,fontWeight:700}}>{i+1}</span>}
              </div>
              <span style={{fontSize:active?11:10,fontWeight:active?800:600,color:active?C.teal:done?"#267B8Aaa":C.textMuted,marginTop:6,whiteSpace:"nowrap",letterSpacing:active?"0.01em":0}}>{p}</span>
            </div>
            {i<PHASES.length-1&&<div style={{flex:1,height:2,minWidth:8,background:done?C.teal:"#E2E8F0",margin:"0 3px",marginBottom:22}}/>}
          </div>
        );
      })}
    </div>
    </div>
  );
}

function ContractBlock({contract,onAddPayment}){
  const{isEditor,isMobile}=useAuth();
  const paid=contract.payments.reduce((s,p)=>s+p.amount,0);
  const pct=Math.min((paid/contract.value)*100,100);
  const pending=contract.value-paid;
  const[open,setOpen]=useState(false);
  return(
    <div style={{border:`1px solid ${C.borderLight}`,borderRadius:radMd,overflow:"hidden",marginBottom:10}}>
      <div onClick={()=>setOpen(!open)} style={{padding:"14px 18px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",background:open?"#F7F9FB":C.white}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{fontSize:13,fontWeight:700,color:C.navy}}>{contract.provider}</span><span style={{fontSize:10,color:C.textMuted}}>·</span><span style={{fontSize:11,color:C.textSecondary,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{contract.concept}</span></div>
          <div style={{display:"flex",gap:16,fontSize:11,fontWeight:700,flexWrap:"wrap"}}><span style={{color:C.textSecondary}}>Valor: {fmt(contract.value)}</span><span style={{color:C.teal}}>Pagado: {fmt(paid)}</span><span style={{color:pending>0?C.orange:"#16a34a"}}>Pendiente: {fmt(pending)}</span></div>
          <div style={{height:4,background:C.borderLight,borderRadius:radSm,marginTop:8}}><div style={{height:"100%",borderRadius:radSm,width:`${pct}%`,background:pct>=100?"#16a34a":C.teal}}/></div>
        </div>
        <span style={{fontSize:16,color:C.textMuted,marginLeft:12,transform:open?"rotate(180deg)":"",transition:"transform 0.2s"}}>▾</span>
      </div>
      {open&&<div style={{borderTop:`1px solid ${C.borderLight}`}}>
        {!isMobile&&<div style={{display:"grid",gridTemplateColumns:"100px 1fr 120px",padding:"8px 18px",background:"#F7F9FB",borderBottom:`1px solid ${C.borderLight}`}}>
          {["Fecha","Nota","Monto"].map((h,i)=><span key={h} style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:C.textMuted,textAlign:i===2?"right":"left"}}>{h}</span>)}
        </div>}
        {contract.payments.map(pay=>(
          isMobile
            ?<div key={pay.id} style={{padding:"10px 18px",borderBottom:`1px solid ${C.bg}`,background:C.white}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                  <span style={{fontSize:10,color:C.textMuted,fontWeight:600}}>{fmtD(pay.date)}</span>
                  <span style={{fontSize:13,fontWeight:700,color:C.navy}}>{fmt(pay.amount)}</span>
                </div>
                {pay.note&&<span style={{fontSize:11,color:C.textSecondary,fontWeight:500}}>{pay.note}</span>}
              </div>
            :<div key={pay.id} style={{display:"grid",gridTemplateColumns:"100px 1fr 120px",padding:"10px 18px",borderBottom:`1px solid ${C.bg}`,alignItems:"center",background:C.white}}>
                <span style={{fontSize:11,color:C.textSecondary,fontWeight:600}}>{fmtD(pay.date)}</span>
                <span style={{fontSize:12,color:C.textPrimary,fontWeight:500}}>{pay.note||"—"}</span>
                <span style={{fontSize:12,fontWeight:700,color:C.navy,textAlign:"right"}}>{fmt(pay.amount)}</span>
              </div>
        ))}
        {contract.payments.length===0&&<p style={{padding:16,textAlign:"center",color:C.textMuted,fontSize:12}}>Sin pagos.</p>}
        {isEditor&&<div style={{padding:"10px 18px",background:"#F7F9FB",borderTop:`1px solid ${C.borderLight}`}}><button onClick={e=>{e.stopPropagation();onAddPayment(contract);}} style={{padding:"7px 16px",borderRadius:radMd,border:"none",cursor:"pointer",background:C.teal,color:C.white,fontWeight:700,fontSize:11,fontFamily:font}}>+ Registrar pago</button></div>}
      </div>}
    </div>
  );
}

export default function ProjectDetail({project:p,onBack,onEdit,onAddAdvance,onAddContract,onAddPayment}){
  const{isEditor,isMobile}=useAuth();
  const[tab,setTab]=useState("timeline");
  const sc=STATUS_CONFIG[p.status]||STATUS_CONFIG["En curso"];
  const paid=sumPay(p.contracts);const contracted=sumVal(p.contracts);const lastAdv=p.advances[0];const hasBudget=p.budget!=null;
  return(
    <div style={{maxWidth:840,margin:"0 auto"}}>
      <button onClick={onBack} style={{...btnS,fontSize:12,padding:"8px 18px",marginBottom:16}}>← Proyectos</button>
      <Section title="Información general" accent={sc.color} action={isEditor?<button onClick={onEdit} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:radMd,padding:"5px 14px",fontSize:11,fontWeight:700,color:C.textSecondary,cursor:"pointer",fontFamily:font,textTransform:"uppercase",letterSpacing:"0.06em"}}>Editar</button>:null} style={{marginBottom:16}}>
        <div style={{padding:isMobile?"16px 16px 0":"24px 24px 0"}}><div style={{display:"flex",flexDirection:isMobile?"column":"row",gap:16,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:isMobile?"auto":250}}>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
              <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",color:sc.color,background:sc.bg,border:`1px solid ${sc.border}`,padding:"4px 10px",borderRadius:radSm,display:"inline-flex",alignItems:"center",gap:6}}><span style={{width:6,height:6,borderRadius:"50%",background:sc.color,display:"inline-block"}}/>{p.status}</span>
              <span style={{fontSize:10,fontWeight:700,color:C.teal,background:"#EEF7F8",padding:"4px 10px",borderRadius:radSm,textTransform:"uppercase"}}>Fase: {p.phase}</span>
            </div>
            <h1 style={{fontSize:21,fontWeight:700,color:C.navy,margin:"0 0 6px",lineHeight:1.25}}>{p.name}</h1>
            <p style={{fontSize:12,color:C.textSecondary,margin:"0 0 4px",fontWeight:600}}>Responsable: {p.responsible}</p>
            {p.sede&&<p style={{fontSize:11,color:C.textMuted,margin:"0 0 4px",fontWeight:600}}>Sede: {p.sede}</p>}
            {p.linkBrightIdea&&<p style={{margin:"0 0 12px"}}><a href={p.linkBrightIdea} target="_blank" rel="noopener noreferrer" style={{fontSize:11,fontWeight:700,color:C.teal,textDecoration:"none"}}>Ver en BrightIdea ↗</a></p>}
            <p style={{fontSize:13,color:C.textPrimary,margin:0,lineHeight:1.6}}>{p.description}</p>
          </div>
          {p.fotoPrincipal&&
            <img src={imgUrl(p.fotoPrincipal, 600)} alt="foto principal" loading="eager" style={{width:isMobile?"100%":200,height:isMobile?200:160,objectFit:"contain",background:C.bg,borderRadius:radMd,flexShrink:0,display:"block",border:`1px solid ${C.border}`,order:isMobile?-1:0}}/>
          }
        </div></div>
        <div style={{height:1,background:C.borderLight,margin:"22px 0 0"}}/>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(auto-fit, minmax(120px, 1fr))"}}>
          {[{label:"Inicio",value:fmtD(p.startDate)},{label:"Fin estimado",value:fmtD(p.estimatedEnd)},...(hasBudget?[{label:"Presupuesto",value:fmtS(p.budget)}]:[]),{label:"Contratado",value:fmtS(contracted)},{label:"Pagado",value:fmtS(paid),accent:hasBudget&&paid>p.budget?"#dc2626":null},{label:"Últ. actualización",value:lastAdv?fmtD(lastAdv.date):"—"}].map((s,i)=>(
            <div key={i} style={{padding:"14px 18px",borderRight:`1px solid ${C.borderLight}`,borderBottom:`1px solid ${C.borderLight}`}}>
              <p style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.textMuted,margin:"0 0 3px"}}>{s.label}</p>
              <p style={{fontSize:16,fontWeight:700,color:s.accent||C.navy,margin:0}}>{s.value}</p>
            </div>
          ))}
        </div>
        <div style={{padding:"18px 24px"}}><PhaseStepper currentPhase={p.phase}/></div>
      </Section>
      {lastAdv&&<Section title="Próximo paso" accent={C.orange} style={{marginBottom:16}}><div style={{padding:"16px 24px",display:"flex",gap:14,alignItems:"flex-start"}}><div style={{width:30,height:30,borderRadius:radSm,flexShrink:0,background:"#FFF5EE",border:"1px solid #FDDCBE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:C.orange,fontWeight:800}}>→</div><p style={{fontSize:13,color:C.navy,margin:0,lineHeight:1.55,fontWeight:600}}>{lastAdv.nextStep}</p></div></Section>}
      <div style={{display:"flex",marginBottom:16,background:C.white,borderRadius:radMd,border:`1px solid ${C.border}`,overflow:"hidden"}}>
        {[{key:"timeline",label:"Avances",count:p.advances.length},{key:"finance",label:"Contratos y pagos",count:p.contracts.length}].map((t,i)=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{flex:1,padding:"12px 20px",borderRight:i===0?`1px solid ${C.border}`:"none",background:tab===t.key?C.navy:C.white,color:tab===t.key?C.white:C.textSecondary,fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:font,border:"none",textTransform:"uppercase",letterSpacing:"0.08em"}}>{t.label} · {t.count}</button>
        ))}
      </div>
      {tab==="timeline"&&<>{isEditor&&<button onClick={onAddAdvance} style={{padding:"10px 24px",borderRadius:radMd,border:"none",cursor:"pointer",background:C.navy,color:C.white,fontWeight:700,fontSize:12,fontFamily:font,marginBottom:16}}>+ Registrar avance</button>}
        <div style={{position:"relative",paddingLeft:30}}><div style={{position:"absolute",left:10,top:10,bottom:10,width:2,background:C.border}}/>
          {p.advances.map((adv,i)=>(
            <div key={adv.id} style={{position:"relative",marginBottom:16}}>
              <div style={{position:"absolute",left:-25,top:24,width:i===0?16:10,height:i===0?16:10,borderRadius:"50%",background:i===0?C.teal:"#C5CDD8",border:`3px solid ${C.bg}`,boxShadow:i===0?`0 0 0 3px ${C.teal}20`:"none",transform:i===0?"translate(-3px,-3px)":""}}/>
              <Section><div style={{padding:"10px 20px",background:i===0?"#EEF7F8":"#F7F9FB",borderBottom:`1px solid ${C.borderLight}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:11,fontWeight:700,color:i===0?C.teal:C.textSecondary}}>{fmtD(adv.date)}</span><span style={{fontSize:10,color:C.textMuted,fontWeight:600}}>{adv.registeredBy}</span></div>
                <div style={{padding:"16px 20px"}}><h4 style={{fontSize:13,fontWeight:700,color:C.navy,margin:"0 0 8px",lineHeight:1.35}}>{adv.title}</h4><p style={{fontSize:12,color:C.textSecondary,margin:"0 0 14px",lineHeight:1.6}}>{adv.description}</p>{adv.fotoEvidencia&&<img src={imgUrl(adv.fotoEvidencia, 900)} alt="evidencia" loading="lazy" style={{width:"100%",height:240,objectFit:"contain",background:C.bg,borderRadius:radMd,border:`1px solid ${C.border}`,display:"block"}}/>}</div>
                <div style={{padding:"12px 20px",background:"#F7F9FB",borderTop:`1px solid ${C.borderLight}`}}><p style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.textMuted,margin:"0 0 3px"}}>Próximo paso</p><p style={{fontSize:11,color:C.textPrimary,margin:0,lineHeight:1.5,fontWeight:600}}>{adv.nextStep}</p></div>
              </Section>
            </div>
          ))}
          {p.advances.length===0&&<p style={{color:C.textMuted,fontSize:13,padding:"20px 0"}}>No hay avances.</p>}
        </div>
      </>}
      {tab==="finance"&&<>
        <Section title="Resumen financiero" accent={C.teal} style={{marginBottom:16}}>
          <div style={{display:"grid",gridTemplateColumns:hasBudget?"1fr 1fr 1fr 1fr":"1fr 1fr 1fr"}}>
            {[...(hasBudget?[{label:"Presupuesto",value:fmt(p.budget),color:C.navy}]:[]),{label:"Contratado",value:fmt(contracted),color:C.textSecondary},{label:"Pagado",value:fmt(paid),color:C.teal},{label:"Pendiente",value:fmt(contracted-paid),color:contracted-paid>0?C.orange:"#16a34a"}].map((s,i,arr)=>(
              <div key={i} style={{padding:"16px 20px",textAlign:"center",borderRight:i<arr.length-1?`1px solid ${C.borderLight}`:"none"}}>
                <p style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.textMuted,margin:"0 0 3px"}}>{s.label}</p>
                <p style={{fontSize:17,fontWeight:700,color:s.color,margin:0}}>{s.value}</p>
              </div>
            ))}
          </div>
          {hasBudget&&<div style={{padding:"12px 20px",borderTop:`1px solid ${C.borderLight}`}}>
            <div style={{display:"flex",gap:4,marginBottom:4}}>
              <div style={{height:6,borderRadius:radSm,background:C.teal,flex:`${paid/p.budget*100} 0 0`}}/>
              <div style={{height:6,borderRadius:radSm,background:`${C.teal}44`,flex:`${(contracted-paid)/p.budget*100} 0 0`}}/>
              <div style={{height:6,borderRadius:radSm,background:C.borderLight,flex:`${Math.max(p.budget-contracted,0)/p.budget*100} 0 0`}}/>
            </div>
            <div style={{display:"flex",gap:16,fontSize:10,fontWeight:600,color:C.textSecondary}}>
              <span><span style={{display:"inline-block",width:8,height:8,borderRadius:radSm,background:C.teal,marginRight:4,verticalAlign:"middle"}}/>Pagado</span>
              <span><span style={{display:"inline-block",width:8,height:8,borderRadius:radSm,background:`${C.teal}44`,marginRight:4,verticalAlign:"middle"}}/>Contratado</span>
              <span><span style={{display:"inline-block",width:8,height:8,borderRadius:radSm,background:C.borderLight,marginRight:4,verticalAlign:"middle"}}/>Disponible</span>
            </div>
          </div>}
        </Section>
        {isEditor&&<button onClick={onAddContract} style={{padding:"10px 24px",borderRadius:radMd,border:"none",cursor:"pointer",background:C.teal,color:C.white,fontWeight:700,fontSize:12,fontFamily:font,marginBottom:16}}>+ Nuevo contrato / ODS</button>}
        {p.contracts.map(c=><ContractBlock key={c.id} contract={c} onAddPayment={onAddPayment}/>)}
        {p.contracts.length===0&&<p style={{color:C.textMuted,fontSize:13,textAlign:"center",padding:20}}>No hay contratos.</p>}
      </>}
    </div>
  );
}
