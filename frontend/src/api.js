import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.friendlyMessage = 'Impossible de joindre le serveur. Vérifiez votre connexion.';
      return Promise.reject(error);
    }
    const status = error.response.status;
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (status === 403) {
      error.friendlyMessage = 'Accès refusé.';
    } else if (status === 404) {
      error.friendlyMessage = 'Ressource introuvable.';
    } else if (status === 429) {
      error.friendlyMessage = error.response.data?.message || 'Trop de requêtes, réessayez plus tard.';
    } else if (status >= 500) {
      error.friendlyMessage = 'Erreur serveur, réessayez plus tard.';
    } else {
      error.friendlyMessage = error.response.data?.message || 'Une erreur est survenue.';
    }
    return Promise.reject(error);
  }
);

export default api;
