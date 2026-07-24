# ATLAS AI Technology Radar v1

## Purpose

AI Technology Radar v1 is a verified technology directory and update feed. It discovers official
AI model, agent, framework, SDK, inference-engine, generative-media, deployment, and benchmark
records. It is not an ATLAS ranking and makes no quality claim from absent data.

ATLAS never fabricates benchmark scores, release dates, hardware requirements, links, context
windows, capabilities, or deployment support.

## Architecture and contracts

`RadarSnapshot` is assembled by a bounded service from independent `TechnologyProvider`
implementations. Canonical contracts include `Technology`, `TechnologyRelease`, `BenchmarkResult`,
`TechnologyCapability`, `DeploymentInfo`, `OfficialLink`, `TechnologyProvider`,
`TechnologySnapshot`, and `RadarSnapshot`. Every fact carries provider, source URL, attribution,
and retrieval timestamp. Output arrays use stable deterministic ordering.

## Providers

- `official-registry`: source-controlled records reviewed against official project websites,
  documentation, model cards, and repositories.
- `github-releases`: live `releases/latest` responses for official Ollama, vLLM, SGLang, ComfyUI,
  Transformers, and OpenAI Codex repositories.
- `swe-bench-official`: the official SWE-bench website repository leaderboard JSON.

The registry is not a web scraper. New providers can implement the same boundary without changing
the canonical contracts. A failed live provider is marked degraded or unavailable; responding
providers remain visible and missing records are never substituted.

## Technologies and official links

The initial verified directory covers hosted model families, open-weight models, coding agents,
image generation, model libraries, node workflows, and local inference servers. Links are emitted
only when configured from an official source: project website, documentation, repository, model
organization, model card, playground, API documentation, or download location.

Unknown facts remain `null` and render as **Not published**. `openSource` and `openWeights` are
separate fields because source availability, weight availability, and OSI licensing are not
interchangeable. License text remains explicit.

## Benchmarks

v1 ingests only the `Verified` split from the official SWE-bench leaderboard. Each result retains:

- benchmark name and exact split/version;
- official submitted system name;
- exact published score and unit;
- evaluation date;
- submission folder/configuration;
- official leaderboard URL and retrieval timestamp.

Different benchmark versions are never merged. No cross-benchmark normalization, brand weighting,
composite score, or ATLAS ranking is calculated. Other requested benchmark families remain absent
until an official machine-readable provider is implemented and validated.

## Deployment and hardware

Deployment status and runtime names come from official projects. RAM, VRAM, CPU, GPU, example
hardware, and quantization are nullable. v1 deliberately does not infer requirements from parameter
counts or community reports. Model-specific hardware can be added later only with official
provenance.

## Filtering and APIs

Routes:

- `GET /api/ai`
- `GET /api/ai/releases`
- `GET /api/ai/benchmarks`
- `GET /api/ai/technology`

Supported technology filters include `search`, `company`, `category`, `license`, `openSource`,
`api`, `local`, `capability`, `released=week|month`, and bounded `limit=1..100`. Release and
benchmark routes also accept exact `technology`; benchmarks accept exact `benchmark`. Unknown
parameters and invalid values return 400 without internal stack traces.

## Cache and outages

Snapshots cache for five minutes. A previously successful snapshot can be served for up to thirty
minutes after a refresh failure and is explicitly marked `stale`; `servedAt` records fallback
delivery time while `generatedAt` remains the original calculation time. Partial snapshots may be
cached. Stale data is never labelled live.

## Interface

`/app/ai` contains the latest official release feed, searchable directory, version-preserved
benchmark table, verified links, feature matrix, release timeline ordering, local deployment
facts, provider state, and limitations. The dashboard shows compact counts for releases,
benchmark updates, agents, and open-source technologies without changing existing activity or
sentiment formulas.

## Limitations and roadmap

Coverage is intentionally finite. GitHub rate limits or source outages can reduce release and
benchmark feeds. The registry is English-language and does not infer facts from marketing names.
No Hugging Face live provider, official-blog RSS provider, HumanEval, LiveCodeBench, MMLU, GPQA,
AIME, MathArena, MMMU, MMBench, image, video, or agent benchmark is displayed until its official
schema and version provenance are separately validated. Future work may add those providers,
technology detail routes, signed registry review metadata, and historical storage without changing
the no-fabrication boundary.
