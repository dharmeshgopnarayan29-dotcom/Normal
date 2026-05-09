import api from '../api';

/** GET /api/issues/?location=... */
export const fetchComplaints = async (location = '') => {
    const params = location ? `?location=${encodeURIComponent(location)}` : '';
    const res = await api.get(`issues/${params}`);
    return res.data;
};

/** GET /api/issues/my/ */
export const fetchMyComplaints = async () => {
    const res = await api.get('issues/my/');
    return res.data;
};

/** POST /api/issues/ (multipart/form-data) */
export const addComplaint = async (formData) => {
    const res = await api.post('issues/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};

/** DELETE /api/issues/:id/delete/ */
export const deleteComplaint = async (id) => {
    await api.delete(`issues/${id}/delete/`);
    return id;
};

/** PATCH /api/issues/:id/ */
export const updateIssueStatus = async ({ id, status }) => {
    const res = await api.patch(`issues/${id}/`, { status });
    return res.data;
};

/** POST /api/issues/:id/upvote/ */
export const toggleUpvote = async (id) => {
    const res = await api.post(`issues/${id}/upvote/`);
    return res.data;
};

/** POST /api/issues/:id/flag/ */
export const toggleFlag = async (id) => {
    const res = await api.post(`issues/${id}/flag/`);
    return res.data;
};

/** GET /api/issues/:id/comments/ */
export const fetchComments = async (issueId) => {
    const res = await api.get(`issues/${issueId}/comments/`);
    return res.data;
};

/** POST /api/issues/:id/comments/ */
export const addComment = async ({ issueId, text }) => {
    const res = await api.post(`issues/${issueId}/comments/`, { text });
    return res.data;
};
