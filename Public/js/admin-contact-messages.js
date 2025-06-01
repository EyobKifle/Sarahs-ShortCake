document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔧 Loading admin contact messages...');

    const messagesTableBody = document.querySelector('#messagesTable tbody');
    const noMessagesDiv = document.getElementById('noMessages');

    try {
        // Check authentication
        const token = localStorage.getItem('token');
        console.log('🔐 Token found:', !!token);

        if (!token) {
            console.error('❌ No authentication token found');
            alert('You must be logged in as admin to view this page.');
            window.location.href = '/login.html';
            return;
        }

        console.log('📡 Fetching contact messages...');
        const response = await fetch('/api/contact', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            if (response.status === 401) {
                console.error('❌ Authentication failed - redirecting to login');
                alert('Your session has expired. Please log in again.');
                localStorage.removeItem('token');
                window.location.href = '/login.html';
                return;
            } else if (response.status === 403) {
                console.error('❌ Access forbidden - insufficient permissions');
                alert('You do not have permission to view this page.');
                window.location.href = '/admin-dashboard.html';
                return;
            }

            const errorData = await response.json().catch(() => ({}));
            console.error('❌ API Error:', errorData);
            throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch contact messages`);
        }

        const data = await response.json();
        console.log('📧 Contact messages data:', data);

        // Handle both direct array and wrapped response formats
        const messages = Array.isArray(data) ? data : (data.data || []);

        if (messages.length === 0) {
            noMessagesDiv.style.display = 'block';
            messagesTableBody.innerHTML = '';
            return;
        }

        noMessagesDiv.style.display = 'none';

        messages.forEach(message => {
            const tr = document.createElement('tr');

            // Add status styling
            if (message.status === 'new' || !message.isRead) {
                tr.classList.add('unread-message');
                tr.style.backgroundColor = '#f8f9fa';
                tr.style.fontWeight = '600';
            }

            const nameTd = document.createElement('td');
            nameTd.textContent = message.name;
            tr.appendChild(nameTd);

            const emailTd = document.createElement('td');
            emailTd.innerHTML = `<a href="mailto:${message.email}" style="color: #007bff; text-decoration: none;">${message.email}</a>`;
            tr.appendChild(emailTd);

            const subjectTd = document.createElement('td');
            subjectTd.textContent = message.subject || 'No Subject';
            tr.appendChild(subjectTd);

            const messageTd = document.createElement('td');
            // Truncate long messages
            const messageText = message.message.length > 100
                ? message.message.substring(0, 100) + '...'
                : message.message;
            messageTd.textContent = messageText;
            messageTd.style.maxWidth = '300px';
            messageTd.style.wordWrap = 'break-word';
            tr.appendChild(messageTd);

            const dateTd = document.createElement('td');
            const date = new Date(message.createdAt);
            dateTd.textContent = date.toLocaleString();
            tr.appendChild(dateTd);

            // Add status column
            const statusTd = document.createElement('td');
            const statusBadge = document.createElement('span');
            statusBadge.className = `status-badge status-${message.status || 'new'}`;
            statusBadge.textContent = message.status || 'new';
            statusBadge.style.padding = '4px 8px';
            statusBadge.style.borderRadius = '12px';
            statusBadge.style.fontSize = '12px';
            statusBadge.style.fontWeight = '600';
            statusBadge.style.textTransform = 'uppercase';

            // Status colors
            switch(message.status) {
                case 'new':
                    statusBadge.style.backgroundColor = '#e3f2fd';
                    statusBadge.style.color = '#1976d2';
                    break;
                case 'read':
                    statusBadge.style.backgroundColor = '#f3e5f5';
                    statusBadge.style.color = '#7b1fa2';
                    break;
                case 'replied':
                    statusBadge.style.backgroundColor = '#e8f5e8';
                    statusBadge.style.color = '#2e7d32';
                    break;
                default:
                    statusBadge.style.backgroundColor = '#f5f5f5';
                    statusBadge.style.color = '#666';
            }

            statusTd.appendChild(statusBadge);
            tr.appendChild(statusTd);

            // Add actions column
            const actionsTd = document.createElement('td');
            const actionsDiv = document.createElement('div');
            actionsDiv.style.display = 'flex';
            actionsDiv.style.gap = '8px';

            // View button
            const viewBtn = document.createElement('button');
            viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
            viewBtn.className = 'action-btn view-btn';
            viewBtn.style.padding = '4px 8px';
            viewBtn.style.border = 'none';
            viewBtn.style.borderRadius = '4px';
            viewBtn.style.backgroundColor = '#007bff';
            viewBtn.style.color = 'white';
            viewBtn.style.cursor = 'pointer';
            viewBtn.title = 'View Message';
            viewBtn.onclick = () => viewMessage(message);

            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.className = 'action-btn delete-btn';
            deleteBtn.style.padding = '4px 8px';
            deleteBtn.style.border = 'none';
            deleteBtn.style.borderRadius = '4px';
            deleteBtn.style.backgroundColor = '#dc3545';
            deleteBtn.style.color = 'white';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.title = 'Delete Message';
            deleteBtn.onclick = () => deleteMessage(message._id);

            actionsDiv.appendChild(viewBtn);
            actionsDiv.appendChild(deleteBtn);
            actionsTd.appendChild(actionsDiv);
            tr.appendChild(actionsTd);

            messagesTableBody.appendChild(tr);
        });

        console.log('✅ Contact messages loaded successfully');

    } catch (error) {
        console.error('❌ Error loading contact messages:', error);

        // Show user-friendly error message
        if (messagesTableBody) {
            messagesTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: #dc3545;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i><br>
                        <strong>Error loading messages</strong><br>
                        <small>${error.message}</small><br>
                        <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-refresh"></i> Retry
                        </button>
                    </td>
                </tr>
            `;
        }

        if (noMessagesDiv) {
            noMessagesDiv.style.display = 'none';
        }
    }
});

// Function to view message details
function viewMessage(message) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 8px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;

    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 1rem;">
            <h3 style="margin: 0; color: #333;">Contact Message Details</h3>
            <button onclick="this.closest('.modal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666;">&times;</button>
        </div>
        <div style="margin-bottom: 1rem;">
            <strong>From:</strong> ${message.name}<br>
            <strong>Email:</strong> <a href="mailto:${message.email}" style="color: #007bff;">${message.email}</a><br>
            ${message.phone ? `<strong>Phone:</strong> ${message.phone}<br>` : ''}
            <strong>Subject:</strong> ${message.subject || 'No Subject'}<br>
            <strong>Date:</strong> ${new Date(message.createdAt).toLocaleString()}<br>
            <strong>Status:</strong> <span style="padding: 2px 8px; border-radius: 12px; font-size: 12px; background: #e3f2fd; color: #1976d2;">${message.status || 'new'}</span>
        </div>
        <div style="margin-bottom: 1rem;">
            <strong>Message:</strong>
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px; margin-top: 0.5rem; white-space: pre-wrap;">${message.message}</div>
        </div>
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
            <button onclick="markAsRead('${message._id}')" style="padding: 0.5rem 1rem; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Mark as Read</button>
            <button onclick="deleteMessage('${message._id}')" style="padding: 0.5rem 1rem; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Delete</button>
            <button onclick="this.closest('.modal').remove()" style="padding: 0.5rem 1rem; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
        </div>
    `;

    modal.className = 'modal';
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Mark as read when viewed
    markAsRead(message._id);
}

// Function to mark message as read
async function markAsRead(messageId) {
    try {
        console.log('📖 Marking message as read:', messageId);

        const token = localStorage.getItem('token');
        if (!token) {
            console.error('❌ No authentication token');
            alert('Please log in again.');
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch(`/api/contact/${messageId}/read`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📖 Mark as read response status:', response.status);

        if (response.ok) {
            console.log('✅ Message marked as read successfully');
            // Refresh the page to update the display
            location.reload();
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Failed to mark as read:', errorData);
            throw new Error(errorData.message || 'Failed to mark message as read');
        }
    } catch (error) {
        console.error('❌ Error marking message as read:', error);
        alert('Error marking message as read. Please try again.');
    }
}

// Function to delete message
async function deleteMessage(messageId) {
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
        return;
    }

    try {
        console.log('🗑️ Deleting message:', messageId);

        const token = localStorage.getItem('token');
        if (!token) {
            console.error('❌ No authentication token');
            alert('Please log in again.');
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch(`/api/contact/${messageId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('🗑️ Delete response status:', response.status);

        if (response.ok) {
            console.log('✅ Message deleted successfully');
            alert('Message deleted successfully');
            location.reload();
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Failed to delete message:', errorData);
            throw new Error(errorData.message || 'Failed to delete message');
        }
    } catch (error) {
        console.error('❌ Error deleting message:', error);
        alert('Error deleting message. Please try again.');
    }
}
