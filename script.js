// ==================== ENHANCED FIREBASE CONFIGURATION ====================
class FirebaseManager {
    constructor() {
        this.config = {
            apiKey: "AIzaSyBew9lr3hj8dVJj_T7qpdvNWvATJeder5tjU",
            authDomain: "iprincesshes3.firebaseapp.com",
            projectId: "iprincesses3",
            storageBucket: "iprinchesses3.firebasestorage.app",
            messagingSenderId: "215534469686",
            appId: "1:215534469686:web:7ayb0d356105efeb015ce97",
            measurementId: "G-RZQKyK5QKHF"
        };
        
        this.init();
    }

    init() {
        try {
            // Check if Firebase is already initialized
            if (!firebase.apps.length) {
                firebase.initializeApp(this.config);
            }
            
            this.db = firebase.firestore();
            this.storage = firebase.storage();
            this.auth = firebase.auth();
            
            // Enable offline persistence
            this.db.enablePersistence()
                .catch(err => {
                    console.warn('Offline persistence not supported:', err);
                });
                
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            this.fallbackToLocalStorage();
        }
    }

    fallbackToLocalStorage() {
        console.warn('Using localStorage fallback');
        this.db = null;
        this.storage = null;
        this.auth = null;
    }

    // Collections with error handling
    get princessesCollection() {
        if (!this.db) {
            return {
                where: () => ({
                    get: () => Promise.resolve({ forEach: () => {} })
                })
            };
        }
        return this.db.collection('princesses');
    }
}

// ==================== APPLICATION CORE ====================
class iPrincessesApp {
    constructor() {
        this.firebase = new FirebaseManager();
        this.users = JSON.parse(localStorage.getItem('iprincesses_users')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('iprincesses_current_user')) || null;
        this.princesses = [];
        this.verificationTimer = null;
        this.countdownTime = 60;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialData();
        this.updateAuthUI();
    }

    // ==================== DATA MANAGEMENT ====================
    async loadInitialData() {
        await this.loadPrincesses();
        this.setupCodeInputs();
    }

    async loadPrincesses() {
        try {
            // Try Firebase first
            const snapshot = await this.firebase.princessesCollection
                .where('status', 'in', ['available', 'unavailable'])
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();
            
            const princesses = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                princesses.push({ 
                    id: doc.id, 
                    ...data,
                    // Ensure required fields with defaults
                    services: data.services || [],
                    status: data.status || 'unavailable',
                    shy: data.shy !== undefined ? data.shy : true
                });
            });

            if (princesses.length > 0) {
                this.princesses = princesses;
                this.renderPrincesses(princesses);
                return;
            }
        } catch (error) {
            console.warn('Firebase load failed, using fallback data:', error);
        }

        // Fallback to local data
        this.loadFallbackPrincesses();
    }

    loadFallbackPrincesses() {
        const fallbackPrincesses = [
            {
                id: 1,
                name: "Sophia",
                age: 24,
                location: "Kampala",
                services: ["Dinner Dates", "Travel Companion", "Events"],
                remark: "Elegant and charming with a passion for art and travel",
                phone: "+256703055329",
                daysLeft: 5,
                status: "available",
                image: "images/uri.jpg",
                shy: false,
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                name: "Isabella",
                age: 22,
                location: "Entebbe",
                services: ["Weekend Getaways", "Social Events", "Business Dinners"],
                remark: "Adventurous soul with a love for nature and photography",
                phone: "+256703055329",
                daysLeft: 0,
                status: "expired",
                image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
                shy: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                name: "Grace",
                age: 25,
                location: "Busega",
                services: ["Massage", "Laz B", "Bj"],
                remark: "Squirted and moaner",
                phone: "+256757209118",
                daysLeft: 11,
                status: "available",
                image: "images/grace.jpg",
                shy: false,
                createdAt: new Date().toISOString()
            }
        ];

        this.princesses = fallbackPrincesses;
        this.renderPrincesses(fallbackPrincesses);
    }

    // ==================== AUTHENTICATION SYSTEM ====================
    generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async sendVerificationCode(phoneNumber, code) {
        try {
            // In a real app, this would call your backend SMS service
            console.log(`SMS sent to ${phoneNumber}: Your iPrincesses verification code is ${code}`);
            
            // Store for verification (in production, use secure server-side storage)
            localStorage.setItem('last_verification_code', code);
            localStorage.setItem('last_verification_phone', phoneNumber);
            localStorage.setItem('last_verification_time', Date.now().toString());
            
            return { success: true, message: 'Verification code sent successfully' };
        } catch (error) {
            console.error('Failed to send verification code:', error);
            return { success: false, message: 'Failed to send verification code' };
        }
    }

    startVerificationCountdown() {
        const countdownElement = document.getElementById('countdown');
        const resendLink = document.getElementById('resend-code');
        this.countdownTime = 60;
        
        resendLink.style.pointerEvents = 'none';
        resendLink.style.opacity = '0.5';
        
        this.verificationTimer = setInterval(() => {
            this.countdownTime--;
            countdownElement.textContent = `(${this.countdownTime}s)`;
            
            if (this.countdownTime <= 0) {
                this.clearVerificationTimer();
                resendLink.style.pointerEvents = 'auto';
                resendLink.style.opacity = '1';
                countdownElement.textContent = '';
            }
        }, 1000);
    }

    clearVerificationTimer() {
        if (this.verificationTimer) {
            clearInterval(this.verificationTimer);
            this.verificationTimer = null;
        }
    }

    validatePhoneNumber(phone) {
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        return phoneRegex.test(phone);
    }

    validatePassword(password) {
        return password.length >= 6;
    }

    // ==================== USER INTERFACE METHODS ====================
    updateAuthUI() {
        const authButtons = document.getElementById('auth-buttons');
        const userInfo = document.getElementById('user-info');
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        
        if (this.currentUser) {
            authButtons.style.display = 'none';
            userInfo.style.display = 'flex';
            userAvatar.textContent = this.currentUser.name.charAt(0).toUpperCase();
            userName.textContent = this.currentUser.name;
        } else {
            authButtons.style.display = 'flex';
            userInfo.style.display = 'none';
        }
    }

    showSuccessMessage(message) {
        const successMessage = document.getElementById('success-message');
        successMessage.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        successMessage.style.display = 'block';
        
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    }

    showErrorMessage(message) {
        const successMessage = document.getElementById('success-message');
        successMessage.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        successMessage.style.background = 'var(--danger)';
        successMessage.style.display = 'block';
        
        setTimeout(() => {
            successMessage.style.display = 'none';
            successMessage.style.background = 'var(--success)';
        }, 3000);
    }

    // ==================== PRINCESS CARDS MANAGEMENT ====================
    createPrincessCard(princess) {
        const timeColor = princess.daysLeft <= 3 ? 'var(--danger)' : 'var(--warning)';
        let statusClass, statusText;
        
        switch(princess.status) {
            case "available":
                statusClass = "status-available";
                statusText = "Available";
                break;
            case "expired":
                statusClass = "status-expired";
                statusText = "Expired";
                break;
            case "unavailable":
                statusClass = "status-unavailable";
                statusText = "Unavailable";
                break;
            default:
                statusClass = "status-unavailable";
                statusText = "Unknown";
        }
        
        const displayPhone = princess.phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
        const servicesHTML = princess.services.map(service => 
            `<span class="service-tag">${service}</span>`
        ).join('');
        
        // Safe image handling with fallback
        const safeImage = princess.image || 'https://via.placeholder.com/300x400/667eea/ffffff?text=iPrincess';
        
        return `
            <div class="princess-card" data-status="${princess.status}" data-id="${princess.id}">
                <div class="princess-status ${statusClass}">${statusText}</div>
                <div class="princess-img-container">
                    <img src="${safeImage}" alt="${princess.name}" class="princess-img" loading="lazy" onerror="this.src='https://via.placeholder.com/300x400/667eea/ffffff?text=iPrincess'">
                    ${princess.shy ? `
                        <div class="face-cover">
                            <div class="face-cover-logo">iP</div>
                        </div>
                    ` : ''}
                </div>
                <div class="princess-info">
                    <div class="princess-name">
                        ${this.escapeHtml(princess.name)}
                        <span class="princess-age">${princess.age}</span>
                    </div>
                    <div class="princess-location">
                        <i class="fas fa-map-marker-alt"></i> ${this.escapeHtml(princess.location)}
                    </div>
                    <p class="princess-remark">${this.escapeHtml(princess.remark)}</p>
                    <div class="princess-services">
                        <div class="services-title">Services:</div>
                        <div class="services-list">
                            ${servicesHTML}
                        </div>
                    </div>
                    <div class="princess-contact">
                        ${princess.status === "available" ? 
                            `<div class="princess-phone">
                                <i class="fas fa-phone"></i> ${displayPhone}
                                <div class="contact-options">
                                    <a href="https://wa.me/${princess.phone.replace('+', '')}" class="contact-option whatsapp" target="_blank" rel="noopener">
                                        <i class="fab fa-whatsapp"></i> WhatsApp
                                    </a>
                                    <a href="tel:${princess.phone}" class="contact-option call">
                                        <i class="fas fa-phone"></i> Call Now
                                    </a>
                                </div>
                            </div>` : 
                            `<span class="princess-phone" style="color: var(--danger)">Not Available</span>`
                        }
                        ${princess.status !== "expired" ? 
                            `<span class="princess-time" style="color: ${timeColor}">${princess.daysLeft} days left</span>` : 
                            `<span class="princess-time" style="color: var(--danger)">Expired</span>`
                        }
                    </div>
                </div>
            </div>
        `;
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    renderPrincesses(princessesToRender) {
        const princessesContainer = document.getElementById('princesses-container');
        
        if (!princessesContainer) {
            console.error('Princesses container not found');
            return;
        }
        
        princessesContainer.innerHTML = '';
        
        if (princessesToRender.length === 0) {
            princessesContainer.innerHTML = `
                <div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                    <h3>No princesses found</h3>
                    <p>Try adjusting your search criteria or filters</p>
                </div>
            `;
            return;
        }
        
        const fragment = document.createDocumentFragment();
        
        princessesToRender.forEach(princess => {
            const cardElement = document.createElement('div');
            cardElement.innerHTML = this.createPrincessCard(princess);
            fragment.appendChild(cardElement.firstElementChild);
        });
        
        princessesContainer.appendChild(fragment);
    }

    // ==================== SEARCH AND FILTER ====================
    filterPrincesses(filter) {
        if (filter === 'all') {
            this.renderPrincesses(this.princesses);
            return;
        }
        
        const filteredPrincesses = this.princesses.filter(princess => princess.status === filter);
        this.renderPrincesses(filteredPrincesses);
    }

    searchPrincesses(query) {
        const searchResults = document.getElementById('search-results');
        
        if (!searchResults) return;
        
        if (query.length < 2) {
            searchResults.style.display = 'none';
            return;
        }
        
        const filteredPrincesses = this.princesses.filter(princess => 
            princess.name.toLowerCase().includes(query.toLowerCase()) ||
            princess.remark.toLowerCase().includes(query.toLowerCase()) ||
            princess.location.toLowerCase().includes(query.toLowerCase()) ||
            princess.services.some(service => 
                service.toLowerCase().includes(query.toLowerCase())
            )
        );
        
        searchResults.innerHTML = '';
        
        if (filteredPrincesses.length === 0) {
            searchResults.innerHTML = '<div class="no-results">No princesses found with that name or description.</div>';
        } else {
            filteredPrincesses.forEach(princess => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.innerHTML = `
                    <img src="${princess.image}" alt="${princess.name}" class="search-result-img" loading="lazy">
                    <div class="search-result-info">
                        <h4>${this.escapeHtml(princess.name)} (${princess.age}) - ${this.escapeHtml(princess.location)}</h4>
                        <p>${this.escapeHtml(princess.remark)}</p>
                        <p><strong>Services:</strong> ${this.escapeHtml(princess.services.join(', '))}</p>
                        <p><strong>Status:</strong> ${princess.status === 'available' ? 'Available' : princess.status === 'expired' ? 'Expired' : 'Unavailable'}</p>
                    </div>
                `;
                resultItem.addEventListener('click', () => {
                    this.renderPrincesses([princess]);
                    searchResults.style.display = 'none';
                    const searchInput = document.getElementById('search-input');
                    if (searchInput) searchInput.value = princess.name;
                    
                    const princessesSection = document.getElementById('princesses');
                    if (princessesSection) {
                        princessesSection.scrollIntoView({ behavior: 'smooth' });
                    }
                });
                searchResults.appendChild(resultItem);
            });
        }
        
        searchResults.style.display = 'block';
    }

    // ==================== EVENT HANDLERS SETUP ====================
    setupEventListeners() {
        this.setupMobileMenu();
        this.setupModals();
        this.setupAuthentication();
        this.setupSearch();
        this.setupFilters();
    }

    setupMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const menuOverlay = document.getElementById('menu-overlay');
        const menuClose = document.getElementById('menu-close');
        const menuLinks = document.querySelectorAll('.menu-link');
        
        if (!mobileMenuBtn || !mobileMenu) return;
        
        const openMenu = () => {
            mobileMenu.style.display = 'block';
            setTimeout(() => mobileMenu.classList.add('active'), 10);
            menuOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        };
        
        const closeMenu = () => {
            mobileMenu.classList.remove('active');
            setTimeout(() => mobileMenu.style.display = 'none', 300);
            menuOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        };
        
        mobileMenuBtn.addEventListener('click', openMenu);
        if (menuClose) menuClose.addEventListener('click', closeMenu);
        if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);
        menuLinks.forEach(link => link.addEventListener('click', closeMenu));
    }

    setupModals() {
        // Modal management logic...
        // [Previous modal setup code remains similar but with better error handling]
    }

    setupAuthentication() {
        // Authentication setup with enhanced validation...
        // [Previous auth setup code with improved validation]
    }

    setupSearch() {
        const searchIcon = document.getElementById('search-icon');
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        const searchResults = document.getElementById('search-results');
        
        if (!searchInput) return;
        
        // Debounced search
        let searchTimeout;
        const performSearch = (value) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchPrincesses(value);
            }, 300);
        };
        
        searchInput.addEventListener('input', (e) => {
            performSearch(e.target.value);
        });
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.searchPrincesses(searchInput.value);
            });
        }
        
        if (searchIcon) {
            searchIcon.addEventListener('click', () => {
                const searchSection = document.querySelector('.search-section');
                if (searchSection) {
                    searchSection.scrollIntoView({ behavior: 'smooth' });
                    searchInput.focus();
                }
            });
        }
        
        // Hide search results when clicking outside
        document.addEventListener('click', (e) => {
            if (searchResults && 
                !searchInput.contains(e.target) && 
                !searchResults.contains(e.target) && 
                (!searchBtn || !searchBtn.contains(e.target))) {
                searchResults.style.display = 'none';
            }
        });
    }

    setupFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                this.filterPrincesses(button.getAttribute('data-filter'));
            });
        });
        
        const browseBtn = document.getElementById('browse-princesses');
        if (browseBtn) {
            browseBtn.addEventListener('click', () => {
                const princessesSection = document.getElementById('princesses');
                if (princessesSection) {
                    princessesSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    }

    setupCodeInputs() {
        const codeInputs = document.querySelectorAll('.code-input');
        
        codeInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1) {
                    if (index < codeInputs.length - 1) {
                        codeInputs[index + 1].focus();
                    }
                }
            });
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                    codeInputs[index - 1].focus();
                }
            });
            
            // Paste handling
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pasteData = e.clipboardData.getData('text').slice(0, 6);
                pasteData.split('').forEach((char, idx) => {
                    if (codeInputs[idx]) {
                        codeInputs[idx].value = char;
                    }
                });
                if (codeInputs[pasteData.length - 1]) {
                    codeInputs[pasteData.length - 1].focus();
                }
            });
        });
    }
}

// ==================== APPLICATION INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    window.iPrincessesApp = new iPrincessesApp();
    
    // Add error boundary for unhandled errors
    window.addEventListener('error', function(e) {
        console.error('Application error:', e.error);
    });
    
    // Service worker registration for PWA capabilities
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    }
});
