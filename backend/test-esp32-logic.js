// Test ESP32 sketch generation and write results to a file
const fs = require('fs');
require('ts-node/register');
const { generateESPSketch } = require('./src/templates/sketchTemplate');

const output = [];
function log(message) {
    output.push(message);
}

log('🧪 ESP32 Sketch Generation Test\n');
log('='.repeat(70));

// Test 1: Local Development Machine
log('\n📋 Test 1: Local Development Machine');
log('-'.repeat(70));

const localMachine = {
    machineId: 'VM-001',
    name: 'Local Test Machine',
    wifiSsid: 'TestWiFi',
    wifiPassword: 'TestPass123',
    ip: '192.168.1.100',
    backendUrl: '192.168.1.50'
};

const localProducts = [
    { slot: 'D12', name: 'Coca Cola', machine: 'VM-001' },
    { slot: 'D13', name: 'Pepsi', machine: 'VM-001' }
];

try {
    const sketch1 = generateESPSketch(localMachine, localProducts);
    log('✅ SUCCESS: Local machine sketch generated');
    log(`   Length: ${sketch1.length} characters`);
    log(`   Contains WiFi SSID: ${sketch1.includes('TestWiFi')}`);
    log(`   Contains Machine ID: ${sketch1.includes('VM-001')}`);
    log(`   Slot count = 2: ${sketch1.includes('SLOT_COUNT = 2')}`);
    log(`   Uses port 3001 (local): ${sketch1.includes('backendPort = 3001')}`);
    log(`   Uses WebSocket.begin (not SSL): ${sketch1.includes('webSocket.begin(backendHost, backendPort, wsPath)')}`);
    log(`   Contains local IP: ${sketch1.includes('192.168.1.50')}`);
} catch (error) {
    log(`❌ FAILED: ${error.message}`);
}

// Test 2: Production Machine (Render)
log('\n📋 Test 2: Production Machine (Render)');
log('-'.repeat(70));

const prodMachine = {
    machineId: 'VM-002',
    name: 'Production Machine',
    ip: '192.168.1.101',
    backendUrl: 'https://black-box-4sm3.onrender.com'
};

const prodProducts = [
    { slot: 'D21', name: 'Product A', machine: 'VM-002' },
    { slot: 'GPIO 22', name: 'Product B', machine: 'VM-002' }
];

try {
    const sketch2 = generateESPSketch(prodMachine, prodProducts);
    log('✅ SUCCESS: Production machine sketch generated');
    log(`   Length: ${sketch2.length} characters`);
    log(`   Uses port 443 (SSL): ${sketch2.includes('backendPort = 443')}`);
    log(`   Uses WebSocket.beginSSL: ${sketch2.includes('webSocket.beginSSL(backendHost, backendPort, wsPath)')}`);
    log(`   Contains render.com: ${sketch2.includes('black-box-4sm3.onrender.com')}`);
    log(`   Uses default WiFi placeholders: ${sketch2.includes('YOUR_WIFI_SSID')}`);
    log(`   Environment: Production (SSL): ${sketch2.includes('Production (SSL)')}`);
} catch (error) {
    log(`❌ FAILED: ${error.message}`);
}

// Test 3: Empty Products
log('\n📋 Test 3: Machine with No Products');
log('-'.repeat(70));

const emptyMachine = {
    machineId: 'VM-003',
    name: 'Empty Machine',
    ip: '192.168.1.102'
};

try {
    const sketch3 = generateESPSketch(emptyMachine, []);
    log('✅ SUCCESS: Empty machine sketch generated');
    log(`   Length: ${sketch3.length} characters`);
    log(`   SLOT_COUNT = 0: ${sketch3.includes('SLOT_COUNT = 0')}`);
} catch (error) {
    log(`❌ FAILED: ${error.message}`);
}

// Test 4: Mixed Slot Formats
log('\n📋 Test 4: Mixed Slot Formats');
log('-'.repeat(70));

const mixedMachine = {
    machineId: 'VM-004',
    name: 'Mixed Format Machine',
    ip: '192.168.1.103'
};

const mixedProducts = [
    { slot: 'D12', name: 'Format D12', machine: 'VM-004' },
    { slot: 'GPIO 13', name: 'Format GPIO 13', machine: 'VM-004' },
    { slot: '14', name: 'Format 14', machine: 'VM-004' }
];

try {
    const sketch4 = generateESPSketch(mixedMachine, mixedProducts);
    log('✅ SUCCESS: Mixed format sketch generated');
    log(`   Length: ${sketch4.length} characters`);
    log(`   SLOT_COUNT = 3: ${sketch4.includes('SLOT_COUNT = 3')}`);
    log(`   Contains GPIO 12: ${sketch4.includes('GPIO 12')}`);
    log(`   Contains GPIO 13: ${sketch4.includes('GPIO 13')}`);
    log(`   Contains GPIO 14: ${sketch4.includes('GPIO 14')}`);
} catch (error) {
    log(`❌ FAILED: ${error.message}`);
}

// Test 5: Duplicate Slots
log('\n📋 Test 5: Duplicate Slots (should deduplicate)');
log('-'.repeat(70));

const dupMachine = {
    machineId: 'VM-005',
    name: 'Duplicate Test',
    ip: '192.168.1.104'
};

const dupProducts = [
    { slot: 'D12', name: 'Product A', machine: 'VM-005' },
    { slot: 'D12', name: 'Product B (same slot)', machine: 'VM-005' },
    { slot: 'D13', name: 'Product C', machine: 'VM-005' }
];

try {
    const sketch5 = generateESPSketch(dupMachine, dupProducts);
    log('✅ SUCCESS: Duplicate slot sketch generated');
    log(`   Length: ${sketch5.length} characters`);
    log(`   SLOT_COUNT = 2 (deduplicated): ${sketch5.includes('SLOT_COUNT = 2')}`);
} catch (error) {
    log(`❌ FAILED: ${error.message}`);
}

// Write results to file
log('\n' + '='.repeat(70));
log('📊 Test Results Summary');
log('='.repeat(70));
log('\nAll tests completed! Check the results above.');

const results = output.join('\n');
fs.writeFileSync('test-results.md', results);

console.log('Test results written to test-results.md');
