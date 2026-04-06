# 🛍️ GoToKart — Frontend

<div align="center">

![GoToKart](https://img.shields.io/badge/GoToKart-Frontend-f5a623?style=for-the-badge&logo=html5&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

**A luxury dark-themed e-commerce frontend — no framework, pure HTML/CSS/JS**

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [File Structure](#-file-structure)
- [Getting Started](#-getting-started)
- [Authentication](#-authentication)
- [Pages & Sections](#-pages--sections)
- [API Integration](#-api-integration)
- [Product Categories](#-product-categories)
- [Design System](#-design-system)

---

## 🌟 Overview

GoToKart Frontend is a **single-page application** built with pure HTML, CSS, and JavaScript — no React, no Vue, no build tools needed. Just open `index.html` and go.

It connects to the GoToKart Spring Boot backend at `http://localhost:8080/api` and authenticates using **JWT tokens**.

**Design Philosophy:** Luxury dark theme inspired by high-end e-commerce. Deep blacks, amber gold accents, smooth animations, and a typography pairing of Playfair Display + DM Sans.

---

## ✨ Features

### 🔐 Authentication
- Register with name, email, password — returns JWT token
- Login with email + password — returns JWT token
- JWT stored in `localStorage` (`gk_token`)
- Session automatically restored on page reload from stored token
- Logout → clears token and returns to landing page
- User name and role shown in nav after login
- Admin panel visible only to `ADMIN` role users

### 🏬 Product Shop
- **Live search** — type to filter with highlighted matching text
- **11 Categories** — Electronics, Clothing, Footwear, Accessories, Beauty, Sports, Home, Food, Books, Toys, All
- **Smart sort** — Price (low/high), Name (A–Z/Z–A), Most in stock
- **Stock filter** — Show in-stock only or out-of-stock
- **Auto emoji detection** — 150+ product types auto-detected from product name
- **Category tags** — each product card shows its category
- **Add product** — admin-only expandable panel with category dropdown
- **Delete product** — 🗑️ button visible only to admins, with confirmation
- **Out of stock** badge — disabled button when stock = 0
- **Low stock warning** — ⚠️ when ≤ 5 items left

### 🛒 Cart
- Add to cart with custom quantity
- **+ / −** stepper to adjust quantity in cart
- Remove individual items with animation
- Real-time subtotal and total calculation
- Cart badge shows total quantity (not just item count) in nav bar
- Empty state with helpful message

### 📦 Orders
- Place order — stock reduces, cart clears instantly
- Beautiful success modal with order ID and total
- Order history list (newest first)
- **Expandable order details** — click any order to see items, quantities, prices
- Date + time shown per order

### 🎨 UI/UX
- Loading spinners with context messages
- Toast notifications for all actions
- Smooth card hover animations
- Animated hero section with floating cards
- Fully responsive for mobile
- Animated order success modal

---

## 📁 File Structure

```
frontend/
│
├── index.html      # Main HTML — all sections as hidden/shown divs
├── style.css       # All styling — dark theme, components, animations
├── script.js       # All logic — API calls, JWT auth, rendering, state
└── README.md       # This file
```

> Single page — no routing library, no bundler. Each "page" is a `<section>` that shows/hides.

---

## 🚀 Getting Started

### Prerequisites

- GoToKart Backend running at `http://localhost:8080`
- A modern browser (Chrome, Firefox, Edge, Safari)
- No npm, no node, no build step needed

### Setup

**Step 1 — Start the backend:**
```bash
cd backend
mvn clean spring-boot:run
```

**Step 2 — Open the frontend:**

Simply open `index.html` in your browser:
```
Double-click index.html
```

Or serve with VS Code Live Server extension for auto-reload.

**Step 3 — Log in as admin:**

| Field | Value |
|-------|-------|
| Email | `admin@gotokart.com` |
| Password | `admin123` |

---

## 🔐 Authentication

The frontend uses **JWT-based authentication**.

### Flow
1. User submits login/register form
2. `POST /api/auth/login` (or `/api/auth/register`) returns `{ token, id, name, email, role }`
3. Token is saved to `localStorage` as `gk_token`
4. All admin API calls include `Authorization: Bearer <token>` header via `authHeaders()`
5. On page reload, token is read from `localStorage` and session is restored automatically

### Key Functions in `script.js`

| Function | Purpose |
|----------|---------|
| `loginUser()` | POST to `/api/auth/login`, stores JWT |
| `registerUser()` | POST to `/api/auth/register`, stores JWT |
| `authHeaders()` | Returns `{ Authorization: Bearer <token> }` |
| `onLoginSuccess()` | Sets nav, shows admin panel if ADMIN role |
| `logoutUser()` | Clears token from localStorage |

---

## 📄 Pages & Sections

| Section ID | Route Trigger | Description |
|-----------|---------------|-------------|
| `#heroSection` | App load / Logout | Landing page with animated blob |
| `#authSection` | Click Login in nav | Login / Register tabs |
| `#productsSection` | Click Shop in nav | Product grid with search/filter |
| `#cartSection` | Click Cart in nav | Cart items and checkout |
| `#ordersSection` | Click Orders in nav | Order history |

All sections are in a single `index.html` — JavaScript shows/hides them via `showSection()`.

---

## 🔌 API Integration

All API calls are in `script.js`. The base URL is:

```javascript
const API = 'http://localhost:8080/api';
```

To change the backend URL, edit this one constant at the top of `script.js`.

### API Calls Summary

| Action | Method | Endpoint | Auth |
|--------|--------|----------|:----:|
| Login | `POST` | `/api/auth/login` | No |
| Register | `POST` | `/api/auth/register` | No |
| Get own profile | `GET` | `/api/users/me` | JWT |
| Get products | `GET` | `/api/products` | No |
| Add product | `POST` | `/api/products` | ADMIN JWT |
| Delete product | `DELETE` | `/api/products/{id}` | ADMIN JWT |
| Get cart | `GET` | `/api/cart/{userId}` | No |
| Add to cart | `POST` | `/api/cart/{userId}/add?productId=&quantity=` | No |
| Remove from cart | `DELETE` | `/api/cart/{userId}/remove?productId=` | No |
| Place order | `POST` | `/api/orders/{userId}/place` | No |
| Get orders | `GET` | `/api/orders/{userId}` | No |

---

## 🏷️ Product Categories

The frontend auto-detects product category and emoji from the product name:

| Category | Emoji | Example Products |
|----------|-------|-----------------|
| Electronics | 📱 💻 🎧 | iPhone, Laptop, Headphones, Camera |
| Clothing | 👕 👖 👗 🧥 | Shirt, Jeans, Dress, Jacket, Saree |
| Footwear | 👟 🥾 👠 🩴 | Shoes, Boots, Heels, Sandals |
| Accessories | 🕶️ ⌚ 💍 👜 | Goggles, Watch, Ring, Bag, Wallet |
| Beauty | 💅 💄 🧴 🧼 | Nail Paint, Lipstick, Shampoo, Soap |
| Sports | 🏋️ 🏏 ⚽ 🧘 | Dumbbell, Cricket Bat, Yoga Mat |
| Home | 🛏️ 💡 ❄️ 🧊 | Bed, Bulb, Fan, Refrigerator |
| Food | 🌾 ☕ 🍫 🥛 | Rice, Coffee, Chocolate, Milk |
| Books | 📚 ✏️ 📓 | Book, Pen, Notebook, Diary |
| Toys | 🧸 🎮 🧩 | Doll, PlayStation, Puzzle |

Category is also shown as a tag on each product card.

---

## 🎨 Design System

### Colors

```css
--bg:      #0a0a0f   /* Page background — near black */
--bg3:     #1c1c28   /* Input / surface background */
--accent:  #f5a623   /* Gold — primary brand color */
--accent2: #e8472a   /* Red — danger / cart badge */
--text:    #f0ede8   /* Primary text — warm white */
--text2:   #9a9890   /* Secondary text — muted */
```

### Typography

```css
--font-display: 'Playfair Display'   /* Headings, logo, titles */
--font-body:    'DM Sans'            /* Body text, buttons, labels */
```

### Key Animations

| Animation | Used On |
|-----------|---------|
| `fadeUp` | Product cards, cart items, order cards |
| `morph` | Hero blob shape |
| `float` | Hero floating cards |
| `spin` | Loading spinner |
| `modalIn` | Order success modal |
| `bounce` | Modal emoji |

---

## 📱 Responsive Breakpoints

| Breakpoint | Layout Change |
|-----------|---------------|
| `> 768px` | Two-column hero, multi-column product grid |
| `≤ 768px` | Single column, hidden hero visual, stacked filters |

---

## 🔧 Customization

### Change backend URL
```javascript
// script.js — top of file
const API = 'http://localhost:8080/api';
```

### Add a new emoji mapping
```javascript
// script.js — productEmoji() function
if (n.includes('medicine') || n.includes('capsule')) return '💊';
```

### Add a new category filter button
```html
<!-- index.html -->
<button class="cat-btn" onclick="filterByCategory('health')" data-cat="health">💊 Health</button>
```

### Change accent color
```css
/* style.css */
--accent: #f5a623;   /* Change to any color */
```

---

## 🗂️ Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full |
| Firefox | ✅ Full |
| Edge | ✅ Full |
| Safari | ✅ Full |
| IE 11 | ❌ Not supported |

---

<div align="center">

Built with ❤️ using **Vanilla HTML/CSS/JS** and **JWT Authentication**

**GoToKart** — Where every cart tells a story ⚡

</div>
