# PRAGATI Vercel Deployment Guide

Deploy your PRAGATI API to Vercel for global access.

## 🚀 Quick Deployment Steps

### Prerequisites
1. **Supabase Project** - Create at [supabase.com](https://supabase.com)
2. **GitHub Account** - Push your code to GitHub
3. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)

### Step 1: Prepare Supabase Database

1. **Create Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Create new project: `pragati-gis`
   - Note your project URL and password

2. **Enable PostGIS:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

3. **Get Connection Details:**
   - Host: `db.[YOUR-PROJECT-ID].supabase.co`
   - Database: `postgres`
   - User: `postgres`
   - Password: [Your chosen password]

### Step 2: Push to GitHub

1. **Initialize Git (if not done):**
   ```bash
   git init
   git add .
   git commit -m "Initial PRAGATI API setup"
   ```

2. **Create GitHub Repository:**
   - Go to [github.com](https://github.com)
   - Create new repository: `pragati-backend`
   - Push your code:
   ```bash
   git remote add origin https://github.com/[YOUR-USERNAME]/pragati-backend.git
   git branch -M main
   git push -u origin main
   ```

### Step 3: Deploy to Vercel

1. **Connect GitHub to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Click "New Project"
   - Import your `pragati-backend` repository

2. **Configure Environment Variables:**
   In Vercel dashboard, add these environment variables:
   
   ```env
   DATABASE_URL=postgres://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres
   DB_HOST=db.[YOUR-PROJECT-ID].supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=[YOUR-SUPABASE-PASSWORD]
   DB_SSL=true
   NODE_ENV=production
   ```

3. **Deploy:**
   - Click "Deploy"
   - Wait for deployment to complete
   - Get your deployment URL: `https://pragati-backend-[random].vercel.app`

### Step 4: Setup Database Schema

1. **Run Setup Script Locally:**
   ```bash
   # Update your local .env with Supabase credentials
   npm run setup-supabase
   ```

2. **Import Data:**
   ```bash
   # Import your OR.json data
   npm run import-villages
   
   # Or generate mock data for testing
   npm run generate-mock
   ```

### Step 5: Test Your Deployed API

Your API will be available at: `https://your-app-name.vercel.app`

**Test Endpoints:**
```
https://your-app-name.vercel.app/api/health
https://your-app-name.vercel.app/api/stats
https://your-app-name.vercel.app/api/villages?bbox=77,17,87,22&limit=5
https://your-app-name.vercel.app/api/villages/search?q=Bhubaneswar&limit=3
```

## 🔧 Configuration Files

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "server.js": {
      "maxDuration": 30
    }
  }
}
```

### Environment Variables in Vercel

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `postgres://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres` | Full connection string |
| `DB_HOST` | `db.[PROJECT-ID].supabase.co` | Supabase host |
| `DB_PORT` | `5432` | Database port |
| `DB_NAME` | `postgres` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `[YOUR-PASSWORD]` | Your Supabase password |
| `DB_SSL` | `true` | Enable SSL |
| `NODE_ENV` | `production` | Environment |

## 🌐 Using Your Deployed API

### From Frontend Applications
```javascript
const API_BASE = 'https://your-app-name.vercel.app/api';

// Get villages
const response = await fetch(`${API_BASE}/villages?bbox=77,17,87,22&limit=10`);
const data = await response.json();

// Search villages
const searchResponse = await fetch(`${API_BASE}/villages/search?q=Bhubaneswar`);
const searchData = await searchResponse.json();

// Get claimants
const claimantsResponse = await fetch(`${API_BASE}/claimants?claimant_type=IFR&limit=20`);
const claimantsData = await claimantsResponse.json();
```

### From Mobile Apps
```javascript
// React Native / Expo
const API_BASE = 'https://your-app-name.vercel.app/api';

const fetchVillages = async () => {
  try {
    const response = await fetch(`${API_BASE}/villages?bbox=77,17,87,22&limit=10`);
    const data = await response.json();
    return data.features;
  } catch (error) {
    console.error('Error fetching villages:', error);
  }
};
```

### CORS Configuration
The API is configured to accept requests from any origin. For production, you might want to restrict this:

```javascript
// Add to server.js
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://your-frontend-domain.com');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
```

## 🔄 Continuous Deployment

### Automatic Deployments
- Every push to `main` branch triggers automatic deployment
- Vercel builds and deploys your changes
- Zero downtime deployments

### Manual Deployments
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from command line
vercel --prod
```

## 📊 Monitoring & Analytics

### Vercel Dashboard
- View deployment logs
- Monitor function execution
- Check performance metrics
- View error logs

### API Monitoring
```javascript
// Add to your frontend
const monitorAPI = async () => {
  try {
    const response = await fetch('https://your-app-name.vercel.app/api/health');
    const data = await response.json();
    console.log('API Status:', data.status);
  } catch (error) {
    console.error('API Down:', error);
  }
};
```

## 🛠️ Troubleshooting

### Common Issues

1. **Environment Variables Not Set**
   - Check Vercel dashboard → Settings → Environment Variables
   - Redeploy after adding variables

2. **Database Connection Failed**
   - Verify Supabase credentials
   - Check if PostGIS extension is enabled
   - Ensure SSL is enabled (`DB_SSL=true`)

3. **Function Timeout**
   - Large data imports may timeout
   - Use smaller batch sizes
   - Consider background jobs for large operations

4. **CORS Issues**
   - Add proper CORS headers
   - Check browser console for errors

### Logs and Debugging
```bash
# View deployment logs
vercel logs https://your-app-name.vercel.app

# View function logs
vercel logs https://your-app-name.vercel.app --follow
```

## 🚀 Next Steps

1. **Custom Domain:**
   - Add your domain in Vercel dashboard
   - Configure DNS settings

2. **API Authentication:**
   - Add JWT authentication
   - Implement rate limiting

3. **Caching:**
   - Add Redis for caching
   - Implement CDN for static assets

4. **Monitoring:**
   - Set up error tracking (Sentry)
   - Add performance monitoring

## 📱 Example Usage

Once deployed, your API can be used from:
- **Web Applications** (React, Vue, Angular)
- **Mobile Apps** (React Native, Flutter)
- **Desktop Applications** (Electron)
- **IoT Devices**
- **Third-party Integrations**

Your PRAGATI API will be globally accessible and scalable! 🌍