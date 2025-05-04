document.addEventListener('DOMContentLoaded', () => {
    console.log('Customer order confirmation page loaded');
    loadOrderDetails();
});

async function loadOrderDetails() {
    try {
        // Debug log sessionStorage contents
        console.log('SessionStorage contents:', {
            latestOrder: sessionStorage.getItem('latestOrder'),
            latestOrderId: sessionStorage.getItem('latestOrderId')
        });

        // Get orderId from URL query parameter
        let orderId = getQueryParam('orderId');
        console.log('Order ID from URL:', orderId);

        let order = null;

        if (!orderId) {
            // If no orderId param, check sessionStorage for latest order
            orderId = sessionStorage.getItem('latestOrderId');
            console.log('Order ID from sessionStorage:', orderId);
        }

        if (orderId) {
            // Try to get order details from sessionStorage first
            const orderData = sessionStorage.getItem('latestOrder');
        if (orderData) {
            order = JSON.parse(orderData);
            // Data structure validation and normalization
            order = {
                _id: order._id || order.id || orderId,
                date: order.date || new Date().toISOString(),
                status: order.status || 'Processing',
                items: Array.isArray(order.items) ? order.items : [],
                subtotal: order.subtotal || 0,
                tax: order.tax || 0,
                deliveryFee: order.deliveryFee || 0,
                total: order.total || 0,
                delivery: order.delivery || { method: 'Standard' },
                ...order // Keep any additional fields
            };
            console.log('Processed order data:', order);
        } else {
            // If not in sessionStorage, try to fetch from API
            console.log('Fetching order data from API for orderId:', orderId);
                const response = await fetch(`/api/orders/public/${orderId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                        order = data.data;
                        console.log('Order data fetched from API:', order);
                    } else {
                        console.warn('API response did not contain order data');
                    }
                } else {
                    console.error('Failed to fetch order data from API');
                }
        }
        }

        if (!order) {
            // If still no order, create a minimal order object with generated orderId and current date
            order = {
                _id: orderId || generateOrderId(),
                date: new Date().toISOString(),
                status: 'Processing',
                total: 0,
                subtotal: 0,
                tax: 0,
                deliveryFee: 0,
                delivery: { 
                    method: 'Standard',
                    estimatedDelivery: getEstimatedDeliveryDate(2) // 2 business days from now
                },
                payment: { method: 'Credit Card' },
                user: {},
                items: []
            };
            console.log('Using fallback minimal order data:', order);
        }

        displayOrderDetails(order);

        // Clear sessionStorage after use
        sessionStorage.removeItem('latestOrder');
        sessionStorage.removeItem('latestOrderId');

        // Send order details to backend to store in DB if not already stored
        if (order && !order._id) {
            try {
                const response = await fetch('/api/customers/me/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(order)
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        console.log('Order saved to database:', data.data);
                        // Update sessionStorage with saved order including _id
                        sessionStorage.setItem('latestOrder', JSON.stringify(data.data));
                        sessionStorage.setItem('latestOrderId', data.data._id);
                    }
                } else {
                    console.error('Failed to save order to database');
                }
            } catch (err) {
                console.error('Error saving order to database:', err);
            }
        }

    } catch (error) {
        console.error('Error loading order details:', error);
        showNotification('Failed to load order details', 'error');
    }
}

function displayOrderDetails(order) {
    if (!order) {
        console.error('No order data provided');
        showNotification('Order data not found', 'error');
        return;
    }

    if (!order.items || !Array.isArray(order.items)) {
        console.warn('No items array in order, creating empty array');
        order.items = [];
    }

    order.subtotal = order.subtotal || 0;
    order.tax = order.tax || 0;
    order.deliveryFee = order.deliveryFee || 0;
    order.total = order.total || 0;

    // Format date
    const orderDate = order.date ? new Date(order.date) : new Date();
    const formattedDate = orderDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Populate order confirmation page elements with order data
    const orderIdElem = document.getElementById('order-id');
    if (orderIdElem) {
        orderIdElem.textContent = order.id || order._id || 'ORD-UNKNOWN';
    } else {
        console.warn('Element with ID "order-id" not found');
    }

    const orderDateElem = document.getElementById('order-date');
    if (orderDateElem) {
        orderDateElem.textContent = formattedDate;
    } else {
        console.warn('Element with ID "order-date" not found');
    }

    const subtotalElem = document.getElementById('subtotal');
    if (subtotalElem) {
        subtotalElem.textContent = `$${(order.subtotal || 0).toFixed(2)}`;
    } else {
        console.warn('Element with ID "subtotal" not found');
    }

    const taxElem = document.getElementById('tax');
    if (taxElem) {
        taxElem.textContent = `$${(order.tax || 0).toFixed(2)}`;
    } else {
        console.warn('Element with ID "tax" not found');
    }

    const deliveryFeeElem = document.getElementById('delivery-fee');
    if (deliveryFeeElem) {
        deliveryFeeElem.textContent = `$${(order.deliveryFee || 0).toFixed(2)}`;
    } else {
        console.warn('Element with ID "delivery-fee" not found');
    }

    const totalElem = document.getElementById('total');
    if (totalElem) {
        totalElem.textContent = `$${(order.total || 0).toFixed(2)}`;
    } else {
        console.warn('Element with ID "total" not found');
    }

    const orderStatusElem = document.getElementById('order-status');
    if (orderStatusElem) {
        orderStatusElem.textContent = order.status || 'Processing';
    } else {
        console.warn('Element with ID "order-status" not found');
    }
    
    // Calculate estimated delivery date (2 business days from order date)
    const estimatedDeliveryDate = order.delivery?.estimatedDelivery || 
                               getEstimatedDeliveryDate(2, orderDate);
    const estimatedDeliveryElem = document.getElementById('estimated-delivery');
    if (estimatedDeliveryElem) {
        estimatedDeliveryElem.textContent = estimatedDeliveryDate;
    } else {
        console.warn('Element with ID "estimated-delivery" not found');
    }

    // Items
    const itemsContainer = document.getElementById('orderItems');
    if (!itemsContainer) {
        console.warn('Element with ID "orderItems" not found');
        return;
    }
    itemsContainer.innerHTML = '';
    
    if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
            const tr = document.createElement('tr');
            
            // Create item details cell
            const itemDetailsCell = document.createElement('td');
            const itemDetailsDiv = document.createElement('div');
            itemDetailsDiv.className = 'item-details';
            
            // Add item image if available
            if (item.image) {
                const img = document.createElement('img');
                img.src = item.image;
                img.alt = item.name;
                img.className = 'item-image';
                itemDetailsDiv.appendChild(img);
            }
            
            // Add item name and options
            const itemTextDiv = document.createElement('div');
            const nameP = document.createElement('p');
            nameP.className = 'item-name';
            nameP.textContent = item.name;
            itemTextDiv.appendChild(nameP);
            
            if (item.options) {
                const optionsP = document.createElement('p');
                optionsP.className = 'item-options';
                optionsP.textContent = item.options;
                itemTextDiv.appendChild(optionsP);
            }
            
            itemDetailsDiv.appendChild(itemTextDiv);
            itemDetailsCell.appendChild(itemDetailsDiv);
            
            // Add quantity, price, and total cells
            const quantityCell = document.createElement('td');
            quantityCell.textContent = item.quantity || 1;
            
            const priceCell = document.createElement('td');
            priceCell.textContent = `$${(item.price || 0).toFixed(2)}`;
            
            const totalCell = document.createElement('td');
            const itemTotal = (item.price || 0) * (item.quantity || 1);
            totalCell.textContent = `$${itemTotal.toFixed(2)}`;
            
            // Append all cells to the row
            tr.appendChild(itemDetailsCell);
            tr.appendChild(quantityCell);
            tr.appendChild(priceCell);
            tr.appendChild(totalCell);
            
            // Add row to table
            itemsContainer.appendChild(tr);
        });
    } else {
        // If no items, show a message
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

function displayOrderDetails(order) {
    // Format date
    const orderDate = order.date ? new Date(order.date) : new Date();
    const formattedDate = orderDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Populate order confirmation page elements with order data
    const orderIdElem = document.getElementById('order-id');
    if (orderIdElem) {
        orderIdElem.textContent = order.id || order._id || 'ORD-UNKNOWN';
    } else {
        console.warn('Element with ID "order-id" not found');
    }

    const orderDateElem = document.getElementById('order-date');
    if (orderDateElem) {
        orderDateElem.textContent = formattedDate;
    } else {
        console.warn('Element with ID "order-date" not found');
    }

    const subtotalElem = document.getElementById('subtotal');
    if (subtotalElem) {
        subtotalElem.textContent = `$${(order.subtotal || 0).toFixed(2)}`;
    } else {
        console.warn('Element with ID "subtotal" not found');
    }

    const taxElem = document.getElementById('tax');
    if (taxElem) {
        taxElem.textContent = `$${(order.tax || 0).toFixed(2)}`;
    } else {
        console.warn('Element with ID "tax" not found');
    }

    const deliveryFeeElem = document.getElementById('delivery-fee');
    if (deliveryFeeElem) {
        deliveryFeeElem.textContent = `$${(order.deliveryFee || 0).toFixed(2)}`;
    } else {
        console.warn('Element with ID "delivery-fee" not found');
    }

    const totalElem = document.getElementById('total');
    if (totalElem) {
        totalElem.textContent = `$${(order.total || 0).toFixed(2)}`;
    } else {
        console.warn('Element with ID "total" not found');
    }

    const orderStatusElem = document.getElementById('order-status');
    if (orderStatusElem) {
        orderStatusElem.textContent = order.status || 'Processing';
    } else {
        console.warn('Element with ID "order-status" not found');
    }
    
    // Calculate estimated delivery date (2 business days from order date)
    const estimatedDeliveryDate = order.delivery?.estimatedDelivery || 
                               getEstimatedDeliveryDate(2, orderDate);
    const estimatedDeliveryElem = document.getElementById('estimated-delivery');
    if (estimatedDeliveryElem) {
        estimatedDeliveryElem.textContent = estimatedDeliveryDate;
    } else {
        console.warn('Element with ID "estimated-delivery" not found');
    }

    // Items
    const itemsContainer = document.getElementById('orderItems');
    if (!itemsContainer) {
        console.warn('Element with ID "orderItems" not found');
        return;
    }
    itemsContainer.innerHTML = '';
    
    if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
            const tr = document.createElement('tr');
            
            // Create item details cell
            const itemDetailsCell = document.createElement('td');
            const itemDetailsDiv = document.createElement('div');
            itemDetailsDiv.className = 'item-details';
            
            // Add item image if available
            if (item.image) {
                const img = document.createElement('img');
                img.src = item.image;
                img.alt = item.name;
                img.className = 'item-image';
                itemDetailsDiv.appendChild(img);
            }
            
            // Add item name and options
            const itemTextDiv = document.createElement('div');
            const nameP = document.createElement('p');
            nameP.className = 'item-name';
            nameP.textContent = item.name;
            itemTextDiv.appendChild(nameP);
            
            if (item.options) {
                const optionsP = document.createElement('p');
                optionsP.className = 'item-options';
                optionsP.textContent = item.options;
                itemTextDiv.appendChild(optionsP);
            }
            
            itemDetailsDiv.appendChild(itemTextDiv);
            itemDetailsCell.appendChild(itemDetailsDiv);
            
            // Add quantity, price, and total cells
            const quantityCell = document.createElement('td');
            quantityCell.textContent = item.quantity || 1;
            
            const priceCell = document.createElement('td');
            priceCell.textContent = `$${(item.price || 0).toFixed(2)}`;
            
            const totalCell = document.createElement('td');
            const itemTotal = (item.price || 0) * (item.quantity || 1);
            totalCell.textContent = `$${itemTotal.toFixed(2)}`;
            
            // Append all cells to the row
            tr.appendChild(itemDetailsCell);
            tr.appendChild(quantityCell);
            tr.appendChild(priceCell);
            tr.appendChild(totalCell);
            
            // Add row to table
            itemsContainer.appendChild(tr);
        });
    } else {
        // If no items, show a message
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

// Utility to get query param by name
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Generate a random order ID
function generateOrderId() {
    const prefix = 'ORD-';
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return prefix + randomNum;
}

// Calculate estimated delivery date (business days)
function getEstimatedDeliveryDate(daysToAdd, startDate = new Date()) {
    const date = new Date(startDate);
    let daysAdded = 0;
    
    while (daysAdded < daysToAdd) {
        date.setDate(date.getDate() + 1);
        // Skip weekends (Saturday=6, Sunday=0)
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

// Show notification function
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
