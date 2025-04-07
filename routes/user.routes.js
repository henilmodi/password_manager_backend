const express = require("express");

const router = express.Router();
const {
  add_password,
  get_passwords,
  delete_password,
  view_specific_password,
  update_specific_password_record,
  view_stats,
} = require("../controllers/user.controller");
const jwtAuthMiddleware = require("../middlewares/auth.middleware");

router.post("/password", jwtAuthMiddleware, add_password);
router.get("/password/:user_id", jwtAuthMiddleware, get_passwords);
router.delete("/password/:password_id", jwtAuthMiddleware, delete_password);
router.get("/password", jwtAuthMiddleware, view_specific_password);
router.put(
  "/password/:password_id",
  jwtAuthMiddleware,
  update_specific_password_record
);

router.get("/:user_id", jwtAuthMiddleware, view_stats);

module.exports = router;
