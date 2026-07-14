import Role from '../models/roles.js';

const initRoles = async () => {
    const roles = [
        { name: 'player', displayName: 'Cầu thủ', permissions: ['view_tournament', 'join_team'], isDefault: true },
        { name: 'coach', displayName: 'Huấn luyện viên', permissions: ['view_tournament', 'manage_team'], isDefault: false },
        { name: 'referee', displayName: 'Trọng tài', permissions: ['view_tournament', 'enter_match_result'], isDefault: false },
        { name: 'org', displayName: 'Ban tổ chức', permissions: ['create_tournament', 'manage_tournament'], isDefault: false },
        { name: 'organization', displayName: 'Ban tổ chức', permissions: ['create_tournament', 'manage_tournament'], isDefault: false },
        { name: 'admin', displayName: 'Quản trị viên', permissions: ['*'], isDefault: false }
    ];

    for (const role of roles) {
        await Role.findOneAndUpdate(
            { name: role.name },
            role,
            { upsert: true, setDefaultsOnInsert: true }
        );
    }
    console.log('✅ Roles initialized');
};

export default initRoles;
