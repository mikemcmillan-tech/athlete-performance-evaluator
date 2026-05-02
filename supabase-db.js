// supabase-db.js
// Dual-write adapter for APE.
// Keeps existing localStorage DB working, then syncs signed-in coach data to Supabase.

(function () {
  var currentUser = null;
  var originalDB = window.DB;

  if (!originalDB) {
    console.warn("[APE] DB not found. Supabase adapter did not initialize.");
    return;
  }

  function client() { return window._supaClient || null; }
  function isReady() { return !!(client() && currentUser && currentUser.id); }
  function clean(v) { return v === undefined ? null : v; }

  async function upsertTeam(t) {
    if (!isReady() || !t) return;
    await client().from("teams").upsert({
      id: String(t.id),
      user_id: currentUser.id,
      name: clean(t.name),
      color: clean(t.color),
      created_at_ms: clean(t.created)
    }, { onConflict: "id" });
  }

  async function upsertEvaluation(athleteId, s) {
    if (!isReady() || !s) return;
    await client().from("evaluations").upsert({
      id: String(s.id),
      user_id: currentUser.id,
      athlete_id: String(athleteId),
      ts: clean(s.ts),
      date_label: clean(s.date),
      raw: clean(s.raw || {}),
      scores: clean(s.sc || {}),
      bucket: clean(s.bkt),
      bucket_name: clean(s.bktName),
      deficiency_type: clean(s.defType),
      focus: clean(s.focus),
      count_metrics: clean(s.cnt),
      ape_score: clean(s.apeScore),
      note: clean(s.note)
    }, { onConflict: "id" });
  }

  async function upsertAthlete(a) {
    if (!isReady() || !a) return;
    await client().from("athletes").upsert({
      id: String(a.id),
      user_id: currentUser.id,
      name: clean(a.name),
      nk: clean(a.nk),
      tier: clean(a.tier),
      sport: clean(a.sport),
      position: clean(a.position),
      age: clean(a.age),
      team_id: clean(a.team),
      grad_year: clean(a.gradYear),
      notes: clean(a.notes),
      bodyweight: clean(a.bodyweight),
      training_age: clean(a.trainingAge),
      created_at_ms: clean(a.created)
    }, { onConflict: "id" });

    if (Array.isArray(a.s)) {
      for (const s of a.s) await upsertEvaluation(a.id, s);
    }
  }

  async function syncSettings() {
    if (!isReady() || !originalDB.getSettings) return;
    const cfg = originalDB.getSettings() || {};
    await client().from("coach_settings").upsert({
      user_id: currentUser.id,
      coach_name: clean(cfg.coach),
      gym_name: clean(cfg.gym),
      tagline: clean(cfg.tagline),
      contact: clean(cfg.contact),
      settings: cfg
    }, { onConflict: "user_id" });
  }

  async function syncAll() {
    if (!isReady()) return;
    if (originalDB.getTeams) {
      for (const t of originalDB.getTeams()) await upsertTeam(t);
    }
    if (originalDB.getAll) {
      for (const a of originalDB.getAll()) await upsertAthlete(a);
    }
    await syncSettings();
    console.log("[APE] Cloud sync complete.");
  }

  function patch(name, after) {
    if (typeof originalDB[name] !== "function") return;
    const old = originalDB[name];
    originalDB[name] = function () {
      const result = old.apply(originalDB, arguments);
      Promise.resolve(after(arguments, result)).catch(console.warn);
      return result;
    };
  }

  patch("create", (args, result) => result && upsertAthlete(result));
  patch("updateAthlete", args => {
    const a = originalDB.get(args[0]);
    if (a) return upsertAthlete(a);
  });
  patch("addSession", (args, result) => result && upsertEvaluation(args[0], result));
  patch("createTeam", (args, result) => result && upsertTeam(result));
  patch("saveSettings", () => syncSettings());

  window.SupaDB = {
    setUser(user) { currentUser = user || null; },
    getUser() { return currentUser; },
    isAuthenticated() { return !!currentUser; },
    syncAll
  };

  console.log("[APE] Supabase dual-write adapter ready.");
})();