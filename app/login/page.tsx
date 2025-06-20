'use client'
import { signIn } from "next-auth/react"
import Image from "next/image"

export default function LoginPage(){
    return(
        <section>
            <button onClick={() => signIn('github')} className="cursor-pointer">
                <Image src={'/github-fill.svg'} width={20} height={20} alt="GitHub Logo"/>
                Login With GitHub
            </button>
        </section>
    )
}