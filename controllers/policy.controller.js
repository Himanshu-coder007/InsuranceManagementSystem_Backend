import sharp from "sharp"; // For image/document optimization (if needed)
import cloudinary from "../utils/cloudinary"; // For cloud storage
import { Policy } from "../models/policy.model.js"; // Policy model
import { User } from "../models/user.model.js"; // User model

// Add New Policy
export const addNewPolicy = async (req, res) => {
  try {
    const {
      policyNumber,
      policyName,
      policyType,
      provider,
      startDate,
      endDate,
      installmentDuration,
      installmentAmount,
      nextInstallmentDate,
    } = req.body;
    const documents = req.files; // Assuming multiple files can be uploaded
    const userId = req.id;

    if (!documents || documents.length === 0)
      return res.status(400).json({ message: "Documents required" });

    // Upload all documents to Cloudinary
    const uploadedDocs = [];
    for (let doc of documents) {
      const optimizedDocBuffer = await sharp(doc.buffer)
        .toFormat("jpeg", { quality: 80 })
        .toBuffer();

      const fileUri = `data:application/pdf;base64,${optimizedDocBuffer.toString(
        "base64"
      )}`;
      const cloudResponse = await cloudinary.uploader.upload(fileUri);
      uploadedDocs.push({
        fileName: doc.originalname,
        fileType: doc.mimetype,
        fileSize: doc.size,
        url: cloudResponse.secure_url,
      });
    }

    const policy = await Policy.create({
      policyNumber,
      policyName,
      policyType,
      provider,
      startDate,
      endDate,
      installmentDuration,
      installmentAmount,
      nextInstallmentDate,
      documents: uploadedDocs,
      user: userId,
    });

    // Add policy reference to the user's profile
    const user = await User.findById(userId);
    if (user) {
      user.policies.push(policy._id);
      await user.save();
    }

    await policy.populate({ path: "user", select: "-password" });

    return res.status(201).json({
      message: "New policy added",
      policy,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

// Edit Policy Details
export const editPolicy = async (req, res) => {
  try {
    const policyId = req.params.id;
    const userId = req.id;
    const {
      policyName,
      provider,
      startDate,
      endDate,
      installmentDuration,
      installmentAmount,
      nextInstallmentDate,
    } = req.body;

    const policy = await Policy.findById(policyId);
    if (!policy)
      return res
        .status(404)
        .json({ message: "Policy not found", success: false });

    // Check if the logged-in user is the owner of the policy
    if (policy.user.toString() !== userId)
      return res.status(403).json({ message: "Unauthorized", success: false });

    // Update the policy details
    policy.policyName = policyName || policy.policyName;
    policy.provider = provider || policy.provider;
    policy.startDate = startDate || policy.startDate;
    policy.endDate = endDate || policy.endDate;
    policy.installmentDuration =
      installmentDuration || policy.installmentDuration;
    policy.installmentAmount = installmentAmount || policy.installmentAmount;
    policy.nextInstallmentDate =
      nextInstallmentDate || policy.nextInstallmentDate;

    await policy.save();

    return res.status(200).json({
      message: "Policy details updated",
      policy,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

// Get All Policies for a User
export const getUserPolicies = async (req, res) => {
  try {
    const userId = req.id;
    const policies = await Policy.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("user", "name email");

    return res.status(200).json({
      policies,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

// Delete Policy
export const deletePolicy = async (req, res) => {
  try {
    const policyId = req.params.id;
    const userId = req.id;

    const policy = await Policy.findById(policyId);
    if (!policy)
      return res
        .status(404)
        .json({ message: "Policy not found", success: false });

    // Check if the logged-in user is the owner of the policy
    if (policy.user.toString() !== userId)
      return res.status(403).json({ message: "Unauthorized", success: false });

    // Delete the policy
    await Policy.findByIdAndDelete(policyId);

    // Remove the policy reference from the user profile
    let user = await User.findById(userId);
    user.policies = user.policies.filter((id) => id.toString() !== policyId);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Policy deleted",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};