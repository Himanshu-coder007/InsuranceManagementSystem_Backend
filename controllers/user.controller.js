import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


export const register = async (req, res) => {
  try {
    const { name, email, password, age, gender, address, city, country } =
      req.body;
    if (
      !name ||
      !email ||
      !password ||
      !age ||
      !gender ||
      !address ||
      !city ||
      !country
    ) {
      return res.status(401).json({
        message: "All Fields are required",
        success: false,
      });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(401).json({
        message: "User with same email already exists",
        success: false,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      name,
      email,
      password: hashedPassword,
      age,
      gender,
      address,
      city,
      country,
    });
    return res.status(201).json({
      message: "Account created successfully. ",
      success: true,
    });
     
  } catch (error) {
    console.log(error);
  }
};



export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({
        messgae: "Something is missing, please check!",
        success: false,
      });
    }
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Incorrect email or passowrd",
        success: false,
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        message: " Incorrect email or password",
        success: false,
      });
    }

    const tokenData = {
      userId: user._id,
    };
    const token = await jwt.sign(tokenData, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });
      user = {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      age: user.age,
      gender: user.gender,
      address: user.address,
      city: user.city,
      country: user.country,
      policies: user.policies,
    };
    return res
      .status(210)
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "strict",
        expiresIn: "1d",
      })
      .json({
        message: `Welcome back ${user.name}`,
        user,
        success: true,
      });
  } catch (error) {
    console.log(error);
  }
};

export const logout = async(req,res) => {
  try {
    return res.cookie("token", "", {maxAge: 0}).json({
      message: "Logged Out successfully.",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
}

export const getProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    let user = await User.findById(userId).select("-password");
    return res.status(200).json({
      user,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const editProfile = async (req, res) => {
  try {
    const userId = req.id;
    const { name, age, gender, address, city, country } = req.body;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "User not found.",
        success: false,
      });
    }

    // Update user fields if they are provided in the request
    if (name) user.name = name;
    if (age) user.age = age;
    if (gender) user.gender = gender;
    if (address) user.address = address;
    if (city) user.city = city;
    if (country) user.country = country;

    // Save the updated user data
    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully.",
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({
      message: "An error occurred while updating the profile.",
      success: false,
      error: error.message || "Server Error",
    });
  }
};
