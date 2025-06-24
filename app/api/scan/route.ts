import { exec } from "child_process";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promisify } from "util";
import fs from 'fs/promises'

//exec is for run terminal in our system
//promisify so we can await the exec(run it take time)
const run = promisify(exec)

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

const scanJobs: Record<string, {status: 'done' | 'pending' | 'failed', result: normalizedResult[]}> ={}

const snykScan = async(tmpDir: string, jobId: string) =>{
    try{
        const {stdout, stderr} = await run(`snyk test --json`,{
            cwd: tmpDir,
            env: {...process.env, SNYK_TOKEN: process.env.SNYK_TOKEN}
        })
        JSON.parse(stdout).vulnerabilities?.map((vuln: any) =>{
            scanJobs[jobId].result.push({
                source: 'snyk',
                title: vuln.title,
                desc: vuln.description,
                severity: vuln.severity,
            })
        })
    }catch(err: any){
        if(err?.stdout){
            JSON.parse(err.stdout).vulnerabilities?.map((vuln: any) =>{
            scanJobs[jobId].result.push({
                source: 'snyk',
                title: vuln.title,
                desc: vuln.description,
                severity: vuln.severity,
            })
        })
        }
    }
}

const trivyScan = async(tmpDir:string, jobId: string) =>{
    const {stdout} = await run(`trivy fs --quiet --format json .`, {cwd: tmpDir})
    JSON.parse(stdout).Results[0]?.Vulnerabilities?.map((vuln : any) =>{
        scanJobs[jobId].result.push({
            source:'trivy',
            desc: vuln.Description,
            severity: normalizedSeverity( 'trivy' ,vuln.Severity ),
            title: vuln.Title,
        })
    })
}

const semgrepScan = async(tmpDir: string, jobId: string) =>{
    const {stdout} = await run(`semgrep --config auto --json`,{cwd: tmpDir})
    JSON.parse(stdout).result?.map((vuln: any) =>{
        scanJobs[jobId].result.push({
            source: 'semgrep',
            desc: vuln.extra.message,
            severity: normalizedSeverity( 'semgrep' ,vuln.extra.severity )
        })
    })
}

const handleScan = async(tmpdir: string, jobId: string) =>{
    await Promise.all([
        await snykScan(tmpdir, jobId),
        await semgrepScan(tmpdir, jobId)
    ])
    await trivyScan(tmpdir, jobId)
    scanJobs[jobId].status = 'done'
    await fs.rm(tmpdir, {recursive: true, force: true})
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
    try{
        const {repoUrl} = await req.json()
        if(!repoUrl) return NextResponse.json({error: 'repoUrl is required'}, {status: 400})
        const scanId = crypto.randomUUID()

        //create temporary directory to place the repo clone
        const tmpDir = path.join('/tmp', `scan-${scanId}`)

        //clone the dir to tmp dir
        await run(`git clone --depth 1 ${repoUrl} ${tmpDir}`)
        const jobId = crypto.randomUUID()
        scanJobs[jobId] = {status: 'pending', result: []}
        handleScan(tmpDir, jobId)
        return NextResponse.json({scanId:jobId}, {
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
    if(scanId && scanJobs[scanId].status === 'done'){
        return NextResponse.json({data: scanJobs[scanId].result},{status:200,   
            headers: {
    'Access-Control-Allow-Origin': '*',
    }})
    }
    return NextResponse.json({}, {status: 202,   headers: {
    'Access-Control-Allow-Origin': '*',
  }})
}