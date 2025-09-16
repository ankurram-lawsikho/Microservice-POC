# 🚀 Quick Start: Logger Dashboard

## **Step 1: Start Logger API Service**
```bash
cd logger-service
npm run api
```

**Expected Output:**
```
✅ Logger API service started on port 3011
📊 Access the logger dashboard at: http://localhost:3000/logs
```

## **Step 2: Test Logger API**
```bash
# Test direct connection
curl http://localhost:3011/api/health

# Test API Gateway proxy
curl http://localhost:3000/api/logger/health
```

## **Step 3: Generate Some Logs**
```bash
# Make some API calls to generate logs
curl http://localhost:3000/health
curl http://localhost:3000/api/auth/health
curl http://localhost:3000/users
```

## **Step 4: Access Dashboard**
- Go to: **http://localhost:3000/logs**
- You should see logs appearing!

## 🔧 **Troubleshooting:**

### **If Logger API Won't Start:**
```bash
# Check dependencies
cd logger-service
npm install

# Check MongoDB
mongosh --eval "db.runCommand('ping')"
```

### **If Dashboard Shows 0 Logs:**
1. Make sure Logger API is running
2. Generate some logs with API calls
3. Check browser console for errors

### **If 404 Errors:**
1. Start Logger API: `cd logger-service && npm run api`
2. Test direct connection: `curl http://localhost:3011/api/health`
3. Test proxy: `curl http://localhost:3000/api/logger/health`

## ✅ **Success Indicators:**
- Logger API starts without errors
- Health checks return 200 OK
- Dashboard shows logs from your services
- Statistics cards show log counts

**That's it! Your logger dashboard should now work!** 🎉
