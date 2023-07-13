import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  street: String,
  addressLine2: String,
  city: String,
  state: String,
  pin: String
});

const itemSchema = new mongoose.Schema({
  productId: String,
  name: String,
  price: Number,
  qty: Number,
  subTotal: Number,
  deal:Object,
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId()
  }
});

const orderSchema = new mongoose.Schema(
  {
    address: addressSchema,
    items: [itemSchema],
    deliveryFee: Number,
    total: Number,
    transactionNo: String,
    paymentStatus: {
      type: String,
      default: 'Pending'
    },
    status: {
      type: String,
      default: 'Pending'
    },
    createdBy: {
      type: String,
      required: true
    },
    sellerId:{
      type:String,
      require:true
    },
    deleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const orderModel = mongoose.model('Order', orderSchema);
export default orderModel;
