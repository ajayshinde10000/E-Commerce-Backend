import mongoose from "mongoose";

// const orgSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: true
//     },
//     email: {
//         type: String,
//         required: true
//     }
// });

const sellerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        _org: {
            type: mongoose.Schema.Types.ObjectId,
            ref:"Organizations"
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
        picture: {
            type: Object,
            default: {
                public_id:"Profile Picture/kx9nnz0yodfn0pbd8y4j",
                url:"https://res.cloudinary.com/de94zb2cq/image/upload/v1695808202/Profile%20Picture/kx9nnz0yodfn0pbd8y4j.png"} // Default image path or filename
        },
        isEmailVerified: {
            type: Boolean,
            required: true
        },
        deleted: {
            type: Boolean,
            required: true
        }
    },{timestamps:true}
);

const sellerModel = mongoose.model("seller",sellerSchema);

export default sellerModel;