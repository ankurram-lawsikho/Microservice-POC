# Microservices POC with TypeORM

This project demonstrates a microservices architecture using TypeORM with PostgreSQL for users and MongoDB for todos, built with JavaScript.

## Database Setup

### PostgreSQL (User Service)
- Install PostgreSQL locally or use a cloud service
- Create a database named `users_db`
- Update the `.env` file in `user-service/` with your PostgreSQL credentials

### MongoDB (Todo Service)
- Using MongoDB Atlas cluster
- Database: `todos_db`
- Connection string is configured in the `.env` file

## Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL (for user service)
- MongoDB (for todo service)

### User Service
```bash
cd user-service
npm install
npm run dev
```

### Todo Service
```bash
cd todo-service
npm install
npm run dev
```

## Development Scripts

### User Service
- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server

### Todo Service
- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server

## API Endpoints

### User Service (Port 3001)
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create new user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Todo Service (Port 3002)
- `GET /todos` - Get all todos
- `GET /todos/user/:userId` - Get todos by user ID
- `POST /todos` - Create new todo
- `PUT /todos/:id` - Update todo
- `DELETE /todos/:id` - Delete todo

## Features

- TypeORM entities with decorators for both PostgreSQL and MongoDB
- ES modules support
- Proper error handling
- Hot reload development with nodemon
- RESTful API design

## Technologies Used
- TypeORM for database ORM
- PostgreSQL for user data
- MongoDB for todo data
- Express.js for REST APIs
- JavaScript ES modules
- Nodemon for development