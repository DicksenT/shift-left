'use client'
import Typewriter from 'typewriter-effect'
export default function TypewriterComp(){
    return(
            <Typewriter 
            options={{
              strings: ['VULNERABLE', 'EXPOSED', 'HACKABLE'],
              autoStart: true,
              loop: true
            }}
            />
    )
}