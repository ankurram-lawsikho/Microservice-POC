# Documentation Index

Welcome to the Microservices POC documentation! This directory contains comprehensive documentation for all services, architecture, and testing procedures.

## 📋 **Documentation Structure**

### **Service Documentation** (One document per service)
Each service has its own dedicated documentation file:

- **[API Gateway](./API_GATEWAY.md)** - Gateway service documentation
- **[Authentication Service](./AUTH_SERVICE.md)** - Auth service documentation  
- **[User Service](./USER_SERVICE.md)** - User service documentation
- **[Todo Service](./TODO_SERVICE.md)** - Todo service documentation
- **[Messaging Service](./MESSAGING_SERVICE.md)** - Messaging service documentation
- **[Notification Service](./NOTIFICATION_SERVICE.md)** - Notification service documentation
- **[AI Service](./AI_SERVICE.md)** - AI service documentation
- **[MCP Service](./MCP_SERVICE.md)** - MCP server documentation
- **[Vector Service](./VECTOR_SERVICE.md)** - Vector service documentation
- **[Logger Service](./LOGGER_SERVICE.md)** - Logger service documentation

### **Architecture & Setup Documentation**
High-level architecture and setup guides:

- **[Microservices Overview](./MICROSERVICES_OVERVIEW.md)** - Complete architecture overview
- **[Authentication Architecture](./AUTHENTICATION_ARCHITECTURE.md)** - Complete auth system guide
- **[Messaging Architecture](./MESSAGING_ARCHITECTURE.md)** - RabbitMQ integration details
- **[Database Setup](./DATABASE_SETUP.md)** - Database configuration guide

### **Testing Documentation**
Comprehensive testing guides:

- **[MCP Testing](./MCP_TESTING.md)** - Comprehensive MCP service testing guide

## 🚀 **Quick Start Guide**

### **For Developers**
1. Start with **[Microservices Overview](./MICROSERVICES_OVERVIEW.md)** to understand the architecture
2. Follow **[Database Setup](./DATABASE_SETUP.md)** to configure your environment
3. Read individual service documentation as needed
4. Use **[MCP Testing](./MCP_TESTING.md)** for testing procedures

### **For DevOps**
1. Review **[Database Setup](./DATABASE_SETUP.md)** for deployment requirements
2. Check **[Authentication Architecture](./AUTHENTICATION_ARCHITECTURE.md)** for security setup
3. Use **[Messaging Architecture](./MESSAGING_ARCHITECTURE.md)** for message queue configuration

### **For AI Integration**
1. Start with **[MCP Service](./MCP_SERVICE.md)** for AI model integration
2. Review **[Vector Service](./VECTOR_SERVICE.md)** for semantic search capabilities
3. Check **[AI Service](./AI_SERVICE.md)** for AI-powered features

## 📊 **Service Overview**

| Service | Port | Purpose | Documentation |
|---------|------|---------|---------------|
| API Gateway | 3000 | Central routing and load balancing | [API_GATEWAY.md](./API_GATEWAY.md) |
| User Service | 3001 | User management and profiles | [USER_SERVICE.md](./USER_SERVICE.md) |
| Todo Service | 3002 | Todo CRUD operations | [TODO_SERVICE.md](./TODO_SERVICE.md) |
| Notification Service | 3004 | Email notifications | [NOTIFICATION_SERVICE.md](./NOTIFICATION_SERVICE.md) |
| Messaging Service | 3006 | Message queue management | [MESSAGING_SERVICE.md](./MESSAGING_SERVICE.md) |
| Auth Service | 3007 | Authentication and authorization | [AUTH_SERVICE.md](./AUTH_SERVICE.md) |
| AI Service | 3008 | AI-powered features | [AI_SERVICE.md](./AI_SERVICE.md) |
| MCP Server | 3009 | AI model integration | [MCP_SERVICE.md](./MCP_SERVICE.md) |
| Vector Service | 3010 | Semantic search and embeddings | [VECTOR_SERVICE.md](./VECTOR_SERVICE.md) |
| Logger Service | Shared | Centralized logging | [LOGGER_SERVICE.md](./LOGGER_SERVICE.md) |

## 🔧 **Technology Stack**

### **Backend Services**
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeORM** - Object-relational mapping
- **PostgreSQL** - Primary database
- **MongoDB** - Document database
- **pgvector** - Vector similarity search
- **RabbitMQ** - Message queuing

### **AI & ML**
- **Google Gemini** - AI text generation and embeddings
- **Model Context Protocol (MCP)** - AI model integration
- **Vector Embeddings** - Semantic search

### **Frontend**
- **React** - User interface framework
- **Redux Toolkit** - State management
- **Vite** - Build tool
- **Tailwind CSS** - Styling

### **Infrastructure**
- **Docker** - Containerization
- **API Gateway** - Service routing
- **JWT** - Authentication
- **CORS** - Cross-origin resource sharing

## 📚 **Documentation Standards**

### **Service Documentation Structure**
Each service documentation follows this structure:
1. **Overview** - Service purpose and features
2. **Architecture** - Technical architecture and design
3. **API Endpoints** - Complete API reference
4. **Configuration** - Environment setup and configuration
5. **Installation & Setup** - Step-by-step setup guide
6. **Usage Examples** - Code examples and use cases
7. **Integration** - How to integrate with other services
8. **Security** - Security considerations and best practices
9. **Monitoring** - Logging and monitoring setup
10. **Troubleshooting** - Common issues and solutions

### **Code Examples**
All documentation includes:
- **cURL examples** for API testing
- **JavaScript examples** for frontend integration
- **Configuration examples** for environment setup
- **Docker examples** for containerization

## 🔍 **Finding Information**

### **By Topic**
- **Authentication**: [AUTH_SERVICE.md](./AUTH_SERVICE.md), [AUTHENTICATION_ARCHITECTURE.md](./AUTHENTICATION_ARCHITECTURE.md)
- **Database**: [DATABASE_SETUP.md](./DATABASE_SETUP.md)
- **AI Features**: [AI_SERVICE.md](./AI_SERVICE.md), [MCP_SERVICE.md](./MCP_SERVICE.md), [VECTOR_SERVICE.md](./VECTOR_SERVICE.md)
- **Messaging**: [MESSAGING_SERVICE.md](./MESSAGING_SERVICE.md), [MESSAGING_ARCHITECTURE.md](./MESSAGING_ARCHITECTURE.md)
- **Testing**: [MCP_TESTING.md](./MCP_TESTING.md)

### **By Service**
- **Core Services**: User, Todo, Auth, API Gateway
- **AI Services**: AI Service, MCP Server, Vector Service
- **Infrastructure**: Messaging, Notification, Logger
- **Architecture**: Overview, Authentication, Messaging, Database

## 🆕 **Recent Updates**

### **Vector Service** ⭐ **NEW**
- Added semantic search capabilities
- Integrated pgvector for similarity search
- Added contextual suggestions
- Enhanced AI-powered features

### **MCP Server** ⭐ **ENHANCED**
- Added 7 new vector search tools
- Enhanced AI model integration
- Improved authentication system
- Added comprehensive testing suite

### **Documentation** ⭐ **REORGANIZED**
- One document per service
- Comprehensive testing documentation
- Enhanced architecture guides
- Improved navigation structure

## 🤝 **Contributing to Documentation**

### **Adding New Documentation**
1. Create a new `.md` file in the `docs` directory
2. Follow the standard documentation structure
3. Include code examples and configuration details
4. Update this index file with the new documentation
5. Test all examples and configurations

### **Updating Existing Documentation**
1. Keep the existing structure
2. Add new sections as needed
3. Update code examples to reflect current implementation
4. Ensure all links and references are correct
5. Test updated examples

### **Documentation Standards**
- Use clear, concise language
- Include practical examples
- Provide complete configuration details
- Keep information up to date
- Use consistent formatting

## 📞 **Support**

### **Getting Help**
1. Check the relevant service documentation
2. Review the troubleshooting sections
3. Check the main [README.md](../README.md) for quick setup
4. Review architecture documentation for system understanding

### **Reporting Issues**
- Document the issue clearly
- Include relevant configuration details
- Provide error messages and logs
- Specify the service and version

## 🎯 **Next Steps**

1. **Start with Architecture**: Read [Microservices Overview](./MICROSERVICES_OVERVIEW.md)
2. **Set up Environment**: Follow [Database Setup](./DATABASE_SETUP.md)
3. **Choose Your Path**:
   - **Frontend Development**: Check [Frontend README](../frontend/README.md)
   - **Backend Development**: Read individual service documentation
   - **AI Integration**: Start with [MCP Service](./MCP_SERVICE.md)
   - **DevOps**: Review architecture and setup documentation

This documentation is designed to help you understand, deploy, and extend the microservices architecture. Each document is comprehensive and includes practical examples to get you started quickly.
