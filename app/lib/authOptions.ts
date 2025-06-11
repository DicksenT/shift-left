import { AuthOptions } from "next-auth";
import GitHubProvider from 'next-auth/providers/github'

export const authOptions: AuthOptions={
    providers:[
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENTID!,
            clientSecret: process.env.GITHUB_CLIENTSECRET!,
            authorization: {params: {scope:'repo'}}
        })
    ],
    callbacks:{
        async jwt({token, account}) {
            if(account) token.access_token = account.access_token
            return token
        },
        async session({session, token}) {
            (session as any).accessToken = token.access_token
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET
}