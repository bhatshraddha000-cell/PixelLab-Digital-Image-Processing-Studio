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
   * Module 02: Morphological Object Separation & Counting Endpoints
   */
  morphology: {
    /**
     * Get available built-in benchmark coin sample datasets
     */
    async getSamples() {
      return request('/morphology/samples');
    },

    /**
     * Process image with morphological operations (erosion, dilation, opening, connected-components)
     */
    async process(formData) {
      const url = `${API_BASE}/morphology/process`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || `Morphology processing failed with status ${response.status}`);
      }
      return data;
    },

    /**
     * Retrieve morphology experiment history
     */
    async getHistory() {
      return request('/morphology/history');
    },

    /**
     * Retrieve single morphology experiment details
     */
    async getHistoryById(id) {
      return request(`/morphology/history/${id}`);
    },

    /**
     * Delete a morphology experiment from history and disk
     */
    async deleteHistory(id) {
      return request(`/morphology/history/${id}`, {
        method: 'DELETE',
      });
    },
  },
  /**
   * Module 03: Marker-Controlled Watershed Segmentation Endpoints
   */
  watershed: {
    /**
     * Get available built-in benchmark touching coin sample datasets
     */
    async getSamples() {
      return request('/watershed/samples');
    },

    /**
     * Process image with marker-controlled watershed segmentation
     */
    async process(formData) {
      const url = `${API_BASE}/watershed/process`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || `Watershed processing failed with status ${response.status}`);
      }
      return data;
    },

    /**
     * Retrieve watershed experiment history
     */
    async getHistory() {
      return request('/watershed/history');
    },

    /**
     * Retrieve single watershed experiment details
     */
    async getHistoryById(id) {
      return request(`/watershed/history/${id}`);
    },

    /**
     * Delete a watershed experiment from history and disk
     */
    async deleteHistory(id) {
      return request(`/watershed/history/${id}`, {
        method: 'DELETE',
      });
    },
  },
  /**
   * Module 04: Region-Based Object Classification Using Geometrical Descriptors
   */
  classification: {
    /**
     * Get available benchmark multi-shape scenes
     */
    async getSamples() {
      return request('/classification/samples');
    },

    /**
     * Get dataset statistics, category counts, and sample previews
     */
    async getDataset() {
      return request('/classification/dataset');
    },

    /**
     * Train KNN classifier on the geometric dataset
     */
    async train(params = {}) {
      return request('/classification/train', {
        method: 'POST',
        body: params,
      });
    },

    /**
     * Get active/default trained classification model details
     */
    async getModel() {
      return request('/classification/model');
    },

    /**
     * Process image for object segmentation, feature extraction, and classification
     */
    async process(formData) {
      const url = `${API_BASE}/classification/process`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || `Classification failed with status ${response.status}`);
      }
      return data;
    },

    /**
     * Retrieve classification experiment history
     */
    async getHistory() {
      return request('/classification/history');
    },

    /**
     * Retrieve single classification experiment details
     */
    async getHistoryById(id) {
      return request(`/classification/history/${id}`);
    },

    /**
     * Delete a classification experiment from history and disk
     */
    async deleteHistory(id) {
      return request(`/classification/history/${id}`, {
        method: 'DELETE',
      });
    },
  },
};

export default apiService;
