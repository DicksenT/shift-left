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
        const result: normalizedResult[] = []
            try{
                const {stdout, stderr} = await run(`snyk test --json`, {
                    cwd: tmpDir,
                    env: { ...process.env, SNYK_TOKEN: process.env.SNYK_TOKEN },
                    });
                    JSON.parse(stdout).vulnerabilities.map((vuln: any) =>{
                        result.push({
                        source: 'snyk',
                        title: vuln.title,
                        desc: vuln.description,
                        severity: vuln.severity,
                        })
                })

            } catch (err: any) {
                if (err?.stdout) {
                    JSON.parse(err.stdout).vulnerabilities.map((vuln: any) =>{
                        result.push({
                        source: 'snyk',
                        title: vuln.title,
                        desc: vuln.description,
                        severity: vuln.severity,
                        })
                })
                }
                };

            try{
                const {stdout} = await run(`trivy fs --quiet --format json .`, {cwd: tmpDir})
                const trivyResult: normalizedResult[] = 
                JSON.parse(stdout).Results[0]?.Vulnerabilities?.map((vuln : any) =>{
                    result.push({
                    source:'trivy',
                    desc: vuln.Description,
                    severity: normalizedSeverity( 'trivy' ,vuln.Severity ),
                    title: vuln.Title,
                    })
                })

            }catch(err: any){
               
            }

            try{
                const {stdout} = await run(`semgrep --config auto --json`,{cwd: tmpDir})
                JSON.parse(stdout).results?.map((vuln: any) =>{
                    result.push({
                    source: 'semgrep',
                    desc: vuln.extra.message,
                    severity: normalizedSeverity( 'semgrep' ,vuln.extra.severity ),
                    })
                })

            }catch(err: any){
                
            }
            //make sure to remove the temporary directory
            await fs.rm(tmpDir, {recursive: true, force: true})
            return NextResponse.json({data: result}, {
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