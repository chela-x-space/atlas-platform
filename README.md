# ATLAS

ATLAS is a deterministic Global Intelligence Platform built from verified, attributable provider data.

The product helps users understand the most important events happening in the world through a situation-driven Dashboard and specialized Timeline, Search, Entity Graph, Risk, Reports, Map, Alerts, and Intelligence API experiences.

## Documentation

- [Vision](docs/VISION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Standards](docs/STANDARDS.md)
- [Decision Log](docs/DECISIONS.md)
- [Intelligence API OpenAPI contract](docs/openapi/atlas-intelligence-api-v1.yaml)

The Markdown documents above are the product and architecture documentation system. The OpenAPI file is the machine-readable public API contract.

## Source Registry administration

The v2.0 Global Source Registry is available only through `/api/internal/source-registry`. Administrative requests require `ATLAS_INTERNAL_ADMIN_TOKEN` as a bearer token. Registry persistence uses `ATLAS_SOURCE_REGISTRY_PATH` when configured; the default local runtime file is suitable for development and a durable mounted path is required for production.

The registry never returns credential references. No Source Registry mutation was added to `/api/v1/*`.

## Evidence Media administration

The v2.1 Evidence Media Platform centralizes media provenance, rights validation, registry history, article references, and deterministic selection at `/api/internal/media`. It uses the same internal bearer token and persists to `ATLAS_EVIDENCE_MEDIA_PATH`; production requires a durable mounted path.

The registry starts empty because no existing media currently satisfies the complete provenance and rights contract. ATLAS does not create placeholders or infer display rights. No media endpoint was added to `/api/v1/*`.

## Provider Runtime administration

The v2.2 Provider Runtime is the governed execution-control layer at `/api/internal/provider-runtime`. It requires `ATLAS_PROVIDER_RUNTIME_PATH` and the existing `ATLAS_INTERNAL_ADMIN_TOKEN`. Without runtime storage configuration, internal runtime endpoints return an explicit configuration error while public pages, Dashboard, Source Registry, and Evidence Media continue normally.

The locale-neutral `/app` dashboard supports English and Thai interface labels. The selected locale is stored in the browser under `atlas.locale`; a valid saved preference takes precedence over device language, and English is the deterministic fallback. Canonical source titles, excerpts, provider identities, URLs, timestamps, attribution, and provenance are not translated or mutated.

Collectors are registered in code. The runtime stores policies, bindings, claims, attempts, observed health, and append-only audit events, but never credentials or collector output as canonical evidence. No providers, bindings, executions, or health outcomes are seeded.

## ATLAS Experience

v3.0 Phase 1 adds a Breaking Intelligence Hero as the first dominant `/app` content. It deterministically projects the existing dashboard ranking and safe Evidence Media selection without changing canonical events, rights controls, dashboard contracts, or public APIs. No sample or fabricated intelligence is permitted, and this presentation layer is not the future Priority Engine.

## Development validation

From `apps/web` run:

```sh
npm run typecheck
npm run lint
npm test
npm run build
```
