// JavaScript to handle Proceed to Checkout button functionality

document.addEventListener('DOMContentLoaded', () => {
    const proceedBtn = document.getElementById('checkout-button');
    if (proceedBtn) {
        proceedBtn.addEventListener('click', (e) => {
            e.preventDefault();
            proceedToCheckout();
        });
    }
});

function proceedToCheckout() {
    // Validate cart items
    const cartItems = CartManager.getItems();
    if (!cartItems || cartItems.length === 0) {
        showNotification('Your cart is empty. Please add items before proceeding.', 'error');
        return;
    }

    // Validate user information fields
    const userName = document.getElementById('user-name') ? document.getElementById('user-name').value.trim() : '';
    const userEmail = document.getElementById('user-email') ? document.getElementById('user-email').value.trim() : '';
    const userPhone = document.getElementById('user-phone') ? document.getElementById('user-phone').value.trim() : '';
    const userAddress = document.getElementById('user-address') ? document.getElementById('user-address').value.trim() : '';

    if (!userName || !userEmail || !userPhone || !userAddress) {
        showNotification('Please fill in all your information before proceeding.', 'error');
        return;
    }

    // Additional validation can be added here (email format, phone format, etc.)

    // If all validations pass, redirect to order page or next step
    window.location.href = 'order.html';
}

// Show notification function (can be shared or imported from cart.js)
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
