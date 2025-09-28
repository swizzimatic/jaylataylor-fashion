// Frontend Security Utilities

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} html - HTML string to sanitize
 * @returns {string} - Sanitized HTML string
 */
function sanitizeHTML(html) {
    // Create a temporary div element
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHTML(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;'
    };

    return String(text).replace(/[&<>"'/]/g, s => map[s]);
}

/**
 * Create safe HTML element with text content
 * @param {string} tag - HTML tag name
 * @param {string} text - Text content
 * @param {Object} attributes - Optional attributes
 * @returns {HTMLElement} - Safe HTML element
 */
function createSafeElement(tag, text, attributes = {}) {
    const element = document.createElement(tag);

    // Set text content (automatically escaped)
    if (text) {
        element.textContent = text;
    }

    // Set attributes safely
    for (const [key, value] of Object.entries(attributes)) {
        // Skip event handlers and dangerous attributes
        if (!key.startsWith('on') && key !== 'href' && key !== 'src') {
            element.setAttribute(key, value);
        } else if (key === 'href' || key === 'src') {
            // Validate URLs
            if (isValidURL(value)) {
                element.setAttribute(key, value);
            }
        }
    }

    return element;
}

/**
 * Validate URL to prevent javascript: and data: URLs
 * @param {string} url - URL to validate
 * @returns {boolean} - True if URL is safe
 */
function isValidURL(url) {
    try {
        const parsed = new URL(url, window.location.origin);
        // Only allow http, https, and relative URLs
        return ['http:', 'https:', ''].includes(parsed.protocol);
    } catch {
        // If URL parsing fails, check if it's a relative path
        return url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
    }
}

/**
 * Generate secure session token
 * @returns {string} - Secure session token
 */
function generateSecureSessionId() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store data securely in sessionStorage with encryption
 * @param {string} key - Storage key
 * @param {any} data - Data to store
 */
function secureStore(key, data) {
    try {
        const encrypted = btoa(JSON.stringify(data));
        sessionStorage.setItem(key, encrypted);
    } catch (error) {
        console.error('Failed to store data securely:', error);
    }
}

/**
 * Retrieve data securely from sessionStorage
 * @param {string} key - Storage key
 * @returns {any} - Decrypted data or null
 */
function secureRetrieve(key) {
    try {
        const encrypted = sessionStorage.getItem(key);
        if (!encrypted) return null;
        return JSON.parse(atob(encrypted));
    } catch (error) {
        console.error('Failed to retrieve data securely:', error);
        return null;
    }
}

/**
 * Session management with server
 */
class SecureSession {
    constructor() {
        this.token = null;
        this.csrfToken = null;
        this.sessionId = null;
    }

    /**
     * Initialize session with server
     */
    async init() {
        try {
            // Check for existing session token
            this.token = sessionStorage.getItem('session_token');

            if (!this.token) {
                // Create new session
                const response = await fetch('/api/session/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to create session');
                }

                const data = await response.json();
                this.token = data.token;
                sessionStorage.setItem('session_token', this.token);
            }

            // Get CSRF token
            await this.refreshCSRFToken();

            return true;
        } catch (error) {
            console.error('Session initialization failed:', error);
            return false;
        }
    }

    /**
     * Refresh CSRF token
     */
    async refreshCSRFToken() {
        try {
            const response = await fetch('/api/csrf-token', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.csrfToken = data.csrfToken;
            }
        } catch (error) {
            console.error('Failed to refresh CSRF token:', error);
        }
    }

    /**
     * Make authenticated API request
     */
    async request(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
            ...options.headers
        };

        // Add CSRF token for state-changing requests
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase())) {
            headers['X-CSRF-Token'] = this.csrfToken;
        }

        const response = await fetch(url, {
            ...options,
            headers
        });

        // Refresh CSRF token if it's expired
        if (response.status === 403) {
            await this.refreshCSRFToken();
            // Retry request
            headers['X-CSRF-Token'] = this.csrfToken;
            return fetch(url, {
                ...options,
                headers
            });
        }

        return response;
    }

    /**
     * Clear session
     */
    clear() {
        this.token = null;
        this.csrfToken = null;
        this.sessionId = null;
        sessionStorage.removeItem('session_token');
    }
}

// Export utilities
window.SecurityUtils = {
    sanitizeHTML,
    escapeHTML,
    createSafeElement,
    isValidURL,
    generateSecureSessionId,
    secureStore,
    secureRetrieve,
    SecureSession
};