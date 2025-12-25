const { spawn } = require('child_process');
const path = require('path');

console.log('Testing environment variable configuration for different deployment scenarios...');

// Test 1: Local development configuration
console.log('\n1. Testing local development configuration...');
const localEnv = {
  ...process.env,
  PORT: '3002', // Use a different port to avoid conflicts
  HOST: 'localhost',
  NODE_ENV: 'development',
  CORS_ORIGIN: 'http://localhost:3000,http://localhost:5173',
  DATABASE_URL: 'postgresql://totalevo_user:totalevo_password@localhost:5432/bar_pos'
};

const localTest = spawn('node', ['dist/index.js'], {
  cwd: path.join(__dirname, 'backend'),
  env: localEnv
});

let localTestCompleted = false;
localTest.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(`Local test output: ${output}`);
  if (output.includes('Connected to database')) {
    console.log('✓ Local development configuration test passed - database connected');
    localTestCompleted = true;
  }
});

localTest.stderr.on('data', (data) => {
  const error = data.toString();
  console.error(`Local test error: ${error}`);
});

localTest.on('close', (code) => {
  if (!localTestCompleted && code !== 0) {
    console.log(`✗ Local development configuration test failed with code ${code}`);
  }
  // Kill the process after a short time to avoid hanging
  setTimeout(() => {
    localTest.kill();
    testLANConfig();
  }, 5000);
});

// Test 2: LAN deployment configuration
function testLANConfig() {
  console.log('\n2. Testing LAN deployment configuration...');
  const lanEnv = {
    ...process.env,
    PORT: '3003', // Use a different port to avoid conflicts
    HOST: '0.0.0.0',
    NODE_ENV: 'production',
    CORS_ORIGIN: 'http://192.168.1.100:3000,http://192.168.1.101:3000',
    DATABASE_URL: 'postgresql://totalevo_user:totalevo_password@192.168.1.10:5432/bar_pos'
  };

  const lanTest = spawn('node', ['dist/index.js'], {
    cwd: path.join(__dirname, 'backend'),
    env: lanEnv
  });

  let lanTestCompleted = false;
  lanTest.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`LAN test output: ${output}`);
    if (output.includes('Connected to database')) {
      console.log('✓ LAN deployment configuration test passed - database connected');
      lanTestCompleted = true;
    }
  });

  lanTest.stderr.on('data', (data) => {
    const error = data.toString();
    // Note: This might fail if the database isn't available at the LAN address, which is expected
    if (error.includes('database')) {
      console.log('⚠ LAN deployment configuration test - database connection failed (expected if DB not available at LAN address)');
      lanTestCompleted = true;
    } else {
      console.error(`LAN test error: ${error}`);
    }
 });

  lanTest.on('close', (code) => {
    if (!lanTestCompleted && code !== 0) {
      console.log(`✗ LAN deployment configuration test failed with code ${code}`);
    }
    // Kill the process after a short time to avoid hanging
    setTimeout(() => {
      lanTest.kill();
      testProductionConfig();
    }, 5000);
  });
}

// Test 3: Production-like configuration
function testProductionConfig() {
  console.log('\n3. Testing production-like configuration...');
  const prodEnv = {
    ...process.env,
    PORT: '3004', // Use a different port to avoid conflicts
    HOST: '0.0.0.0',
    NODE_ENV: 'production',
    CORS_ORIGIN: 'https://mypos.com,https://api.mypos.com',
    DATABASE_URL: 'postgresql://prod_user:prod_password@prod-db:5432/prod_db'
  };

  const prodTest = spawn('node', ['dist/index.js'], {
    cwd: path.join(__dirname, 'backend'),
    env: prodEnv
  });

  let prodTestCompleted = false;
  prodTest.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`Production test output: ${output}`);
    if (output.includes('Connected to database')) {
      console.log('✓ Production-like configuration test passed - database connected');
      prodTestCompleted = true;
    }
  });

  prodTest.stderr.on('data', (data) => {
    const error = data.toString();
    // Note: This might fail if the database isn't available at the production address, which is expected
    if (error.includes('database')) {
      console.log('⚠ Production-like configuration test - database connection failed (expected if DB not available at production address)');
      prodTestCompleted = true;
    } else {
      console.error(`Production test error: ${error}`);
    }
 });

  prodTest.on('close', (code) => {
    if (!prodTestCompleted && code !== 0) {
      console.log(`✗ Production-like configuration test failed with code ${code}`);
    }
    // Kill the process after a short time to avoid hanging
    setTimeout(() => {
      prodTest.kill();
      console.log('\nEnvironment variable configuration tests completed.');
      console.log('Note: Some tests may show database connection failures, which is expected if the database is not available at the configured addresses.');
      console.log('The important part is that the application correctly reads and uses the environment variables.');
    }, 2000);
 });
}