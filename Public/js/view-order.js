document.addEventListener('DOMContentLoaded', () => {
  loadOrderDetails();
});

async function loadOrderDetails() {
  try {
    const orderId = getOrderIdFromUrl();
    if (!orderId) {
      showError('Order ID is missing.');
      return;
    }
    const order = await fetchOrderData(orderId);
    if (!order) {
      showError('Failed to load order data.');
      return;
    }
    displayOrderDetails(order);
  } catch (error) {
    console.error('Error loading order details:', error);
    showError('An error occurred while loading order details.');
  }
}

function getOrderIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('orderId');
}

async function fetchOrderData(orderId) {
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
      const orderData = data.data || data.order;
      if (data.success && orderData) {
        return normalizeOrderData(orderData);
      }
    }
  } catch (error) {
    console.error('Error fetching order:', error);
  }
  return null;
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
    deliveryFee: order.deliveryFee || 0,
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

function displayOrderDetails(order) {
  setTextContentById('order-number', order.orderNumber);
  setTextContentById('order-date', formatDate(order.date));
  setTextContentById('order-status', capitalizeFirstLetter(order.status));
  setTextContentById('estimated-delivery', order.delivery?.estimatedDelivery || getEstimatedDeliveryDate(2));

  setTextContentById('subtotal', `$${order.subtotal.toFixed(2)}`);
  setTextContentById('delivery-fee', `$${order.deliveryFee.toFixed(2)}`);
  setTextContentById('tax', `$${order.tax.toFixed(2)}`);
  setTextContentById('total', `$${order.total.toFixed(2)}`);

  const itemsContainer = document.getElementById('order-items');
  if (!itemsContainer) {
    console.warn('Order items container not found');
    return;
  }
  itemsContainer.innerHTML = '';

  if (order.items.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = 'No items in this order';
    td.style.textAlign = 'center';
    td.style.padding = '2rem';
    tr.appendChild(td);
    itemsContainer.appendChild(tr);
    return;
  }

  order.items.forEach(item => {
    const tr = document.createElement('tr');

    const itemCell = document.createElement('td');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-details';

    let imageUrl = item.image || '';
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
      imageUrl = '/images/' + imageUrl;
    }

    if (imageUrl) {
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = item.name || 'Product Image';
      img.className = 'item-image';
      img.onerror = () => {
        img.src = 'images/default-preview.jpg';
        img.alt = 'Image not available';
      };
      itemDiv.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'item-image error';
      placeholder.textContent = 'No Image';
      itemDiv.appendChild(placeholder);
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

    itemDiv.appendChild(itemTextDiv);
    itemCell.appendChild(itemDiv);

    const quantityCell = document.createElement('td');
    quantityCell.textContent = item.quantity || 1;

    const priceCell = document.createElement('td');
    priceCell.textContent = `$${(item.price || 0).toFixed(2)}`;

    const totalCell = document.createElement('td');
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    totalCell.textContent = `$${itemTotal.toFixed(2)}`;

    tr.appendChild(itemCell);
    tr.appendChild(quantityCell);
    tr.appendChild(priceCell);
    tr.appendChild(totalCell);

    itemsContainer.appendChild(tr);
  });
}

function setTextContentById(id, text) {
  const elem = document.getElementById(id);
  if (elem) {
    elem.textContent = text;
  } else {
    console.warn(`Element with ID "${id}" not found`);
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function capitalizeFirstLetter(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
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

function generateOrderId() {
  const prefix = 'ORD-';
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return prefix + randomNum;
}

function showError(message) {
  alert(message);
}
