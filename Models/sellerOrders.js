import mongoose from 'mongoose';

const sellerOrderSchema = new mongoose.Schema(
  {
    // Order fields
    address: {
      street: String,
      addressLine2: String,
      city: String,
      state: String,
      pin: String
    },
    items: [
      {
        productId: String,
        name: String,
        price: Number,
        qty: Number,
        subTotal: Number,
        _id:String
      }
    ],
    deliveryFee: Number,
    total: Number,
    paymentStatus: String,
    status: String,
    sellerId: String,
    transactionNo: String,
    createdBy: String,
    deleted: Boolean
  },
  { timestamps: true } // Enable timestamps
);

const sellerOrderModel = mongoose.model('SellerOrderManagement', sellerOrderSchema);

export default sellerOrderModel;
