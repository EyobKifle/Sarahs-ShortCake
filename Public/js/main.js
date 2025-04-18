document.addEventListener('DOMContentLoaded', function() {
    // Show/hide delivery address fields based on selection
    const deliveryOption = document.getElementById('deliveryOption');
    const deliveryAddressGroup = document.getElementById('deliveryAddressGroup');
    
    if (deliveryOption && deliveryAddressGroup) {
        deliveryOption.addEventListener('change', function() {
            if (this.value === 'delivery') {
                deliveryAddressGroup.classList.remove('hidden');
                // Make address fields required
                document.getElementById('streetAddress').required = true;
                document.getElementById('city').required = true;
            } else {
                deliveryAddressGroup.classList.add('hidden');
                // Remove required attribute
                document.getElementById('streetAddress').required = false;
                document.getElementById('city').required = false;
            }
        });
    }

    // Show/hide color options based on flavor selection
    function setupColorOptions(itemNumber) {
        const cakeFlavor = document.getElementById(`cakeFlavor${itemNumber}`);
        const cakeColorGroup = document.getElementById(`cakeColorGroup${itemNumber}`);
        const icingFlavor = document.getElementById(`icingFlavor${itemNumber}`);
        const icingColorGroup = document.getElementById(`icingColorGroup${itemNumber}`);

        if (cakeFlavor && cakeColorGroup) {
            cakeFlavor.addEventListener('change', function() {
                const showColors = ['Vanilla', 'White Chocolate', 'Champagne'].includes(this.value);
                cakeColorGroup.style.display = showColors ? 'block' : 'none';
            });
        }

        if (icingFlavor && icingColorGroup) {
            icingFlavor.addEventListener('change', function() {
                const showColors = ['Vanilla', 'Butter Cream', 'Cream Cheese', 'Champagne'].includes(this.value);
                icingColorGroup.style.display = showColors ? 'block' : 'none';
            });
        }
    }

    // Add new cupcake item to the order form
    const addCupcakeBtn = document.getElementById('addCupcakeBtn');
    const cupcakeItemsContainer = document.getElementById('cupcakeItemsContainer');
    
    if (addCupcakeBtn && cupcakeItemsContainer) {
        addCupcakeBtn.addEventListener('click', function() {
            const itemCount = cupcakeItemsContainer.children.length + 1;
            const newItem = document.createElement('div');
            newItem.className = 'cupcake-item';
            newItem.innerHTML = `
                <div class="form-group">
                    <label for="quantity${itemCount}">Quantity*</label>
                    <input type="number" id="quantity${itemCount}" name="items[${itemCount-1}][quantity]" min="1" value="1" required>
                </div>
                <div class="form-group">
                    <label for="cakeFlavor${itemCount}">Cupcake Flavor*</label>
                    <select id="cakeFlavor${itemCount}" name="items[${itemCount-1}][cakeFlavor]" required>
                        <option value="">Select flavor</option>
                        <option value="Vanilla">Vanilla</option>
                        <option value="French Vanilla">French Vanilla</option>
                        <option value="Chocolate">Chocolate</option>
                        <option value="White Chocolate">White Chocolate</option>
                        <option value="Double Chocolate">Double Chocolate</option>
                        <option value="S'mores">S'mores</option>
                        <option value="Strawberry">Strawberry</option>
                        <option value="Peanut Butter">Peanut Butter</option>
                        <option value="Pumpkin Spice">Pumpkin Spice</option>
                        <option value="Blueberry">Blueberry</option>
                        <option value="Apple Cinnamon">Apple Cinnamon</option>
                        <option value="Cookies and Cream">Cookies and Cream</option>
                        <option value="Champagne">Champagne</option>
                        <option value="Chocolate Chip Cheesecake">Chocolate Chip Cheesecake</option>
                        <option value="Mississippi Mud">Mississippi Mud</option>
                        <option value="Red Velvet">Red Velvet</option>
                        <option value="Coconut">Coconut</option>
                    </select>
                </div>
                <div class="form-group" id="cakeColorGroup${itemCount}">
                    <label for="cakeColor${itemCount}">Cupcake Color</label>
                    <select id="cakeColor${itemCount}" name="items[${itemCount-1}][cakeColor]">
                        <option value="N/A">N/A</option>
                        <option value="Blue">Blue</option>
                        <option value="Purple">Purple</option>
                        <option value="Green">Green</option>
                        <option value="Red">Red</option>
                        <option value="Orange">Orange</option>
                        <option value="Yellow">Yellow</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="icingFlavor${itemCount}">Icing Flavor*</label>
                    <select id="icingFlavor${itemCount}" name="items[${itemCount-1}][icingFlavor]" required>
                        <option value="">Select flavor</option>
                        <option value="Vanilla">Vanilla</option>
                        <option value="Butter Cream">Butter Cream</option>
                        <option value="Lemon">Lemon</option>
                        <option value="Cream Cheese">Cream Cheese</option>
                        <option value="Cookie Crumbs">Cookie Crumbs</option>
                        <option value="Strawberry">Strawberry</option>
                        <option value="Peanut Butter">Peanut Butter</option>
                        <option value="Oreo">Oreo</option>
                        <option value="Champagne">Champagne</option>
                        <option value="Mint Chocolate">Mint Chocolate</option>
                        <option value="German Chocolate">German Chocolate</option>
                        <option value="Espresso">Espresso</option>
                        <option value="Pink Lemonade">Pink Lemonade</option>
                        <option value="Maple Bacon">Maple Bacon</option>
                        <option value="Dark Chocolate">Dark Chocolate</option>
                        <option value="Milk Chocolate">Milk Chocolate</option>
                        <option value="Coconut Pecan">Coconut Pecan</option>
                    </select>
                </div>
                <div class="form-group" id="icingColorGroup${itemCount}">
                    <label for="icingColor${itemCount}">Icing Color</label>
                    <select id="icingColor${itemCount}" name="items[${itemCount-1}][icingColor]">
                        <option value="N/A">N/A</option>
                        <option value="Blue">Blue</option>
                        <option value="Purple">Purple</option>
                        <option value="Green">Green</option>
                        <option value="Red">Red</option>
                        <option value="Orange">Orange</option>
                        <option value="Yellow">Yellow</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="decoration${itemCount}">Special Decoration</label>
                    <input type="text" id="decoration${itemCount}" name="items[${itemCount-1}][decoration]" placeholder="e.g., princesses, horses">
                </div>
                <button type="button" class="remove-item-btn">Remove</button>
            `;
            cupcakeItemsContainer.appendChild(newItem);
            
            // Setup event listeners for the new item
            setupColorOptions(itemCount);
            
            // Add remove functionality
            const removeBtn = newItem.querySelector('.remove-item-btn');
            removeBtn.addEventListener('click', function() {
                cupcakeItemsContainer.removeChild(newItem);
                // Renumber remaining items if needed
            });
        });
    }

    // Initialize color options for the first item
    setupColorOptions(1);

    // Form submission handling
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Form validation
            if (!this.checkValidity()) {
                alert('Please fill out all required fields.');
                return;
            }
            
            // Collect form data
            const formData = new FormData(this);
            const data = {};
            formData.forEach((value, key) => {
                // Handle nested data for items
                if (key.includes('[')) {
                    const parts = key.split(/\[|\]\[|\]/).filter(part => part !== '');
                    let current = data;
                    for (let i = 0; i < parts.length - 1; i++) {
                        const part = parts[i];
                        if (!current[part]) {
                            current[part] = isNaN(parts[i+1]) ? {} : [];
                        }
                        current = current[part];
                    }
                    current[parts[parts.length - 1]] = value;
                } else {
                    data[key] = value;
                }
            });
            
            // Send data to server (to be implemented with backend)
            console.log('Submitting order:', data);
            
            // For now, show a success message
            alert('Thank you for your order! We will contact you to confirm the details.');
            this.reset();
        });
    }

    // Contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!this.checkValidity()) {
                alert('Please fill out all required fields.');
                return;
            }
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());
            
            console.log('Contact form submitted:', data);
            alert('Thank you for your message! We will get back to you soon.');
            this.reset();
        });
    }

    // Payment modal functionality
    const modal = document.getElementById('payment-modal');
    if (modal) {
        const closeBtn = modal.querySelector('.close-modal');
        const paymentMethods = modal.querySelectorAll('.payment-method');
        const paymentForm = modal.getElementById('payment-form');
        const paymentResult = modal.getElementById('payment-result');
        let currentOrderId = null;
        
        // Show payment modal when order is submitted
        function showPaymentModal(orderId) {
            currentOrderId = orderId;
            modal.classList.remove('hidden');
        }
        
        // Close modal
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        }
        
        // Payment method selection
        if (paymentMethods) {
            paymentMethods.forEach(method => {
                method.addEventListener('click', () => {
                    const methodName = method.getAttribute('data-method');
                    document.getElementById('payment-method-name').textContent = methodName;
                    
                    // Show appropriate form
                    document.getElementById('cbe-form').classList.add('hidden');
                    document.getElementById('telebirr-form').classList.add('hidden');
                    
                    if (methodName === 'CBE') {
                        document.getElementById('cbe-form').classList.remove('hidden');
                    } else {
                        document.getElementById('telebirr-form').classList.remove('hidden');
                    }
                    
                    if (paymentForm) {
                        paymentForm.classList.remove('hidden');
                    }
                });
            });
        }
        
        // Submit payment
        const submitPaymentBtn = document.getElementById('submit-payment');
        if (submitPaymentBtn) {
            submitPaymentBtn.addEventListener('click', async () => {
                const method = document.getElementById('payment-method-name').textContent;
                const paymentData = {
                    orderId: currentOrderId,
                    method: method
                };
                
                if (method === 'CBE') {
                    paymentData.accountNumber = document.getElementById('account-number').value;
                    paymentData.pin = document.getElementById('pin').value;
                } else {
                    paymentData.phoneNumber = document.getElementById('phone-number').value;
                }
                
                // Simulate payment processing
                try {
                    const response = await fetch('/api/orders/' + currentOrderId + '/pay', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(paymentData)
                    });
                    
                    const result = await response.json();
                    
                    // Show result
                    if (paymentForm) paymentForm.classList.add('hidden');
                    if (paymentResult) {
                        paymentResult.classList.remove('hidden');
                        
                        if (result.success) {
                            document.getElementById('result-message').textContent = 'Payment Successful!';
                            document.getElementById('result-message').style.color = 'green';
                            document.getElementById('transaction-details').textContent = 
                                `Transaction ID: ${result.transactionId}`;
                        } else {
                            document.getElementById('result-message').textContent = result.message;
                            document.getElementById('result-message').style.color = 'red';
                            document.getElementById('transaction-details').textContent = '';
                        }
                    }
                } catch (error) {
                    console.error('Payment error:', error);
                    if (paymentResult) {
                        paymentResult.classList.remove('hidden');
                        document.getElementById('result-message').textContent = 'Payment failed. Please try again.';
                        document.getElementById('result-message').style.color = 'red';
                    }
                }
            });
        }
    }

    // Bakery coordinates (Caldwell, TX)
    const BAKERY_LOCATION = {
        lat: 30.5329,
        lng: -96.6936,
        address: "123 Bakery Street, Caldwell, TX 77836"
    };

    // Initialize map when delivery option selected
    function initDeliveryMap() {
        const map = L.map('delivery-map').setView([BAKERY_LOCATION.lat, BAKERY_LOCATION.lng], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        // Add bakery marker
        L.marker([BAKERY_LOCATION.lat, BAKERY_LOCATION.lng])
            .addTo(map)
            .bindPopup(`<b>Sarah's Short Cakes</b><br>${BAKERY_LOCATION.address}`);
        
        return map;
    }

    // Load location.js after Leaflet is loaded
    function loadLocationJS() {
        const script = document.createElement('script');
        script.src = '/js/location.js';
        document.body.appendChild(script);
    }

    if (document.getElementById('delivery-map')) {
        const leafletScript = document.createElement('script');
        leafletScript.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
        leafletScript.onload = loadLocationJS;
        document.head.appendChild(leafletScript);
        
        const leafletCSS = document.createElement('link');
        leafletCSS.rel = 'stylesheet';
        leafletCSS.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
        document.head.appendChild(leafletCSS);
    }

    // Update Order model - add to models/Order.js:
    const orderSchema = new mongoose.Schema({
        // ... existing fields ...
        deliveryLocation: {
            type: {
                type: String,
                default: "Point"
            },
            coordinates: {
                type: [Number],  // [longitude, latitude]
                index: "2dsphere"
            },
            address: String
        },
        estimatedDistance: Number,
        estimatedTime: Number
    });

    // Done button
    const doneButton = document.getElementById('done-button');
    if (doneButton) {
        doneButton.addEventListener('click', () => {
            modal.classList.add('hidden');
            const resultMessage = document.getElementById('result-message');
            if (resultMessage && resultMessage.style.color === 'green') {
                window.location.href = '/order-confirmation.html?id=' + currentOrderId;
            }
        });
    }

    // Custom Cake Form Handling
    const customCakeForm = document.getElementById('customCakeForm');
    const previewImage = document.querySelector('.custom-cake-preview img');
    const previewOverlay = document.querySelector('.preview-overlay');
    
    if (customCakeForm) {
        // Initialize form with default values
        updatePreview();
        
        // Add event listeners to form fields
        const formFields = customCakeForm.querySelectorAll('select, textarea');
        formFields.forEach(field => {
            field.addEventListener('change', updatePreview);
        });
        
        // Handle form submission
        customCakeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(customCakeForm);
            const cakeData = {
                size: formData.get('size'),
                flavor: formData.get('flavor'),
                filling: formData.get('filling'),
                icing: formData.get('icing'),
                decoration: formData.get('decoration'),
                instructions: formData.get('instructions')
            };
            
            // Add to cart logic here
            addCustomCakeToCart(cakeData);
        });
    }
    
    function updatePreview() {
        const size = document.getElementById('size').value;
        const flavor = document.getElementById('flavor').value;
        const filling = document.getElementById('filling').value;
        const icing = document.getElementById('icing').value;
        const decoration = document.getElementById('decoration').value;
        
        // Update preview text
        const previewText = `Custom ${size} ${flavor} Cake\n`;
        const detailsText = `Filling: ${filling}\nIcing: ${icing}\nDecoration: ${decoration}`;
        
        previewOverlay.innerHTML = `
            <div>
                <p style="font-weight: bold; margin-bottom: 0.5rem;">${previewText}</p>
                <p style="font-size: 0.9rem;">${detailsText}</p>
            </div>
        `;
        
        // Here you would typically update the preview image based on selections
        // For now, we'll keep the default preview image
    }
    
    function addCustomCakeToCart(cakeData) {
        // Create cart item object
        const cartItem = {
            type: 'custom-cake',
            ...cakeData,
            price: calculateCustomCakePrice(cakeData),
            quantity: 1
        };
        
        // Add to cart (assuming you have a cart management system)
        if (typeof addToCart === 'function') {
            addToCart(cartItem);
            showNotification('Custom cake added to cart!', 'success');
        } else {
            console.error('Cart management system not found');
        }
    }
    
    function calculateCustomCakePrice(cakeData) {
        // Base prices for different sizes
        const basePrices = {
            '6-inch': 25,
            '8-inch': 35,
            '10-inch': 45,
            '12-inch': 55
        };
        
        // Additional costs for premium options
        const premiumAdditions = {
            'chocolate': 5,
            'red-velvet': 5,
            'caramel': 3,
            'ganache': 4,
            'fondant': 8,
            'custom-design': 15
        };
        
        let total = basePrices[cakeData.size] || basePrices['8-inch'];
        
        // Add costs for premium options
        if (premiumAdditions[cakeData.flavor]) total += premiumAdditions[cakeData.flavor];
        if (premiumAdditions[cakeData.filling]) total += premiumAdditions[cakeData.filling];
        if (premiumAdditions[cakeData.icing]) total += premiumAdditions[cakeData.icing];
        if (premiumAdditions[cakeData.decoration]) total += premiumAdditions[cakeData.decoration];
        
        return total;
    }
});