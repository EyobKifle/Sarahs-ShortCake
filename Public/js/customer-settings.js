// JavaScript for customer-settings.html to handle fetching and updating user profile, addresses, and password changes

document.addEventListener('DOMContentLoaded', () => {
    // Fetch user profile and populate form
    fetchUserProfile();

    // Fetch user addresses and populate list
    fetchUserAddresses();

    // Setup event listeners
    setupEventListeners();
});

function fetchUserProfile() {
    fetch('/api/user/profile', { credentials: 'include' })
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch user profile');
            return response.json();
        })
        .then(userData => {
            document.getElementById('firstName').value = userData.firstName || '';
            document.getElementById('lastName').value = userData.lastName || '';
            document.getElementById('email').value = userData.email || '';
            document.getElementById('phone').value = userData.phone || '';
        })
        .catch(error => {
            console.error('Error fetching user profile:', error);
        });
}

function fetchUserAddresses() {
    const addressList = document.getElementById('addressList');
    addressList.innerHTML = `
        <li class="address-item loading" style="height: 180px;"></li>
        <li class="address-item loading" style="height: 180px;"></li>
    `;

    fetch('/api/user/addresses', { credentials: 'include' })
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch addresses');
            return response.json();
        })
        .then(addresses => {
            if (!Array.isArray(addresses) || addresses.length === 0) {
                addressList.innerHTML = '<p>No addresses found. Please add one.</p>';
                return;
            }
            addressList.innerHTML = '';
            addresses.forEach(address => {
                const li = document.createElement('li');
                li.className = 'address-item';
                li.dataset.id = address._id;
                li.innerHTML = `
                    <p>${address.street}, ${address.city}, ${address.state} ${address.zip}</p>
                    ${address.default ? '<span class="address-default">Default</span>' : ''}
                    <div class="address-actions">
                        <button class="btn btn-outline btn-edit" data-id="${address._id}"><i class="fas fa-edit"></i> Edit</button>
                        <button class="btn btn-danger btn-delete" data-id="${address._id}"><i class="fas fa-trash"></i> Delete</button>
                    </div>
                `;
                addressList.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Error fetching addresses:', error);
            addressList.innerHTML = '<p>Error loading addresses. Please try again later.</p>';
        });
}

function setupEventListeners() {
    // Profile form submission
    const settingsForm = document.getElementById('settingsForm');
    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const updatedData = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim()
        };
        fetch('/api/user/profile', {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to update profile');
            return response.json();
        })
        .then(data => {
            const successMessage = document.getElementById('successMessage');
            successMessage.style.display = 'flex';
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 3000);
        })
        .catch(error => {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        });
    });

    // Address add button
    const addAddressBtn = document.getElementById('addAddressBtn');
    const addressModal = document.getElementById('addressModal');
    const modalClose = document.getElementById('modalClose');
    const cancelBtn = document.getElementById('cancelBtn');
    const addressForm = document.getElementById('addressForm');
    const modalTitle = document.getElementById('modalTitle');

    addAddressBtn.addEventListener('click', () => {
        openAddressModal();
    });

    modalClose.addEventListener('click', closeAddressModal);
    cancelBtn.addEventListener('click', closeAddressModal);

    // Address form submission
    addressForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const addressId = document.getElementById('addressId').value;
        const addressData = {
            street: document.getElementById('modalStreet').value.trim(),
            city: document.getElementById('modalCity').value.trim(),
            state: document.getElementById('modalState').value.trim(),
            zip: document.getElementById('modalZip').value.trim(),
            default: document.getElementById('modalDefault').checked
        };

        let url = '/api/user/addresses';
        let method = 'POST';
        if (addressId) {
            url += `/${addressId}`;
            method = 'PUT';
        }

        fetch(url, {
            method,
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(addressData)
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to save address');
            return response.json();
        })
        .then(data => {
            closeAddressModal();
            fetchUserAddresses();
        })
        .catch(error => {
            console.error('Error saving address:', error);
            alert('Failed to save address. Please try again.');
        });
    });

    // Delegate edit and delete buttons in address list
    document.getElementById('addressList').addEventListener('click', (e) => {
        if (e.target.closest('.btn-edit')) {
            const id = e.target.closest('.btn-edit').dataset.id;
            editAddress(id);
        } else if (e.target.closest('.btn-delete')) {
            const id = e.target.closest('.btn-delete').dataset.id;
            if (confirm('Are you sure you want to delete this address?')) {
                deleteAddress(id);
            }
        }
    });

    // Password form submission
    const passwordForm = document.getElementById('passwordForm');
    passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value.trim();
        const newPassword = document.getElementById('newPassword').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();

        if (newPassword.length < 8) {
            alert('New password must be at least 8 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            alert('New password and confirmation do not match.');
            return;
        }

        fetch('/api/user/change-password', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword })
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to change password');
            return response.json();
        })
        .then(data => {
            alert('Password changed successfully.');
            passwordForm.reset();
        })
        .catch(error => {
            console.error('Error changing password:', error);
            alert('Failed to change password. Please try again.');
        });
    });
}

function openAddressModal(address = null) {
    const addressModal = document.getElementById('addressModal');
    const modalTitle = document.getElementById('modalTitle');
    const addressIdInput = document.getElementById('addressId');
    const streetInput = document.getElementById('modalStreet');
    const cityInput = document.getElementById('modalCity');
    const stateInput = document.getElementById('modalState');
    const zipInput = document.getElementById('modalZip');
    const defaultCheckbox = document.getElementById('modalDefault');

    if (address) {
        modalTitle.textContent = 'Edit Address';
        addressIdInput.value = address._id;
        streetInput.value = address.street;
        cityInput.value = address.city;
        stateInput.value = address.state;
        zipInput.value = address.zip;
        defaultCheckbox.checked = address.default;
    } else {
        modalTitle.textContent = 'Add New Address';
        addressIdInput.value = '';
        streetInput.value = '';
        cityInput.value = '';
        stateInput.value = '';
        zipInput.value = '';
        defaultCheckbox.checked = false;
    }

    addressModal.style.display = 'flex';
}

function closeAddressModal() {
    const addressModal = document.getElementById('addressModal');
    addressModal.style.display = 'none';
}

function editAddress(id) {
    fetch(`/api/user/addresses/${id}`, { credentials: 'include' })
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch address');
            return response.json();
        })
        .then(address => {
            openAddressModal(address);
        })
        .catch(error => {
            console.error('Error fetching address:', error);
            alert('Failed to load address for editing.');
        });
}

function deleteAddress(id) {
    fetch(`/api/user/addresses/${id}`, {
        method: 'DELETE',
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to delete address');
        fetchUserAddresses();
    })
    .catch(error => {
        console.error('Error deleting address:', error);
        alert('Failed to delete address. Please try again.');
    });
}
