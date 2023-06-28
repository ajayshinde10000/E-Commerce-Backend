import dotenv from 'dotenv'
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './Routes/authRoutes.js'
import userRoutes from './Routes/userRoutes.js'

import connectDb from './Config/connectDB.js';

const port = process.env.PORT;
const DATABASE_URL = process.env.DATABASE_URL

const app = express();
app.use(cors());

//connection to Database
connectDb(DATABASE_URL);

app.use(express.json());

app.use('/auth',authRoutes);

app.use('/users',userRoutes);

app.listen(3000,()=>{
    console.log("App Listening on 3000 port")
})