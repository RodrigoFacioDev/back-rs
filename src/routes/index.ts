import { Router } from "express";

import authRoutes from "./auth";
import adminRoutes from "./admin";
import clientRoutes from "./client";
import providerRoutes from "./provider";
import projectRoutes from "./project";
import specialtyRoutes from "./specialty";

const router = Router();

router.use("/auth", authRoutes);
router.use("/admins", adminRoutes);
router.use("/clients", clientRoutes);
router.use("/providers", providerRoutes);
router.use("/projects", projectRoutes);
router.use("/specialties", specialtyRoutes);

export default router;
