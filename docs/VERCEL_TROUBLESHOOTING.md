# Vercel Deployment Troubleshooting

## 🔧 Fixed: Serverless Function Structure

The crash was caused by incorrect serverless function structure. Here's what was fixed:

### ✅ Changes Made:

1. **Created `/api/index.js`** - Proper serverless function entry point
2. **Updated `vercel.json`** - Points to correct function file
3. **Added error handling** - Graceful database connection failures
4. **Added CORS headers** - For browser access

### 🚀 New Deployment Structure:

```
pragati-backend/
├── api/
│   └── index.js          # Main serverless function
├── src/
│   └── config/           # Database configuration
├── vercel.json           # Vercel configuration
└── package.json          # Dependencies
```

## 📋 Deployment Checklist

### Before Deploying:

1. **Environment Variables Set:**
   ```
   DATABASE_URL=postgres://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
   DB_HOST=db.[PROJECT-ID].supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=[YOUR-PASSWORD]
   DB_SSL=true
   NODE_ENV=production
   ```

2. **Supabase Setup:**
   - PostGIS extension enabled
   - Database schema created
   - Data imported

3. **Files Structure:**
   - `api/index.js` exists
   - `vercel.json` configured
   - Environment variables in Vercel dashboard

### After Deploying:

1. **Test Health Endpoint:**
   ```
   https://your-app.vercel.app/api/health
   ```

2. **Check Logs:**
   - Go to Vercel dashboard
   - View function logs
   - Check for errors

## 🔍 Common Issues & Solutions

### Issue 1: Function Timeout
**Error:** `FUNCTION_INVOCATION_TIMEOUT`
**Solution:** 
- Reduce query complexity
- Add pagination to large datasets
- Increase timeout in `vercel.json`

### Issue 2: Database Connection Failed
**Error:** `Database not available`
**Solution:**
- Check environment variables
- Verify Supabase credentials
- Ensure PostGIS is enabled

### Issue 3: CORS Errors
**Error:** `Access-Control-Allow-Origin`
**Solution:**
- CORS headers are now included in `api/index.js`
- Should work from any browser

### Issue 4: Cold Start Issues
**Error:** Slow first response
**Solution:**
- This is normal for serverless functions
- Subsequent requests will be faster
- Consider upgrading Vercel plan for better performance

## 🧪 Testing Your Deployment

### 1. Basic Health Check
```bash
curl https://your-app.vercel.app/api/health
```

### 2. Test Villages API
```bash
curl "https://your-app.vercel.app/api/villages?bbox=77,17,87,22&limit=5"
```

### 3. Test Search
```bash
curl "https://your-app.vercel.app/api/villages/search?q=Bhubaneswar&limit=3"
```

### 4. Browser Testing
Open these URLs in your browser:
- `https://your-app.vercel.app/`
- `https://your-app.vercel.app/api/health`
- `https://your-app.vercel.app/api/stats`

## 📊 Expected Responses

### Healthy API Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-09-16T12:00:00.000Z",
  "tables": {
    "villages": 45642,
    "claimants": 100,
    "micro_assets": 150,
    "documents": 75,
    "users": 10
  }
}
```

### Error Response (Database Issue):
```json
{
  "status": "unhealthy",
  "error": "Database connection failed",
  "timestamp": "2025-09-16T12:00:00.000Z"
}
```

## 🔄 Redeployment Steps

If you need to redeploy:

1. **Push Changes to GitHub:**
   ```bash
   git add .
   git commit -m "Fix serverless function structure"
   git push origin main
   ```

2. **Automatic Deployment:**
   - Vercel will automatically redeploy
   - Check deployment status in dashboard

3. **Manual Deployment:**
   ```bash
   vercel --prod
   ```

## 📈 Performance Optimization

### Database Queries:
- Use LIMIT in all queries
- Add proper indexes
- Avoid complex JOINs in serverless functions

### Function Size:
- Keep functions small and focused
- Use connection pooling
- Cache frequently accessed data

### Monitoring:
- Set up error tracking
- Monitor function execution time
- Track database query performance

## 🆘 Getting Help

### Vercel Logs:
```bash
vercel logs https://your-app.vercel.app --follow
```

### Debug Mode:
Add to your environment variables:
```
DEBUG=true
```

### Support Resources:
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Node.js Serverless Best Practices](https://vercel.com/guides/serverless-functions-node)

## ✅ Success Indicators

Your deployment is successful when:
- Health endpoint returns `200 OK`
- Villages API returns data
- No errors in Vercel logs
- CORS headers allow browser access
- Database queries execute within timeout limits

The serverless function structure is now optimized for Vercel deployment! 🚀