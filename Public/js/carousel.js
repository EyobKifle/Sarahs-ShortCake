const items = document.querySelectorAll('.carousel-item');
let currentIndex = 0;

function showSlide(index) {
  items.forEach(item => item.classList.remove('active'));
  items[index].classList.add('active');
}

document.querySelector('.next').addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % items.length;
  showSlide(currentIndex);
});

document.querySelector('.prev').addEventListener('click', () => {
  currentIndex = (currentIndex - 1 + items.length) % items.length;
  showSlide(currentIndex);
});
