document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.querySelector('.start-button');
    
    if (startButton) {
        startButton.addEventListener('click', () => {
            // Show loading message
            startButton.textContent = 'Loading game...';
            startButton.disabled = true;
            startButton.style.cursor = 'not-allowed';
            startButton.style.opacity = '0.7';
            
            // Redirect to the authentication page after a brief delay
            setTimeout(() => {
                window.location.href = 'auth.html';
            }, 800);
        });
    }
});