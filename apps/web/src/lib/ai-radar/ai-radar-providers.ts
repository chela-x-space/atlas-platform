import { fetchJson } from "@/lib/http/fetch-json";
import { fetchText } from "@/lib/http/fetch-text";
import type { BenchmarkResult, OfficialLink, Provenance, TechnologyProvider, TechnologyRelease } from "./ai-radar-contract";
import { GITHUB_RELEASE_TARGETS, VERIFIED_TECHNOLOGIES } from "./ai-radar-registry";

type GithubRelease = { tag_name:string; name:string|null; html_url:string; published_at:string; body:string|null; prerelease:boolean };
const validGithubRelease=(value:unknown):value is GithubRelease=>Boolean(value&&typeof value==="object"&&typeof (value as GithubRelease).tag_name==="string"&&typeof (value as GithubRelease).html_url==="string"&&typeof (value as GithubRelease).published_at==="string");
type Leaderboard = { leaderboards:Array<{name:string;results:Array<Record<string,unknown>>}> };
const validLeaderboard=(value:unknown):value is Leaderboard=>Boolean(value&&typeof value==="object"&&Array.isArray((value as Leaderboard).leaderboards));
const clean=(value:string)=>value.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().slice(0,240);

export async function collectGithubReleases(generatedAt:string):Promise<{items:TechnologyRelease[];provider:TechnologyProvider}> {
  const settled=await Promise.allSettled(GITHUB_RELEASE_TARGETS.map(async target=>{
    const url=`https://api.github.com/repos/${target.repo}/releases/latest`;
    const {data,fetchedAt}=await fetchJson(url,{timeoutMs:6500,maxBytes:1_000_000,revalidate:300,validate:validGithubRelease});
    const technology=VERIFIED_TECHNOLOGIES.find(item=>item.id===target.technologyId)!;
    const provenance:Provenance={providerId:"github-releases",sourceUrl:data.html_url,sourceName:`${target.repo} releases`,retrievedAt:fetchedAt,attribution:`Official ${target.repo} GitHub release`};
    const releaseLink:OfficialLink={type:"github",label:"Official GitHub release",url:data.html_url,provenance};
    return {id:`github:${target.repo}:${data.tag_name}`,technologyId:target.technologyId,name:data.name??`${technology.name} ${data.tag_name}`,company:technology.developer,category:technology.category,version:data.tag_name,releaseDate:data.published_at,summary:clean(data.body??`Official ${technology.name} release ${data.tag_name}.`),links:[releaseLink],provenance} satisfies TechnologyRelease;
  }));
  const items=settled.flatMap(result=>result.status==="fulfilled"?[result.value]:[]);
  const failures=settled.length-items.length;
  return {items,provider:{id:"github-releases",name:"Official GitHub Releases",kind:"github-releases",state:failures===settled.length?"unavailable":failures?"degraded":"operational",checkedAt:generatedAt,itemCount:items.length,...(failures?{errorCode:"UPSTREAM_PARTIAL",message:`${failures} of ${settled.length} official repositories unavailable`}:{})}};
}

export async function collectSweBench(generatedAt:string):Promise<{items:BenchmarkResult[];provider:TechnologyProvider}> {
  const url="https://raw.githubusercontent.com/swe-bench/swe-bench.github.io/master/data/leaderboards.json";
  try {
    const response=await fetchText(url,{timeoutMs:7000,maxBytes:8_000_000,revalidate:0,acceptedContentTypes:["text/plain","application/json"]});
    const parsed:unknown=JSON.parse(response.body);
    if(!validLeaderboard(parsed))throw new Error("Invalid official leaderboard schema");
    const data=parsed,fetchedAt=response.fetchedAt;
    const verified=data.leaderboards.find(board=>board.name==="Verified");
    const items=(verified?.results??[]).flatMap((entry):BenchmarkResult[]=>{
      if(typeof entry.name!=="string"||typeof entry.resolved!=="number"||typeof entry.date!=="string"||typeof entry.folder!=="string")return[];
      const provenance:Provenance={providerId:"swe-bench-official",sourceUrl:url,sourceName:"SWE-bench official leaderboard",retrievedAt:fetchedAt,attribution:"SWE-bench Verified leaderboard"};
      return [{id:`swe-bench-verified:${entry.folder}`,technologyId:null,technologyName:entry.name,benchmark:"SWE-bench",benchmarkVersion:"Verified",score:entry.resolved,unit:"percent",evaluationDate:entry.date,testConfiguration:`Official Verified submission ${entry.folder}`,hardware:null,officialSourceUrl:url,provenance}];
    });
    return {items,provider:{id:"swe-bench-official",name:"SWE-bench Official Leaderboard",kind:"benchmark",state:"operational",checkedAt:generatedAt,itemCount:items.length}};
  } catch {
    return {items:[],provider:{id:"swe-bench-official",name:"SWE-bench Official Leaderboard",kind:"benchmark",state:"unavailable",checkedAt:generatedAt,itemCount:0,errorCode:"UPSTREAM_UNAVAILABLE",message:"Official leaderboard unavailable; no scores substituted"}};
  }
}
