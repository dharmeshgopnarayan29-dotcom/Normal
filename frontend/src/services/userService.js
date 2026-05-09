import api from '../api';

/** GET /api/users/profile/karma/ */
export const fetchKarma = async () => {
    const res = await api.get('users/profile/karma/');
    return res.data; // { karma: number }
};
