// supabase-client.js
// This script initializes the Supabase client using window.env variables.
// Ensure env.js and the Supabase CDN script are loaded before this script.

(function () {
  // Dynamically load env.js if window.env is not defined
  if (!window.env) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", "env.js", false); // Synchronous load
      xhr.send(null);
      if (xhr.status === 200 || (xhr.status === 0 && xhr.responseText)) {
        const fn = new Function(xhr.responseText);
        fn();
        console.log("env.js loaded dynamically successfully.");
      }
    } catch (e) {
      console.warn("Failed to load env.js dynamically:", e);
    }
  }

  const supabaseUrl = window.env?.SUPABASE_URL;
  const supabaseAnonKey = window.env?.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "Supabase environment variables are missing! Please fill in your SUPABASE_URL and SUPABASE_ANON_KEY in env.js."
    );
    // Expose a dummy client or helper to prevent complete site crashes
    window.supabaseClient = null;
    return;
  }

  if (!window.supabase) {
    console.error(
      "Supabase SDK is not loaded. Ensure that the Supabase CDN script tag is added before supabase-client.js."
    );
    window.supabaseClient = null;
    return;
  }

  try {
    // Initialize Supabase Client
    const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        experimental: {
          passkey: true
        }
      }
    });
    // Expose it globally
    window.supabaseClient = supabaseClient;
    window.SUPER_ADMIN_EMAILS = [
      'aryamansingh2w16@gmail.com',
      'gk123ganubanu@gmail.com'
    ];
    console.log("Supabase Client initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    window.supabaseClient = null;
  }
})();
