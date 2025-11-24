import { Router } from "express";

import authRoutes from "./auth";
import adminRoutes from "./admin";
import clientRoutes from "./client";
import providerRoutes from "./provider";
import partnerRoutes from "./partners";
import projectRoutes from "./project";
import specialtyRoutes from "./specialty";
import equipmentRoutes from "./equipment";
import ticketRoutes from "./tickets";
import cityRoutes from "./cities";

const router = Router();

router.use("/auth", authRoutes);
router.use("/admins", adminRoutes);
router.use("/clients", clientRoutes);
router.use("/providers", providerRoutes);
router.use("/partners", partnerRoutes);
router.use("/projects", projectRoutes);
router.use("/specialties", specialtyRoutes);
router.use("/equipments", equipmentRoutes);
router.use("/tickets", ticketRoutes);
router.use("/cities", cityRoutes);

export default router;
