import * as mkcert from 'mkcert';

export async function generateCertificate(domain: string, organization: string, days: number) {
    const ca = await mkcert.createCA({
        organization: organization || 'Development CA',
        countryCode: 'US',
        state: 'State',
        locality: 'Locality',
        validity: days
    });

    const cert = await mkcert.createCert({
        ca: { key: ca.key, cert: ca.cert },
        domains: [domain, `*.${domain}`],
        validity: days
    });

    return {
        key: cert.key,
        cert: cert.cert,
        ca: {
            key: ca.key,
            cert: ca.cert
        }
    };
}
