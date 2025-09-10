# Database Setup Guide

## PostgreSQL Setup (User Service)

### Option 1: Local PostgreSQL Installation
1. Install PostgreSQL on your system
2. Create a database named `users_db`
3. Update the password in `user-service/config/database.js` to match your PostgreSQL password

### Option 2: Use Environment Variables
Create a `.env` file in the `user-service` directory:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_actual_password
DB_NAME=users_db
```

### Option 3: Use Docker PostgreSQL
```bash
docker run --name postgres-users -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=users_db -p 5432:5432 -d postgres
```

## MongoDB Setup (Todo Service)

### Option 1: Use MongoDB Atlas (Current Setup)
The todo service is already configured to use MongoDB Atlas. The connection string is in `todo-service/config/database.js`.

### Option 2: Local MongoDB
If you want to use local MongoDB, update `todo-service/config/database.js`:
```javascript
export const AppDataSource = new DataSource({
    type: "mongodb",
    url: "mongodb://localhost:27017/todos_db",
    database: "todos_db",
    // ... rest of config
});
```

### Option 3: Use Docker MongoDB
```bash
docker run --name mongodb-todos -p 27017:27017 -d mongo
```

## Quick Fix for PostgreSQL Error

If you're getting "password authentication failed", try these steps:

1. **Check your PostgreSQL password** and update it in `user-service/config/database.js`
2. **Or create the database and user:**
   ```sql
   CREATE DATABASE users_db;
   CREATE USER postgres WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE users_db TO postgres;
   ```

3. **Or use a different user:**
   ```sql
   CREATE USER myuser WITH PASSWORD 'mypassword';
   GRANT ALL PRIVILEGES ON DATABASE users_db TO myuser;
   ```
   Then update the config to use `myuser` instead of `postgres`.

## Testing the Connection

After setting up the databases, restart the services:
```bash
npm run dev
```

The services should now connect successfully to their respective databases.
