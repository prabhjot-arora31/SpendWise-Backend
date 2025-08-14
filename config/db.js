import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  await mongoose
    .connect(uri, {
      autoIndex: process.env.NODE_ENV !== "production",
    })
    .then(() => {
      console.log("✅ MongoDB connected");
    })
    .catch((e) => {
      console.log(`Error: ${e.message}`);
    });
};
export default connectDB;
