import { Router } from "express";
import ProviderController from "../controllers/ProviderController";
import authMiddleware from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authMiddleware, ProviderController.list);
router.post("/", authMiddleware, ProviderController.create);
router.put("/:id", authMiddleware, ProviderController.update);

export default router;
