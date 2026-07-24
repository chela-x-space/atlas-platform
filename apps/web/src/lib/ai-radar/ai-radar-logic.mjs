export const RADAR_CATEGORIES = Object.freeze(["model","agent","framework","sdk","inference-engine","image-generator","video-generator","speech-model"]);
export const RADAR_CAPABILITIES = Object.freeze(["reasoning","coding","vision","speech","image","video","embeddings","rag","tool-calling","agents","function-calling","structured-output"]);
const PARAMETERS = new Set(["search","company","category","license","openSource","api","local","capability","released","technology","benchmark","limit"]);

export function stableRadarSort(snapshot) {
  return {
    ...snapshot,
    providers: [...snapshot.providers].sort((a,b)=>a.id.localeCompare(b.id)),
    technologies: [...snapshot.technologies].sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id)),
    releases: [...snapshot.releases].sort((a,b)=>Date.parse(b.releaseDate)-Date.parse(a.releaseDate)||a.id.localeCompare(b.id)),
    benchmarks: [...snapshot.benchmarks].sort((a,b)=>a.benchmark.localeCompare(b.benchmark)||Date.parse(b.evaluationDate)-Date.parse(a.evaluationDate)||a.id.localeCompare(b.id)),
  };
}

export function filterTechnologies(items, filters, generatedAt) {
  const now = Date.parse(generatedAt);
  const cutoff = filters.released === "week" ? now-7*86400000 : filters.released === "month" ? now-31*86400000 : null;
  const search = filters.search?.trim().toLowerCase();
  return items.filter((item) => {
    if (search && ![item.name,item.developer,item.summary,...item.tags].join(" ").toLowerCase().includes(search)) return false;
    if (filters.company && item.developer.toLowerCase() !== filters.company.toLowerCase()) return false;
    if (filters.category && item.category !== filters.category) return false;
    if (filters.license && (item.license??"unknown").toLowerCase() !== filters.license.toLowerCase()) return false;
    if (filters.openSource !== undefined && item.openSource !== filters.openSource) return false;
    if (filters.api !== undefined && item.apiAvailable !== filters.api) return false;
    if (filters.local !== undefined && (item.localDeployment.status === "supported") !== filters.local) return false;
    if (filters.capability && !item.capabilities.some((capability)=>capability.id===filters.capability&&capability.supported)) return false;
    if (cutoff !== null && (!item.releaseDate || Date.parse(item.releaseDate)<cutoff || Date.parse(item.releaseDate)>now)) return false;
    return true;
  });
}

function booleanValue(value) {
  if (value === null) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export function parseRadarQuery(params) {
  for (const key of params.keys()) if (!PARAMETERS.has(key)) return {ok:false,code:"INVALID_PARAMETERS",message:`Unsupported parameter: ${key}`};
  const category=params.get("category"),capability=params.get("capability"),released=params.get("released");
  if (category && !RADAR_CATEGORIES.includes(category)) return {ok:false,code:"INVALID_CATEGORY",message:"Unknown technology category"};
  if (capability && !RADAR_CAPABILITIES.includes(capability)) return {ok:false,code:"INVALID_CAPABILITY",message:"Unknown capability"};
  if (released && !["week","month"].includes(released)) return {ok:false,code:"INVALID_RELEASE_WINDOW",message:"released must be week or month"};
  for (const key of ["openSource","api","local"]) if (booleanValue(params.get(key)) === null) return {ok:false,code:"INVALID_BOOLEAN",message:`${key} must be true or false`};
  const rawLimit=params.get("limit"),limit=rawLimit===null?50:Number(rawLimit);
  if (!Number.isInteger(limit)||limit<1||limit>100) return {ok:false,code:"INVALID_LIMIT",message:"limit must be an integer from 1 to 100"};
  return {ok:true,query:{
    search:params.get("search")??undefined,company:params.get("company")??undefined,
    category:category??undefined,license:params.get("license")??undefined,
    openSource:booleanValue(params.get("openSource")),api:booleanValue(params.get("api")),local:booleanValue(params.get("local")),
    capability:capability??undefined,released:released??undefined,
    technology:params.get("technology")??undefined,benchmark:params.get("benchmark")??undefined,limit,
  }};
}
