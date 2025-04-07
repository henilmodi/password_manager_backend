const express = require("express");
const bcrypt = require("bcrypt");
const userModel = require("../models/user.model");
const Password = require("../models/user_passwords.model");
const CryptoJS = require("crypto-js");
const checkPasswordBreach = require("../utils/checkPasswordBreach");

const secretKey = process.env.PASSWORD_SECRET_KEY || "mySuperSecretKey";

const add_password = async (req, res) => {
  const {
    user_id,
    companyName,
    companyUrl,
    companyLogoUrl,
    emailOrUserId,
    password,
  } = req.body;

  try {
    const userExists = await userModel.findById(user_id);
    if (!userExists) {
      return res.status(404).send({
        statusCode: 404,
        message: "User does not exist.",
        data: null,
        success: false,
      });
    }

    // Step 1: Check if the password is breached
    const breachedCount = await checkPasswordBreach(password);

    // Step 2: Encrypt the password
    const encryptedPassword = CryptoJS.AES.encrypt(
      password,
      secretKey
    ).toString();

    // Step 3: Save to DB
    const add_password = await Password.create({
      user_id,
      companyName,
      companyUrl,
      companyLogoUrl,
      emailOrUserId,
      password: encryptedPassword,
      breachedCount,
    });

    return res.status(201).send({
      statusCode: 201,
      message: "Password added successfully.",
      data: add_password,
      success: true,
    });
  } catch (err) {
    console.error("❌ Error in adding password: ", err);
    return res.status(500).send({
      statusCode: 500,
      data: null,
      message: "Internal server error.",
      success: false,
    });
  }
};

const get_passwords = async (req, res) => {
  const user_id = req.params.user_id;
  console.log("User ID: ", user_id);
  try {
    const userExists = await userModel.find({ _id: user_id });
    if (!userExists) {
      return res.status(404).send({
        statusCode: 404,
        message: "User does not exist.",
        data: null,
        success: false,
      });
    }

    const passwords = await Password.find({ user_id: user_id });
    if (passwords.length === 0) {
      return res.status(200).send({
        statusCode: 200,
        message: "No passwords found.",
        data: passwords,
        success: true,
      });
    }

    const result = await Password.aggregate([
      {
        $group: {
          _id: {
            companyName: "$companyName",
            companyUrl: "$companyUrl",
          },
          count: { $sum: 1 },
          companyLogoUrl: { $first: "$companyLogoUrl" },
          companyUrl: { $first: "$companyUrl" },
          ids: { $push: "$_id" },
        },
      },
      {
        $project: {
          _id: 0,
          companyId: { $first: "$ids" },
          companyName: "$_id",
          count: 1,
          companyLogoUrl: 1,
          companyUrl: 1,
        },
      },
      {
        $sort: { companyName: 1 },
      },
    ]);
    console.log("Result: ", result);
    return res.status(200).send({
      statusCode: 200,
      message: "Details fetched successfully.",
      data: result,
      success: true,
    });
  } catch (err) {
    console.error("❌ Error in fetching passwords: ", err);
    return res.status(500).send({
      statusCode: 500,
      data: null,
      message: "Internal server error.",
      success: false,
    });
  }
};

const delete_password = async (req, res) => {
  const password_id = req.params.password_id;
  try {
    const password = await Password.findByIdAndDelete(password_id);
    if (!password) {
      return res.status(404).send({
        statusCode: 404,
        message: "Password not found.",
        data: null,
        success: false,
      });
    }
    return res.status(200).send({
      statusCode: 200,
      message: "Password deleted successfully.",
      data: password,
      success: true,
    });
  } catch (error) {
    console.error("�� Error in deleting password: ", error);
    return res.status(500).send({
      statusCode: 500,
      data: null,
      message: "Internal server error.",
      success: false,
    });
  }
};

const view_specific_password = async (req, res) => {
  const { companyName, companyUrl } = req.query;
  if (!companyName || !companyUrl) {
    return res.status(404).send({
      statusCode: 400,
      message: "Company Name and Company URL are required.",
      data: null,
      success: false,
    });
  }
  try {
    const passwords = await Password.find({
      companyName: companyName,
      companyUrl: companyUrl,
    });
    console.log("Password:", passwords);
    if (!passwords) {
      return res.status(404).send({
        statusCode: 404,
        message: "No passwords found for the given company.",
        data: null,
        success: false,
      });
    }
    return res.status(200).send({
      statusCode: 200,
      message: "Password details fetched successfully.",
      data: passwords,
      success: true,
    });
  } catch (error) {
    console.error("�� Error in viewing specific password: ", error);
    return res.status(500).send({
      statusCode: 500,
      data: null,
      message: "Internal server error.",
      success: false,
    });
  }
};

const update_specific_password_record = async (req, res) => {
  const { password_id } = req.params;
  const { companyName, companyUrl, companyLogoUrl, emailOrUserId, password } =
    req.body;

  console.log("Password ID: ", password_id);

  if (
    !password_id ||
    !companyName ||
    !companyUrl ||
    !password ||
    !emailOrUserId ||
    !companyLogoUrl
  ) {
    return res.status(400).send({
      statusCode: 400,
      message:
        "All fields are required(Company Name, URL, Password, Email/User ID, Company Logo URL).",
      data: null,
      success: false,
    });
  }

  try {
    const isPasswordExist = await Password.findById(password_id);

    if (!isPasswordExist) {
      return res.status(404).send({
        statusCode: 404,
        message:
          "Password record not found. Please provide a valid password ID.",
        data: null,
        success: false,
      });
    }

    const breachedCount = await checkPasswordBreach(password);

    // Encrypt the password using CryptoJS AES encryption
    const encryptedPassword = CryptoJS.AES.encrypt(
      password,
      process.env.PASSWORD_SECRET_KEY
    ).toString();

    const values = {
      companyName,
      companyUrl,
      companyLogoUrl,
      password: encryptedPassword,
      emailOrUserId,
      breachedCount,
    };

    const updatePasswordRecord = await Password.findByIdAndUpdate(
      password_id,
      values,
      { new: true }
    );
    if (!updatePasswordRecord) {
      return res.status(404).send({
        statusCode: 404,
        message: "Failed to update password record. Please try again.",
        data: null,
        success: false,
      });
    }
    return res.status(200).send({
      statusCode: 200,
      message: "Password record updated successfully.",
      data: updatePasswordRecord,
      success: true,
    });
  } catch (error) {
    console.error("�� Error in updating password record: ", error);
    return res.status(500).send({
      statusCode: 500,
      data: null,
      message: "Internal server error.",
      success: false,
    });
  }
};

const view_stats = async (req, res) => {
  const { user_id } = req.params;
  console.log("User ID: ", user_id);

  if (!user_id) {
    return res.status(400).send({
      statusCode: 400,
      message: "User ID is required.",
      data: null,
      success: false,
    });
  }

  try {
    const passwords = await Password.find({ user_id: user_id });
    console.log("Password: ", passwords);
    if (!passwords) {
      return res.status(404).send({
        statusCode: 404,
        message: "No passwords found for the given user.",
        data: null,
        success: false,
      });
    }
    return res.status(200).send({
      statusCode: 200,
      message: "Password statistics fetched successfully.",
      data: {
        total_passwords_stored: passwords?.length,
        total_breached_passwords: passwords?.reduce(
          (acc, item) => acc + (item?.breachedCount || 0),
          0
        ),
      },
      success: true,
    });
  } catch (error) {
    console.error("�� Error in checking user existence: ", error);
    return res.status(500).send({
      statusCode: 500,
      data: null,
      message: "Internal server error.",
      success: false,
    });
  }
};
module.exports = {
  add_password,
  get_passwords,
  delete_password,
  view_specific_password,
  update_specific_password_record,
  view_stats,
};
