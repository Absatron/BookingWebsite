# Time Ticket Oasis

A modern, full-stack appointment booking system that allows users to book time slots and administrators to manage bookings with integrated payment processing.

## 📋 Project Overview

Time Ticket Oasis is a comprehensive booking management platform designed for service-based businesses. It provides a seamless experience for customers to book appointments while giving administrators powerful tools to manage availability and track bookings.

### 🌟 Key Features

#### For Customers

- **User Registration & Authentication** - Secure account creation with email verification
- **Interactive Calendar** - Browse available time slots with an intuitive calendar interface
- **Real-time Booking** - Instant slot selection with 30-minute reservation protection
- **Secure Payments** - Stripe-powered payment processing with support for cards and Revolut Pay
- **Booking Management** - View, track, and cancel pending bookings
- **Email Confirmations** - Automated booking confirmations with receipt generation
- **PDF Receipts** - Download professional PDF receipts for confirmed bookings

#### For Administrators

- **Admin Dashboard** - Comprehensive overview of bookings and system statistics
- **Time Slot Management** - Create, modify, and delete available appointment slots
- **Booking Oversight** - View all customer bookings with detailed information
- **Customer Management** - Access customer details and booking history
- **Real-time Updates** - Live booking status updates and availability tracking

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

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt** - Password hashing
- **Stripe** - Payment processing
- **Nodemailer** - Email service integration
- **PDFKit** - PDF generation for receipts

### DevOps & Utilities

- **ESLint** - Code linting and formatting
- **Jest** - Testing framework
- **Morgan** - HTTP request logging
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API protection
- **Compression** - Response compression
- **Cron Jobs** - Automated cleanup tasks

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB database
- Stripe account (for payments)
- Email service credentials (Gmail/SMTP)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd time-ticket-oasis
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

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID_[AMOUNT]=price_id_for_specific_amount

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Admin
ADMIN_EMAIL=admin@example.com

# Client URL
CLIENT_URL=http://localhost:8080
```

4. **Start the development servers**

```bash
# Start backend (runs on port 3000)
npm run server

# Start frontend (runs on port 8080)
npm run dev
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

### Booking Endpoints

- `GET /api/events` - Get all time slots
- `POST /api/events` - Create time slot (admin only)
- `DELETE /api/events/:id` - Delete time slot (admin only)
- `POST /api/bookings/initiate` - Initiate booking
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/admin/all` - Get all bookings (admin only)

### Payment Endpoints

- `POST /api/payment/create-checkout-session` - Create Stripe session
- `POST /api/payment/webhook` - Stripe webhook handler

## 🏗️ Project Structure

```
time-ticket-oasis/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── admin/               # Admin-specific components
│   │   ├── auth/                # Authentication components
│   │   ├── booking/             # Booking-related components
│   │   ├── payment/             # Payment components
│   │   └── ui/                  # Reusable UI components
│   ├── contexts/                # React context providers
│   ├── pages/                   # Main page components
│   ├── types/                   # TypeScript type definitions
│   └── lib/                     # Utility functions
├── server/                      # Backend source code
│   ├── routes/                  # Express route handlers
│   ├── utils/                   # Server utilities
│   ├── models.js               # MongoDB schemas
│   └── server.js               # Main server file
├── public/                      # Static assets
└── tests/                       # Test files
```

## 🔧 Development Features

### Automated Cleanup

- Expired pending bookings are automatically released every 5 minutes
- Old booking records are cleaned up daily via cron jobs

### Error Handling

- Comprehensive error handling throughout the application
- Graceful degradation for email service failures
- Detailed logging for debugging and monitoring

### Testing

- Jest testing framework configured
- Test utilities for database operations
- API endpoint testing with Supertest

## 📧 Email System

The application includes a robust email system that:

- Sends verification emails for new user registrations
- Delivers booking confirmation emails with detailed information
- Includes professional HTML templates with booking references
- Provides password reset functionality
- Handles email service failures gracefully

## 💳 Payment Integration

Stripe integration provides:

- Secure payment processing
- Support for multiple payment methods
- Webhook handling for real-time payment updates
- Automatic booking confirmation upon successful payment
- 30-minute session expiration for security

## 🛡️ Security Measures

- JWT-based authentication with secure token management
- Password hashing using bcrypt with configurable salt rounds
- Rate limiting to prevent abuse
- Security headers via Helmet middleware
- Input validation and sanitization
- Admin role verification for protected routes

## 📈 Monitoring & Analytics

The system includes built-in monitoring:

- Request logging with Morgan
- Error tracking and logging
- Performance monitoring
- Email service status verification
- Database connection health checks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Check the documentation in the `/docs` folder
- Review the `EMAIL_SETUP.md` for email configuration
- Open an issue on GitHub for bug reports
- Contact the development team for feature requests

## 🚀 Deployment

This project is deployed using a split architecture:

### Frontend Deployment (Vercel)

The React frontend is deployed on Vercel for optimal performance and CDN distribution.

1. **Connect your GitHub repository to Vercel**
2. **Set environment variables** in Vercel dashboard:
   ```env
   VITE_API_URL=https://your-backend-url.render.com
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

For detailed deployment instructions, see `PRODUCTION_DEPLOYMENT.md`.
