import { Request, Response } from "express";
import CityRepository from "../repositories/CityRepository";

export default {
  // Listar todas as cidades atendidas
  async list(_req: Request, res: Response) {
    try {
      const cities = await CityRepository.getAllCities();

      res.json({
        success: true,
        totalItems: cities.length,
        cities,
      });
    } catch (error) {
      console.error("Erro ao listar cidades:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao listar cidades",
      });
    }
  },
};
