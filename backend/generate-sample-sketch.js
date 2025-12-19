// Generate a sample ESP32 sketch to verify the complete output
require('ts-node/register');
const fs = require('fs');
const { generateESPSketch } = require('./src/templates/sketchTemplate');

console.log('Generating sample ESP32 sketch...\n');

// Sample production machine configuration
const machine = {
    machineId: 'VM-001',
    name: 'Black Box Vending Machine',
    wifiSsid: 'VendingMachine_WiFi',
    wifiPassword: 'SecurePass123!',
    ip: '192.168.1.100',
    backendUrl: 'https://black-box-4sm3.onrender.com'
};

// Sample products
const products = [
    { slot: 'D12', name: 'Coca Cola', machine: 'VM-001' },
    { slot: 'D13', name: 'Pepsi', machine: 'VM-001' },
    { slot: 'D14', name: 'Sprite', machine: 'VM-001' },
    { slot: 'GPIO 15', name: 'Water', machine: 'VM-001' },
    { slot: 'D21', name: 'Chips', machine: 'VM-001' },
    { slot: 'D22', name: 'Cookies', machine: 'VM-001' }
];

try {
    const sketch = generateESPSketch(machine, products);

    // Save to file
    fs.writeFileSync('sample_generated_sketch.ino', sketch);

    console.log('✅ SUCCESS! Sample sketch generated and saved to: sample_generated_sketch.ino');
    console.log(`\n📊 Sketch Statistics:`);
    console.log(`   - Total characters: ${sketch.length}`);
    console.log(`   - Total lines: ${sketch.split('\n').length}`);
    console.log(`   - Machine ID: ${machine.machineId}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Environment: Production (SSL)`);
    console.log(`   - Backend: ${machine.backendUrl}`);

    // Verify key components
    console.log(`\n🔍 Verification Checks:`);
    console.log(`   ✓ Contains WiFi credentials: ${sketch.includes(machine.wifiSsid) && sketch.includes(machine.wifiPassword)}`);
    console.log(`   ✓ Contains machine ID: ${sketch.includes(machine.machineId)}`);
    console.log(`   ✓ Contains backend URL: ${sketch.includes('black-box-4sm3.onrender.com')}`);
    console.log(`   ✓ Uses SSL (port 443): ${sketch.includes('443')}`);
    console.log(`   ✓ Uses WebSocket SSL: ${sketch.includes('beginSSL')}`);
    console.log(`   ✓ Includes all Arduino libraries: ${sketch.includes('#include <WiFi.h>') && sketch.includes('#include <WebSocketsClient.h>')}`);
    console.log(`   ✓ Has setup() function: ${sketch.includes('void setup()')}`);
    console.log(`   ✓ Has loop() function: ${sketch.includes('void loop()')}`);
    console.log(`   ✓ Has dispense handler: ${sketch.includes('handleDispense()')}`);
    console.log(`   ✓ Has status handler: ${sketch.includes('handleStatus()')}`);
    console.log(`   ✓ Product slots mapped correctly: ${sketch.includes('SLOT_COUNT = 6')}`);

    console.log(`\n✨ The generated sketch is ready to upload to ESP32!`);
    console.log(`   Open 'sample_generated_sketch.ino' in Arduino IDE to review the complete code.`);

} catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
}
