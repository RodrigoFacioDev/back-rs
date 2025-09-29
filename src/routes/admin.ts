import { Router } from "express";
import AdminController from "../controllers/AdminController";
import authMiddleware from "../middlewares/authMiddleware";

const router = Router();

// GET /api/admins/stats
router.get("/stats", AdminController.stats);

// GET /api/admins?page=2&limit=10
router.get("/", authMiddleware, AdminController.list);
router.post("/", authMiddleware, AdminController.create);
router.put("/:id", authMiddleware, AdminController.update);

// PUT /api/admins/permissions/:user_id
router.put(
  "/permissions/:user_id",
  authMiddleware,
  AdminController.updatePermissions
);

export default router;
