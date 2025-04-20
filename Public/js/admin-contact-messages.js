document.addEventListener('DOMContentLoaded', async () => {
    const messagesTableBody = document.querySelector('#messagesTable tbody');
    const noMessagesDiv = document.getElementById('noMessages');

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('You must be logged in as admin to view this page.');
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch('/api/contact', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch contact messages');
        }

        const data = await response.json();

        if (data.data.length === 0) {
            noMessagesDiv.style.display = 'block';
            messagesTableBody.innerHTML = '';
            return;
        }

        noMessagesDiv.style.display = 'none';

        data.data.forEach(message => {
            const tr = document.createElement('tr');

            const nameTd = document.createElement('td');
            nameTd.textContent = message.name;
            tr.appendChild(nameTd);

            const emailTd = document.createElement('td');
            emailTd.textContent = message.email;
            tr.appendChild(emailTd);

            const subjectTd = document.createElement('td');
            subjectTd.textContent = message.subject;
            tr.appendChild(subjectTd);

            const messageTd = document.createElement('td');
            messageTd.textContent = message.message;
            tr.appendChild(messageTd);

            const dateTd = document.createElement('td');
            const date = new Date(message.createdAt);
            dateTd.textContent = date.toLocaleString();
            tr.appendChild(dateTd);

            messagesTableBody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading contact messages:', error);
        alert('Error loading contact messages. Please try again later.');
    }
});
