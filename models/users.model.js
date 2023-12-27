import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        _org: {
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            name: {
                type: String,
                required: true
            },
            email: {
                type: String,
                required: true
            }
        },
        email: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        role: {
            type: String,
            required: true
        },
        isEmailVerified: {
            type: Boolean,
            required: true
        },
        deleted: {
            type: Boolean,
            required: true
        },
        picture: {
            type: Object,
            default: {
                public_id: "Profile Picture/kx9nnz0yodfn0pbd8y4j",
                url: "https://res.cloudinary.com/de94zb2cq/image/upload/v1695808202/Profile%20Picture/kx9nnz0yodfn0pbd8y4j.png"
            } // Default image path or filename
        }
    },
    { timestamps: true }
);

const userModel = mongoose.model("user", userSchema);
export default userModel;
