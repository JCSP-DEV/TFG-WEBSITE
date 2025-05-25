// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add scroll event listener for header
const header = document.querySelector('header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
        header.classList.remove('scroll-up');
        return;
    }
    
    if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
        // Scroll Down
        header.classList.remove('scroll-up');
        header.classList.add('scroll-down');
    } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
        // Scroll Up
        header.classList.remove('scroll-down');
        header.classList.add('scroll-up');
    }
    lastScroll = currentScroll;
});

document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu a');

    // Toggle menu
    menuToggle.addEventListener('click', function() {
        menuToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!navMenu.contains(event.target) && !menuToggle.contains(event.target)) {
            menuToggle.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });

    // Language selector functionality
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        const originalTexts = new Map();
        const originalIcons = new Map();

        // Store original texts and icons
        document.querySelectorAll('h1, h2, h3, h4, p, li, span, button, a.cta-button, a.download-button').forEach(element => {
            // Skip elements that contain pre, code, or a tags (except cta/download buttons)
            if (!element.querySelector('pre') && !element.querySelector('code') && !element.querySelector('a') && element.textContent.trim()) {
                originalTexts.set(element, element.textContent);
                
                // Store icons if present
                const icons = element.querySelectorAll('i.fas');
                if (icons.length > 0) {
                    originalIcons.set(element, Array.from(icons).map(icon => icon.outerHTML));
                }
            }
        });

        // Function to show notification
        function showNotification(message, isError = false) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${isError ? '#f44336' : '#4CAF50'};
                color: white;
                padding: 15px 25px;
                border-radius: 4px;
                z-index: 1000;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                font-size: 14px;
                max-width: 300px;
                text-align: center;
            `;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transition = 'opacity 0.5s ease';
                setTimeout(() => notification.remove(), 500);
            }, 5000);
        }

        // Function to translate text
        async function translateText(text, targetLang) {
            if (targetLang === 'en') return text;
            
            try {
                const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`);
                const data = await response.json();
                
                // Check for API limit error
                if (data.responseStatus === 403 || data.responseStatus === 429) {
                    console.warn('Translation API limit reached');
                    throw new Error('Translation service is temporarily unavailable');
                }
                
                return data.responseData.translatedText;
            } catch (error) {
                console.error('Translation error:', error);
                throw error;
            }
        }

        // Handle language change
        languageSelect.addEventListener('change', async function() {
            const targetLang = this.value;
            const elements = Array.from(originalTexts.keys());
            
            // Show loading state
            elements.forEach(element => {
                element.style.opacity = '0.5';
            });

            showNotification('Translating content...');

            try {
                // Translate all elements in parallel
                const translations = await Promise.all(
                    elements.map(async (element) => {
                        const originalText = originalTexts.get(element);
                        const translatedText = targetLang === 'en' ? 
                            originalText : 
                            await translateText(originalText, targetLang);
                        return { element, translatedText };
                    })
                );

                // Apply translations and restore icons
                translations.forEach(({ element, translatedText }) => {
                    element.textContent = translatedText;
                    
                    // Restore icons if they existed
                    if (originalIcons.has(element)) {
                        const icons = originalIcons.get(element);
                        icons.forEach(icon => {
                            element.insertAdjacentHTML('afterbegin', icon);
                        });
                    }
                    
                    element.style.opacity = '1';
                });

                showNotification('Translation complete');
            } catch (error) {
                console.error('Translation failed:', error);
                
                // Show error notification
                if (error.message === 'Translation service is temporarily unavailable') {
                    showNotification('Translation service is temporarily unavailable. Please try again later.', true);
                } else {
                    showNotification('Failed to translate content. Please try again.', true);
                }
                
                // Restore original text and icons
                elements.forEach(element => {
                    element.textContent = originalTexts.get(element);
                    
                    // Restore icons if they existed
                    if (originalIcons.has(element)) {
                        const icons = originalIcons.get(element);
                        icons.forEach(icon => {
                            element.insertAdjacentHTML('afterbegin', icon);
                        });
                    }
                    
                    element.style.opacity = '1';
                });

                // Reset language selector to English
                languageSelect.value = 'en';
            }
        });
    }
}); 