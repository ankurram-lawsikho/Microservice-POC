// Using built-in fetch (Node.js 18+)

async function testLogs() {
    try {
        console.log('Testing Logger API...');
        
        // Test health
        const healthResponse = await fetch('http://localhost:3011/api/health');
        const health = await healthResponse.json();
        console.log('Health:', health);
        
        // Test metrics
        const metricsResponse = await fetch('http://localhost:3011/api/logger/metrics');
        const metrics = await metricsResponse.json();
        console.log('Metrics:', JSON.stringify(metrics, null, 2));
        
        // Test logs
        const logsResponse = await fetch('http://localhost:3011/api/logger/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filters: {},
                limit: 5,
                sort: { timestamp: -1 }
            })
        });
        const logs = await logsResponse.json();
        console.log('Recent logs:', JSON.stringify(logs, null, 2));
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testLogs();
