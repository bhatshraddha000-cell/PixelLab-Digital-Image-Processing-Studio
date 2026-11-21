/**
 * PixelLab API Client Service Layer
 * Connects frontend with Express backend (/api) which coordinates with the Python OpenCV service.
 */

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Standard fetch wrapper with JSON parsing and error handling.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    Accept: 'application/json',
    ...options.headers,
  };

  if (!(options.body instanceof FormData) && options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || data.error || `API Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error.message);
    throw error;
  }
}

export const apiService = {
  /**
   * Health check returning detailed statuses for Express, MongoDB, and Python OpenCV service
   */
  async getHealth() {
    return request('/health');
  },

  /**
   * Image Enhancement Module Endpoints
   */
  enhancement: {
    /**
     * Get available built-in sample images
     */
    async getSamples() {
      return request('/enhancement/samples');
    },

    /**
     * Process image with Gaussian filter, Gamma transformation, and optional sharpening
     * Supports both File uploads and sampleId selection
     */
    async process(formData) {
      const url = `${API_BASE}/enhancement/process`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || `Processing failed with status ${response.status}`);
      }
      return data;
    },

    /**
     * Retrieve experiment history
     */
    async getHistory() {
      return request('/enhancement/history');
    },

    /**
     * Retrieve single experiment details
     */
    async getHistoryById(id) {
      return request(`/enhancement/history/${id}`);
    },

    /**
     * Delete an experiment from history and disk
     */
    async deleteHistory(id) {
      return request(`/enhancement/history/${id}`, {
        method: 'DELETE',
      });
    },
  },

  /**
   * Placeholders for future phases
   */
  morphology: {
    async process() {
      throw new Error('Morphological Separation algorithm will be activated in Phase 3.');
    },
  },
  watershed: {
    async process() {
      throw new Error('Watershed Segmentation algorithm will be activated in Phase 4.');
    },
  },
  classification: {
    async process() {
      throw new Error('Geometrical Classification algorithm will be activated in Phase 5.');
    },
  },
};

export default apiService;
