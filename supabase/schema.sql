-- Supabase Database Schema for JaylaTaylor.com
-- Version: 1.0.0
-- Description: E-commerce schema with customer auth, cart management, and order processing

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- =====================================================
-- PRODUCTS TABLE - Core product catalog
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('bucket-hats', 'swim', 'lingerie', 'timeless')),
    collection TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    sale_price DECIMAL(10, 2) CHECK (sale_price >= 0),
    currency TEXT DEFAULT 'USD',
    sizes JSONB DEFAULT '[]'::jsonb,
    colors JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    fabric_content TEXT,
    care_instructions TEXT,
    inventory_count INTEGER DEFAULT 0 CHECK (inventory_count >= 0),
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    not_for_sale BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_available ON products(is_available);
CREATE INDEX idx_products_featured ON products(is_featured);

-- =====================================================
-- CUSTOMERS TABLE - Customer accounts with auth
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    stripe_customer_id TEXT UNIQUE,
    shipping_address JSONB,
    billing_address JSONB,
    preferences JSONB DEFAULT '{}'::jsonb,
    newsletter_subscribed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes for customer lookups
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_stripe ON customers(stripe_customer_id);

-- =====================================================
-- CART_SESSIONS TABLE - Persistent shopping carts
-- =====================================================
CREATE TABLE IF NOT EXISTS cart_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    items JSONB DEFAULT '[]'::jsonb,
    subtotal DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    shipping_amount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for cart operations
CREATE INDEX idx_cart_sessions_session ON cart_sessions(session_id);
CREATE INDEX idx_cart_sessions_customer ON cart_sessions(customer_id);
CREATE INDEX idx_cart_sessions_expires ON cart_sessions(expires_at);

-- =====================================================
-- ORDERS TABLE - Completed orders and transactions
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_email TEXT NOT NULL,
    items JSONB NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    shipping_amount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    platform_fee DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded')),
    fulfillment_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (fulfillment_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned')),
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_charge_id TEXT,
    shipping_address JSONB NOT NULL,
    billing_address JSONB,
    shipping_tracking_number TEXT,
    shipping_carrier TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ
);

-- Create indexes for order queries
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_email ON orders(customer_email);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_fulfillment_status ON orders(fulfillment_status);
CREATE INDEX idx_orders_stripe_payment ON orders(stripe_payment_intent_id);

-- =====================================================
-- ORDER_EVENTS TABLE - Order history and tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS order_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for order events
CREATE INDEX idx_order_events_order ON order_events(order_id);
CREATE INDEX idx_order_events_created ON order_events(created_at);

-- =====================================================
-- INVENTORY_TRANSACTIONS TABLE - Stock tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity_change INTEGER NOT NULL,
    transaction_type TEXT NOT NULL
        CHECK (transaction_type IN ('sale', 'return', 'restock', 'adjustment', 'reserved')),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for inventory tracking
CREATE INDEX idx_inventory_product ON inventory_transactions(product_id);
CREATE INDEX idx_inventory_order ON inventory_transactions(order_id);

-- =====================================================
-- NEWSLETTER_SUBSCRIBERS TABLE - Email marketing
-- =====================================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    is_active BOOLEAN DEFAULT true,
    source TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ,
    CONSTRAINT newsletter_email_format CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create index for newsletter queries
CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_active ON newsletter_subscribers(is_active);

-- =====================================================
-- CONTACT_SUBMISSIONS TABLE - Contact form entries
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    newsletter_opt_in BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    is_responded BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for contact submissions
CREATE INDEX idx_contact_email ON contact_submissions(email);
CREATE INDEX idx_contact_read ON contact_submissions(is_read);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Products: Public read, admin write
CREATE POLICY "Products are viewable by everyone"
    ON products FOR SELECT
    USING (true);

CREATE POLICY "Products are editable by admin only"
    ON products FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- Customers: Users can view/edit their own data
CREATE POLICY "Users can view own customer data"
    ON customers FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own customer data"
    ON customers FOR UPDATE
    USING (auth.uid() = id);

-- Cart Sessions: Public create, owner can view/edit
CREATE POLICY "Anyone can create a cart session"
    ON cart_sessions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Cart sessions are viewable by session owner"
    ON cart_sessions FOR SELECT
    USING (
        session_id = current_setting('request.headers')::json->>'x-session-id'
        OR customer_id = auth.uid()
    );

CREATE POLICY "Cart sessions are editable by session owner"
    ON cart_sessions FOR UPDATE
    USING (
        session_id = current_setting('request.headers')::json->>'x-session-id'
        OR customer_id = auth.uid()
    );

-- Orders: Customers can view their own orders
CREATE POLICY "Customers can view own orders"
    ON orders FOR SELECT
    USING (customer_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- Newsletter: Public insert, admin can view all
CREATE POLICY "Anyone can subscribe to newsletter"
    ON newsletter_subscribers FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admin can view all subscribers"
    ON newsletter_subscribers FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin');

-- Contact: Public insert, admin can view all
CREATE POLICY "Anyone can submit contact form"
    ON contact_submissions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admin can view all contact submissions"
    ON contact_submissions FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_sessions_updated_at BEFORE UPDATE ON cart_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    new_order_number TEXT;
    order_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate order number: JT-YYYYMMDD-XXXX
        new_order_number := 'JT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                           LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

        -- Check if order number exists
        SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = new_order_number) INTO order_exists;

        EXIT WHEN NOT order_exists;
    END LOOP;

    RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired cart sessions
CREATE OR REPLACE FUNCTION clean_expired_carts()
RETURNS void AS $$
BEGIN
    DELETE FROM cart_sessions
    WHERE expires_at < NOW()
    AND customer_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIAL DATA MIGRATION HELPERS
-- =====================================================

-- Function to import products from JSON
CREATE OR REPLACE FUNCTION import_products_from_json(products_json JSONB)
RETURNS void AS $$
DECLARE
    product JSONB;
BEGIN
    FOR product IN SELECT * FROM jsonb_array_elements(products_json)
    LOOP
        INSERT INTO products (
            sku, name, description, category, collection,
            price, sizes, colors, images, fabric_content,
            inventory_count, is_available, not_for_sale
        ) VALUES (
            product->>'id',
            product->>'name',
            product->>'description',
            product->>'category',
            product->>'collection',
            (product->>'price')::DECIMAL,
            product->'sizes',
            product->'colors',
            product->'images',
            product->>'fabric',
            COALESCE((product->>'inventory')::INTEGER, 10),
            COALESCE((product->>'available')::BOOLEAN, true),
            COALESCE((product->>'notForSale')::BOOLEAN, false)
        ) ON CONFLICT (sku) DO UPDATE SET
            name = EXCLUDED.name,
            price = EXCLUDED.price,
            inventory_count = EXCLUDED.inventory_count;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- View for available products
CREATE OR REPLACE VIEW available_products AS
SELECT * FROM products
WHERE is_available = true
AND inventory_count > 0
AND not_for_sale = false;

-- View for order summary
CREATE OR REPLACE VIEW order_summary AS
SELECT
    DATE(created_at) as order_date,
    COUNT(*) as total_orders,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as average_order_value,
    COUNT(DISTINCT customer_id) as unique_customers
FROM orders
WHERE payment_status = 'succeeded'
GROUP BY DATE(created_at)
ORDER BY order_date DESC;

-- =====================================================
-- GRANT PERMISSIONS FOR SUPABASE SERVICE
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON products TO authenticated;
GRANT ALL ON cart_sessions TO authenticated;
GRANT SELECT, INSERT ON newsletter_subscribers TO authenticated;
GRANT INSERT ON contact_submissions TO authenticated;

-- Grant permissions to anonymous users for public operations
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON products TO anon;
GRANT INSERT, SELECT, UPDATE ON cart_sessions TO anon;
GRANT INSERT ON newsletter_subscribers TO anon;
GRANT INSERT ON contact_submissions TO anon;