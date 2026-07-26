import type { CollectorExecutionContext,CollectorExecutionResult,CollectorRuntimeAdapter } from "./provider-runtime-contracts";

export class ProviderCollectorRegistry {
  private readonly collectors=new Map<string,CollectorRuntimeAdapter>();
  register(adapter:CollectorRuntimeAdapter){
    if(this.collectors.has(adapter.collectorId))throw new Error(`Collector ${adapter.collectorId} is already registered`);
    this.collectors.set(adapter.collectorId,adapter);return adapter;
  }
  get(collectorId:string){return this.collectors.get(collectorId)??null}
  list(){return [...this.collectors.values()].sort((a,b)=>a.collectorId.localeCompare(b.collectorId))}
}

/** Deterministic, no-network adapter for automated tests. Never registered by production defaults. */
export class SafeTestCollector implements CollectorRuntimeAdapter {
  readonly collectorId="atlas-safe-test";
  readonly collectorVersion="1.0.0";
  readonly supportedProviderKinds=["GOVERNMENT","WEATHER","SPACE","CYBERSECURITY","HEALTH"] as const;
  readonly declaredCapabilities=["EVENTS","PUBLICATIONS","ADVISORIES","FORECASTS","GEOSPATIAL"] as const;
  constructor(private readonly result:CollectorExecutionResult={status:"SUCCEEDED",recordsProduced:0,error:null}){}
  async execute(_context:CollectorExecutionContext){void _context;return structuredClone(this.result)}
}

let collectors:ProviderCollectorRegistry|undefined;
export function getProviderCollectorRegistry(){return collectors??=new ProviderCollectorRegistry()}
