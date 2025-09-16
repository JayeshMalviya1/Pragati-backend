# PRAGATI Supabase Deployment Guide

This guide will help you deploy the PRAGATI project using Supabase as your PostgreSQL database.

## 🚀 Quick Setup Steps

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project name: `pragati-gis`
5. Enter a strong database password
6. Select a region close to your users
7. Click "Create new project"

### 2. Get Database Credentials
After project creation, go to:
1. **Settings** → **Database**
2. Copy the connection details:
   - Host: `db.[YOUR-PROJECT-ID].supabase.co`
   - Database name: `postgres`
   - Port: `5432`
   - User: `postgres`
   - Password: [Your chosen password]

### 3. Update Environment Variables
Update your `.env` file with your Supabase credentials:

```env
# Supabase Database Configuration for PRAGATI
DATABASE_URL=postgres://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres

# Application port
PORT=4000

# Supabase Database connection details
DB_HOST=db.[YOUR-PROJECT-ID].supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=[YOUR-SUPABASE-PASSWORD]
DB_SSL=true

# Development settings
NODE_ENV=production
```

### 4. Enable PostGIS Extension
In your Supabase dashboard:
1. Go to **SQL Editor**
2. Run this command:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 5. Setup Database Schema
Run the Supabase setup script:
```bash
npm run setup-supabase
```

### 6. Import Village Data
Import your OR.json data:
```bash
npm run import-villages
```

### 7. Start Your Server
```bash
npm start
```

## 🔧 Configuration Details

### Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | Supabase database host | `db.abcdefghijklmnop.supabase.co` |
| `DB_PORT` | Database port (always 5432) | `5432` |
| `DB_NAME` | Database name (always postgres) | `postgres` |
| `DB_USER` | Database user (always postgres) | `postgres` |
| `DB_PASSWORD` | Your Supabase project password | `your_secure_password` |
| `DB_SSL` | Enable SSL (required for Supabase) | `true` |

### Security Settings

Supabase requires SSL connections, which is automatically handled by our configuration when:
- `DB_SSL=true` is set, OR
- `DB_HOST` contains `supabase.co`

## 📊 API Endpoints

Once deployed, your API will be available at:

### Health Check
```
http://localhost:4000/api/health
```

### Village Data
```
http://localhost:4000/api/villages?bbox=77,20,78,21&limit=10
```

### Search Villages
```
http://localhost:4000/api/villages/search?q=Bhubaneswar&limit=5
```

### Database Statistics
```
http://localhost:4000/api/stats
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Connection Refused
```
Error: getaddrinfo ENOTFOUND db.yourprojectid.supabase.co
```
**Solution:**
- Check your `DB_HOST` in .env file
- Verify project ID is correct
- Ensure project is fully created (wait 2-3 minutes after creation)

#### 2. Authentication Failed
```
Error: password authentication failed for user "postgres"
```
**Solution:**
- Check `DB_PASSWORD` in .env file
- Verify password in Supabase dashboard → Settings → Database
- Reset database password if needed

#### 3. PostGIS Extension Missing
```
Error: extension "postgis" is not available
```
**Solution:**
- Go to Supabase SQL Editor
- Run: `CREATE EXTENSION IF NOT EXISTS postgis;`

#### 4. SSL Connection Issues
```
Error: no pg_hba.conf entry for host
```
**Solution:**
- Ensure `DB_SSL=true` in .env file
- Check that SSL is enabled in database configuration

### Performance Optimization

For large datasets (like your 45,642 villages):

1. **Enable Connection Pooling** (already configured)
2. **Use Indexes** (automatically created by our schema)
3. **Limit Query Results** (use `limit` parameter in API calls)
4. **Consider Caching** for frequently accessed data

## 🌐 Production Deployment

### Deploy to Vercel
1. Push your code to GitHub
2. Connect GitHub repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Deploy to Railway
1. Connect GitHub repo to Railway
2. Add environment variables
3. Deploy automatically

### Deploy to Heroku
1. Create Heroku app
2. Add environment variables
3. Deploy via Git or GitHub integration

## 📈 Monitoring

### Database Monitoring
- Monitor usage in Supabase dashboard
- Check query performance
- Monitor storage usage

### API Monitoring
- Use health check endpoint: `/api/health`
- Monitor response times
- Track error rates

## 🔄 Data Management

### Backup Strategy
- Supabase provides automatic backups
- Export data regularly for additional safety
- Consider point-in-time recovery options

### Updates and Migrations
- Use our schema management system
- Test changes in development first
- Monitor after deployments

## 🤝 Support

For issues:
1. Check this troubleshooting guide
2. Review Supabase documentation
3. Check application logs
4. Contact development team

---

**Next Steps:**
1. Complete the setup steps above
2. Test all API endpoints
3. Import your village data
4. Deploy to production platform
5. Set up monitoring and backups