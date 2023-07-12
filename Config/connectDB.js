import mongoose from 'mongoose';

const connectDb = async (CLOUD_DATABASE_URL)=>{
    try{
        const DB_OPTIONS = {
            dbName : 'E-Commerce'
        }
        await mongoose.connect(CLOUD_DATABASE_URL,DB_OPTIONS);
        console.log("Database Connected Successfully...")
    }catch(err){
        console.log(err);
    }
}

export default connectDb;

