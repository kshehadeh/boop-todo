// Example HTTPS server using generated certificates
import https from 'https';
import fs from 'fs';
import path from 'path';

// Path to your certificates
const certsDir = path.join(process.cwd(), 'certs');
const keyPath = path.join(certsDir, 'localhost.key');
const certPath = path.join(certsDir, 'localhost.crt');

// Check if certificates exist
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.error('Certificates not found. Generate them first with:');
  console.error('boop certificate --domain localhost --output ./certs');
  process.exit(1);
}

// Create HTTPS server options
const options = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath)
};

// Create a simple HTTPS server
const server = https.createServer(options, (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Secure HTTPS Server</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
          }
          h1 {
            color: #2c3e50;
          }
          .success {
            background-color: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <h1>Secure HTTPS Server</h1>
        <div class="success">
          <strong>Success!</strong> Your HTTPS server is running with locally-trusted certificates.
        </div>
        <p>
          This server is using certificates generated with the <code>boop certificate</code> command.
          The certificates are located at:
        </p>
        <ul>
          <li>Private Key: <code>${keyPath}</code></li>
          <li>Certificate: <code>${certPath}</code></li>
        </ul>
        <p>
          Request received at: ${new Date().toISOString()}
        </p>
      </body>
    </html>
  `);
});

// Start the server
const PORT = 3443;
server.listen(PORT, () => {
  console.log(`HTTPS Server running at https://localhost:${PORT}/`);
  console.log('Using certificates:');
  console.log(`- Key: ${keyPath}`);
  console.log(`- Certificate: ${certPath}`);
}); 