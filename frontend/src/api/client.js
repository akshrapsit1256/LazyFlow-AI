const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        }
      } catch {
        // fallback to status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Cannot connect to LazyFlow backend server. Please verify backend is running on port 8000.');
    }
    throw error;
  }
}

export const api = {
  // Health & AI status
  getHealth: () => request('/health'),
  getOllamaStatus: () => request('/ollama/status'),

  // Dashboard stats
  getDashboardStats: () => request('/dashboard/stats'),

  // Tasks
  getTasks: (status = 'all', priority = null) => {
    let query = `?status=${status}`;
    if (priority) query += `&priority=${priority}`;
    return request(`/tasks${query}`);
  },
  createTask: (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  generateTasks: (notes, saveImmediately = false) => 
    request('/tasks/generate', {
      method: 'POST',
      body: JSON.stringify({ notes, save_immediately: saveImmediately })
    }),
  createBulkTasks: (tasks) => request('/tasks/bulk', { method: 'POST', body: JSON.stringify(tasks) }),

  // Summarizer
  generateSummary: (text, lengthOption = 'standard', formatOption = 'bullet') =>
    request('/summaries/generate', {
      method: 'POST',
      body: JSON.stringify({ text, length_option: lengthOption, format_option: formatOption })
    }),
  saveSummary: (data) => request('/summaries', { method: 'POST', body: JSON.stringify(data) }),
  getSavedSummaries: () => request('/summaries'),
  deleteSummary: (id) => request(`/summaries/${id}`, { method: 'DELETE' }),

  // Email Assistant
  generateEmail: (promptOrOriginal, tone = 'professional', recipient = null, subject = null) =>
    request('/emails/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt_or_original: promptOrOriginal,
        tone,
        recipient,
        subject
      })
    }),
  saveEmail: (data) => request('/emails', { method: 'POST', body: JSON.stringify(data) }),
  getSavedEmails: () => request('/emails'),
  deleteEmail: (id) => request(`/emails/${id}`, { method: 'DELETE' }),

  // File Organizer
  planFileOrganization: (files, customRules = null) =>
    request('/files/organize', {
      method: 'POST',
      body: JSON.stringify({ files, custom_rules: customRules })
    }),
  executeFileOrganization: (rootDir, operations) =>
    request('/files/execute', {
      method: 'POST',
      body: JSON.stringify({ root_directory: rootDir, operations })
    }),

  // Daily Briefing
  generateBriefing: (additionalNotes = null) =>
    request('/briefings/generate', {
      method: 'POST',
      body: JSON.stringify({ additional_notes: additionalNotes })
    }),
  saveBriefing: (data) => request('/briefings', { method: 'POST', body: JSON.stringify(data) }),
  getSavedBriefings: () => request('/briefings'),
  deleteBriefing: (id) => request(`/briefings/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => request('/settings'),
  updateSetting: (key, value) => request('/settings', { method: 'POST', body: JSON.stringify({ key, value }) }),
};
