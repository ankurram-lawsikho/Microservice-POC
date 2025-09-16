// Test auth service logs specifically
async function testAuthLogs() {
    try {
        console.log('Testing Auth Service Logs...');
        
        // Test logs with auth service filter
        const logsResponse = await fetch('http://localhost:3011/api/logger/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filters: { service: 'auth-service' },
                limit: 10,
                sort: { timestamp: -1 }
            })
        });
        const logs = await logsResponse.json();
        console.log('Auth service logs:', JSON.stringify(logs, null, 2));
        
        // Test all services
        const allLogsResponse = await fetch('http://localhost:3011/api/logger/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filters: {},
                limit: 20,
                sort: { timestamp: -1 }
            })
        });
        const allLogs = await allLogsResponse.json();
        console.log('\nAll services in logs:');
        const services = [...new Set(allLogs.logs.map(log => log.service))];
        console.log('Services found:', services);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAuthLogs();
