import { Request, Response } from "express";
import EquipmentRepository from "../repositories/EquipmentRepository";

export default {
  async list(req: Request, res: Response) {
    try {
      const filters = req.query;

      // Busca tudo em paralelo
      const [equipment] = await Promise.all([
        EquipmentRepository.getEquipment(filters),
      ]);

      // Processa os equipamentos para adicionar query strings
      const processedEquipment = equipment.map((equip: any) => {
        const clientQuery = new URLSearchParams({
          client: equip.client_name || "",
        }).toString();
        const partnerQuery = new URLSearchParams({
          filter_fantasy_name: equip.fantasy_name || "",
        }).toString();

        return {
          ...equip,
          client_query: clientQuery,
          partner_query: partnerQuery,
          exchanged_equip:
            typeof equip.exchanged_equip === "string"
              ? JSON.parse(equip.exchanged_equip)
              : equip.exchanged_equip,
        };
      });

      res.json({
        success: true,
        equipment: processedEquipment,
        filters,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Erro ao listar equipamentos",
      });
    }
  },
};
