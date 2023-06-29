import mongoose from 'mongoose'
var newId = new mongoose.Types.ObjectId();

const shopUserSchema = new mongoose.Schema(
    {
        name: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
        password: {
            type: String,
            required: true,
        },
        deleted: {
          type: Boolean,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
          required: true,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
          required: true,
        },
        picture: {
            type: String,
            default: 'user.png' // Default image path or filename
        },
        addresses:[]
      }
)

const shopUserModel = mongoose.model("shopUser",shopUserSchema);

export default shopUserModel;