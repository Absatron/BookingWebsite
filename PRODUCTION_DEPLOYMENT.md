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

Your application is now production-ready! 🚀
