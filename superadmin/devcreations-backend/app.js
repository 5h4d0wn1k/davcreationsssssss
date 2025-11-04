import express from "express";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import cors from "cors";
import { CheckAuth } from "./middlewares/authMiddleware.js";
import { connectDB } from "./config/db.js";
import cookieParser from "cookie-parser";
import { generalLimiter } from "./middlewares/rateLimitMiddleware.js";

await connectDB();

const app = express();
const port = process.env.PORT || 4000;

const mySecretKey = process.env.MYSECRET;

app.use(
  cors({
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ["http://localhost:3000"],
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.json({message: "app is running fine"});
})

app.use(cookieParser(mySecretKey));

app.use(express.json());

app.use(generalLimiter);

app.use("/", userRoutes);

app.use("/", adminRoutes);


app.use((err, req, res, next) => {
  console.log(err);
  return res.status(err.status || 500).json({
    error: "Something went wrong",
  });
});

app.listen(port, () => {
  console.log("Server is running on port 4000");
});
