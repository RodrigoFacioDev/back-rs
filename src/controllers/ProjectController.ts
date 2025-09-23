import { Request, Response } from "express";
import ProjectRepository from "../repositories/ProjectRepository";

export default {
  async listAll(req: Request, res: Response) {
    const projects = await ProjectRepository.listAllProjects();
    res.json(projects);
  },

  async save(req: Request, res: Response) {
    try {
      const data = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Validações básicas
      if (!data.name) {
        return res.status(400).json({
          success: false,
          message: "Nome do projeto é obrigatório.",
        });
      }

      if (!data.provider_id) {
        return res.status(400).json({
          success: false,
          message: "Provider é obrigatório.",
        });
      }

      // Preparar dados do projeto
      const projectData: any = {
        name: data.name,
        provider_id: Number(data.provider_id),
        default_km_price: data.default_km_price
          ? parseFloat(data.default_km_price)
          : null,
        default_max_hour_ticket: data.default_max_hour_ticket
          ? Number(data.default_max_hour_ticket)
          : null,
        default_add_hour_price: data.default_add_hour_price
          ? parseFloat(data.default_add_hour_price)
          : null,
        rat_resinfo: data.rat_resinfo ? 1 : 0,
        json_specialties: data.json_specialties
          ? JSON.stringify(data.json_specialties)
          : null,
        status: 1,
      };

      // Adicionar arquivos se foram enviados
      if (files?.default_rat?.[0]) {
        projectData.default_rat = files.default_rat[0].filename;
      }
      if (files?.manual?.[0]) {
        projectData.manual = files.manual[0].filename;
      }
      if (files?.step?.[0]) {
        projectData.step = files.step[0].filename;
      }

      let project;

      // Verificar se é criação ou atualização
      if (data.project_id) {
        // Atualização
        project = await ProjectRepository.updateProject(
          Number(data.project_id),
          projectData
        );
        res.json({
          success: true,
          message: "Projeto alterado com sucesso.",
          project,
        });
      } else {
        // Criação - default_rat é obrigatório na criação
        if (!files?.default_rat?.[0]) {
          return res.status(400).json({
            success: false,
            message: "Arquivo RAT padrão é obrigatório na criação do projeto.",
          });
        }

        project = await ProjectRepository.createProject(projectData);
        res.status(201).json({
          success: true,
          message: "Projeto criado com sucesso.",
          project,
        });
      }
    } catch (error: any) {
      console.error("Erro ao salvar projeto:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao realizar ação",
      });
    }
  },
  async create(req: Request, res: Response) {
    const data = req.body;
    if (!data.name) {
      return res.status(400).json({ error: "Nome do projeto é obrigatório." });
    }
    const project = await ProjectRepository.createProject(data);
    res.status(201).json(project);
  },

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const data = req.body;
    if (!data.name) {
      return res.status(400).json({ error: "Nome do projeto é obrigatório." });
    }
    const project = await ProjectRepository.updateProject(Number(id), data);
    res.json(project);
  },

  async list(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const search = req.query.search ? String(req.query.search) : undefined;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { projects, totalItems } =
      await ProjectRepository.listProjectsPaginated(skip, limit, search);
    const totalPages = Math.ceil(totalItems / limit);
    res.json({
      page,
      limit,
      totalPages,
      totalItems,
      projects,
    });
  },

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const project = await ProjectRepository.getProjectById(Number(id));
    if (!project)
      return res.status(404).json({ error: "Projeto não encontrado." });
    res.json(project);
  },
};
