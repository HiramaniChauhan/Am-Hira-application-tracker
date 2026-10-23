const API_BASE = '/api';

export const authStorage = {
  getToken: () => localStorage.getItem('easyjob_token'),
  setToken: (token) => localStorage.setItem('easyjob_token', token),
  clearToken: () => localStorage.removeItem('easyjob_token'),
  getUser: () => {
    try {
      const u = localStorage.getItem('easyjob_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem('easyjob_user', JSON.stringify(user)),
  clearUser: () => localStorage.removeItem('easyjob_user')
};

async function request(endpoint, options = {}) {
  const token = authStorage.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed (${response.status})`);
  }

  return data;
}

export const api = {
  // Auth
  login: async (email, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    authStorage.setToken(data.token);
    authStorage.setUser(data.user);
    return data;
  },

  register: async (name, email, password) => {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    authStorage.setToken(data.token);
    authStorage.setUser(data.user);
    return data;
  },

  getMe: async () => {
    const data = await request('/auth/me');
    authStorage.setUser(data.user);
    return data.user;
  },

  updateProfile: async (profileData) => {
    const data = await request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    authStorage.setUser(data.user);
    return data;
  },

  changePassword: async (currentPassword, newPassword) => {
    return request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  logout: () => {
    authStorage.clearToken();
    authStorage.clearUser();
  },

  // Companies Directory
  getCompanies: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category && params.category !== 'All') query.set('category', params.category);
    return request(`/companies?${query.toString()}`);
  },

  addCompany: async (companyData) => {
    return request('/companies', {
      method: 'POST',
      body: JSON.stringify(companyData)
    });
  },

  // Admin Approvals
  getPendingCompanies: async () => {
    return request('/companies/pending');
  },

  approveCompany: async (companyId) => {
    return request(`/companies/${companyId}/approve`, {
      method: 'POST'
    });
  },

  rejectCompany: async (companyId, reason = '') => {
    return request(`/companies/${companyId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  deleteCompany: async (companyId) => {
    return request(`/companies/${companyId}`, {
      method: 'DELETE'
    });
  },

  bulkDeleteCompanies: async (ids) => {
    return request('/companies/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids })
    });
  },

  getMySubmissions: async () => {
    return request('/companies/my-submissions');
  },

  validateLink: async (url) => {
    return request('/companies/validate-link', {
      method: 'POST',
      body: JSON.stringify({ url })
    });
  },

  // Applications & Checkboxes Tracker
  getApplications: async (status = 'all') => {
    return request(`/applications?status=${status}`);
  },

  toggleApplied: async (companyId, isApplied) => {
    return request('/applications/toggle-applied', {
      method: 'POST',
      body: JSON.stringify({ companyId, isApplied })
    });
  },

  toggleInterviewed: async (companyId, isInterviewed, interviewStage) => {
    return request('/applications/toggle-interviewed', {
      method: 'POST',
      body: JSON.stringify({ companyId, isInterviewed, interviewStage })
    });
  },

  saveToApply: async (companyId, notes = '') => {
    return request('/applications/save-to-apply', {
      method: 'POST',
      body: JSON.stringify({ companyId, notes })
    });
  },

  updateApplicationDetails: async (details) => {
    return request('/applications/update-details', {
      method: 'POST',
      body: JSON.stringify(details)
    });
  },

  getStats: async () => {
    return request('/applications/stats');
  },

  // Stored Links Vault (Private SQLite User Links)
  getLinks: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category && params.category !== 'All') query.set('category', params.category);
    if (params.status && params.status !== 'all') query.set('status', params.status);
    return request(`/links?${query.toString()}`);
  },

  addLink: async (linkData) => {
    return request('/links', {
      method: 'POST',
      body: JSON.stringify(linkData)
    });
  },

  updateLink: async (id, linkData) => {
    return request(`/links/${id}`, {
      method: 'PUT',
      body: JSON.stringify(linkData)
    });
  },

  deleteLink: async (id) => {
    return request(`/links/${id}`, {
      method: 'DELETE'
    });
  },

  trackLinkClick: async (id) => {
    return request(`/links/${id}/click`, {
      method: 'POST'
    });
  },

  getLinksStats: async () => {
    return request('/links/stats');
  }
};
