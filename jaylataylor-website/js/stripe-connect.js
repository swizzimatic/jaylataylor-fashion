// Stripe Connect Integration for PRSM Tech Marketplace
document.addEventListener('DOMContentLoaded', function() {
    
    // Configuration
    const API_BASE_URL = 'https://www.jaylataylor.com/api';
    
    // State management
    let connectedAccountId = localStorage.getItem('stripeConnectedAccountId');
    let accountStatus = null;
    
    // DOM Elements
    const connectBtn = document.getElementById('connectStripeBtn');
    const accountStatusContent = document.getElementById('accountStatusContent');
    const balanceContent = document.getElementById('balanceContent');
    const alertContainer = document.getElementById('alertContainer');
    const viewDashboardBtn = document.getElementById('viewDashboardBtn');
    const updateAccountBtn = document.getElementById('updateAccountBtn');
    const statusLoading = document.getElementById('statusLoading');
    const balanceLoading = document.getElementById('balanceLoading');
    
    // Check URL parameters for onboarding callbacks
    checkUrlParams();
    
    // Initialize dashboard if account exists
    if (connectedAccountId) {
        initializeDashboard();
    }
    
    // Event Listeners
    if (connectBtn) {
        connectBtn.addEventListener('click', handleStripeConnect);
    }
    
    if (viewDashboardBtn) {
        viewDashboardBtn.addEventListener('click', handleViewDashboard);
    }
    
    if (updateAccountBtn) {
        updateAccountBtn.addEventListener('click', handleUpdateAccount);
    }
    
    /**
     * Check URL parameters for Stripe onboarding callbacks
     */
    function checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.get('success') === 'true') {
            showAlert('Success! Your Stripe account has been connected.', 'success');
            // Clear the URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (urlParams.get('refresh') === 'true') {
            showAlert('Please complete your Stripe account setup.', 'info');
            // Refresh the onboarding link
            if (connectedAccountId) {
                createNewOnboardingLink();
            }
        } else if (urlParams.get('updated') === 'true') {
            showAlert('Your account information has been updated.', 'success');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
    
    /**
     * Initialize dashboard for existing connected account
     */
    async function initializeDashboard() {
        try {
            // Show loading states
            if (statusLoading) statusLoading.classList.add('active');
            if (balanceLoading) balanceLoading.classList.add('active');
            
            // Fetch account status
            await fetchAccountStatus();
            
            // Fetch balance if account is active
            if (accountStatus && accountStatus.isActive) {
                await fetchAccountBalance();
            }
            
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            showAlert('Error loading dashboard. Please refresh the page.', 'error');
        } finally {
            // Hide loading states
            if (statusLoading) statusLoading.classList.remove('active');
            if (balanceLoading) balanceLoading.classList.remove('active');
        }
    }
    
    /**
     * Handle Stripe Connect button click
     */
    async function handleStripeConnect() {
        try {
            connectBtn.disabled = true;
            connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
            
            // Check if we need to create a new account or onboard existing
            if (!connectedAccountId) {
                // Create new connected account
                const response = await fetch(`${API_BASE_URL}/stripe-connect/create-platform-account`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: prompt('Enter your business email:') || '',
                        businessName: prompt('Enter your business name:') || ''
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to create account');
                }
                
                const data = await response.json();
                connectedAccountId = data.accountId;
                localStorage.setItem('stripeConnectedAccountId', connectedAccountId);
            }
            
            // Create onboarding link
            const onboardingResponse = await fetch(`${API_BASE_URL}/stripe-connect/onboard-seller`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    accountId: connectedAccountId,
                    returnUrl: `${window.location.origin}/seller-dashboard.html?success=true`,
                    refreshUrl: `${window.location.origin}/seller-dashboard.html?refresh=true`
                })
            });
            
            if (!onboardingResponse.ok) {
                throw new Error('Failed to create onboarding link');
            }
            
            const onboardingData = await onboardingResponse.json();
            
            // Redirect to Stripe onboarding
            window.location.href = onboardingData.url;
            
        } catch (error) {
            console.error('Error connecting to Stripe:', error);
            showAlert('Failed to connect to Stripe. Please try again.', 'error');
            connectBtn.disabled = false;
            connectBtn.innerHTML = '<i class="fab fa-stripe"></i> Connect with Stripe';
        }
    }
    
    /**
     * Fetch account status from server
     */
    async function fetchAccountStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/stripe-connect/account-status/${connectedAccountId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch account status');
            }
            
            const data = await response.json();
            accountStatus = data.account;
            
            // Update UI based on account status
            updateAccountStatusUI();
            
        } catch (error) {
            console.error('Error fetching account status:', error);
            // Remove invalid account ID if fetch fails
            localStorage.removeItem('stripeConnectedAccountId');
            connectedAccountId = null;
        }
    }
    
    /**
     * Update account status UI
     */
    function updateAccountStatusUI() {
        if (!accountStatusContent || !accountStatus) return;
        
        let statusHTML = '';
        let statusClass = 'inactive';
        let statusText = 'Inactive';
        
        if (accountStatus.isActive) {
            statusClass = 'active';
            statusText = 'Active';
            
            // Enable action buttons
            if (viewDashboardBtn) viewDashboardBtn.disabled = false;
            if (updateAccountBtn) updateAccountBtn.disabled = false;
            
        } else if (accountStatus.requiresInfo) {
            statusClass = 'pending';
            statusText = 'Pending Verification';
            
            // Show what's needed
            const requirements = accountStatus.requirements?.currently_due || [];
            if (requirements.length > 0) {
                statusHTML += `
                    <div class="alert alert-info">
                        <strong>Action Required:</strong> Please complete the following:
                        <ul>
                            ${requirements.map(req => `<li>${formatRequirement(req)}</li>`).join('')}
                        </ul>
                        <button class="btn-secondary" onclick="handleUpdateAccount()">Complete Setup</button>
                    </div>
                `;
            }
        }
        
        statusHTML = `
            <div class="info-grid">
                <span class="info-label">Status:</span>
                <span class="info-value">
                    <span class="status-badge status-${statusClass}">${statusText}</span>
                </span>
                
                <span class="info-label">Account ID:</span>
                <span class="info-value">${accountStatus.id}</span>
                
                <span class="info-label">Charges Enabled:</span>
                <span class="info-value">${accountStatus.chargesEnabled ? 'Yes' : 'No'}</span>
                
                <span class="info-label">Payouts Enabled:</span>
                <span class="info-value">${accountStatus.payoutsEnabled ? 'Yes' : 'No'}</span>
            </div>
            ${statusHTML}
        `;
        
        accountStatusContent.innerHTML = statusHTML;
    }
    
    /**
     * Fetch account balance
     */
    async function fetchAccountBalance() {
        try {
            const response = await fetch(`${API_BASE_URL}/stripe-connect/balance/${connectedAccountId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch balance');
            }
            
            const data = await response.json();
            updateBalanceUI(data.balance);
            
        } catch (error) {
            console.error('Error fetching balance:', error);
        }
    }
    
    /**
     * Update balance UI
     */
    function updateBalanceUI(balance) {
        if (!balanceContent || !balance) return;
        
        // Calculate total available and pending
        const availableTotal = balance.available.reduce((sum, bal) => sum + bal.amount, 0);
        const pendingTotal = balance.pending.reduce((sum, bal) => sum + bal.amount, 0);
        
        balanceContent.innerHTML = `
            <p class="balance-label">Available Balance</p>
            <p class="balance-amount">$${(availableTotal / 100).toFixed(2)}</p>
            <p class="balance-label">Pending Balance</p>
            <p class="balance-amount">$${(pendingTotal / 100).toFixed(2)}</p>
        `;
    }
    
    /**
     * Handle view dashboard button click
     */
    async function handleViewDashboard() {
        try {
            viewDashboardBtn.disabled = true;
            viewDashboardBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            
            const response = await fetch(`${API_BASE_URL}/stripe-connect/dashboard-link/${connectedAccountId}`);
            
            if (!response.ok) {
                throw new Error('Failed to create dashboard link');
            }
            
            const data = await response.json();
            
            // Open Stripe dashboard in new tab
            window.open(data.url, '_blank');
            
        } catch (error) {
            console.error('Error creating dashboard link:', error);
            showAlert('Failed to open Stripe dashboard. Please try again.', 'error');
        } finally {
            viewDashboardBtn.disabled = false;
            viewDashboardBtn.innerHTML = '<i class="fas fa-chart-line"></i> Stripe Dashboard';
        }
    }
    
    /**
     * Handle update account button click
     */
    async function handleUpdateAccount() {
        try {
            updateAccountBtn.disabled = true;
            updateAccountBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            
            const response = await fetch(`${API_BASE_URL}/stripe-connect/create-account-link`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    accountId: connectedAccountId,
                    type: 'account_update'
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to create account link');
            }
            
            const data = await response.json();
            
            // Redirect to Stripe account update
            window.location.href = data.url;
            
        } catch (error) {
            console.error('Error creating account link:', error);
            showAlert('Failed to open account update. Please try again.', 'error');
            updateAccountBtn.disabled = false;
            updateAccountBtn.innerHTML = '<i class="fas fa-user-edit"></i> Update Account';
        }
    }
    
    /**
     * Create new onboarding link for incomplete accounts
     */
    async function createNewOnboardingLink() {
        try {
            const response = await fetch(`${API_BASE_URL}/stripe-connect/create-account-link`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    accountId: connectedAccountId,
                    type: 'account_onboarding'
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to create onboarding link');
            }
            
            const data = await response.json();
            
            // Show button to continue onboarding
            if (accountStatusContent) {
                accountStatusContent.innerHTML += `
                    <div class="alert alert-info">
                        <p>Your account setup is incomplete.</p>
                        <a href="${data.url}" class="connect-button">
                            <i class="fab fa-stripe"></i>
                            Continue Setup
                        </a>
                    </div>
                `;
            }
            
        } catch (error) {
            console.error('Error creating onboarding link:', error);
        }
    }
    
    /**
     * Format requirement string for display
     */
    function formatRequirement(requirement) {
        // Convert snake_case to readable format
        return requirement
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .replace(/Tos Acceptance/, 'Terms of Service Acceptance')
            .replace(/Ssn/, 'SSN')
            .replace(/Id/, 'ID');
    }
    
    /**
     * Show alert message
     */
    function showAlert(message, type = 'info') {
        if (!alertContainer) return;
        
        const alertClass = type === 'success' ? 'alert-success' : 
                          type === 'error' ? 'alert-error' : 'alert-info';
        
        const alertHTML = `
            <div class="alert ${alertClass}">
                ${message}
                <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        alertContainer.innerHTML = alertHTML;
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            const alerts = alertContainer.querySelectorAll('.alert');
            alerts.forEach(alert => alert.remove());
        }, 5000);
    }
    
    // Export functions for global access
    window.handleUpdateAccount = handleUpdateAccount;
});

/**
 * Create payment intent with platform fee for marketplace checkout
 * This function is called from checkout.js
 */
async function createMarketplacePaymentIntent(amount, sellerAccountId, cartItems, customerEmail) {
    const API_BASE_URL = 'https://www.jaylataylor.com/api';
    
    try {
        const response = await fetch(`${API_BASE_URL}/stripe-connect/create-payment-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: amount,
                sellerAccountId: sellerAccountId,
                cartItems: cartItems,
                customerEmail: customerEmail
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create payment intent');
        }
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error('Error creating marketplace payment intent:', error);
        throw error;
    }
}

// Export for use in other scripts
window.createMarketplacePaymentIntent = createMarketplacePaymentIntent;