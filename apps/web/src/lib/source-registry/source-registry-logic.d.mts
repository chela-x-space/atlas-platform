import type { ProviderFilter,ProviderHealthCheck,ProviderValidationResult,PublicSourceDirectoryEntry,SourceProvider,InternalProviderView,LifecycleStatus } from "./source-registry-contracts";
export function validateProvider(provider:Partial<SourceProvider>,options?:{forActivation?:boolean}):ProviderValidationResult;
export function validateProviderUniqueness(provider:Pick<SourceProvider,"providerId"|"slug">,providers:readonly Pick<SourceProvider,"providerId"|"slug">[]):import("./source-registry-contracts").ProviderValidationIssue[];
export function canTransitionProvider(from:LifecycleStatus,to:LifecycleStatus):boolean;
export function applyHealthCheck(provider:SourceProvider,check:ProviderHealthCheck):SourceProvider;
export function filterProviders(providers:readonly SourceProvider[],filters?:ProviderFilter):SourceProvider[];
export function isPubliclyDisplayable(provider:SourceProvider):boolean;
export function toInternalProviderView(provider:SourceProvider):InternalProviderView;
export function toPublicSourceEntry(provider:SourceProvider):PublicSourceDirectoryEntry|null;
