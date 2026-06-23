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

  // Run the session verification after initialization
  if (window.supabaseClient) {
    checkSession();
  } else {
    // Wait for supabase-client.js to load
    setTimeout(checkSession, 100);
  }
})();
