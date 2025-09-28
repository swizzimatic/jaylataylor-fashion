// Supabase Client Configuration for JaylaTaylor.com
// Handles database connection, authentication, and real-time cart sync

// Supabase configuration - Replace with your actual values
const SUPABASE_URL = 'https://your-project.supabase.co'; // TODO: Replace with actual URL
const SUPABASE_ANON_KEY = 'your-anon-key'; // TODO: Replace with actual anon key

// Initialize Supabase client
let supabase = null;

// Load Supabase SDK dynamically
async function loadSupabase() {
    if (!window.supabase) {
        // Load Supabase SDK from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.async = true;
        document.head.appendChild(script);

        // Wait for script to load
        await new Promise((resolve) => {
            script.onload = resolve;
        });
    }

    // Initialize client if not already done
    if (!supabase && window.supabase) {
        const { createClient } = window.supabase;
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
            },
            realtime: {
                params: {
                    eventsPerSecond: 2
                }
            }
        });
    }

    return supabase;
}

// Enhanced Cart Manager with Supabase integration
const SupabaseCartManager = {
    supabase: null,
    sessionId: null,
    cartSubscription: null,
    isOnline: false,

    // Initialize cart manager
    async init() {
        // Get or create session ID
        this.sessionId = localStorage.getItem('cartSessionId');
        if (!this.sessionId) {
            this.sessionId = this.generateSessionId();
            localStorage.setItem('cartSessionId', this.sessionId);
        }

        // Initialize Supabase
        try {
            this.supabase = await loadSupabase();
            await this.checkConnection();

            // Set up auth listener
            this.setupAuthListener();

            // Sync cart from server
            if (this.isOnline) {
                await this.syncCart();
            }

            // Subscribe to real-time cart updates
            this.subscribeToCart();
        } catch (error) {
            console.error('Failed to initialize Supabase:', error);
            this.fallbackToLocalStorage();
        }
    },

    // Generate unique session ID
    generateSessionId() {
        return `cart_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    },

    // Check Supabase connection
    async checkConnection() {
        try {
            const { data, error } = await this.supabase
                .from('products')
                .select('id')
                .limit(1);

            this.isOnline = !error;
            this.updateConnectionStatus();
            return this.isOnline;
        } catch (error) {
            this.isOnline = false;
            this.updateConnectionStatus();
            return false;
        }
    },

    // Update UI connection status
    updateConnectionStatus() {
        const cartIcon = document.querySelector('.cart-icon');
        const cartStatus = document.querySelector('.cart-status');

        if (this.isOnline) {
            if (cartIcon) cartIcon.classList.remove('offline');
            if (cartStatus) cartStatus.textContent = 'Cart Online';
            console.log('✅ Cart backend online with Supabase');
        } else {
            if (cartIcon) cartIcon.classList.add('offline');
            if (cartStatus) cartStatus.textContent = 'Cart Offline';
            console.log('❌ Cart backend offline, using local storage');
        }
    },

    // Set up authentication listener
    setupAuthListener() {
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN') {
                // User signed in - merge carts
                await this.mergeCartsOnSignIn(session.user);
            } else if (event === 'SIGNED_OUT') {
                // User signed out - create new anonymous cart
                this.sessionId = this.generateSessionId();
                localStorage.setItem('cartSessionId', this.sessionId);
                await this.syncCart();
            }
        });
    },

    // Sync cart with Supabase
    async syncCart() {
        if (!this.isOnline) return this.getLocalCart();

        try {
            // Call Edge Function for cart sync
            const { data, error } = await this.supabase.functions.invoke('cart-sync', {
                headers: {
                    'x-session-id': this.sessionId,
                },
                method: 'GET',
            });

            if (error) throw error;

            // Update local storage with server data
            if (data?.items) {
                localStorage.setItem('jaylaTaylorCart', JSON.stringify(data.items));
                this.updateCartUI(data.items);
            }

            return data?.items || [];
        } catch (error) {
            console.error('Cart sync failed:', error);
            return this.getLocalCart();
        }
    },

    // Subscribe to real-time cart updates
    subscribeToCart() {
        if (!this.isOnline || this.cartSubscription) return;

        this.cartSubscription = this.supabase
            .channel(`cart:${this.sessionId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'cart_sessions',
                filter: `session_id=eq.${this.sessionId}`,
            }, (payload) => {
                // Update local cart with real-time changes
                if (payload.new?.items) {
                    localStorage.setItem('jaylaTaylorCart', JSON.stringify(payload.new.items));
                    this.updateCartUI(payload.new.items);
                }
            })
            .subscribe();
    },

    // Add item to cart
    async addToCart(product) {
        if (!this.isOnline) {
            return this.addToLocalCart(product);
        }

        try {
            const { data, error } = await this.supabase.functions.invoke('cart-sync', {
                headers: {
                    'x-session-id': this.sessionId,
                },
                method: 'POST',
                body: {
                    productId: product.id,
                    quantity: product.quantity || 1,
                    size: product.size,
                    color: product.color,
                },
            });

            if (error) throw error;

            // Update local storage
            if (data?.items) {
                localStorage.setItem('jaylaTaylorCart', JSON.stringify(data.items));
                this.updateCartUI(data.items);
            }

            return data;
        } catch (error) {
            console.error('Failed to add to cart:', error);
            return this.addToLocalCart(product);
        }
    },

    // Remove item from cart
    async removeFromCart(productId, size, color) {
        if (!this.isOnline) {
            return this.removeFromLocalCart(productId, size, color);
        }

        try {
            const { data, error } = await this.supabase.functions.invoke('cart-sync', {
                headers: {
                    'x-session-id': this.sessionId,
                },
                method: 'DELETE',
                body: {
                    productId,
                    size,
                    color,
                },
            });

            if (error) throw error;

            // Update local storage
            if (data?.items) {
                localStorage.setItem('jaylaTaylorCart', JSON.stringify(data.items));
                this.updateCartUI(data.items);
            }

            return data;
        } catch (error) {
            console.error('Failed to remove from cart:', error);
            return this.removeFromLocalCart(productId, size, color);
        }
    },

    // Clear entire cart
    async clearCart() {
        if (!this.isOnline) {
            localStorage.removeItem('jaylaTaylorCart');
            this.updateCartUI([]);
            return;
        }

        try {
            const { data, error } = await this.supabase.functions.invoke('cart-sync/clear', {
                headers: {
                    'x-session-id': this.sessionId,
                },
                method: 'DELETE',
            });

            if (error) throw error;

            localStorage.removeItem('jaylaTaylorCart');
            this.updateCartUI([]);
        } catch (error) {
            console.error('Failed to clear cart:', error);
            localStorage.removeItem('jaylaTaylorCart');
            this.updateCartUI([]);
        }
    },

    // Merge carts when user signs in
    async mergeCartsOnSignIn(user) {
        try {
            const localCart = this.getLocalCart();

            if (localCart.length > 0) {
                // Update cart with user ID and merged items
                const { data, error } = await this.supabase.functions.invoke('cart-sync', {
                    headers: {
                        'x-session-id': this.sessionId,
                    },
                    method: 'PUT',
                    body: {
                        items: localCart,
                        userId: user.id,
                    },
                });

                if (error) throw error;

                console.log('Carts merged successfully');
            }
        } catch (error) {
            console.error('Failed to merge carts:', error);
        }
    },

    // Local storage fallback methods
    getLocalCart() {
        try {
            const cart = localStorage.getItem('jaylaTaylorCart');
            return cart ? JSON.parse(cart) : [];
        } catch {
            return [];
        }
    },

    addToLocalCart(product) {
        const cart = this.getLocalCart();
        const existingIndex = cart.findIndex(item =>
            item.id === product.id &&
            item.size === product.size &&
            item.color === product.color
        );

        if (existingIndex >= 0) {
            cart[existingIndex].quantity += product.quantity || 1;
        } else {
            cart.push({
                ...product,
                quantity: product.quantity || 1,
            });
        }

        localStorage.setItem('jaylaTaylorCart', JSON.stringify(cart));
        this.updateCartUI(cart);
        return cart;
    },

    removeFromLocalCart(productId, size, color) {
        let cart = this.getLocalCart();
        cart = cart.filter(item =>
            !(item.id === productId && item.size === size && item.color === color)
        );

        localStorage.setItem('jaylaTaylorCart', JSON.stringify(cart));
        this.updateCartUI(cart);
        return cart;
    },

    fallbackToLocalStorage() {
        this.isOnline = false;
        this.updateConnectionStatus();
        console.log('Using local storage for cart operations');
    },

    // Update cart UI
    updateCartUI(items) {
        // Update cart count
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const count = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
            cartCount.textContent = count;
            cartCount.style.display = count > 0 ? 'flex' : 'none';
        }

        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: items }));
    },

    // Get cart for checkout
    async getCartForCheckout() {
        if (this.isOnline) {
            await this.syncCart();
        }
        return this.getLocalCart();
    }
};

// Authentication Manager
const AuthManager = {
    supabase: null,
    currentUser: null,

    async init() {
        this.supabase = await loadSupabase();
        await this.checkSession();
    },

    // Check current session
    async checkSession() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            this.currentUser = user;
            this.updateAuthUI();
            return user;
        } catch (error) {
            console.error('Auth session check failed:', error);
            return null;
        }
    },

    // Sign up new user
    async signUp(email, password, metadata = {}) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: metadata,
                },
            });

            if (error) throw error;

            // Create customer record
            if (data.user) {
                await this.createCustomerRecord(data.user, metadata);
            }

            return { success: true, user: data.user };
        } catch (error) {
            console.error('Sign up failed:', error);
            return { success: false, error: error.message };
        }
    },

    // Sign in existing user
    async signIn(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            this.currentUser = data.user;
            this.updateAuthUI();

            // Sync cart after sign in
            await SupabaseCartManager.mergeCartsOnSignIn(data.user);

            return { success: true, user: data.user };
        } catch (error) {
            console.error('Sign in failed:', error);
            return { success: false, error: error.message };
        }
    },

    // Sign out
    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;

            this.currentUser = null;
            this.updateAuthUI();

            // Reset cart session
            await SupabaseCartManager.init();

            return { success: true };
        } catch (error) {
            console.error('Sign out failed:', error);
            return { success: false, error: error.message };
        }
    },

    // Create customer record in database
    async createCustomerRecord(user, metadata) {
        try {
            const { error } = await this.supabase
                .from('customers')
                .insert({
                    id: user.id,
                    email: user.email,
                    first_name: metadata.first_name,
                    last_name: metadata.last_name,
                    phone: metadata.phone,
                    newsletter_subscribed: metadata.newsletter || false,
                });

            if (error && error.code !== '23505') { // Ignore duplicate key error
                throw error;
            }
        } catch (error) {
            console.error('Failed to create customer record:', error);
        }
    },

    // Update auth UI
    updateAuthUI() {
        const authButton = document.querySelector('.auth-button');
        const userMenu = document.querySelector('.user-menu');

        if (this.currentUser) {
            if (authButton) authButton.textContent = 'Account';
            if (userMenu) userMenu.style.display = 'block';
        } else {
            if (authButton) authButton.textContent = 'Sign In';
            if (userMenu) userMenu.style.display = 'none';
        }
    },

    // Get current user
    getUser() {
        return this.currentUser;
    },

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.currentUser;
    }
};

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        await SupabaseCartManager.init();
        await AuthManager.init();
    });
} else {
    // DOM already loaded
    (async () => {
        await SupabaseCartManager.init();
        await AuthManager.init();
    })();
}

// Export for use in other scripts
window.SupabaseCartManager = SupabaseCartManager;
window.AuthManager = AuthManager;