## 👥 Team Members

**Hemil Hansora,**
**Vrund Patel,**
**Meet Soni,**
**Kaustav Das,**

## Video-Link
https://drive.google.com/drive/folders/1OrXgx0pGqw3528OFfuNBvFRoKVTd3Ko5?usp=sharing

## Problem Statement


# Rental Management System - MERN Stack

A comprehensive rental management solution built with the MERN stack (MongoDB, Express.js, React.js, Node.js), designed to streamline rental operations for businesses that rent out equipment, vehicles, properties, or any other assets.

## 🏆 Project Overview

This project was developed as part of the **Odoo Hackathon 2025 - Final Round** for **Problem Statement 3: Rental Management**. The solution provides a complete rental management system with modern web technologies, featuring inventory tracking, customer management, and rental operations built on the powerful MERN stack.

## 🎯 Problem Statement

**Rental Management System** - Develop a comprehensive solution for businesses that need to manage rental operations including:
- Asset/Equipment inventory management
- Customer rental history and profiles
- Rental scheduling and availability tracking  
- Pricing and billing management
- Maintenance and service tracking
- Reporting and analytics

## ✨ Key Features

### 📋 Core Functionality
- **Asset Management**: Complete inventory tracking with categorization, specifications, and availability status
- **Customer Portal**: Self-service booking interface for customers
- **Rental Scheduling**: Advanced booking calendar with conflict detection
- **Pricing Engine**: Flexible pricing models (hourly, daily, weekly, monthly)
- **Contract Management**: Digital rental agreements and terms
- **Payment Integration**: Multiple payment methods and automated invoicing

### 🔧 Advanced Features
- **Maintenance Tracking**: Schedule and track asset maintenance
- **Damage Assessment**: Photo documentation and damage reports
- **Late Return Management**: Automated notifications and penalty calculations
- **Multi-location Support**: Manage rentals across different locations
- **Mobile App**: Field service and mobile access capabilities
- **Analytics Dashboard**: Comprehensive reporting and insights

### 🏗️ Technical Features
- **RESTful API**: Complete API for third-party integrations
- **Real-time Updates**: Live inventory and booking status
- **Multi-tenant Architecture**: Support for multiple rental businesses
- **Automated Workflows**: Smart automation for common tasks
- **Security**: Role-based access control and data encryption

## 🛠️ Technology Stack

- **Frontend**: React.js 18+ with TypeScript
- **Backend**: Node.js 18+ with Express.js
- **Database**: MongoDB 6.0+ with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **State Management**: Redux Toolkit + RTK Query
- **UI Framework**: Material-UI (MUI) / Tailwind CSS
- **Payment Integration**: Stripe / PayPal API
- **File Upload**: Cloudinary / AWS S3
- **Real-time**: Socket.IO
- **Testing**: Jest + React Testing Library
- **Deployment**: Docker, AWS/Vercel/Heroku

## 📁 Project Structure

```
rental-management-mern/
├── client/                      # React.js Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   │   ├── common/
│   │   │   ├── forms/
│   │   │   └── ui/
│   │   ├── pages/              # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Orders.jsx
│   │   │   └── CustomerPortal.jsx
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API services
│   │   ├── store/              # Redux store
│   │   ├── utils/              # Utility functions
│   │   ├── styles/             # CSS/SCSS files
│   │   └── App.jsx
│   ├── package.json
│   └── tailwind.config.js
├── server/                      # Node.js Backend
│   ├── controllers/            # Request handlers
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   └── userController.js
│   ├── models/                 # MongoDB models
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Payment.js
│   │   └── Maintenance.js
│   ├── routes/                 # API routes
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   └── users.js
│   ├── middleware/             # Custom middleware
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── config/                 # Configuration files
│   │   ├── database.js
│   │   └── cloudinary.js
│   ├── utils/                  # Utility functions
│   ├── tests/                  # API tests
│   ├── server.js               # Entry point
│   └── package.json
├── shared/                     # Shared utilities/types
├── docker-compose.yml          # Docker configuration
├── .gitignore
├── README.md
└── package.json                # Root package.json
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18.0 or higher
- MongoDB 6.0 or higher (or MongoDB Atlas account)
- npm or yarn package manager
- Git

### Quick Start

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Hemil-Hansora/rental-odoo.git
   cd rental-odoo
   ```

2. **Install Dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Create .env file in server directory
   cd ../server
   cp .env.example .env
   
   # Edit .env with your configuration
   MONGODB_URI=mongodb://localhost:27017/rental_management
   JWT_SECRET=your_jwt_secret_key
   CLOUDINARY_URL=your_cloudinary_url
   STRIPE_SECRET_KEY=your_stripe_secret
   ```

4. **Start Development Servers**
   ```bash
   # Start backend server (from server directory)
   npm run dev
   
   # In another terminal, start frontend (from client directory)
   cd ../client
   npm start
   ```

### Development Setup

1. **Setup MongoDB Database**
   ```bash
   # Local MongoDB
   mongod --dbpath /path/to/your/db
   
   # Or use MongoDB Atlas cloud database
   ```

2. **Seed Database (Optional)**
   ```bash
   cd server
   npm run seed
   ```

3. **Run Tests**
   ```bash
   # Backend tests
   cd server
   npm test
   
   # Frontend tests
   cd ../client
   npm test
   ```

## 📖 Usage Guide

### For Administrators

1. **Initial Setup**
   - Access admin dashboard at `/admin`
   - Configure rental categories and products
   - Set up pricing rules and policies
   - Configure payment gateways

2. **Daily Operations**
   - Monitor real-time bookings dashboard
   - Manage inventory and availability
   - Process returns and inspections
   - Generate analytics reports

### For Customers

1. **Making a Booking**
   - Browse products at `/products`
   - Check availability calendar
   - Complete secure checkout
   - Receive booking confirmation

2. **Managing Rentals**
   - Access customer portal at `/profile`
   - View rental history
   - Track current rentals
   - Download invoices and receipts

## 🔧 Configuration

### Environment Variables
Create `.env` files in both client and server directories:

**Server (.env)**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rental_management
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Cloudinary for file uploads
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payment Integration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email Service (SendGrid/Nodemailer)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@yourapp.com

# App Configuration
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Client (.env)**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

## 📊 Database Schema & Models

### MongoDB Collections

```javascript
// User Model
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String, // hashed
  role: Enum['customer', 'admin', 'staff'],
  phone: String,
  address: Object,
  createdAt: Date,
  updatedAt: Date
}

// Product Model (Rental Items)
{
  _id: ObjectId,
  name: String,
  description: String,
  category: ObjectId, // ref: Category
  images: [String],
  specifications: Object,
  pricing: {
    hourly: Number,
    daily: Number,
    weekly: Number,
    monthly: Number
  },
  availability: Boolean,
  quantity: Number,
  location: ObjectId, // ref: Location
  createdAt: Date,
  updatedAt: Date
}

// Order Model (Rental Bookings)
{
  _id: ObjectId,
  customer: ObjectId, // ref: User
  products: [{
    product: ObjectId, // ref: Product
    quantity: Number,
    pricePerUnit: Number
  }],
  startDate: Date,
  endDate: Date,
  totalAmount: Number,
  status: Enum['pending', 'confirmed', 'active', 'completed', 'cancelled'],
  paymentStatus: Enum['pending', 'paid', 'refunded'],
  paymentId: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔌 API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

### Authentication
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123"
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Products API
```http
GET /api/products?category=vehicles&available=true&date_from=2025-01-01&date_to=2025-01-07
Authorization: Bearer <token>
```

### Orders API
```http
POST /api/orders
Content-Type: application/json
Authorization: Bearer <token>

{
  "products": [
    {
      "product": "product_id",
      "quantity": 1
    }
  ],
  "startDate": "2025-01-01T10:00:00Z",
  "endDate": "2025-01-07T10:00:00Z"
}
```

### Payment API
```http
POST /api/payments/create-intent
Content-Type: application/json
Authorization: Bearer <token>

{
  "orderId": "order_id",
  "amount": 29999
}
```

## 🧪 Testing

### Backend Testing
```bash
cd server

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- controllers/productController.test.js
```

### Frontend Testing
```bash
cd client

# Run React tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run e2e tests (Cypress)
npm run cypress:open
```

### API Testing with Postman
Import the Postman collection from `/postman/rental-api.postman_collection.json`

### Test Database Setup
```bash
# Use separate test database
MONGODB_URI=mongodb://localhost:27017/rental_management_test
```

## 📈 Performance Optimization

### Backend Optimizations
- MongoDB indexing for frequently queried fields
- Redis caching for session management and frequent queries
- Connection pooling for database connections
- Compression middleware for API responses
- Rate limiting to prevent abuse
- Background jobs using Bull Queue

### Frontend Optimizations
- React.memo for component optimization
- Lazy loading of routes and components
- Image optimization with next/image or react-image
- Bundle splitting and code splitting
- Service workers for offline functionality
- CDN for static assets

### Database Optimizations
```javascript
// Example MongoDB indexes
db.products.createIndex({ "category": 1, "availability": 1 })
db.orders.createIndex({ "customer": 1, "createdAt": -1 })
db.users.createIndex({ "email": 1 }, { unique: true })
```

## 🔒 Security Considerations

### Authentication & Authorization
- JWT tokens with secure httpOnly cookies
- Password hashing using bcryptjs
- Role-based access control (RBAC)
- Refresh token rotation
- Account lockout after failed attempts

### API Security
- Input validation using Joi/Yup
- SQL injection prevention with Mongoose ODM
- XSS protection with helmet.js
- CORS configuration
- Rate limiting with express-rate-limit
- Request size limiting

### Data Protection
- Environment variables for sensitive data
- HTTPS enforcement in production
- Data encryption for sensitive fields
- Regular security audits
- Secure file upload with size and type restrictions

## 🌐 Deployment

### Production Deployment with Docker

**docker-compose.yml**
```yaml
version: '3.8'
services:
  client:
    build: ./client
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://server:5000/api
    depends_on:
      - server

  server:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/rental_management
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  mongo_data:
```

### Manual Deployment
```bash
# Build client for production
cd client
npm run build

# Start production server
cd ../server
npm run start:prod
```

### Environment Variables for Production
```bash
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db/rental_management
JWT_SECRET=your-super-secure-production-secret
FRONTEND_URL=https://yourdomain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint and Prettier configurations
- Use meaningful commit messages (Conventional Commits)
- Write tests for new features (minimum 80% coverage)
- Update documentation for API changes
- Use TypeScript for better type safety
- Follow React best practices and hooks patterns

## 📝 Documentation

- [User Manual](docs/user-manual.md)
- [Developer Guide](docs/developer-guide.md)
- [API Reference](docs/api-reference.md)
- [Deployment Guide](docs/deployment.md)
- [Troubleshooting](docs/troubleshooting.md)

## 🐛 Troubleshooting

### Common Issues

**Frontend not connecting to backend**
- Check REACT_APP_API_URL in client/.env
- Verify backend server is running on correct port
- Check CORS configuration in server

**Database connection errors**
- Verify MongoDB is running
- Check MONGODB_URI in server/.env
- Ensure database name is correct

**Authentication issues**
- Check JWT_SECRET configuration
- Verify token expiration settings
- Clear localStorage/cookies and re-login

**Build errors**
- Clear node_modules and reinstall dependencies
- Check Node.js version compatibility
- Verify environment variables are set

## 📋 Roadmap

### Version 1.0 (Current)
- [x] User authentication and authorization
- [x] Product catalog and search
- [x] Booking system with calendar
- [x] Payment integration (Stripe)
- [x] Customer dashboard
- [x] Basic admin panel

### Version 2.0 (Planned)
- [ ] Mobile React Native app
- [ ] Advanced analytics dashboard
- [ ] Real-time notifications
- [ ] Multi-language support
- [ ] Advanced reporting with charts
- [ ] Email automation

### Version 3.0 (Future)
- [ ] IoT device integration
- [ ] AI-powered recommendations
- [ ] Blockchain for contracts
- [ ] Advanced inventory management
- [ ] Multi-vendor marketplace
- [ ] Voice interface integration

## 📄 License

This project is licensed under the LGPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Project Lead**: [Your Name]
- **Backend Developer**: [Team Member]
- **Frontend Developer**: [Team Member]
- **QA Engineer**: [Team Member]

## 🙏 Acknowledgments

- React.js team for the amazing library
- Node.js and Express.js communities
- MongoDB team for the database
- Material-UI for the component library
- All open source contributors
- Hackathon organizers and participants

## 📞 Support

- **Email**: support@rental-mern.com
- **Documentation**: [GitHub Wiki](https://github.com/Hemil-Hansora/rental-odoo/wiki)
- **Issues**: [GitHub Issues](https://github.com/Hemil-Hansora/rental-odoo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Hemil-Hansora/rental-odoo/discussions)

---

**Built with ❤️ using MERN Stack for Odoo Hackathon 2025**

*This project demonstrates modern rental management capabilities using the MERN stack, showcasing best practices in full-stack development, user experience, and scalable architecture.*
