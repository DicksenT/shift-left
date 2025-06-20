import { authOptions } from "@/app/lib/authOptions";
import { Octokit } from "@octokit/rest";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest){
    const session = await getServerSession(authOptions)
    const token = (session as any)?.accessToken

    if(!token) return NextResponse.json({message:'unauthorized'}, {status: 401})

    const octokit = new Octokit({auth: token})
    const {data: repos} = await octokit.repos.listForAuthenticatedUser({per_page: 100})
    return NextResponse.json({data: repos}, {status: 200})
}