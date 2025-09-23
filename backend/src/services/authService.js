// src/services/authService.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


export const localSignup = async (name,email, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    provider: "local",
  });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
  return { user, token };
};

export const localSignIn = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  if (user.provider === "google")
    throw new Error("This email is linked with Google. Use Google login.");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid credentials");

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
  return { user, token };
};



export const googleAuth = async (googleToken) => {
  
  const ticket = await client.verifyIdToken({
    idToken: googleToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  console.log("Google Auth Payload:", payload);

  
  let user = await User.findOne({ email: payload.email });

  if (!user) {
    
    user = await User.create({
      email: payload.email,
      name: payload.name,
      googleId: payload.sub, 
      authMethod: "google",  
      password: undefined,  
      isVerified: true,     
    });
  }

  
  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return { user, token };
};

export const findUserById = async (userId) => {
  const user = await User.findById(userId).select("-password -googleId");
  return user;
};
