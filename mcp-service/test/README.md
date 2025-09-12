# MCP Service Testing Suite

This directory contains comprehensive testing for the MCP (Model Context Protocol) service, including unit tests and end-to-end tests.

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

## Troubleshooting

### Common Issues

1. **E2E Tests Failing**
   - Ensure all microservices are running
   - Check service ports (3000-3008)
   - Verify database connections

2. **Authentication Errors**
   - Check if auth service is running on port 3003
   - Verify JWT token format
   - Ensure Bearer prefix is included

3. **Network Connection Errors**
   - Check if services are accessible
   - Verify firewall settings
   - Test with curl commands

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

## Contributing

When adding new MCP tools or features:

1. **Add Unit Tests**: Test the tool structure and methods
2. **Add E2E Tests**: Test the complete integration
3. **Update Documentation**: Update this README with new test coverage
4. **Run All Tests**: Ensure both unit and E2E tests pass

## Test Data Cleanup

E2E tests create test data that should be cleaned up:
- Test todos are automatically deleted after testing
- Test users may persist (ID 999)
- Test tokens expire after 24 hours

For production environments, ensure proper test data isolation and cleanup.
