import mongoose from "mongoose";

// const addressSchema = new mongoose.Schema({
//     street: String,
//     addressLine2: String,
//     city: String,
//     state: String,
//     pin: String
// });

const itemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"products"
    },
    name: String,
    price: Number,
    category:String,
    discountPrice:Number,
    description:String,
    images:Array,
    quantity: Number,
    subTotal: Number,
    deal:Object,
    _org: {
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            required: false
        },
        name: {
            type: String,
            required: false
        },
        email: {
            type: String,
            required: false
        }
    },
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId()
    }
});

const orderSchema = new mongoose.Schema(
    {
        address: Object,
        items: [itemSchema],
        deliveryFee: Number,
        total: Number,
        transactionNo: String,
        paymentStatus: {
            type: String,
            default: "Pending"
        },
        status: {
            type: String,
            default: "Pending"
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        sellerId:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"Seller"
        },
        _org: {
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                required: false
            },
            name: {
                type: String,
                required: false
            },
            email: {
                type: String,
                required: false
            }
        },
        deleted: {
            type: Boolean,
            default: false
        },
        mobileNo:{
            type:String,
            required:false
        },
        cardDetails:{
            type:Object,
            required:false
        }
    },
    {
        timestamps: true
    }
);

const orderModel = mongoose.model("Order", orderSchema);
export default orderModel;
