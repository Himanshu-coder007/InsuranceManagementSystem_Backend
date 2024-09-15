import express from "express";
// import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";
dotenv.config({});

const app = express();

const PORT = process.env.PORT || 3000;

//test
app.get("/", (req, res) => {
  return res.status(200).json({
    message: "I,am coming from backend",
    success: true,
  });
});




//middlewares
app.use(express.json());
app.use(cookieParser());
//api
app.use("/api/v1/user", userRoute);
app.listen(PORT, () => {
    connectDB();
    console.log(`Server listen at port ${PORT}`);
});