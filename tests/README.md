# Testing Guide for Time Ticket Oasis Backend

This directory contains tests for the Time Ticket Oasis backend API.

## Structure

The tests are organized as follows:

```
tests/
├── config/           # Test configuration files
│   └── db-setup.js   # Database setup for tests
├── models/           # Tests for MongoDB models
│   └── user.test.js  # Tests for the User model
├── routes/           # Tests for API routes
│   ├── events.test.js   # Tests for event routes
│   ├── payment.test.js  # Tests for payment routes
│   └── user.test.js     # Tests for user routes
├── utils/            # Utility functions for tests
│   └── test-utils.js    # Common test utilities and mock data
├── jest-setup.js     # Global Jest setup
└── README.md         # This file
```

## Running Tests

### Prerequisites

- MongoDB running locally on port 27017
- Node.js v18+
- npm v8+

### Commands

Run all tests:

```bash
npm test
```

Run tests in watch mode (for development):

```bash
npm run test:watch
```

Generate test coverage report:

```bash
npm run test:coverage
```

### Environment

Tests use their own environment variables defined in `.env.test`. This includes:

- Separate test database
- Test admin credentials
- Test port

## Writing New Tests

### Route Tests

1. Create a new test file in the `routes` directory
2. Import the necessary modules and setup the test app
3. Write tests for each endpoint
4. Follow the pattern in existing route test files

### Model Tests

1. Create a new test file in the `models` directory
2. Import the model to test
3. Write tests for model validation, methods, etc.
4. Follow the pattern in existing model test files

## Best Practices

- Keep tests isolated and independent
- Clear the database between tests
- Use descriptive test names
- Group related tests with `describe` blocks
- Create mock data in the test or import from test utilities
- Test both successful and error scenarios
