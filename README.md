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

## Development validation

From `apps/web` run:

```sh
npm run typecheck
npm run lint
npm test
npm run build
```
