import mongoose from 'mongoose';

const connectDb = async (DATABASE_URL)=>{
    try{
        const DB_OPTIONS = {
            dbName : 'Seller'
        }
        await mongoose.connect(DATABASE_URL,DB_OPTIONS);
        console.log("Database Connected Successfully...")
    }catch(err){
        console.log(err);
    }
}

export default connectDb;

