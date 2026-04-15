export const API = {
  leer: "https://default510f9de096154a978ffa0354dd6cd6.c7.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/cb308f7c39e64f98abd933ffe0635ab8/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=PNInfVa9dTDZpAn3R1jKn4r4W24-AlZRgLzSr4sp13Y",
  crearProyecto: "https://default510f9de096154a978ffa0354dd6cd6.c7.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/0b0a66ef75bd47d493a17717efe321e0/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=LJ96twTgG06QrD4V_Wi4LGjdKZC6atCyDGs5ZYty8L8",
  editarProyecto: "https://default510f9de096154a978ffa0354dd6cd6.c7.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/d394039fdc7f48738d735876f868341f/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=tAES6z_yGn0LSuvGXWr_hyjJON4GAkF9xvViuTrGZB8",
  crearAvance: "https://default510f9de096154a978ffa0354dd6cd6.c7.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/cf34aec0e4a0421b9d01db83ce17818c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=wVFuDJh2W6xpWF-70hcMnA4zhasDoafe2yFunWe8FbM",
  crearContrato: "https://default510f9de096154a978ffa0354dd6cd6.c7.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/7c9953ec484d488798d9289f9f1531a6/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=DWZDZC_-STNfCqg2z14mIqMSofaZoSUJl8c3FIm5qBk",
  crearPago: "https://default510f9de096154a978ffa0354dd6cd6.c7.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/61fb6ce094944cdb8a58bfbae6e49a42/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=qxGaJBSMIyZWFsPXpo7mjIb3n4rccrDHJjbbAeKtHqQ",
};

function stripEmpty(obj) {
  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined && v !== "") clean[k] = v;
  }
  return clean;
}

async function apiCall(url, method = "GET", data = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (data) opts.body = JSON.stringify(data);
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function loadAll() {
  const raw = await apiCall(API.leer);
  // Transform SharePoint list items into app format
  const proyectos = (raw.proyectos || []).map(p => ({
    id: p.ID,
    name: p.Title || p.Nombre || "",
    description: p.Descripcion || "",
    responsible: p.Responsable || "",
    startDate: p.FechaInicio ? p.FechaInicio.split("T")[0] : "",
    estimatedEnd: p.FechaEstimadaFin ? p.FechaEstimadaFin.split("T")[0] : "",
    budget: p.Presupuesto || null,
    status: p.Estado?.Value || p.Estado || "En curso",
    phase: p.Fase?.Value || p.Fase || "Ideación",
  }));

  const avances = (raw.avances || []).map(a => ({
    id: a.ID,
    proyectoId: a.ProyectoID,
    date: a.Fecha ? a.Fecha.split("T")[0] : "",
    title: a.Title || a.TituloAvance || "",
    description: a.Descripcion || "",
    nextStep: a.ProximoPaso || "",
    registeredBy: a.RegistradoPor || "",
  }));

  const contratos = (raw.contratos || []).map(c => ({
    id: c.ID,
    proyectoId: c.ProyectoID,
    provider: c.Title || c.Proveedor || "",
    concept: c.Concepto || "",
    value: c.Valor || 0,
  }));

  const pagos = (raw.pagos || []).map(p => ({
    id: p.ID,
    contratoId: p.ContratoID,
    date: p.Fecha ? p.Fecha.split("T")[0] : "",
    amount: p.Monto || 0,
    note: p.Title || p.Nota || "",
  }));

  // Assemble: attach avances and contracts (with payments) to each project
  return proyectos.map(proj => ({
    ...proj,
    advances: avances
      .filter(a => a.proyectoId === proj.id)
      .sort((a, b) => b.date.localeCompare(a.date)),
    contracts: contratos
      .filter(c => c.proyectoId === proj.id)
      .map(c => ({
        ...c,
        payments: pagos
          .filter(p => p.contratoId === c.id)
          .sort((a, b) => b.date.localeCompare(a.date)),
      })),
  }));
}

export async function crearProyecto(data) {
  return apiCall(API.crearProyecto, "POST", stripEmpty({
    nombre: data.name,
    descripcion: data.description,
    responsable: data.responsible,
    fechaInicio: data.startDate,
    fechaEstimadaFin: data.estimatedEnd,
    presupuesto: data.budget,
    estado: data.status,
    fase: data.phase,
  }));
}

export async function editarProyecto(data) {
  return apiCall(API.editarProyecto, "POST", stripEmpty({
    id: data.id,
    nombre: data.name,
    descripcion: data.description,
    responsable: data.responsible,
    fechaEstimadaFin: data.estimatedEnd,
    presupuesto: data.budget,
    estado: data.status,
    fase: data.phase,
  }));
}

export async function crearAvance(proyectoId, data) {
  return apiCall(API.crearAvance, "POST", {
    proyectoId,
    titulo: data.title,
    descripcion: data.description,
    proximoPaso: data.nextStep,
    fecha: data.date,
    registradoPor: data.registeredBy,
  });
}

export async function crearContrato(proyectoId, data) {
  return apiCall(API.crearContrato, "POST", {
    proyectoId,
    proveedor: data.provider,
    concepto: data.concept,
    valor: data.value,
  });
}

export async function crearPago(contratoId, data) {
  return apiCall(API.crearPago, "POST", {
    contratoId,
    fecha: data.date,
    monto: data.amount,
    nota: data.note,
  });
}
