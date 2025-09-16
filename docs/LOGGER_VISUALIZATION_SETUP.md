# 📊 Logger Visualization Setup Guide

## 🎯 **Overview**

This guide helps you set up the logger visualization dashboard that provides real-time monitoring of all microservices logs stored in MongoDB.

## 🚀 **Features**

### **Real-time Log Monitoring**
- Live log streaming with auto-refresh
- Filter by service, level, time range, and search terms
- Color-coded log levels (Error, Warning, Info, Success, Debug)

### **Advanced Filtering**
- **Service Filter**: View logs from specific services
- **Level Filter**: Filter by log level (ERROR, WARN, INFO, SUCCESS, DEBUG)
- **Search**: Full-text search across log messages
- **Time Range**: Last 15 minutes to 7 days

### **Statistics Dashboard**
- Total log count
- Error count
- Warning count
- Info count
- Success count

### **Detailed Log View**
- Expandable log details modal
- Full metadata display
- Request ID and User ID tracking
- JSON-formatted metadata

## 🛠️ **Setup Instructions**

### **1. Install Dependencies**
```bash
# Install MongoDB dependency for logger service
cd logger-service
npm install
```

### **2. Set Environment Variables**
```bash
# Add to your .env files
MONGODB_URI=mongodb://localhost:27017
LOGGER_API_PORT=3011
```

### **3. Start the Logger API Service**
```bash
# Option 1: Using the startup script
node start-logger-api.js

# Option 2: Direct start
cd logger-service
npm run api
```

### **4. Start Your Microservices**
Make sure your other services are running to generate logs:
```bash
# Start API Gateway (port 3000)
cd api-gateway && npm start

# Start other services as needed
cd auth-service && npm start
cd user-service && npm start
cd todo-service && npm start
# ... etc
```

### **5. Access the Logger Dashboard**
- **Frontend URL**: http://localhost:3000/logs
- **Logger API**: http://localhost:3011/api/logger

## 📊 **Dashboard Components**

### **1. Statistics Cards**
- **Total Logs**: Overall log count
- **Errors**: Number of ERROR level logs
- **Warnings**: Number of WARN level logs
- **Info**: Number of INFO level logs
- **Success**: Number of SUCCESS level logs

### **2. Filter Panel**
- **Service Dropdown**: Select specific services
- **Level Dropdown**: Filter by log level
- **Search Box**: Full-text search
- **Time Range**: Select time period
- **Auto Refresh Toggle**: Enable/disable auto-refresh

### **3. Logs Table**
- **Timestamp**: When the log was created
- **Service**: Which service generated the log
- **Level**: Log level with color coding
- **Message**: Log message (truncated)
- **Actions**: View details button

### **4. Log Details Modal**
- **Full Log Entry**: Complete log information
- **Metadata**: JSON-formatted metadata
- **Request Context**: Request ID and User ID
- **Environment Info**: Service environment details

## 🔧 **API Endpoints**

### **Get Logs**
```http
POST /api/logger/logs
Content-Type: application/json

{
  "filters": {
    "service": "auth-service",
    "level": "ERROR",
    "search": "authentication",
    "timeRange": "1h"
  },
  "limit": 100,
  "skip": 0,
  "sort": { "timestamp": -1 }
}
```

### **Get Services**
```http
GET /api/logger/services
```

### **Get Log Levels**
```http
GET /api/logger/levels
```

### **Get Metrics**
```http
GET /api/logger/metrics?timeRange=1h
```

## 🎨 **UI Features**

### **Color Coding**
- **ERROR**: Red background with red text
- **WARN**: Yellow background with yellow text
- **INFO**: Blue background with blue text
- **SUCCESS**: Green background with green text
- **DEBUG**: Gray background with gray text

### **Responsive Design**
- Mobile-friendly layout
- Collapsible sidebar on mobile
- Responsive table with horizontal scroll

### **Real-time Updates**
- Auto-refresh every 5 seconds
- Manual refresh option
- Live statistics updates

## 🔍 **Usage Examples**

### **1. Monitor Authentication Errors**
1. Set **Service** filter to "auth-service"
2. Set **Level** filter to "ERROR"
3. Set **Time Range** to "1h"
4. Click **Auto Refresh ON**

### **2. Track API Performance**
1. Set **Search** filter to "API Request"
2. Set **Time Range** to "6h"
3. View logs to see API response times

### **3. Debug Specific User**
1. Set **Search** filter to "userId=123"
2. Set **Time Range** to "24h"
3. View all logs related to that user

### **4. Monitor Service Health**
1. Set **Service** filter to specific service
2. Set **Level** filter to "ERROR" or "WARN"
3. Monitor for issues in real-time

## 🚨 **Troubleshooting**

### **Logger API Not Starting**
```bash
# Check if MongoDB is running
mongosh --eval "db.runCommand('ping')"

# Check if port 3011 is available
netstat -an | grep 3011
```

### **No Logs Appearing**
1. Verify MongoDB connection
2. Check if services are generating logs
3. Verify time range filter
4. Check service filter settings

### **Frontend Not Loading**
1. Ensure API Gateway is running (port 3000)
2. Check browser console for errors
3. Verify logger API is accessible

## 📈 **Performance Tips**

### **1. Optimize Queries**
- Use specific time ranges
- Filter by service when possible
- Limit result count for better performance

### **2. Monitor Resource Usage**
- Check MongoDB performance
- Monitor memory usage
- Set appropriate log retention policies

### **3. Production Considerations**
- Set up log rotation
- Configure log retention
- Monitor disk space usage

## 🔐 **Security Notes**

### **1. Access Control**
- Logger dashboard is protected by authentication
- Only authenticated users can view logs
- Consider role-based access for production

### **2. Sensitive Data**
- Logs are sanitized to remove passwords/tokens
- Be cautious with metadata display
- Consider additional filtering for production

## ✅ **Verification Checklist**

- [ ] MongoDB is running and accessible
- [ ] Logger API service is running on port 3011
- [ ] API Gateway is running on port 3000
- [ ] Frontend is accessible at http://localhost:3000/logs
- [ ] Logs are appearing in the dashboard
- [ ] Filters are working correctly
- [ ] Auto-refresh is functioning
- [ ] Log details modal is working

## 🎉 **Success!**

Your logger visualization dashboard is now ready! You can:

- **Monitor all microservices logs** in real-time
- **Filter and search** through logs efficiently
- **Track errors and performance** across services
- **Debug issues** with detailed log information

**Happy logging!** 📊✨
