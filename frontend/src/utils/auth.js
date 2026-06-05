export const TOKEN_KEY = 'museum_token';
export const USER_KEY  = 'museum_user';

export const getToken  = () => localStorage.getItem(TOKEN_KEY);
export const getUser   = () => JSON.parse(localStorage.getItem(USER_KEY) || 'null');
export const setAuth   = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
export const isAdmin   = () => getUser()?.role === 'admin';
