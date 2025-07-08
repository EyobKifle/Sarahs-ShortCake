# API Documentation

## Authentication
- `POST /api/auth/login` — User login
- `POST /api/auth/register` — User registration
- `POST /api/auth/logout` — User logout

## Customers
- `GET /api/customers` — List all customers (admin only)
- `GET /api/customers/:id` — Get customer by ID
- `POST /api/customers` — Create new customer
- `PUT /api/customers/:id` — Update customer
- `DELETE /api/customers/:id` — Delete customer

## Orders
- `GET /api/orders` — List all orders (admin only)
- `GET /api/orders/:id` — Get order by ID
- `POST /api/orders` — Create new order
- `POST /api/orders/guest` — Guest order
- `PUT /api/orders/:id` — Update order
- `DELETE /api/orders/:id` — Delete order

## Products
- `GET /api/products` — List all products
- `GET /api/products/:id` — Get product by ID
- `POST /api/products` — Create new product (admin only)
- `PUT /api/products/:id` — Update product (admin only)
- `DELETE /api/products/:id` — Delete product (admin only)

## Inventory
- `GET /api/inventory` — List inventory items
- `POST /api/inventory` — Add inventory item
- `PUT /api/inventory/:id` — Update inventory item
- `DELETE /api/inventory/:id` — Delete inventory item

## Reports
- `GET /api/reports/sales` — Sales report
- `GET /api/reports/inventory` — Inventory report
- `GET /api/reports/customers` — Customer report

## Notifications
- `POST /api/notifications/email` — Send email notification
- `POST /api/notifications/sms` — Send SMS notification

---
For more details, see the controller files or contact the project maintainer.
