import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            enum: ['player', 'coach', 'referee', 'org', 'organization', 'admin'],
            trim: true,
        },
        displayName: {
            type: String,
            required: true,
            trim: true,
        },
        permissions: {
            type: [String], // mảng các quyền, ví dụ: ['create_tournament', 'edit_match']
            default: [],
        },
        isDefault: {
            type: Boolean,
            default: false, // role mặc định khi tạo user mới (ví dụ 'player')
        },
    },
    { timestamps: true }
);

// Index cho name
roleSchema.index({ name: 1 });

// Phương thức kiểm tra role có một quyền cụ thể không
roleSchema.methods.hasPermission = function (permission) {
    return this.permissions.includes(permission) || this.permissions.includes('*');
};

const Role = mongoose.model("Role", roleSchema);
export default Role;
