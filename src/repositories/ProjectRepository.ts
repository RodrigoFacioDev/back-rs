import { PrismaClient } from "../generated/prisma";
const prisma = new PrismaClient();

export default {
  async createProject(data: {
    provider_id?: number;
    name?: string;
    default_rat?: string;
    manual?: string;
    step?: string;
    default_km_price?: number;
    default_max_hour_ticket?: number;
    default_add_hour_price?: number;
    status?: number;
    rat_resinfo?: number;
    json_specialties?: string;
  }) {
    return await prisma.projects.create({ data });
  },

  async updateProject(
    id: number,
    data: {
      provider_id?: number;
      name?: string;
      default_rat?: string;
      manual?: string;
      step?: string;
      default_km_price?: number;
      default_max_hour_ticket?: number;
      default_add_hour_price?: number;
      status?: number;
      rat_resinfo?: number;
      json_specialties?: string;
    }
  ) {
    return await prisma.projects.update({ where: { id }, data });
  },

  async listProjectsPaginated(skip: number, limit: number, search?: string) {
    let where: any = {};
    if (search) {
      where.name = { contains: search };
    }
    let projects = [];
    let total = 0;
    try {
      [projects, total] = await Promise.all([
        prisma.projects.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: "asc" },
          include: { providers: true },
        }),
        prisma.projects.count({ where }),
      ]);
    } catch (err: any) {
      // Se erro for de data inválida, buscar todos e filtrar manualmente
      if (
        err.message &&
        err.message.includes("Value out of range") &&
        err.message.includes("updated_at")
      ) {
        // Busca apenas projetos com datas válidas (mês e dia > 0)
        const allProjects = await prisma.$queryRawUnsafe<any[]>(
          `SELECT * FROM projects 
            WHERE MONTH(updated_at) > 0 AND DAY(updated_at) > 0 
              AND MONTH(created_at) > 0 AND DAY(created_at) > 0`
        );
        projects = allProjects.slice(skip, skip + limit);
        total = allProjects.length;
      } else {
        throw err;
      }
    }
    // Montar provider aninhado apenas se vier do Prisma
    let result;
    if (projects.length && projects[0].providers !== undefined) {
      result = projects.map((p) => {
        const { providers, ...project } = p;
        let provider = null;
        if (providers) {
          provider = {
            id: providers.id,
            type: providers.type,
            document: providers.document,
            social_name: providers.social_name,
            fantasy_name: providers.fantasy_name,
            open_date: providers.open_date,
            phone1: providers.phone1,
            phone2: providers.phone2,
            address_zipcode: providers.address_zipcode,
            address_street: providers.address_street,
            address_number: providers.address_number,
            address_complement: providers.address_complement,
            address_district: providers.address_district,
            address_city: providers.address_city,
            address_state: providers.address_state,
            default_km_price: providers.default_km_price,
            default_max_hour_ticket: providers.default_max_hour_ticket,
            default_add_hour_price: providers.default_add_hour_price,
            status: providers.status,
            created_at: providers.created_at,
            updated_at: providers.updated_at,
            deleted_at: providers.deleted_at,
          };
        }
        return {
          ...project,
          provider,
        };
      });
    } else {
      // fallback: retorna projetos sem provider aninhado
      result = projects;
    }
    return { projects: result, totalItems: total };
  },

  async listAllProjects() {
    try {
      const projects = await prisma.projects.findMany({
        orderBy: { name: "asc" },
        include: { providers: true },
      });
      // provider aninhado
      return projects.map((p) => {
        const { providers, ...project } = p;
        return {
          ...project,
          provider: providers || null,
        };
      });
    } catch (err: any) {
      // fallback: retorna vazio se erro de data inválida
      return [];
    }
  },

  async getProjectById(id: number) {
    return await prisma.projects.findUnique({
      where: { id },
      include: { providers: true },
    });
  },
};
