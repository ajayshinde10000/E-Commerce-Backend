import mongoose from 'mongoose'
var newId = new mongoose.Types.ObjectId();

const userSchema = new mongoose.Schema(
    {
        _id: {
            type: String,
            required: true,
          },
        name: {
          type: String,
          required: true,
        },
        _org: {
          _id: {
            type: mongoose.Schema.Types.ObjectId,
            default: newId,
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
        email: {
          type: String,
          required: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
          type: String,
          required: true,
        },
        isEmailVerified: {
          type: Boolean,
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
      }
)

const userModel = mongoose.model("user",userSchema);

export default userModel;