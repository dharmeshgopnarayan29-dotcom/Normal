import api from '../api';

/** GET /api/badges/mine/ */
export const fetchMyBadges = async () => {
    const res = await api.get('badges/mine/');
    return res.data;
};
