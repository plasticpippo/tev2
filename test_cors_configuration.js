/**
 * Test script to verify CORS configuration
 * This script tests various aspects of the CORS setup
 */

const http = require('http');
const https = require('https');
const fs = require('fs');

async function testCORSConfiguration() {
    console.log('🔍 Testing CORS Configuration...\n');
    
    // Read environment variables
    const envContent = fs.readFileSync('.env', 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
        if (line.includes('=') && !line.trim().startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            envVars[key.trim()] = valueParts.join('=').trim();
        }
    });

    console.log('📋 Environment Variables:');
    console.log('BACKEND_CORS_ORIGIN:', envVars.BACKEND_CORS_ORIGIN);
    console.log('FRONTEND_API_URL:', envVars.FRONTEND_API_URL);
    console.log('LAN_IP:', envVars.LAN_IP);
    console.log('');

    // Parse CORS origins
    const corsOrigins = envVars.BACKEND_CORS_ORIGIN ? envVars.BACKEND_CORS_ORIGIN.split(',').map(o => o.trim()) : [];
    console.log('🌐 CORS Origins configured:');
    corsOrigins.forEach(origin => console.log(`  - ${origin}`));
    console.log('');

    // Check if necessary origins are present
    const checks = [
        { name: 'Localhost frontend (development)', origin: 'http://localhost:3000', present: corsOrigins.includes('http://localhost:3000') },
        { name: 'Localhost frontend (alternative)', origin: 'http://127.0.0.1:3000', present: corsOrigins.includes('http://127.0.0.1:3000') },
        { name: 'LAN access', origin: `http://${envVars.LAN_IP}:3000`, present: corsOrigins.includes(`http://${envVars.LAN_IP}:3000`) },
        { name: 'Container-to-container', origin: 'http://frontend:3000', present: corsOrigins.includes('http://frontend:3000') }
    ];

    console.log('✅ CORS Origin Checks:');
    let allChecksPassed = true;
    checks.forEach(check => {
        console.log(`  ${check.present ? '✅' : '❌'} ${check.name}: ${check.origin}`);
        if (!check.present) allChecksPassed = false;
    });
    console.log('');

    // Test backend health endpoint
    const backendUrl = `http://localhost:${envVars.BACKEND_EXTERNAL_PORT || '3001'}`;
    console.log(`🧪 Testing backend connectivity at: ${backendUrl}`);
    
    try {
        const backendResponse = await makeRequest(`${backendUrl}/health`);
        console.log('✅ Backend health check:', typeof backendResponse === 'object' ? backendResponse.status : backendResponse);
    } catch (error) {
        console.log('⚠️  Backend health check failed (might not be running):', error.message);
    }

    console.log('');
    if (allChecksPassed) {
        console.log('🎉 All CORS configuration checks passed!');
        console.log('💡 The configuration should allow proper communication between frontend and backend.');
    } else {
        console.log('❌ Some CORS configuration issues detected!');
        console.log('🔧 Please review the .env file to ensure all necessary origins are included.');
    }
}

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        
        const request = lib.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve(response);
                } catch (e) {
                    resolve(data);
                }
            });
        });
        
        request.on('error', (error) => {
            reject(error);
        });
        
        request.setTimeout(5000, () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });
        
        request.end();
    });
}

// Run the test
testCORSConfiguration()
    .then(() => {
        console.log('\n📋 CORS configuration test completed!');
    })
    .catch(error => {
        console.error('\n❌ Test failed:', error);
    });