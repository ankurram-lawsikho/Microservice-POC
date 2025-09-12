const axios = require('axios');

// Test the MCP server functionality
async function testMCPServer() {
  const baseUrl = 'http://localhost:3009';
  
  console.log('🧪 Testing MCP Server...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${baseUrl}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');
    
    // Test info endpoint
    console.log('2. Testing info endpoint...');
    const infoResponse = await axios.get(`${baseUrl}/info`);
    console.log('✅ Server info retrieved:');
    console.log(`   - Name: ${infoResponse.data.name}`);
    console.log(`   - Version: ${infoResponse.data.version}`);
    console.log(`   - Tools available: ${infoResponse.data.capabilities.tools.length}`);
    console.log(`   - Resources available: ${infoResponse.data.capabilities.resources.length}`);
    console.log('');
    
    // Test MCP server functionality
    console.log('3. Testing MCP server functionality...');
    const testResponse = await axios.get(`${baseUrl}/test`);
    console.log('✅ MCP server test passed:', testResponse.data.message);
    
    if (testResponse.data.serviceHealth) {
      console.log('   Service Health Status:');
      Object.entries(testResponse.data.serviceHealth.services).forEach(([service, status]) => {
        const statusIcon = status.status === 'healthy' ? '✅' : '❌';
        console.log(`   ${statusIcon} ${service}: ${status.status}`);
      });
    }
    console.log('');
    
    console.log('🎉 All tests passed! MCP Server is working correctly.');
    console.log('\n📋 Available MCP Tools:');
    infoResponse.data.capabilities.tools.forEach(tool => {
      console.log(`   - ${tool}`);
    });
    
    console.log('\n📚 Available MCP Resources:');
    infoResponse.data.capabilities.resources.forEach(resource => {
      console.log(`   - ${resource}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testMCPServer();
