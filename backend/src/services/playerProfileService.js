import Player from '../models/players.js';

const DEFAULT_BIRTH_DATE = new Date('2000-01-01T00:00:00.000Z');
const VALID_GENDERS = new Set(['male', 'female', 'other']);

const normalizeGender = (value) => {
    const gender = String(value || '').trim().toLowerCase();
    return VALID_GENDERS.has(gender) ? gender : 'other';
};

const normalizeSkill = (value) => {
    const skill = Number(value);
    return Number.isFinite(skill) && skill > 0 ? skill : 1;
};

const normalizeBirthDate = (value) => {
    if (!value) return DEFAULT_BIRTH_DATE;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? DEFAULT_BIRTH_DATE : date;
};

export const buildPlayerProfileDefaults = (user = {}, overrides = {}) => ({
    userId: user._id,
    name: String(overrides.name || user.fullName || user.username || 'Vận động viên').trim(),
    avatar: overrides.avatar || user.avatar || '',
    birthDate: normalizeBirthDate(overrides.birthDate || user.birthDate),
    gender: normalizeGender(overrides.gender || user.gender),
    skill: normalizeSkill(overrides.skill),
    phone: overrides.phone || user.phoneNumber || '',
    email: overrides.email || user.email || '',
    address: overrides.address || user.address || '',
    sports: Array.isArray(overrides.sports) ? overrides.sports : [],
    status: 'actived'
});

export const ensurePlayerProfileForUser = async (user, options = {}) => {
    if (!user?._id) return null;

    const query = Player.findOne({ userId: user._id });
    if (options.session) query.session(options.session);
    const existing = await query;
    if (existing) return existing;

    const payload = buildPlayerProfileDefaults(user, options.defaults);
    if (options.session) {
        const [created] = await Player.create([payload], { session: options.session });
        return created;
    }

    return Player.create(payload);
};
