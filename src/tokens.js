export const C = {
  navy: "#0E2841", teal: "#267B8A", orange: "#E97132", white: "#FFFFFF",
  bg: "#F4F6F8", cardBg: "#FFFFFF", border: "#DDE3EA", borderLight: "#EEF1F5",
  textPrimary: "#0E2841", textSecondary: "#4A5E74", textMuted: "#8899AB",
};
export const font = "'Aptos', 'Segoe UI', -apple-system, sans-serif";

export const PHASES = ["Ideación","Iniciación","Prototipado","Piloto","Implementación","Entrega","Seguimiento"];
export const PHASE_INDEX = Object.fromEntries(PHASES.map((p, i) => [p, i]));
export const STATUSES = ["En curso","Pausado","Completado","Cancelado"];
export const STATUS_CONFIG = {
  "En curso":    { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", icon: "●" },
  "Pausado":     { color: "#64748b", bg: "#f1f5f9", border: "#cbd5e1", icon: "❚❚" },
  "Completado":  { color: C.teal,    bg: "#EEF7F8", border: "#B8DDE2", icon: "✓" },
  "Cancelado":   { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", icon: "✕" },
};

export const fmt  = n => "$" + n.toLocaleString("es-CO");
export const fmtS = n => n == null ? "—" : "$" + (n >= 1e6 ? (n/1e6).toFixed(1)+"M" : (n/1e3).toFixed(0)+"K");
export const fmtD = d => {
  if (!d) return "—";
  const dt = new Date(d+"T12:00:00");
  const m = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${dt.getDate()} ${m[dt.getMonth()]} ${dt.getFullYear()}`;
};
export const sumPay = cs => cs.reduce((s,c) => s + c.payments.reduce((ss,p) => ss + p.amount, 0), 0);
export const sumVal = cs => cs.reduce((s,c) => s + c.value, 0);

export const inp  = { width:"100%",padding:"10px 12px",borderRadius:6,fontSize:13,border:`1px solid ${C.border}`,fontFamily:font,fontWeight:500,color:C.textPrimary,background:C.white,outline:"none",boxSizing:"border-box" };
export const lbl  = { fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.textMuted,display:"block",marginBottom:5 };
export const btnP = { padding:"10px 24px",borderRadius:6,border:"none",cursor:"pointer",background:C.navy,color:C.white,fontWeight:700,fontSize:13,fontFamily:font };
export const btnS = { padding:"10px 24px",borderRadius:6,border:`1px solid ${C.border}`,background:C.white,color:C.textSecondary,fontWeight:700,fontSize:13,fontFamily:font,cursor:"pointer" };

export function imgUrl(src, width = 800) {
  if (!src || !src.includes("raw.githubusercontent.com")) return src;
  return `https://wsrv.nl/?url=${encodeURIComponent(src)}&output=webp&w=${width}&q=85`;
}
