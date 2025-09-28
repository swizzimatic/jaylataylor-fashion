# Jayla Taylor - Fashion Designer Website

A luxurious e-commerce and portfolio website for fashion designer Jayla Taylor, featuring a dark, elegant aesthetic with black and gold color scheme.

## Project Overview

This website serves as both an online portfolio showcasing Jayla Taylor's fashion work and an e-commerce platform for selling her luxury fashion collections.

### Key Features

- **E-commerce Functionality**
  - Product catalog with filtering and sorting
  - Shopping cart with local storage persistence
  - Secure checkout with Stripe integration via backend API
  - Quick view modal for products
  - Server-side product validation and price verification
  - Collection-based purchase restrictions
- **Portfolio Sections**
  - Fashion Week galleries (NYC & Paris)
  - Professional photography showcase
  - Magazine features and press
  - Designer biography
- **Design & UX**
  - Luxurious black and gold aesthetic
  - Responsive design for all devices
  - Smooth animations and transitions
  - Professional typography (Playfair Display & Lato)

## Color Palette

- Primary Dark: `#1A1A1A` (Deep Charcoal Black)
- Accent Gold 1: `#B8860B` (Dark Goldenrod)
- Accent Gold 2: `#D4AF37` (Metallic Gold)
- Secondary Dark: `#333333` (Soft Black)
- Neutral Light: `#F5F5F5` (Off-White/Light Gray)

## Project Structure

```
jaylataylor-website/
├── index.html              # Homepage
├── shop.html              # Product catalog
├── cart.html              # Shopping cart
├── checkout.html          # Checkout page
├── nyc-fashion-week.html  # NYC Fashion Week gallery
├── gallery.html           # Professional photography showcase
├── about.html             # About Jayla Taylor page
├── contact.html           # Contact and inquiries page
├── css/
│   ├── main.css          # Global styles
│   ├── shop.css          # Shop page styles
│   ├── checkout.css      # Checkout page styles
│   ├── gallery.css       # Gallery page styles
│   ├── about.css         # About page styles
│   └── contact.css       # Contact page styles
├── js/
│   ├── main.js           # Core functionality
│   ├── shop.js           # Shop page functionality
│   ├── checkout.js       # Checkout with Stripe
│   ├── gallery.js        # Gallery functionality
│   └── contact.js        # Contact form handling
├── data/
│   └── products.json     # Product catalog data
├── assets/               # Images and media (to be added)
└── backend/              # Backend API server
    ├── server.js         # Express server
    ├── routes/           # API endpoints
    ├── middleware/       # CORS, error handling
    ├── utils/            # Stripe config, validators
    └── data/             # Server-side product data
```

## Setup Instructions

1. **Clone/Download the project**

   ```bash
   cd THEJAYLATAYLOR/jaylataylor-website
   ```

2. **Add Stripe Integration**

   - Sign up for a Stripe account at https://stripe.com
   - Get your publishable key from the Stripe dashboard
   - Replace the placeholder key in `js/checkout.js`:
     ```javascript
     const stripe = Stripe("your_actual_publishable_key_here");
     ```

3. **Set up Backend (Required for payment processing)**

   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your Stripe keys
   npm run dev
   ```

   The backend provides:

   - `/api/create-payment-intent` - Creates Stripe payment intents with product validation
   - `/api/webhook` - Handles Stripe webhooks
   - Collection-based purchase restrictions (only Lingerie, Accessories, and Swim 2023 can be purchased)

   See `backend/README.md` for detailed setup instructions.

4. **Add Real Content**
   - Replace placeholder images with actual product photos
   - Add Fashion Week videos and galleries
   - Include professional photography
   - Add magazine feature content

## Next Steps

### Required for Production

1. **Payment Processing Backend**

   - Server-side Stripe integration
   - Order management system
   - Email confirmations

2. **Content Management System**

   - Product upload interface
   - Inventory management
   - Order tracking

3. **SEO Optimization**

   - Meta descriptions
   - Schema markup
   - Sitemap generation

4. **Security**
   - SSL certificate
   - Input validation
   - CSRF protection

### Additional Features to Consider

1. **User Accounts**

   - Customer registration/login
   - Order history
   - Wishlist functionality

2. **Enhanced E-commerce**

   - Product reviews
   - Size guides
   - Stock management
   - Discount codes

3. **Marketing Tools**
   - Email marketing integration
   - Social media feeds
   - Blog section

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Technologies Used

- HTML5
- CSS3 (with CSS Variables)
- Vanilla JavaScript
- Stripe.js for payments
- Font Awesome for icons
- Google Fonts (Playfair Display & Lato)

## Deployment

1. **Static Hosting** (for frontend only)

   - Netlify
   - Vercel
   - GitHub Pages

2. **Full-Stack Hosting** (with backend)
   - Heroku
   - AWS
   - DigitalOcean

## Support

For questions or issues, please contact the development team or refer to the project documentation.

---

© 2025 Jayla Taylor. All rights reserved.
