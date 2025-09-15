# MCP Service Testing Documentation

## Overview

This document provides comprehensive testing documentation for the MCP (Model Context Protocol) service, including unit tests and end-to-end tests. The testing suite ensures reliable integration between AI models and microservices.

## Test Structure

```
test/
├── README.md           # This documentation
├── unit-test.js        # Unit tests for individual tools
├── e2e-test.js         # End-to-end integration tests
├── run-tests.js        # Test runner with options
└── test-report.json    # Generated test reports
```

## Test Types

### 1. Unit Tests (`unit-test.js`)
- **Purpose**: Test individual MCP tools in isolation
- **Requirements**: No external services needed
- **Coverage**: 
  - Token management and authentication
  - Tool method structure and error handling
  - Bearer token prefix handling
  - Demo token generation

### 2. End-to-End Tests (`e2e-test.js`)
- **Purpose**: Test complete MCP service integration
- **Requirements**: All microservices must be running
- **Coverage**:
  - Authentication flow (set/get tokens)
  - Todo tools (create, read, update, delete, complete)
  - User tools (profile, update, list)
  - AI tools (breakdown, analysis, insights, suggestions)
  - Vector tools (semantic search, embeddings)
  - Analytics tools (productivity, statistics)
  - Service health monitoring
  - MCP resources access

## Running Tests

### Quick Commands

```bash
# Run unit tests only (no services required)
npm run test:unit

# Run end-to-end tests (requires all services)
npm run test:e2e

# Run all tests
npm run test:all

# Interactive test runner
npm run test:run
```

### Manual Execution

```bash
# Unit tests
node test/unit-test.js

# E2E tests
node test/e2e-test.js

# Test runner with options
node test/run-tests.js unit    # Unit tests only
node test/run-tests.js e2e     # E2E tests only
node test/run-tests.js all     # All tests
node test/run-tests.js         # Show help
```

## Prerequisites for E2E Tests

Before running end-to-end tests, ensure all services are running:

```bash
# Start all microservices (from project root)
cd api-gateway && npm start &
cd auth-service && npm start &
cd user-service && npm start &
cd todo-service && npm start &
cd ai-service && npm start &
cd vector-service && npm start &
cd logger-service && npm start &
cd messaging-service && npm start &
cd notification-service && npm start &
```

## Test Configuration

### Test User
- **ID**: 999
- **Name**: E2E Test User
- **Email**: e2e@test.com
- **Role**: user

### Test Token
Automatically generated JWT-like token for testing authentication.

## Test Results

### Unit Test Results
- ✅ **Passed**: Tool structure and methods work correctly
- ❌ **Failed**: Tool implementation issues
- 💥 **Error**: Unexpected errors during testing

### E2E Test Results
- ✅ **Passed**: Full integration working correctly
- ❌ **Failed**: Service integration issues
- 💥 **Error**: Network or service errors

### Test Reports
Detailed test reports are saved to `test-report.json` after E2E test runs, including:
- Test execution timestamp
- Summary statistics (total, passed, failed, errors)
- Detailed results for each test
- Success rate percentage

## Test Coverage

### Authentication Tests
- [x] Set authentication token
- [x] Get authentication token
- [x] Token format validation
- [x] Bearer prefix handling

### Todo Tools Tests
- [x] Create todo
- [x] Get user todos
- [x] Update todo
- [x] Complete todo
- [x] Delete todo
- [x] Get todo by ID

### User Tools Tests
- [x] Get user profile
- [x] Update user profile
- [x] Get all users
- [x] Create user
- [x] Delete user
- [x] Get user statistics

### AI Tools Tests
- [x] Task breakdown
- [x] Todo analysis
- [x] User insights
- [x] Todo suggestions
- [x] Rate limit status

### Vector Tools Tests ⭐ **NEW**
- [x] Search similar todos
- [x] Search AI content
- [x] Get contextual suggestions
- [x] Generate embedding
- [x] Store todo embedding
- [x] Store AI content embedding
- [x] Vector service health

### Analytics Tools Tests
- [x] User productivity analysis
- [x] Todo statistics
- [x] Productivity improvements suggestions

### Service Health Tests
- [x] MCP service health
- [x] HTTP server health check
- [x] Service connectivity

### MCP Resources Tests
- [x] Todos resource access
- [x] Users resource access
- [x] Analytics resource access
- [x] System health resource

## Test Examples

### Unit Test Example
```javascript
// Test token management
const testToken = 'test-token-123';
await mcpClient.callTool('set_auth_token', {
  userId: 999,
  token: testToken
});

const retrievedToken = await mcpClient.callTool('get_auth_token', {
  userId: 999
});

assert.equal(retrievedToken.content[0].text, testToken);
```

### E2E Test Example
```javascript
// Test complete todo workflow
const todo = await mcpClient.callTool('create_todo', {
  task: 'Test todo creation',
  userId: 999,
  completed: false
});

const todos = await mcpClient.callTool('get_user_todos', {
  userId: 999
});

const updatedTodo = await mcpClient.callTool('update_todo', {
  todoId: todo.id,
  task: 'Updated test todo',
  userId: 999
});

await mcpClient.callTool('delete_todo', {
  todoId: todo.id,
  userId: 999
});
```

## Troubleshooting

### Common Issues

1. **E2E Tests Failing**
   - Ensure all microservices are running
   - Check service ports (3000-3010)
   - Verify database connections

2. **Authentication Errors**
   - Check if auth service is running on port 3007
   - Verify JWT token format
   - Ensure Bearer prefix is included

3. **Network Connection Errors**
   - Check if services are accessible
   - Verify firewall settings
   - Test with curl commands

4. **Vector Service Errors**
   - Ensure vector service is running on port 3010
   - Check PostgreSQL with pgvector extension
   - Verify Gemini API key configuration

### Debug Mode

For detailed debugging, check the test output for:
- HTTP request/response details
- Error messages and stack traces
- Service connectivity status
- Token validation results

## Continuous Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run MCP Unit Tests
  run: npm run test:unit

- name: Start Services
  run: |
    # Start all required services
    npm run start:all

- name: Run MCP E2E Tests
  run: npm run test:e2e
```

## Test Data Management

### Test Data Cleanup
E2E tests create test data that should be cleaned up:
- Test todos are automatically deleted after testing
- Test users may persist (ID 999)
- Test tokens expire after 24 hours

### Test Isolation
- Each test run uses unique test data
- Tests are designed to be independent
- No test should depend on data from other tests

## Performance Testing

### Load Testing
```bash
# Run performance tests
npm run test:performance

# Test with multiple concurrent requests
npm run test:load
```

### Benchmarking
- Tool execution time measurement
- Memory usage monitoring
- Concurrent request handling
- Service response time analysis

## Security Testing

### Authentication Testing
- Token validation and expiration
- Unauthorized access prevention
- Token format validation
- Bearer prefix handling

### Input Validation Testing
- Malicious input handling
- SQL injection prevention
- XSS protection
- Parameter validation

## Contributing

When adding new MCP tools or features:

1. **Add Unit Tests**: Test the tool structure and methods
2. **Add E2E Tests**: Test the complete integration
3. **Update Documentation**: Update this documentation with new test coverage
4. **Run All Tests**: Ensure both unit and E2E tests pass
5. **Performance Testing**: Test new tools for performance impact

## Test Environment Setup

### Development Environment
```bash
# Install test dependencies
npm install --dev

# Set up test environment
cp .env.test.example .env.test

# Run tests
npm test
```

### Production Environment
```bash
# Production test setup
NODE_ENV=production npm run test:e2e

# Security testing
npm run test:security
```

## Test Reporting

### Test Reports
- **Unit Test Reports**: Tool structure and method validation
- **E2E Test Reports**: Complete integration testing
- **Performance Reports**: Execution time and resource usage
- **Security Reports**: Authentication and validation testing

### Report Formats
- JSON reports for CI/CD integration
- HTML reports for human review
- Console output for development
- Log files for debugging

## Best Practices

### Test Design
- Write independent tests
- Use descriptive test names
- Test both success and failure cases
- Include edge case testing

### Test Maintenance
- Keep tests up to date with code changes
- Remove obsolete tests
- Refactor tests for better readability
- Document test purpose and scope

### Test Performance
- Run tests in parallel when possible
- Use efficient test data setup
- Clean up test data promptly
- Monitor test execution time

This comprehensive testing suite ensures the MCP service maintains high quality and reliability while providing AI models with seamless access to microservices functionality.
