import { exec } from "child_process";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promisify } from "util";
import fs from 'fs/promises'
import Redis from 'ioredis'

//exec is for run terminal in our system
//promisify so we can await the exec(run it take time)
const run = promisify(exec)
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const resumeQ = async() =>{
    try{
        const scanId = await redis.lindex(`scan:queue`,0)
        if(scanId){
            const status = await redis.get(`scan:${scanId}`)
            if(!status || JSON.parse(status).status === 'pending'){
                handleScan(scanId)
            }
        }
    }catch(err){
        console.error('Failed to resume scan', err)
    }
}
resumeQ()

export interface normalizedResult{
    source: 'snyk' | 'trivy' | 'semgrep';
    severity: string;
    desc: string;
    title?: string
    file?: string;
    line?: string
}

const normalizedSeverity = (source: 'trivy' | 'semgrep', severity: string): string =>{
    let val = severity.toLowerCase()
    if (source === "trivy") {
    if (val === "unknown") return "info";
    return val;
  }
  if (source === "semgrep") {
    if (val === "info") return "info";
    if (val === "warning") return "medium";
    if (val === "error") return "high";
  }
  return "info";
}



const snykScan = async(tmpDir: string, jobId: string, results: normalizedResult[]) =>{
    try{
        const {stdout, stderr} = await run(`snyk test --json`,{
            cwd: tmpDir,
            env: {...process.env, SNYK_TOKEN: process.env.SNYK_TOKEN}
        })

        JSON.parse(stdout).vulnerabilities?.map((vuln: any) =>{
            results.push({
                source: 'snyk',
                title: vuln.title,
                desc: vuln.description,
                severity: vuln.severity,
            })
        })
    }catch(err: any){
        if(err?.stdout){
            JSON.parse(err.stdout).vulnerabilities?.map((vuln: any) =>{
                results.push({
                source: 'snyk',
                title: vuln.title,
                desc: vuln.description,
                severity: vuln.severity,
            })
        })
        }
    }
}

const trivyScan = async(tmpDir:string, jobId: string,  results: normalizedResult[]) =>{
    const {stdout} = await run(`trivy fs --quiet --format json .`, {cwd: tmpDir})
    JSON.parse(stdout).Results[0]?.Vulnerabilities?.map((vuln : any) =>{
            results.push({
            source:'trivy',
            desc: vuln.Description,
            severity: normalizedSeverity( 'trivy' ,vuln.Severity ),
            title: vuln.Title,
        })
    })
}

const semgrepScan = async(tmpDir: string, jobId: string,  results: normalizedResult[]) =>{
    const {stdout} = await run(`semgrep --config p/default --timeout 60 --json --metrics=off --max-memory 200 -j 2`,{cwd: tmpDir})
    JSON.parse(stdout).result?.map((vuln: any) =>{
            results.push({
            source: 'semgrep',
            desc: vuln.extra.message,
            severity: normalizedSeverity( 'semgrep' ,vuln.extra.severity )
        })
    })
}

const handleScan = async(scanId: string) =>{
    try{
        const results: normalizedResult[] = []
        const tmpDir = path.join('/tmp', `scan-${scanId}`)
        const {repoUrl} = await redis.hgetall(`scan:meta:${scanId}`)
        await run(`git clone --depth 1 ${repoUrl} ${tmpDir}`)
        await Promise.all([
            snykScan(tmpDir, scanId, results),
            trivyScan(tmpDir, scanId, results),
            semgrepScan(tmpDir, scanId, results)
        ])
        const raw = await redis.get(`scan:${scanId}`);
        if (raw) {
            const job = JSON.parse(raw);
            job.result = results
            job.status = 'done'
            console.log('setting final result: ' + scanId)
            await redis.set(`scan:${scanId}`, JSON.stringify(job), 'EX', 1800);
        }
        await redis.lpop('scan:queue')
        await redis.del(`scan:meta:${scanId}`)
        await fs.rm(tmpDir, {recursive: true, force: true}).catch(console.error)
        const nextScan = await redis.lindex(`scan:queue`, 0)
        if(nextScan) {
            const nextScanIds = await redis.lrange('scan:queue', 0, -1)
            handleScan(nextScanIds[0])
        }
    }catch(err){
        console.error('Scan crashed', err)
        await redis.set(`scan:${scanId}`, JSON.stringify({status: 'failed', result:[]}), 'EX', 1800)
    }finally{
        await redis.lpop(`scan:queue`)
        await redis.del(`scan:meta:${scanId}`)
        const nextScan = await redis.lindex(`scan:queue`,0)
        if(nextScan){
            handleScan(nextScan)
        }
    }
    
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}


export async function POST(req: NextRequest){
    redis.on('error', (err) =>
  console.error('Redis connection error:', err.message)
);

try {
  await redis.ping();
  console.log('✅ Redis ping succeeded');
} catch (err) {
  console.error('❌ Redis ping failed:');
}

    try{
        const {owner, repo} = await req.json()
        if(!owner || !repo) return NextResponse.json({error: 'repoUrl is required'}, {status: 400})
        const repoUrl = `https://github.com/${owner}/${repo}.git`
         
        const resp = await fetch(`https://api.github.com/repos/${owner}/${repo}`)
        if(!resp.ok){
            return NextResponse.json({error: 'Repository not found or inaccessible'},{status:404, headers:{'Access-Control-Allow-Origin': '*'}})
        }
        const json = await resp.json()
        const sizeKb = parseInt(json.size);
        const sizeMb = Math.ceil(sizeKb / 1024);
        if(sizeMb >200){
            return NextResponse.json({error: 'Sorry!, this repository size is too large to be scanned, please try other repo'}, 
                {status:400, headers:{'Access-Control-Allow-Origin': '*'}})
        }

        const scanId = crypto.randomUUID()
        //queue
        await redis.rpush('scan:queue', scanId); // add to end
        await redis.hmset(`scan:meta:${scanId}`,{
            repoUrl
        })
        const firstInQueue = await redis.lindex('scan:queue' ,0)
        if(firstInQueue !== scanId){
            return NextResponse.json({scanId}, {status: 202, headers:{'Access-Control-Allow-Origin': '*'}})
        }
        //create temporary directory to place the repo clone

        //clone the dir to tmp dir
        await redis.set(`scan:${scanId}`, JSON.stringify({ status: 'pending', result: [] }), 'EX', 1800);
        console.log("Redis Scan  key: " + scanId)
        handleScan(scanId)
        return NextResponse.json({scanId}, {
            status: 200, 
            headers:{
                'Access-Control-Allow-Origin': '*'
            }
        })
        
    }catch(err: any){
        console.error('Scan failed: ',err)
        return NextResponse.json({error: err.message || 'scan failed'}, {
            status: 500,
            headers:{
                'Access-Control-Allow-Origin': '*'
            }
        })
    
    }

}

export async function GET(req: NextRequest) {
    const {searchParams} = new URL(req.url)
    const scanId = searchParams.get('scanId')
    const raw = await redis.get(`scan:${scanId}`);
    if(!raw) return NextResponse.json({error: 'Not Found'}, { status: 404, headers:{'Access-Control-Allow-Origin': '*',} })

    const job = JSON.parse(raw);
    if (job.status === 'done') {
    return NextResponse.json({ data: job.result },{status: 200, headers: {'Access-Control-Allow-Origin': '*',}});
    }
    const queue = await redis.lrange(`scan:queue`, 0 , -1)
    const pos = queue.indexOf(scanId!)
    if(pos === 0) return NextResponse.json({msg: 'Scanning', position: pos+1}, { status: 202 , headers:{'Access-Control-Allow-Origin': '*',}});
    else{
        return NextResponse.json({msg: 'queueing', position: pos+1},{ status: 202 , headers:{'Access-Control-Allow-Origin': '*',}})
    }

}