import { Request, Response } from "express";
import SpecialtyRepository from "../repositories/SpecialtyRepository";

export default {
  async create(req: Request, res: Response) {
    const data = req.body;
    if (!data.nm_speciality) {
      return res
        .status(400)
        .json({ error: "Nome da especialidade é obrigatório." });
    }
    if (!data.desc_speciality) {
      return res
        .status(400)
        .json({ error: "Descrição da especialidade é obrigatória." });
    }
    if (!data.abreviation) {
      return res.status(400).json({ error: "Abreviação é obrigatória." });
    }
    if (typeof data.st_speciality === "undefined") {
      return res.status(400).json({ error: "Status é obrigatório." });
    }
    const specialty = await SpecialtyRepository.createSpecialty(data);
    res.status(201).json(specialty);
  },

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const data = req.body;
    try {
      const specialty = await SpecialtyRepository.updateSpecialty(
        Number(id),
        data
      );
      res.json(specialty);
    } catch (error: any) {
      if (error.code === "P2025") {
        return res
          .status(404)
          .json({ error: "Especialidade não encontrada para atualizar." });
      }
      throw error;
    }
  },

  async list(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const search = req.query.search ? String(req.query.search) : undefined;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { specialties, totalItems } =
      await SpecialtyRepository.listSpecialtiesPaginated(skip, limit, search);
    const totalPages = Math.ceil(totalItems / limit);
    res.json({ page, limit, totalPages, totalItems, specialties });
  },

  async listAll(req: Request, res: Response) {
    const specialties = await SpecialtyRepository.listAllSpecialties();
    res.json({ specialties });
  },

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const specialty = await SpecialtyRepository.getSpecialtyById(Number(id));
    if (!specialty) {
      return res.status(404).json({ error: "Especialidade não encontrada." });
    }
    res.json(specialty);
  },

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    try {
      await SpecialtyRepository.deleteSpecialty(Number(id));
      res.status(204).send();
    } catch (error: any) {
      if (error.code === "P2025") {
        return res
          .status(404)
          .json({ error: "Especialidade não encontrada para exclusão." });
      }
      throw error;
    }
  },
};
