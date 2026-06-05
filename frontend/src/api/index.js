import axios from 'axios';
import { getToken, clearAuth } from '../utils/auth';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(cfg => {
  const token = getToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(err.response?.data || { message: '网络错误' });
  }
);

export default api;

// ---- 藏品 ----
export const getArtifacts   = p => api.get('/artifacts', { params: p });
export const getArtifact    = id => api.get(`/artifacts/${id}`);
export const createArtifact = d => api.post('/artifacts', d);
export const updateArtifact = (id, d) => api.put(`/artifacts/${id}`, d);
export const deleteArtifact = id => api.delete(`/artifacts/${id}`);

// ---- 捐赠人 ----
export const getDonors   = p => api.get('/donors', { params: p });
export const getAllDonors = () => api.get('/donors/all');
export const createDonor = d => api.post('/donors', d);
export const updateDonor = (id, d) => api.put(`/donors/${id}`, d);
export const deleteDonor = id => api.delete(`/donors/${id}`);

// ---- 展馆 ----
export const getHalls   = p => api.get('/halls', { params: p });
export const getAllHalls = () => api.get('/halls/all');
export const createHall = d => api.post('/halls', d);
export const updateHall = (id, d) => api.put(`/halls/${id}`, d);
export const deleteHall = id => api.delete(`/halls/${id}`);

// ---- 展览 ----
export const getExhibitions       = p => api.get('/exhibitions', { params: p });
export const getExhibition        = id => api.get(`/exhibitions/${id}`);
export const createExhibition     = d => api.post('/exhibitions', d);
export const updateExhibition     = (id, d) => api.put(`/exhibitions/${id}`, d);
export const deleteExhibition     = id => api.delete(`/exhibitions/${id}`);
export const addExhibitionArtifacts    = (id, ids) => api.post(`/exhibitions/${id}/artifacts`, { artifact_ids: ids });
export const removeExhibitionArtifact  = (id, aid) => api.delete(`/exhibitions/${id}/artifacts/${aid}`);

// ---- 借展 ----
export const getLoans    = p => api.get('/loans', { params: p });
export const getLoan     = id => api.get(`/loans/${id}`);
export const createLoan  = d => api.post('/loans', d);
export const returnLoan  = (id, d) => api.put(`/loans/${id}/return`, d);
export const cancelLoan  = id => api.put(`/loans/${id}/cancel`);

// ---- 报表 ----
export const getOverview          = () => api.get('/reports/overview');
export const getArtifactsByCategory = () => api.get('/reports/artifacts-by-category');
export const getArtifactsByCondition = () => api.get('/reports/artifacts-by-condition');
export const getLoansByMonth       = () => api.get('/reports/loans-by-month');
export const getExhibitionVisitors = () => api.get('/reports/exhibition-visitors');
export const getDonorStats         = () => api.get('/reports/donor-stats');
export const getBorrowerStats      = () => api.get('/reports/borrower-stats');

// ---- 分类 ----
export const getCategories     = () => api.get('/categories');
export const getCategoriesFlat = () => api.get('/categories/flat');
export const createCategory    = d => api.post('/categories', d);
export const updateCategory    = (id, d) => api.put(`/categories/${id}`, d);
export const deleteCategory    = id => api.delete(`/categories/${id}`);

// ---- 帮助 ----
export const getHelp     = module => api.get(`/help/${module}`);
export const getAllHelp   = () => api.get('/help');
export const saveHelp    = d => api.post('/help', d);
export const deleteHelp  = module => api.delete(`/help/${module}`);

// ---- 用户 ----
export const getUsers        = () => api.get('/users');
export const createUser      = d => api.post('/users', d);
export const updateUser      = (id, d) => api.put(`/users/${id}`, d);
export const resetPassword   = (id, pwd) => api.put(`/users/${id}/password`, { new_password: pwd });
export const deleteUser      = id => api.delete(`/users/${id}`);

// ---- 认证 ----
export const login     = d => api.post('/auth/login', d);
export const register  = d => api.post('/auth/register', d);
export const getMe     = () => api.get('/auth/me');

// ---- 审计日志 ----
export const getAuditLogs = p => api.get('/auditlogs', { params: p });

// ---- 公众展示 ----
export const getPublicArtifacts  = p => api.get('/public/artifacts', { params: p });
export const getPublicArtifact   = id => api.get(`/public/artifacts/${id}`);
export const getPublicCategories = () => api.get('/public/categories');
