import express from "express";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import cors from "cors";
import { CheckAuth } from "./middlewares/authMiddleware.js";
import { connectDB } from "./config/db.js";
import cookieParser from "cookie-parser";

await connectDB();

const app = express();
const port = 4000;

const mySecretKey = "thisismysecretkey";

app.use(
  cors({
    origin: ["http://192.168.1.10:5173", "http://localhost:3000"],
    credentials: true,
  })
);

app.get("/health", (req, res) => {
  res.send("itsrunning")
})

app.use(cookieParser(mySecretKey));

app.use(express.json());

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
