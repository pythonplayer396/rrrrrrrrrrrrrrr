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

    // Add hover effects for message groups
    const messageGroups = document.querySelectorAll('.message-group');
    messageGroups.forEach(group => {
        group.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'var(--discord-hover)';
        });
        
        group.addEventListener('mouseleave', function() {
            if (!this.classList.contains('system-message')) {
                this.style.backgroundColor = 'transparent';
            }
        });
    });

    // Add tooltip functionality for timestamps
    const timestamps = document.querySelectorAll('.message-timestamp');
    timestamps.forEach(timestamp => {
        timestamp.addEventListener('click', function() {
            // Copy timestamp to clipboard
            const text = this.getAttribute('title') || this.textContent;
            navigator.clipboard.writeText(text).then(() => {
                // Show brief feedback
                const originalText = this.textContent;
                this.textContent = 'Copied!';
                setTimeout(() => {
                    this.textContent = originalText;
                }, 1000);
            }).catch(err => {
                console.log('Could not copy timestamp:', err);
            });
        });
    });

    // Add smooth scrolling to page
    document.documentElement.style.scrollBehavior = 'smooth';

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + F for search (browser default)
        // Home key to scroll to top
        if (e.key === 'Home') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        // End key to scroll to bottom
        if (e.key === 'End') {
            e.preventDefault();
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
    });

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
