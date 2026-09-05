const localtunnel = require('localtunnel');

(async () => {
  console.log('=======================================================');
  console.log('🚀 DEPLOYING LIVE PUBLIC TUNNELS (NO GITHUB REQUIRED)...');
  console.log('=======================================================');

  try {
    const frontendTunnel = await localtunnel({ port: 5173 });
    console.log(`🌐 LIVE FRONTEND WEB APP URL: ${frontendTunnel.url}`);

    const backendTunnel = await localtunnel({ port: 5000 });
    console.log(`⚡ LIVE BACKEND API URL:      ${backendTunnel.url}`);

    console.log('=======================================================');
    console.log('✅ BOTH SERVERS ARE LIVE & ACCESSIBLE WORLDWIDE!');
    console.log('=======================================================');

    frontendTunnel.on('close', () => console.log('Frontend tunnel closed.'));
    backendTunnel.on('close', () => console.log('Backend tunnel closed.'));
  } catch (err) {
    console.error('Tunnel error:', err);
  }
})();
