// Check all logs in the database
async function checkAllLogs() {
    try {
        console.log('Checking all logs in database...');
        
        // Get all logs
        const logsResponse = await fetch('http://localhost:3011/api/logger/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filters: {},
                limit: 50,
                sort: { timestamp: -1 }
            })
        });
        const logs = await logsResponse.json();
        
        console.log(`Total logs: ${logs.stats.totalLogs}`);
        console.log('Services found:', [...new Set(logs.logs.map(log => log.service))]);
        
        // Show recent logs
        console.log('\nRecent logs:');
        logs.logs.slice(0, 10).forEach(log => {
            console.log(`${log.timestamp} [${log.service}] ${log.level}: ${log.message}`);
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkAllLogs();
