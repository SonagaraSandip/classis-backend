import express from "express";
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import studentRoutes from './routes/studentRoutes.js';
import testRoutes from "./routes/testRoutes.js";
import markRoutes from "./routes/markRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


app.use('/api/students' , studentRoutes)
app.use("/api/tests", testRoutes);
app.use("/api/marks", markRoutes);

mongoose.connect(process.env.MONGO_URL).then(() => console.log(" ✅DB connected")).catch(err => console.log(err))

const PORT = process.env.PORT || 5000;

app.listen(5000 , () => {
    console.log("✅ Server running on port 5000")
})