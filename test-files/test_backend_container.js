const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function testBackendContainer() {
    console.log('Testing backend container configuration...');
    
    try {
        // Check if docker is available
        console.log('Checking Docker installation...');
        const { stdout: dockerVersion } = await execAsync('docker --version');
        console.log(`✓ Docker version: ${dockerVersion.trim()}`);
        
        // Check if docker-compose is available
        console.log('Checking Docker Compose installation...');
        try {
            const { stdout: composeVersion } = await execAsync('docker-compose --version');
            console.log(`✓ Docker Compose version: ${composeVersion.trim()}`);
        } catch {
            const { stdout: composeV2Version } = await execAsync('docker compose version');
            console.log(`✓ Docker Compose version: ${composeV2Version.trim()}`);
        }
        
        // Check docker-compose.yml syntax
        console.log('Validating docker-compose.yml syntax...');
        try {
            await execAsync('docker-compose config');
            console.log('✓ docker-compose.yml syntax is valid');
        } catch {
            await execAsync('docker compose config');
            console.log('✓ docker-compose.yml syntax is valid');
        }
        
        // Check if services are defined correctly
        console.log('Checking service definitions...');
        try {
            const { stdout: services } = await execAsync('docker-compose config --services');
            const serviceList = services.trim().split('\n');
            console.log(`✓ Defined services: ${serviceList.join(', ')}`);
            
            if (serviceList.includes('backend') && serviceList.includes('db') && serviceList.includes('frontend')) {
                console.log('✓ All required services are defined');
            } else {
                console.log('⚠ Some required services are missing');
            }
        } catch {
            const { stdout: services } = await execAsync('docker compose config --services');
            const serviceList = services.trim().split('\n');
            console.log(`✓ Defined services: ${serviceList.join(', ')}`);
            
            if (serviceList.includes('backend') && serviceList.includes('db') && serviceList.includes('frontend')) {
                console.log('✓ All required services are defined');
            } else {
                console.log('⚠ Some required services are missing');
            }
        }
        
        console.log('\nBackend container configuration test completed successfully!');
        console.log('\nTo start the services, run:');
        console.log('  docker-compose up -d');
        console.log('or');
        console.log('  docker compose up -d');
        
    } catch (error) {
        console.error('✗ Error during testing:', error.message);
        process.exit(1);
    }
}

// Run the test
testBackendContainer();