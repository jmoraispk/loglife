// Make GitHub repository link open in new tab
document.addEventListener('DOMContentLoaded', function() {
    // Find the GitHub link in the header
    const githubLink = document.querySelector('.md-header a[href*="github.com"]');
    if (githubLink) {
        githubLink.setAttribute('target', '_blank');
        githubLink.setAttribute('rel', 'noopener noreferrer');
    }
});

