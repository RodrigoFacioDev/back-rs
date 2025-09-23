import { Router } from "express";
import ClientController from "../controllers/ClientController";
import authMiddleware from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authMiddleware, ClientController.list);
router.post("/", authMiddleware, ClientController.create);
router.put("/:id", authMiddleware, ClientController.update);

export default router;
