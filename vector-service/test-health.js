import axios from 'axios';

const VECTOR_SERVICE_URL = 'http://localhost:3010';

async function testVectorHealth() {
    console.log('🔍 Testing Vector Service Health Endpoint...\n');
    
    try {
        const response = await axios.get(`${VECTOR_SERVICE_URL}/api/health`);
        
        console.log('✅ Health Check Response:');
        console.log('Status Code:', response.status);
        console.log('Response Status:', response.data.status);
        console.log('Service:', response.data.service);
        console.log('Version:', response.data.version);
        console.log('Uptime:', response.data.uptime, 'seconds');
        console.log('Timestamp:', response.data.timestamp);
        
        console.log('\n📊 Service Checks:');
        if (response.data.checks) {
            Object.entries(response.data.checks).forEach(([checkName, checkData]) => {
                console.log(`  ${checkName}:`);
                console.log(`    Status: ${checkData.status}`);
                if (checkData.type) console.log(`    Type: ${checkData.type}`);
                if (checkData.responseTime) console.log(`    Response Time: ${checkData.responseTime}`);
                if (checkData.model) console.log(`    Model: ${checkData.model}`);
                if (checkData.dimension) console.log(`    Dimension: ${checkData.dimension}`);
                if (checkData.installed !== undefined) console.log(`    Installed: ${checkData.installed}`);
                if (checkData.message) console.log(`    Message: ${checkData.message}`);
                if (checkData.error) console.log(`    Error: ${checkData.error}`);
                if (checkData.connectionPool) {
                    console.log(`    Connection Pool:`);
                    console.log(`      Active: ${checkData.connectionPool.active}`);
                    console.log(`      Idle: ${checkData.connectionPool.idle}`);
                }
                console.log('');
            });
        }
        
        console.log('🔗 Dependencies:');
        if (response.data.checks.dependencies) {
            Object.entries(response.data.checks.dependencies).forEach(([serviceName, serviceData]) => {
                console.log(`  ${serviceName}:`);
                console.log(`    Status: ${serviceData.status}`);
                console.log(`    URL: ${serviceData.url}`);
                if (serviceData.responseStatus) console.log(`    Response Status: ${serviceData.responseStatus}`);
                if (serviceData.error) console.log(`    Error: ${serviceData.error}`);
                console.log('');
            });
        }
        
        console.log('📈 System Metrics:');
        if (response.data.metrics) {
            console.log('  Memory:');
            console.log(`    Used: ${response.data.metrics.memory.used} MB`);
            console.log(`    Total: ${response.data.metrics.memory.total} MB`);
            console.log(`    External: ${response.data.metrics.memory.external} MB`);
            
            console.log('  CPU:');
            console.log(`    Platform: ${response.data.metrics.cpu.platform}`);
            console.log(`    Architecture: ${response.data.metrics.cpu.arch}`);
            console.log(`    User Time: ${response.data.metrics.cpu.usage.user}μs`);
            console.log(`    System Time: ${response.data.metrics.cpu.usage.system}μs`);
            
            console.log('  Node.js:');
            console.log(`    Version: ${response.data.metrics.node.version}`);
            console.log(`    Process ID: ${response.data.metrics.node.pid}`);
        }
        
        console.log('🎯 Available Features:');
        if (response.data.features) {
            response.data.features.forEach(feature => {
                console.log(`  - ${feature}`);
            });
        }
        
        console.log('\n✅ Vector Service Health Check Completed Successfully!');
        
    } catch (error) {
        console.error('❌ Health Check Failed:');
        if (error.response) {
            console.error('Status Code:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('No response received:', error.message);
        } else {
            console.error('Error:', error.message);
        }
    }
}

// Run the test
testVectorHealth();
