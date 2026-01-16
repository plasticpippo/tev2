/**
 * Test script to verify CORS configuration fix
 * This script tests the connection between frontend and backend
 */

const http = require('http');
const https = require('https');
const fs = require('fs');

async function testBackendConnection() {
    console.log('Testing backend connection...');
    
    // Read environment variables
    const envContent = fs.readFileSync('.env', 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
        if (line.includes('=')) {
            const [key, value] = line.split('=');
            envVars[key.trim()] = value.trim();
        }
    });

    const backendUrl = `http://localhost:${envVars.BACKEND_EXTERNAL_PORT || '3001'}`;
    const frontendUrl = `http://localhost:${envVars.FRONTEND_EXTERNAL_PORT || '3000'}`;

    console.log(`Testing backend at: ${backendUrl}`);
    console.log(`Testing frontend at: ${frontendUrl}`);

    // Test backend health endpoint
    try {
        const backendResponse = await makeRequest(`${backendUrl}/health`);
        console.log('✅ Backend health check:', backendResponse);
    } catch (error) {
        console.log('❌ Backend health check failed:', error.message);
    }

    // Check CORS headers in backend response
    try {
        const corsTest = await makeRequestWithHeaders(`${backendUrl}/health`);
        console.log('✅ Backend CORS headers check:', corsTest.corsHeaders);
    } catch (error) {
        console.log('❌ Backend CORS headers check failed:', error.message);
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
        
        request.end();
    });
}

function makeRequestWithHeaders(url) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        
        const request = lib.get(url, (res) => {
            // Extract CORS-related headers
            const corsHeaders = {};
            Object.keys(res.headers).filter(key => 
                key.toLowerCase().includes('cors') || 
                key.toLowerCase().includes('origin') ||
                key.toLowerCase().includes('access-control')
            ).forEach(key => {
                corsHeaders[key] = res.headers[key];
            });
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({ corsHeaders, data });
            });
        });
        
        request.on('error', (error) => {
            reject(error);
        });
        
        request.end();
    });
}

// Run the test
testBackendConnection()
    .then(() => {
        console.log('CORS configuration test completed!');
    })
    .catch(error => {
        console.error('Test failed:', error);
    });