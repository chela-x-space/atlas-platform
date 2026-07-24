export const AI_RADAR_VERSION = "atlas-ai-radar-v1" as const;

export type TechnologyCategory = "model" | "agent" | "framework" | "sdk" | "inference-engine" | "image-generator" | "video-generator" | "speech-model";
export type CapabilityId = "reasoning" | "coding" | "vision" | "speech" | "image" | "video" | "embeddings" | "rag" | "tool-calling" | "agents" | "function-calling" | "structured-output";
export type OfficialLinkType = "website" | "playground" | "api-docs" | "github" | "hugging-face" | "model-card" | "download" | "openrouter" | "ollama" | "comfyui" | "announcement" | "blog" | "paper";
export type ProviderState = "operational" | "degraded" | "unavailable";

export type Provenance = {
  readonly providerId: string;
  readonly sourceUrl: string;
  readonly sourceName: string;
  readonly retrievedAt: string;
  readonly attribution: string;
};

export type OfficialLink = { readonly type: OfficialLinkType; readonly label: string; readonly url: string; readonly provenance: Provenance };
export type TechnologyCapability = { readonly id: CapabilityId; readonly supported: boolean; readonly provenance: Provenance };
export type DeploymentInfo = {
  readonly status: "supported" | "not-supported" | "experimental" | "unknown";
  readonly ramGb: number | null; readonly vramGb: number | null;
  readonly cpu: string | null; readonly gpu: string | null;
  readonly quantization: readonly string[]; readonly exampleHardware: string | null;
  readonly runtimes: readonly string[]; readonly provenance: Provenance;
};
export type Technology = {
  readonly id: string; readonly name: string; readonly developer: string;
  readonly category: TechnologyCategory; readonly summary: string;
  readonly license: string | null; readonly openSource: boolean;
  readonly openWeights: boolean;
  readonly commercial: boolean; readonly apiAvailable: boolean;
  readonly localDeployment: DeploymentInfo; readonly contextWindow: number | null;
  readonly releaseDate: string | null; readonly version: string | null;
  readonly status: "active" | "preview" | "archived";
  readonly tags: readonly string[]; readonly capabilities: readonly TechnologyCapability[];
  readonly links: readonly OfficialLink[]; readonly provenance: readonly Provenance[];
};
export type TechnologyRelease = {
  readonly id: string; readonly technologyId: string; readonly name: string;
  readonly company: string; readonly category: TechnologyCategory;
  readonly version: string; readonly releaseDate: string;
  readonly summary: string; readonly links: readonly OfficialLink[];
  readonly provenance: Provenance;
};
export type BenchmarkResult = {
  readonly id: string; readonly technologyId: string | null;
  readonly technologyName: string; readonly benchmark: string;
  readonly benchmarkVersion: string; readonly score: number;
  readonly unit: "percent"; readonly evaluationDate: string;
  readonly testConfiguration: string; readonly hardware: string | null;
  readonly officialSourceUrl: string; readonly provenance: Provenance;
};
export type TechnologyProvider = {
  readonly id: string; readonly name: string; readonly kind: "registry" | "github-releases" | "benchmark";
  readonly state: ProviderState; readonly checkedAt: string;
  readonly itemCount: number; readonly errorCode?: string; readonly message?: string;
};
export type TechnologySnapshot = { readonly generatedAt: string; readonly partial: boolean; readonly technologies: readonly Technology[] };
export type RadarSnapshot = {
  readonly radarVersion: typeof AI_RADAR_VERSION; readonly generatedAt: string;
  readonly servedAt?: string; readonly partial: boolean; readonly stale: boolean;
  readonly providers: readonly TechnologyProvider[];
  readonly technologies: readonly Technology[]; readonly releases: readonly TechnologyRelease[];
  readonly benchmarks: readonly BenchmarkResult[];
  readonly inputSummary: { readonly technologyCount: number; readonly releaseCount: number; readonly benchmarkCount: number; readonly respondingProviders: number; readonly failedProviders: number };
};

export type RadarFilters = {
  readonly search?: string; readonly company?: string; readonly category?: TechnologyCategory;
  readonly license?: string; readonly openSource?: boolean; readonly api?: boolean;
  readonly local?: boolean; readonly capability?: CapabilityId;
  readonly released?: "week" | "month";
};
