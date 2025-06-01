// Contact Messages Management Module
class ContactManagement {
    constructor() {
        this.messages = [];
        this.filteredMessages = [];
    }

    async loadMessages() {
        try {
            console.log('🔄 Loading contact messages...');

            const token = localStorage.getItem('token');
            console.log('🔑 Current token:', token ? 'Token exists' : 'No token');

            if (!token) {
                throw new Error('No authentication token found. Please log in again.');
            }

            console.log('📡 Fetching contact messages from API...');
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
                    localStorage.removeItem('token');
                    throw new Error('Authentication failed. Please log in again.');
                } else if (response.status === 403) {
                    throw new Error('Access forbidden. Insufficient permissions.');
                }

                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch messages`);
            }

            const data = await response.json();
            console.log('📨 Contact messages response:', data);

            // Handle both direct array and wrapped response formats
            this.messages = Array.isArray(data) ? data : (data.data || data || []);
            this.filteredMessages = [...this.messages];

            console.log(`📊 Loaded ${this.messages.length} contact messages`);

            // Update message statistics
            this.updateMessageStats();
            this.renderMessagesTable();

            return this.messages;
        } catch (error) {
            console.error('❌ Error loading messages:', error);
            console.error('❌ Error details:', error.stack);
            this.showNotification('Error loading messages: ' + error.message, 'error');

            // Show error in the table
            const tbody = document.querySelector('#messagesTable tbody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-danger py-4">
                            <i class="fas fa-exclamation-triangle fa-2x mb-2"></i><br>
                            <strong>Error loading contact messages</strong><br>
                            <small>${error.message}</small>
                        </td>
                    </tr>
                `;
            }

            return [];
        }
    }

    updateMessageStats() {
        const totalMessages = this.messages.length;
        const unreadMessages = this.messages.filter(msg => msg.status === 'new' || !msg.isRead).length;
        const repliedMessages = this.messages.filter(msg => msg.status === 'replied').length;
        const todayMessages = this.messages.filter(msg => {
            const msgDate = new Date(msg.createdAt);
            const today = new Date();
            return msgDate.toDateString() === today.toDateString();
        }).length;

        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        };

        updateElement('totalMessages', totalMessages);
        updateElement('unreadMessages', unreadMessages);
        updateElement('repliedMessages', repliedMessages);
        updateElement('todayMessages', todayMessages);
    }

    renderMessagesTable() {
        const tbody = document.querySelector('#messagesTable tbody');
        if (!tbody) return;

        if (this.filteredMessages.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No messages found</td></tr>';
            return;
        }

        const html = this.filteredMessages.map(message => {
            const messageDate = new Date(message.createdAt).toLocaleDateString();
            const statusBadge = this.getStatusBadge(message.status);
            const isUnread = message.status === 'new' || !message.isRead;

            return `
                <tr class="${isUnread ? 'table-warning' : ''}">
                    <td>
                        <input type="checkbox" class="form-check-input message-checkbox" value="${message._id}">
                    </td>
                    <td>
                        <div class="${isUnread ? 'fw-bold' : ''}">
                            <div>${message.name || 'Anonymous'}</div>
                            <small class="text-muted">${message.email || 'No email'}</small>
                        </div>
                    </td>
                    <td>
                        <div class="${isUnread ? 'fw-bold' : ''}" style="max-width: 300px;">
                            ${message.subject || 'No subject'}
                            <br>
                            <small class="text-muted">${this.truncateText(message.message || '', 50)}</small>
                        </div>
                    </td>
                    <td>${messageDate}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="window.AdminManager.modules.contactManagement.viewMessage('${message._id}')" title="View Message">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${isUnread ? `
                                <button class="btn btn-outline-warning" onclick="window.AdminManager.modules.contactManagement.markAsRead('${message._id}')" title="Mark as Read">
                                    <i class="fas fa-check"></i>
                                </button>
                            ` : ''}
                            <button class="btn btn-outline-success" onclick="window.AdminManager.modules.contactManagement.replyToMessage('${message._id}')" title="Reply">
                                <i class="fas fa-reply"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="window.AdminManager.modules.contactManagement.deleteMessage('${message._id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = html;
        this.updateMessageStats();
    }



    getStatusBadge(status) {
        const statusClasses = {
            'new': 'bg-warning text-dark',
            'read': 'bg-secondary',
            'replied': 'bg-success',
            'archived': 'bg-info'
        };

        const className = statusClasses[status] || 'bg-secondary';
        const displayStatus = status === 'new' ? 'unread' : status;
        return `<span class="badge ${className}">${displayStatus}</span>`;
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    filterMessages(searchTerm, statusFilter, dateFilter) {
        this.filteredMessages = this.messages.filter(message => {
            // Search filter
            const searchMatch = !searchTerm ||
                (message.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (message.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (message.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (message.message || '').toLowerCase().includes(searchTerm.toLowerCase());

            // Status filter
            const statusMatch = statusFilter === 'all' || message.status === statusFilter;

            // Date filter
            let dateMatch = true;
            if (dateFilter !== 'all') {
                const messageDate = new Date(message.createdAt);
                const now = new Date();

                switch (dateFilter) {
                    case 'today':
                        dateMatch = messageDate.toDateString() === now.toDateString();
                        break;
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        dateMatch = messageDate >= weekAgo;
                        break;
                    case 'month':
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        dateMatch = messageDate >= monthAgo;
                        break;
                }
            }

            return searchMatch && statusMatch && dateMatch;
        });

        this.renderMessagesTable();
    }

    viewMessage(messageId) {
        try {
            console.log('🔍 ViewMessage called with ID:', messageId);
            console.log('📊 Available messages:', this.messages.length);

            const message = this.messages.find(m => m._id === messageId);
            if (!message) {
                console.error('❌ Message not found with ID:', messageId);
                console.log('📋 Available message IDs:', this.messages.map(m => m._id));
                this.showNotification('Message not found', 'error');
                return;
            }

            console.log('✅ Message found, calling showMessageModal...');
            this.showMessageModal(message);

        } catch (error) {
            console.error('❌ Error in viewMessage:', error);
            this.showNotification('Error viewing message: ' + error.message, 'error');
        }
    }

    showMessageModal(message) {
        try {
            console.log('👁️ Showing comprehensive message modal for:', message._id);
            console.log('📧 Message data:', message);

            // Check if Bootstrap is available
            if (typeof bootstrap === 'undefined') {
                console.error('❌ Bootstrap is not loaded');
                alert('Bootstrap is not loaded. Please refresh the page.');
                return;
            }

            // Create modal if it doesn't exist
            let modal = document.getElementById('messageModal');
            if (!modal) {
                console.log('🔧 Creating new modal element');
                modal = document.createElement('div');
                modal.className = 'modal fade';
                modal.id = 'messageModal';
                modal.innerHTML = `
                <div class="modal-dialog modal-xl">
                    <div class="modal-content admin-modal-content">
                        <div class="modal-header admin-modal-header">
                            <h5 class="modal-title admin-modal-title" id="messageModalTitle">
                                <div class="admin-modal-icon">
                                    <i class="fas fa-envelope-open"></i>
                                </div>
                                <div class="admin-modal-title-content">
                                    <span class="admin-modal-title-main" id="modalSubject">Message Details</span>
                                    <span class="admin-modal-status" id="modalStatusIcon"></span>
                                </div>
                            </h5>
                            <button type="button" class="btn-close admin-modal-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-0" id="messageModalBody">
                            <!-- Content will be dynamically loaded -->
                        </div>
                        <div class="modal-footer admin-modal-footer">
                            <div class="admin-modal-actions">
                                <div class="admin-modal-actions-left">
                                    <button type="button" class="btn admin-btn admin-btn-info" id="markAsReadBtn" title="Mark as Read">
                                        <i class="fas fa-check-circle"></i>
                                        <span class="admin-btn-text">Mark as Read</span>
                                    </button>
                                    <button type="button" class="btn admin-btn admin-btn-warning" id="copyEmailBtn" title="Copy Email">
                                        <i class="fas fa-copy"></i>
                                        <span class="admin-btn-text">Copy Email</span>
                                    </button>
                                    <button type="button" class="btn admin-btn admin-btn-danger" id="deleteMessageBtn" title="Delete Message">
                                        <i class="fas fa-trash"></i>
                                        <span class="admin-btn-text">Delete</span>
                                    </button>
                                </div>
                                <div class="admin-modal-actions-right">
                                    <button type="button" class="btn admin-btn admin-btn-secondary" data-bs-dismiss="modal">
                                        <i class="fas fa-times"></i>
                                        <span class="admin-btn-text">Close</span>
                                    </button>
                                    <button type="button" class="btn admin-btn admin-btn-primary" id="replyMessageBtn">
                                        <i class="fas fa-reply"></i>
                                        <span class="admin-btn-text">Reply</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Update modal title and status
        const modalSubject = document.getElementById('modalSubject');
        const modalStatusIcon = document.getElementById('modalStatusIcon');
        const modalBody = document.getElementById('messageModalBody');

        modalSubject.textContent = message.subject || 'Contact Message';
        modalStatusIcon.innerHTML = this.getStatusIcon(message.status);

        // Calculate time ago and status
        const timeAgo = this.getTimeAgo(new Date(message.createdAt));
        const isUnread = message.status === 'new' || !message.isRead;

        modalBody.innerHTML = `
            <!-- Message Header Section -->
            <div class="admin-modal-header-section">
                <div class="admin-modal-sender-info">
                    <div class="admin-modal-sender-main">
                        <div class="admin-modal-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="admin-modal-sender-details">
                            <h4 class="admin-modal-sender-name ${isUnread ? 'unread' : ''}">${message.name || 'Anonymous'}</h4>
                            <div class="admin-modal-contact-info">
                                <div class="admin-modal-contact-item">
                                    <i class="fas fa-envelope"></i>
                                    <a href="mailto:${message.email}" class="admin-modal-contact-link">${message.email || 'No email'}</a>
                                </div>
                                ${message.phone ? `
                                    <div class="admin-modal-contact-item">
                                        <i class="fas fa-phone"></i>
                                        <a href="tel:${message.phone}" class="admin-modal-contact-link">${message.phone}</a>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="admin-modal-sender-meta">
                        <div class="admin-modal-status-badge">${this.getStatusBadge(message.status)}</div>
                        <div class="admin-modal-timestamp">
                            <i class="fas fa-clock"></i>
                            <span class="admin-modal-time-ago">${timeAgo}</span>
                        </div>
                        <div class="admin-modal-date-time">
                            ${new Date(message.createdAt).toLocaleDateString()} at ${new Date(message.createdAt).toLocaleTimeString()}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Content Area -->
            <div class="admin-modal-content-area">
                <div class="admin-modal-layout">
                    <!-- Left Column - Message Content -->
                    <div class="admin-modal-main-content">
                        <!-- Message Subject & Content Card -->
                        <div class="admin-card admin-card-primary">
                            <div class="admin-card-header">
                                <div class="admin-card-title">
                                    <i class="fas fa-comment-alt"></i>
                                    <span>Message Content</span>
                                    ${isUnread ? '<span class="admin-badge admin-badge-warning">Unread</span>' : ''}
                                </div>
                            </div>
                            <div class="admin-card-body">
                                <div class="admin-field-group">
                                    <label class="admin-field-label">Subject:</label>
                                    <div class="admin-field-value admin-subject ${isUnread ? 'unread' : ''}">${message.subject || 'No subject provided'}</div>
                                </div>
                                <div class="admin-field-group">
                                    <label class="admin-field-label">Message:</label>
                                    <div class="admin-message-content ${isUnread ? 'unread' : ''}">
                                        <div class="admin-message-text">
                                            ${(message.message || 'No message content').replace(/\n/g, '<br>')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Admin Reply Section (if exists) -->
                        ${message.reply ? `
                            <div class="admin-card admin-card-success">
                                <div class="admin-card-header admin-card-header-success">
                                    <div class="admin-card-title">
                                        <i class="fas fa-reply"></i>
                                        <span>Admin Reply</span>
                                        <span class="admin-badge admin-badge-success">Sent</span>
                                    </div>
                                </div>
                                <div class="admin-card-body">
                                    <div class="admin-reply-content">
                                        <div class="admin-reply-text">
                                            ${message.reply.replace(/\n/g, '<br>')}
                                        </div>
                                    </div>
                                    <div class="admin-reply-meta">
                                        <i class="fas fa-clock"></i>
                                        <span>Replied on ${message.repliedAt ? new Date(message.repliedAt).toLocaleDateString() : 'Unknown date'}</span>
                                        <span>at ${message.repliedAt ? new Date(message.repliedAt).toLocaleTimeString() : 'Unknown time'}</span>
                                    </div>
                                </div>
                            </div>
                        ` : ''}

                        <!-- Message Timeline -->
                        <div class="admin-card admin-card-info">
                            <div class="admin-card-header">
                                <div class="admin-card-title">
                                    <i class="fas fa-history"></i>
                                    <span>Message Timeline</span>
                                </div>
                            </div>
                            <div class="admin-card-body">
                                <div class="admin-timeline-container">
                                    ${this.buildMessageTimeline(message)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column - Details Sidebar -->
                    <div class="admin-modal-sidebar">
                        <!-- Message Metadata Card -->
                        <div class="admin-card admin-card-secondary">
                            <div class="admin-card-header">
                                <div class="admin-card-title">
                                    <i class="fas fa-info-circle"></i>
                                    <span>Message Details</span>
                                </div>
                            </div>
                            <div class="admin-card-body">
                                <div class="admin-detail-item">
                                    <label class="admin-detail-label">Message ID:</label>
                                    <div class="admin-detail-value admin-detail-id">${message._id}</div>
                                </div>

                                <div class="admin-detail-item">
                                    <label class="admin-detail-label">Received:</label>
                                    <div class="admin-detail-value">${new Date(message.createdAt).toLocaleDateString()}</div>
                                    <div class="admin-detail-sub">${new Date(message.createdAt).toLocaleTimeString()}</div>
                                </div>

                                <div class="admin-detail-item">
                                    <label class="admin-detail-label">Current Status:</label>
                                    <div class="admin-detail-value">${this.getStatusBadge(message.status)}</div>
                                </div>

                                ${message.readAt ? `
                                    <div class="admin-detail-item">
                                        <label class="admin-detail-label">Read At:</label>
                                        <div class="admin-detail-value">${new Date(message.readAt).toLocaleDateString()}</div>
                                        <div class="admin-detail-sub">${new Date(message.readAt).toLocaleTimeString()}</div>
                                    </div>
                                ` : ''}

                                ${message.repliedAt ? `
                                    <div class="admin-detail-item">
                                        <label class="admin-detail-label">Replied At:</label>
                                        <div class="admin-detail-value">${new Date(message.repliedAt).toLocaleDateString()}</div>
                                        <div class="admin-detail-sub">${new Date(message.repliedAt).toLocaleTimeString()}</div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>

                        <!-- Quick Contact Actions Card -->
                        <div class="admin-card admin-card-warning">
                            <div class="admin-card-header">
                                <div class="admin-card-title">
                                    <i class="fas fa-bolt"></i>
                                    <span>Quick Actions</span>
                                </div>
                            </div>
                            <div class="admin-card-body">
                                <div class="admin-quick-actions">
                                    <a href="mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject || 'Your message')}"
                                       class="admin-quick-action admin-quick-action-primary">
                                        <i class="fas fa-external-link-alt"></i>
                                        <span>Open Email Client</span>
                                    </a>
                                    ${message.phone ? `
                                        <a href="tel:${message.phone}" class="admin-quick-action admin-quick-action-success">
                                            <i class="fas fa-phone"></i>
                                            <span>Call Customer</span>
                                        </a>
                                    ` : ''}
                                    <button class="admin-quick-action admin-quick-action-info"
                                            onclick="navigator.clipboard.writeText('${message.email}').then(() => window.AdminManager.modules.contactManagement.showNotification('Email copied to clipboard', 'success'))">
                                        <i class="fas fa-copy"></i>
                                        <span>Copy Email Address</span>
                                    </button>
                                    <div class="admin-security-note">
                                        <i class="fas fa-shield-alt"></i>
                                        <span>All actions are logged for security</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Setup modal event listeners
        const markAsReadBtn = document.getElementById('markAsReadBtn');
        const deleteMessageBtn = document.getElementById('deleteMessageBtn');
        const replyMessageBtn = document.getElementById('replyMessageBtn');
        const copyEmailBtn = document.getElementById('copyEmailBtn');

        // Remove existing event listeners
        markAsReadBtn.replaceWith(markAsReadBtn.cloneNode(true));
        deleteMessageBtn.replaceWith(deleteMessageBtn.cloneNode(true));
        replyMessageBtn.replaceWith(replyMessageBtn.cloneNode(true));
        copyEmailBtn.replaceWith(copyEmailBtn.cloneNode(true));

        // Get fresh references
        const newMarkAsReadBtn = document.getElementById('markAsReadBtn');
        const newDeleteMessageBtn = document.getElementById('deleteMessageBtn');
        const newReplyMessageBtn = document.getElementById('replyMessageBtn');
        const newCopyEmailBtn = document.getElementById('copyEmailBtn');

        // Add event listeners
        newMarkAsReadBtn.addEventListener('click', () => {
            this.markAsRead(message._id);
            bootstrap.Modal.getInstance(modal).hide();
        });

        newDeleteMessageBtn.addEventListener('click', () => {
            this.deleteMessage(message._id);
            bootstrap.Modal.getInstance(modal).hide();
        });

        newReplyMessageBtn.addEventListener('click', () => {
            this.replyToMessage(message._id);
        });

        newCopyEmailBtn.addEventListener('click', () => {
            if (message.email) {
                navigator.clipboard.writeText(message.email).then(() => {
                    this.showNotification('Email address copied to clipboard', 'success');
                }).catch(() => {
                    this.showNotification('Failed to copy email address', 'error');
                });
            }
        });

        // Update button states based on message status
        if (message.status === 'read' || message.isRead) {
            newMarkAsReadBtn.disabled = true;
            newMarkAsReadBtn.innerHTML = '<i class="fas fa-check-circle me-1"></i>Already Read';
        }

            // Add custom CSS for the modal
            this.addModalStyles();

            console.log('🎨 Modal styles added');
            console.log('🚀 Attempting to show modal...');

            // Create and show Bootstrap modal
            const bootstrapModal = new bootstrap.Modal(modal, {
                backdrop: true,
                keyboard: true,
                focus: true
            });

            console.log('📱 Bootstrap modal instance created:', bootstrapModal);

            // Show the modal
            bootstrapModal.show();

            console.log('✅ Modal show() called successfully');

            // Mark as read if unread
            if (message.status === 'new' || !message.isRead) {
                console.log('📖 Auto-marking message as read...');
                this.markAsRead(message._id);
            }

        } catch (error) {
            console.error('❌ Error showing message modal:', error);
            console.error('❌ Error stack:', error.stack);
            this.showNotification('Error displaying message: ' + error.message, 'error');

            // Fallback: show a simple alert with message details
            alert(`Message from ${message.name}:\n\nSubject: ${message.subject || 'No subject'}\n\nMessage: ${message.message || 'No content'}`);
        }
    }

    async markAsRead(messageId) {
        try {
            console.log('📖 Marking message as read:', messageId);

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`/api/contact/${messageId}/read`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to mark message as read');
            }

            // Update local data
            const message = this.messages.find(m => m._id === messageId);
            if (message) {
                message.status = 'read';
                message.isRead = true;
                message.readAt = new Date();
            }

            this.updateMessageStats();
            this.renderMessagesTable();
            this.showNotification('Message marked as read', 'success');

            console.log('✅ Message marked as read successfully');
        } catch (error) {
            console.error('❌ Error marking message as read:', error);
            this.showNotification('Error marking message as read: ' + error.message, 'error');
        }
    }

    replyToMessage(messageId) {
        const message = this.messages.find(m => m._id === messageId);
        if (!message) {
            this.showNotification('Message not found', 'error');
            return;
        }

        this.showReplyModal(message);
    }

    showReplyModal(message) {
        // Create reply modal if it doesn't exist
        let replyModal = document.getElementById('replyModal');
        if (!replyModal) {
            replyModal = document.createElement('div');
            replyModal.className = 'modal fade';
            replyModal.id = 'replyModal';
            replyModal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-reply me-2"></i>Reply to Message
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Original Message:</label>
                                <div class="p-3 bg-light rounded border" id="originalMessage">
                                    Loading...
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="replyText" class="form-label fw-bold">Your Reply:</label>
                                <textarea class="form-control" id="replyText" rows="6"
                                        placeholder="Type your reply here..." required></textarea>
                                <div class="form-text">This reply will be sent to the customer via email.</div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i>Cancel
                            </button>
                            <button type="button" class="btn btn-primary" id="sendReplyBtn">
                                <i class="fas fa-paper-plane me-1"></i>Send Reply
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(replyModal);
        }

        // Update modal content
        document.getElementById('originalMessage').innerHTML = `
            <div class="mb-2">
                <strong>From:</strong> ${message.name} (${message.email})
            </div>
            <div class="mb-2">
                <strong>Subject:</strong> ${message.subject || 'No subject'}
            </div>
            <div>
                <strong>Message:</strong><br>
                ${(message.message || 'No message content').replace(/\n/g, '<br>')}
            </div>
        `;

        // Clear previous reply text
        document.getElementById('replyText').value = '';

        // Setup send reply button
        const sendReplyBtn = document.getElementById('sendReplyBtn');
        sendReplyBtn.replaceWith(sendReplyBtn.cloneNode(true));
        const newSendReplyBtn = document.getElementById('sendReplyBtn');

        newSendReplyBtn.addEventListener('click', () => {
            const replyText = document.getElementById('replyText').value.trim();
            if (!replyText) {
                this.showNotification('Please enter a reply message', 'warning');
                return;
            }

            this.sendReply(message._id, replyText);
            bootstrap.Modal.getInstance(replyModal).hide();
        });

        // Show modal
        const bootstrapModal = new bootstrap.Modal(replyModal);
        bootstrapModal.show();
    }

    async sendReply(messageId, reply) {
        try {
            console.log('💬 Sending reply to message:', messageId);

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`/api/contact/${messageId}/reply`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reply })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to send reply');
            }

            // Update local data
            const message = this.messages.find(m => m._id === messageId);
            if (message) {
                message.status = 'replied';
                message.reply = reply;
                message.repliedAt = new Date();
            }

            this.updateMessageStats();
            this.renderMessagesTable();
            this.showNotification('Reply sent successfully', 'success');

            console.log('✅ Reply sent successfully');
        } catch (error) {
            console.error('❌ Error sending reply:', error);
            this.showNotification('Error sending reply: ' + error.message, 'error');
        }
    }

    async deleteMessage(messageId) {
        const message = this.messages.find(m => m._id === messageId);
        if (!message) {
            this.showNotification('Message not found', 'error');
            return;
        }

        if (!confirm(`Are you sure you want to delete this message from ${message.name}?`)) {
            return;
        }

        try {
            console.log('🗑️ Deleting message:', messageId);

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`/api/contact/${messageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to delete message');
            }

            // Remove from local data
            this.messages = this.messages.filter(m => m._id !== messageId);
            this.filteredMessages = this.filteredMessages.filter(m => m._id !== messageId);

            this.updateMessageStats();
            this.renderMessagesTable();
            this.showNotification('Message deleted successfully', 'success');

            console.log('✅ Message deleted successfully');
        } catch (error) {
            console.error('❌ Error deleting message:', error);
            this.showNotification('Error deleting message: ' + error.message, 'error');
        }
    }

    async markAllAsRead() {
        const unreadMessages = this.messages.filter(m => m.status === 'new' || !m.isRead);

        if (unreadMessages.length === 0) {
            this.showNotification('No unread messages to mark as read', 'info');
            return;
        }

        if (!confirm(`Mark all ${unreadMessages.length} unread messages as read?`)) {
            return;
        }

        try {
            console.log(`📖 Marking ${unreadMessages.length} messages as read...`);

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Mark all unread messages as read
            const promises = unreadMessages.map(message =>
                fetch(`/api/contact/${message._id}/read`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }).then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to mark message ${message._id} as read`);
                    }
                    return response.json();
                })
            );

            await Promise.all(promises);

            // Update local data
            unreadMessages.forEach(message => {
                message.status = 'read';
                message.isRead = true;
            });

            this.updateMessageStats();
            this.renderMessagesTable();
            this.showNotification(`${unreadMessages.length} messages marked as read`, 'success');
        } catch (error) {
            console.error('Error marking all messages as read:', error);
            this.showNotification('Error marking messages as read: ' + error.message, 'error');
        }
    }

    async deleteSelectedMessages() {
        const checkboxes = document.querySelectorAll('.message-checkbox:checked');
        const selectedIds = Array.from(checkboxes).map(cb => cb.value);

        if (selectedIds.length === 0) {
            this.showNotification('No messages selected for deletion', 'warning');
            return;
        }

        if (!confirm(`Delete ${selectedIds.length} selected message(s)? This action cannot be undone.`)) {
            return;
        }

        try {
            console.log(`🗑️ Deleting ${selectedIds.length} selected messages...`);

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Delete selected messages
            const promises = selectedIds.map(id =>
                fetch(`/api/contact/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }).then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to delete message ${id}`);
                    }
                    return response.json();
                })
            );

            await Promise.all(promises);

            // Remove from local data
            this.messages = this.messages.filter(m => !selectedIds.includes(m._id));
            this.filteredMessages = this.filteredMessages.filter(m => !selectedIds.includes(m._id));

            this.updateMessageStats();
            this.renderMessagesTable();
            this.showNotification(`${selectedIds.length} message(s) deleted successfully`, 'success');
        } catch (error) {
            console.error('Error deleting selected messages:', error);
            this.showNotification('Error deleting messages: ' + error.message, 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Use the main notification system
        if (window.AdminManager && window.AdminManager.showNotification) {
            window.AdminManager.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Helper method to get status icon
    getStatusIcon(status) {
        const icons = {
            'new': '<i class="fas fa-circle text-warning" title="New"></i>',
            'read': '<i class="fas fa-check-circle text-info" title="Read"></i>',
            'replied': '<i class="fas fa-reply text-success" title="Replied"></i>',
            'archived': '<i class="fas fa-archive text-secondary" title="Archived"></i>'
        };
        return icons[status] || icons['new'];
    }

    // Helper method to calculate time ago
    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    // Build comprehensive message timeline for modal display
    buildMessageTimeline(message) {
        let timelineHTML = '';
        const events = [];

        // Collect all timeline events
        events.push({
            type: 'received',
            date: new Date(message.createdAt),
            icon: 'fas fa-envelope',
            color: 'warning',
            title: 'Message Received',
            description: `Customer ${message.name || 'Anonymous'} sent a new message`,
            details: `Subject: ${message.subject || 'No subject'}`
        });

        if (message.readAt) {
            events.push({
                type: 'read',
                date: new Date(message.readAt),
                icon: 'fas fa-eye',
                color: 'info',
                title: 'Message Read',
                description: 'Admin viewed the message',
                details: 'Status changed to "Read"'
            });
        }

        if (message.repliedAt) {
            events.push({
                type: 'replied',
                date: new Date(message.repliedAt),
                icon: 'fas fa-reply',
                color: 'success',
                title: 'Reply Sent',
                description: 'Admin replied to the customer',
                details: 'Status changed to "Replied"'
            });
        }

        // Sort events by date
        events.sort((a, b) => a.date - b.date);

        // Generate timeline HTML
        events.forEach((event, index) => {
            const isLast = index === events.length - 1;
            timelineHTML += `
                <div class="admin-timeline-item ${!isLast ? 'has-next' : ''}">
                    <div class="admin-timeline-content">
                        <div class="admin-timeline-icon admin-timeline-icon-${event.color}">
                            <i class="${event.icon}"></i>
                        </div>
                        <div class="admin-timeline-details">
                            <div class="admin-timeline-card">
                                <div class="admin-timeline-header">
                                    <h6 class="admin-timeline-title">${event.title}</h6>
                                    <span class="admin-timeline-badge admin-badge-${event.color}">${event.details}</span>
                                </div>
                                <p class="admin-timeline-description">${event.description}</p>
                                <div class="admin-timeline-timestamp">
                                    <i class="fas fa-clock"></i>
                                    <span>${event.date.toLocaleDateString()} at ${event.date.toLocaleTimeString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        // Add current status indicator
        const currentTime = new Date();
        const statusColor = message.status === 'new' ? 'warning' : message.status === 'read' ? 'info' : 'success';
        timelineHTML += `
            <div class="admin-timeline-item admin-timeline-current">
                <div class="admin-timeline-content">
                    <div class="admin-timeline-icon admin-timeline-icon-${statusColor} admin-timeline-icon-current">
                        <i class="fas fa-circle"></i>
                    </div>
                    <div class="admin-timeline-details">
                        <div class="admin-timeline-card admin-timeline-card-current">
                            <div class="admin-timeline-header">
                                <h6 class="admin-timeline-title admin-timeline-title-${statusColor}">Current Status</h6>
                                <span class="admin-timeline-badge admin-badge-${statusColor}">Active</span>
                            </div>
                            <p class="admin-timeline-description">Message is currently marked as "${message.status}"</p>
                            <div class="admin-timeline-timestamp">
                                <i class="fas fa-info-circle"></i>
                                <span>Last updated: ${currentTime.toLocaleDateString()} at ${currentTime.toLocaleTimeString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return timelineHTML;
    }

    // Add comprehensive custom styles for the modal
    addModalStyles() {
        if (document.getElementById('contactModalStyles')) return;

        const style = document.createElement('style');
        style.id = 'contactModalStyles';
        style.textContent = `
            /* 🎨 Admin Modal - Header Styles */
            .admin-modal-content {
                border: none;
                border-radius: var(--border-radius-lg, 16px);
                box-shadow: var(--shadow-2xl, 0 25px 50px -12px rgba(0, 0, 0, 0.25));
                overflow: hidden;
                background: var(--background-color, #ffffff);
            }

            .admin-modal-header {
                background: linear-gradient(135deg, var(--primary-color, #ff69b4), var(--secondary-color, #ff1493));
                color: var(--text-white, #ffffff);
                border: none;
                padding: var(--space-lg, 1.5rem) var(--space-xl, 2rem);
                position: relative;
            }

            .admin-modal-header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
                pointer-events: none;
            }

            .admin-modal-title {
                display: flex;
                align-items: center;
                gap: var(--space-lg, 1.5rem);
                font-weight: 600;
                font-size: 1.25rem;
                margin: 0;
                position: relative;
                z-index: 1;
            }

            .admin-modal-icon {
                width: 48px;
                height: 48px;
                background: rgba(255, 255, 255, 0.15);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.25rem;
                transition: var(--transition, all 0.3s ease);
            }

            .admin-modal-title-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: var(--space-xs, 0.25rem);
            }

            .admin-modal-title-main {
                font-size: 1.25rem;
                font-weight: 600;
                line-height: 1.2;
            }

            .admin-modal-status {
                font-size: 0.875rem;
                opacity: 0.9;
            }

            .admin-modal-close {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: var(--transition, all 0.3s ease);
                position: relative;
                z-index: 1;
            }

            .admin-modal-close:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: scale(1.05);
            }

            /* 🎨 Admin Modal - Footer Styles */
            .admin-modal-footer {
                background: var(--background-secondary, #f8fafc);
                border: none;
                padding: var(--space-lg, 1.5rem) var(--space-xl, 2rem);
                border-top: 1px solid var(--border-color, #e2e8f0);
            }

            .admin-modal-actions {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: var(--space-md, 1rem);
                width: 100%;
            }

            .admin-modal-actions-left,
            .admin-modal-actions-right {
                display: flex;
                gap: var(--space-sm, 0.5rem);
            }

            /* 🎨 Admin Buttons */
            .admin-btn {
                display: inline-flex;
                align-items: center;
                gap: var(--space-sm, 0.5rem);
                padding: var(--space-sm, 0.5rem) var(--space-md, 1rem);
                border-radius: var(--border-radius, 8px);
                font-weight: 500;
                font-size: 0.875rem;
                transition: var(--transition-bounce, all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55));
                border: 1px solid transparent;
                text-decoration: none;
                cursor: pointer;
                position: relative;
                overflow: hidden;
            }

            .admin-btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                transition: var(--transition, all 0.3s ease);
            }

            .admin-btn:hover::before {
                left: 100%;
            }

            .admin-btn:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
            }

            .admin-btn-primary {
                background: linear-gradient(135deg, var(--primary-color, #ff69b4), var(--secondary-color, #ff1493));
                color: var(--text-white, #ffffff);
                border-color: var(--primary-color, #ff69b4);
            }

            .admin-btn-secondary {
                background: var(--background-color, #ffffff);
                color: var(--text-color, #2c3e50);
                border-color: var(--border-medium, #cbd5e1);
            }

            .admin-btn-info {
                background: var(--info-light, #dbeafe);
                color: var(--info-color, #3b82f6);
                border-color: var(--info-color, #3b82f6);
            }

            .admin-btn-warning {
                background: var(--warning-light, #fef3c7);
                color: var(--warning-color, #f59e0b);
                border-color: var(--warning-color, #f59e0b);
            }

            .admin-btn-danger {
                background: var(--error-light, #fee2e2);
                color: var(--error-color, #ef4444);
                border-color: var(--error-color, #ef4444);
            }

            .admin-btn-text {
                font-weight: 500;
            }

            /* 🎨 Admin Modal - Content Area Styles */
            .admin-modal-header-section {
                background: var(--background-secondary, #f8fafc);
                border-bottom: 1px solid var(--border-color, #e2e8f0);
                padding: var(--space-xl, 2rem);
            }

            .admin-modal-sender-info {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: var(--space-lg, 1.5rem);
            }

            .admin-modal-sender-main {
                display: flex;
                align-items: center;
                gap: var(--space-lg, 1.5rem);
                flex: 1;
            }

            .admin-modal-avatar {
                width: 64px;
                height: 64px;
                border-radius: 50%;
                background: linear-gradient(135deg, var(--primary-color, #ff69b4), var(--secondary-color, #ff1493));
                color: var(--text-white, #ffffff);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
                flex-shrink: 0;
            }

            .admin-modal-sender-details {
                flex: 1;
            }

            .admin-modal-sender-name {
                font-size: 1.5rem;
                font-weight: 600;
                color: var(--text-color, #2c3e50);
                margin-bottom: var(--space-sm, 0.5rem);
                line-height: 1.2;
            }

            .admin-modal-sender-name.unread {
                color: var(--primary-color, #ff69b4);
                font-weight: 700;
            }

            .admin-modal-contact-info {
                display: flex;
                flex-direction: column;
                gap: var(--space-xs, 0.25rem);
            }

            .admin-modal-contact-item {
                display: flex;
                align-items: center;
                gap: var(--space-sm, 0.5rem);
                font-size: 0.875rem;
            }

            .admin-modal-contact-item i {
                width: 16px;
                color: var(--text-muted, #6c757d);
            }

            .admin-modal-contact-link {
                color: var(--text-color, #2c3e50);
                text-decoration: none;
                font-weight: 500;
                transition: var(--transition, all 0.3s ease);
            }

            .admin-modal-contact-link:hover {
                color: var(--primary-color, #ff69b4);
                text-decoration: underline;
            }

            .admin-modal-sender-meta {
                text-align: right;
                flex-shrink: 0;
            }

            .admin-modal-status-badge {
                margin-bottom: var(--space-sm, 0.5rem);
            }

            .admin-modal-timestamp {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                gap: var(--space-xs, 0.25rem);
                color: var(--text-muted, #6c757d);
                font-size: 0.875rem;
                margin-bottom: var(--space-xs, 0.25rem);
            }

            .admin-modal-time-ago {
                font-weight: 500;
            }

            .admin-modal-date-time {
                font-size: 0.75rem;
                color: var(--text-light, #8e9aaf);
                text-align: right;
            }

            /* 🎨 Admin Cards */
            .admin-modal-content-area {
                padding: var(--space-xl, 2rem);
                background: var(--background-color, #ffffff);
            }

            .admin-modal-layout {
                display: grid;
                grid-template-columns: 1fr 350px;
                gap: var(--space-xl, 2rem);
            }

            .admin-modal-main-content {
                display: flex;
                flex-direction: column;
                gap: var(--space-lg, 1.5rem);
            }

            .admin-modal-sidebar {
                display: flex;
                flex-direction: column;
                gap: var(--space-lg, 1.5rem);
            }

            .admin-card {
                background: var(--background-color, #ffffff);
                border: 1px solid var(--border-color, #e2e8f0);
                border-radius: var(--border-radius-md, 12px);
                box-shadow: var(--shadow-sm, 0 1px 3px 0 rgba(0, 0, 0, 0.1));
                overflow: hidden;
                transition: var(--transition, all 0.3s ease);
            }

            .admin-card:hover {
                box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
                transform: translateY(-2px);
            }

            .admin-card-header {
                background: var(--background-secondary, #f8fafc);
                border-bottom: 1px solid var(--border-color, #e2e8f0);
                padding: var(--space-lg, 1.5rem);
            }

            .admin-card-header-success {
                background: linear-gradient(135deg, var(--success-color, #10b981), rgba(16, 185, 129, 0.8));
                color: var(--text-white, #ffffff);
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            }

            .admin-card-title {
                display: flex;
                align-items: center;
                gap: var(--space-sm, 0.5rem);
                font-size: 1.125rem;
                font-weight: 600;
                color: var(--text-color, #2c3e50);
                margin: 0;
            }

            .admin-card-header-success .admin-card-title {
                color: var(--text-white, #ffffff);
            }

            .admin-card-title i {
                font-size: 1rem;
                color: var(--primary-color, #ff69b4);
            }

            .admin-card-header-success .admin-card-title i {
                color: var(--text-white, #ffffff);
            }

            .admin-card-body {
                padding: var(--space-lg, 1.5rem);
            }

            .admin-field-group {
                margin-bottom: var(--space-lg, 1.5rem);
            }

            .admin-field-group:last-child {
                margin-bottom: 0;
            }

            .admin-field-label {
                display: block;
                font-size: 0.875rem;
                font-weight: 600;
                color: var(--text-muted, #6c757d);
                margin-bottom: var(--space-sm, 0.5rem);
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .admin-field-value {
                font-size: 1rem;
                color: var(--text-color, #2c3e50);
                line-height: 1.5;
            }

            .admin-subject {
                font-size: 1.125rem;
                font-weight: 600;
                color: var(--text-color, #2c3e50);
            }

            .admin-subject.unread {
                color: var(--primary-color, #ff69b4);
                font-weight: 700;
            }

            .admin-message-content {
                background: var(--background-secondary, #f8fafc);
                border: 1px solid var(--border-color, #e2e8f0);
                border-radius: var(--border-radius, 8px);
                padding: var(--space-lg, 1.5rem);
                position: relative;
                overflow: hidden;
            }

            .admin-message-content.unread {
                border-color: var(--primary-color, #ff69b4);
                border-width: 2px;
                background: linear-gradient(135deg, rgba(255, 105, 180, 0.05), rgba(255, 105, 180, 0.02));
            }

            .admin-message-content.unread::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 4px;
                height: 100%;
                background: var(--primary-color, #ff69b4);
            }

            .admin-message-text {
                font-size: 1rem;
                line-height: 1.7;
                color: var(--text-color, #2c3e50);
                max-height: 300px;
                overflow-y: auto;
                word-wrap: break-word;
                position: relative;
                z-index: 1;
            }

            /* 🎨 Responsive Design */
            @media (max-width: 1200px) {
                .admin-modal-layout {
                    grid-template-columns: 1fr 300px;
                    gap: var(--space-lg, 1.5rem);
                }
            }

            @media (max-width: 992px) {
                .admin-modal-layout {
                    grid-template-columns: 1fr;
                    gap: var(--space-lg, 1.5rem);
                }

                .admin-modal-sender-info {
                    flex-direction: column;
                    gap: var(--space-lg, 1.5rem);
                }

                .admin-modal-sender-meta {
                    text-align: left;
                }

                .admin-modal-timestamp {
                    justify-content: flex-start;
                }

                .admin-modal-date-time {
                    text-align: left;
                }
            }

            @media (max-width: 768px) {
                .admin-modal-content-area {
                    padding: var(--space-lg, 1.5rem);
                }

                .admin-modal-header-section {
                    padding: var(--space-lg, 1.5rem);
                }

                .admin-modal-header {
                    padding: var(--space-md, 1rem) var(--space-lg, 1.5rem);
                }

                .admin-modal-footer {
                    padding: var(--space-md, 1rem) var(--space-lg, 1.5rem);
                }

                .admin-modal-actions {
                    flex-direction: column;
                    gap: var(--space-sm, 0.5rem);
                }

                .admin-modal-actions-left,
                .admin-modal-actions-right {
                    width: 100%;
                    justify-content: center;
                }

                .admin-btn-text {
                    display: none;
                }

                .admin-modal-avatar {
                    width: 48px;
                    height: 48px;
                    font-size: 1.25rem;
                }

                .admin-modal-sender-name {
                    font-size: 1.25rem;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Export for use in other modules
window.ContactManagement = ContactManagement;
