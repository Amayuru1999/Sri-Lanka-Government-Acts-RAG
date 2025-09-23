// src/models/User.js
import mongoose from "mongoose";
import connection from "../../config/db.js"; 

const { Schema } = mongoose;


mongoose.connection = connection;

const userSchema = new Schema(
  {


    name: { type: String },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Invalid email",
      ],
    },
    password: {
      type: String,
      required: function () {
        return this.authMethod === "local";
      },
      minlength: 8,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    authMethod: {
      type: String,
      required: true,
      enum: ["local", "google"],
      default: "local",
    },
    isVerified: { type: Boolean, default: false },
    passwordChangedAt: Date,
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
