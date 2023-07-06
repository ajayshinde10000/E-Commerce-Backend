import dotenv from 'dotenv'
dotenv.config();

import bodyParser from 'body-parser';

import fetch from 'isomorphic-fetch';

import express from 'express';
import cors from 'cors';
import authRoutes from './Routes/authRoutes.js'
import userRoutes from './Routes/userRoutes.js'
import productRoutes from './Routes/productsRoutes.js'
import shopUserRoutes from './Routes/shopRoutes.js';
import shoopUserOrderRoutes from './Routes/shopUserOrderRoutes.js'
import sellerOrderRoutes from './Routes/sellerOrderRoutes.js'
import emailRoutes from './Routes/emailRoutes.js';


import connectDb from './Config/connectDB.js';

const PORT = process.env.PORT;
const DATABASE_URL = process.env.DATABASE_URL

const app = express();
app.use(cors());

app.use(express.static('public'));

//connection to Database
connectDb(DATABASE_URL);


app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }));


app.use('/product-images', express.static('Product-Images'));

app.use('/auth',authRoutes);

app.use('/users',userRoutes);

app.use('/products',productRoutes);

app.use('/shop',shopUserRoutes);

app.use('/shop/orders',shoopUserOrderRoutes);

app.use('/orders',sellerOrderRoutes);

app.use('/emails',emailRoutes)

app.listen(PORT,()=>{
    console.log("App Listening on 3000 port")
})