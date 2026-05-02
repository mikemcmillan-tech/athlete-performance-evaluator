// supabase-client.js
// APE Supabase client bootstrap.
// IMPORTANT: Use your public Supabase anon key only. Never put the service role key in frontend code.

(function () {
  var cfg = window.APE_SUPABASE_CONFIG || {
    url: "YOUR_SUPABASE_PROJECT_URL",
    anonKey: "YOUR_SUPABASE_ANON_KEY"
  };

  if (!window.supabase) {
    console.warn("[APE] Supabase CDN not loaded. Cloud sync disabled.");
    window._supaClient = null;
    return;
  }

  if (!cfg.url || !cfg.anonKey || cfg.url.indexOf("YOUR_") === 0 || cfg.anonKey.indexOf("YOUR_") === 0) {
    console.warn("[APE] Supabase config missing. Local mode only until url/anonKey are set.");
    window._supaClient = null;
    return;
  }

  window._supaClient = window.supabase.createClient(cfg.url, cfg.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  console.log("[APE] Supabase client ready.");
})();