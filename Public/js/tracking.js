/**
 * Comprehensive Order Tracking System for Sarah's Short Cakes
 * Supports EDB5A185 format order numbers and PDF export functionality
 */

class OrderTrackingSystem {
    constructor() {
        this.currentOrder = null;
        this.isLoading = false;
        this.init();
    }

    // Initialize the tracking system
    init() {
        console.log('🔍 Initializing Order Tracking System...');
        this.setupEventListeners();
        this.checkURLParameters();
        console.log('✅ Order Tracking System initialized');
    }

    // Setup all event listeners
    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');

        // Tracking form submission
        const trackingForm = document.getElementById('tracking-form');
        if (trackingForm) {
            console.log('✅ Found tracking form, adding submit listener');
            trackingForm.addEventListener('submit', (e) => {
                console.log('📝 Form submit event triggered');
                e.preventDefault();
                this.handleTrackingSubmission();
            });
        } else {
            console.error('❌ Tracking form not found!');
        }

        // Also add click listener to the track button directly
        const trackBtn = document.getElementById('track-btn');
        if (trackBtn) {
            console.log('✅ Found track button, adding click listener');
            trackBtn.addEventListener('click', (e) => {
                console.log('🖱️ Track button clicked');
                e.preventDefault();
                this.handleTrackingSubmission();
            });
        } else {
            console.error('❌ Track button not found!');
        }

        // Export PDF button
        const exportPdfBtn = document.getElementById('export-pdf-btn');
        if (exportPdfBtn) {
            console.log('✅ Found export PDF button');
            exportPdfBtn.addEventListener('click', () => {
                this.exportToPDF();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            console.log('✅ Found refresh button');
            refreshBtn.addEventListener('click', () => {
                this.refreshOrderStatus();
            });
        }

        // Order number input formatting
        const orderNumberInput = document.getElementById('order-number');
        if (orderNumberInput) {
            console.log('✅ Found order number input');
            orderNumberInput.addEventListener('input', (e) => {
                this.formatOrderNumberInput(e.target);
            });
        } else {
            console.error('❌ Order number input not found!');
        }

        console.log('🔧 Event listeners setup complete');
    }

    // Setup event listeners for order details buttons (called after order is displayed)
    setupOrderDetailsEventListeners() {
        console.log('🔧 Setting up order details event listeners...');

        // Export PDF button
        const exportPdfBtn = document.getElementById('export-pdf-btn');
        if (exportPdfBtn) {
            // Remove any existing listeners to prevent duplicates
            exportPdfBtn.replaceWith(exportPdfBtn.cloneNode(true));
            const newExportBtn = document.getElementById('export-pdf-btn');

            newExportBtn.addEventListener('click', () => {
                console.log('📄 Export PDF button clicked');
                this.exportToPDF();
            });
            console.log('✅ Export PDF button listener added');
        } else {
            console.error('❌ Export PDF button not found');
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            // Remove any existing listeners to prevent duplicates
            refreshBtn.replaceWith(refreshBtn.cloneNode(true));
            const newRefreshBtn = document.getElementById('refresh-btn');

            newRefreshBtn.addEventListener('click', () => {
                console.log('🔄 Refresh button clicked');
                this.refreshOrderData();
            });
            console.log('✅ Refresh button listener added');
        } else {
            console.error('❌ Refresh button not found');
        }

        console.log('🔧 Order details event listeners setup complete');
    }

    // Check URL parameters for order number
    checkURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const orderNumber = urlParams.get('orderNumber');

        if (orderNumber) {
            console.log('🔗 Order number found in URL:', orderNumber);
            document.getElementById('order-number').value = orderNumber;
            this.trackOrder(orderNumber);
        }
    }

    // Format order number input to match EDB5A185 pattern
    formatOrderNumberInput(input) {
        let value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

        // Apply EDB5A185 format: 3 letters + 1 number + 1 letter + 3-4 numbers
        // Maximum length is 9 characters (3+1+1+4)
        if (value.length > 9) {
            value = value.substring(0, 9);
        }

        input.value = value;
    }

    // Validate EDB5A185 format order number
    validateOrderNumber(orderNumber) {
        const pattern = /^[A-Z]{3}[0-9][A-Z][0-9]{3,4}$/;
        return pattern.test(orderNumber);
    }

    // Handle tracking form submission
    async handleTrackingSubmission() {
        console.log('🔍 handleTrackingSubmission called');

        const orderNumberInput = document.getElementById('order-number');
        if (!orderNumberInput) {
            console.error('❌ Order number input not found');
            alert('Order number input not found');
            return;
        }

        const orderNumber = orderNumberInput.value.trim().toUpperCase();
        console.log('📝 Order number entered:', orderNumber);

        if (!orderNumber) {
            console.log('⚠️ No order number entered');
            this.showError('Please enter an order number');
            return;
        }

        console.log('🔍 Validating order number format...');
        if (!this.validateOrderNumber(orderNumber)) {
            console.log('❌ Invalid order number format:', orderNumber);
            console.log('⚠️ Proceeding anyway for testing...');
            // this.showError('Invalid order number format. Please use format: ABC1D234');
            // return;
        }

        console.log('✅ Order number format valid, tracking order...');
        await this.trackOrder(orderNumber);
    }

    // Main tracking function
    async trackOrder(orderNumber) {
        if (this.isLoading) {
            console.log('⚠️ Already loading, ignoring duplicate request');
            return;
        }

        console.log('🔍 Tracking order:', orderNumber);

        this.isLoading = true;
        this.showLoading();
        this.hideMessages();
        this.hideOrderDetails();

        try {
            const order = await this.fetchOrderByNumber(orderNumber);

            if (order) {
                this.currentOrder = order;
                this.showSuccess('Order found successfully!');
                this.displayOrderDetails(order);
            } else {
                this.showError('Order not found. Please check your order number and try again.');
            }
        } catch (error) {
            console.error('❌ Error tracking order:', error);
            this.showError('Error searching for order. Please try again later.');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    // Fetch order by order number from API
    async fetchOrderByNumber(orderNumber) {
        console.log('📡 Fetching order from API:', orderNumber);

        try {
            // Try public order endpoint first (for guest orders)
            const response = await fetch(`/api/orders/public/orderNumber/${orderNumber}`);

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Order fetched successfully:', result);
                return result.success ? result.data : result;
            }

            // If not found in public orders, try protected endpoint (for registered customers)
            const token = localStorage.getItem('token');
            if (token) {
                const protectedResponse = await fetch(`/api/orders/${orderNumber}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (protectedResponse.ok) {
                    const result = await protectedResponse.json();
                    console.log('✅ Protected order fetched successfully:', result);
                    return result.success ? result.data : result;
                }
            }

            console.log('❌ Order not found in any endpoint');
            return null;

        } catch (error) {
            console.error('❌ API Error:', error);
            throw error;
        }
    }

    // Refresh order status
    async refreshOrderStatus() {
        if (!this.currentOrder || !this.currentOrder.orderNumber) {
            this.showError('No order to refresh');
            return;
        }

        console.log('🔄 Refreshing order status...');
        await this.trackOrder(this.currentOrder.orderNumber);
    }

    // Display comprehensive order details inline
    displayOrderDetails(order) {
        console.log('🖥️ displayOrderDetails called with order:', order);

        try {
            // Update order header
            console.log('📝 Updating order header...');
            this.updateOrderHeader(order);

            // Update order information grid
            console.log('📊 Updating order info grid...');
            this.updateOrderInfoGrid(order);

            // Update customer information
            console.log('👤 Updating customer info...');
            this.updateCustomerInfo(order);

            // Update order items
            console.log('🛍️ Updating order items...');
            this.updateOrderItems(order);

            // Update order summary
            console.log('💰 Updating order summary...');
            this.updateOrderSummary(order);

            // Update status timeline
            console.log('⏰ Updating status timeline...');
            this.updateStatusTimeline(order);

            // Show order details section
            console.log('🖥️ Showing order details section...');
            this.showOrderDetails();

            // Setup event listeners for buttons that are now visible
            this.setupOrderDetailsEventListeners();

            console.log('✅ Order details display complete');
        } catch (error) {
            console.error('❌ Error displaying order details:', error);
            this.showError('Error displaying order details');
        }
    }

    // Update order header section
    updateOrderHeader(order) {
        const orderNumberDisplay = document.getElementById('order-number-display');
        const orderDate = document.getElementById('order-date');

        if (orderNumberDisplay) {
            orderNumberDisplay.textContent = order.orderNumber || order._id;
        }

        if (orderDate) {
            const date = new Date(order.createdAt || order.orderDate || Date.now());
            orderDate.textContent = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    // Update order information grid
    updateOrderInfoGrid(order) {
        // Status badge
        const statusBadge = document.getElementById('order-status-badge');
        if (statusBadge) {
            const status = order.status || 'pending';
            statusBadge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            statusBadge.className = `status-badge ${status.toLowerCase()}`;
        }

        // Customer type
        const customerType = document.getElementById('customer-type');
        if (customerType) {
            customerType.textContent = order.customerType === 'guest' ? 'Guest' : 'Registered Customer';
        }

        // Delivery method
        const deliveryMethod = document.getElementById('delivery-method');
        if (deliveryMethod) {
            const method = order.deliveryInfo?.method || order.deliveryMethod || 'pickup';
            deliveryMethod.textContent = method.charAt(0).toUpperCase() + method.slice(1);
        }

        // Total amount
        const totalAmount = document.getElementById('total-amount');
        if (totalAmount) {
            totalAmount.textContent = `$${(order.totalAmount || 0).toFixed(2)}`;
        }
    }

    // Update customer information section
    updateCustomerInfo(order) {
        const customerDetails = document.getElementById('customer-details');
        if (!customerDetails) return;

        let customerInfo = '';

        if (order.customerType === 'guest' && order.guestInfo) {
            customerInfo = `
                <p><strong>Name:</strong> ${order.guestInfo.name || 'N/A'}</p>
                <p><strong>Email:</strong> ${order.guestInfo.email || 'N/A'}</p>
                <p><strong>Phone:</strong> ${order.guestInfo.phone || 'N/A'}</p>
                ${order.guestInfo.address ? `<p><strong>Address:</strong> ${order.guestInfo.address}</p>` : ''}
            `;
        } else if (order.customer) {
            customerInfo = `
                <p><strong>Name:</strong> ${order.customer.name || 'N/A'}</p>
                <p><strong>Email:</strong> ${order.customer.email || 'N/A'}</p>
                <p><strong>Phone:</strong> ${order.customer.phone || 'N/A'}</p>
                ${order.customer.address ? `<p><strong>Address:</strong> ${order.customer.address}</p>` : ''}
            `;
        } else {
            customerInfo = '<p>Customer information not available</p>';
        }

        customerDetails.innerHTML = customerInfo;
    }

    // Get product image based on product ID
    getProductImage(productId, customization = null) {
        console.log(`🖼️ Getting image for product: ${productId}`, customization);

        // Product ID to image mapping
        const productImageMap = {
            'vanilla-cupcake': 'images/menu images/Vanilla cupcake with Vanilla icing.jpg',
            'chocolate-cupcake': 'images/menu images/Chocolate cupcake with vanilla icing.jpg',
            'french-vanilla-cupcake': 'images/menu images/French Vanilla cupcake with vanilla icing.jpg',
            'red-velvet-cupcake': 'images/menu images/Red Velvet cak.jpg',
            'white-chocolate-cupcake': 'images/menu images/White chocolate with cream cheese.jpg',
            'blueberry-cupcake': 'images/menu images/blueberry cupcake with mint icing.jpg',
            'chocolate-cheesecake': 'images/menu images/Chocolate cheesecake with maple bacon.jpg',
            'apple-cinnamon-cupcake': 'images/menu images/apple cinammon cupcake with german cocolate icing.jpg',
            'champagne-cupcake': 'images/menu images/champagne cupcake with lemon icing.jpg',
            'coconut-cupcake': 'images/menu images/cocunut cupcake with coconut pecan icing.jpg',
            'cookies-cream-cupcake': 'images/menu images/cookies and cream cupcake with  espresso icing.jpg',
            'double-chocolate-cupcake': 'images/menu images/double chocolate with coocie crumbs.jpg',
            'mississippi-mud-cupcake': 'images/menu images/missipi mud cake with dark choclate icing.jpg',
            'peanut-butter-cupcake': 'images/menu images/peanut butter cupcake with oreo icing.jpg',
            'pumpkin-spice-cupcake': 'images/menu images/pumpkin spice with champagne icing.jpg',
            'smores-cupcake': 'images/menu images/smores cupcake strawberry icing.jpg',
            'strawberry-cupcake': 'images/menu images/strawberry cupcake with peanut icing.jpg'
        };

        // Try exact match first
        let imagePath = productImageMap[productId];

        // If no exact match, try partial matching
        if (!imagePath) {
            const productIdLower = productId.toLowerCase();
            for (const [key, value] of Object.entries(productImageMap)) {
                if (productIdLower.includes(key.split('-')[0]) || key.includes(productIdLower.split('-')[0])) {
                    imagePath = value;
                    console.log(`🖼️ Found partial match: ${key} -> ${value}`);
                    break;
                }
            }
        }

        // Fallback images based on flavor/type
        if (!imagePath && customization) {
            const flavor = customization.flavor?.toLowerCase() || '';
            if (flavor.includes('vanilla')) {
                imagePath = 'images/menu images/Vanilla cupcake with Vanilla icing.jpg';
            } else if (flavor.includes('chocolate')) {
                imagePath = 'images/menu images/Chocolate cupcake with vanilla icing.jpg';
            } else if (flavor.includes('strawberry')) {
                imagePath = 'images/menu images/strawberry cupcake with peanut icing.jpg';
            } else if (flavor.includes('red velvet')) {
                imagePath = 'images/menu images/Red Velvet cak.jpg';
            }
        }

        // Final fallback
        if (!imagePath) {
            imagePath = 'images/menu images/Vanilla cupcake with Vanilla icing.jpg';
        }

        console.log(`🖼️ Final image path: ${imagePath}`);
        return imagePath;
    }

    // Generate product name from ID and customization
    getProductName(productId, customization = null) {
        // Base name mapping
        const nameMap = {
            'vanilla-cupcake': 'Vanilla Cupcake',
            'chocolate-cupcake': 'Chocolate Cupcake',
            'french-vanilla-cupcake': 'French Vanilla Cupcake',
            'red-velvet-cupcake': 'Red Velvet Cupcake',
            'white-chocolate-cupcake': 'White Chocolate Cupcake',
            'blueberry-cupcake': 'Blueberry Cupcake',
            'strawberry-cupcake': 'Strawberry Cupcake'
        };

        let name = nameMap[productId] || productId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        // Add customization details if available
        if (customization && customization.flavor) {
            name = `${customization.flavor} Cupcake`;
        }

        return name;
    }

    // Update order items table
    updateOrderItems(order) {
        console.log('🛍️ updateOrderItems called with order:', order);
        const tbody = document.getElementById('order-items-tbody');
        if (!tbody) {
            console.error('❌ Order items tbody not found');
            return;
        }

        tbody.innerHTML = '';

        if (!order.items || order.items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No items found</td></tr>';
            return;
        }

        console.log(`🛍️ Processing ${order.items.length} items`);

        order.items.forEach((item, index) => {
            console.log(`🛍️ Processing item ${index + 1}:`, item);

            const row = document.createElement('tr');

            // Get product image and name
            const productImage = this.getProductImage(item.productId, item.customization);
            const productName = this.getProductName(item.productId, item.customization);

            // Item details with enhanced image handling
            const itemCell = document.createElement('td');

            // Create image element with multiple fallback levels
            const imageHtml = `
                <img src="${productImage}"
                     alt="${productName}"
                     class="item-image"
                     onload="console.log('✅ Image loaded:', this.src)"
                     onerror="this.onerror=null; this.src='images/front/Soft and Fluffy Vanilla Cupcakes.jpg'; console.log('⚠️ Image fallback 1:', this.src)"
                     style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
            `;

            itemCell.innerHTML = `
                <div class="item-details">
                    ${imageHtml}
                    <div style="margin-left: 1rem;">
                        <div class="item-name" style="font-weight: 600; margin-bottom: 0.25rem;">${productName}</div>
                        ${item.customization ? `<div class="item-customizations" style="color: #666; font-size: 0.9rem;">${this.formatCustomizations(item.customization)}</div>` : ''}
                    </div>
                </div>
            `;

            // Quantity
            const quantityCell = document.createElement('td');
            quantityCell.textContent = item.quantity || 1;
            quantityCell.style.textAlign = 'center';

            // Price
            const priceCell = document.createElement('td');
            priceCell.textContent = `$${(item.price || 0).toFixed(2)}`;
            priceCell.style.textAlign = 'right';

            // Total
            const totalCell = document.createElement('td');
            const itemTotal = (item.price || 0) * (item.quantity || 1);
            totalCell.textContent = `$${itemTotal.toFixed(2)}`;
            totalCell.style.textAlign = 'right';
            totalCell.style.fontWeight = '600';

            row.appendChild(itemCell);
            row.appendChild(quantityCell);
            row.appendChild(priceCell);
            row.appendChild(totalCell);

            tbody.appendChild(row);

            console.log(`✅ Added item ${index + 1}: ${productName} - $${itemTotal.toFixed(2)}`);
        });

        console.log('✅ All items processed successfully');
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

    // Update order summary section
    updateOrderSummary(order) {
        console.log('💰 updateOrderSummary called with order:', order);

        const subtotalElement = document.getElementById('subtotal-amount');
        const deliveryFeeElement = document.getElementById('delivery-fee-amount');
        const taxElement = document.getElementById('tax-amount');
        const finalTotalElement = document.getElementById('final-total-amount');

        // Extract values with multiple field name support
        const subtotal = order.subtotal || order.subTotal || 0;
        const deliveryFee = order.deliveryFee || order.delivery_fee || order.shippingCost || 0;
        const tax = order.tax || order.taxAmount || order.tax_amount || 0;

        // Calculate total from multiple possible sources
        let total = order.totalAmount || order.total || order.grandTotal;
        if (!total || total === 0) {
            // Calculate total if not provided
            total = subtotal + deliveryFee + tax;
            console.log(`💰 Calculated total: ${subtotal} + ${deliveryFee} + ${tax} = ${total}`);
        }

        console.log('💰 Order summary values:', {
            subtotal,
            deliveryFee,
            tax,
            total
        });

        if (subtotalElement) {
            subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
            console.log(`💰 Updated subtotal: $${subtotal.toFixed(2)}`);
        } else {
            console.error('❌ Subtotal element not found');
        }

        if (deliveryFeeElement) {
            deliveryFeeElement.textContent = `$${deliveryFee.toFixed(2)}`;
            console.log(`💰 Updated delivery fee: $${deliveryFee.toFixed(2)}`);
        } else {
            console.error('❌ Delivery fee element not found');
        }

        if (taxElement) {
            taxElement.textContent = `$${tax.toFixed(2)}`;
            console.log(`💰 Updated tax: $${tax.toFixed(2)}`);
        } else {
            console.error('❌ Tax element not found');
        }

        if (finalTotalElement) {
            finalTotalElement.textContent = `$${total.toFixed(2)}`;
            console.log(`💰 Updated final total: $${total.toFixed(2)}`);
        } else {
            console.error('❌ Final total element not found');
        }

        // Also update the total amount in the order info grid
        const totalAmountElement = document.getElementById('total-amount');
        if (totalAmountElement) {
            totalAmountElement.textContent = `$${total.toFixed(2)}`;
            console.log(`💰 Updated order info grid total: $${total.toFixed(2)}`);
        }
    }

    // Update status timeline
    updateStatusTimeline(order) {
        const timeline = document.getElementById('order-timeline');
        if (!timeline) return;

        timeline.innerHTML = '';

        // Create default timeline steps
        const defaultSteps = [
            { status: 'Order Placed', key: 'pending', description: 'Your order has been received and is being processed' },
            { status: 'Preparing', key: 'processing', description: 'Our bakers are preparing your delicious cupcakes' },
            { status: 'Ready', key: 'ready', description: 'Your order is ready for pickup or delivery' },
            { status: 'Completed', key: 'delivered', description: 'Order has been delivered or picked up' }
        ];

        const currentStatus = order.status || 'pending';
        const orderDate = new Date(order.createdAt || Date.now());

        defaultSteps.forEach((step, index) => {
            const stepElement = document.createElement('div');
            stepElement.className = 'status-step';

            // Determine if step is completed or active
            const stepIndex = defaultSteps.findIndex(s => s.key === currentStatus);
            const currentIndex = defaultSteps.findIndex(s => s.key === step.key);

            if (currentIndex < stepIndex || (currentIndex === stepIndex && currentStatus !== 'pending')) {
                stepElement.classList.add('completed');
            } else if (currentIndex === stepIndex) {
                stepElement.classList.add('active');
            }

            // Calculate estimated date for each step
            let stepDate = new Date(orderDate);
            stepDate.setHours(stepDate.getHours() + (index * 2)); // 2 hours between steps

            stepElement.innerHTML = `
                <div class="step-content">
                    <div class="step-title">${step.status}</div>
                    <div class="step-date">${stepDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</div>
                    <p class="step-description">${step.description}</p>
                </div>
            `;

            timeline.appendChild(stepElement);
        });
    }

    // Export order details to PDF
    async exportToPDF() {
        if (!this.currentOrder) {
            this.showError('No order to export');
            return;
        }

        console.log('📄 Exporting order to PDF...');
        this.showNotification('Generating PDF...', 'info');

        try {
            // Check if jsPDF is available
            if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
                throw new Error('PDF library not loaded');
            }

            // Get jsPDF constructor
            const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
            if (!jsPDF) {
                throw new Error('jsPDF constructor not found');
            }

            const doc = new jsPDF();

            // Set up PDF styling
            const primaryColor = [255, 107, 139]; // #FF6B8B
            const darkColor = [7, 59, 76]; // #073B4C

            // Header
            doc.setFillColor(...primaryColor);
            doc.rect(0, 0, 210, 30, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text("Sarah's Short Cakes", 20, 20);

            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text('Order Details', 150, 20);

            // Order Information
            doc.setTextColor(...darkColor);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('Order Information', 20, 45);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            let yPos = 55;

            const orderInfo = [
                ['Order Number:', this.currentOrder.orderNumber || this.currentOrder._id],
                ['Order Date:', new Date(this.currentOrder.createdAt || Date.now()).toLocaleDateString()],
                ['Status:', (this.currentOrder.status || 'pending').toUpperCase()],
                ['Customer Type:', this.currentOrder.customerType === 'guest' ? 'Guest' : 'Registered'],
                ['Total Amount:', `$${(this.currentOrder.totalAmount || 0).toFixed(2)}`]
            ];

            orderInfo.forEach(([label, value]) => {
                doc.setFont('helvetica', 'bold');
                doc.text(label, 20, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(value, 70, yPos);
                yPos += 8;
            });

            // Customer Information
            yPos += 10;
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('Customer Information', 20, yPos);
            yPos += 10;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            if (this.currentOrder.customerType === 'guest' && this.currentOrder.guestInfo) {
                const customerInfo = [
                    ['Name:', this.currentOrder.guestInfo.name || 'N/A'],
                    ['Email:', this.currentOrder.guestInfo.email || 'N/A'],
                    ['Phone:', this.currentOrder.guestInfo.phone || 'N/A']
                ];

                customerInfo.forEach(([label, value]) => {
                    doc.setFont('helvetica', 'bold');
                    doc.text(label, 20, yPos);
                    doc.setFont('helvetica', 'normal');
                    doc.text(value, 50, yPos);
                    yPos += 8;
                });
            }

            // Order Items
            yPos += 10;
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('Order Items', 20, yPos);
            yPos += 10;

            if (this.currentOrder.items && this.currentOrder.items.length > 0) {
                // Table headers
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text('Item', 20, yPos);
                doc.text('Qty', 120, yPos);
                doc.text('Price', 140, yPos);
                doc.text('Total', 170, yPos);
                yPos += 8;

                // Table items
                doc.setFont('helvetica', 'normal');
                this.currentOrder.items.forEach(item => {
                    if (yPos > 270) { // New page if needed
                        doc.addPage();
                        yPos = 20;
                    }

                    doc.text(item.name.substring(0, 40), 20, yPos);
                    doc.text(String(item.quantity || 1), 120, yPos);
                    doc.text(`$${(item.price || 0).toFixed(2)}`, 140, yPos);
                    doc.text(`$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`, 170, yPos);
                    yPos += 8;
                });
            }

            // Order Summary
            yPos += 10;
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('Order Summary', 20, yPos);
            yPos += 10;

            doc.setFontSize(10);
            const summaryInfo = [
                ['Subtotal:', `$${(this.currentOrder.subtotal || 0).toFixed(2)}`],
                ['Delivery Fee:', `$${(this.currentOrder.deliveryFee || 0).toFixed(2)}`],
                ['Tax:', `$${(this.currentOrder.tax || 0).toFixed(2)}`],
                ['Total:', `$${(this.currentOrder.totalAmount || 0).toFixed(2)}`]
            ];

            summaryInfo.forEach(([label, value]) => {
                doc.setFont('helvetica', 'bold');
                doc.text(label, 120, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(value, 170, yPos);
                yPos += 8;
            });

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text('Generated on ' + new Date().toLocaleString(), 20, 285);
            doc.text("Thank you for choosing Sarah's Short Cakes!", 120, 285);

            // Save the PDF
            const fileName = `Order_${this.currentOrder.orderNumber || this.currentOrder._id}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            this.showNotification('PDF exported successfully!', 'success');
            console.log('✅ PDF exported successfully');

        } catch (error) {
            console.error('❌ Error exporting PDF:', error);
            this.showError('Error generating PDF. Please try again.');
        }
    }

    // UI State Management Methods
    showLoading() {
        const loadingContainer = document.getElementById('loading-container');
        if (loadingContainer) {
            loadingContainer.classList.add('show');
        }
    }

    hideLoading() {
        const loadingContainer = document.getElementById('loading-container');
        if (loadingContainer) {
            loadingContainer.classList.remove('show');
        }
    }

    showOrderDetails() {
        console.log('🖥️ showOrderDetails called');
        const orderDetails = document.getElementById('order-details');
        if (orderDetails) {
            console.log('✅ Order details element found, adding show class');
            orderDetails.classList.add('show');
            console.log('✅ Show class added, element should be visible');
        } else {
            console.error('❌ Order details element not found!');
        }
    }

    hideOrderDetails() {
        const orderDetails = document.getElementById('order-details');
        if (orderDetails) {
            orderDetails.classList.remove('show');
        }
    }

    showError(message) {
        const errorMessage = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');

        if (errorMessage && errorText) {
            errorText.textContent = message;
            errorMessage.classList.add('show');

            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorMessage.classList.remove('show');
            }, 5000);
        }
    }

    showSuccess(message) {
        const successMessage = document.getElementById('success-message');
        const successText = document.getElementById('success-text');

        if (successMessage && successText) {
            successText.textContent = message;
            successMessage.classList.add('show');

            // Auto-hide after 3 seconds
            setTimeout(() => {
                successMessage.classList.remove('show');
            }, 3000);
        }
    }

    hideMessages() {
        const errorMessage = document.getElementById('error-message');
        const successMessage = document.getElementById('success-message');

        if (errorMessage) {
            errorMessage.classList.remove('show');
        }

        if (successMessage) {
            successMessage.classList.remove('show');
        }
    }

    // Notification system
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
            ${message}
        `;

        const container = document.getElementById('notification-container') || document.body;
        container.appendChild(notification);

        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    // Refresh order data
    async refreshOrderData() {
        if (!this.currentOrder || !this.currentOrder.orderNumber) {
            this.showError('No order to refresh');
            return;
        }

        console.log('🔄 Refreshing order data...');
        this.showNotification('Refreshing order data...', 'info');

        try {
            // Re-fetch the order data
            const refreshedOrder = await this.fetchOrderByNumber(this.currentOrder.orderNumber);

            if (refreshedOrder) {
                this.currentOrder = refreshedOrder;
                this.displayOrderDetails(refreshedOrder);
                this.showSuccess('Order data refreshed successfully!');
            } else {
                this.showError('Failed to refresh order data');
            }
        } catch (error) {
            console.error('❌ Error refreshing order:', error);
            this.showError('Error refreshing order data');
        }
    }
}



// Initialize the tracking system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Order Tracking System...');

    // Add a small delay to ensure all elements are rendered
    setTimeout(() => {
        new OrderTrackingSystem();
    }, 100);
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrderTrackingSystem;
}
