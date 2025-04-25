// Frontend order submission script for Sarah's Short Cakes

document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('order-form');
    if (!orderForm) return;

    orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Gather cart data from localStorage
        const cartData = localStorage.getItem('cart');
        if (!cartData) {
            alert('Your cart is empty. Please add items before placing an order.');
            return;
        }
        const cartItems = JSON.parse(cartData);

        if (cartItems.length === 0) {
            alert('Your cart is empty. Please add items before placing an order.');
            return;
        }

        // Gather customer or guest info from form inputs
        const customerId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user'))._id : null;

        const guestInfo = {
            firstName: document.getElementById('guest-firstName')?.value.trim() || '',
            lastName: document.getElementById('guest-lastName')?.value.trim() || '',
            email: document.getElementById('guest-email')?.value.trim() || '',
            phone: document.getElementById('guest-phone')?.value.trim() || '',
            streetAddress: document.getElementById('guest-streetAddress')?.value.trim() || '',
            city: document.getElementById('guest-city')?.value.trim() || ''
        };

        // Delivery option, needed date/time, notes from form
        const deliveryOption = document.querySelector('input[name="deliveryOption"]:checked')?.value;
        const neededDate = document.getElementById('neededDate')?.value;
        const neededTime = document.getElementById('neededTime')?.value;
        const notes = document.getElementById('orderNotes')?.value.trim() || '';

        if (!deliveryOption || !neededDate || !neededTime) {
            alert('Please fill in all required delivery details.');
            return;
        }

        // Prepare items array for backend
        const items = cartItems.map(item => ({
            quantity: item.quantity,
            cakeFlavor: item.customizations?.find(c => c.name === 'Flavor')?.value || 'Vanilla',
            cakeColor: item.customizations?.find(c => c.name === 'Cake Color')?.value || 'N/A',
            icingFlavor: item.customizations?.find(c => c.name === 'Icing Flavor')?.value || 'Vanilla',
            icingColor: item.customizations?.find(c => c.name === 'Icing Color')?.value || 'N/A',
            decoration: item.customizations?.find(c => c.name === 'Decoration')?.value || ''
        }));

        // Construct order payload
        const orderPayload = {
            items,
            deliveryOption,
            neededDate,
            neededTime,
            notes
        };

        if (customerId) {
            orderPayload.customer = customerId;
        } else {
            orderPayload.guestInfo = guestInfo;
        }

        try {
            const token = localStorage.getItem('token');

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(orderPayload)
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || 'Failed to place order. Please try again.');
                return;
            }

            // Clear cart on successful order
            localStorage.removeItem('cart');

            alert('Order placed successfully! Your order ID is ' + data.data._id);

            // Redirect to order confirmation or profile page
            window.location.href = '/order-confirmation.html';

        } catch (error) {
            console.error('Error placing order:', error);
            alert('An error occurred while placing your order. Please try again.');
        }
    });
});
