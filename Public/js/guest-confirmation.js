// Guest Order Confirmation JavaScript
// Handles displaying order details for guest orders in EDB5A185 format

class GuestOrderConfirmation {
    constructor() {
        this.orderData = null;
        this.init();
    }

    init() {
        console.log('🎯 Initializing Guest Order Confirmation...');
        this.loadOrderData();
        this.displayOrderDetails();
    }

    // Generate EDB5A185 format order number
    generateEDB5A185Format() {
        // Generate 3 random letters
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let orderNumber = '';
        
        // Add 3 random letters
        for (let i = 0; i < 3; i++) {
            orderNumber += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        
        // Add random number (1-9)
        orderNumber += Math.floor(Math.random() * 9) + 1;
        
        // Add random letter
        orderNumber += letters.charAt(Math.floor(Math.random() * letters.length));
        
        // Add 3-4 random numbers
        const numCount = Math.random() > 0.5 ? 3 : 4;
        for (let i = 0; i < numCount; i++) {
            orderNumber += Math.floor(Math.random() * 10);
        }
        
        return orderNumber;
    }

    // Load order data from URL parameters or localStorage
    loadOrderData() {
        console.log('📦 Loading guest order data...');
        
        // Try to get order data from URL parameters first
        const urlParams = new URLSearchParams(window.location.search);
        const orderIdParam = urlParams.get('orderId');
        const orderDataParam = urlParams.get('orderData');
        
        if (orderDataParam) {
            try {
                this.orderData = JSON.parse(decodeURIComponent(orderDataParam));
                console.log('✅ Order data loaded from URL:', this.orderData);
                return;
            } catch (error) {
                console.error('❌ Error parsing order data from URL:', error);
            }
        }
        
        // Try to get from localStorage
        const storedOrderData = localStorage.getItem('guestOrderData');
        if (storedOrderData) {
            try {
                this.orderData = JSON.parse(storedOrderData);
                console.log('✅ Order data loaded from localStorage:', this.orderData);
                // Clear the stored data after loading
                localStorage.removeItem('guestOrderData');
                return;
            } catch (error) {
                console.error('❌ Error parsing order data from localStorage:', error);
            }
        }
        
        // If no order data found, create sample data for testing
        console.log('⚠️ No order data found, creating sample data...');
        this.orderData = this.createSampleOrderData();
    }

    // Create sample order data for testing
    createSampleOrderData() {
        return {
            orderNumber: this.generateEDB5A185Format(),
            orderId: 'guest_' + Date.now(),
            customerType: 'guest',
            status: 'pending',
            createdAt: new Date().toISOString(),
            guestInfo: {
                name: 'Guest Customer',
                email: 'guest@example.com',
                phone: '123-456-7890'
            },
            items: [
                {
                    name: 'Chocolate Cupcake with Vanilla Icing',
                    price: 5.99,
                    quantity: 2,
                    total: 11.98,
                    image: 'images/menu images/Chocolate cupcake with vanilla icing.jpg'
                },
                {
                    name: 'Red Velvet Cake',
                    price: 7.99,
                    quantity: 1,
                    total: 7.99,
                    image: 'images/menu images/Red Velvet cak.jpg'
                }
            ],
            subtotal: 19.97,
            tax: 1.60,
            deliveryFee: 0.00,
            totalAmount: 21.57,
            deliveryInfo: {
                method: 'pickup',
                address: '123 Test Street, Test City'
            },
            payment: {
                method: 'proof_upload',
                status: 'pending',
                amount: 21.57
            }
        };
    }

    // Display all order details on the page
    displayOrderDetails() {
        if (!this.orderData) {
            console.error('❌ No order data available to display');
            return;
        }

        console.log('🖥️ Displaying order details...');
        
        this.displayBasicInfo();
        this.displayOrderItems();
        this.displayOrderSummary();
        this.updateDeliveryInfo();
        this.updateTrackingLink();
    }

    // Display basic order information
    displayBasicInfo() {
        // Order Number (EDB5A185 format)
        const orderIdElement = document.getElementById('order-id');
        if (orderIdElement) {
            orderIdElement.textContent = this.orderData.orderNumber || this.generateEDB5A185Format();
        }

        // Order Date
        const orderDateElement = document.getElementById('order-date');
        if (orderDateElement) {
            const orderDate = new Date(this.orderData.createdAt || Date.now());
            orderDateElement.textContent = orderDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // Order Status
        const orderStatusElement = document.getElementById('order-status');
        if (orderStatusElement) {
            const status = this.orderData.status || 'pending';
            orderStatusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        }

        // Customer Type
        const customerTypeElement = document.getElementById('customer-type');
        if (customerTypeElement) {
            customerTypeElement.textContent = 'Guest';
        }
    }

    // Display order items in the table
    displayOrderItems() {
        const orderItemsElement = document.getElementById('order-items');
        if (!orderItemsElement || !this.orderData.items) {
            console.error('❌ Order items element or items data not found');
            return;
        }

        orderItemsElement.innerHTML = '';

        this.orderData.items.forEach(item => {
            const row = document.createElement('tr');
            
            // Item details with image
            const itemCell = document.createElement('td');
            itemCell.innerHTML = `
                <div class="item-details">
                    <img src="${item.image || 'images/placeholder.jpg'}" 
                         alt="${item.name}" 
                         class="item-image"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="item-image error" style="display:none;">
                        <i class="fas fa-image"></i>
                    </div>
                    <div>
                        <div class="item-name">${item.name}</div>
                        ${item.customizations ? `<div class="item-options">${this.formatCustomizations(item.customizations)}</div>` : ''}
                    </div>
                </div>
            `;

            // Quantity
            const quantityCell = document.createElement('td');
            quantityCell.textContent = item.quantity;

            // Price
            const priceCell = document.createElement('td');
            priceCell.textContent = `$${item.price.toFixed(2)}`;

            // Total
            const totalCell = document.createElement('td');
            totalCell.textContent = `$${(item.price * item.quantity).toFixed(2)}`;

            row.appendChild(itemCell);
            row.appendChild(quantityCell);
            row.appendChild(priceCell);
            row.appendChild(totalCell);

            orderItemsElement.appendChild(row);
        });
    }

    // Format customizations for display
    formatCustomizations(customizations) {
        if (Array.isArray(customizations)) {
            return customizations.map(c => `${c.name}: ${c.value}`).join(', ');
        } else if (typeof customizations === 'object') {
            return Object.entries(customizations).map(([key, value]) => `${key}: ${value}`).join(', ');
        }
        return '';
    }

    // Display order summary
    displayOrderSummary() {
        // Subtotal
        const subtotalElement = document.getElementById('subtotal');
        if (subtotalElement) {
            subtotalElement.textContent = `$${(this.orderData.subtotal || 0).toFixed(2)}`;
        }

        // Delivery Fee
        const deliveryFeeElement = document.getElementById('delivery-fee');
        if (deliveryFeeElement) {
            deliveryFeeElement.textContent = `$${(this.orderData.deliveryFee || 0).toFixed(2)}`;
        }

        // Tax
        const taxElement = document.getElementById('tax');
        if (taxElement) {
            taxElement.textContent = `$${(this.orderData.tax || 0).toFixed(2)}`;
        }

        // Total
        const totalElement = document.getElementById('total');
        if (totalElement) {
            totalElement.textContent = `$${(this.orderData.totalAmount || 0).toFixed(2)}`;
        }
    }

    // Update delivery information
    updateDeliveryInfo() {
        const deliveryDetailsElement = document.getElementById('delivery-details');
        if (deliveryDetailsElement && this.orderData.deliveryInfo) {
            const method = this.orderData.deliveryInfo.method;
            if (method === 'pickup') {
                deliveryDetailsElement.textContent = 'Your order will be ready for pickup at our store location.';
            } else if (method === 'delivery') {
                const address = this.orderData.deliveryInfo.address || 'your specified address';
                deliveryDetailsElement.textContent = `Your cupcakes will be delivered to ${address}.`;
            }
        }

        // Update confirmation email text
        const emailTextElement = document.getElementById('confirmation-email-text');
        if (emailTextElement && this.orderData.guestInfo && this.orderData.guestInfo.email) {
            emailTextElement.textContent = `We'll send a confirmation email with your order details to ${this.orderData.guestInfo.email}.`;
        }
    }

    // Update tracking link with order number
    updateTrackingLink() {
        const trackOrderBtn = document.getElementById('track-order-btn');
        if (trackOrderBtn && this.orderData.orderNumber) {
            const currentHref = trackOrderBtn.getAttribute('href');
            trackOrderBtn.setAttribute('href', `${currentHref}?orderNumber=${this.orderData.orderNumber}`);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GuestOrderConfirmation();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GuestOrderConfirmation;
}
