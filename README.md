# Kalu Cuts - Booking System

A modern, full-stack appointment booking system that allows users to book time slots and administrators to manage bookings with integrated payment processing.

## 📋 Project Overview

Kalu Cuts is a comprehensive booking management platform designed for service-based businesses. It provides a seamless experience for customers to book appointments while giving administrators powerful tools to manage availability and track bookings.

### 🌟 Key Features

#### For Customers

- **User Registration & Authentication** - Secure account creation with email verification
- **Interactive Calendar** - Browse available time slots with an intuitive calendar interface
- **Real-time Booking** - Instant slot selection with 30-minute reservation protection
- **Secure Payments** - Stripe-powered payment processing with support for cards and Revolut Pay
- **Booking Management** - View, track, and cancel pending bookings
- **Email Confirmations** - Automated booking confirmations with receipt generation
- **PDF Receipts** - Download professional PDF receipts for confirmed bookings
- **Responsive Design** - Mobile-friendly interface with Tailwind CSS
- **Toast Notifications** - Real-time feedback for user actions

#### For Administrators

- **Admin Dashboard** - Comprehensive overview of bookings and system statistics
- **Time Slot Management** - Create, modify, and delete available appointment slots
- **Booking Oversight** - View all customer bookings with detailed information
- **Customer Management** - Access customer details and booking history
- **Real-time Updates** - Live booking status updates and availability tracking
- **Admin-only Routes** - Protected administrative interfaces
- **Booking Analytics** - Track revenue and appointment metrics

### 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication system
- **Email Verification** - Required email verification for new accounts
- **Password Security** - Strong password requirements with bcrypt hashing
- **Admin Role Management** - Role-based access control for administrative functions
- **Session Protection** - Automatic cleanup of expired booking reservations

## 🛠️ Technology Stack

### Frontend

- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icon library
- **date-fns** - Date manipulation and formatting
- **React Hook Form** - Form handling with validation
- **Tanstack React Query** - Data fetching and state management
- **Sonner & Radix Toast** - Toast notifications

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt** - Password hashing
- **Stripe** - Payment processing
- **Nodemailer** - Email service integration
- **PDFKit** - PDF generation for receipts
- **Node-cron** - Automated cleanup tasks

### DevOps & Utilities

- **ESLint** - Code linting and formatting
- **Jest** - Testing framework with Supertest for API testing
- **Morgan** - HTTP request logging
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API protection
- **Compression** - Response compression
- **Joi** - Request validation
- **Lovable Tagger** - Development utility

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB database
- Stripe account (for payments)
- Email service credentials (Gmail/SMTP)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/kalu-cuts.git
cd kalu-cuts
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment Setup**
   Create a `.env` file in the root directory with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/bookingApp

# JWT
JWT_SECRET=your_jwt_secret_here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs (configure for each price point)
STRIPE_PRICE_ID_25=price_id_for_25_dollars
STRIPE_PRICE_ID_50=price_id_for_50_dollars
STRIPE_PRICE_ID_75=price_id_for_75_dollars
# Add more price IDs as needed

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Admin Configuration
ADMIN_EMAIL=admin@example.com

# Application URLs
CLIENT_URL=http://localhost:8080
```

4. **Start the development servers**

```bash
# Start backend (runs on port 3000)
npm run server

# In a new terminal, start frontend (runs on port 8080)
npm run dev
```

The frontend will proxy API requests to the backend automatically in development mode.

### Available Scripts

```bash
# Development
npm run dev          # Start Vite development server
npm run server       # Start backend with nodemon

# Building
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview production build

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Database Testing
npm run test:mongodb # Test MongoDB connection
```

### Production Deployment

```bash
# Build the frontend
npm run build

# Start production server
npm start
```

## 📊 API Architecture

### Authentication Endpoints

- `POST /api/user/register` - User registration
- `POST /api/user/login` - User login
- `POST /api/user/verify-email/:token` - Email verification
- `GET /api/user/validate-token` - Token validation
- `POST /api/user/forgot-password` - Request password reset
- `POST /api/user/reset-password` - Reset password with token

### Booking Endpoints

- `GET /api/bookings` - Get all time slots
- `POST /api/bookings` - Create time slot (admin only)
- `DELETE /api/bookings/:id` - Delete time slot (admin only)
- `POST /api/bookings/initiate` - Initiate booking
- `GET /api/bookings/user` - Get user bookings
- `GET /api/bookings/confirmed` - Get all confirmed bookings (admin only)
- `GET /api/bookings/:bookingId` - Get specific booking details
- `POST /api/bookings/:bookingId/cancel` - Cancel pending booking
- `GET /api/bookings/:bookingId/receipt` - Download PDF receipt

### Payment Endpoints

- `POST /api/payment/create-checkout-session` - Create Stripe session
- `POST /api/payment/webhook` - Stripe webhook handler for payment confirmation

## 🌐 Frontend Routes

### Public Routes

- `/` - Home page with service information
- `/login` - User login
- `/register` - User registration
- `/verify-email` - Email verification
- `/resend-verification` - Resend verification email
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset form
- `/booking` - Browse and select time slots

### Protected Routes (Authenticated Users)

- `/dashboard` - User dashboard with overview
- `/my-bookings` - User's booking history
- `/payment/:bookingId` - Payment processing
- `/confirmation/:bookingId` - Booking confirmation
- `/booking/:bookingId` - Booking details

### Admin Routes (Admin Only)

- `/admin` - Admin panel for slot management
- `/admin/bookings` - All bookings overview
- `/admin/booking/:bookingId` - Admin booking details

## 🏗️ Project Structure

```
kalu-cuts/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── admin/               # Admin-specific components
│   │   ├── auth/                # Authentication components
│   │   ├── booking/             # Booking-related components
│   │   ├── debug/               # Development utilities
│   │   ├── layout/              # Layout components (NavBar, Footer)
│   │   ├── payment/             # Payment components
│   │   └── ui/                  # Reusable UI components (shadcn/ui)
│   ├── contexts/                # React context providers
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility functions and config
│   ├── pages/                   # Main page components
│   └── types/                   # TypeScript type definitions
├── server/                      # Backend source code
│   ├── routes/                  # Express route handlers
│   │   ├── bookings.js         # Booking management routes
│   │   ├── payment.js          # Payment processing routes
│   │   └── user.js             # User authentication routes
│   ├── utils/                   # Server utilities
│   │   ├── auth-utils.js       # Authentication helpers
│   │   ├── booking-utils.js    # Booking validation and formatting
│   │   ├── email-service.js    # Email functionality
│   │   ├── error-utils.js      # Error handling utilities
│   │   ├── jwt-utils.js        # JWT token management
│   │   ├── payment-utils.js    # Payment processing logic
│   │   └── pdf-utils.js        # PDF receipt generation
│   ├── models.js               # MongoDB schemas
│   └── server.js               # Main server file
├── tests/                       # Test files
│   ├── config/                  # Test configuration
│   ├── routes/                  # API endpoint tests
│   └── utils/                   # Test utilities
├── public/                      # Static assets
├── components.json              # shadcn/ui configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── vite.config.ts               # Vite build configuration
├── vercel.json                  # Vercel deployment config
└── render.yaml                  # Render deployment config
```

## 🔧 Development Features

### Automated Cleanup

- Expired pending bookings are automatically released every 5 minutes
- Old booking records are cleaned up daily via cron jobs
- Session timeout protection with automatic reservation cleanup

### Error Handling

- Comprehensive error handling throughout the application
- Graceful degradation for email service failures
- Detailed logging for debugging and monitoring
- Custom error utilities with async/await support

### Testing

- Jest testing framework configured with ES modules
- Test utilities for database operations
- API endpoint testing with Supertest
- Cross-platform test support with cross-env
- Isolated test database configuration

### Development Tools

- Hot reload with Vite development server
- Proxy configuration for API requests in development
- Environment-specific builds (development/production)
- Lovable tagger for development workflow
- API health check component for debugging

## 📧 Email System

The application includes a robust email system that:

- Sends verification emails for new user registrations
- Delivers booking confirmation emails with detailed information
- Includes professional HTML templates with booking references
- Provides password reset functionality
- Handles email service failures gracefully
- Uses configurable SMTP settings with fallback options
- Generates booking reference numbers for easy tracking

## 💳 Payment Integration

Stripe integration provides:

- Secure payment processing with multiple payment methods
- Support for cards and Revolut Pay
- Webhook handling for real-time payment updates
- Automatic booking confirmation upon successful payment
- 30-minute session expiration for security
- Dynamic pricing with environment-based price IDs
- PDF receipt generation for completed bookings
- Payment session cleanup on cancellation or expiry

## 🛡️ Security Measures

- JWT-based authentication with secure token management
- Password hashing using bcrypt with configurable salt rounds
- Rate limiting to prevent abuse
- Security headers via Helmet middleware
- Input validation and sanitization with Joi
- Admin role verification for protected routes
- CORS configuration for cross-origin requests
- Environment-specific security settings
- Session cleanup and token expiration handling
- Secure cookie configuration for production

## 📈 Monitoring & Analytics

The system includes built-in monitoring:

- Request logging with Morgan middleware
- Error tracking and logging with custom error handlers
- Performance monitoring for database operations
- Email service status verification
- Database connection health checks
- Real-time booking status tracking
- Automated cleanup job monitoring
- Development debugging tools and API health checks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the existing patterns:

- Use TypeScript for new frontend components
- Follow the existing folder structure
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Check the implementation details in the source code
- Review the test files for usage examples
- Open an issue on GitHub for bug reports
- Contact the development team for feature requests

## 🚀 Deployment

This project is deployed using a split architecture:

### Frontend Deployment (Vercel)

The React frontend is deployed on Vercel for optimal performance and CDN distribution.

1. **Connect your GitHub repository to Vercel**
2. **Set environment variables** in Vercel dashboard:
   ```env
   VITE_API_URL=https://kalucuts.onrender.com
   ```
3. **Deploy** - Vercel will automatically build and deploy on every push to main

### Backend Deployment (Render)

The Node.js/Express backend is deployed on Render for reliable server hosting.

1. **Connect your GitHub repository to Render**
2. **Create a Web Service** with the following settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
3. **Set environment variables** in Render dashboard:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_webhook_secret
   STRIPE_PRICE_ID_25=price_id_for_25_dollars
   STRIPE_PRICE_ID_50=price_id_for_50_dollars
   STRIPE_PRICE_ID_75=price_id_for_75_dollars
   EMAIL_USER=your_email
   EMAIL_PASS=your_email_password
   ADMIN_EMAIL=admin@yourdomain.com
   CLIENT_URL=https://your-frontend-url.vercel.app
   NODE_ENV=production
   ```

### Domain Configuration

- **Frontend**: Configure custom domain in Vercel dashboard
- **Backend**: Configure custom domain in Render dashboard
- **CORS**: Ensure your frontend domain is allowed in backend CORS settings
- **Webhooks**: Update Stripe webhook endpoint to point to your production backend

The current deployment configuration can be found in:

- `vercel.json` for frontend deployment
- `render.yaml` for backend deployment
