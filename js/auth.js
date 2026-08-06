const Auth = {
  KEY: 'note_session_user',

  getUser() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  setUser(user) {
    localStorage.setItem(this.KEY, JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem(this.KEY);
    window.location.href = 'index.html';
  },

  // Call at the top of every protected page.
  requireLogin() {
    const user = this.getUser();
    if (!user) {
      window.location.href = 'index.html';
      return null;
    }
    return user;
  },

  requireAdmin() {
    const user = this.requireLogin();
    if (user && user.role !== 'admin') {
      window.location.href = 'dashboard.html';
      return null;
    }
    return user;
  }
};
