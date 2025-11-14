// Discord Transcript Viewer JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Format file sizes for attachments
    window.formatFileSize = function(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Add click handlers for images
    const images = document.querySelectorAll('.attachment-image, .embed-image');
    images.forEach(img => {
        img.addEventListener('click', function() {
            window.open(this.src, '_blank');
        });
        img.style.cursor = 'pointer';
    });

    // Enhanced timestamp interactions
    const timestamps = document.querySelectorAll('.message-timestamp');
    timestamps.forEach(timestamp => {
        timestamp.addEventListener('click', function() {
            // Copy timestamp to clipboard
            const text = this.getAttribute('title') || this.textContent;
            navigator.clipboard.writeText(text).then(() => {
                showToast('Timestamp copied to clipboard!');
            });
        });
    });

    // Message hover effects
    const messageGroups = document.querySelectorAll('.message-group');
    messageGroups.forEach(group => {
        group.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'rgba(4, 4, 5, 0.07)';
        });
        
        group.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
    });

    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Enhanced keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        switch(e.key) {
            case 'Escape':
                closeAllModals();
                break;
            case 'Home':
                if (e.ctrlKey) {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
                break;
            case 'End':
                if (e.ctrlKey) {
                    e.preventDefault();
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }
                break;
        }
    });

    // Copy message content on double-click
    const messageContents = document.querySelectorAll('.message-content');
    messageContents.forEach(content => {
        content.addEventListener('dblclick', function() {
            const text = this.textContent;
            navigator.clipboard.writeText(text).then(() => {
                showToast('Message copied to clipboard!');
            });
        });
    });

    // Lazy loading for images
    const lazyImages = document.querySelectorAll('img[data-src]');
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    }

    // Initialize animations
    initializeAnimations();

    // Add loading states for images
    const allImages = document.querySelectorAll('img');
    allImages.forEach(img => {
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
        
        img.addEventListener('error', function() {
            this.style.opacity = '0.5';
            this.title = 'Failed to load image';
        });
        
        // Start with slight transparency
        img.style.opacity = '0.8';
        img.style.transition = 'opacity 0.2s ease';
    });

    // Add context menu prevention for transcript integrity
    document.addEventListener('contextmenu', function(e) {
        // Allow context menu on links and images for "open in new tab" etc.
        if (e.target.tagName === 'A' || e.target.tagName === 'IMG') {
            return true;
        }
        // Prevent on other elements to maintain transcript integrity
        e.preventDefault();
        return false;
    });

    // Add print styles optimization
    if (window.matchMedia) {
        const mediaQuery = window.matchMedia('print');
        mediaQuery.addListener(function(mq) {
            if (mq.matches) {
                // Optimize for printing
                document.body.style.fontSize = '12px';
                document.body.style.lineHeight = '1.2';
            }
        });
    }

    console.log('🎫 Discord Transcript Viewer loaded successfully');
});
