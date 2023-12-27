import mongoose from "mongoose";

const emailsSchema = new mongoose.Schema(
    {
        email: String,
        name: String,
        description: String,
        link:String,
        type:String
    },
    { timestamps: true }
);


const emailsModel = mongoose.model("Emails",emailsSchema);

export default emailsModel;