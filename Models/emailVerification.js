import mongoose from "mongoose";

const emailVerificationSchema = new mongoose.Schema(
    {
        email: String,
        description: String
    },
    { timestamps: true }
);


const emailVerificationModel = mongoose.model("Verify_Emails",emailVerificationSchema);

export default emailVerificationModel;