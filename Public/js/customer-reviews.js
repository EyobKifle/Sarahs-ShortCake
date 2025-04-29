document.addEventListener('DOMContentLoaded', () => {
    const reviewList = document.getElementById('reviewList');
    const writeReviewBtn = document.querySelector('.btn-primary');

    function renderReviews(reviews) {
        reviewList.innerHTML = '';
        if (reviews.length === 0) {
            reviewList.innerHTML = `
                <div class="empty-state">
                    <i class="far fa-star"></i>
                    <h3>No Reviews Yet</h3>
                    <p>You haven't reviewed any products yet. Share your thoughts to help others!</p>
                    <button class="btn btn-primary">
                        <i class="fas fa-plus"></i> Write Your First Review
                    </button>
                </div>
            `;
            return;
        }

        reviews.forEach((review, index) => {
            const li = document.createElement('li');
            li.className = 'review-item animate-fade';
            li.style.animationDelay = `${index * 0.1}s`;

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
                            <p>Order #${review.productId}</p>
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
                        <button type="button" title="Edit review">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" title="Delete review">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            reviewList.appendChild(li);
        });
    }

    function loadReviews() {
        setTimeout(() => {
            const mockReviews = [
                {
                    id: 1,
                    productId: 101,
                    productName: "Red Velvet Cake",
                    productImage: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                    rating: 5,
                    comment: "Absolutely delicious! The cream cheese frosting was perfect and the cake was so moist. Will definitely order again for my next party!",
                    createdAt: "2023-06-15T10:30:00Z"
                },
                {
                    id: 2,
                    productId: 102,
                    productName: "Chocolate Fudge Brownie",
                    productImage: "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                    rating: 4,
                    comment: "Very rich and chocolatey. The brownie was a bit too dense for my taste but my kids loved it.",
                    createdAt: "2023-05-22T14:15:00Z"
                },
                {
                    id: 3,
                    productId: 103,
                    productName: "Lemon Drizzle Cake",
                    productImage: "https://images.unsplash.com/photo-1607472586893-edb37bdc0e39?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                    rating: 3,
                    comment: "Good flavor but a bit dry. Could use more lemon drizzle on top.",
                    createdAt: "2023-04-10T09:45:00Z"
                },
                {
                    id: 4,
                    productId: 104,
                    productName: "Carrot Cake",
                    productImage: "https://images.unsplash.com/photo-1533050487297-09b450131914?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                    rating: 5,
                    comment: "The best carrot cake I've ever had! Perfect balance of spices and the walnuts add a great crunch.",
                    createdAt: "2023-03-18T16:20:00Z"
                }
            ];
            renderReviews(mockReviews);
        }, 1000);
    }

    loadReviews();

    document.addEventListener('click', (e) => {
        if (e.target.closest('.btn-primary')) {
            alert('Review form would open here in a real implementation');
        }

        if (e.target.closest('.review-actions button[title="Edit review"]')) {
            const reviewItem = e.target.closest('.review-item');
            alert(`Would edit review for: ${reviewItem.querySelector('h3').textContent}`);
        }

        if (e.target.closest('.review-actions button[title="Delete review"]')) {
            if (confirm('Are you sure you want to delete this review?')) {
                const reviewItem = e.target.closest('.review-item');
                reviewItem.classList.add('animate__animated', 'animate__fadeOut');
                setTimeout(() => {
                    reviewItem.remove();
                }, 300);
            }
        }
    });
});
