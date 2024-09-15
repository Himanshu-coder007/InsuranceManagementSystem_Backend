import express from "express";
import {
  register,
  login,
  logout,
  getProfile,
  editProfile,
} from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import multer from "multer";
const router = express.Router();

const upload = multer();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/:id/profile").get(isAuthenticated, getProfile);
router.route("/profile/edit").put(isAuthenticated, upload.none(), editProfile);
export default router;