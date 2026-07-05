// auth-check.js
// Guard middleware script to check authentication and sync user profiles using Supabase.

(function () {
  // Check if we are on a page that requires authentication
  const path = window.location.pathname;
  const isAuthPage = path.endsWith("auth.html");
  const isLandingPage = path.endsWith("index.html") || path === "/" || path === "";
  
  // Pages requiring login
  const requiresAuth = !isAuthPage && !isLandingPage;

  // Analytics & Engagement Telemetry State variables
  let trackingInitialized = false;
  let startTime = Date.now();
  let accumulatedTime = 0;
  let currentProfileState = null;

  function initializeTimeSpentTracking(profile) {
    if (trackingInitialized) return;
    trackingInitialized = true;
    currentProfileState = profile;
    startTime = Date.now();

    // Setup beforeunload and visibilitychange tracking
    window.addEventListener('beforeunload', flushTimeSpent);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushTimeSpent();
      } else {
        // Resuming: reset start time and clear accumulated tracker
        startTime = Date.now();
        accumulatedTime = 0;
      }
    });

    // Periodically flush time spent every 10 seconds to save progress and trigger UI updates
    setInterval(flushTimeSpent, 10000);
  }

  function flushTimeSpent() {
    if (!currentProfileState || !currentProfileState.id) return;
    const now = Date.now();
    const elapsed = Math.round((now - startTime) / 1000);
    const delta = elapsed - accumulatedTime;

    if (delta > 0) {
      accumulatedTime = elapsed;
      saveTimeSpent(currentProfileState.id, delta);
    }
  }

  async function saveTimeSpent(userId, seconds) {
    const supabase = window.supabaseClient;
    if (!supabase) return;

    try {
      // Fetch latest cached profile to ensure we have the most up-to-date baseline
      let profile = null;
      const cached = localStorage.getItem('learnser_supabase_profile');
      if (cached) profile = JSON.parse(cached);

      const baseline = profile ? parseInt(profile.total_time_seconds || 0) : 0;
      const newTotal = baseline + seconds;

      // Update local storage cache immediately so other pages see it
      if (profile) {
        profile.total_time_seconds = newTotal;
        localStorage.setItem('learnser_supabase_profile', JSON.stringify(profile));
        currentProfileState = profile;
        // Broadcast local profile ready event so elements repaint in real time
        window.dispatchEvent(new CustomEvent('profileready', { detail: profile }));
      }

      // Also update the local backup
      try {
        const localAnalyticsStr = localStorage.getItem('learnser_local_analytics');
        const localAnalytics = localAnalyticsStr ? JSON.parse(localAnalyticsStr) : {};
        localAnalytics.total_time_seconds = newTotal;
        localStorage.setItem('learnser_local_analytics', JSON.stringify(localAnalytics));
      } catch (e) {
        console.warn("Failed to write to local analytics backup:", e);
      }

      // Fetch session token and write directly to Supabase REST endpoint
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const supabaseUrl = window.env?.SUPABASE_URL;
      const supabaseAnonKey = window.env?.SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) return;

      const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`;
      fetch(url, {
        method: 'PATCH',
        keepalive: true,
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ total_time_seconds: newTotal })
      }).catch(err => console.warn("Background telemetry fetch aborted or failed:", err));
    } catch (err) {
      console.warn("Time spent tracking write failed:", err);
    }
  }

  // Global doubts solved tracking function
  window.incrementDoubtsSolved = async function () {
    const supabase = window.supabaseClient;
    if (!supabase) return;

    try {
      let profile = null;
      const cached = localStorage.getItem('learnser_supabase_profile');
      if (cached) profile = JSON.parse(cached);

      if (!profile || !profile.id) return;

      const currentCount = parseInt(profile.doubts_solved_count || 0);
      const newCount = currentCount + 1;

      // Update local storage cache immediately
      profile.doubts_solved_count = newCount;
      localStorage.setItem('learnser_supabase_profile', JSON.stringify(profile));
      currentProfileState = profile;

      // Dispatch event to redraw any UI element immediately
      window.dispatchEvent(new CustomEvent('profileready', { detail: profile }));

      // Also update the local backup
      try {
        const localAnalyticsStr = localStorage.getItem('learnser_local_analytics');
        const localAnalytics = localAnalyticsStr ? JSON.parse(localAnalyticsStr) : {};
        localAnalytics.doubts_solved_count = newCount;
        localStorage.setItem('learnser_local_analytics', JSON.stringify(localAnalytics));
      } catch (e) {
        console.warn("Failed to write to local analytics backup:", e);
      }

      // Write to Supabase using .update()
      await supabase.from('profiles').update({ doubts_solved_count: newCount }).eq('id', profile.id);
    } catch (err) {
      console.warn("Failed to increment doubts solved:", err);
    }
  };

  // Global doubts solved reset function
  window.resetDoubtsSolved = async function () {
    const supabase = window.supabaseClient;
    if (!supabase) return;

    try {
      let profile = null;
      const cached = localStorage.getItem('learnser_supabase_profile');
      if (cached) profile = JSON.parse(cached);

      if (!profile || !profile.id) return;

      // Update local storage cache immediately
      profile.doubts_solved_count = 0;
      localStorage.setItem('learnser_supabase_profile', JSON.stringify(profile));
      currentProfileState = profile;

      // Dispatch event to redraw any UI element immediately
      window.dispatchEvent(new CustomEvent('profileready', { detail: profile }));

      // Also update the local backup
      try {
        const localAnalyticsStr = localStorage.getItem('learnser_local_analytics');
        const localAnalytics = localAnalyticsStr ? JSON.parse(localAnalyticsStr) : {};
        localAnalytics.doubts_solved_count = 0;
        localStorage.setItem('learnser_local_analytics', JSON.stringify(localAnalytics));
      } catch (e) {
        console.warn("Failed to write to local analytics backup:", e);
      }

      // Write to Supabase
      await supabase.from('profiles').update({ doubts_solved_count: 0 }).eq('id', profile.id);
    } catch (err) {
      console.warn("Failed to reset doubts solved:", err);
    }
  };

  async function checkAdminPrivileges(user) {
    let isCurrentUserAdmin = false;
    let isCurrentUserSuperAdmin = false;

    // 1. Check if hardcoded Super Admin
    if (window.SUPER_ADMIN_EMAILS && window.SUPER_ADMIN_EMAILS.includes(user.email)) {
      isCurrentUserAdmin = true;
      isCurrentUserSuperAdmin = true;
    }

    // 2. Check database admin list
    if (!isCurrentUserSuperAdmin && user.email) {
      const supabase = window.supabaseClient;
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('admins')
            .select('email')
            .eq('email', user.email.toLowerCase())
            .maybeSingle();
          if (data) {
            isCurrentUserAdmin = true;
          }
        } catch (err) {
          console.error('Error checking admin status:', err);
        }
      }
    }

    window.isCurrentUserAdmin = isCurrentUserAdmin;
    window.isCurrentUserSuperAdmin = isCurrentUserSuperAdmin;

    // Show/hide admin link in the sidebar
    const adminLink = document.getElementById('adminNavLink');
    if (adminLink) {
      adminLink.style.display = isCurrentUserAdmin ? 'flex' : 'none';
    }
  }

  function checkSession() {
    const supabase = window.supabaseClient;
    if (!supabase) {
      console.warn("Supabase client is not available in auth-check.js.");
      return;
    }

    // Listener for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth State Change Event:", event);
      if (session) {
        // Clean URL hash after successful OAuth redirects to prevent token exposures
        if (window.location.hash && (window.location.hash.includes("access_token=") || window.location.hash.includes("id_token="))) {
          history.replaceState(null, document.title, window.location.pathname + window.location.search);
        }
      }

      if (!session) {
        // No active session
        localStorage.removeItem('learnser_supabase_profile');
        if (requiresAuth) {
          console.log("No session found. Redirecting to auth.html...");
          window.location.href = "auth.html";
        } else {
          // Update landing page UI if elements exist
          updateNavbarForGuest();
        }
      } else {
        // User is logged in
        const user = session.user;
        
        // Fetch or refresh the profile from profiles table
        let profile = await fetchUserProfile(user.id);
        
        if (!profile) {
          // Fallback if trigger hasn't finished or failed
          profile = {
            id: user.id,
            display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0],
            email: user.email,
            total_xp: 0,
            weekly_xp: 0,
            streak_days: 0,
            total_time_seconds: 0,
            doubts_solved_count: 0,
            student_class: "",
            board_of_examinations: ""
          };
          try {
            await supabase.from('profiles').upsert(profile);
          } catch (e) {
            console.error("Failed to upsert profile:", e);
          }
        }

        // Retrieve local analytics data to merge/preserve if database columns don't exist
        try {
          const localAnalyticsStr = localStorage.getItem('learnser_local_analytics');
          const localAnalytics = localAnalyticsStr ? JSON.parse(localAnalyticsStr) : {};
          
          if (profile.total_time_seconds === undefined || profile.total_time_seconds === null) {
            profile.total_time_seconds = parseInt(localAnalytics.total_time_seconds || 0);
          }
          if (profile.doubts_solved_count === undefined || profile.doubts_solved_count === null) {
            profile.doubts_solved_count = parseInt(localAnalytics.doubts_solved_count || 0);
          }
        } catch (e) {
          console.warn("Failed to merge local analytics data:", e);
        }

        // Cache profile data
        localStorage.setItem('learnser_supabase_profile', JSON.stringify(profile));

        // Check Admin privileges
        await checkAdminPrivileges(user);

        // Check privacy policy acceptance
        await checkPrivacyAcceptance(user, supabase);

        // If user is on auth page, redirect them to dashboard
        if (isAuthPage) {
          console.log("Session active. Redirecting to dashboard...");
          window.location.href = "dashbord.html";
          return;
        }

        // Update the UI with profile information
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", () => {
            updateUIWithProfile(profile);
            initializeTimeSpentTracking(profile);
          });
        } else {
          updateUIWithProfile(profile);
          initializeTimeSpentTracking(profile);
        }
      }
    });
  }

  async function checkPrivacyAcceptance(user, supabase) {
    if (!requiresAuth) return;

    const isAccepted = user.user_metadata?.privacy_accepted;
    if (isAccepted) return;

    const styleId = 'privacy-modal-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .privacy-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(2, 6, 17, 0.95);
          backdrop-filter: blur(16px);
          z-index: 9999999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .privacy-modal {
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 32px;
          max-width: 520px;
          width: 100%;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(24px);
          display: flex;
          flex-direction: column;
          gap: 20px;
          color: #f1f5f9;
          animation: modalFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .privacy-title {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-align: center;
        }
        .privacy-desc {
          color: #94a3b8;
          font-size: 0.9rem;
          line-height: 1.5;
        }
        .privacy-scrollbox {
          background: rgba(2, 6, 17, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 16px;
          font-size: 0.85rem;
          height: 220px;
          overflow-y: auto;
          color: #94a3b8;
          line-height: 1.6;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        .privacy-scrollbox::-webkit-scrollbar {
          width: 6px;
        }
        .privacy-scrollbox::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }
        .privacy-footer {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 10px;
        }
        .privacy-btn {
          background: #818cf8;
          color: white;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
        }
        .privacy-btn:hover {
          background: #6366f1;
          transform: translateY(-1px);
        }
        .privacy-btn:active {
          transform: translateY(0);
        }
        .privacy-btn:disabled {
          background: #334155;
          color: #64748b;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }
        .privacy-signout {
          background: transparent;
          color: #94a3b8;
          border: 1px solid rgba(255,255,255,0.1);
          padding: 12px;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }
        .privacy-signout:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        .privacy-error {
          color: #f87171;
          font-size: 0.85rem;
          text-align: center;
          display: none;
        }
      `;
      document.head.appendChild(style);
    }

    // Disable scrolling on body
    document.body.style.overflow = 'hidden';

    // Inject Modal HTML
    const overlay = document.createElement('div');
    overlay.className = 'privacy-overlay';
    overlay.id = 'privacy-consent-overlay';
    overlay.innerHTML = `
      <div class="privacy-modal">
        <div class="privacy-title">Data Privacy & Terms Update</div>
        <div class="privacy-desc">
          To comply with regional data standards, please review and accept our updated Privacy Policy to continue using Learnser AI.
        </div>
        <div class="privacy-scrollbox">
          <strong>1. Information Collection & Database Storage</strong><br>
          We collect and store your Name, Grade/Class, and Exam Board details in our secure database. This is used solely to customize your dashboard layout, mock test generator, and target questions (PYQs) to match your specific syllabus.<br><br>
          
          <strong>2. Sharing Policy</strong><br>
          Your personal data is strictly private and is NOT shared with any third party, advertiser, or external service provider at this time.<br><br>
          
          <strong>3. Future Changes & Policy Revisions</strong><br>
          This policy may be amended in the future as our services expand. In the event of any material changes, we will notify you and prompt you to re-accept our terms before we process your data.<br><br>
          
          <strong>4. Consent & Terms Acceptance</strong><br>
          By clicking "Accept & Continue", you confirm that you consent to the storage and use of your profile details (name, grade, exam board) as described in this policy.
        </div>
        <div class="privacy-error" id="privacy-error-msg"></div>
        <div class="privacy-footer">
          <button class="privacy-btn" id="privacy-accept-btn">
            Accept & Continue
          </button>
          <button class="privacy-signout" id="privacy-logout-btn">
            Sign Out / Decline
          </button>
        </div>
      </div>
    `;
    
    // Helper function to append to body safely when DOM is ready
    const appendModal = () => {
      if (!document.getElementById('privacy-consent-overlay')) {
        document.body.appendChild(overlay);
        
        // Add event listeners
        const acceptBtn = document.getElementById('privacy-accept-btn');
        const logoutBtn = document.getElementById('privacy-logout-btn');
        const errorEl = document.getElementById('privacy-error-msg');

        acceptBtn.addEventListener('click', async () => {
          acceptBtn.disabled = true;
          acceptBtn.innerText = 'Updating profile...';
          errorEl.style.display = 'none';

          try {
            const { data, error } = await supabase.auth.updateUser({
              data: { privacy_accepted: true }
            });
            if (error) throw error;

            // Clean up modal and enable scroll
            document.body.style.overflow = '';
            overlay.remove();
            console.log("Privacy policy accepted successfully.");
          } catch (err) {
            console.error("Failed to accept privacy policy:", err);
            errorEl.innerText = err.message || "Failed to update profile. Please try again.";
            errorEl.style.display = 'block';
            acceptBtn.disabled = false;
            acceptBtn.innerText = 'Accept & Continue';
          }
        });

        logoutBtn.addEventListener('click', async () => {
          logoutBtn.disabled = true;
          logoutBtn.innerText = 'Logging out...';
          try {
            await supabase.auth.signOut();
            localStorage.removeItem('learnser_supabase_profile');
            window.location.href = "auth.html";
          } catch (e) {
            console.error("Logout failed:", e);
            logoutBtn.disabled = false;
            logoutBtn.innerText = 'Sign Out / Decline';
          }
        });
      }
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", appendModal);
    } else {
      appendModal();
    }
  }

  async function fetchUserProfile(userId) {
    const supabase = window.supabaseClient;
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn("Could not fetch profile from public.profiles table:", error.message);
        return null;
      }
      return data;
    } catch (e) {
      console.error("Exception fetching profile:", e);
      return null;
    }
  }

  function updateUIWithProfile(profile) {
    // Top Navbar Profile Details
    const nameEl = document.getElementById('user-name');
    const emailEl = document.getElementById('user-email');
    const pfpEl = document.getElementById('user-pfp');

    if (nameEl) nameEl.innerText = profile.display_name || "Student";
    if (emailEl) emailEl.innerText = profile.email || "";
    
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.display_name || 'Student')}&background=818cf8&color=fff&rounded=true`;
    if (pfpEl) {
      pfpEl.src = avatarUrl;
    }

    // Dynamic landing page button when logged in
    const navRight = document.querySelector('.nav-right');
    if (navRight && (isLandingPage || !nameEl)) {
      navRight.innerHTML = '';
      const dashboardBtn = document.createElement('a');
      dashboardBtn.href = 'dashbord.html';
      dashboardBtn.className = 'custom-signin-btn';
      dashboardBtn.innerText = 'Go to Dashboard';
      dashboardBtn.style.textDecoration = 'none';
      dashboardBtn.style.display = 'inline-block';
      navRight.appendChild(dashboardBtn);
    }

    // Auto-fill Settings input fields if they exist on settings.html
    const settingDisplayName = document.getElementById('setting-display-name');
    const settingUsername = document.getElementById('setting-username');
    const settingGoogleEmail = document.getElementById('setting-google-email');
    const settingsPfpPreview = document.getElementById('settings-pfp-preview');

    if (settingDisplayName) settingDisplayName.value = profile.display_name || "";
    if (settingUsername) {
      settingUsername.value = "@" + (profile.display_name || "student").toLowerCase().replace(/\s+/g, '');
    }
    if (settingGoogleEmail) settingGoogleEmail.innerText = profile.email || "";
    if (settingsPfpPreview) settingsPfpPreview.src = avatarUrl;

    // Fire event to notify pages that profile data is ready
    window.dispatchEvent(new CustomEvent('profileready', { detail: profile }));
  }

  function updateNavbarForGuest() {
    const navRight = document.querySelector('.nav-right');
    if (navRight) {
      navRight.innerHTML = '';
      const signInBtn = document.createElement('a');
      signInBtn.href = 'auth.html';
      signInBtn.className = 'custom-signin-btn';
      signInBtn.innerText = 'Sign In';
      signInBtn.style.textDecoration = 'none';
      signInBtn.style.display = 'inline-block';
      navRight.appendChild(signInBtn);
    }
  }

  // Global Sign-Out function
  window.signOutUser = async function () {
    const supabase = window.supabaseClient;
    if (!supabase) return;

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      localStorage.removeItem('learnser_supabase_profile');
      window.location.href = "auth.html";
    } catch (e) {
      alert("Error logging out: " + e.message);
    }
  };

  // Run the session verification after initialization with robust retry polling
  if (window.supabaseClient) {
    checkSession();
  } else {
    let attempts = 0;
    const maxAttempts = 50; // Up to 5 seconds
    const interval = setInterval(() => {
      attempts++;
      if (window.supabaseClient) {
        clearInterval(interval);
        checkSession();
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        console.error("Supabase client failed to initialize in auth-check.js after 5 seconds.");
      }
    }, 100);
  }
})();
