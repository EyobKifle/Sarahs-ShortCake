document.addEventListener('DOMContentLoaded', function() {
    // Get order details from URL parameters or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId') || localStorage.getItem('lastOrderId');
    
    if (orderId) {
        // Fetch order details from localStorage
        const orderDetails = getOrderDetails(orderId);
        
        if (!orderDetails) {
            console.error('Order details not found for orderId:', orderId);
            return;
        }
        
        // Update order information
        document.getElementById('orderNumber').textContent = orderDetails.orderId || orderId;
        document.getElementById('orderDate').textContent = formatDate(orderDetails.orderDate);
        document.getElementById('orderStatus').textContent = orderDetails.status || 'Processing';
        document.getElementById('estimatedDelivery').textContent = formatDate(orderDetails.estimatedDelivery);
        
        // Update order items
        const orderItemsContainer = document.getElementById('orderItems');
        orderItemsContainer.innerHTML = '';
        
        orderDetails.items.forEach(item => {
            const row = document.createElement('tr');
            const imageHtml = `
                <img src="${item.image || 'images/default-preview.jpg'}" 
                     alt="${item.name}" 
                     class="item-image" 
                     onerror="this.onerror=null; this.src='images/default-preview.jpg'; this.classList.add('error');">
            `;
            row.innerHTML = `
                <td>
                    <div class="item-details">
                        ${imageHtml}
                        <div>
                            <div class="item-name">${item.name}</div>
                            <div class="item-options">${item.options || ''}</div>
                        </div>
                    </div>
                </td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${formatCurrency(item.price * item.quantity)}</td>
            `;
            orderItemsContainer.appendChild(row);
        });
        
        // Update order summary
        document.getElementById('subtotal').textContent = formatCurrency(orderDetails.subtotal);
        document.getElementById('deliveryFee').textContent = formatCurrency(orderDetails.deliveryFee);
        document.getElementById('tax').textContent = formatCurrency(orderDetails.tax);
        document.getElementById('total').textContent = formatCurrency(orderDetails.total);
    } else {
        console.error('No orderId found in URL or localStorage');
    }
});

// Fetch order details from localStorage by orderId
function getOrderDetails(orderId) {
    const orderData = localStorage.getItem(orderId);
    if (!orderData) return null;
    try {
        return JSON.parse(orderData);
    } catch (e) {
        console.error('Error parsing order data from localStorage', e);
        return null;
    }
}

// Format date
function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format currency
function formatCurrency(amount) {
    if (typeof amount !== 'number') amount = 0;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Auth modal functionality placeholder
function showAuthModal() {
    console.log('Show auth modal');
}
