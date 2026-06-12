// Global variables
let currentUser = null;
let currentSubject = null;
let currentChapter = null;
let currentChapterId = null;
let quizQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let quizStartTime = null;
let timerInterval = null;
let currentFilters = {
    year: 'all',
    shift: 'all',
    difficulty: 'all',
    subtopic: 'all'
};


// DOM Elements
const pages = {
    auth: document.getElementById('authPage'),
    home: document.getElementById('homePage'),
    profile: document.getElementById('profilePage'),
    pyqSubject: document.getElementById('pyqSubjectPage'),
    chapter: document.getElementById('chapterPage'),
    practice: document.getElementById('practicePage'),
    results: document.getElementById('resultsPage'),
    upcoming: document.getElementById('upcomingPage'),
    admin: document.getElementById('adminPage'),
    podcast: document.getElementById('podcastPage'),
    customTestWizard: document.getElementById('customTestWizardPage'),
    customTestExam: document.getElementById('customTestExamPage'),
    customTestResults: document.getElementById('customTestResultsPage'),
    questionDetail: document.getElementById('questionDetailPage'),
    community: document.getElementById('communityChatPage')
};

const sidebar = document.getElementById('sidebar');
const loadingOverlay = document.getElementById('loadingOverlay');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    applySavedTheme();
    initializeAuthListeners();
    initializeNavigationListeners();
    initializeAdminListeners();
    initializePracticeListeners();
    initializePodcastListeners();
    initializeCustomTestListeners();
    checkAuthState();
});

// ==================== AUTHENTICATION ====================

function initializeAuthListeners() {
    // Tab switching
    document.getElementById('loginTab').addEventListener('click', () => {
        switchAuthTab('login');
    });

    document.getElementById('signupTab').addEventListener('click', () => {
        switchAuthTab('signup');
    });

    // Form submissions
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Google Sign-In
    safeOn('googleAuthBtn', 'click', handleGoogleAuth);

    // Apple Sign-In
    safeOn('appleAuthBtn', 'click', handleAppleAuth);
}

function switchAuthTab(tab) {
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const authMessage = document.getElementById('authMessage');

    authMessage.textContent = '';
    authMessage.className = 'auth-message';

    if (tab === 'login') {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.style.display = 'flex';
        signupForm.style.display = 'none';
    } else {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.style.display = 'flex';
        loginForm.style.display = 'none';
    }
}

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const messageEl = document.getElementById('authMessage');

    try {
        showLoading();
        await auth.signInWithEmailAndPassword(email, password);
        messageEl.textContent = 'Login successful!';
        messageEl.className = 'auth-message success';
    } catch (error) {
        messageEl.textContent = getErrorMessage(error.code);
        messageEl.className = 'auth-message error';
        hideLoading();
    }
}

async function handleSignup(e) {
    e.preventDefault();

    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const studentClass = document.getElementById('signupClass').value;
    const board = document.getElementById('signupBoard').value;
    const messageEl = document.getElementById('authMessage');

    // Validate inputs
    if (!name || !email || !password || !studentClass || !board) {
        messageEl.textContent = 'Please fill in all fields';
        messageEl.className = 'auth-message error';
        return;
    }

    if (password.length < 6) {
        messageEl.textContent = 'Password must be at least 6 characters long';
        messageEl.className = 'auth-message error';
        return;
    }

    // Check if Firebase is properly initialized
    if (typeof firebase === 'undefined') {
        messageEl.textContent = 'Firebase not loaded. Please check your internet connection.';
        messageEl.className = 'auth-message error';
        console.error('Firebase is not defined. Make sure firebase scripts are loaded.');
        return;
    }

    if (!auth || !database) {
        messageEl.textContent = 'Firebase not configured. Please check firebase-config.js';
        messageEl.className = 'auth-message error';
        console.error('Firebase auth or database not initialized. Check firebase-config.js');
        return;
    }

    try {
        showLoading();
        console.log('Attempting to create user...');
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        console.log('User created successfully:', user.uid);

        // Save user profile to database
        console.log('Saving user profile to database...');
        const userData = {
            name: name,
            email: email,
            class: studentClass,
            board: board,
            createdAt: new Date().toISOString()
        };

        await database.ref('users/' + user.uid).set(userData);
        console.log('Profile saved successfully:', userData);

        messageEl.textContent = 'Account created successfully!';
        messageEl.className = 'auth-message success';
    } catch (error) {
        console.error('Signup error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        let errorMessage = getErrorMessage(error.code);

        // Additional helpful error messages
        if (error.code === 'auth/invalid-api-key') {
            errorMessage = 'Firebase not configured correctly. Please check firebase-config.js';
        } else if (error.message.includes('fetch')) {
            errorMessage = 'Network error. Please check your internet connection and Firebase configuration.';
        }

        messageEl.textContent = errorMessage;
        messageEl.className = 'auth-message error';
        hideLoading();
    }
}

function handleLogout() {
    auth.signOut();
}

async function handleGoogleAuth() {
    const messageEl = document.getElementById('authMessage');
    try {
        showLoading();
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        console.log('Google login successful for uid:', user.uid);
        
        // Save user profile to database if it doesn't exist
        const snapshot = await database.ref('users/' + user.uid).once('value');
        if (!snapshot.exists()) {
            const userData = {
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                class: 'Select Class',
                board: 'Select Board',
                createdAt: new Date().toISOString()
            };
            await database.ref('users/' + user.uid).set(userData);
            console.log('Created default user profile for Google user in DB');
        }
        
        messageEl.textContent = 'Login successful!';
        messageEl.className = 'auth-message success';
    } catch (error) {
        console.error('Google auth error:', error);
        let errorMessage = error.message || 'An error occurred during Google sign-in';
        if (error.code === 'auth/account-exists-with-different-credential') {
            errorMessage = 'An account already exists with this email. Please log in with your email and password, then link your Google account in your profile settings.';
        }
        messageEl.textContent = errorMessage;
        messageEl.className = 'auth-message error';
        hideLoading();
    }
}

async function handleGoogleLinkToggle() {
    if (!currentUser) return;
    
    const isGoogleLinked = currentUser.providerData.some(profile => profile.providerId === 'google.com');
    
    try {
        showLoading();
        if (isGoogleLinked) {
            // Check if user has password provider or another provider linked so they don't get locked out
            const providersCount = currentUser.providerData.length;
            if (providersCount <= 1) {
                alert('You cannot unlink Google account because it is your only sign-in method.');
                hideLoading();
                return;
            }
            
            await currentUser.unlink('google.com');
            alert('Google account unlinked successfully.');
        } else {
            const provider = new firebase.auth.GoogleAuthProvider();
            await currentUser.linkWithPopup(provider);
            alert('Google account linked successfully.');
        }
        await loadUserProfile();
    } catch (error) {
        console.error('Google linking/unlinking error:', error);
        alert(error.message || 'An error occurred while linking/unlinking Google account');
    } finally {
        hideLoading();
    }
}

function updateGoogleLinkUI() {
    if (!currentUser) return;
    
    const googleLinkStatus = document.getElementById('googleLinkStatus');
    const googleLinkBtn = document.getElementById('googleLinkBtn');
    
    if (!googleLinkStatus || !googleLinkBtn) return;
    
    const isGoogleLinked = currentUser.providerData.some(profile => profile.providerId === 'google.com');
    
    if (isGoogleLinked) {
        googleLinkStatus.textContent = 'Linked';
        googleLinkStatus.className = 'link-status linked';
        googleLinkBtn.textContent = 'Unlink';
        googleLinkBtn.className = 'btn-danger btn-sm';
    } else {
        googleLinkStatus.textContent = 'Not Linked';
        googleLinkStatus.className = 'link-status unlinked';
        googleLinkBtn.textContent = 'Link Account';
        googleLinkBtn.className = 'btn-secondary btn-sm';
    }
}

async function handleAppleAuth() {
    const messageEl = document.getElementById('authMessage');
    try {
        showLoading();
        const provider = new firebase.auth.OAuthProvider('apple.com');
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        console.log('Apple login successful for uid:', user.uid);
        
        // Save user profile to database if it doesn't exist
        const snapshot = await database.ref('users/' + user.uid).once('value');
        if (!snapshot.exists()) {
            const userData = {
                name: user.displayName || user.email.split('@')[0] || 'Apple Student',
                email: user.email || '',
                class: 'Select Class',
                board: 'Select Board',
                createdAt: new Date().toISOString()
            };
            await database.ref('users/' + user.uid).set(userData);
            console.log('Created default user profile for Apple user in DB');
        }
        
        messageEl.textContent = 'Login successful!';
        messageEl.className = 'auth-message success';
    } catch (error) {
        console.error('Apple auth error:', error);
        let errorMessage = error.message || 'An error occurred during Apple sign-in';
        if (error.code === 'auth/account-exists-with-different-credential') {
            errorMessage = 'An account already exists with this email. Please log in with your email and password, then link your Apple account in your profile settings.';
        }
        messageEl.textContent = errorMessage;
        messageEl.className = 'auth-message error';
        hideLoading();
    }
}

async function handleAppleLinkToggle() {
    if (!currentUser) return;
    
    const isAppleLinked = currentUser.providerData.some(profile => profile.providerId === 'apple.com');
    
    try {
        showLoading();
        if (isAppleLinked) {
            // Check if user has password provider or another provider linked so they don't get locked out
            const providersCount = currentUser.providerData.length;
            if (providersCount <= 1) {
                alert('You cannot unlink Apple account because it is your only sign-in method.');
                hideLoading();
                return;
            }
            
            await currentUser.unlink('apple.com');
            alert('Apple account unlinked successfully.');
        } else {
            const provider = new firebase.auth.OAuthProvider('apple.com');
            await currentUser.linkWithPopup(provider);
            alert('Apple account linked successfully.');
        }
        await loadUserProfile();
    } catch (error) {
        console.error('Apple linking/unlinking error:', error);
        alert(error.message || 'An error occurred while linking/unlinking Apple account');
    } finally {
        hideLoading();
    }
}

function updateAppleLinkUI() {
    if (!currentUser) return;
    
    const appleLinkStatus = document.getElementById('appleLinkStatus');
    const appleLinkBtn = document.getElementById('appleLinkBtn');
    
    if (!appleLinkStatus || !appleLinkBtn) return;
    
    const isAppleLinked = currentUser.providerData.some(profile => profile.providerId === 'apple.com');
    
    if (isAppleLinked) {
        appleLinkStatus.textContent = 'Linked';
        appleLinkStatus.className = 'link-status linked';
        appleLinkBtn.textContent = 'Unlink';
        appleLinkBtn.className = 'btn-danger btn-sm';
    } else {
        appleLinkStatus.textContent = 'Not Linked';
        appleLinkStatus.className = 'link-status unlinked';
        appleLinkBtn.textContent = 'Link Account';
        appleLinkBtn.className = 'btn-secondary btn-sm';
    }
}

function checkAuthState() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await loadUserProfile();
            await loadExamToggles();
            routeCurrentUrl();
            sidebar.style.display = 'flex';
            document.body.classList.add('sidebar-active');
            loadPodcastHistory();

            // Check if user is admin
            if (isAdmin(user.email)) {
                document.getElementById('adminNavLink').style.display = 'flex';
                const podcastSettingsToggle = document.getElementById('podcastSettingsToggleContainer');
                if (podcastSettingsToggle) podcastSettingsToggle.style.display = 'flex';
            }
        } else {
            currentUser = null;
            navigateToUrl('/auth');
            sidebar.style.display = 'none';
            document.body.classList.remove('sidebar-active');
            document.getElementById('adminNavLink').style.display = 'none';
            const podcastSettingsToggle = document.getElementById('podcastSettingsToggleContainer');
            if (podcastSettingsToggle) podcastSettingsToggle.style.display = 'none';
        }
        hideLoading();
    });
}

async function loadUserProfile() {
    if (!currentUser) {
        console.error('No current user to load profile for');
        return;
    }

    try {
        console.log('Loading profile for user:', currentUser.uid);
        const snapshot = await database.ref('users/' + currentUser.uid).once('value');
        const userData = snapshot.val();

        console.log('User data from database:', userData);

        if (userData) {
            // Update home page profile
            document.getElementById('userName').textContent = userData.name || 'Student';
            document.getElementById('userClass').textContent = userData.class ? 'Class ' + userData.class : 'Not specified';

            const profilePhotoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'Student')}&background=667eea&color=fff&size=80`;
            document.getElementById('profilePhoto').src = profilePhotoUrl;

            // Update profile page
            document.getElementById('profileNameFull').textContent = userData.name || 'Student';
            document.getElementById('profileEmail').textContent = userData.email || currentUser.email;
            document.getElementById('profileClass').textContent = userData.class ? 'Class ' + userData.class : 'Not specified';
            document.getElementById('profileBoard').textContent = userData.board || 'Not specified';

            const profilePhotoFullUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'Student')}&background=667eea&color=fff&size=150`;
            document.getElementById('profilePhotoFull').src = profilePhotoFullUrl;

            // Update community username input field
            const communityUsernameInput = document.getElementById('profileCommunityUsername');
            if (communityUsernameInput) {
                communityUsernameInput.value = userData.communityUsername || '';
            }

            updateGoogleLinkUI();
            updateAppleLinkUI();
            console.log('Profile updated successfully');
        } else {
            console.warn('No user data found in database for user:', currentUser.uid);
            // If no data in database, use email from auth
            document.getElementById('userName').textContent = currentUser.email ? currentUser.email.split('@')[0] : 'Student';
            document.getElementById('profileEmail').textContent = currentUser.email || 'No email';
            document.getElementById('profileNameFull').textContent = currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Student');
            
            const communityUsernameInput = document.getElementById('profileCommunityUsername');
            if (communityUsernameInput) {
                communityUsernameInput.value = '';
            }
            
            updateGoogleLinkUI();
            updateAppleLinkUI();
        }
        
        // Auto-start timer checkbox setting init
        const autoStartCheck = document.getElementById('profileAutoStartTimer');
        if (autoStartCheck) {
            autoStartCheck.checked = localStorage.getItem('autoStartTimer') !== 'false';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        console.error('Error details:', error.message);
        // Fallback to email if profile loading fails
        if (currentUser && currentUser.email) {
            document.getElementById('userName').textContent = currentUser.email.split('@')[0];
            document.getElementById('profileEmail').textContent = currentUser.email;
        }
    }
}

function isAdmin(email) {
    return ADMIN_EMAILS.includes(email);
}

function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'This email is already registered',
        'auth/invalid-email': 'Invalid email address',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later'
    };
    return errorMessages[errorCode] || 'An error occurred. Please try again.';
}

// ==================== NAVIGATION ====================

function safeOn(id, event, fn) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, fn);
}

function initializeNavigationListeners() {
    safeOn('homeNavLink', 'click', (e) => { e.preventDefault(); navigateToUrl('/home'); });
    safeOn('sidebarLogo', 'click', (e) => { e.preventDefault(); navigateToUrl('/home'); });
    safeOn('adminNavLink', 'click', (e) => { e.preventDefault(); navigateToUrl('/admin'); });
    safeOn('profilePreview', 'click', () => navigateToUrl('/profile'));
    safeOn('backToHomeBtn', 'click', () => navigateToUrl('/home'));
    safeOn('googleLinkBtn', 'click', handleGoogleLinkToggle);
    safeOn('appleLinkBtn', 'click', handleAppleLinkToggle);
    safeOn('themeSwitchBtn', 'click', handleThemeSwitch);
    safeOn('communityNavLink', 'click', (e) => { e.preventDefault(); navigateToUrl('/community'); });
    safeOn('saveCommunityUsernameBtn', 'click', saveCommunityUsername);
    safeOn('pyqCard', 'click', () => navigateToUrl('/practice'));
    safeOn('backFromSubjectBtn', 'click', () => navigateToUrl('/home'));
    safeOn('backFromChapterBtn', 'click', () => navigateToUrl('/practice'));
    safeOn('upcomingCard', 'click', () => navigateToUrl('/upcoming'));
    safeOn('upcomingNavLink', 'click', (e) => { e.preventDefault(); navigateToUrl('/upcoming'); });
    safeOn('backFromUpcomingBtn', 'click', () => navigateToUrl('/home'));
    safeOn('podcastCard', 'click', () => navigateToUrl('/podcast'));
    safeOn('podcastNavLink', 'click', (e) => { e.preventDefault(); navigateToUrl('/podcast'); });
    safeOn('backToChaptersFromResultsBtn', 'click', () => navigateToUrl(`/practice/${currentSubject}`));
    safeOn('backFromAdminBtn', 'click', () => navigateToUrl('/home'));

    // Subject selection
    document.querySelectorAll('.subject-card').forEach(card => {
        card.addEventListener('click', () => navigateToUrl(`/practice/${card.dataset.subject}`));
    });

    // Exam cards (new grid, if present)
    document.querySelectorAll('.exam-card').forEach(card => {
        card.addEventListener('click', () => {
            if (card.classList.contains('exam-card-disabled')) return;
            if (card.dataset.exam === 'jee') navigateToUrl('/practice');
        });
    });

    // Auto-start timer toggle listener
    const autoStartCheck = document.getElementById('profileAutoStartTimer');
    if (autoStartCheck) {
        autoStartCheck.addEventListener('change', () => {
            localStorage.setItem('autoStartTimer', autoStartCheck.checked);
        });
    }
}

function showPage(pageName) {
    if (pageName !== 'podcast') {
        resetPodcastPlayer();
    }
    if (pageName !== 'questionDetail') {
        pauseQuestionTimer();
    }
    Object.values(pages).forEach(page => { if (page) page.style.display = 'none'; });
    if (pages[pageName]) {
        pages[pageName].style.display = 'block';
    }
}

// ==================== CHAPTERS ====================

async function loadChapters(subject) {
    currentSubject = subject;
    showLoading();

    try {
        const snapshot = await database.ref('chapters/' + subject).orderByChild('order').once('value');
        const chapters = [];

        snapshot.forEach(childSnapshot => {
            chapters.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        displayChapters(chapters, subject);
        showPage('chapter');
    } catch (error) {
        console.error('Error loading chapters:', error);
        alert('Failed to load chapters. Please try again.');
    } finally {
        hideLoading();
    }
}

function displayChapters(chapters, subject) {
    const chapterList = document.getElementById('chapterList');
    const subjectName = subject.charAt(0).toUpperCase() + subject.slice(1);

    document.getElementById('chapterPageTitle').textContent = subjectName + ' Chapters';
    document.getElementById('chapterPageSubtitle').textContent = 'Select a chapter to start practicing';
    
    // Update back button to show subject name
    const backText = document.getElementById('backFromChapterText');
    if (backText) backText.textContent = subjectName + ' \u203A Subjects';

    if (chapters.length === 0) {
        chapterList.innerHTML = '<p class="no-data">No chapters available yet</p>';
        return;
    }

    chapterList.innerHTML = chapters.map(chapter => `
        <div class="chapter-item" data-chapter-id="${chapter.id}" data-chapter-name="${chapter.name}">
            <div class="chapter-info">
                <h4>${chapter.name}</h4>
                <p>Practice previous year questions</p>
            </div>
            <div class="chapter-arrow">→</div>
        </div>
    `).join('');

    // Add click listeners
    document.querySelectorAll('.chapter-item').forEach(item => {
        item.addEventListener('click', () => {
            const chapterId = item.dataset.chapterId;
            navigateToUrl(`/practice/${subject}/${chapterId}`);
        });
    });
}

// ==================== PRACTICE MODE ====================

function initializePracticeListeners() {
    // Filter listeners
    document.getElementById('filterYear').addEventListener('change', applyFiltersAndSort);
    document.getElementById('filterShift').addEventListener('change', applyFiltersAndSort);
    document.getElementById('filterDifficulty').addEventListener('change', applyFiltersAndSort);
    document.getElementById('filterSubtopic').addEventListener('change', applyFiltersAndSort);
    document.getElementById('sortBy').addEventListener('change', applyFiltersAndSort);

    // Navigation
    document.getElementById('backFromPracticeBtn').addEventListener('click', () => {
        navigateToUrl('/practice/' + currentSubject);
    });

    // Question Detail listeners
    safeOn('btnDetailCheckAnswer', 'click', submitDetailAnswer);
    safeOn('btnQuestionTimer', 'click', () => {
        if (questionTimerState === 'running') {
            pauseQuestionTimer();
        } else {
            startQuestionTimer();
        }
    });
}

async function loadPracticeMode(subject, chapterName, chapterId) {
    currentSubject = subject;
    currentChapter = chapterName;
    currentChapterId = chapterId;
    userAnswers = [];

    showLoading();

    try {
        const snapshot = await database.ref('questions/' + subject + '/' + chapterId).once('value');
        quizQuestions = [];

        snapshot.forEach(childSnapshot => {
            quizQuestions.push({
                id: childSnapshot.key,
                subject: subject,
                ...childSnapshot.val()
            });
        });

        // Fetch bookmarks
        let userBookmarks = {};
        if (currentUser) {
            try {
                const bookmarksSnapshot = await database.ref(`bookmarks/${currentUser.uid}`).once('value');
                userBookmarks = bookmarksSnapshot.val() || {};
            } catch (e) {
                console.error("Error fetching bookmarks:", e);
            }
        }
        currentUserBookmarks = userBookmarks;

        if (quizQuestions.length === 0) {
            alert('No questions available for this chapter yet.');
            hideLoading();
            return;
        }

        // Initialize user answers array
        userAnswers = new Array(quizQuestions.length).fill(null);

        // Set practice info
        document.getElementById('practiceSubject').textContent = subject.charAt(0).toUpperCase() + subject.slice(1);
        document.getElementById('practiceChapter').textContent = chapterName;

        // Load unique filter options
        loadFilterOptions();

        // Display all questions
        applyFiltersAndSort();

        showPage('practice');
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Failed to load questions. Please try again.');
    } finally {
        hideLoading();
    }
}

function loadFilterOptions() {
    // Get unique years
    const years = [...new Set(quizQuestions.map(q => q.year).filter(Boolean))].sort().reverse();
    const yearFilter = document.getElementById('filterYear');
    yearFilter.innerHTML = '<option value="all">All Years</option>' +
        years.map(year => `<option value="${year}">${year}</option>`).join('');

    // Get unique shifts
    const shifts = [...new Set(quizQuestions.map(q => q.shift).filter(Boolean))].sort();
    const shiftFilter = document.getElementById('filterShift');
    shiftFilter.innerHTML = '<option value="all">All Shifts</option>' +
        shifts.map(shift => `<option value="${shift}">${shift}</option>`).join('');

    // Get unique difficulties
    const difficulties = [...new Set(quizQuestions.map(q => q.difficulty).filter(Boolean))];
    const difficultyOrder = ['Easy', 'Medium', 'Hard'];
    const sortedDifficulties = difficulties.sort((a, b) =>
        difficultyOrder.indexOf(a) - difficultyOrder.indexOf(b)
    );
    const difficultyFilter = document.getElementById('filterDifficulty');
    difficultyFilter.innerHTML = '<option value="all">All Difficulties</option>' +
        sortedDifficulties.map(diff => `<option value="${diff}">${diff}</option>`).join('');

    // Get unique subtopics
    const subtopics = [...new Set(quizQuestions.map(q => q.subtopic).filter(Boolean))].sort();
    const subtopicFilter = document.getElementById('filterSubtopic');
    subtopicFilter.innerHTML = '<option value="all">All Subtopics</option>' +
        subtopics.map(subtopic => `<option value="${subtopic}">${subtopic}</option>`).join('');
}

function applyFiltersAndSort() {
    // Get current filter values
    currentFilters.year = document.getElementById('filterYear').value;
    currentFilters.shift = document.getElementById('filterShift').value;
    currentFilters.difficulty = document.getElementById('filterDifficulty').value;
    currentFilters.subtopic = document.getElementById('filterSubtopic').value;
    const sortBy = document.getElementById('sortBy').value;

    // Filter questions
    let filteredQuestions = quizQuestions.filter(q => {
        if (currentFilters.year !== 'all' && q.year !== currentFilters.year) return false;
        if (currentFilters.shift !== 'all' && q.shift !== currentFilters.shift) return false;
        if (currentFilters.difficulty !== 'all' && q.difficulty !== currentFilters.difficulty) return false;
        if (currentFilters.subtopic !== 'all' && q.subtopic !== currentFilters.subtopic) return false;
        return true;
    });

    // Sort questions
    if (sortBy === 'year-desc') {
        filteredQuestions.sort((a, b) => (b.year || '').localeCompare(a.year || ''));
    } else if (sortBy === 'year-asc') {
        filteredQuestions.sort((a, b) => (a.year || '').localeCompare(b.year || ''));
    } else if (sortBy === 'shift') {
        filteredQuestions.sort((a, b) => (a.shift || '').localeCompare(b.shift || ''));
    } else if (sortBy === 'difficulty') {
        const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
        filteredQuestions.sort((a, b) =>
            (difficultyOrder[a.difficulty] || 999) - (difficultyOrder[b.difficulty] || 999)
        );
    } else if (sortBy === 'subtopic') {
        filteredQuestions.sort((a, b) => (a.subtopic || '').localeCompare(b.subtopic || ''));
    }

    displayQuestions(filteredQuestions);
}

function displayQuestions(questions) {
    const container = document.getElementById('questionsContainer');
    const stats = document.getElementById('practiceStats');

    if (questions.length === 0) {
        container.innerHTML = '<p class="no-data">No questions match the selected filters</p>';
        stats.textContent = 'Showing 0 questions';
        return;
    }

    // Calculate statistics
    const attempted = userAnswers.filter((ans, idx) => {
        const originalIdx = quizQuestions.findIndex(q => q.id === questions.find((_, i) => i === idx)?.id);
        return ans !== null && originalIdx !== -1;
    }).length;

    const correct = questions.filter((q, idx) => {
        const originalIdx = quizQuestions.findIndex(qq => qq.id === q.id);
        return originalIdx !== -1 && userAnswers[originalIdx] === q.correctAnswer;
    }).length;

    const incorrect = questions.filter((q, idx) => {
        const originalIdx = quizQuestions.findIndex(qq => qq.id === q.id);
        return originalIdx !== -1 && userAnswers[originalIdx] !== null && userAnswers[originalIdx] !== q.correctAnswer;
    }).length;

    stats.innerHTML = `
        Showing ${questions.length} question${questions.length !== 1 ? 's' : ''} | 
        <span class="stat-correct">${correct} Correct</span> | 
        <span class="stat-incorrect">${incorrect} Incorrect</span> | 
        <span class="stat-unattempted">${questions.length - attempted} Unattempted</span>
    `;

    // Render as a clean list of rows (like img1)
    let html = '<div class="practice-question-list">';
    html += questions.map((question, displayIdx) => {
        const originalIdx = quizQuestions.findIndex(q => q.id === question.id);
        const userAnswer = userAnswers[originalIdx];
        const isAttempted = userAnswer !== null;
        const isCorrect = userAnswer === question.correctAnswer;

        let statusClass = '';
        let badgeHtml = '';

        if (isAttempted) {
            if (isCorrect) {
                statusClass = 'status-row-correct';
                badgeHtml = '<span class="row-badge correct">Correct</span>';
            } else {
                statusClass = 'status-row-incorrect';
                badgeHtml = '<span class="row-badge incorrect">Incorrect</span>';
            }
        }

        return `
            <div class="practice-question-row ${statusClass}" data-question-id="${question.id}" data-original-idx="${originalIdx}">
                <div class="question-index-col">${displayIdx + 1}</div>
                <div class="question-content-col">
                    <div class="question-text-summary">${question.question}</div>
                    <div class="question-sub-meta">
                        <span>JEE Main ${question.year || ''} ${question.shift ? `(${question.shift})` : ''}</span>
                        ${badgeHtml}
                    </div>
                </div>
                <div class="question-arrow-col">›</div>
            </div>
        `;
    }).join('');
    html += '</div>';

    container.innerHTML = html;

    // Add click listeners to rows to navigate to single question page
    container.querySelectorAll('.practice-question-row').forEach(row => {
        row.addEventListener('click', () => {
            const questionId = row.dataset.questionId;
            // Save current state to localStorage so we can reload/back nav easily
            localStorage.setItem('lastSubject', currentSubject);
            localStorage.setItem('lastChapterId', currentChapterId);
            localStorage.setItem('lastChapterName', currentChapter);
            
            // Navigate cleanly
            navigateToUrl(`/question/${questionId}`);
        });
    });
}

function selectOptionPractice(questionIdx, optionIdx) {
    // Update user answer (but don't mark as submitted yet)
    userAnswers[questionIdx] = optionIdx;

    // Update UI for this question
    const optionsContainer = document.getElementById(`options-${questionIdx}`);
    optionsContainer.querySelectorAll('.option-practice').forEach((btn, idx) => {
        if (idx === optionIdx) {
            btn.classList.add('option-selected');
        } else {
            btn.classList.remove('option-selected');
        }
    });
}

function submitAnswer(questionIdx) {
    const question = quizQuestions[questionIdx];
    const userAnswer = userAnswers[questionIdx];

    if (userAnswer === null) {
        alert('Please select an option before submitting');
        return;
    }

    const isCorrect = userAnswer === question.correctAnswer;

    // Save result to database
    saveQuestionResult(questionIdx, isCorrect);

    // Re-render to show correct/incorrect state
    applyFiltersAndSort();

    // Scroll to the question
    setTimeout(() => {
        document.getElementById(`question-${questionIdx}`).scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

async function saveQuestionResult(questionIdx, isCorrect) {
    if (!currentUser) return;

    try {
        await database.ref(`results/${currentUser.uid}/questions`).push({
            subject: currentSubject,
            chapter: currentChapter,
            questionId: quizQuestions[questionIdx].id,
            correct: isCorrect,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error saving result:', error);
    }
}

// ==================== UPCOMING EXAMS ====================

async function loadUpcomingExams() {
    showLoading();

    try {
        const snapshot = await database.ref('exams').orderByChild('date').once('value');
        const exams = [];

        snapshot.forEach(childSnapshot => {
            exams.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        displayUpcomingExams(exams);
    } catch (error) {
        console.error('Error loading exams:', error);
        document.getElementById('examList').innerHTML = '<p class="no-data">Failed to load exams</p>';
    } finally {
        hideLoading();
    }
}

function displayUpcomingExams(exams) {
    const examList = document.getElementById('examList');

    if (exams.length === 0) {
        examList.innerHTML = '<p class="no-data">No upcoming exams</p>';
        return;
    }

    examList.innerHTML = exams.map(exam => `
        <div class="exam-card">
            <div class="exam-header">
                <h3 class="exam-name">${exam.name}</h3>
                <span class="exam-date">${formatDate(exam.date)}</span>
            </div>
            <p class="exam-details">${exam.details}</p>
            ${exam.link ? `<a href="${exam.link}" target="_blank" class="exam-link">More Information →</a>` : ''}
        </div>
    `).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// ==================== ADMIN PANEL ====================

function initializeAdminListeners() {
    // Admin tabs
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchAdminTab(btn.dataset.tab);
        });
    });

    // Add question form
    document.getElementById('addQuestionForm').addEventListener('submit', handleAddQuestion);

    // Add chapter form
    document.getElementById('addChapterForm').addEventListener('submit', handleAddChapter);

    // Add exam form
    document.getElementById('addExamForm').addEventListener('submit', handleAddExam);

    // Subject change for loading chapters in question form
    document.getElementById('adminSubject').addEventListener('change', (e) => {
        loadAdminChapters(e.target.value);
    });

    // Filter for loading questions
    document.getElementById('filterSubject').addEventListener('change', (e) => {
        loadAdminChaptersForFilter(e.target.value);
    });

    document.getElementById('loadQuestionsBtn').addEventListener('click', loadExistingQuestions);

    // Exam toggle listeners (admin panel, new HTML only)
    ['bitsat', 'viteee', 'mhtcet', 'met', 'nda'].forEach(examId => {
        const t = document.getElementById('toggle-' + examId);
        if (t) t.addEventListener('change', () => handleExamToggle(examId, t.checked));
    });
}

function switchAdminTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });

    // Show corresponding content
    document.getElementById('adminQuestionsTab').style.display = tabName === 'questions' ? 'block' : 'none';
    document.getElementById('adminChaptersTab').style.display = tabName === 'chapters' ? 'block' : 'none';
    document.getElementById('adminExamsTab').style.display = tabName === 'exams' ? 'block' : 'none';
}

async function loadAdminData() {
    await loadAllChapters();
    await loadAdminExams();
}

async function loadAdminChapters(subject) {
    const chapterSelect = document.getElementById('adminChapter');

    if (!subject) {
        chapterSelect.disabled = true;
        chapterSelect.innerHTML = '<option value="">Select Subject First</option>';
        return;
    }

    try {
        const snapshot = await database.ref('chapters/' + subject).orderByChild('order').once('value');
        const chapters = [];

        snapshot.forEach(childSnapshot => {
            chapters.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        if (chapters.length === 0) {
            chapterSelect.innerHTML = '<option value="">No chapters available</option>';
            chapterSelect.disabled = true;
        } else {
            chapterSelect.disabled = false;
            chapterSelect.innerHTML = '<option value="">Select Chapter</option>' +
                chapters.map(ch => `<option value="${ch.id}">${ch.name}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading chapters:', error);
        chapterSelect.innerHTML = '<option value="">Error loading chapters</option>';
    }
}

async function loadAdminChaptersForFilter(subject) {
    const chapterSelect = document.getElementById('filterChapter');

    if (!subject) {
        chapterSelect.disabled = true;
        chapterSelect.innerHTML = '<option value="">Select Subject First</option>';
        return;
    }

    try {
        const snapshot = await database.ref('chapters/' + subject).orderByChild('order').once('value');
        const chapters = [];

        snapshot.forEach(childSnapshot => {
            chapters.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        if (chapters.length === 0) {
            chapterSelect.innerHTML = '<option value="">No chapters available</option>';
            chapterSelect.disabled = true;
        } else {
            chapterSelect.disabled = false;
            chapterSelect.innerHTML = '<option value="">All Chapters</option>' +
                chapters.map(ch => `<option value="${ch.id}">${ch.name}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading chapters:', error);
    }
}

async function handleAddQuestion(e) {
    e.preventDefault();

    if (!isAdmin(currentUser.email)) {
        alert('You do not have permission to add questions');
        return;
    }

    const subject = document.getElementById('adminSubject').value;
    const chapterId = document.getElementById('adminChapter').value;
    const question = document.getElementById('adminQuestion').value;
    const options = [
        document.getElementById('adminOption1').value,
        document.getElementById('adminOption2').value,
        document.getElementById('adminOption3').value,
        document.getElementById('adminOption4').value
    ];
    const correctAnswer = parseInt(document.getElementById('adminCorrectAnswer').value);
    const year = document.getElementById('adminYear').value;
    const shift = document.getElementById('adminShift').value;
    const subtopic = document.getElementById('adminSubtopic').value;
    const difficulty = document.getElementById('adminDifficulty').value;
    const detailedAnswer = document.getElementById('adminDetailedAnswer').value;

    if (!subject || !chapterId) {
        alert('Please select both subject and chapter');
        return;
    }

    try {
        showLoading();

        const questionData = {
            question: question,
            options: options,
            correctAnswer: correctAnswer,
            year: year,
            createdAt: new Date().toISOString()
        };

        // Add optional fields only if they have values
        if (shift) questionData.shift = shift;
        if (subtopic) questionData.subtopic = subtopic;
        if (difficulty) questionData.difficulty = difficulty;
        if (detailedAnswer) questionData.detailedAnswer = detailedAnswer;

        await database.ref('questions/' + subject + '/' + chapterId).push(questionData);

        alert('Question added successfully!');
        e.target.reset();
        document.getElementById('adminChapter').disabled = true;
        document.getElementById('adminChapter').innerHTML = '<option value="">Select Subject First</option>';
    } catch (error) {
        console.error('Error adding question:', error);
        alert('Failed to add question. Please try again.');
    } finally {
        hideLoading();
    }
}

async function handleAddChapter(e) {
    e.preventDefault();

    if (!isAdmin(currentUser.email)) {
        alert('You do not have permission to add chapters');
        return;
    }

    const subject = document.getElementById('chapterSubject').value;
    const name = document.getElementById('chapterName').value;
    const order = parseInt(document.getElementById('chapterOrder').value);

    try {
        showLoading();

        await database.ref('chapters/' + subject).push({
            name: name,
            order: order,
            createdAt: new Date().toISOString()
        });

        alert('Chapter added successfully!');
        e.target.reset();
        await loadAllChapters();
    } catch (error) {
        console.error('Error adding chapter:', error);
        alert('Failed to add chapter. Please try again.');
    } finally {
        hideLoading();
    }
}

async function handleAddExam(e) {
    e.preventDefault();

    if (!isAdmin(currentUser.email)) {
        alert('You do not have permission to add exams');
        return;
    }

    const name = document.getElementById('adminExamName').value;
    const date = document.getElementById('adminExamDate').value;
    const details = document.getElementById('adminExamDetails').value;
    const link = document.getElementById('adminExamLink').value;

    try {
        showLoading();

        await database.ref('exams').push({
            name: name,
            date: date,
            details: details,
            link: link || '',
            createdAt: new Date().toISOString()
        });

        alert('Exam added successfully!');
        e.target.reset();
        await loadAdminExams();
    } catch (error) {
        console.error('Error adding exam:', error);
        alert('Failed to add exam. Please try again.');
    } finally {
        hideLoading();
    }
}

async function loadAllChapters() {
    const subjects = ['physics', 'chemistry', 'mathematics'];

    for (const subject of subjects) {
        try {
            const snapshot = await database.ref('chapters/' + subject).orderByChild('order').once('value');
            const chapters = [];

            snapshot.forEach(childSnapshot => {
                chapters.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });

            displayAdminChapters(subject, chapters);
        } catch (error) {
            console.error(`Error loading ${subject} chapters:`, error);
        }
    }
}

function displayAdminChapters(subject, chapters) {
    const listId = subject + 'ChaptersList';
    const list = document.getElementById(listId);

    if (chapters.length === 0) {
        list.innerHTML = '<p class="no-data">No chapters added yet</p>';
        return;
    }

    list.innerHTML = chapters.map(chapter => `
        <div class="admin-item">
            <div class="admin-item-header">
                <span class="admin-item-title">${chapter.name}</span>
                <div class="admin-item-actions">
                    <button class="btn-delete" onclick="deleteChapter('${subject}', '${chapter.id}', '${chapter.name}')">Delete</button>
                </div>
            </div>
            <div class="admin-item-content">Order: ${chapter.order}</div>
        </div>
    `).join('');
}

async function deleteChapter(subject, chapterId, chapterName) {
    if (!isAdmin(currentUser.email)) {
        alert('You do not have permission to delete chapters');
        return;
    }

    if (!confirm(`Are you sure you want to delete "${chapterName}"? This will also delete all questions in this chapter.`)) {
        return;
    }

    try {
        showLoading();

        // Delete chapter
        await database.ref('chapters/' + subject + '/' + chapterId).remove();

        // Delete all questions in this chapter
        await database.ref('questions/' + subject + '/' + chapterId).remove();

        alert('Chapter deleted successfully!');
        await loadAllChapters();
    } catch (error) {
        console.error('Error deleting chapter:', error);
        alert('Failed to delete chapter. Please try again.');
    } finally {
        hideLoading();
    }
}

async function loadAdminExams() {
    try {
        const snapshot = await database.ref('exams').orderByChild('date').once('value');
        const exams = [];

        snapshot.forEach(childSnapshot => {
            exams.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        displayAdminExams(exams);
    } catch (error) {
        console.error('Error loading exams:', error);
    }
}

function displayAdminExams(exams) {
    const list = document.getElementById('examListAdmin');

    if (exams.length === 0) {
        list.innerHTML = '<p class="no-data">No exams added yet</p>';
        return;
    }

    list.innerHTML = exams.map(exam => `
        <div class="admin-item">
            <div class="admin-item-header">
                <span class="admin-item-title">${exam.name}</span>
                <div class="admin-item-actions">
                    <button class="btn-delete" onclick="deleteExam('${exam.id}', '${exam.name}')">Delete</button>
                </div>
            </div>
            <div class="admin-item-content">
                <strong>Date:</strong> ${formatDate(exam.date)}<br>
                <strong>Details:</strong> ${exam.details}
                ${exam.link ? `<br><strong>Link:</strong> <a href="${exam.link}" target="_blank">${exam.link}</a>` : ''}
            </div>
        </div>
    `).join('');
}

async function deleteExam(examId, examName) {
    if (!isAdmin(currentUser.email)) {
        alert('You do not have permission to delete exams');
        return;
    }

    if (!confirm(`Are you sure you want to delete "${examName}"?`)) {
        return;
    }

    try {
        showLoading();
        await database.ref('exams/' + examId).remove();
        alert('Exam deleted successfully!');
        await loadAdminExams();
    } catch (error) {
        console.error('Error deleting exam:', error);
        alert('Failed to delete exam. Please try again.');
    } finally {
        hideLoading();
    }
}

async function loadExistingQuestions() {
    const subject = document.getElementById('filterSubject').value;
    const chapterId = document.getElementById('filterChapter').value;
    const questionsList = document.getElementById('questionsList');

    if (!subject) {
        alert('Please select a subject');
        return;
    }

    showLoading();

    try {
        let ref = database.ref('questions/' + subject);
        if (chapterId) {
            ref = ref.child(chapterId);
        }

        const snapshot = await ref.once('value');
        const questions = [];

        snapshot.forEach(childSnapshot => {
            if (chapterId) {
                questions.push({
                    id: childSnapshot.key,
                    chapterId: chapterId,
                    ...childSnapshot.val()
                });
            } else {
                // Multiple chapters
                childSnapshot.forEach(questionSnapshot => {
                    questions.push({
                        id: questionSnapshot.key,
                        chapterId: childSnapshot.key,
                        ...questionSnapshot.val()
                    });
                });
            }
        });

        if (questions.length === 0) {
            questionsList.innerHTML = '<p class="no-data">No questions found</p>';
        } else {
            questionsList.innerHTML = questions.map((q, index) => `
                <div class="admin-item">
                    <div class="admin-item-header">
                        <span class="admin-item-title">Q${index + 1}: ${q.question.substring(0, 80)}...</span>
                        <div class="admin-item-actions">
                            <button class="btn-delete" onclick="deleteQuestion('${subject}', '${q.chapterId}', '${q.id}')">Delete</button>
                        </div>
                    </div>
                    <div class="admin-item-content">
                        <strong>Year:</strong> ${q.year || 'N/A'}
                        ${q.shift ? ` | <strong>Shift:</strong> ${q.shift}` : ''}
                        ${q.difficulty ? ` | <strong>Difficulty:</strong> ${q.difficulty}` : ''}
                        ${q.subtopic ? ` | <strong>Subtopic:</strong> ${q.subtopic}` : ''}
                        <br>
                        <strong>Correct Answer:</strong> ${String.fromCharCode(65 + q.correctAnswer)}
                        ${q.detailedAnswer ? '<br><strong>Has Detailed Answer:</strong> Yes' : ''}
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading questions:', error);
        questionsList.innerHTML = '<p class="no-data">Error loading questions</p>';
    } finally {
        hideLoading();
    }
}

async function deleteQuestion(subject, chapterId, questionId) {
    if (!isAdmin(currentUser.email)) {
        alert('You do not have permission to delete questions');
        return;
    }

    if (!confirm('Are you sure you want to delete this question?')) {
        return;
    }

    try {
        showLoading();
        await database.ref('questions/' + subject + '/' + chapterId + '/' + questionId).remove();
        alert('Question deleted successfully!');
        await loadExistingQuestions();
    } catch (error) {
        console.error('Error deleting question:', error);
        alert('Failed to delete question. Please try again.');
    } finally {
        hideLoading();
    }
}


// Exam toggle stub — reads Firebase and updates cards if new HTML is present
async function loadExamToggles() {
    try {
        const snapshot = await database.ref('examToggles').once('value');
        const toggles = snapshot.val() || {};
        ['bitsat', 'viteee', 'mhtcet', 'met', 'nda'].forEach(examId => {
            const isEnabled = toggles[examId] === true;
            const card = document.getElementById('examCard-' + examId);
            const toggle = document.getElementById('toggle-' + examId);
            if (toggle) toggle.checked = isEnabled;
            if (card) {
                if (isEnabled) {
                    card.classList.remove('exam-card-disabled');
                    card.classList.add('exam-card-enabled');
                    const badge = card.querySelector('.exam-card-badge');
                    if (badge) { badge.className = 'exam-card-badge enabled-badge'; badge.textContent = 'Active'; }
                    const lock = card.querySelector('.exam-card-lock');
                    if (lock) { lock.outerHTML = '<div class=\"exam-card-arrow\">→</div>'; }
                } else {
                    card.classList.remove('exam-card-enabled');
                    card.classList.add('exam-card-disabled');
                    const badge = card.querySelector('.exam-card-badge');
                    if (badge) { badge.className = 'exam-card-badge disabled-badge'; badge.textContent = 'Coming Soon'; }
                    const arrow = card.querySelector('.exam-card-arrow');
                    if (arrow) { arrow.outerHTML = '<div class=\"exam-card-lock\">🔒</div>'; }
                }
            }
        });
    } catch (e) {
        console.warn('loadExamToggles skipped:', e.message);
    }
}

async function handleExamToggle(examId, enabled) {
    if (!isAdmin(currentUser.email)) return;
    try {
        await database.ref('examToggles/' + examId).set(enabled);
        await loadExamToggles();
    } catch (e) {
        console.error('Error saving exam toggle:', e);
        const t = document.getElementById('toggle-' + examId);
        if (t) t.checked = !enabled;
    }
}

// Make functions globally accessible for onclick handlers
window.deleteChapter = deleteChapter;
window.deleteExam = deleteExam;
window.deleteQuestion = deleteQuestion;

// ==================== AI PODCAST ====================

let podcastScriptArray = [];
let podcastCurrentLineIndex = 0;
let podcastAudioNode = null;
let podcastAudioUrl = null;
let podcastIsPlaying = false;
let podcastTotalDuration = 0;
let podcastElapsedOffset = 0;
let podcastLineDurations = [];
let podcastAbortController = null;
let podcastAudioCache = {};
let BACKEND_URL = localStorage.getItem('EDUPOD_BACKEND_URL');
if (!BACKEND_URL || BACKEND_URL.includes('127.0.0.1') || BACKEND_URL.includes('localhost')) {
    BACKEND_URL = window.location.port === '8080' ? '' : 'https://learnser-ai-backend.onrender.com';
    localStorage.setItem('EDUPOD_BACKEND_URL', BACKEND_URL);
}

const SARVAM_API_KEY = "sk_4rrt5bjm_3GMlfBpRrJ0bFhMGWYaLd5KB";

function initializePodcastListeners() {
    document.getElementById('generatePodcastBtn').addEventListener('click', generatePodcast);
    document.getElementById('backFromPodcastBtn').addEventListener('click', () => {
        resetPodcastPlayer();
        navigateToUrl('/home');
    });
    document.getElementById('podcastPlayPauseBtn').addEventListener('click', togglePodcastPlayback);
    document.getElementById('podcastSkipBack').addEventListener('click', () => skipPodcastAudio(-5));
    document.getElementById('podcastSkipForward').addEventListener('click', () => skipPodcastAudio(5));
    document.getElementById('podcastScrubber').addEventListener('input', (e) => onPodcastScrub(e.target.value));

    // Collapsible settings toggle
    const toggleBtn = document.getElementById('podcastSettingsToggleBtn');
    const settingsPanel = document.getElementById('podcastSettingsPanel');
    if (toggleBtn && settingsPanel) {
        toggleBtn.addEventListener('click', () => {
            const isHidden = settingsPanel.style.display === 'none';
            settingsPanel.style.display = isHidden ? 'block' : 'none';
        });
    }

    // Backend URL dynamic updates & persistent storage
    const backendUrlInput = document.getElementById('podcastBackendUrl');
    if (backendUrlInput) {
        backendUrlInput.value = BACKEND_URL;
        backendUrlInput.addEventListener('input', (e) => {
            let val = e.target.value.trim();
            if (val && val.endsWith('/')) val = val.slice(0, -1);
            BACKEND_URL = val;
            localStorage.setItem('EDUPOD_BACKEND_URL', val);
        });
    }
}

async function generatePodcast() {
    const topic = document.getElementById('podcastTopic').value.trim();
    const generateBtn = document.getElementById('generatePodcastBtn');
    const loadingStatus = document.getElementById('podcastLoading');
    const scriptDisplay = document.getElementById('podcastScriptDisplay');
    const errorDisplay = document.getElementById('podcastError');
    const playerPanel = document.getElementById('podcastPlayerPanel');

    if (!topic) { showPodcastError('Please type a topic first.'); return; }

    // Unlock audio element to bypass browser autoplay policies
    if (!podcastAudioNode) podcastAudioNode = new Audio();
    podcastAudioNode.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    podcastAudioNode.play().catch(e => {});
    podcastAudioNode.pause();

    resetPodcastPlayer();
    try {
        await fetch(BACKEND_URL + '/purge-cache', { method: 'POST' });
    } catch (e) {
        console.log("Cache clear unavailable.");
    }

    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    loadingStatus.style.display = 'flex';
    scriptDisplay.style.display = 'none';
    errorDisplay.style.display = 'none';
    scriptDisplay.innerHTML = '';
    const loadingText = document.getElementById('podcastLoadingText');
    if (loadingText) loadingText.textContent = 'Writing highly energetic, conversational script...';

    const systemPrompt = `You are an expert audio dramatist and academic curriculum designer specializing in high-engagement educational podcasts. Your goal is to convert technical study notes into a flawless, high-retention audio script.

### 1. FIXED CHARACTER PERSONAS
* **HOST A (The Expert/Anchor):** A brilliant, clear-headed educator. Paces the conversation, uses vivid real-world analogies, but remains razor-focused on exam-relevant conceptual clarity. Never lectures continuously.
* **HOST B (The Student):** Active learner, inquisitive, relatable. Interjects with clarifying questions, calls out common exam traps, and connects concepts back to high-yield test points.

### 2. SYLLABUS-TO-NARRATIVE MAPPING & SOURCE BOUNDARY
* Transform raw technical data into a structured storytelling arc: Hook -> Core Concept -> Structural Breakdown -> Common Exam Mistakes -> Final Synthesis.
* **Strict Source Boundary:** Stick 100% strictly to the core scientific/technical reality of the topic provided.
* **Keyword Preservation:** NEVER replace or over-simplify mandatory scientific/technical keywords.

### 3. ANTI-ESSAY BAN LIST
ABSOLUTELY BAN: "Furthermore", "Moreover", "In conclusion", "As stated previously", "Let us look at", "Hence", "Therefore, we can see".
Replace with: "Wait, so...", "Which means...", "Here's the catch...", "Think of it like this...", "Right, but what about...".

### 4. PHONETIC FORMULA HANDLING
Write out phonetic pronunciation for equations and math symbols as they should be spoken aloud.

### 5. COGNITIVE OVERLOAD PREVENTION
HOST A must NEVER speak more than 3 consecutive sentences without HOST B interrupting.

### 6. NATURAL VOICE MODULATION VIA PUNCTUATION (NO TAGS)
ABSOLUTELY BAN all bracketed tags like "[excited]", "[laughs]", "[pause]".
Use em-dashes, ellipses, exclamation marks, and organic transitions for natural inflection.

### 7. STUDENT TRAPS & EXAM PITFALLS
HOST B must proactively bring up common student doubts and classic exam traps.

### 8. HIGH-RETENTION COMPACT RECAP
Include a clear summary segment at the end.

### OUTPUT FORMAT
Return strictly valid raw JSON.
* Follow this exact schema:
{
  "script": [
    { "speaker": "HOST A", "text": "..." },
    { "speaker": "HOST B", "text": "..." }
  ]
}
* Each object in the "script" array must have "speaker" first and "text" second.
* NEVER use double quotes (") inside the "text" values. For quotes, dialogue, or emphasis, always use single quotes (') instead.`;

    const userPrompt = `Write an educational podcast script about "${topic}" using simple English and vivid Indian analogies. Make it highly engaging, lively, and conversational.`;

    try {
        const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SARVAM_API_KEY}`
            },
            body: JSON.stringify({
                model: "sarvam-30b",
                messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
                temperature: 0.65,
                max_tokens: 4096,
                reasoning_effort: null,
                stream: true
            })
        });

        if (!response.ok) throw new Error(`Sarvam LLM returned error status: ${response.status}`);

        // Stream the SSE chunks to avoid proxy 504 timeout
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulated = '';
        let buffer = '';
        let chunkCount = 0;
        const loadingTextEl = document.getElementById('podcastLoadingText');

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                if (buffer) {
                    const trimmed = buffer.trim();
                    if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
                        try {
                            const delta = JSON.parse(trimmed.slice(6))?.choices?.[0]?.delta?.content;
                            if (delta) accumulated += delta;
                        } catch (e) {}
                    }
                }
                break;
            }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === 'data: [DONE]') continue;
                if (!trimmed.startsWith('data: ')) continue;
                try {
                    const delta = JSON.parse(trimmed.slice(6))?.choices?.[0]?.delta?.content;
                    if (delta) {
                        accumulated += delta;
                        chunkCount++;
                        if (chunkCount % 10 === 0 && loadingTextEl) {
                            loadingTextEl.textContent = `Streaming script... (${accumulated.length} chars received)`;
                        }
                    }
                } catch (e) { console.error("SSE parse error", e, trimmed); }
            }
        }

        if (loadingTextEl) loadingTextEl.textContent = 'Processing script...';

        if (accumulated.includes('</think>')) {
            accumulated = accumulated.split('</think>')[1].trim();
        }

        const firstBraceIndex = accumulated.indexOf('{');
        if (firstBraceIndex === -1) {
            throw new Error("No valid JSON found in model response.");
        }

        let braceCount = 0;
        let inString = false;
        let escaping = false;
        let rawContent = null;

        for (let i = firstBraceIndex; i < accumulated.length; i++) {
            const char = accumulated[i];
            if (escaping) {
                escaping = false;
            } else if (char === '\\') {
                escaping = true;
            } else if (char === '"') {
                inString = !inString;
            } else if (!inString) {
                if (char === '{') {
                    braceCount++;
                } else if (char === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                        rawContent = accumulated.substring(firstBraceIndex, i + 1);
                        break;
                    }
                }
            }
        }

        if (!rawContent) {
            console.warn("Brace-counting failed (possibly due to unescaped quotes). Attempting fallback recovery...");
            const lastBraceIndex = accumulated.lastIndexOf('}');
            if (lastBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
                rawContent = accumulated.substring(firstBraceIndex, lastBraceIndex + 1);
            }
        }

        if (!rawContent) {
            throw new Error("Unable to parse JSON string. The model response was incomplete.");
        }
        rawContent = rawContent.replace(/[\u0000-\u001F\u007F-\u009F]/g, c =>
            ['\n', '\r', '\t'].includes(c) ? c : ''
        );
        rawContent = rawContent.replace(/,\s*\]/g, "]").replace(/,\s*\}/g, "}");

        // Repair unescaped double quotes inside text values
        let repairedContent = "";
        let currentIndex = 0;
        while (currentIndex < rawContent.length) {
            const match = rawContent.substring(currentIndex).match(/"text"\s*:\s*"/);
            if (!match) {
                repairedContent += rawContent.substring(currentIndex);
                break;
            }
            const matchIndex = currentIndex + match.index;
            const valueStartIndex = matchIndex + match[0].length;
            repairedContent += rawContent.substring(currentIndex, valueStartIndex);

            let trueEndQuoteIndex = -1;
            let searchIndex = valueStartIndex;
            while (searchIndex < rawContent.length) {
                const nextQuote = rawContent.indexOf('"', searchIndex);
                if (nextQuote === -1) break;
                const afterQuote = rawContent.substring(nextQuote + 1).trimStart();
                if (/^[}\]]/.test(afterQuote) || /^,/.test(afterQuote)) {
                    trueEndQuoteIndex = nextQuote;
                    break;
                }
                searchIndex = nextQuote + 1;
            }

            if (trueEndQuoteIndex === -1) {
                repairedContent += rawContent.substring(valueStartIndex);
                break;
            }

            const rawValue = rawContent.substring(valueStartIndex, trueEndQuoteIndex);
            const escapedValue = rawValue.replace(/\\"/g, '"').replace(/"/g, '\\"');
            repairedContent += escapedValue;
            currentIndex = trueEndQuoteIndex;
        }
        rawContent = repairedContent;

        const parsedData = JSON.parse(rawContent);
        if (!parsedData.script || !Array.isArray(parsedData.script)) {
            throw new Error("JSON was parsed but did not contain a valid script array.");
        }

        podcastScriptArray = parsedData.script;
        renderPodcastScript(podcastScriptArray);

        podcastTotalDuration = 0;
        podcastLineDurations = [];
        podcastScriptArray.forEach(line => {
            let duration = line.type === 'direction' ? 0 : Math.max(3.0, line.text.length * 0.085);
            podcastLineDurations.push(duration);
            podcastTotalDuration += duration;
        });

        document.getElementById('podcastTotalTime').textContent = formatPodcastTimestamp(podcastTotalDuration);
        document.getElementById('podcastScrubber').max = Math.floor(podcastTotalDuration);

        // Save to history in Firebase
        if (currentUser) {
            database.ref(`podcastHistory/${currentUser.uid}`).push({
                topic: topic,
                timestamp: new Date().toISOString(),
                script: podcastScriptArray
            }).then(() => {
                loadPodcastHistory();
            }).catch(err => {
                console.error("Error saving podcast history:", err);
            });
        }

        loadingStatus.style.display = 'none';
        playerPanel.style.display = 'flex';

        await playPodcastLine(0, 0);

    } catch (error) {
        showPodcastError(`Generation Failure: ${error.message}`);
        loadingStatus.style.display = 'none';
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = '🎙️ Generate Podcast';
    }
}

function renderPodcastScript(scriptArray) {
    const display = document.getElementById('podcastScriptDisplay');
    display.style.display = 'block';
    display.innerHTML = '';
    scriptArray.forEach((line, index) => {
        const lineDiv = document.createElement('div');
        lineDiv.id = `podcast-line-${index}`;
        if (line.type === 'direction') {
            lineDiv.className = 'podcast-line podcast-stage-direction';
            lineDiv.textContent = line.text;
        } else {
            const speakerName = line.speaker || "HOST A";
            const isHostA = speakerName.toUpperCase() === 'HOST A';
            lineDiv.className = `podcast-line ${isHostA ? 'podcast-host-a' : 'podcast-host-b'}`;
            lineDiv.innerHTML = `<div class="podcast-speaker-name">${speakerName}</div><div>${line.text || ''}</div>`;
        }
        display.appendChild(lineDiv);
    });
}

async function fetchTTSForLine(text, speaker, index, signal) {
    try {
        const response = await fetch(BACKEND_URL + '/stream-line', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ speaker: speaker, text: text, index: index }),
            signal: signal
        });

        if (!response.ok) throw new Error("Local TTS Generation Failed.");
        
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (e) {
        if (window.location.protocol === 'https:' && (BACKEND_URL.startsWith('http://127.0.0.1') || BACKEND_URL.startsWith('http://localhost'))) {
            throw new Error(`Mixed Content Block: Cannot connect to insecure local server (${BACKEND_URL}) from a secure HTTPS website (Netlify). You must use an HTTPS tunnel (like ngrok) or deploy your python backend to a hosting service that supports HTTPS (such as Render or Railway). Click 'Backend Settings' to set your secure backend URL.`);
        }
        throw e;
    }
}

async function playPodcastLine(index, seekOffsetSeconds = 0) {
    if (podcastAbortController) { podcastAbortController.abort(); }
    podcastAbortController = new AbortController();
    const signal = podcastAbortController.signal;

    if (index >= podcastScriptArray.length) {
        resetPodcastPlayer();
        return;
    }

    podcastCurrentLineIndex = index;
    const line = podcastScriptArray[index];

    if (line.type === 'direction' || !line.text) {
        if (!signal.aborted) playPodcastLine(index + 1);
        return;
    }

    clearPodcastHighlighting();
    const lineDiv = document.getElementById(`podcast-line-${index}`);
    if (lineDiv) {
        lineDiv.classList.add('podcast-playing-line');
        lineDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    podcastElapsedOffset = 0;
    for (let i = 0; i < index; i++) {
        podcastElapsedOffset += podcastLineDurations[i];
    }

    try {
        let audioUrl = podcastAudioCache[index];
        if (!audioUrl) {
            audioUrl = await fetchTTSForLine(line.text, line.speaker || 'HOST A', index, signal);
            podcastAudioCache[index] = audioUrl;
        }

        if (signal.aborted) return;

        if (!podcastAudioNode) podcastAudioNode = new Audio();
        podcastAudioNode.pause();
        podcastAudioNode.ontimeupdate = null;
        podcastAudioNode.onended = null;

        podcastAudioNode.src = audioUrl;
        podcastAudioNode.load();
        podcastIsPlaying = true;
        document.getElementById('podcastPlayPauseBtn').textContent = '⏸';

        podcastAudioNode.ontimeupdate = () => {
            if (signal.aborted) return;
            const absoluteTime = podcastElapsedOffset + podcastAudioNode.currentTime;
            document.getElementById('podcastCurrentTime').textContent = formatPodcastTimestamp(absoluteTime);
            document.getElementById('podcastScrubber').value = Math.floor(absoluteTime);
        };

        podcastAudioNode.onended = () => {
            if (!signal.aborted) playPodcastLine(index + 1);
        };

        podcastAudioNode.addEventListener('loadedmetadata', () => {
            if (seekOffsetSeconds > 0 && seekOffsetSeconds <= podcastAudioNode.duration) {
                podcastAudioNode.currentTime = seekOffsetSeconds;
            }
        });

        await podcastAudioNode.play();
        prefetchPodcastLine(index + 1);

    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error(err);
            showPodcastError(`Audio Playback Error: ${err.message}`);
            const loadingStatus = document.getElementById('podcastLoading');
            if (loadingStatus) loadingStatus.style.display = 'none';
        }
    }
}

async function prefetchPodcastLine(nextIndex) {
    if (nextIndex >= podcastScriptArray.length) return;
    const nextLine = podcastScriptArray[nextIndex];
    if (nextLine.type === 'direction' || !nextLine.text) return;

    if (podcastAudioCache[nextIndex]) return;

    try {
        const audioUrl = await fetchTTSForLine(nextLine.text, nextLine.speaker || 'HOST A', nextIndex);
        podcastAudioCache[nextIndex] = audioUrl;
    } catch (err) {
        console.warn("Prefetch failed for index", nextIndex, err);
    }
}

function togglePodcastPlayback() {
    if (!podcastAudioNode) return;
    const btn = document.getElementById('podcastPlayPauseBtn');
    if (podcastIsPlaying) {
        podcastAudioNode.pause();
        podcastIsPlaying = false;
        btn.textContent = '▶';
    } else {
        podcastAudioNode.play();
        podcastIsPlaying = true;
        btn.textContent = '⏸';
    }
}

function skipPodcastAudio(seconds) {
    if (!podcastAudioNode) return;
    let targetTime = podcastAudioNode.currentTime + seconds;

    if (targetTime >= 0 && targetTime <= podcastAudioNode.duration) {
        podcastAudioNode.currentTime = targetTime;
    } else {
        let currentAbsTime = podcastElapsedOffset + podcastAudioNode.currentTime;
        onPodcastScrub(currentAbsTime + seconds);
    }
}

function onPodcastScrub(value) {
    let targetAbsTime = parseFloat(value);
    let accumulatedTime = 0;
    let matchedIndex = 0;

    for (let i = 0; i < podcastLineDurations.length; i++) {
        if (targetAbsTime >= accumulatedTime && targetAbsTime <= accumulatedTime + podcastLineDurations[i]) {
            matchedIndex = i;
            break;
        }
        accumulatedTime += podcastLineDurations[i];
    }

    let insideLineOffset = targetAbsTime - accumulatedTime;
    podcastElapsedOffset = accumulatedTime;
    playPodcastLine(matchedIndex, insideLineOffset);
}

function resetPodcastPlayer() {
    if (podcastAbortController) { podcastAbortController.abort(); }
    if (podcastAudioNode) {
        podcastAudioNode.pause();
        podcastAudioNode.ontimeupdate = null;
        podcastAudioNode.onended = null;
        // Do not set to null, keep it unlocked
    }
    if (podcastAudioUrl) { URL.revokeObjectURL(podcastAudioUrl); podcastAudioUrl = null; }
    if (podcastAudioCache) {
        Object.values(podcastAudioCache).forEach(url => URL.revokeObjectURL(url));
        podcastAudioCache = {};
    }
    podcastIsPlaying = false;
    podcastCurrentLineIndex = 0;
    podcastElapsedOffset = 0;

    const playerPanel = document.getElementById('podcastPlayerPanel');
    if (playerPanel) playerPanel.style.display = 'none';

    const playBtn = document.getElementById('podcastPlayPauseBtn');
    if (playBtn) playBtn.textContent = '▶';

    const scrubber = document.getElementById('podcastScrubber');
    if (scrubber) scrubber.value = 0;

    const currentTime = document.getElementById('podcastCurrentTime');
    if (currentTime) currentTime.textContent = '0:00';

    clearPodcastHighlighting();
}

function formatPodcastTimestamp(secs) {
    const minutes = Math.floor(secs / 60) || 0;
    const seconds = Math.floor(secs % 60) || 0;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function clearPodcastHighlighting() {
    document.querySelectorAll('.podcast-playing-line').forEach(el => el.classList.remove('podcast-playing-line'));
}

function showPodcastError(message) {
    const errorDisplay = document.getElementById('podcastError');
    errorDisplay.style.display = 'block';
    errorDisplay.textContent = `Error: ${message}`;
}

// ==================== UTILITY FUNCTIONS ====================

function showLoading() {
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// ==================== CORE CUSTOM TEST & BOOKMARKS ENGINE ====================

let currentUserBookmarks = {};
let currentExamQuestions = [];
let currentExamQuestionIndex = 0;
let examAnswers = [];
let examQuestionStatuses = []; // 'notvisited', 'unanswered', 'answered', 'review'
let examQuestionTimes = []; // Time spent in seconds per question
let examTimerInterval = null;
let examSecondsRemaining = 0;
let examTabSwitchCount = 0;
let activeQuestionStartTime = null;
let isExamActive = false;

// Selected chapters for the custom test wizard
let wizardSelectedChapters = {
    physics: [],
    chemistry: [],
    mathematics: []
};

// Available years for custom selection
const WIZARD_AVAILABLE_YEARS = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019'];

function initializeCustomTestListeners() {
    safeOn('customTestNavLink', 'click', (e) => { e.preventDefault(); navigateToUrl('/custom-test'); });
    safeOn('homeCustomTestBanner', 'click', () => navigateToUrl('/custom-test'));
    safeOn('btnCancelCustomTest', 'click', () => navigateToUrl('/home'));
    safeOn('btnResultsBackHome', 'click', () => navigateToUrl('/home'));

    // Accordion headers
    ['physics', 'chemistry', 'mathematics'].forEach(subject => {
        const header = document.querySelector(`#${subject}Accordion .subject-accordion-header`);
        if (header) {
            header.addEventListener('click', (e) => {
                // Avoid toggling if "SHOW UNITS" button is clicked
                if (e.target.classList.contains('btn-show-units')) return;
                toggleAccordion(subject);
            });
        }

        const showUnitsBtn = document.querySelector(`#${subject}Accordion .btn-show-units`);
        if (showUnitsBtn) {
            showUnitsBtn.addEventListener('click', () => toggleAccordion(subject));
        }

        // Accordion select all/none
        document.querySelectorAll(`.btn-link-select[data-subject="${subject}"]`).forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                setAccordionSelections(subject, action === 'all');
            });
        });
    });

    // Test Source selectors
    document.querySelectorAll('.source-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.source-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            updateWizardSummary();
        });
    });

    // Question count pills
    document.querySelectorAll('.count-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.count-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            updateWizardSummary();
        });
    });

    // Test Duration adjusters
    safeOn('btnDurationDec', 'click', () => adjustDuration(-5));
    safeOn('btnDurationInc', 'click', () => adjustDuration(5));

    // Year selection card selectors
    document.querySelectorAll('.year-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.year-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            // Hide custom years panel if not selected
            const customYearsPanel = document.getElementById('customYearsPanel');
            if (customYearsPanel) customYearsPanel.style.display = 'none';
            updateWizardSummary();
        });
    });

    // Custom years panel toggle
    safeOn('btnCustomYears', 'click', () => {
        document.querySelectorAll('.year-card').forEach(c => c.classList.remove('active'));
        const panel = document.getElementById('customYearsPanel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
        updateWizardSummary();
    });

    // Start Test button
    safeOn('btnStartCustomTest', 'click', startCustomTest);

    // Fullscreen exit blocker resume button
    safeOn('btnResumeFullscreen', 'click', enterFullscreenMode);

    // Exam navigations
    safeOn('btnExamClear', 'click', handleExamClear);
    safeOn('btnExamMarkReview', 'click', handleExamMarkReview);
    safeOn('btnExamPrev', 'click', handleExamPrev);
    safeOn('btnExamSaveNext', 'click', handleExamSaveNext);
    safeOn('btnSubmitExam', 'click', () => {
        if (confirm("Are you sure you want to submit the test?")) {
            submitCustomExam('manual');
        }
    });

    // Bookmark active question inside test
    safeOn('btnBookmarkActiveQuestion', 'click', handleExamBookmarkActive);

    // Fullscreen listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Tab switch listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Results Tab listener
    document.querySelectorAll('.results-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.results-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const selectedTab = btn.dataset.tab;
            document.getElementById('tabContent-ai-review').style.display = selectedTab === 'ai-review' ? 'block' : 'none';
            document.getElementById('tabContent-questions-review').style.display = selectedTab === 'questions-review' ? 'block' : 'none';
        });
    });
}

// --- BOOKMARKS ---

async function toggleQuestionBookmark(btnEl, questionId) {
    if (!currentUser) return;
    const isActive = btnEl.classList.contains('active');
    try {
        if (isActive) {
            await database.ref(`bookmarks/${currentUser.uid}/${questionId}`).remove();
            btnEl.classList.remove('active');
            currentUserBookmarks[questionId] = null;
        } else {
            await database.ref(`bookmarks/${currentUser.uid}/${questionId}`).set(true);
            btnEl.classList.add('active');
            currentUserBookmarks[questionId] = true;
        }
        alert(isActive ? 'Removed from bookmarks' : 'Added to bookmarks!');
    } catch (error) {
        console.error('Error toggling bookmark:', error);
    }
}

// --- CUSTOM TEST WIZARD ---

async function loadCustomTestWizard() {
    showLoading();
    wizardSelectedChapters = { physics: [], chemistry: [], mathematics: [] };
    
    // Clear selections
    ['physics', 'chemistry', 'mathematics'].forEach(sub => {
        const grid = document.getElementById(`${sub}ChaptersGrid`);
        if (grid) grid.innerHTML = '';
        const countLabel = document.getElementById(`${sub}SelectedCount`);
        if (countLabel) countLabel.textContent = '0 Chapters Selected';
        
        const content = document.getElementById(`${sub}AccordionContent`);
        if (content) content.style.display = 'none';
    });

    // Populate Custom Years list
    const yearsGrid = document.getElementById('customYearsGrid');
    if (yearsGrid) {
        yearsGrid.innerHTML = WIZARD_AVAILABLE_YEARS.map(yr => `
            <label class="year-checkbox-label">
                <input type="checkbox" class="wizard-year-checkbox" value="${yr}" checked>
                <span>${yr}</span>
            </label>
        `).join('');
        
        document.querySelectorAll('.wizard-year-checkbox').forEach(cb => {
            cb.addEventListener('change', updateWizardSummary);
        });
    }

    try {
        // Fetch chapters for all subjects
        const subjects = ['physics', 'chemistry', 'mathematics'];
        for (const sub of subjects) {
            const snapshot = await database.ref('chapters/' + sub).orderByChild('order').once('value');
            const chapters = [];
            snapshot.forEach(snap => {
                chapters.push({ id: snap.key, ...snap.val() });
            });
            
            const grid = document.getElementById(`${sub}ChaptersGrid`);
            if (grid) {
                if (chapters.length === 0) {
                    grid.innerHTML = '<p class="no-data">No chapters available</p>';
                } else {
                    grid.innerHTML = chapters.map(ch => `
                        <label class="chapter-checkbox-label">
                            <input type="checkbox" class="wizard-chapter-checkbox" data-subject="${sub}" value="${ch.id}">
                            <span>${ch.name}</span>
                        </label>
                    `).join('');
                }
            }
        }

        // Set change listener on checkboxes
        document.querySelectorAll('.wizard-chapter-checkbox').forEach(cb => {
            cb.addEventListener('change', function() {
                const sub = this.dataset.subject;
                const chId = this.value;
                if (this.checked) {
                    if (!wizardSelectedChapters[sub].includes(chId)) wizardSelectedChapters[sub].push(chId);
                } else {
                    wizardSelectedChapters[sub] = wizardSelectedChapters[sub].filter(id => id !== chId);
                }
                
                // Update count label
                const countLabel = document.getElementById(`${sub}SelectedCount`);
                if (countLabel) {
                    countLabel.textContent = `${wizardSelectedChapters[sub].length} Chapters Selected`;
                }
                updateWizardSummary();
            });
        });

        // Toggle first accordion by default
        toggleAccordion('physics');
        updateWizardSummary();
        showPage('customTestWizard');

    } catch (e) {
        console.error("Error launching custom test creator:", e);
        alert("Failed to load chapters for custom test configuration.");
    } finally {
        hideLoading();
    }
}

function toggleAccordion(subject) {
    ['physics', 'chemistry', 'mathematics'].forEach(sub => {
        const content = document.getElementById(`${sub}AccordionContent`);
        if (content) {
            content.style.display = (sub === subject && content.style.display === 'none') ? 'block' : 'none';
        }
    });
}

function setAccordionSelections(subject, selectAll) {
    document.querySelectorAll(`.wizard-chapter-checkbox[data-subject="${subject}"]`).forEach(cb => {
        cb.checked = selectAll;
        // Trigger manual change event to sync array
        cb.dispatchEvent(new Event('change'));
    });
}

function adjustDuration(minutes) {
    const el = document.getElementById('durationValue');
    if (!el) return;
    let val = parseInt(el.textContent) + minutes;
    if (val < 5) val = 5;
    if (val > 300) val = 300;
    el.textContent = val;
}

function updateWizardSummary() {
    // Count active subjects
    let activeSubjects = 0;
    let totalChapters = 0;
    ['physics', 'chemistry', 'mathematics'].forEach(sub => {
        if (wizardSelectedChapters[sub].length > 0) {
            activeSubjects++;
            totalChapters += wizardSelectedChapters[sub].length;
        }
    });

    const activeCountPill = document.querySelector('.count-pill.active');
    const qsPerSubject = activeCountPill ? parseInt(activeCountPill.dataset.count) : 30;
    const totalQs = activeSubjects * qsPerSubject;

    const totalQsSummary = document.getElementById('wizardTotalQsSummary');
    if (totalQsSummary) {
        totalQsSummary.textContent = `Total Questions: ${totalQs} (${qsPerSubject} Qs x ${activeSubjects} Subject${activeSubjects !== 1 ? 's' : ''})`;
    }

    const recTime = totalQs * 2; // Recommended is 2 minutes per question
    const recLabel = document.getElementById('wizardDurationRecommendation');
    if (recLabel) {
        recLabel.textContent = `Recommended Time: ${recTime} min`;
    }

    // Auto update selected value in UI on load
    const durationVal = document.getElementById('durationValue');
    if (durationVal && (durationVal.textContent === '180' || durationVal.dataset.autoSync === 'true')) {
        durationVal.textContent = recTime > 0 ? recTime : 60;
        durationVal.dataset.autoSync = 'true';
    }
}

// --- BALANCING & GENERATING TEST ---

async function startCustomTest() {
    let selectedSubjects = [];
    let selectedChaptersList = {};
    let totalSelectedChapters = 0;

    ['physics', 'chemistry', 'mathematics'].forEach(sub => {
        if (wizardSelectedChapters[sub].length > 0) {
            selectedSubjects.push(sub);
            selectedChaptersList[sub] = wizardSelectedChapters[sub];
            totalSelectedChapters += wizardSelectedChapters[sub].length;
        }
    });

    if (selectedSubjects.length === 0) {
        alert("Please select at least one subject and check chapters to start the test.");
        return;
    }

    showLoading();

    try {
        // Fetch attempt history and bookmarks
        let attemptHistory = {};
        if (currentUser) {
            const historySnapshot = await database.ref(`results/${currentUser.uid}/questions`).once('value');
            historySnapshot.forEach(snap => {
                const val = snap.val();
                if (val.questionId) {
                    attemptHistory[val.questionId] = val;
                }
            });
        }

        let bookmarkedMap = {};
        if (currentUser) {
            const bookmarksSnapshot = await database.ref(`bookmarks/${currentUser.uid}`).once('value');
            bookmarkedMap = bookmarksSnapshot.val() || {};
        }

        const syllabusFilter = document.getElementById('wizardSyllabusToggle').checked;
        
        // Determine selected years filter
        let yearsFilter = [];
        const activeYearCard = document.querySelector('.year-card.active');
        if (activeYearCard) {
            const yrOption = activeYearCard.dataset.years;
            if (yrOption !== 'all') {
                const currentYear = new Date().getFullYear();
                const limit = parseInt(yrOption);
                for (let i = 0; i < limit; i++) {
                    yearsFilter.push(String(currentYear - i));
                }
            }
        } else {
            // Read checkboxes from custom years
            document.querySelectorAll('.wizard-year-checkbox:checked').forEach(cb => {
                yearsFilter.push(cb.value);
            });
        }

        // Test source option
        const activeSourceCard = document.querySelector('.source-card.active');
        const testSource = activeSourceCard ? activeSourceCard.dataset.source : 'all';

        // Get count per subject
        const activeCountPill = document.querySelector('.count-pill.active');
        const questionsNeededPerSubject = activeCountPill ? parseInt(activeCountPill.dataset.count) : 30;

        currentExamQuestions = [];

        // Fetch and process questions for each subject
        for (const sub of selectedSubjects) {
            let allSubjectQuestions = [];

            for (const chId of selectedChaptersList[sub]) {
                const snapshot = await database.ref(`questions/${sub}/${chId}`).once('value');
                snapshot.forEach(snap => {
                    allSubjectQuestions.push({
                        id: snap.key,
                        subject: sub,
                        chapterId: chId,
                        ...snap.val()
                    });
                });
            }

            // Apply filters
            let filteredQuestions = allSubjectQuestions.filter(q => {
                // Out of syllabus filter
                if (syllabusFilter && (q.outOfSyllabus === true || q.syllabus === "out")) return false;
                
                // Years filter
                if (yearsFilter.length > 0 && q.year && !yearsFilter.includes(String(q.year))) return false;

                // Source filters
                if (testSource === 'incorrect') {
                    // Question must have been attempted and last attempt incorrect
                    return attemptHistory[q.id] && attemptHistory[q.id].correct === false;
                } else if (testSource === 'unattempted') {
                    // Question must never have been attempted
                    return !attemptHistory[q.id];
                } else if (testSource === 'bookmarked') {
                    // Question must be bookmarked
                    return bookmarkedMap[q.id] === true;
                }
                
                return true;
            });

            if (filteredQuestions.length === 0) {
                continue;
            }

            // Balancing Algorithm: Select balanced mix of difficulties for medium paper (30% Easy, 50% Medium, 20% Hard)
            let easyQs = filteredQuestions.filter(q => (q.difficulty || '').toLowerCase() === 'easy');
            let mediumQs = filteredQuestions.filter(q => (q.difficulty || '').toLowerCase() === 'medium' || !q.difficulty);
            let hardQs = filteredQuestions.filter(q => (q.difficulty || '').toLowerCase() === 'hard');

            // Target counts
            const targetEasy = Math.round(questionsNeededPerSubject * 0.3);
            const targetMedium = Math.round(questionsNeededPerSubject * 0.5);
            const targetHard = questionsNeededPerSubject - targetEasy - targetMedium;

            let selectedQs = [];

            // Random draw helper
            const drawRandom = (arr, count) => {
                let shuffled = [...arr].sort(() => 0.5 - Math.random());
                return shuffled.slice(0, count);
            };

            let drawnEasy = drawRandom(easyQs, targetEasy);
            let drawnMedium = drawRandom(mediumQs, targetMedium);
            let drawnHard = drawRandom(hardQs, targetHard);

            selectedQs = [...drawnEasy, ...drawnMedium, ...drawnHard];

            // If we don't have enough balanced questions, fill up with any available filtered questions from the subject
            if (selectedQs.length < questionsNeededPerSubject && filteredQuestions.length > selectedQs.length) {
                const selectedIds = new Set(selectedQs.map(q => q.id));
                const remainingPool = filteredQuestions.filter(q => !selectedIds.has(q.id));
                const extraNeeded = questionsNeededPerSubject - selectedQs.length;
                const extraDrawn = drawRandom(remainingPool, extraNeeded);
                selectedQs = [...selectedQs, ...extraDrawn];
            }

            // Shuffle final selected list for this subject so order is mixed
            selectedQs.sort(() => 0.5 - Math.random());
            currentExamQuestions = [...currentExamQuestions, ...selectedQs];
        }

        if (currentExamQuestions.length === 0) {
            alert("No questions found matching your filter criteria. Try selecting more chapters or widening your year range.");
            hideLoading();
            return;
        }

        // Initialize exam state
        currentExamQuestionIndex = 0;
        examAnswers = new Array(currentExamQuestions.length).fill(null);
        examQuestionStatuses = new Array(currentExamQuestions.length).fill('notvisited');
        examQuestionStatuses[0] = 'unanswered'; // First question is visited but not answered
        examQuestionTimes = new Array(currentExamQuestions.length).fill(0);
        examTabSwitchCount = 0;
        
        // Start timers
        const durationDisplay = document.getElementById('durationValue');
        examSecondsRemaining = (durationDisplay ? parseInt(durationDisplay.textContent) : 180) * 60;
        
        // Set info badges
        const subBadgeText = selectedSubjects.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" + ");
        document.getElementById('examSubjectBadge').textContent = subBadgeText;
        
        const tabWarning = document.getElementById('examTabSwitchWarning');
        if (tabWarning) {
            tabWarning.style.display = 'none';
            tabWarning.textContent = 'Tab Switch Warning: 0/3';
        }

        // Start exam
        isExamActive = true;
        activeQuestionStartTime = Date.now();
        
        startExamTimer();
        renderExamQuestion();
        renderExamPalette();
        
        // Launch into fullscreen
        navigateToUrl('/custom-test/exam');
        enterFullscreenMode();

    } catch (e) {
        console.error("Error creating custom test:", e);
        alert("An error occurred during test setup. Please check the database.");
    } finally {
        hideLoading();
    }
}

// --- EXAM WORKSPACE CONTROLLER ---

function startExamTimer() {
    if (examTimerInterval) clearInterval(examTimerInterval);
    
    updateTimerDisplay();
    
    examTimerInterval = setInterval(() => {
        examSecondsRemaining--;
        updateTimerDisplay();
        
        if (examSecondsRemaining <= 0) {
            clearInterval(examTimerInterval);
            alert("Time's up! Your answers are being submitted.");
            submitCustomExam('timeout');
        }
    }, 1000);
}

function updateTimerDisplay() {
    const el = document.getElementById('examTimer');
    if (!el) return;
    
    const h = Math.floor(examSecondsRemaining / 3600);
    const m = Math.floor((examSecondsRemaining % 3600) / 60);
    const s = examSecondsRemaining % 60;
    
    let timeStr = "";
    if (h > 0) {
        timeStr += `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    } else {
        timeStr += `${m}:${s < 10 ? '0' : ''}${s}`;
    }
    el.textContent = timeStr;
}

function renderExamQuestion() {
    if (!currentExamQuestions || currentExamQuestions.length === 0) return;
    
    const question = currentExamQuestions[currentExamQuestionIndex];
    
    // Update labels
    document.getElementById('examQuestionNumber').textContent = `Question ${currentExamQuestionIndex + 1}`;
    
    const diffTag = document.getElementById('examQuestionDifficulty');
    if (diffTag) {
        diffTag.textContent = question.difficulty || 'Medium';
        diffTag.className = `difficulty-tag ${(question.difficulty || 'Medium').toLowerCase()}`;
    }
    
    const subTag = document.getElementById('examQuestionSubject');
    if (subTag) {
        subTag.textContent = (question.subject || 'Physics').toUpperCase();
    }
    
    // Update Bookmark active state
    const bookmarkBtn = document.getElementById('btnBookmarkActiveQuestion');
    if (bookmarkBtn) {
        const isBookmarked = currentUserBookmarks[question.id] === true;
        if (isBookmarked) {
            bookmarkBtn.classList.add('active');
        } else {
            bookmarkBtn.classList.remove('active');
        }
    }

    // Question body
    document.getElementById('examQuestionText').textContent = question.question;

    // Options container
    const optionsContainer = document.getElementById('examOptionsContainer');
    const selectedAns = examAnswers[currentExamQuestionIndex];
    
    optionsContainer.innerHTML = question.options.map((opt, idx) => {
        const isSelected = selectedAns === idx;
        return `
            <button class="option-btn-exam ${isSelected ? 'selected' : ''}" data-idx="${idx}">
                <div class="option-letter-box">${String.fromCharCode(65 + idx)}</div>
                <span>${opt}</span>
            </button>
        `;
    }).join('');

    // Bind option click listeners
    document.querySelectorAll('.option-btn-exam').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.idx);
            selectExamOption(idx);
        });
    });

    // Save visited start time
    activeQuestionStartTime = Date.now();
}

function selectExamOption(idx) {
    examAnswers[currentExamQuestionIndex] = idx;
    
    // Rerender question options quickly
    document.querySelectorAll('.option-btn-exam').forEach((btn, buttonIdx) => {
        if (buttonIdx === idx) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });

    // Update status if it was not review
    if (examQuestionStatuses[currentExamQuestionIndex] !== 'review') {
        examQuestionStatuses[currentExamQuestionIndex] = 'answered';
    }
    renderExamPalette();
}

function renderExamPalette() {
    const grid = document.getElementById('examPaletteGrid');
    if (!grid) return;

    grid.innerHTML = currentExamQuestions.map((_, idx) => {
        const status = examQuestionStatuses[idx];
        const isActive = idx === currentExamQuestionIndex;
        return `
            <button class="palette-btn ${status} ${isActive ? 'active' : ''}" data-idx="${idx}">
                ${idx + 1}
            </button>
        `;
    }).join('');

    // Palette listeners
    document.querySelectorAll('.palette-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.idx);
            navigateQuestion(idx);
        });
    });
}

function navigateQuestion(targetIndex) {
    if (targetIndex < 0 || targetIndex >= currentExamQuestions.length) return;

    // Save time spent on current question
    if (activeQuestionStartTime) {
        const elapsed = Math.round((Date.now() - activeQuestionStartTime) / 1000);
        examQuestionTimes[currentExamQuestionIndex] += elapsed;
    }

    currentExamQuestionIndex = targetIndex;

    // Mark target as visited if not visited yet
    if (examQuestionStatuses[currentExamQuestionIndex] === 'notvisited') {
        examQuestionStatuses[currentExamQuestionIndex] = 'unanswered';
    }

    renderExamQuestion();
    renderExamPalette();
}

function handleExamClear() {
    examAnswers[currentExamQuestionIndex] = null;
    examQuestionStatuses[currentExamQuestionIndex] = 'unanswered';
    
    // Unselect options
    document.querySelectorAll('.option-btn-exam').forEach(btn => btn.classList.remove('selected'));
    renderExamPalette();
}

function handleExamMarkReview() {
    examQuestionStatuses[currentExamQuestionIndex] = 'review';
    renderExamPalette();
    handleExamSaveNext();
}

function handleExamPrev() {
    if (currentExamQuestionIndex > 0) {
        navigateQuestion(currentExamQuestionIndex - 1);
    }
}

function handleExamSaveNext() {
    if (examAnswers[currentExamQuestionIndex] !== null && examQuestionStatuses[currentExamQuestionIndex] !== 'review') {
        examQuestionStatuses[currentExamQuestionIndex] = 'answered';
    }
    
    if (currentExamQuestionIndex < currentExamQuestions.length - 1) {
        navigateQuestion(currentExamQuestionIndex + 1);
    } else {
        // Highlight last question time spent
        if (activeQuestionStartTime) {
            const elapsed = Math.round((Date.now() - activeQuestionStartTime) / 1000);
            examQuestionTimes[currentExamQuestionIndex] += elapsed;
            activeQuestionStartTime = Date.now();
        }
        renderExamPalette();
    }
}

function handleExamBookmarkActive() {
    if (!currentExamQuestions || currentExamQuestions.length === 0) return;
    const question = currentExamQuestions[currentExamQuestionIndex];
    toggleQuestionBookmark(this, question.id);
}

// --- FULLSCREEN CONTROLS ---

function enterFullscreenMode() {
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(err => console.log(err));
    } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen().catch(err => console.log(err));
    } else if (docEl.mozRequestFullScreen) {
        docEl.mozRequestFullScreen().catch(err => console.log(err));
    } else if (docEl.msRequestFullscreen) {
        docEl.msRequestFullscreen().catch(err => console.log(err));
    }
}

function handleFullscreenChange() {
    if (!isExamActive) return;

    const isFullscreen = document.fullscreenElement || 
                         document.webkitFullscreenElement || 
                         document.mozFullScreenElement || 
                         document.msFullscreenElement;

    const blocker = document.getElementById('fullscreenBlocker');
    if (!isFullscreen) {
        // Paused visual state, block screen
        if (blocker) blocker.style.display = 'flex';
        // Pause timer temporarily
        if (examTimerInterval) clearInterval(examTimerInterval);
    } else {
        if (blocker) blocker.style.display = 'none';
        // Resume timer
        startExamTimer();
    }
}

// --- TAB SWITCH CHEATING RESTRICTION ---

function handleVisibilityChange() {
    if (!isExamActive) return;

    if (document.visibilityState === 'hidden') {
        examTabSwitchCount++;
        
        const tabWarning = document.getElementById('examTabSwitchWarning');
        if (tabWarning) {
            tabWarning.style.display = 'inline-block';
            tabWarning.textContent = `Tab Switch Warning: ${examTabSwitchCount}/3`;
        }

        alert(`WARNING: You have switched tabs or minimized the window. (Attempt ${examTabSwitchCount}/3). The test will submit automatically on the 3rd switch.`);

        if (examTabSwitchCount >= 3) {
            alert("Maximum tab switches reached. Your test is being submitted immediately.");
            submitCustomExam('tab_switch');
        }
    }
}

// --- SUBMIT CUSTOM TEST & RESULTS ---

async function submitCustomExam(reason) {
    isExamActive = false;
    if (examTimerInterval) clearInterval(examTimerInterval);

    // Save final elapsed time
    if (activeQuestionStartTime) {
        const elapsed = Math.round((Date.now() - activeQuestionStartTime) / 1000);
        examQuestionTimes[currentExamQuestionIndex] += elapsed;
    }

    // Exit fullscreen
    if (document.exitFullscreen) {
        document.exitFullscreen().catch(e => {});
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen().catch(e => {});
    }

    // Hide blocker overlay
    const blocker = document.getElementById('fullscreenBlocker');
    if (blocker) blocker.style.display = 'none';

    showLoading();

    // Calculations
    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;
    let totalTimeTaken = 0;

    let questionDetails = [];

    currentExamQuestions.forEach((q, idx) => {
        const userAns = examAnswers[idx];
        const isCorrect = userAns === q.correctAnswer;
        const timeSpent = examQuestionTimes[idx] || 0;
        totalTimeTaken += timeSpent;

        if (userAns === null) {
            unattemptedCount++;
            score += 0;
        } else if (isCorrect) {
            correctCount++;
            score += 4;
        } else {
            incorrectCount++;
            score -= 1;
        }

        questionDetails.push({
            id: q.id,
            subject: q.subject,
            chapterId: q.chapterId,
            difficulty: q.difficulty || 'Medium',
            correctOption: q.correctAnswer,
            userOption: userAns !== null ? userAns : -1,
            timeSpent: timeSpent,
            questionText: q.question,
            options: q.options,
            detailedAnswer: q.detailedAnswer || ''
        });
    });

    const accuracy = correctCount + incorrectCount > 0 
        ? Math.round((correctCount / (correctCount + incorrectCount)) * 100) 
        : 0;

    // Display basic metrics
    document.getElementById('resScore').textContent = score;
    document.getElementById('resAccuracy').textContent = `${accuracy}%`;
    document.getElementById('resCorrect').textContent = correctCount;
    document.getElementById('resIncorrect').textContent = incorrectCount;
    document.getElementById('resUnattempted').textContent = unattemptedCount;

    let testSubtitle = "JEE Mains Custom Test Completed";
    if (reason === 'timeout') testSubtitle += " (Time Out)";
    else if (reason === 'tab_switch') testSubtitle += " (Terminated due to tab switching)";
    document.getElementById('resultsTestSubtitle').textContent = testSubtitle;

    // Generate AI Review from Sarvam AI
    const aiReviewContainer = document.getElementById('resAiReviewContent');
    if (aiReviewContainer) aiReviewContainer.textContent = "Analyzing attempt patterns and generating AI review...";

    let aiReviewText = "Failed to generate AI review. Please check your internet connection.";

    try {
        const systemPrompt = `You are an expert academic coach and test analyst for JEE Mains. Your job is to analyze a student's custom exam performance and give a detailed review. Focus on time taken per question relative to its difficulty (Easy, Medium, Hard). Identify questions where they wasted time, qualitative insights on their preparation, and clear, actionable steps for improvement. Use markdown format.`;
        
        const userPrompt = `
Analyze the following student test attempt:
Student Name: ${document.getElementById('userName').textContent}
Score: ${score} (JEE Format: +4 for correct, -1 for incorrect)
Correct Answers: ${correctCount}
Incorrect Answers: ${incorrectCount}
Unattempted Questions: ${unattemptedCount}
Accuracy: ${accuracy}%
Total Time Taken: ${formatPodcastTimestamp(totalTimeTaken)}
Exam Termination Reason: ${reason} (manual/timeout/tab_switch)

Question Breakdown Details:
${questionDetails.map((q, idx) => `
Q${idx+1}: Subject: ${q.subject}, Difficulty: ${q.difficulty}
User Answer: ${q.userOption === -1 ? 'Unattempted' : String.fromCharCode(65 + q.userOption)}, Correct Answer: ${String.fromCharCode(65 + q.correctOption)}
Result: ${q.userOption === -1 ? 'Unattempted' : (q.userOption === q.correctOption ? 'Correct' : 'Incorrect')}
Time Spent: ${q.timeSpent} seconds
`).join('')}

Provide:
1. Difficulty-to-Time Analysis: Focus on whether the student spent too much time on Easy or Medium questions vs Hard questions, and if it cost them score.
2. Strengths and Weaknesses: Highlight subjects and difficulties they succeeded in and where they struggled.
3. Time Management Review: Point out any specific questions where they spent an excessive amount of time (e.g. over 150 seconds).
4. Actionable Steps: Specific recommendations for their next custom test attempt.
`;

        const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SARVAM_API_KEY}`
            },
            body: JSON.stringify({
                model: "sarvam-30b",
                messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
                temperature: 0.5,
                max_tokens: 2048,
                reasoning_effort: null,
                stream: false
            })
        });

        if (response.ok) {
            const data = await response.json();
            aiReviewText = data?.choices?.[0]?.message?.content || aiReviewText;
        } else {
            console.error("Sarvam completions returned error status:", response.status);
        }
    } catch (err) {
        console.error("Sarvam AI completions fetch error:", err);
    }

    if (aiReviewContainer) {
        aiReviewContainer.textContent = aiReviewText;
    }

    // Save performance to Firebase Database
    const performanceData = {
        timestamp: new Date().toISOString(),
        score: score,
        accuracy: accuracy,
        correct: correctCount,
        incorrect: incorrectCount,
        unattempted: unattemptedCount,
        totalTime: totalTimeTaken,
        terminationReason: reason,
        tabSwitches: examTabSwitchCount,
        aiReview: aiReviewText,
        questions: questionDetails.map(q => ({
            id: q.id,
            subject: q.subject,
            chapterId: q.chapterId,
            difficulty: q.difficulty,
            correctOption: q.correctOption,
            userOption: q.userOption,
            timeSpent: q.timeSpent
        }))
    };

    if (currentUser) {
        try {
            await database.ref(`testPerformances/${currentUser.uid}`).push(performanceData);
            console.log("Saved test performance successfully!");
        } catch (e) {
            console.error("Error saving performance:", e);
        }
    }

    // Render Solutions list
    renderExamSolutions(questionDetails);

    hideLoading();
    navigateToUrl('/custom-test/results');
}

function renderExamSolutions(questionDetails) {
    const list = document.getElementById('resSolutionsList');
    if (!list) return;

    const renderList = (filteredQs) => {
        if (filteredQs.length === 0) {
            list.innerHTML = '<p class="no-data">No questions in this category</p>';
            return;
        }

        list.innerHTML = filteredQs.map((q, idx) => {
            const isUnattempted = q.userOption === -1;
            const isCorrect = !isUnattempted && q.userOption === q.correctOption;
            
            let statusClass = 'unattempted';
            let userAnsText = "Unattempted";
            if (!isUnattempted) {
                if (isCorrect) {
                    statusClass = 'correct';
                    userAnsText = `Your Answer: Option ${String.fromCharCode(65 + q.userOption)} (Correct)`;
                } else {
                    statusClass = 'incorrect';
                    userAnsText = `Your Answer: Option ${String.fromCharCode(65 + q.userOption)} (Incorrect)`;
                }
            }

            return `
                <div class="solution-card ${statusClass}">
                    <div class="solution-card-header">
                        <span class="subject">${(q.subject || 'physics').toUpperCase()} | Difficulty: ${q.difficulty}</span>
                        <span class="timing">Time Spent: ${q.timeSpent}s</span>
                    </div>
                    <div class="solution-text">${q.questionText}</div>
                    
                    <div class="solution-answers">
                        <span class="${isCorrect ? 'user-ans-correct' : (isUnattempted ? '' : 'user-ans-wrong')}">${userAnsText}</span>
                        <span>Correct Answer: Option ${String.fromCharCode(65 + q.correctOption)}</span>
                    </div>

                    ${q.detailedAnswer ? `
                        <div class="solution-explanation">
                            <strong>Detailed Explanation:</strong>
                            <p style="margin-top: 4px; white-space: pre-line;">${q.detailedAnswer}</p>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    };

    // Initial render: All Qs
    renderList(questionDetails);

    // Bind solutions filter listeners
    document.querySelectorAll('.solutions-filter-bar .filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.solutions-filter-bar .filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const filterValue = this.dataset.filter;
            let filtered = [...questionDetails];
            if (filterValue === 'correct') {
                filtered = questionDetails.filter(q => q.userOption !== -1 && q.userOption === q.correctOption);
            } else if (filterValue === 'incorrect') {
                filtered = questionDetails.filter(q => q.userOption !== -1 && q.userOption !== q.correctOption);
            } else if (filterValue === 'unattempted') {
                filtered = questionDetails.filter(q => q.userOption === -1);
            }
            renderList(filtered);
        });
    });
}

// --- PODCAST PLAY HISTORY ---

async function loadPodcastHistory() {
    const list = document.getElementById('podcastHistoryList');
    if (!list) return;

    if (!currentUser) {
        list.innerHTML = '<p class="no-history">Log in to view your podcast history</p>';
        return;
    }

    try {
        const snapshot = await database.ref(`podcastHistory/${currentUser.uid}`).orderByChild('timestamp').limitToLast(10).once('value');
        const history = [];
        snapshot.forEach(snap => {
            history.push({
                id: snap.key,
                ...snap.val()
            });
        });

        if (history.length === 0) {
            list.innerHTML = '<p class="no-history">No past podcast requests found</p>';
            return;
        }

        // Show newest first
        history.reverse();

        list.innerHTML = history.map(item => `
            <div class="podcast-history-item" data-id="${item.id}">
                <div class="history-item-content">
                    <h4>${item.topic}</h4>
                    <span>Requested: ${formatDate(item.timestamp)}</span>
                </div>
                <div class="history-play-icon">▶ Play</div>
            </div>
        `).join('');

        // Bind history click listeners
        document.querySelectorAll('.podcast-history-item').forEach(el => {
            el.addEventListener('click', function() {
                const id = this.dataset.id;
                const selectedItem = history.find(h => h.id === id);
                if (selectedItem && selectedItem.script) {
                    loadPodcastHistoryItem(selectedItem.script, selectedItem.topic);
                }
            });
        });

    } catch (e) {
        console.error("Error loading podcast history:", e);
        list.innerHTML = '<p class="no-history">Failed to load podcast history</p>';
    }
}

function loadPodcastHistoryItem(script, topic) {
    resetPodcastPlayer();
    
    document.getElementById('podcastTopic').value = topic;
    podcastScriptArray = script;
    renderPodcastScript(podcastScriptArray);

    podcastTotalDuration = 0;
    podcastLineDurations = [];
    podcastScriptArray.forEach(line => {
        let duration = line.type === 'direction' ? 0 : Math.max(3.0, line.text.length * 0.085);
        podcastLineDurations.push(duration);
        podcastTotalDuration += duration;
    });

    document.getElementById('podcastTotalTime').textContent = formatPodcastTimestamp(podcastTotalDuration);
    document.getElementById('podcastScrubber').max = Math.floor(podcastTotalDuration);

    document.getElementById('podcastPlayerPanel').style.display = 'flex';
    
    // Play line 0
    playPodcastLine(0, 0);
}

// ==================== SINGLE QUESTION DETAIL & ROUTING ENGINE ====================

let questionTimerInterval = null;
let questionSecondsElapsed = 0;
let questionTimerState = 'idle'; // 'idle', 'running', 'paused'

function startQuestionTimer() {
    const btn = document.getElementById('btnQuestionTimer');
    if (!btn) return;
    
    questionTimerState = 'running';
    btn.classList.add('timer-running');
    btn.classList.remove('timer-paused');
    btn.innerHTML = `⏱️ ${formatSeconds(questionSecondsElapsed)}`;
    
    if (questionTimerInterval) clearInterval(questionTimerInterval);
    questionTimerInterval = setInterval(() => {
        questionSecondsElapsed++;
        btn.innerHTML = `⏱️ ${formatSeconds(questionSecondsElapsed)}`;
    }, 1000);
}

function pauseQuestionTimer() {
    const btn = document.getElementById('btnQuestionTimer');
    if (!btn) return;
    
    questionTimerState = 'paused';
    btn.classList.add('timer-paused');
    btn.classList.remove('timer-running');
    btn.innerHTML = `⏱️ Paused (${formatSeconds(questionSecondsElapsed)})`;
    
    if (questionTimerInterval) {
        clearInterval(questionTimerInterval);
        questionTimerInterval = null;
    }
}

function resetQuestionTimer() {
    if (questionTimerInterval) {
        clearInterval(questionTimerInterval);
        questionTimerInterval = null;
    }
    questionSecondsElapsed = 0;
    questionTimerState = 'idle';
    const btn = document.getElementById('btnQuestionTimer');
    if (btn) {
        btn.classList.remove('timer-running', 'timer-paused');
        btn.textContent = '⏱️ Start Timer';
    }
}

function formatSeconds(totalSecs) {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function resolveQuestionPath(questionId) {
    // 1. Check if localStorage has subject & chapterId
    let subject = localStorage.getItem('lastSubject');
    let chapterId = localStorage.getItem('lastChapterId');
    if (subject && chapterId) {
        // Verify it exists there
        const snap = await database.ref(`questions/${subject}/${chapterId}/${questionId}`).once('value');
        if (snap.exists()) {
            return { subject, chapterId, question: { id: questionId, ...snap.val() } };
        }
    }
    
    // 2. If not found, search all subjects and chapters
    const subjects = ['physics', 'chemistry', 'mathematics'];
    for (const sub of subjects) {
        const chaptersSnap = await database.ref(`chapters/${sub}`).once('value');
        if (chaptersSnap.exists()) {
            const chaptersObj = chaptersSnap.val();
            for (const chapId of Object.keys(chaptersObj)) {
                const qSnap = await database.ref(`questions/${sub}/${chapId}/${questionId}`).once('value');
                if (qSnap.exists()) {
                    // Cache it
                    localStorage.setItem('lastSubject', sub);
                    localStorage.setItem('lastChapterId', chapId);
                    return { subject: sub, chapterId: chapId, question: { id: questionId, ...qSnap.val() } };
                }
            }
        }
    }
    return null;
}

async function loadQuestionDetailPage(questionId) {
    showLoading();
    try {
        resetQuestionTimer();
        
        // Resolve subject, chapterId and question data
        const resolved = await resolveQuestionPath(questionId);
        if (!resolved) {
            alert('Question not found.');
            navigateToUrl('/practice');
            return;
        }
        
        const { subject, chapterId, question } = resolved;
        currentSubject = subject;
        currentChapterId = chapterId;
        
        // Fetch/load the full list of questions for this chapter if not already loaded (for Next/Prev navigation)
        if (quizQuestions.length === 0 || quizQuestions.every(q => q.id !== questionId)) {
            // Load all questions from this chapter to enable prev/next navigation
            const snapshot = await database.ref(`questions/${subject}/${chapterId}`).once('value');
            quizQuestions = [];
            snapshot.forEach(childSnapshot => {
                quizQuestions.push({
                    id: childSnapshot.key,
                    subject: subject,
                    ...childSnapshot.val()
                });
            });
            
            if (userAnswers.length !== quizQuestions.length) {
                userAnswers = new Array(quizQuestions.length).fill(null);
            }
            
            // Also load user bookmarks (safely wrapped in try-catch)
            if (currentUser) {
                try {
                    const bookmarksSnapshot = await database.ref(`bookmarks/${currentUser.uid}`).once('value');
                    currentUserBookmarks = bookmarksSnapshot.val() || {};
                } catch (bookmarkErr) {
                    console.error("Error loading bookmarks in detail page:", bookmarkErr);
                    currentUserBookmarks = currentUserBookmarks || {};
                }
            }
        }
        
        // Find index of current question in the list
        const qIndex = quizQuestions.findIndex(q => q.id === questionId);
        if (qIndex === -1) {
            alert('Question not found in the chapter.');
            navigateToUrl('/practice');
            return;
        }
        
        currentQuestionIndex = qIndex;
        
        // Render the single question details
        renderQuestionDetail(question, qIndex);
        
        // Auto-start timer if setting is enabled
        if (localStorage.getItem('autoStartTimer') !== 'false') {
            startQuestionTimer();
        }
        
        // Show page
        showPage('questionDetail');
    } catch (e) {
        console.error('Error loading question detail:', e);
        alert('Error loading question. Please try again.');
    } finally {
        hideLoading();
    }
}

let selectedDetailOption = null;

function renderQuestionDetail(question, qIndex) {
    selectedDetailOption = null; // reset selection
    
    // Set question number and metadata
    document.getElementById('detailQuestionNumber').textContent = `Q ${qIndex + 1}`;
    
    let metaText = `JEE Main`;
    if (question.year) metaText += ` ${question.year}`;
    if (question.shift) metaText += ` (${question.shift})`;
    if (question.difficulty) metaText += ` - ${question.difficulty}`;
    document.getElementById('detailQuestionMeta').textContent = metaText;
    
    // Set question text
    document.getElementById('detailQuestionText').innerHTML = question.question;
    
    // Set bookmark button state
    const isBookmarked = currentUserBookmarks[question.id] === true;
    const bookmarkBtn = document.getElementById('btnBookmarkDetailQuestion');
    if (bookmarkBtn) {
        if (isBookmarked) {
            bookmarkBtn.classList.add('active');
            bookmarkBtn.style.color = 'var(--ig-primary)';
        } else {
            bookmarkBtn.classList.remove('active');
            bookmarkBtn.style.color = 'var(--ig-text-secondary)';
        }
        // Update click listener
        bookmarkBtn.onclick = async (e) => {
            e.stopPropagation();
            await toggleQuestionBookmark(bookmarkBtn, question.id);
            if (currentUserBookmarks[question.id] === true) {
                bookmarkBtn.style.color = 'var(--ig-primary)';
            } else {
                bookmarkBtn.style.color = 'var(--ig-text-secondary)';
            }
        };
    }
    
    // Set Back to List button link
    const backBtn = document.getElementById('btnBackToQuestionList');
    if (backBtn) {
        backBtn.onclick = () => {
            navigateToUrl(`/practice/${currentSubject}/${currentChapterId}`);
        };
    }
    
    // Render options in 2x2 grid
    const optionsContainer = document.getElementById('detailOptionsContainer');
    const explanationContainer = document.getElementById('detailExplanationContainer');
    const checkBtn = document.getElementById('btnDetailCheckAnswer');
    
    explanationContainer.style.display = 'none';
    
    const userAnswer = userAnswers[qIndex];
    const isAttempted = userAnswer !== null;
    
    optionsContainer.innerHTML = question.options.map((option, optIdx) => {
        const letter = String.fromCharCode(65 + optIdx);
        let cardClass = 'option-card-detail';
        
        if (isAttempted) {
            const isCorrectOption = question.correctAnswer === optIdx;
            const isSelectedOption = userAnswer === optIdx;
            if (isCorrectOption) {
                cardClass += ' option-correct';
            } else if (isSelectedOption && !isCorrectOption) {
                cardClass += ' option-incorrect';
            }
        } else {
            // Check if we already clicked this option but haven't submitted yet
            if (selectedDetailOption === optIdx) {
                cardClass += ' option-selected';
            }
        }
        
        return `
            <button class="${cardClass}" data-option-idx="${optIdx}" ${isAttempted ? 'disabled' : ''}>
                <div class="option-letter-box">${letter}</div>
                <div class="option-text">${option}</div>
            </button>
        `;
    }).join('');
    
    // Enable/disable Check Answer button
    if (isAttempted) {
        checkBtn.disabled = true;
        checkBtn.textContent = 'Submitted';
        
        // Show explanation if present
        if (question.detailedAnswer) {
            explanationContainer.style.display = 'block';
            document.getElementById('detailExplanationContent').innerHTML = question.detailedAnswer;
        }
    } else {
        checkBtn.disabled = true;
        checkBtn.textContent = 'Check Answer';
        
        // Click handlers for selecting option
        optionsContainer.querySelectorAll('.option-card-detail').forEach(btn => {
            btn.onclick = () => {
                const optIdx = parseInt(btn.dataset.optionIdx);
                selectedDetailOption = optIdx;
                
                // Toggle active classes
                optionsContainer.querySelectorAll('.option-card-detail').forEach((b, idx) => {
                    if (idx === optIdx) {
                        b.classList.add('option-selected');
                    } else {
                        b.classList.remove('option-selected');
                    }
                });
                
                checkBtn.disabled = false;
            };
        });
    }
    
    // Next/Prev navigation buttons
    const prevBtn = document.getElementById('btnDetailPrev');
    const nextBtn = document.getElementById('btnDetailNext');
    
    prevBtn.disabled = qIndex === 0;
    nextBtn.disabled = qIndex === quizQuestions.length - 1;
    
    prevBtn.onclick = () => {
        if (qIndex > 0) {
            const prevQ = quizQuestions[qIndex - 1];
            navigateToUrl(`/question/${prevQ.id}`);
        }
    };
    
    nextBtn.onclick = () => {
        if (qIndex < quizQuestions.length - 1) {
            const nextQ = quizQuestions[qIndex + 1];
            navigateToUrl(`/question/${nextQ.id}`);
        }
    };
}

async function submitDetailAnswer() {
    if (selectedDetailOption === null) return;
    
    const qIndex = currentQuestionIndex;
    const question = quizQuestions[qIndex];
    
    // Save answer in local state
    userAnswers[qIndex] = selectedDetailOption;
    
    const isCorrect = selectedDetailOption === question.correctAnswer;
    
    // Save result to Firebase
    saveQuestionResult(qIndex, isCorrect);
    
    // Re-render to show correct/incorrect state
    renderQuestionDetail(question, qIndex);
    
    // Pause timer
    pauseQuestionTimer();
}

function navigateToUrl(path, pushState = true) {
    if (pushState) {
        window.history.pushState(null, '', path);
    }
    routeCurrentUrl();
}

async function routeCurrentUrl() {
    if (typeof auth === 'undefined') return;
    
    let path = window.location.pathname;
    
    // Normalize path
    if (path.startsWith('/')) path = path.slice(1);
    if (path.endsWith('/')) path = path.slice(0, -1);
    
    // Split into parts
    const parts = path.split('/');
    const rootPath = parts[0] || 'home';
    
    // Route guard: if not logged in and not on auth, go to auth
    if (!currentUser && rootPath !== 'auth') {
        window.history.replaceState(null, '', '/auth');
        showPage('auth');
        return;
    }
    
    // Route guard: if logged in and on auth, go to home
    if (currentUser && rootPath === 'auth') {
        window.history.replaceState(null, '', '/home');
        showPage('home');
        return;
    }
    
    switch (rootPath) {
        case 'home':
            showPage('home');
            break;
            
        case 'profile':
            showPage('profile');
            break;
            
        case 'practice':
            if (parts.length === 1) {
                showPage('pyqSubject');
            } else if (parts.length === 2) {
                const subject = parts[1];
                loadChapters(subject);
            } else if (parts.length === 3) {
                const subject = parts[1];
                const chapterId = parts[2];
                showLoading();
                try {
                    const snap = await database.ref(`chapters/${subject}/${chapterId}/name`).once('value');
                    const chapterName = snap.val() || 'Chapter';
                    loadPracticeMode(subject, chapterName, chapterId);
                } catch (e) {
                    console.error('Error fetching chapter name for routing:', e);
                    loadPracticeMode(subject, 'Chapter', chapterId);
                } finally {
                    hideLoading();
                }
            } else {
                navigateToUrl('/practice');
            }
            break;
            
        case 'question':
            if (parts.length === 2) {
                const questionId = parts[1];
                loadQuestionDetailPage(questionId);
            } else {
                navigateToUrl('/practice');
            }
            break;
            
        case 'upcoming':
            loadUpcomingExams();
            showPage('upcoming');
            break;
            
        case 'admin':
            if (isAdmin(currentUser.email)) {
                loadAdminData();
                showPage('admin');
            } else {
                navigateToUrl('/home');
            }
            break;
            
        case 'podcast':
            loadPodcastHistory();
            showPage('podcast');
            break;
            
        case 'community':
            loadCommunityChat();
            showPage('community');
            break;
            
        case 'custom-test':
            if (parts.length === 1) {
                loadCustomTestWizard();
                showPage('customTestWizard');
            } else if (parts.length === 2 && parts[1] === 'exam') {
                if (currentExamQuestions && currentExamQuestions.length > 0) {
                    showPage('customTestExam');
                } else {
                    navigateToUrl('/custom-test');
                }
            } else if (parts.length === 2 && parts[1] === 'results') {
                showPage('customTestResults');
            } else {
                navigateToUrl('/custom-test');
            }
            break;
            
        case 'auth':
            showPage('auth');
            break;
            
        default:
            window.history.replaceState(null, '', '/home');
            showPage('home');
            break;
    }
}

// Window popstate event listener for browser back/forward buttons
window.addEventListener('popstate', () => {
    routeCurrentUrl();
});

// ==================== THEME MANAGEMENT ====================
function applySavedTheme() {
    const savedTheme = localStorage.getItem('themePreference') || 'instagram';
    setTheme(savedTheme);
}

function setTheme(theme) {
    const instagramIcon = document.getElementById('themeIconInstagram');
    const whatsappIcon = document.getElementById('themeIconWhatsapp');
    const switchLabel = document.getElementById('themeSwitchLabel');
    
    if (theme === 'whatsapp') {
        document.documentElement.setAttribute('data-theme', 'whatsapp');
        document.body.setAttribute('data-theme', 'whatsapp');
        
        if (switchLabel) switchLabel.textContent = 'Instagram Theme';
        if (instagramIcon) instagramIcon.style.display = 'block';
        if (whatsappIcon) whatsappIcon.style.display = 'none';
    } else {
        document.documentElement.removeAttribute('data-theme');
        document.body.removeAttribute('data-theme');
        
        if (switchLabel) switchLabel.textContent = 'WhatsApp Theme';
        if (instagramIcon) instagramIcon.style.display = 'none';
        if (whatsappIcon) whatsappIcon.style.display = 'block';
    }
}

function handleThemeSwitch() {
    const currentTheme = localStorage.getItem('themePreference') || 'instagram';
    const newTheme = currentTheme === 'instagram' ? 'whatsapp' : 'instagram';
    localStorage.setItem('themePreference', newTheme);
    setTheme(newTheme);
    
    // Dynamically re-render chat wallpaper / formatting if user toggles theme on community page
    if (pages.community && pages.community.style.display !== 'none') {
        selectChatChannel(currentChatChannel);
    }
}

// ==================== COMMUNITY CHAT LOGIC ====================
let currentChatChannel = 'general';
let chatMessagesRef = null;

function loadCommunityChat() {
    const testsChannelBtn = document.getElementById('channelTestsBtn');
    if (testsChannelBtn) {
        const userIsAdmin = currentUser ? isAdmin(currentUser.email) : false;
        testsChannelBtn.style.display = userIsAdmin ? 'flex' : 'none';
    }
    selectChatChannel(currentChatChannel || 'general');
    setupChatEventListeners();
}

function setupChatEventListeners() {
    // Setup channel togglers
    const channelItems = document.querySelectorAll('.channel-item');
    channelItems.forEach(item => {
        item.replaceWith(item.cloneNode(true));
    });
    
    const newChannelItems = document.querySelectorAll('.channel-item');
    newChannelItems.forEach(item => {
        item.addEventListener('click', () => {
            const channelId = item.dataset.channel;
            selectChatChannel(channelId);
        });
    });
    
    // Chat Message Form submit
    const chatForm = document.getElementById('chatMessageForm');
    if (chatForm) {
        chatForm.replaceWith(chatForm.cloneNode(true));
    }
    const newChatForm = document.getElementById('chatMessageForm');
    if (newChatForm) {
        newChatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendCommunityMessage();
        });
    }
    
    // Click outside reaction popover or chat dropdown to dismiss
    document.addEventListener('click', (e) => {
        const popover = document.getElementById('emojiReactionPopover');
        if (popover && popover.style.display !== 'none') {
            if (!popover.contains(e.target) && !e.target.closest('.message-bubble') && !e.target.closest('.reaction-badge')) {
                popover.style.display = 'none';
            }
        }
        if (!e.target.closest('.message-options-btn') && !e.target.closest('.chat-message-dropdown')) {
            closeAllChatDropdowns();
        }
    });
}

async function selectChatChannel(channelId) {
    const userIsAdmin = currentUser ? isAdmin(currentUser.email) : false;
    if (channelId === 'tests' && !userIsAdmin) {
        selectChatChannel('general');
        return;
    }

    currentChatChannel = channelId;
    
    document.querySelectorAll('.channel-item').forEach(item => {
        if (item.dataset.channel === channelId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    const titleEl = document.getElementById('activeChannelHeaderTitle');
    const descEl = document.getElementById('activeChannelHeaderSubtitle');
    const inputForm = document.getElementById('chatMessageForm');
    const readOnlyBanner = document.getElementById('chatUpdatesReadOnlyBanner');
    
    if (channelId === 'general') {
        if (titleEl) titleEl.textContent = '# general';
        if (descEl) descEl.textContent = 'Public discussions for all students';
        if (inputForm) inputForm.style.display = 'flex';
        if (readOnlyBanner) readOnlyBanner.style.display = 'none';
    } else if (channelId === 'updates') {
        if (titleEl) titleEl.textContent = '📢 updates';
        if (descEl) descEl.textContent = 'Official updates from Learnser AI admins';
        
        const userIsAdmin = currentUser ? isAdmin(currentUser.email) : false;
        if (userIsAdmin) {
            if (inputForm) inputForm.style.display = 'flex';
            if (readOnlyBanner) readOnlyBanner.style.display = 'none';
        } else {
            if (inputForm) inputForm.style.display = 'none';
            if (readOnlyBanner) readOnlyBanner.style.display = 'block';
        }
    } else if (channelId === 'tests') {
        if (titleEl) titleEl.textContent = '🧪 tests';
        if (descEl) descEl.textContent = 'Private channel for admin testing';
        if (inputForm) inputForm.style.display = 'flex';
        if (readOnlyBanner) readOnlyBanner.style.display = 'none';
    }
    
    syncChannelMessages(channelId);
}

function syncChannelMessages(channelId) {
    const listContainer = document.getElementById('chatMessagesList');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    if (chatMessagesRef) {
        chatMessagesRef.off();
    }
    
    chatMessagesRef = database.ref(`communityMessages/${channelId}`).limitToLast(100);
    
    chatMessagesRef.on('value', async (snapshot) => {
        const messagesData = snapshot.val();
        if (!messagesData) {
            listContainer.innerHTML = '<p class="no-data" style="margin: auto; color: var(--ig-text-secondary);">No messages yet</p>';
            return;
        }
        
        // Fetch all user profiles for latest usernames
        let usersData = {};
        try {
            const usersSnapshot = await database.ref('users').once('value');
            usersData = usersSnapshot.val() || {};
        } catch (err) {
            console.error('Error fetching users for chat:', err);
        }
        
        // Fetch current user's deleted messages map for this channel
        let deletedMap = {};
        try {
            const deletedSnapshot = await database.ref(`users/${currentUser.uid}/deletedMessages/${channelId}`).once('value');
            deletedMap = deletedSnapshot.val() || {};
        } catch (err) {
            console.error('Error fetching deleted messages:', err);
        }
        
        // Clear container and append all elements synchronously to prevent race conditions
        listContainer.innerHTML = '';
        
        const sortedMsgIds = Object.keys(messagesData).sort((a, b) => {
            const tA = messagesData[a].timestamp || Date.now();
            const tB = messagesData[b].timestamp || Date.now();
            return tA - tB;
        });
        
        sortedMsgIds.forEach(msgId => {
            if (deletedMap && deletedMap[msgId] === true) {
                return; // Skip rendering deleted messages for this user
            }
            
            const msg = messagesData[msgId];
            const isMe = msg.senderId === currentUser.uid;
            
            const senderProfile = usersData[msg.senderId] || {};
            const displayUsername = senderProfile.communityUsername || msg.senderUsername || `@student_${msg.senderId.slice(0, 5)}`;
            const senderDisplayName = senderProfile.name || 'Student';
            
            const row = document.createElement('div');
            row.className = `chat-message-row ${isMe ? 'sent-by-me' : 'sent-by-other'}`;
            row.dataset.messageId = msgId;
            
            let avatarHtml = '';
            if (!isMe) {
                const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(senderDisplayName)}&background=667eea&color=fff&size=50`;
                avatarHtml = `<img class="message-avatar" src="${avatarUrl}" alt="Avatar">`;
            }
            
            const date = new Date(msg.timestamp || Date.now());
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            let reactionsHtml = '';
            if (msg.reactions) {
                reactionsHtml = `<div class="message-reactions">`;
                Object.keys(msg.reactions).forEach(emoji => {
                    const reacters = msg.reactions[emoji];
                    const hasMyReact = reacters[currentUser.uid] === true;
                    const count = Object.keys(reacters).length;
                    reactionsHtml += `
                        <div class="reaction-badge ${hasMyReact ? 'my-reaction' : ''}" data-emoji="${emoji}">
                            <span>${emoji}</span>
                            <span>${count}</span>
                        </div>
                    `;
                });
                reactionsHtml += `</div>`;
            }
            
            row.innerHTML = `
                ${avatarHtml}
                <div class="message-bubble-wrapper">
                    ${!isMe ? `<span class="message-sender-title">${displayUsername}</span>` : ''}
                    <div class="message-bubble">
                        <p class="message-text">${escapeHtml(msg.text)}</p>
                        <div class="message-meta-footer">
                            <span class="message-timestamp">${timeStr}</span>
                            <span class="message-checkmark">✓</span>
                        </div>
                        ${reactionsHtml}
                        <button class="message-options-btn" title="Message Options">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
            
            const bubble = row.querySelector('.message-bubble');
            if (bubble) {
                bubble.addEventListener('dblclick', (e) => {
                    e.stopPropagation();
                    toggleMessageReaction(channelId, msgId, '❤️');
                });
                
                bubble.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showReactionPopover(e, channelId, msgId);
                });
            }
            
            row.querySelectorAll('.reaction-badge').forEach(badge => {
                badge.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const emoji = badge.dataset.emoji;
                    toggleMessageReaction(channelId, msgId, emoji);
                });
            });
            
            const optionsBtn = row.querySelector('.message-options-btn');
            if (optionsBtn) {
                optionsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showChatDropdownMenu(e, channelId, msgId);
                });
            }
            
            listContainer.appendChild(row);
        });
        
        listContainer.scrollTop = listContainer.scrollHeight;
    });
}

function showChatDropdownMenu(e, channelId, msgId) {
    closeAllChatDropdowns();
    
    const dropdown = document.createElement('div');
    dropdown.className = 'chat-message-dropdown';
    
    const userIsAdmin = currentUser ? isAdmin(currentUser.email) : false;
    
    let deleteForMeHtml = `<div class="dropdown-item delete-for-me-item">Delete for me</div>`;
    let deleteForEveryoneHtml = userIsAdmin ? `<div class="dropdown-item delete-for-everyone-item">Delete for everyone</div>` : '';
    
    dropdown.innerHTML = `
        ${deleteForMeHtml}
        ${deleteForEveryoneHtml}
    `;
    
    document.body.appendChild(dropdown);
    
    const rect = e.currentTarget.getBoundingClientRect();
    let top = rect.bottom + window.scrollY;
    let left = rect.left + window.scrollX;
    
    const dropdownWidth = 160;
    if (left + dropdownWidth > window.innerWidth) {
        left = window.innerWidth - dropdownWidth - 10;
    }
    
    dropdown.style.top = `${top}px`;
    dropdown.style.left = `${left}px`;
    
    dropdown.querySelector('.delete-for-me-item').addEventListener('click', async () => {
        await deleteMessageForMe(channelId, msgId);
        closeAllChatDropdowns();
    });
    
    if (userIsAdmin) {
        dropdown.querySelector('.delete-for-everyone-item').addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this message for everyone?')) {
                await deleteMessageForEveryone(channelId, msgId);
            }
            closeAllChatDropdowns();
        });
    }
}

function closeAllChatDropdowns() {
    const existing = document.querySelectorAll('.chat-message-dropdown');
    existing.forEach(el => el.remove());
}

async function deleteMessageForMe(channelId, messageId) {
    if (!currentUser) return;
    try {
        await database.ref(`users/${currentUser.uid}/deletedMessages/${channelId}/${messageId}`).set(true);
        syncChannelMessages(channelId);
    } catch (e) {
        console.error('Error saving local delete status:', e);
        alert('Failed to delete message for you. Please try again.');
    }
}

async function deleteMessageForEveryone(channelId, messageId) {
    if (!currentUser || !isAdmin(currentUser.email)) {
        alert('Permission denied.');
        return;
    }
    try {
        await database.ref(`communityMessages/${channelId}/${messageId}`).remove();
    } catch (e) {
        console.error('Error deleting message globally:', e);
        alert('Failed to delete message for everyone. Please try again.');
    }
}

async function sendCommunityMessage() {
    const input = document.getElementById('chatMessageInput');
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) return;
    
    if (!currentUser) {
        alert('You must be logged in to send messages.');
        return;
    }
    
    const channelId = currentChatChannel;
    
    if ((channelId === 'updates' || channelId === 'tests') && !isAdmin(currentUser.email)) {
        alert(`Only admins can post in ${channelId} channel.`);
        return;
    }
    
    try {
        const profileSnap = await database.ref(`users/${currentUser.uid}`).once('value');
        const profile = profileSnap.val() || {};
        const username = profile.communityUsername || `@student_${currentUser.uid.slice(0, 5)}`;
        
        const messageData = {
            senderId: currentUser.uid,
            senderUsername: username,
            text: text,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };
        
        await database.ref(`communityMessages/${channelId}`).push(messageData);
        input.value = '';
    } catch (e) {
        console.error('Error sending message:', e);
        alert('Failed to send message. Please try again.');
    }
}

function showReactionPopover(e, channelId, msgId) {
    const popover = document.getElementById('emojiReactionPopover');
    if (!popover) return;
    
    popover.style.display = 'flex';
    
    const rect = e.currentTarget.getBoundingClientRect();
    
    let top = rect.top - 45;
    let left = rect.left + (rect.width / 2) - 100;
    
    if (top < 10) top = rect.bottom + 10;
    if (left < 10) left = 10;
    if (left + 220 > window.innerWidth) left = window.innerWidth - 230;
    
    popover.style.top = `${top + window.scrollY}px`;
    popover.style.left = `${left + window.scrollX}px`;
    
    popover.querySelectorAll('.emoji-option').forEach(option => {
        option.replaceWith(option.cloneNode(true));
    });
    
    document.getElementById('emojiReactionPopover').querySelectorAll('.emoji-option').forEach(option => {
        option.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const emoji = option.dataset.emoji;
            toggleMessageReaction(channelId, msgId, emoji);
            popover.style.display = 'none';
        });
    });
}

async function toggleMessageReaction(channelId, msgId, emoji) {
    if (!currentUser) return;
    
    const reactionRef = database.ref(`communityMessages/${channelId}/${msgId}/reactions/${emoji}/${currentUser.uid}`);
    
    try {
        const snap = await reactionRef.once('value');
        if (snap.exists()) {
            await reactionRef.remove();
            
            const parentRef = database.ref(`communityMessages/${channelId}/${msgId}/reactions/${emoji}`);
            const parentSnap = await parentRef.once('value');
            if (!parentSnap.exists()) {
                await parentRef.remove();
            }
        } else {
            await reactionRef.set(true);
        }
    } catch (e) {
        console.error('Error toggling reaction:', e);
    }
}

async function saveCommunityUsername() {
    if (!currentUser) return;
    const input = document.getElementById('profileCommunityUsername');
    if (!input) return;
    
    let username = input.value.trim();
    if (!username) {
        alert('Please enter a valid username.');
        return;
    }
    
    if (!username.startsWith('@')) {
        username = '@' + username;
    }
    
    const usernameRegex = /^@[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
        alert('Username can only contain letters, numbers, underscores, and hyphens (no spaces).');
        return;
    }
    
    try {
        showLoading();
        await database.ref(`users/${currentUser.uid}/communityUsername`).set(username);
        alert('Community Username updated successfully!');
        input.value = username;
        await loadUserProfile();
    } catch (e) {
        console.error('Error saving community username:', e);
        alert('Failed to save community username. Please try again.');
    } finally {
        hideLoading();
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
}