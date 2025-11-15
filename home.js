document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.start-button');

    buttons.forEach(button => {
        button.addEventListener('click', handleButtonClick);
    });
});

function handleButtonClick() {
    const button = this;

    // Prevent double clicks
    button.removeEventListener('click', handleButtonClick);

    // Get URL and delay from button data attributes
    const url = button.dataset.url || 'auth.html';
    const delay = parseInt(button.dataset.delay, 10) || 800;

    // Show loading and fade out
    showLoading(button);

    // Redirect after delay
    redirectAfterDelay(url, delay);
}

function showLoading(button) {
    button.textContent = 'Loading game...';
    button.disabled = true;
    button.style.cursor = 'not-allowed';
    
    // Add fade-out animation
    button.classList.add('fade-out');
}

function redirectAfterDelay(url, delay) {
    setTimeout(() => {
        window.location.href = url;
    }, delay);
}
