const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/user.model");
const Password = require("../models/user_passwords.model");

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await UserModel.findOne({ email: email });
    if (userExists) {
      return res.status(400).send({
        statusCode: 400,
        data: null,
        message: "User already exists",
        success: false,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await UserModel.create({
      name,
      email,
      password: hashedPassword,
    });
    const user_details = {
      name: newUser.name,
      email: newUser.email,
      user_id: newUser._id,
    };

    const token = jwt.sign({ id: newUser?._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    if (newUser) {
      return res.status(201).send({
        statusCode: 201,
        data: { user_details: user_details, token: token },
        message: "User created successfully.",
        success: true,
      });
    } else {
      return res.status(400).send({
        statusCode: 400,
        data: null,
        message: "User creation failed.",
        success: false,
      });
    }
  } catch (error) {
    console.error("❌ Error in user registration: ", error);
    return res.status(500).send({
      statusCode: 500,
      data: null,
      message: "Internal server error",
      success: false,
    });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).send({
        statusCode: 404,
        data: null,
        message: "User not found",
        success: false,
      });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).send({
        statusCode: 400,
        data: null,
        message: "Invalid credentials",
        success: false,
      });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const total_passwords = await Password.find({ user_id: user._id });

    const user_details = {
      name: user.name,
      email: user.email,
      user_id: user._id,
      total_passwords_stored: total_passwords?.length,
      total_breached_passwords: total_passwords?.reduce(
        (acc, item) => item?.breachedCount || 0,
        0
      ),
    };

    return res.status(200).send({
      statusCode: 200,
      data: { user_details: user_details, token: token },
      message: "User logged in successfully",
      success: true,
    });
  } catch (error) {
    console.error("❌ Error in user login: ", error);
    return res.status(500).send({
      statusCode: 500,
      data: null,
      message: "Internal server error",
      success: false,
    });
  }
};

const validate_token = async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer", "").trim();
  console.log("Token: ", token);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).send({
        statusCode: 401,
        data: { valid: false },
        message: "Token is invalid or expired.",
        success: false,
      });
    }
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(403).send({
        statusCode: 403,
        data: { valid: false },
        message: "User does not exist.",
        success: false,
      });
    }
    return res.status(200).send({
      statusCode: 200,
      data: { valid: true },
      message: "Token is valid and user exists.",
      success: true,
    });
  } catch (error) {
    console.log("Error while validating token: ", error);
    return res.status(500).send({
      statusCode: 500,
      data: { valid: false },
      message: "Token is invalid or expired.",
      success: false,
    });
  }
};

module.exports = { registerUser, loginUser };
