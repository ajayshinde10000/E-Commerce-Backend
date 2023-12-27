import mongoose from "mongoose";

const shopUserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        deleted: {
            type: Boolean,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now,
            required: true
        },
        updatedAt: {
            type: Date,
            default: Date.now,
            required: true
        },
        picture: {
            type: Object,
            default: {
                public_id:"Profile Picture/kx9nnz0yodfn0pbd8y4j",
                url:"https://res.cloudinary.com/de94zb2cq/image/upload/v1695808202/Profile%20Picture/kx9nnz0yodfn0pbd8y4j.png"} // Default image path or filename
        },
        addresses:[]
    }
);

const shopUserModel = mongoose.model("shopUser",shopUserSchema);

export default shopUserModel;