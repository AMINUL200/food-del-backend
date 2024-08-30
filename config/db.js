import mongoose  from "mongoose";

export const connectDB = async () => {
    await mongoose.connect('mongodb+srv://abdulaminul2000:aminulislam@cluster0.n82o6yd.mongodb.net/food-del')
    .then(() =>{
        console.log("DB connection established");
    })
}

