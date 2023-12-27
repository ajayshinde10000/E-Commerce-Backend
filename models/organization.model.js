import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    email:{
        type:String,
        require:true
    }
},{timestamps:true});
const organizationModel = mongoose.model("Organizations",organizationSchema);

export default organizationModel;