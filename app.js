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
    podcast: document.getElementById('podcastPage')
};

const sidebar = document.getElementById('sidebar');
const loadingOverlay = document.getElementById('loadingOverlay');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeAuthListeners();
    initializeNavigationListeners();
    initializeAdminListeners();
    initializePracticeListeners();
    initializePodcastListeners();
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

function checkAuthState() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await loadUserProfile();
            await loadExamToggles();
            showPage('home');
            sidebar.style.display = 'flex';
            document.body.classList.add('sidebar-active');

            // Check if user is admin
            if (isAdmin(user.email)) {
                document.getElementById('adminNavLink').style.display = 'flex';
            }
        } else {
            currentUser = null;
            showPage('auth');
            sidebar.style.display = 'none';
            document.body.classList.remove('sidebar-active');
            document.getElementById('adminNavLink').style.display = 'none';
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

            console.log('Profile updated successfully');
        } else {
            console.warn('No user data found in database for user:', currentUser.uid);
            // If no data in database, use email from auth
            document.getElementById('userName').textContent = currentUser.email.split('@')[0];
            document.getElementById('profileEmail').textContent = currentUser.email;
            document.getElementById('profileNameFull').textContent = currentUser.email.split('@')[0];
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
    safeOn('homeNavLink', 'click', (e) => { e.preventDefault(); showPage('home'); });
    safeOn('sidebarLogo', 'click', (e) => { e.preventDefault(); showPage('home'); });
    safeOn('adminNavLink', 'click', (e) => { e.preventDefault(); showPage('admin'); loadAdminData(); });
    safeOn('profilePreview', 'click', () => showPage('profile'));
    safeOn('backToHomeBtn', 'click', () => showPage('home'));
    safeOn('pyqCard', 'click', () => showPage('pyqSubject'));
    safeOn('backFromSubjectBtn', 'click', () => showPage('home'));
    safeOn('backFromChapterBtn', 'click', () => showPage('pyqSubject'));
    safeOn('upcomingCard', 'click', () => { loadUpcomingExams(); showPage('upcoming'); });
    safeOn('upcomingNavLink', 'click', (e) => { e.preventDefault(); loadUpcomingExams(); showPage('upcoming'); });
    safeOn('backFromUpcomingBtn', 'click', () => showPage('home'));
    safeOn('podcastCard', 'click', () => showPage('podcast'));
    safeOn('podcastNavLink', 'click', (e) => { e.preventDefault(); showPage('podcast'); });
    safeOn('backToChaptersFromResultsBtn', 'click', () => { showPage('chapter'); loadChapters(currentSubject); });
    safeOn('backFromAdminBtn', 'click', () => showPage('home'));

    // Subject selection
    document.querySelectorAll('.subject-card').forEach(card => {
        card.addEventListener('click', () => loadChapters(card.dataset.subject));
    });

    // Exam cards (new grid, if present)
    document.querySelectorAll('.exam-card').forEach(card => {
        card.addEventListener('click', () => {
            if (card.classList.contains('exam-card-disabled')) return;
            if (card.dataset.exam === 'jee') showPage('pyqSubject');
        });
    });
}

function showPage(pageName) {
    if (pageName !== 'podcast') {
        resetPodcastPlayer();
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
            const chapterName = item.dataset.chapterName;
            loadPracticeMode(subject, chapterName, chapterId);
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
        showPage('chapter');
        loadChapters(currentSubject);
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
                ...childSnapshot.val()
            });
        });

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

    container.innerHTML = questions.map((question, displayIdx) => {
        const originalIdx = quizQuestions.findIndex(q => q.id === question.id);
        const userAnswer = userAnswers[originalIdx];
        const isAttempted = userAnswer !== null;
        const isCorrect = userAnswer === question.correctAnswer;

        let statusClass = '';
        let statusText = 'Unattempted';

        if (isAttempted) {
            if (isCorrect) {
                statusClass = 'question-correct';
                statusText = 'Correct ✓';
            } else {
                statusClass = 'question-incorrect';
                statusText = 'Incorrect ✗';
            }
        }

        return `
            <div class="question-practice-card ${statusClass}" id="question-${originalIdx}">
                <div class="question-header-practice">
                    <div class="question-meta">
                        <span class="question-number">Q${displayIdx + 1}</span>
                        ${question.year ? `<span class="meta-badge">📅 ${question.year}</span>` : ''}
                        ${question.shift ? `<span class="meta-badge">⏰ ${question.shift}</span>` : ''}
                        ${question.difficulty ? `<span class="meta-badge difficulty-${question.difficulty.toLowerCase()}">${question.difficulty}</span>` : ''}
                        ${question.subtopic ? `<span class="meta-badge">📚 ${question.subtopic}</span>` : ''}
                    </div>
                    <span class="question-status ${statusClass}">${statusText}</span>
                </div>
                
                <div class="question-text-practice">${question.question}</div>
                
                <div class="options-practice" id="options-${originalIdx}">
                    ${question.options.map((option, optIdx) => {
            const isSelected = userAnswer === optIdx;
            const isCorrectOption = question.correctAnswer === optIdx;
            let optionClass = 'option-practice';

            if (isAttempted) {
                if (isCorrectOption) {
                    optionClass += ' option-correct';
                } else if (isSelected && !isCorrectOption) {
                    optionClass += ' option-incorrect';
                }
            } else if (isSelected) {
                optionClass += ' option-selected';
            }

            return `
                            <button class="${optionClass}" 
                                    data-question-idx="${originalIdx}" 
                                    data-option-idx="${optIdx}"
                                    ${isAttempted ? 'disabled' : ''}>
                                <span class="option-label">${String.fromCharCode(65 + optIdx)}</span>
                                <span class="option-text">${option}</span>
                                ${isAttempted && isCorrectOption ? '<span class="option-indicator">✓ Correct Answer</span>' : ''}
                                ${isAttempted && isSelected && !isCorrectOption ? '<span class="option-indicator">✗ Your Answer</span>' : ''}
                            </button>
                        `;
        }).join('')}
                </div>
                
                ${isAttempted && question.detailedAnswer ? `
                    <div class="detailed-answer">
                        <div class="answer-header">
                            <strong>📝 Detailed Solution:</strong>
                        </div>
                        <div class="answer-content">${question.detailedAnswer}</div>
                    </div>
                ` : ''}
                
                ${!isAttempted ? `
                    <button class="btn-submit-answer" data-question-idx="${originalIdx}">
                        Submit Answer
                    </button>
                ` : ''}
            </div>
        `;
    }).join('');

    // Add event listeners for options and submit buttons
    document.querySelectorAll('.option-practice:not([disabled])').forEach(btn => {
        btn.addEventListener('click', function () {
            const questionIdx = parseInt(this.dataset.questionIdx);
            const optionIdx = parseInt(this.dataset.optionIdx);
            selectOptionPractice(questionIdx, optionIdx);
        });
    });

    document.querySelectorAll('.btn-submit-answer').forEach(btn => {
        btn.addEventListener('click', function () {
            const questionIdx = parseInt(this.dataset.questionIdx);
            submitAnswer(questionIdx);
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
let BACKEND_URL = localStorage.getItem('EDUPOD_BACKEND_URL') || (window.location.port === '8080' ? '' : 'http://127.0.0.1:8080');

const SARVAM_API_KEY = "sk_4rrt5bjm_3GMlfBpRrJ0bFhMGWYaLd5KB";

function initializePodcastListeners() {
    document.getElementById('generatePodcastBtn').addEventListener('click', generatePodcast);
    document.getElementById('backFromPodcastBtn').addEventListener('click', () => {
        resetPodcastPlayer();
        showPage('home');
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
                    if (delta) accumulated += delta;
                } catch (e) { console.error("SSE parse error", e, trimmed); }
            }
        }

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
                const afterQuote = rawContent.substring(nextQuote + 1);
                if (/^\s*}/.test(afterQuote)) {
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