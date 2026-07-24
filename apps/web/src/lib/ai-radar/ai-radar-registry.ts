import type { CapabilityId, DeploymentInfo, OfficialLink, Provenance, Technology, TechnologyCategory } from "./ai-radar-contract";

const RETRIEVED_AT = "2026-07-25T00:00:00.000Z";
const source = (url: string, sourceName: string): Provenance => ({
  providerId: "official-registry", sourceUrl: url, sourceName, retrievedAt: RETRIEVED_AT,
  attribution: `${sourceName} official documentation`,
});
const link = (type: OfficialLink["type"], label: string, url: string, name: string): OfficialLink => ({ type, label, url, provenance: source(url, name) });
const deployment = (status: DeploymentInfo["status"], url: string, runtimes: string[] = []): DeploymentInfo => ({
  status, ramGb: null, vramGb: null, cpu: null, gpu: null, quantization: [],
  exampleHardware: null, runtimes, provenance: source(url, "Official project"),
});
const caps = (ids: CapabilityId[], url: string): Technology["capabilities"] =>
  (["reasoning","coding","vision","speech","image","video","embeddings","rag","tool-calling","agents","function-calling","structured-output"] as CapabilityId[])
    .map((id) => ({ id, supported: ids.includes(id), provenance: source(url, "Official documentation") }));

function technology(input: {
  id: string; name: string; developer: string; category: TechnologyCategory; summary: string;
  url: string; docs?: string; github?: string; hf?: string; license: string | null;
  openSource: boolean; commercial: boolean; api: boolean; local: DeploymentInfo["status"];
  openWeights?: boolean;
  runtimes?: string[]; context?: number | null; releaseDate?: string | null; version?: string | null;
  capabilities: CapabilityId[]; tags: string[];
}): Technology {
  const links = [
    link("website", "Official website", input.url, input.developer),
    ...(input.docs ? [link("api-docs", "Official documentation", input.docs, input.developer)] : []),
    ...(input.github ? [link("github", "GitHub", input.github, input.developer)] : []),
    ...(input.hf ? [link("hugging-face", "Hugging Face", input.hf, input.developer)] : []),
  ];
  return {
    id: input.id, name: input.name, developer: input.developer, category: input.category,
    summary: input.summary, license: input.license, openSource: input.openSource,
    openWeights: input.openWeights ?? false,
    commercial: input.commercial, apiAvailable: input.api,
    localDeployment: deployment(input.local, input.github ?? input.docs ?? input.url, input.runtimes),
    contextWindow: input.context ?? null, releaseDate: input.releaseDate ?? null,
    version: input.version ?? null, status: "active", tags: [...input.tags].sort(),
    capabilities: caps(input.capabilities, input.docs ?? input.url), links,
    provenance: [source(input.url, input.developer)],
  };
}

export const VERIFIED_TECHNOLOGIES: readonly Technology[] = [
  technology({ id:"gpt-5-2",name:"GPT-5.2",developer:"OpenAI",category:"model",summary:"Frontier model family for professional work and long-running agents.",url:"https://openai.com/index/introducing-gpt-5-2/",docs:"https://platform.openai.com/docs/models",license:null,openSource:false,commercial:true,api:true,local:"not-supported",context:null,releaseDate:"2025-12-11",version:"5.2",capabilities:["reasoning","coding","vision","tool-calling","agents","function-calling","structured-output"],tags:["api","frontier","multimodal"] }),
  technology({ id:"claude",name:"Claude",developer:"Anthropic",category:"model",summary:"Anthropic model family for reasoning, coding, vision, and tool use.",url:"https://www.anthropic.com/claude",docs:"https://docs.anthropic.com/en/docs/about-claude/models",license:null,openSource:false,commercial:true,api:true,local:"not-supported",capabilities:["reasoning","coding","vision","tool-calling","agents","function-calling","structured-output"],tags:["api","coding","reasoning"] }),
  technology({ id:"gemini",name:"Gemini",developer:"Google",category:"model",summary:"Google multimodal model family available through the Gemini API.",url:"https://ai.google.dev/gemini-api/docs/models",docs:"https://ai.google.dev/gemini-api/docs",license:null,openSource:false,commercial:true,api:true,local:"not-supported",capabilities:["reasoning","coding","vision","speech","video","tool-calling","function-calling","structured-output"],tags:["api","multimodal","reasoning"] }),
  technology({ id:"deepseek-r1",name:"DeepSeek-R1",developer:"DeepSeek",category:"model",summary:"Open-weight reasoning model family published by DeepSeek.",url:"https://github.com/deepseek-ai/DeepSeek-R1",github:"https://github.com/deepseek-ai/DeepSeek-R1",hf:"https://huggingface.co/deepseek-ai/DeepSeek-R1",license:"MIT",openSource:true,openWeights:true,commercial:true,api:true,local:"supported",runtimes:["Ollama","vLLM","SGLang"],releaseDate:"2025-01-20",version:"R1",capabilities:["reasoning","coding","tool-calling"],tags:["open-weights","reasoning","local"] }),
  technology({ id:"qwen3",name:"Qwen3",developer:"Alibaba Cloud",category:"model",summary:"Open-weight Qwen model family with thinking and non-thinking modes.",url:"https://github.com/QwenLM/Qwen3",github:"https://github.com/QwenLM/Qwen3",hf:"https://huggingface.co/Qwen",license:"Apache-2.0",openSource:true,openWeights:true,commercial:true,api:true,local:"supported",runtimes:["Ollama","vLLM","SGLang"],releaseDate:"2025-04-28",version:"3",capabilities:["reasoning","coding","tool-calling","agents"],tags:["open-weights","reasoning","local"] }),
  technology({ id:"llama-4",name:"Llama 4",developer:"Meta",category:"model",summary:"Meta open-weight multimodal model family.",url:"https://www.llama.com/models/llama-4/",docs:"https://www.llama.com/docs/",hf:"https://huggingface.co/meta-llama",license:"Llama 4 Community License",openSource:false,openWeights:true,commercial:true,api:false,local:"supported",runtimes:["vLLM"],releaseDate:"2025-04-05",version:"4",capabilities:["reasoning","coding","vision"],tags:["open-weights","multimodal","local"] }),
  technology({ id:"mistral",name:"Mistral models",developer:"Mistral AI",category:"model",summary:"Mistral AI model family covering open-weight and hosted models.",url:"https://mistral.ai/models",docs:"https://docs.mistral.ai/",hf:"https://huggingface.co/mistralai",license:null,openSource:false,openWeights:true,commercial:true,api:true,local:"supported",runtimes:["vLLM"],capabilities:["reasoning","coding","vision","tool-calling","function-calling","structured-output"],tags:["api","open-weights","local"] }),
  technology({ id:"flux",name:"FLUX.1",developer:"Black Forest Labs",category:"image-generator",summary:"Text-to-image model family from Black Forest Labs.",url:"https://blackforestlabs.ai/announcing-black-forest-labs/",github:"https://github.com/black-forest-labs/flux",hf:"https://huggingface.co/black-forest-labs",license:null,openSource:true,openWeights:true,commercial:true,api:true,local:"supported",runtimes:["ComfyUI","Python"],releaseDate:"2024-08-01",version:"1",capabilities:["image"],tags:["image","open-weights","local"] }),
  technology({ id:"ollama",name:"Ollama",developer:"Ollama",category:"inference-engine",summary:"Local runtime and model distribution tool.",url:"https://ollama.com/",docs:"https://docs.ollama.com/",github:"https://github.com/ollama/ollama",license:"MIT",openSource:true,commercial:false,api:true,local:"supported",runtimes:["Ollama"],capabilities:["tool-calling","structured-output"],tags:["local","runtime","open-source"] }),
  technology({ id:"vllm",name:"vLLM",developer:"vLLM Project",category:"inference-engine",summary:"Open-source high-throughput LLM inference and serving engine.",url:"https://vllm.ai/",docs:"https://docs.vllm.ai/",github:"https://github.com/vllm-project/vllm",license:"Apache-2.0",openSource:true,commercial:false,api:true,local:"supported",runtimes:["Python","Docker"],capabilities:["tool-calling","structured-output"],tags:["inference","serving","open-source"] }),
  technology({ id:"sglang",name:"SGLang",developer:"SGLang Project",category:"inference-engine",summary:"Serving framework for language and multimodal models.",url:"https://docs.sglang.ai/",docs:"https://docs.sglang.ai/",github:"https://github.com/sgl-project/sglang",license:"Apache-2.0",openSource:true,commercial:false,api:true,local:"supported",runtimes:["Python","Docker"],capabilities:["vision","tool-calling","structured-output"],tags:["inference","serving","open-source"] }),
  technology({ id:"comfyui",name:"ComfyUI",developer:"Comfy Org",category:"framework",summary:"Node-based interface and inference engine for generative media workflows.",url:"https://www.comfy.org/",docs:"https://docs.comfy.org/",github:"https://github.com/Comfy-Org/ComfyUI",license:"GPL-3.0",openSource:true,commercial:false,api:true,local:"supported",runtimes:["ComfyUI","Python"],capabilities:["image","video"],tags:["image","video","nodes","open-source"] }),
  technology({ id:"transformers",name:"Transformers",developer:"Hugging Face",category:"framework",summary:"Open-source library for pretrained text, vision, audio, video, and multimodal models.",url:"https://huggingface.co/docs/transformers/",docs:"https://huggingface.co/docs/transformers/",github:"https://github.com/huggingface/transformers",license:"Apache-2.0",openSource:true,commercial:false,api:false,local:"supported",runtimes:["Python"],capabilities:["reasoning","coding","vision","speech","image","video","embeddings"],tags:["library","multimodal","open-source"] }),
  technology({ id:"openai-codex",name:"Codex",developer:"OpenAI",category:"agent",summary:"OpenAI coding agent available across CLI and cloud workflows.",url:"https://openai.com/codex/",docs:"https://developers.openai.com/codex/",github:"https://github.com/openai/codex",license:"Apache-2.0",openSource:true,commercial:true,api:false,local:"experimental",runtimes:["Node.js"],capabilities:["reasoning","coding","tool-calling","agents"],tags:["agent","coding","cli"] }),
  technology({ id:"claude-code",name:"Claude Code",developer:"Anthropic",category:"agent",summary:"Anthropic agentic coding tool for terminal and development workflows.",url:"https://www.anthropic.com/claude-code",docs:"https://docs.anthropic.com/en/docs/claude-code/overview",github:"https://github.com/anthropics/claude-code",license:null,openSource:false,commercial:true,api:false,local:"experimental",runtimes:["Node.js"],capabilities:["reasoning","coding","tool-calling","agents"],tags:["agent","coding","cli"] }),
].sort((a,b)=>a.id.localeCompare(b.id));

export const GITHUB_RELEASE_TARGETS = [
  { technologyId:"ollama", repo:"ollama/ollama" },
  { technologyId:"vllm", repo:"vllm-project/vllm" },
  { technologyId:"sglang", repo:"sgl-project/sglang" },
  { technologyId:"comfyui", repo:"Comfy-Org/ComfyUI" },
  { technologyId:"transformers", repo:"huggingface/transformers" },
  { technologyId:"openai-codex", repo:"openai/codex" },
] as const;
