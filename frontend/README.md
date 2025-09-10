# Microservices Frontend

A React-based frontend application that integrates with multiple backend microservices using a clean and scalable architecture.

## Features

- **React with Vite**: Fast development and build tooling
- **Redux Toolkit**: State management for distributed data from multiple services
- **API Gateway Integration**: Unified API access through the backend gateway
- **Authentication**: JWT-based authentication with protected routes
- **Real-time Health Monitoring**: System health dashboard with live updates
- **Todo Management**: Full CRUD operations for todos
- **User Management**: User administration features
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Error Handling**: Comprehensive error handling with retry logic
- **Loading States**: User-friendly loading indicators

## Architecture

The frontend follows a clean architecture pattern:

```
src/
├── components/          # Reusable UI components
│   ├── Auth/           # Authentication components
│   ├── Dashboard/      # Dashboard components
│   ├── Health/         # Health monitoring components
│   ├── Layout/         # Layout components (Header, Sidebar)
│   ├── Todos/          # Todo management components
│   └── Users/          # User management components
├── services/           # API service layer
│   └── api.js         # Centralized API configuration
├── store/             # Redux store configuration
│   ├── slices/        # Redux slices for different domains
│   └── index.js       # Store configuration
└── App.jsx            # Main application component
```

## API Integration

The frontend integrates with the following microservices through the API Gateway:

- **Authentication Service** (`/api/auth/*`): Login, register, token verification
- **User Service** (`/users/*`): User management operations
- **Todo Service** (`/todos/*`): Todo CRUD operations
- **Health Monitoring** (`/health`, `/services/health`): System health checks

## State Management

Redux Toolkit is used for state management with the following slices:

- **authSlice**: Authentication state and user information
- **todosSlice**: Todo data and operations
- **usersSlice**: User data and operations
- **uiSlice**: UI state (sidebar, notifications, loading states)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Running microservices backend

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Environment Configuration

The frontend is configured to connect to the API Gateway at `http://localhost:3000` by default. You can modify this in `src/services/api.js` if needed.

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

## Features Overview

### Dashboard
- System overview with key metrics
- Recent todos display
- Quick action buttons
- Real-time system health status

### Todo Management
- Create, read, update, delete todos
- Filter by completion status
- Inline editing capabilities
- Real-time updates

### User Management
- View all users (admin only)
- Edit user information
- Delete users (with confirmation)
- Role-based access control

### Health Monitoring
- Real-time system health dashboard
- Individual service status
- Automatic refresh every 30 seconds
- Detailed service information

### Authentication
- Secure login/logout
- User registration
- Protected routes
- Token-based authentication

## Error Handling

The application includes comprehensive error handling:

- **API Errors**: Automatic retry logic for failed requests
- **Authentication Errors**: Automatic token refresh and logout on expiration
- **Network Errors**: User-friendly error messages
- **Loading States**: Loading indicators for all async operations

## Responsive Design

The application is fully responsive and works on:

- Desktop computers
- Tablets
- Mobile phones

## Security Features

- JWT token storage in localStorage
- Automatic token refresh
- Protected routes
- Role-based access control
- Secure API communication

## Development

### Adding New Components

1. Create component in appropriate directory under `src/components/`
2. Add Redux slice if needed in `src/store/slices/`
3. Update routing in `App.jsx` if it's a new page
4. Add API methods in `src/services/api.js` if needed

### Styling

The application uses Tailwind CSS for styling. Custom styles can be added to `src/index.css`.

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. The built files will be in the `dist/` directory
3. Deploy the `dist/` directory to your web server

## Troubleshooting

### Common Issues

1. **API Connection Errors**: Ensure the microservices backend is running
2. **Authentication Issues**: Check if the JWT secret matches between frontend and backend
3. **CORS Errors**: Verify CORS configuration in the API Gateway

### Debug Mode

Enable debug mode by setting `localStorage.setItem('debug', 'true')` in the browser console.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of a microservices POC demonstration.