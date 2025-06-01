const fetch = require('node-fetch');

async function testInventorySystem() {
    try {
        console.log('🔍 Testing Complete Inventory System...\n');

        // Step 1: Login as admin
        console.log('🔐 Logging in as admin...');
        const adminLoginResponse = await fetch('http://localhost:3000/api/auth/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'password'
            })
        });

        const adminData = await adminLoginResponse.json();
        const adminToken = adminData.token;
        console.log('✅ Admin login successful');

        // Step 2: Check initial inventory
        console.log('\n📦 Checking initial inventory...');
        const inventoryResponse = await fetch('http://localhost:3000/api/inventory', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        const inventoryData = await inventoryResponse.json();
        const inventoryItems = inventoryData.data || inventoryData;
        console.log(`📊 Found ${inventoryItems.length} inventory items`);

        // Find some key ingredients and show their quantities
        const keyIngredients = ['All-purpose flour', 'Granulated sugar', 'Unsalted butter', 'Large eggs'];
        console.log('\n🔍 Key ingredient quantities before order:');

        const initialQuantities = {};
        for (const ingredientName of keyIngredients) {
            const ingredient = inventoryItems.find(item =>
                item.name.toLowerCase().includes(ingredientName.toLowerCase())
            );
            if (ingredient) {
                initialQuantities[ingredientName] = ingredient.quantity;
                console.log(`   ${ingredient.name}: ${ingredient.quantity} ${ingredient.unit}`);
            }
        }

        // Step 3: Get products to create an order
        console.log('\n🛒 Getting products for order...');
        const productsResponse = await fetch('http://localhost:3000/api/products');
        const productsData = await productsResponse.json();
        const products = productsData.data || productsData;

        console.log(`📦 Found ${products.length} products`);

        // Find a vanilla cupcake product
        const vanillaCupcake = products.find(p =>
            p.name.toLowerCase().includes('vanilla') && p.name.toLowerCase().includes('cupcake')
        );

        if (!vanillaCupcake) {
            throw new Error('No vanilla cupcake product found');
        }

        console.log(`✅ Found product: ${vanillaCupcake.name} (ID: ${vanillaCupcake._id})`);

        // Step 4: Create a test order
        console.log('\n📝 Creating test order...');
        const orderData = {
            items: [
                {
                    productId: vanillaCupcake._id,
                    product: vanillaCupcake._id,
                    name: vanillaCupcake.name,
                    quantity: 12, // Order 12 cupcakes
                    price: vanillaCupcake.price,
                    total: vanillaCupcake.price * 12
                }
            ],
            customerType: 'guest',
            guestInfo: {
                name: 'Test Customer',
                email: 'test@example.com',
                phone: '1234567890'
            },
            totalAmount: vanillaCupcake.price * 12,
            status: 'pending',
            deliveryInfo: {
                method: 'pickup',
                deliveryDate: new Date(),
                deliveryTime: '14:00'
            },
            payment: {
                method: 'proof_upload',
                status: 'pending'
            }
        };

        const orderResponse = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify(orderData)
        });

        const orderResult = await orderResponse.json();
        if (!orderResult.success) {
            throw new Error(`Failed to create order: ${orderResult.message}`);
        }

        const orderId = orderResult.data._id;
        console.log(`✅ Order created successfully (ID: ${orderId})`);
        console.log(`   Order contains: ${orderData.items[0].quantity} x ${orderData.items[0].name}`);

        // Step 5: Confirm the order (this should trigger inventory update)
        console.log('\n✅ Confirming order (this should update inventory)...');
        const confirmResponse = await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                status: 'confirmed'
            })
        });

        const confirmResult = await confirmResponse.json();
        if (!confirmResult.success) {
            throw new Error(`Failed to confirm order: ${confirmResult.message}`);
        }

        console.log('✅ Order confirmed successfully');
        console.log(`   Message: ${confirmResult.message}`);

        // Step 6: Check inventory after order confirmation
        console.log('\n📦 Checking inventory after order confirmation...');

        // Wait a moment for the inventory update to process
        await new Promise(resolve => setTimeout(resolve, 1000));

        const updatedInventoryResponse = await fetch('http://localhost:3000/api/inventory', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        const updatedInventoryData = await updatedInventoryResponse.json();
        const updatedInventoryItems = updatedInventoryData.data || updatedInventoryData;

        console.log('\n🔍 Key ingredient quantities after order:');
        let inventoryUpdated = false;

        for (const ingredientName of keyIngredients) {
            const ingredient = updatedInventoryItems.find(item =>
                item.name.toLowerCase().includes(ingredientName.toLowerCase())
            );
            if (ingredient) {
                const initialQty = initialQuantities[ingredientName];
                const currentQty = ingredient.quantity;
                const difference = initialQty - currentQty;

                console.log(`   ${ingredient.name}: ${currentQty} ${ingredient.unit} (was ${initialQty}, used: ${difference})`);

                if (difference > 0) {
                    inventoryUpdated = true;
                }
            }
        }

        // Step 7: Results
        console.log('\n🎯 Test Results:');
        if (inventoryUpdated) {
            console.log('🎉 SUCCESS: Inventory was properly updated when order was confirmed!');
            console.log('✅ The inventory system is working correctly');
        } else {
            console.log('❌ PROBLEM: Inventory was not updated after order confirmation');
            console.log('⚠️  The inventory system needs investigation');
        }

        // Step 8: Show order details
        console.log('\n📋 Order Summary:');
        console.log(`   Order ID: ${orderId}`);
        console.log(`   Product: ${orderData.items[0].name}`);
        console.log(`   Quantity: ${orderData.items[0].quantity}`);
        console.log(`   Status: confirmed`);
        console.log(`   Total: $${orderData.totalAmount}`);

    } catch (error) {
        console.error('❌ Error testing inventory system:', error.message);
    }
}

testInventorySystem();
