import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Microservices API Gateway',
            version: '1.0.0',
            description: 'Complete API documentation for User and Todo microservices through the API Gateway',
            contact: {
                name: 'API Support',
                email: 'support@example.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server'
            }
        ],
        tags: [
            {
                name: 'Gateway',
                description: 'API Gateway endpoints'
            },
            {
                name: 'Users',
                description: 'User management operations'
            },
            {
                name: 'Todos',
                description: 'Todo management operations'
            },
            {
                name: 'Authentication',
                description: 'Authentication and authorization endpoints'
            },
            {
                name: 'Health',
                description: 'Health check endpoints'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT token for authentication'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Error message'
                        },
                        message: {
                            type: 'string',
                            description: 'Detailed error message'
                        }
                    }
                },
                HealthResponse: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            enum: ['OK', 'ERROR', 'DEGRADED']
                        },
                        gateway: {
                            type: 'string'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time'
                        },
                        services: {
                            type: 'object',
                            description: 'Health status of all services'
                        }
                    }
                },
                UserProfile: {
                    type: 'object',
                    properties: {
                        user: {
                            $ref: '#/components/schemas/User'
                        },
                        todos: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/Todo'
                            }
                        }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'User ID'
                        },
                        name: {
                            type: 'string',
                            description: 'User name'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email'
                        },
                        role: {
                            type: 'string',
                            enum: ['user', 'admin'],
                            description: 'User role',
                            default: 'user'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Creation timestamp'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last update timestamp'
                        }
                    },
                    required: ['name', 'email']
                },
                CreateUserRequest: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'User name'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email'
                        },
                        password: {
                            type: 'string',
                            description: 'User password'
                        }
                    },
                    required: ['name', 'email', 'password']
                },
                UpdateUserRequest: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'User name'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email'
                        }
                    }
                },
                Todo: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Todo ID (MongoDB ObjectId)'
                        },
                        userId: {
                            type: 'integer',
                            description: 'User ID who owns this todo'
                        },
                        task: {
                            type: 'string',
                            description: 'Todo task description'
                        },
                        completed: {
                            type: 'boolean',
                            description: 'Todo completion status'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Creation timestamp'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last update timestamp'
                        }
                    },
                    required: ['userId', 'task']
                },
                CreateTodoRequest: {
                    type: 'object',
                    properties: {
                        task: {
                            type: 'string',
                            description: 'Todo task description'
                        }
                    },
                    required: ['task']
                },
                UpdateTodoRequest: {
                    type: 'object',
                    properties: {
                        task: {
                            type: 'string',
                            description: 'Todo task description'
                        },
                        completed: {
                            type: 'boolean',
                            description: 'Todo completion status'
                        }
                    }
                },
                LoginRequest: {
                    type: 'object',
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email'
                        },
                        password: {
                            type: 'string',
                            description: 'User password'
                        }
                    },
                    required: ['email', 'password']
                },
                LoginResponse: {
                    type: 'object',
                    properties: {
                        token: {
                            type: 'string',
                            description: 'JWT authentication token'
                        },
                        user: {
                            $ref: '#/components/schemas/User'
                        }
                    }
                }
            }
        }
    },
    apis: ['./gateway.js']
};

export default swaggerJsdoc(options);
