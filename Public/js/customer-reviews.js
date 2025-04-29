// JavaScript for customer-reviews.html to fetch and display reviews dynamically

document.addEventListener('DOMContentLoaded', () => {
    // Fetch reviews from backend API
    fetch('/api/reviews')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch reviews');
            }
            return response.json();
        })
        .then(reviews => {
            const list = document.getElementById('reviewList');
            list.innerHTML = '';
            
            if (reviews.length === 0) {
                list.innerHTML = `
                    <div class="empty-state">
                        <i class="far fa-star"></i>
                        <h3>No Reviews Yet</h3>
                        <p>You haven't reviewed any products yet. Share your thoughts to help others!</p>
                        <button class="btn btn-primary" id="writeFirstReviewBtn">
                            <i class="fas fa-plus"></i> Write Your First Review
                        </button>
                    </div>
                `;
            } else {
                reviews.forEach((review, index) => {
                    const li = document.createElement('li');
                    li.className = 'review-item animate-fade';
                    li.style.animationDelay = `${index * 0.1}s`;
                    
                    // Generate star rating
                    const stars = [];
                    for (let i = 1; i <= 5; i++) {
                        stars.push(
                            `<i class="fas fa-star ${i <= review.rating ? 'filled' : 'empty'}"></i>`
                        );
                    }
                    
                    li.innerHTML = `
                        <div class="review-header">
                            <div class="review-product">
                                <img src="${review.productImage}" alt="${review.productName}" class="review-product-img">
                                <div class="review-product-info">
                                    <h3>${review.productName}</h3>
                                    <p>Order #${review.orderId}</p>
                                </div>
                            </div>
                            <div class="review-rating">
                                ${stars.join('')}
                            </div>
                        </div>
                        <div class="review-content">
                            <p>${review.comment}</p>
                        </div>
                        <div class="review-footer">
                            <span class="review-date">Reviewed on ${new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            <div class="review-actions">
                                <button type="button" title="Edit review" data-id="${review.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button type="button" title="Delete review" data-id="${review.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                    list.appendChild(li);
                });
            }
        })
        .catch(error => {
            console.error('Error loading reviews:', error);
            const list = document.getElementById('reviewList');
            list.innerHTML = '<p>Error loading reviews. Please try again later.</p>';
        });
    
    // Event delegation for buttons
    document.addEventListener('click', (e) => {
        if (e.target.closest('#writeReviewBtn') || e.target.closest('#writeFirstReviewBtn')) {
            alert('Review form would open here in a real implementation');
        }
        
        if (e.target.closest('.review-actions button[title="Edit review"]')) {
            const reviewId = e.target.closest('button').dataset.id;
            alert(`Would edit review with ID: ${reviewId}`);
        }
        
        if (e.target.closest('.review-actions button[title="Delete review"]')) {
            const reviewId = e.target.closest('button').dataset.id;
            if (confirm('Are you sure you want to delete this review?')) {
                // Call API to delete review
                fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Failed to delete review');
                        }
                        // Remove review from DOM
                        const reviewItem = e.target.closest('.review-item');
                        reviewItem.classList.add('animate__animated', 'animate__fadeOut');
                        setTimeout(() => {
                            reviewItem.remove();
                        }, 300);
                    })
                    .catch(error => {
                        alert('Failed to delete review. Please try again.');
                        console.error('Delete review error:', error);
                    });
            }
        }
    });
});
