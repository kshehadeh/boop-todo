import express from 'express'
import os from 'os'
import open from 'open'
import https, { type ServerOptions } from 'https'
import { generateCertificate } from './certificate'
export interface AuthResponse {
    access_token: string
    refresh_token: string
    expires_in: number
    token_type: string
}

export async function executeOAuthFlowAndReturnAuthInfo({
    redirectUrl,
    authUrl,
    tokenUrl,
    audience,
    clientId,
    clientSecret,
    scopes,
    includeState,
    includePrompt,
    output
}: {
    redirectUrl: string
    authUrl: string
    tokenUrl: string
    audience?: string
    clientId: string
    clientSecret: string
    includeState?: boolean
    includePrompt?: boolean
    scopes: string[]
    output: (message: string) => void
}): Promise<AuthResponse> {
    // Get the port form the redirect URI
    const redirectUrlOb = new URL(redirectUrl)
    const authUrlOb = new URL(authUrl)

    if (redirectUrlOb.port === '80') {
        throw new Error('Port 80 is not supported. Please use a different port.')
    }

    if (redirectUrlOb.hostname !== 'localhost') {
        throw new Error('Redirect URI must be localhost.')
    }

    if (authUrlOb.hostname === 'localhost') {
        throw new Error('Authorization URL cannot be localhost.')
    }

    if (authUrlOb.searchParams.size > 0) {
        throw new Error('Authorization URL cannot have query parameters.')
    }

    const port = redirectUrlOb.port
    const path = redirectUrlOb.pathname

    const options: ServerOptions = {}
    if (redirectUrlOb.protocol === 'https:') {
        // create a self-signed certificate        
        const cert = await generateCertificate('localhost', 'Localhost', 365)
        options.key = cert.key
        options.cert = cert.cert
    }

    const app = express()

    return new Promise((resolve, reject) => {
        app.get(path, (req: express.Request, res: express.Response) => {
            const authCode = req.query.code

            // Let's see if we have the code
            if (authCode) {
                res.send('You can close this window now.')

                const data = {
                    grant_type: 'authorization_code',
                    client_id: clientId,
                    client_secret: clientSecret,
                    code: authCode,
                    redirect_uri: redirectUrlOb.toString(),
                }

                fetch(tokenUrl, {
                    method: 'POST',
                    body: JSON.stringify(data),
                })
                    .then((response: Response) => response.json())
                    .then((data: AuthResponse) => {
                        output(`Successfully received token...`)
                        resolve(data)
                    })
                    .catch((error: Error) => {
                        res.send('Error exchanging code for token.')
                        output(`Failed to retrieve token...`)
                        reject(error)
                    })
                    .finally(() => {
                        server.close()
                    })

            } else {
                res.send('Authorization code not found.')
                output(`Unable to retrieve authorization code...`)
                server.close()
            }
        })

        const server = https.createServer(options, app).listen(port, () => {
            const params = new URLSearchParams({
                ...(audience ? { audience } : {}),
                ...(includeState ? { state: Buffer.from(os.hostname(), 'base64').toString() } : {}),
                ...(includePrompt ? { prompt: 'consent' } : {}),
                client_id: clientId,
                scope: scopes.join(' '),
                redirect_uri: redirectUrlOb.toString(),
                response_type: 'code',
            })

            // Now let's try to exchange the code for a token
            authUrl = `${authUrl}?${params.toString()}`

            // Once we've started listening, open the user's browser to the auth URL
            open(authUrl)

            // Now we wait for the user to authenticate and redirect back to our callback
            output(`Waiting for OAuth flow to complete...`)
        })
    })
}