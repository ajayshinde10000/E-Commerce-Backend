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
            type: String,
            default: "Profile-Picture-Images/28ad22b01fb87e34f1fdf4014e2a0e3c" // Default image path or filename
        },
        addresses:[]
    }
);

const shopUserModel = mongoose.model("shopUser",shopUserSchema);

export default shopUserModel;