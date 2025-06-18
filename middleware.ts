
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
export async function middleware(req: NextRequest){
    const token  = await getToken({req, secret: process.env.NEXTAUTH_SECRET})
    const url = req.nextUrl
    if(!token && url.pathname.startsWith('/dashboarda')){
        return NextResponse.redirect(new URL('/', req.url))
    }
    else if(token && url.pathname.startsWith('/dashboarda')){
        return NextResponse.next()
    }
    else if(token && url.pathname.startsWith('/logina')){
        return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    else if(token && url.pathname.startsWith('/a')){
        return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    NextResponse.next()
}
    

export const config={
    matcher: ['/dashboard','/', '/login']
}
