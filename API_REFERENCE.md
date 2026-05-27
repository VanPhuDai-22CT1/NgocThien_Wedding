# API Reference Documentation

**Base URL:** `http://localhost:4000/api`  
**Version:** 1.0  
**Last Updated:** 2026-05-12

---

## Table of Contents

1. [Overview](#overview)
2. [Legacy Compatibility Layer](#legacy-compatibility-layer)
3. [Endpoint Reference](#endpoint-reference)
4. [Error Handling](#error-handling)
5. [Examples](#examples)

---

## Overview

### Authentication
Currently **no authentication** required (legacy compatibility mode).  
*Note: JWT authentication available for future enhancement*

### Response Format
All endpoints return JSON:
```json
{
  "success": true,
  "data": {},
  "message": "Optional error message"
}
```

### Request Methods
- **GET** - Retrieve data
- **POST** - Create/update data
- **DELETE** - Remove data

---

## Legacy Compatibility Layer

### Route: `/api/legacy`

All legacy PHP actions are routed through this single endpoint using the `action` parameter.

**Parameters:**
| Parameter | Type | Location | Required | Notes |
|-----------|------|----------|----------|-------|
| `action` | string | Query or Body | Yes | Action name (see Endpoints) |
| Other params | various | Query or Body | Depends | Action-specific params |

**Example:**
```bash
# Via GET query
GET /api/legacy?action=getProducts

# Via POST body
POST /api/legacy
{
  "action": "addConsultation",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "0123456789",
  "message": "Inquiry about services"
}
```

---

## Endpoint Reference

### Products

#### GET /api/legacy?action=getProducts
Get all products.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Product Name",
      "description": "...",
      "price": 100000,
      "cover": "image.jpg"
    }
  ]
}
```

---

### Consultations

#### GET /api/legacy?action=getConsultations
List all consultation requests.

**Query Parameters:**
| Parameter | Type | Optional | Notes |
|-----------|------|----------|-------|
| None | | | |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": null,
      "name": "Test User",
      "email": "test@example.com",
      "phone": "0123456789",
      "service": "",
      "event_date": null,
      "note": "",
      "status": "pending",
      "is_read": false,
      "created_at": "2026-05-12T05:21:38.568Z"
    }
  ]
}
```

#### POST /api/legacy?action=addConsultation
Create a new consultation request.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "0123456789",
  "service": "Wedding Planning",
  "event_date": "2026-06-15",
  "message": "Inquiry message"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "0123456789",
    "status": "pending",
    "created_at": "2026-05-12T05:21:38.568Z"
  }
}
```

#### POST /api/legacy?action=updateConsultationStatus
Update consultation status.

**Request Body:**
```json
{
  "id": 1,
  "status": "completed"
}
```

**Valid Status Values:**
- `pending` - Initial state
- `processing` - Being reviewed
- `completed` - Done
- `cancelled` - Cancelled

---

### Live Chat

#### GET /api/legacy?action=getLiveChatSessions
Get all chat sessions.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "visitor_id": "uuid",
      "started_at": "2026-05-12T05:21:38.568Z",
      "status": "active"
    }
  ]
}
```

#### GET /api/legacy?action=getLiveChatMessages
Get messages for a specific session.

**Query Parameters:**
| Parameter | Type | Required | Notes |
|-----------|------|----------|-------|
| `session_id` | number | Yes | Chat session ID |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "session_id": 1,
      "sender_type": "user|admin",
      "message": "Hello",
      "created_at": "2026-05-12T05:21:38.568Z"
    }
  ]
}
```

#### POST /api/legacy?action=sendLiveChatMessage
Send a new chat message.

**Request Body:**
```json
{
  "session_id": 1,
  "sender_type": "user",
  "message": "Hello, I have a question"
}
```

---

### Orders

#### GET /api/legacy?action=getOrders
Get all orders.

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "id": 1,
      "user_id": 1,
      "total_price": 500000,
      "status": "processing",
      "created_at": "2026-05-12T05:21:38.568Z",
      "items": [
        {
          "product_id": 1,
          "quantity": 2,
          "price": 250000
        }
      ]
    }
  ]
}
```

#### GET /api/legacy?action=getOrder
Get single order details.

**Query Parameters:**
| Parameter | Type | Required |
|-----------|------|----------|
| `id` | number | Yes |

#### GET /api/legacy?action=getOrdersByUser
Get orders for specific user.

**Query Parameters:**
| Parameter | Type | Required |
|-----------|------|----------|
| `user_id` | number | Yes |

#### POST /api/legacy?action=updateStatus
Update order status.

**Request Body:**
```json
{
  "id": 1,
  "status": "shipped"
}
```

**Valid Status Values:**
- `pending` - Awaiting confirmation
- `processing` - Being prepared
- `shipped` - In transit
- `delivered` - Received
- `cancelled` - Cancelled

#### POST /api/legacy?action=deleteOrder
Delete an order.

**Request Body:**
```json
{
  "id": 1
}
```

---

### Users

#### GET /api/legacy?action=getUsers
Get all users.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "user1",
      "email": "user@example.com",
      "role": "customer",
      "created_at": "2026-05-12T05:21:38.568Z"
    }
  ]
}
```

#### GET /api/legacy?action=getUser
Get single user details.

**Query Parameters:**
| Parameter | Type | Required |
|-----------|------|----------|
| `id` | number | Yes |

#### POST /api/legacy?action=updateUserRole
Change user role.

**Request Body:**
```json
{
  "id": 1,
  "role": "admin"
}
```

#### POST /api/legacy?action=updateUserInfo
Update user information.

**Request Body:**
```json
{
  "id": 1,
  "username": "newusername",
  "email": "new@example.com",
  "phone": "0123456789"
}
```

#### POST /api/legacy?action=deleteUser
Delete a user.

**Request Body:**
```json
{
  "id": 1
}
```

---

### Shopping Cart

#### GET /api/legacy?action=getCart
Get user's shopping cart.

**Query Parameters:**
| Parameter | Type | Required | Notes |
|-----------|------|----------|-------|
| `userid` | number | No | User ID (0 = guest cart) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "productId": 5,
      "name": "Product Name",
      "price": 100000,
      "quantity": 2,
      "cover": "image.jpg"
    }
  ],
  "cart": []
}
```

#### POST /api/legacy?action=addToCart
Add item to cart.

**Request Body:**
```json
{
  "product_id": 5,
  "quantity": 1,
  "user_id": null
}
```

#### POST /api/legacy?action=removeFromCart
Remove item from cart.

**Request Body:**
```json
{
  "cartItemId": 1
}
```

---

### Dashboard & Admin

#### GET /api/legacy?action=getDashboardStats
Get dashboard statistics.

**Response:**
```json
{
  "success": true,
  "total_users": 10,
  "total_products": 25,
  "total_orders": 100,
  "total_revenue": 5000000,
  "completed_orders": 80,
  "pending_orders": 15,
  "cancelled_orders": 5,
  "months": ["Jan", "Feb", ...],
  "monthly_revenue": [100000, 200000, ...]
}
```

#### GET /api/legacy?action=getActivityLogs
Get system activity logs.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "action": "login",
      "details": "User logged in",
      "created_at": "2026-05-12T05:21:38.568Z"
    }
  ]
}
```

#### GET /api/legacy?action=getAiRecommendations
Get AI-powered product recommendations.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Recommended Product",
      "score": 0.95
    }
  ]
}
```

---

### Homepage Customization

#### GET /api/homepage-config
Get current homepage configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "galleryImages": ["img1.jpg", "img2.jpg"],
    "consultImage": "consult.jpg",
    "headerSliderImages": ["h1.jpg", "h2.jpg"],
    "heroBackgroundImage": "hero.jpg",
    "imageHistory": {
      "gallery": [[], [], ...],
      "consult": [],
      "headerSlider": [],
      "heroBackground": []
    }
  }
}
```

#### POST /api/homepage-config
Upload images for homepage customization.

**Content-Type:** `multipart/form-data`

**Supported Fields:**
| Field | Max Count | Notes |
|-------|-----------|-------|
| `gallery_1` to `gallery_7` | 7 | Gallery images |
| `header_1` to `header_3` | 3 | Header slider images |
| `consult_image` | 1 | Consultation section image |
| `hero_background` | 1 | Hero section background |

**Example (cURL):**
```bash
curl -X POST http://localhost:4000/api/homepage-config \
  -F "gallery_1=@image1.jpg" \
  -F "header_1=@header1.jpg" \
  -F "hero_background=@hero.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "Images uploaded successfully",
  "data": {
    "galleryImages": ["/uploads/gallery/img1.jpg"],
    "uploadedAt": "2026-05-12T05:21:38.568Z"
  }
}
```

---

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Error details"
}
```

### Common Error Codes

| Status | Message | Meaning |
|--------|---------|---------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid parameters |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error |

### Error Examples

**Invalid action:**
```json
{
  "success": false,
  "message": "Action not found: unknownAction"
}
```

**Missing required field:**
```json
{
  "success": false,
  "message": "Cannot read properties of undefined (reading 'userId')"
}
```

---

## Examples

### JavaScript/Fetch

```javascript
// Get products
const response = await fetch('http://localhost:4000/api/legacy?action=getProducts');
const data = await response.json();
console.log(data);

// Add consultation
const consultation = await fetch('http://localhost:4000/api/legacy?action=addConsultation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '0123456789',
    message: 'Test consultation'
  })
});
const result = await consultation.json();
console.log(result);

// Upload homepage images
const formData = new FormData();
formData.append('gallery_1', fileInput.files[0]);
formData.append('header_1', fileInput.files[1]);

const upload = await fetch('http://localhost:4000/api/homepage-config', {
  method: 'POST',
  body: formData
});
const uploadResult = await upload.json();
console.log(uploadResult);
```

### cURL

```bash
# Get products
curl http://localhost:4000/api/legacy?action=getProducts

# Add consultation
curl -X POST http://localhost:4000/api/legacy?action=addConsultation \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "0123456789",
    "message": "Test consultation"
  }'

# Get dashboard stats
curl http://localhost:4000/api/legacy?action=getDashboardStats

# Get user cart
curl "http://localhost:4000/api/legacy?action=getCart&userid=1"

# Update order status
curl -X POST http://localhost:4000/api/legacy?action=updateStatus \
  -H "Content-Type: application/json" \
  -d '{"id": 1, "status": "shipped"}'
```

### Axios (React/Vue)

```javascript
import axios from 'axios';

const API = 'http://localhost:4000/api';

// Get products
const getProducts = async () => {
  const { data } = await axios.get(`${API}/legacy?action=getProducts`);
  return data;
};

// Add consultation
const addConsultation = async (formData) => {
  const { data } = await axios.post(`${API}/legacy?action=addConsultation`, formData);
  return data;
};

// Upload homepage images
const uploadHomepageImages = async (files) => {
  const formData = new FormData();
  files.forEach((file, index) => {
    formData.append(`gallery_${index + 1}`, file);
  });
  const { data } = await axios.post(`${API}/homepage-config`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};
```

---

**Last Updated:** 2026-05-12  
**API Version:** 1.0  
**Status:** ✅ Production Ready
