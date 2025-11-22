
        // ==================== FIREBASE CONFIGURATION ====================
        const firebaseConfig = {
            apiKey: "AIzaSyBew9lr3hj8dVJj_T7qpdvNWvATJeder5tjU",
            authDomain: "iprincesshes3.firebaseapp.com",
            projectId: "iprincesses3",
            storageBucket: "iprinchesses3.firebasestorage.app",
            messagingSenderId: "215534469686",
            appId: "1:215534469686:web:7ayb0d356105efeb015ce97",
            measurementId: "G-RZQKyK5QKHF"
        };

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();
        const storage = firebase.storage();
        const auth = firebase.auth();

        // Collections
        const princessesCollection = db.collection('princesses');

        // ==================== FIREBASE FUNCTIONS ====================
        
        // Upload image to Firebase Storage
        async function uploadImage(file) {
            try {
                const storageRef = storage.ref();
                const imageRef = storageRef.child(`princesses/${Date.now()}_${file.name}`);
                const snapshot = await imageRef.put(file);
                const downloadURL = await snapshot.ref.getDownloadURL();
                return downloadURL;
            } catch (error) {
                console.error('Upload error:', error);
                throw error;
            }
        }

        // Load princesses for main website
        async function loadPrincesses() {
            try {
                const snapshot = await princessesCollection.where('status', 'in', ['available', 'unavailable']).get();
                const princesses = [];
                
                snapshot.forEach(doc => {
                    princesses.push({ id: doc.id, ...doc.data() });
                });

                renderPrincesses(princesses);
            } catch (error) {
                console.error('Error loading princesses:', error);
                // Fallback to local data if Firebase fails
                renderPrincesses(window.princesses || []);
            }
        }

        // ==================== YOUR EXISTING CODE ====================
        let users = JSON.parse(localStorage.getItem('iprincesses_users')) || [];
        let currentUser = JSON.parse(localStorage.getItem('iprincesses_current_user')) || null;
        let verificationTimer = null;
        let countdownTime = 60;

        // Sample princesses data (fallback)
        let princesses = [
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
                shy: false
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
                shy: true
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
        shy: false
    }

        ];

        // Function to generate random 6-digit code
        function generateVerificationCode() {
            return Math.floor(100000 + Math.random() * 900000).toString();
        }

        // Function to simulate sending SMS
        function sendVerificationCode(phoneNumber, code) {
            console.log(`SMS sent to ${phoneNumber}: Your iPrincesses verification code is ${code}`);
            // For demo purposes, we'll store the code
            localStorage.setItem('last_verification_code', code);
            localStorage.setItem('last_verification_phone', phoneNumber);
            
            return Promise.resolve({ success: true });
        }

        // Function to start verification countdown
        function startVerificationCountdown() {
            const countdownElement = document.getElementById('countdown');
            const resendLink = document.getElementById('resend-code');
            countdownTime = 60;
            
            resendLink.style.pointerEvents = 'none';
            resendLink.style.opacity = '0.5';
            
            verificationTimer = setInterval(() => {
                countdownTime--;
                countdownElement.textContent = `(${countdownTime}s)`;
                
                if (countdownTime <= 0) {
                    clearInterval(verificationTimer);
                    resendLink.style.pointerEvents = 'auto';
                    resendLink.style.opacity = '1';
                    countdownElement.textContent = '';
                }
            }, 1000);
        }

        // Function to verify phone number
        function verifyPhoneNumber(userData) {
            const verificationCode = generateVerificationCode();
            const phoneNumber = userData.phone;
            
            const verificationModal = document.getElementById('verification-modal');
            const verificationPhone = document.getElementById('verification-phone');
            
            verificationPhone.textContent = phoneNumber;
            document.getElementById('verification-user-data').value = JSON.stringify(userData);
            document.getElementById('verification-code').value = verificationCode;
            
            // Clear previous inputs
            document.querySelectorAll('.code-input').forEach(input => input.value = '');
            
            // Show modal
            verificationModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Start countdown
            startVerificationCountdown();
            
            // Send verification code
            sendVerificationCode(phoneNumber, verificationCode);
        }

        // Function to setup code inputs
        function setupCodeInputs() {
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
            });
        }

        // Function to update authentication UI
        function updateAuthUI() {
            const authButtons = document.getElementById('auth-buttons');
            const userInfo = document.getElementById('user-info');
            const userAvatar = document.getElementById('user-avatar');
            const userName = document.getElementById('user-name');
            
            if (currentUser) {
                authButtons.style.display = 'none';
                userInfo.style.display = 'flex';
                userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
                userName.textContent = currentUser.name;
            } else {
                authButtons.style.display = 'flex';
                userInfo.style.display = 'none';
            }
        }

        // Function to show success message
        function showSuccessMessage(message) {
            const successMessage = document.getElementById('success-message');
            successMessage.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
            successMessage.style.display = 'block';
            
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 3000);
        }

        // Function to create princess card HTML
        function createPrincessCard(princess) {
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
            }
            
            const displayPhone = princess.phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
            const servicesHTML = princess.services.map(service => 
                `<span class="service-tag">${service}</span>`
            ).join('');
            
            return `
                <div class="princess-card" data-status="${princess.status}">
                    <div class="princess-status ${statusClass}">${statusText}</div>
                    <div class="princess-img-container">
                        <img src="${princess.image}" alt="${princess.name}" class="princess-img">
                        ${princess.shy ? `
                            <div class="face-cover">
                                <div class="face-cover-logo">iP</div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="princess-info">
                        <div class="princess-name">
                            ${princess.name}
                            <span class="princess-age">${princess.age}</span>
                        </div>
                        <div class="princess-location">
                            <i class="fas fa-map-marker-alt"></i> ${princess.location}
                        </div>
                        <p class="princess-remark">${princess.remark}</p>
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
                                        <a href="https://wa.me/${princess.phone.replace('+', '')}" class="contact-option whatsapp" target="_blank">
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

        // Function to render princesses
        function renderPrincesses(princessesToRender) {
            const princessesContainer = document.getElementById('princesses-container');
            princessesContainer.innerHTML = '';
            
            if (princessesToRender.length === 0) {
                princessesContainer.innerHTML = '<div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 40px;">No princesses found matching your criteria.</div>';
                return;
            }
            
            princessesToRender.forEach(princess => {
                princessesContainer.innerHTML += createPrincessCard(princess);
            });
        }

        // Function to filter princesses
        function filterPrincesses(filter) {
            if (filter === 'all') {
                return renderPrincesses(princesses);
            }
            
            const filteredPrincesses = princesses.filter(princess => princess.status === filter);
            renderPrincesses(filteredPrincesses);
        }

        // Function to search princesses
        function searchPrincesses(query) {
            const searchResults = document.getElementById('search-results');
            
            if (query.length < 2) {
                searchResults.style.display = 'none';
                return;
            }
            
            const filteredPrincesses = princesses.filter(princess => 
                princess.name.toLowerCase().includes(query.toLowerCase()) ||
                princess.remark.toLowerCase().includes(query.toLowerCase()) ||
                princess.location.toLowerCase().includes(query.toLowerCase()) ||
                princess.services.some(service => service.toLowerCase().includes(query.toLowerCase()))
            );
            
            searchResults.innerHTML = '';
            
            if (filteredPrincesses.length === 0) {
                searchResults.innerHTML = '<div class="no-results">No princesses found with that name or description.</div>';
            } else {
                filteredPrincesses.forEach(princess => {
                    const resultItem = document.createElement('div');
                    resultItem.className = 'search-result-item';
                    resultItem.innerHTML = `
                        <img src="${princess.image}" alt="${princess.name}" class="search-result-img">
                        <div class="search-result-info">
                            <h4>${princess.name} (${princess.age}) - ${princess.location}</h4>
                            <p>${princess.remark}</p>
                            <p><strong>Services:</strong> ${princess.services.join(', ')}</p>
                            <p><strong>Status:</strong> ${princess.status === 'available' ? 'Available' : princess.status === 'expired' ? 'Expired' : 'Unavailable'}</p>
                        </div>
                    `;
                    resultItem.addEventListener('click', function() {
                        renderPrincesses([princess]);
                        searchResults.style.display = 'none';
                        document.getElementById('search-input').value = princess.name;
                        document.getElementById('princesses').scrollIntoView({ behavior: 'smooth' });
                    });
                    searchResults.appendChild(resultItem);
                });
            }
            
            searchResults.style.display = 'block';
        }

        // Initialize the application
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize princesses from Firebase
            loadPrincesses();
            updateAuthUI();
            setupCodeInputs();
            
            // Mobile menu functionality
            const mobileMenuBtn = document.getElementById('mobile-menu-btn');
            const mobileMenu = document.getElementById('mobile-menu');
            const menuOverlay = document.getElementById('menu-overlay');
            const menuClose = document.getElementById('menu-close');
            const menuLinks = document.querySelectorAll('.menu-link');
            
            function openMenu() {
                mobileMenu.style.display = 'block';
                setTimeout(() => mobileMenu.classList.add('active'), 10);
                menuOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
            
            function closeMenu() {
                mobileMenu.classList.remove('active');
                setTimeout(() => mobileMenu.style.display = 'none', 300);
                menuOverlay.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
            
            mobileMenuBtn.addEventListener('click', openMenu);
            menuClose.addEventListener('click', closeMenu);
            menuOverlay.addEventListener('click', closeMenu);
            menuLinks.forEach(link => link.addEventListener('click', closeMenu));
            
            // Authentication modals
            const loginBtn = document.getElementById('login-btn');
            const signupBtn = document.getElementById('signup-btn');
            const logoutBtn = document.getElementById('logout-btn');
            const loginModal = document.getElementById('login-modal');
            const signupModal = document.getElementById('signup-modal');
            const verificationModal = document.getElementById('verification-modal');
            const closeLogin = document.getElementById('close-login');
            const closeSignup = document.getElementById('close-signup');
            const closeVerification = document.getElementById('close-verification');
            const switchToSignup = document.getElementById('switch-to-signup');
            const switchToLogin = document.getElementById('switch-to-login');
            
            function openModal(modal) {
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
            
            function closeModal(modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
            
            loginBtn.addEventListener('click', () => openModal(loginModal));
            signupBtn.addEventListener('click', () => openModal(signupModal));
            closeLogin.addEventListener('click', () => closeModal(loginModal));
            closeSignup.addEventListener('click', () => closeModal(signupModal));
            closeVerification.addEventListener('click', () => {
                closeModal(verificationModal);
                if (verificationTimer) clearInterval(verificationTimer);
            });
            
            switchToSignup.addEventListener('click', (e) => {
                e.preventDefault();
                closeModal(loginModal);
                openModal(signupModal);
            });
            
            switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                closeModal(signupModal);
                openModal(loginModal);
            });
            
            // Close modals when clicking outside
            window.addEventListener('click', function(e) {
                if (e.target === loginModal) closeModal(loginModal);
                if (e.target === signupModal) closeModal(signupModal);
                if (e.target === verificationModal) {
                    closeModal(verificationModal);
                    if (verificationTimer) clearInterval(verificationTimer);
                }
            });
            
            // Logout functionality
            logoutBtn.addEventListener('click', function() {
                currentUser = null;
                localStorage.removeItem('iprincesses_current_user');
                updateAuthUI();
                showSuccessMessage('You have been logged out successfully.');
            });
            
            // Search functionality
            const searchIcon = document.getElementById('search-icon');
            const searchInput = document.getElementById('search-input');
            const searchBtn = document.getElementById('search-btn');
            const searchResults = document.getElementById('search-results');
            
            searchIcon.addEventListener('click', function() {
                document.querySelector('.search-section').scrollIntoView({ behavior: 'smooth' });
                searchInput.focus();
            });
            
            searchInput.addEventListener('input', function() {
                searchPrincesses(this.value);
            });
            
            searchBtn.addEventListener('click', function() {
                searchPrincesses(searchInput.value);
            });
            
            // Hide search results when clicking outside
            document.addEventListener('click', function(e) {
                if (!searchInput.contains(e.target) && !searchResults.contains(e.target) && !searchBtn.contains(e.target)) {
                    searchResults.style.display = 'none';
                }
            });
            
            // Login form submission
            document.getElementById('login-form').addEventListener('submit', function(e) {
                e.preventDefault();
                const phone = document.getElementById('login-phone').value;
                const password = document.getElementById('login-password').value;
                
                const user = users.find(u => u.phone === phone && u.password === password);
                
                if (user) {
                    currentUser = user;
                    localStorage.setItem('iprincesses_current_user', JSON.stringify(currentUser));
                    updateAuthUI();
                    closeModal(loginModal);
                    showSuccessMessage(`Welcome back, ${user.name}!`);
                } else {
                    alert('Invalid phone number or password. Please try again.');
                }
            });
            
            // Signup form submission
            document.getElementById('signup-form').addEventListener('submit', function(e) {
                e.preventDefault();
                const name = document.getElementById('signup-name').value;
                const phone = document.getElementById('signup-phone').value;
                const password = document.getElementById('signup-password').value;
                const confirmPassword = document.getElementById('signup-confirm').value;
                
                if (password !== confirmPassword) {
                    alert('Passwords do not match. Please try again.');
                    return;
                }
                
                if (users.find(u => u.phone === phone)) {
                    alert('A user with this phone number already exists. Please use a different number or login.');
                    return;
                }
                
                const userData = {
                    id: users.length + 1,
                    name: name,
                    phone: phone,
                    password: password,
                    joinDate: new Date().toISOString(),
                    verified: false
                };
                
                closeModal(signupModal);
                verifyPhoneNumber(userData);
            });
            
            // Verification form submission
            document.getElementById('verification-form').addEventListener('submit', function(e) {
                e.preventDefault();
                
                const enteredCode = Array.from(document.querySelectorAll('.code-input'))
                    .map(input => input.value)
                    .join('');
                const expectedCode = document.getElementById('verification-code').value;
                const userData = JSON.parse(document.getElementById('verification-user-data').value);
                
                if (enteredCode === expectedCode) {
                    users.push(userData);
                    localStorage.setItem('iprincesses_users', JSON.stringify(users));
                    
                    currentUser = userData;
                    localStorage.setItem('iprincesses_current_user', JSON.stringify(currentUser));
                    
                    updateAuthUI();
                    closeModal(verificationModal);
                    showSuccessMessage(`Welcome to iPrincesses, ${userData.name}! Your account has been verified.`);
                    
                    if (verificationTimer) clearInterval(verificationTimer);
                } else {
                    alert('Invalid verification code. Please try again.');
                }
            });
            
            // Resend code functionality
            document.getElementById('resend-code').addEventListener('click', function(e) {
                e.preventDefault();
                if (countdownTime > 0) return;
                
                const userData = JSON.parse(document.getElementById('verification-user-data').value);
                verifyPhoneNumber(userData);
            });
            
            // Social login simulation
            document.getElementById('google-login').addEventListener('click', function() {
                const user = {
                    id: 'google_' + Date.now(),
                    name: 'Google User',
                    phone: '+256700000000',
                    joinDate: new Date().toISOString(),
                    provider: 'google',
                    verified: true
                };
                
                currentUser = user;
                localStorage.setItem('iprincesses_current_user', JSON.stringify(currentUser));
                updateAuthUI();
                closeModal(loginModal);
                showSuccessMessage(`Welcome, ${user.name}!`);
            });
            
            document.getElementById('facebook-login').addEventListener('click', function() {
                const user = {
                    id: 'fb_' + Date.now(),
                    name: 'Facebook User',
                    phone: '+256711111111',
                    joinDate: new Date().toISOString(),
                    provider: 'facebook',
                    verified: true
                };
                
                currentUser = user;
                localStorage.setItem('iprincesses_current_user', JSON.stringify(currentUser));
                updateAuthUI();
                closeModal(loginModal);
                showSuccessMessage(`Welcome, ${user.name}!`);
            });
            
            document.getElementById('google-signup').addEventListener('click', function() {
                const user = {
                    id: 'google_' + Date.now(),
                    name: 'Google User',
                    phone: '+256700000000',
                    joinDate: new Date().toISOString(),
                    provider: 'google',
                    verified: true
                };
                
                currentUser = user;
                localStorage.setItem('iprincesses_current_user', JSON.stringify(currentUser));
                updateAuthUI();
                closeModal(signupModal);
                showSuccessMessage(`Welcome to iPrincesses, ${user.name}!`);
            });
            
            document.getElementById('facebook-signup').addEventListener('click', function() {
                const user = {
                    id: 'fb_' + Date.now(),
                    name: 'Facebook User',
                    phone: '+256711111111',
                    joinDate: new Date().toISOString(),
                    provider: 'facebook',
                    verified: true
                };
                
                currentUser = user;
                localStorage.setItem('iprincesses_current_user', JSON.stringify(currentUser));
                updateAuthUI();
                closeModal(signupModal);
                showSuccessMessage(`Welcome to iPrincesses, ${user.name}!`);
            });
            
            // Filter buttons
            const filterButtons = document.querySelectorAll('.filter-btn');
            filterButtons.forEach(button => {
                button.addEventListener('click', function() {
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');
                    filterPrincesses(this.getAttribute('data-filter'));
                });
            });
            
            // Browse princesses button
            document.getElementById('browse-princesses').addEventListener('click', function() {
                document.getElementById('princesses').scrollIntoView({ behavior: 'smooth' });
            });
        });
    
