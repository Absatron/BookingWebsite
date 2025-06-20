# Production Deployment Guide

## Summary of Changes Made

All localhost URLs have been updated to use environment variables for production deployment:

### Frontend Changes:

- ✅ Updated all components to use `config.apiUrl` instead of hardcoded `http://localhost:3000`
- ✅ Updated Vite config to use `VITE_API_URL` environment variable for proxy
- ✅ Components updated: PaymentForm, BookingConfirmation, BookingDetails, EmailVerification, ResendVerification, BookingContext

### Backend Changes:

- ✅ Added compression middleware for better performance
- ✅ Added security headers with Helmet
- ✅ Added rate limiting for API protection
- ✅ Updated CORS configuration to use environment variables
- ✅ Added health check endpoint at `/health`
- ✅ Fixed 404 handler to return JSON

### Environment Variables:

- ✅ Created `.env.production` template
- ✅ All URLs now use environment variables with localhost fallbacks

## Production Environment Variables

Copy `.env.production` and update with your production values:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bookingApp

# Session
SESSION_SECRET=your-super-secure-random-string-here

# URLs
CLIENT_URL=https://yourdomain.com
VITE_CLIENT_URL=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com

# Stripe (Production Keys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_ID_15=price_1RYUhLRt9rk2ZPaCCHszV23m
STRIPE_PRICE_ID_20=price_1RYUgDRt9rk2ZPaCIvyMRfwB
STRIPE_PRICE_ID_50=price_1RYUiIRt9rk2ZPaCSMN9dOUq
STRIPE_WEBHOOK_SECRET=whsec_...

# Email Service
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-app-password

# Security
NODE_ENV=production
PORT=3000
```

## Deployment Options

### Option 1: Render (Free Tier - Recommended)

**Render Free Tier:**

- 750 hours/month execution time
- Apps sleep after 15 minutes of inactivity
- 512MB RAM, automatic SSL

**Setup Steps:**

1. Sign up at [Render.com](https://render.com)
2. Create new Web Service from GitHub
3. Configure deployment settings:

**Render Configuration:**

- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment**: Node
- **Auto-Deploy**: Enable from main branch

**Environment Variables for Render:**

```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bookingApp
SESSION_SECRET=your-super-secure-random-string
CLIENT_URL=https://your-frontend.vercel.app
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID_15=price_1RYUhLRt9rk2ZPaCCHszV23m
STRIPE_PRICE_ID_20=price_1RYUgDRt9rk2ZPaCIvyMRfwB
STRIPE_PRICE_ID_50=price_1RYUiIRt9rk2ZPaCSMN9dOUq
STRIPE_WEBHOOK_SECRET=whsec_...
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Option 2: Fly.io (Alternative Free)

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Run: `flyctl launch`
3. Configure `fly.toml`
4. Deploy: `flyctl deploy`

### Option 3: Railway (Paid - $5/month minimum)

1. Sign up at [Railway.app](https://railway.app)
2. Connect GitHub repository
3. Add environment variables
4. Auto-deploy on git push

## Database Setup

### MongoDB Atlas (Recommended)

1. Create account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create new cluster
3. Get connection string
4. Update `MONGODB_URI` in environment variables

## Domain Configuration

### Frontend Deployment (Separate)

Deploy frontend to Vercel or Netlify:

- **Vercel**: Connect GitHub, automatic builds
- **Netlify**: Connect GitHub, configure build settings

### Backend API

Deploy backend to Railway/Render with custom domain:

- Add custom domain in hosting dashboard
- Update DNS records
- SSL is handled automatically

## Pre-Deployment Checklist

- [ ] Update all environment variables
- [ ] Test with production MongoDB URI
- [ ] Verify Stripe production keys
- [ ] Test email service configuration
- [ ] Update CORS origins for production domain
- [ ] Test all API endpoints
- [ ] Run `npm run build` locally to verify
- [ ] Test health check endpoint: `/health`

## Post-Deployment Verification

1. **Health Check**: Visit `https://your-api-domain.com/health`
2. **CORS**: Verify frontend can communicate with backend
3. **Database**: Confirm MongoDB connection
4. **Payments**: Test Stripe integration with test cards
5. **Email**: Verify booking confirmation emails

## Monitoring

After deployment, monitor:

- Server logs for errors
- Database connections
- API response times
- Email delivery status
- Payment processing

## Security Notes

- ✅ Helmet security headers enabled
- ✅ Rate limiting implemented
- ✅ CORS properly configured
- ✅ Environment variables for sensitive data
- ✅ HTTPS enforced in production
- ✅ Secure session cookies

## Build Commands

```bash
# Development
npm run dev

# Production build
npm run build:production

# Start production server
npm start

# Test the application
npm test
```

## MongoDB Authentication Issues on Render

If you're getting "MongoServerError: bad auth : authentication failed" on Render, follow these steps:

### 1. Check MongoDB Atlas Configuration

1. **IP Whitelist**: Add `0.0.0.0/0` to allow all IPs (required for Render)
2. **Database User**: Ensure the user exists and has proper permissions
3. **Cluster Status**: Verify the cluster is not paused
4. **Connection Limits**: Check if you've exceeded connection limits

### 2. Environment Variables on Render

In your Render dashboard, set these environment variables:

```bash
# MongoDB Connection (CRITICAL - check for special characters)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# If your password contains special characters, URL encode them:
# @ → %40, : → %3A, / → %2F, + → %2B, = → %3D, % → %25
# Example: password "p@ss:w/rd+" becomes "p%40ss%3Aw%2Frd%2B"

# Other required variables
SESSION_SECRET=your-super-secure-random-string-here
NODE_ENV=production
CLIENT_URL=https://your-render-app.onrender.com
VITE_CLIENT_URL=https://your-render-app.onrender.com
VITE_API_URL=https://your-render-app.onrender.com
```

### 3. Test MongoDB Connection

You can test your connection string locally first:

```bash
# Run the connection test
node test-mongodb-connection.js
```

This will help identify connection string issues before deploying.

### 4. Common MongoDB URI Issues

1. **Special Characters in Password**: Must be URL encoded
2. **Wrong Database Name**: Ensure the database name in the URI matches your intended database
3. **Authentication Database**: For Atlas, this is usually handled automatically
4. **SSL/TLS**: Atlas requires SSL (should be handled automatically with `mongodb+srv://`)

### 5. Debugging in Production

The improved error handling will now provide more specific error messages in the Render logs:

- Authentication errors will show specific troubleshooting steps
- Connection timeouts will indicate network issues
- SSL errors will suggest certificate problems

### 6. Render-Specific Considerations

- **IP Ranges**: Render uses dynamic IPs, so whitelist `0.0.0.0/0`
- **Environment Variables**: Set in Render dashboard, not in `.env` files
- **Port**: Render automatically sets `PORT` environment variable
- **Logs**: Check Render logs for detailed error messages

---

Your application is now production-ready! 🚀
