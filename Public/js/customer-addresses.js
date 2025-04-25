document.addEventListener('DOMContentLoaded', () => {
    // Load addresses
    async function loadAddresses() {
        try {
            const res = await fetch('/api/customers/addresses', {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!res.ok) throw new Error('Failed to fetch addresses');
            const data = await res.json();
            if (data.success) {
                const addressList = document.getElementById('addressList');
                addressList.innerHTML = '';
                data.data.forEach(address => {
                    const li = document.createElement('li');
                    li.className = 'address-item';
                    li.dataset.id = address._id;
                    li.innerHTML = `
                        <p>${address.street}, ${address.city}, ${address.state} ${address.zip}</p>
                        <button class="edit-address-btn">Edit</button>
                        <button class="delete-address-btn">Delete</button>
                    `;
                    addressList.appendChild(li);
                });
            }
        } catch (error) {
            console.error(error);
        }
    }

    // Add address
    async function addAddress(address) {
        try {
            const res = await fetch('/api/customers/addresses', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(address)
            });
            if (!res.ok) throw new Error('Failed to add address');
            await loadAddresses();
        } catch (error) {
            console.error(error);
        }
    }

    // Edit address
    async function editAddress(id, address) {
        try {
            const res = await fetch(`/api/customers/addresses/${id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(address)
            });
            if (!res.ok) throw new Error('Failed to edit address');
            await loadAddresses();
        } catch (error) {
            console.error(error);
        }
    }

    // Delete address
    async function deleteAddress(id) {
        try {
            const res = await fetch(`/api/customers/addresses/${id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!res.ok) throw new Error('Failed to delete address');
            await loadAddresses();
        } catch (error) {
            console.error(error);
        }
    }

    // Event delegation for edit and delete buttons
    document.getElementById('addressList').addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-address-btn')) {
            const li = e.target.closest('li.address-item');
            const id = li.dataset.id;
            const street = prompt('Enter street:', li.querySelector('p').textContent.split(',')[0].trim());
            const city = prompt('Enter city:', li.querySelector('p').textContent.split(',')[1].trim());
            const stateZip = li.querySelector('p').textContent.split(',')[2].trim().split(' ');
            const state = prompt('Enter state:', stateZip[0]);
            const zip = prompt('Enter zip:', stateZip[1]);
            if (street && city && state && zip) {
                editAddress(id, { street, city, state, zip });
            }
        } else if (e.target.classList.contains('delete-address-btn')) {
            const li = e.target.closest('li.address-item');
            const id = li.dataset.id;
            if (confirm('Are you sure you want to delete this address?')) {
                deleteAddress(id);
            }
        }
    });

    // Add address form submission
    document.getElementById('addAddressForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const street = document.getElementById('street').value.trim();
        const city = document.getElementById('city').value.trim();
        const state = document.getElementById('state').value.trim();
        const zip = document.getElementById('zip').value.trim();
        if (street && city && state && zip) {
            addAddress({ street, city, state, zip });
            e.target.reset();
        } else {
            alert('Please fill in all address fields.');
        }
    });

    // Initial load
    loadAddresses();
});
