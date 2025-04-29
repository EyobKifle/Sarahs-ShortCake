document.addEventListener('DOMContentLoaded', () => {
    const settingsForm = document.getElementById('settingsForm');
    const passwordForm = document.getElementById('passwordForm');
    const addressForm = document.getElementById('addressForm');
    const addressList = document.getElementById('addressList');
    const addAddressBtn = document.getElementById('addAddressBtn');
    const addressModal = document.getElementById('addressModal');
    const modalClose = document.getElementById('modalClose');
    const cancelBtn = document.getElementById('cancelBtn');
    const successMessage = document.getElementById('successMessage');

    function showSuccessMessage() {
        successMessage.style.display = 'flex';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 5000);
    }

    function openModal(title, address = null) {
        document.getElementById('modalTitle').textContent = title;
        if (address) {
            document.getElementById('addressId').value = address.id;
            document.getElementById('modalStreet').value = address.street;
            document.getElementById('modalCity').value = address.city;
            document.getElementById('modalState').value = address.state;
            document.getElementById('modalZip').value = address.zip;
            document.getElementById('modalDefault').checked = address.isDefault;
        } else {
            document.getElementById('addressId').value = '';
            document.getElementById('addressForm').reset();
        }
        addressModal.style.display = 'flex';
    }

    function closeModal() {
        addressModal.style.display = 'none';
    }

    modalClose.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    addAddressBtn.addEventListener('click', () => {
        openModal('Add New Address');
    });

    async function loadUserData() {
        try {
            setTimeout(() => {
                const mockUser = {
                    firstName: "Sarah",
                    lastName: "Johnson",
                    email: "sarah.johnson@example.com",
                    phone: "(555) 123-4567"
                };
                document.getElementById('firstName').value = mockUser.firstName;
                document.getElementById('lastName').value = mockUser.lastName;
                document.getElementById('email').value = mockUser.email;
                document.getElementById('phone').value = mockUser.phone;
            }, 800);
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    async function loadAddresses() {
        try {
            setTimeout(() => {
                const mockAddresses = [
                    {
                        id: "addr_1",
                        street: "123 Sweet Street",
                        city: "Dessertville",
                        state: "CA",
                        zip: "90210",
                        isDefault: true
                    },
                    {
                        id: "addr_2",
                        street: "456 Cake Avenue",
                        city: "Bakertown",
                        state: "NY",
                        zip: "10001",
                        isDefault: false
                    }
                ];

                addressList.innerHTML = '';

                if (mockAddresses.length === 0) {
                    addressList.innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                            <i class="fas fa-map-marker-alt" style="font-size: 2rem; color: var(--gray-dark); margin-bottom: 1rem;"></i>
                            <h3>No Saved Addresses</h3>
                            <p>You haven't saved any addresses yet.</p>
                        </div>
                    `;
                } else {
                    mockAddresses.forEach(address => {
                        const li = document.createElement('li');
                        li.className = 'address-item animate-fade';
                        li.innerHTML = `
                            ${address.isDefault ? '<span class="address-default">DEFAULT</span>' : ''}
                            <p><strong>${address.street}</strong></p>
                            <p>${address.city}, ${address.state} ${address.zip}</p>
                            <div class="address-actions">
                                <button class="btn btn-outline edit-address-btn" data-id="${address.id}">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="btn btn-outline delete-address-btn" data-id="${address.id}">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        `;
                        addressList.appendChild(li);
                    });

                    document.querySelectorAll('.edit-address-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const id = e.currentTarget.dataset.id;
                            const address = mockAddresses.find(a => a.id === id);
                            if (address) {
                                openModal('Edit Address', address);
                            }
                        });
                    });

                    document.querySelectorAll('.delete-address-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const id = e.currentTarget.dataset.id;
                            if (confirm('Are you sure you want to delete this address?')) {
                                const item = e.currentTarget.closest('.address-item');
                                item.classList.add('animate__animated', 'animate__fadeOut');
                                setTimeout(() => {
                                    item.remove();
                                    showSuccessMessage();
                                }, 300);
                            }
                        });
                    });
                }
            }, 1000);
        } catch (error) {
            console.error('Error loading addresses:', error);
        }
    }

    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        let isValid = true;

        if (!document.getElementById('firstName').value.trim()) {
            isValid = false;
            document.getElementById('firstName').classList.add('input-error');
            document.getElementById('firstNameError').style.display = 'block';
        }

        if (!document.getElementById('lastName').value.trim()) {
            isValid = false;
            document.getElementById('lastName').classList.add('input-error');
            document.getElementById('lastNameError').style.display = 'block';
        }

        if (!document.getElementById('email').value.trim() ||
            !document.getElementById('email').value.includes('@')) {
            isValid = false;
            document.getElementById('email').classList.add('input-error');
            document.getElementById('emailError').style.display = 'block';
        }

        if (isValid) {
            try {
                setTimeout(() => {
                    showSuccessMessage();
                }, 800);
            } catch (error) {
                console.error('Error saving profile:', error);
                alert('Failed to save profile. Please try again.');
            }
        }
    });

    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        let isValid = true;

        if (!currentPassword) {
            isValid = false;
            document.getElementById('currentPassword').classList.add('input-error');
            document.getElementById('currentPasswordError').style.display = 'block';
        }

        if (!newPassword || newPassword.length < 8) {
            isValid = false;
            document.getElementById('newPassword').classList.add('input-error');
            document.getElementById('newPasswordError').style.display = 'block';
        }

        if (newPassword !== confirmPassword) {
            isValid = false;
            document.getElementById('confirmPassword').classList.add('input-error');
            document.getElementById('confirmPasswordError').style.display = 'block';
        }

        if (isValid) {
            try {
                setTimeout(() => {
                    showSuccessMessage();
                    passwordForm.reset();
                }, 800);
            } catch (error) {
                console.error('Error changing password:', error);
                alert('Failed to change password. Please try again.');
            }
        }
    });

    addressForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const street = document.getElementById('modalStreet').value.trim();
        const city = document.getElementById('modalCity').value.trim();
        const state = document.getElementById('modalState').value.trim();
        const zip = document.getElementById('modalZip').value.trim();
        const isDefault = document.getElementById('modalDefault').checked;
        const addressId = document.getElementById('addressId').value;

        let isValid = true;

        if (!street) {
            isValid = false;
            document.getElementById('modalStreet').classList.add('input-error');
            document.getElementById('streetError').style.display = 'block';
        }

        if (!city) {
            isValid = false;
            document.getElementById('modalCity').classList.add('input-error');
            document.getElementById('cityError').style.display = 'block';
        }

        if (!state) {
            isValid = false;
            document.getElementById('modalState').classList.add('input-error');
            document.getElementById('stateError').style.display = 'block';
        }

        if (!zip) {
            isValid = false;
            document.getElementById('modalZip').classList.add('input-error');
            document.getElementById('zipError').style.display = 'block';
        }

        if (isValid) {
            try {
                setTimeout(() => {
                    closeModal();
                    showSuccessMessage();
                    loadAddresses();
                }, 800);
            } catch (error) {
                console.error('Error saving address:', error);
                alert('Failed to save address. Please try again.');
            }
        }
    });

    loadUserData();
    loadAddresses();
});
