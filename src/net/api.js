const API = {
  base: String(window.MEADOWVALE_SERVER || "").replace(/\/$/, ""),
  token: null,
  user: null,
  reachable: null,
  init() {
    try {
      this.token = localStorage.getItem("meadowvale_token");
      this.user = JSON.parse(localStorage.getItem("meadowvale_user") || "null");
    } catch (e) {}
    if (location.protocol === "file:" && !this.base) this.reachable = false;
  },
  get loggedIn() {
    return !!(this.token && this.user);
  },
  setAuth(token, user) {
    this.token = token;
    this.user = user;
    try {
      localStorage.setItem("meadowvale_token", token);
      localStorage.setItem("meadowvale_user", JSON.stringify(user));
    } catch (e) {}
  },
  logout() {
    this.token = this.user = null;
    try {
      localStorage.removeItem("meadowvale_token");
      localStorage.removeItem("meadowvale_user");
    } catch (e) {}
  },
  async req(method, path, body, ms) {
    if (this.reachable === false && location.protocol === "file:")
      throw new Error("Online play needs the Meadowvale server (npm run dev).");
    const ctl = new AbortController(),
      timer = setTimeout(() => ctl.abort(), ms || 75000);
    let res;
    try {
      res = await fetch(this.base + "/api" + path, {
        method,
        signal: ctl.signal,
        headers: {
          "Content-Type": "application/json",
          ...(this.token ? { Authorization: "Bearer " + this.token } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      this.reachable = false;
      throw new Error("Can't reach the Meadowvale server. Check your connection.");
    } finally {
      clearTimeout(timer);
    }
    this.reachable = true;
    let data = {};
    try {
      data = await res.json();
    } catch (e) {}
    if (res.status === 401 && this.token && path !== "/auth/login") this.logout();
    if (!res.ok) throw new Error(data.error || "Server error (" + res.status + ")");
    return data;
  },
  get(p, ms) {
    return this.req("GET", p, null, ms);
  },
  post(p, b) {
    return this.req("POST", p, b || {});
  },
  put(p, b) {
    return this.req("PUT", p, b || {}, 60000);
  },
  patch(p, b) {
    return this.req("PATCH", p, b || {});
  },
  del(p) {
    return this.req("DELETE", p);
  },
  wsUrl() {
    const base = this.base || location.origin;
    return base.replace(/^http/, "ws") + "/ws?token=" + encodeURIComponent(this.token || "");
  },
};
API.init();
