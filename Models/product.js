import mongoose from 'mongoose'

const productsSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
          },
          description: {
            type: String,
            required: true
          },
          category: {
            type: String,
            required: true
          },
          price: {
            type: Number,
            required: true
          },
          images: {
            type: [String], // Array of image filenames
            required: true
        },
        _org: {
            _id: {
              type: mongoose.Schema.Types.ObjectId,
              required: true,
            },
            name: {
              type: String,
              required: true,
            },
            email: {
              type: String,
              required: true,
            },
        },
        deal:{},
        sellerId:{
          type: String,
          required: false,
        }
      }
)

const productsModel = mongoose.model("products",productsSchema);

export default productsModel;