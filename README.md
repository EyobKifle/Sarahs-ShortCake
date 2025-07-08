# Sarah's Short Cakes Web Application

A full-featured sales and order management system for Sarah's Short Cakes bakery.

## Features
- Customer and admin dashboards
- Product, order, and inventory management
- Email and SMS notifications
- Secure authentication (JWT)
- Real-time reports and analytics
- Responsive frontend for customers and admins

## Project Structure
```
├── controllers/         # Route controllers for business logic
├── middleware/          # Express middleware (auth, error handling, etc.)
├── models/              # Mongoose models (database schemas)
│   └── future-purpose/  # Models for future features
├── Public/              # Frontend HTML, CSS, JS, images
├── routes/              # Express route definitions
├── scripts/             # Setup and maintenance scripts
├── services/            # Business logic and integrations (email, SMS, etc.)
├── utils/               # Utility functions (with archive/ for unused)
├── uploads/             # Uploaded files (e.g., payment confirmations)
├── .env                 # Environment variables (not committed)
├── package.json         # Project metadata and dependencies
├── server.js            # Main Express server
```

## Setup
1. Clone the repository
2. Run `npm install` to install dependencies
3. Copy `.env.example` to `.env` and fill in your configuration
4. Start the server:
   - `npm run dev` (development with nodemon)
   - `npm start` (production)

## Scripts
- `npm run seed` — Seed the database with sample data
- `npm run setup-admin` — Create an initial admin user
- `node scripts/setup-notifications.js` — Configure email/SMS notifications

## Notes
- All sensitive data should be kept in `.env` (never commit this file)
- For future features, see `models/future-purpose/` and `utils/archive/`
- For support, contact info@sarahsshortcakes.com

---
© 2025 Sarah's Short Cakes. All rights reserved.
