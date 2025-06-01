// Backend Connection Test Script
class BackendTest {
    constructor() {
        this.baseURL = '/api';
        this.results = [];
    }

    async runTests() {
        console.log('🧪 Starting Backend Connection Tests...');
        
        const tests = [
            { name: 'Health Check', test: () => this.testHealthCheck() },
            { name: 'Admin Login', test: () => this.testAdminLogin() },
            { name: 'Dashboard Stats', test: () => this.testDashboardStats() },
            { name: 'Orders Endpoint', test: () => this.testOrdersEndpoint() },
            { name: 'Customers Endpoint', test: () => this.testCustomersEndpoint() },
            { name: 'Inventory Endpoint', test: () => this.testInventoryEndpoint() }
        ];

        for (const test of tests) {
            try {
                console.log(`\n🔍 Testing: ${test.name}`);
                const result = await test.test();
                this.results.push({ name: test.name, status: 'PASS', result });
                console.log(`✅ ${test.name}: PASSED`);
            } catch (error) {
                this.results.push({ name: test.name, status: 'FAIL', error: error.message });
                console.log(`❌ ${test.name}: FAILED - ${error.message}`);
            }
        }

        this.displayResults();
    }

    async testHealthCheck() {
        const response = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include'
        });
        
        // We expect this to fail with 401 if not authenticated, which is correct
        if (response.status === 401) {
            return 'Server is responding (401 as expected)';
        }
        
        return `Server responded with status: ${response.status}`;
    }

    async testAdminLogin() {
        // Test with dummy credentials (should fail but endpoint should respond)
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                email: 'test@test.com',
                password: 'testpassword'
            })
        });

        if (response.status === 400) {
            return 'Login endpoint is working (400 for invalid credentials)';
        }

        const data = await response.json();
        return `Login endpoint responded: ${response.status} - ${data.message || 'No message'}`;
    }

    async testDashboardStats() {
        // This should fail without authentication
        const response = await fetch('/api/admin/dashboard-stats', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.status === 401) {
            return 'Dashboard stats endpoint is protected (401 as expected)';
        }

        return `Dashboard stats responded: ${response.status}`;
    }

    async testOrdersEndpoint() {
        const response = await fetch('/api/orders', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.status === 401) {
            return 'Orders endpoint is protected (401 as expected)';
        }

        return `Orders endpoint responded: ${response.status}`;
    }

    async testCustomersEndpoint() {
        const response = await fetch('/api/customers', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.status === 401) {
            return 'Customers endpoint is protected (401 as expected)';
        }

        return `Customers endpoint responded: ${response.status}`;
    }

    async testInventoryEndpoint() {
        const response = await fetch('/api/inventory', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.status === 401) {
            return 'Inventory endpoint is protected (401 as expected)';
        }

        return `Inventory endpoint responded: ${response.status}`;
    }

    displayResults() {
        console.log('\n📊 Test Results Summary:');
        console.log('========================');
        
        let passed = 0;
        let failed = 0;

        this.results.forEach(result => {
            if (result.status === 'PASS') {
                console.log(`✅ ${result.name}: ${result.result}`);
                passed++;
            } else {
                console.log(`❌ ${result.name}: ${result.error}`);
                failed++;
            }
        });

        console.log(`\n📈 Summary: ${passed} passed, ${failed} failed`);

        // Display in UI if possible
        this.displayResultsInUI();
    }

    displayResultsInUI() {
        // Create a results modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
        `;

        let html = `
            <h3 style="margin-top: 0; color: #333;">🧪 Backend Connection Test Results</h3>
            <div style="margin-bottom: 20px;">
        `;

        this.results.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : '❌';
            const color = result.status === 'PASS' ? '#28a745' : '#dc3545';
            const message = result.status === 'PASS' ? result.result : result.error;
            
            html += `
                <div style="margin-bottom: 10px; padding: 10px; border-left: 3px solid ${color}; background: ${result.status === 'PASS' ? '#f8f9fa' : '#fff5f5'};">
                    <strong>${icon} ${result.name}</strong><br>
                    <small style="color: #666;">${message}</small>
                </div>
            `;
        });

        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;

        html += `
            </div>
            <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                <strong>Summary: ${passed} passed, ${failed} failed</strong>
            </div>
            <button onclick="this.parentElement.parentElement.remove(); this.parentElement.parentElement.previousElementSibling.remove();" 
                    style="margin-top: 15px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;">
                Close
            </button>
        `;

        modal.innerHTML = html;
        
        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        // Auto-close after 30 seconds
        setTimeout(() => {
            if (modal.parentElement) {
                modal.remove();
                overlay.remove();
            }
        }, 30000);
    }
}

// Add test button to admin interface
document.addEventListener('DOMContentLoaded', () => {
    // Only add test button on admin pages
    if (window.location.pathname.includes('admin')) {
        setTimeout(() => {
            const testButton = document.createElement('button');
            testButton.innerHTML = '🧪 Test Backend';
            testButton.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 10px 15px;
                background: #17a2b8;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                z-index: 1000;
                font-size: 14px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            `;
            
            testButton.onclick = async () => {
                const tester = new BackendTest();
                await tester.runTests();
            };
            
            document.body.appendChild(testButton);
        }, 2000);
    }
});

// Export for manual use
window.BackendTest = BackendTest;
