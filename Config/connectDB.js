import mongoose from 'mongoose';

const connectDb = async (DATABASE_URL)=>{
    try{
        const DB_OPTIONS = {
            dbName : 'E-Commerce'
        }
        await mongoose.connect(DATABASE_URL,DB_OPTIONS);
        console.log("Database Connected Successfully...")
    }catch(err){
        console.log(err);
    }
}

export default connectDb;

