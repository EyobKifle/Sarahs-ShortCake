document.addEventListener('DOMContentLoaded', () => {
    console.log('Order confirmation page loaded');
    loadOrderDetails();
});

async function loadOrderDetails() {
    try {
        const orderId = getOrderId();
        console.log('Loading order details for orderId:', orderId);
        const order = await fetchOrderData(orderId);
        console.log('Fetched order data:', order);
        displayOrderDetails(order);
        updateTrackOrderButton(orderId);
        clearTemporaryOrderData();
    } catch (error) {
        console.error('Error loading order details:', error);
        showNotification('Failed to load order details. Please contact support if the problem persists.', 'error');
    }
}

function getOrderId() {
    const urlParams = new URLSearchParams(window.location.search);
    let orderId = urlParams.get('orderId');

    if (!orderId) {
        orderId = sessionStorage.getItem('latestOrderId');
    }

    if (!orderId) {
        orderId = generateOrderId();
        sessionStorage.setItem('latestOrderId', orderId);
    }

    return orderId;
}


async function fetchOrderData(orderId) {
    // Always fetch fresh data from backend instead of sessionStorage
    // Remove sessionStorage usage to avoid stale data issues

    // Check if orderId is a valid MongoDB ObjectId (24 hex chars)
    const objectIdRegex = /^[a-f\d]{24}$/i;
    let fetchUrl;
    if (objectIdRegex.test(orderId)) {
        fetchUrl = `/api/orders/public/${orderId}`;
    } else {
        fetchUrl = `/api/orders/public/orderNumber/${encodeURIComponent(orderId)}`;
    }

    try {
        const response = await fetch(fetchUrl);
        if (response.ok) {
            const data = await response.json();
            // Support both data.data and data.order keys
            const orderData = data.data || data.order;
            if (data.success && orderData) {
                // Update sessionStorage with fresh data
                sessionStorage.setItem('latestOrder', JSON.stringify(orderData));
                sessionStorage.setItem('latestOrderId', orderId);
                return normalizeOrderData(orderData);
            }
        }
    } catch (error) {
        console.error('Error fetching order:', error);
    }

    return createMinimalOrder(orderId);
}

function normalizeOrderData(order) {
    return {
        _id: order._id || order.id || generateOrderId(),
        orderNumber: order.orderNumber || order._id || order.id || generateOrderId(),
        date: order.date || new Date().toISOString(),
        status: order.status || 'Processing',
        items: Array.isArray(order.items) ? order.items : [],
        subtotal: order.subtotal || 0,
        tax: order.tax || 0,
        deliveryFee: order.deliveryFee || order.deliveryFee || 0,
        total: order.total || 0,
        delivery: order.delivery || {
            method: 'Standard',
            estimatedDelivery: getEstimatedDeliveryDate(2)
        },
        payment: order.payment || { method: 'Credit Card' },
        user: order.user || order.guestInfo || {},
        ...order
    };
}

function createMinimalOrder(orderId) {
    const now = new Date();
    const deliveryDate = getEstimatedDeliveryDate(2, now);
    return {
        _id: orderId,
        orderNumber: orderId,
        date: now.toISOString(),
        status: 'Processing',
        subtotal: 0,
        tax: 0,
        deliveryFee: 0,
        total: 0,
        delivery: {
            method: 'Standard Delivery',
            estimatedDelivery: deliveryDate
        },
        payment: {
            method: 'Credit Card'
        },
        user: {},
        items: []
    };
}

function displayOrderDetails(order) {
    // Format date
    const orderDate = order.date ? new Date(order.date) : new Date();
    const formattedDate = orderDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Update order info elements (IDs matching HTML)
    setTextContentById('order-id', order.orderNumber || order._id || 'ORD-UNKNOWN');
    setTextContentById('order-date', formattedDate);
    setTextContentById('order-status', order.status || 'Processing');
    setTextContentById('estimated-delivery', order.delivery?.estimatedDelivery || getEstimatedDeliveryDate(2, orderDate));
    setTextContentById('subtotal', `$${(order.subtotal || 0).toFixed(2)}`);
    setTextContentById('delivery-fee', `$${(order.deliveryFee || 0).toFixed(2)}`);
    setTextContentById('tax', `$${(order.tax || 0).toFixed(2)}`);
    setTextContentById('total', `$${(order.total || 0).toFixed(2)}`);

    // Update order ID data attribute for tracking or other uses
    const orderIdElem = document.getElementById('order-id');
    if (orderIdElem) {
        orderIdElem.dataset.orderId = order._id || order.orderNumber || 'ORD-UNKNOWN';
    }

    // Update next steps info if available
    if (order.user?.email || order.guestInfo?.email) {
        const email = order.user?.email || order.guestInfo?.email;
        setTextContentById('confirmation-email-text', `We've sent a confirmation email to ${email}`);
    }
    if (order.delivery?.method && (order.user?.address || order.delivery?.address)) {
        const address = order.user?.address || order.delivery?.address;
        const addressStr = `${address.street || ''} ${address.city || ''} ${address.state || ''} ${address.zip || ''}`.trim();
        setTextContentById('delivery-details', `Your order will be delivered via ${order.delivery.method} to ${addressStr}`);
    }

    // Populate order items table
    const itemsContainer = document.getElementById('order-items');
    if (!itemsContainer) {
        console.warn('Element with ID "order-items" not found');
        return;
    }
    itemsContainer.innerHTML = '';

    if (order.items && order.items.length > 0) {
        // Display items in original order (not reversed)
        order.items.forEach(item => {
            const tr = document.createElement('tr');

            const itemDetailsCell = document.createElement('td');
            const itemDetailsDiv = document.createElement('div');
            itemDetailsDiv.className = 'item-details';

            // Ensure image URL is correctly referenced to the proper image file path
            let imageUrl = item.image || '';
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                // Assuming images are stored under 'images/' directory in Public folder
                imageUrl = '/images/' + imageUrl;
            }

            if (imageUrl) {
                const img = document.createElement('img');
                img.src = imageUrl;
                img.alt = item.name || 'Product Image';
                img.className = 'item-image';
                img.onerror = () => {
                    img.src = 'images/default-preview.jpg'; // fallback image if loading fails
                    img.alt = 'Image not available';
                };
                itemDetailsDiv.appendChild(img);
            } else {
                const placeholder = document.createElement('div');
                placeholder.className = 'item-image error';
                placeholder.textContent = 'No Image';
                itemDetailsDiv.appendChild(placeholder);
            }

            const itemTextDiv = document.createElement('div');
            const nameP = document.createElement('p');
            nameP.className = 'item-name';
            nameP.textContent = item.name || 'Unnamed Item';
            itemTextDiv.appendChild(nameP);

            if (item.options) {
                const optionsP = document.createElement('p');
                optionsP.className = 'item-options';
                optionsP.textContent = item.options;
                itemTextDiv.appendChild(optionsP);
            } else if (item.customization) {
                const customizationP = document.createElement('p');
                customizationP.className = 'item-options';
                customizationP.textContent = Object.entries(item.customization).map(([key, value]) => `${key}: ${value}`).join(', ');
                itemTextDiv.appendChild(customizationP);
            }

            itemDetailsDiv.appendChild(itemTextDiv);
            itemDetailsCell.appendChild(itemDetailsDiv);

            const quantityCell = document.createElement('td');
            quantityCell.textContent = item.quantity || 1;

            const priceCell = document.createElement('td');
            priceCell.textContent = `$${(item.price || 0).toFixed(2)}`;

            const totalCell = document.createElement('td');
            const itemTotal = (item.price || 0) * (item.quantity || 1);
            totalCell.textContent = `$${itemTotal.toFixed(2)}`;

            tr.appendChild(itemDetailsCell);
            tr.appendChild(quantityCell);
            tr.appendChild(priceCell);
            tr.appendChild(totalCell);

            itemsContainer.appendChild(tr);
        });
    } else {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 4;
        td.textContent = 'No items in this order';
        td.style.textAlign = 'center';
        td.style.padding = '2rem';
        tr.appendChild(td);
        itemsContainer.appendChild(tr);
    }
}

function setTextContentById(id, text) {
    const elem = document.getElementById(id);
    if (elem) {
        elem.textContent = text;
    } else {
        console.warn(`Element with ID "${id}" not found`);
    }
}

function updateTrackOrderButton(orderId) {
    const trackBtn = document.getElementById('track-order-btn');
    if (trackBtn && orderId) {
        trackBtn.href = `track.html?orderId=${encodeURIComponent(orderId)}`;
    }
}

function clearTemporaryOrderData() {
    sessionStorage.removeItem('latestOrder');
    sessionStorage.removeItem('latestOrderId');
}

function generateOrderId() {
    const prefix = 'ORD-';
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return prefix + randomNum;
}

function getEstimatedDeliveryDate(daysToAdd, startDate = new Date()) {
    const date = new Date(startDate);
    let daysAdded = 0;

    while (daysAdded < daysToAdd) {
        date.setDate(date.getDate() + 1);
        if (date.getDay() !== 0 && date.getDay() !== 6) {
            daysAdded++;
        }
    }

    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const icon = document.getElementById('notification-icon');
    const msg = document.getElementById('notification-message');

    if (!notification) return;

    notification.className = `notification ${type}`;
    msg.textContent = message;
    icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';

    notification.style.display = 'flex';
    setTimeout(() => notification.classList.add('show'), 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.style.display = 'none', 300);
    }, 3000);
}
