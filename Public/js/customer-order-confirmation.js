document.addEventListener('DOMContentLoaded', () => {
    const orderNumberEl = document.getElementById('orderNumber');
    const orderDateEl = document.getElementById('orderDate');
    const orderStatusEl = document.getElementById('orderStatus');
    const estimatedDeliveryEl = document.getElementById('estimatedDelivery');
    const orderItemsEl = document.getElementById('orderItems');
    const subtotalEl = document.getElementById('subtotal');
    const deliveryFeeEl = document.getElementById('deliveryFee');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('total');

    // Retrieve last order from localStorage
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    if (orders.length === 0) {
        // No order found, redirect to cart
        window.location.href = 'customer-cart.html';
        return;
    }
    const lastOrder = orders[orders.length - 1];

    // Populate order details
    orderNumberEl.textContent = lastOrder.orderId;
    orderDateEl.textContent = new Date(lastOrder.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    orderStatusEl.textContent = lastOrder.status || 'Processing';
    estimatedDeliveryEl.textContent = lastOrder.estimatedDelivery || 'TBD';

    // Populate order items
    orderItemsEl.innerHTML = '';
    lastOrder.items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="item-details">
                    <img src="${item.image}" alt="${item.name}" class="item-image" onerror="this.src='images/default-preview.jpg'">
                    <div>
                        <div class="item-name">${item.name}</div>
                        ${item.customizations && item.customizations.length > 0 ? `<div class="item-options">${item.customizations.map(c => c.name + ': ' + c.value).join(', ')}</div>` : ''}
                    </div>
                </div>
            </td>
            <td>${item.quantity}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>$${(item.price * item.quantity).toFixed(2)}</td>
        `;
        orderItemsEl.appendChild(tr);
    });

    // Populate order summary
    subtotalEl.textContent = `$${lastOrder.subtotal.toFixed(2)}`;
    deliveryFeeEl.textContent = `$${(lastOrder.deliveryFee || 0).toFixed(2)}`;
    taxEl.textContent = `$${(lastOrder.tax || 0).toFixed(2)}`;
    totalEl.textContent = `$${lastOrder.total.toFixed(2)}`;
});
