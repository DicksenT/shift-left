'use client'

import { signOut } from "next-auth/react"
import Link from "next/link"

export default function Header(){
    return(
        <header className="flex items-center justify-between border-b py-3">
            <Link href={'/dashboard'} className="font-bold cursor-pointer">Shift-Left</Link>
            <button onClick={() => signOut()} className="border cursor-pointer rounded-2xl px-2 py-1 hover:text-slate-900 hover:bg-slate-200 transition-all duration-500">Log Out</button>
        </header>
    )
}