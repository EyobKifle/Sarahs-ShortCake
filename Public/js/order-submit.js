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
        console.log('Detected customerId:', customerId);

        const guestInfo = {
            name: (document.getElementById('guest-firstName')?.value.trim() || '') + ' ' + (document.getElementById('guest-lastName')?.value.trim() || ''),
            email: document.getElementById('guest-email')?.value.trim() || '',
            phone: document.getElementById('guest-phone')?.value.trim() || '',
            streetAddress: document.getElementById('guest-streetAddress')?.value.trim() || '',
            city: document.getElementById('guest-city')?.value.trim() || ''
        };

        // Delivery option, needed date/time, notes from form
        const deliveryMethod = document.querySelector('input[name="deliveryOption"]:checked')?.value;
        const neededDate = document.getElementById('neededDate')?.value;
        const neededTime = document.getElementById('neededTime')?.value;
        const notes = document.getElementById('orderNotes')?.value.trim() || '';

        if (!deliveryMethod || !neededDate || !neededTime) {
            alert('Please fill in all required delivery details.');
            return;
        }

        // Validate and prepare items array for backend with productId and customization object
        const items = cartItems.map(item => {
            // Ensure item has a valid id and is a valid ObjectId string (24 hex chars)
            let productId = item.id;
            const objectIdRegex = /^[a-f\d]{24}$/i;
            if (!productId || !objectIdRegex.test(productId)) {
                // If invalid or missing, remove productId to avoid backend validation error
                productId = undefined;
            }

            return {
                productId: productId,
                quantity: item.quantity,
                price: item.price,
                customization: {
                    flavor: item.customizations?.find(c => c.name === 'Flavor')?.value || 'Vanilla',
                    color: item.customizations?.find(c => c.name === 'Cake Color')?.value || 'N/A',
                    icing: item.customizations?.find(c => c.name === 'Icing Flavor')?.value || 'Vanilla',
                    icingColor: item.customizations?.find(c => c.name === 'Icing Color')?.value || 'N/A',
                    decorations: item.customizations?.find(c => c.name === 'Decoration')?.value || '',
                    specialInstructions: item.customizations?.find(c => c.name === 'Special Instructions')?.value || ''
                }
            };
        });

        // Generate orderNumber using global generateOrderId function
        const orderNumber = window.generateOrderId();

        // Construct order payload matching backend schema
        const orderPayload = {
            orderNumber, // include generated orderNumber
            items,
            deliveryInfo: {
                method: deliveryMethod ? deliveryMethod.toLowerCase() : undefined,
                address: {
                    street: guestInfo.streetAddress,
                    city: guestInfo.city
                },
                deliveryDate: neededDate,
                deliveryTime: neededTime
            },
            notes
        };

        if (customerId) {
            orderPayload.customerId = customerId;

            // Fetch user profile info to include in orderPayload
            try {
                const userResponse = await fetch('/api/customers/me', {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    if (userData.success && userData.user) {
                        const user = userData.user;
                        orderPayload.guestInfo = {
                            name: `${user.firstName} ${user.lastName}`,
                            email: user.email,
                            phone: user.phone || ''
                        };
                        if (user.addresses && user.addresses.length > 0) {
                            const primaryAddress = user.addresses[0];
                            orderPayload.deliveryInfo.address = {
                                street: primaryAddress.street || '',
                                city: primaryAddress.city || '',
                                state: primaryAddress.state || '',
                                zip: primaryAddress.zip || ''
                            };
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching user profile for order:', error);
            }

        } else {
            orderPayload.guestInfo = {
                name: guestInfo.name,
                email: guestInfo.email,
                phone: guestInfo.phone
            };
        }

        try {
            console.log('Order Payload:', orderPayload);
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

            alert('Order placed successfully! Your order ID is ' + orderNumber);

            // Save order data and ID to sessionStorage for confirmation page
            const structuredOrder = {
                id: orderNumber,
                _id: orderNumber,
                orderNumber: orderNumber,
                date: new Date().toISOString(),
                status: 'Processing',
                items: cartItems.map(item => {
                    // Fix image path to correctly reference the image file path
                    let imagePath = item.image || '';
                    if (imagePath && !imagePath.startsWith('http') && !imagePath.startsWith('/')) {
                        imagePath = '/images/' + imagePath;
                    }
                    return {
                        name: item.name || item.customizations?.find(c => c.name === 'Flavor')?.value || 'Unknown Product',
                        price: item.price,
                        quantity: item.quantity,
                        image: imagePath
                    };
                }),
                subtotal: data.data.subtotal || 0,
                tax: data.data.tax || 0,
                deliveryFee: data.data.deliveryFee || 0,
                total: data.data.total || 0,
                delivery: {
                    method: deliveryMethod,
                    estimatedDelivery: calculateEstimatedDeliveryDate()
                }
            };
            sessionStorage.setItem('latestOrder', JSON.stringify(structuredOrder));
            sessionStorage.setItem('latestOrderId', orderNumber);

            // Redirect to appropriate order confirmation page based on user type
            let redirectUrl;
            if (customerId && customerId !== 'null' && customerId !== '') {
                redirectUrl = `/customer-order-confirmation.html?orderId=${encodeURIComponent(orderNumber)}`;
            } else {
                redirectUrl = `/order-confirmation.html?orderId=${encodeURIComponent(orderNumber)}`;
            }
            console.log('Redirecting to:', redirectUrl);
            window.location.href = redirectUrl;

        } catch (error) {
            console.error('Error placing order:', error);
            alert('An error occurred while placing your order. Please try again.');
        }
    });
});
