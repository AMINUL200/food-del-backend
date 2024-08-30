import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";



// create token

const createToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET);
}


// register user
const registerUser = async (req, res) => {

    const {name, email, password} = req.body;

      // Log the request body
    //   console.log("Register request body:", req.body);

      // Check if all required fields are provided
      if (!name || !email || !password) {
          return res.status(400).json({
              success: false,
              message: "Please provide name, email, and password",
          });
      }
    try {
        // checking if the user is already registered
        const exists = await userModel.findOne({email});
        if(exists) {
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            })
        }

        // validating email format & strong password
        if(!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email"
            })
        }
        if(password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters"
            })
        }

        // hashing password
        const slat = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, slat);

        const newUser = new userModel({
            name: name,
            email: email,
            password:  hashedPassword
        })

        const user = await newUser.save();
        const token = createToken(user._id)
        res.status(200).json({
            success: true,
            message: "User registered successfully",
            token: token
        })
       
    }catch (err) {
        console.log(err.message);
        res.status(500).json({
            success: false,
            message: "Something went wrong"
        })
    }
}

// login user
const loginUser = async (req, res) => {
     const {email, password} = req.body;

     try{
        const user = await userModel.findOne({email});

        if(!user){
            return res.status(400).json({
                success: false,
                message: "User doesn't exist"
            })
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({
                success: false,
                message: "Invalid password"
            })
        }

        const token = createToken(user._id);
        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            token: token
        })

     }catch(err) {
        console.log(err);
        res.status(200).json({
            success: false,
            message: "Something went wrong"
        })
     }
}

export { registerUser , loginUser};