import { PrismaClient } from "../generated/prisma";
const prisma = new PrismaClient();

export default {
  async createSpecialty(data: any) {
    return await prisma.specialties.create({ data });
  },

  async updateSpecialty(id: number, data: any) {
    return await prisma.specialties.update({ where: { id }, data });
  },

  async listSpecialtiesPaginated(skip: number, limit: number, search?: string) {
    let where: any = {};
    if (search) {
      where.OR = [
        { nm_speciality: { contains: search } },
        { desc_speciality: { contains: search } },
        { abreviation: { contains: search } },
      ];
    }
    const [specialties, total] = await Promise.all([
      prisma.specialties.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "asc" },
      }),
      prisma.specialties.count({ where }),
    ]);
    return { specialties, totalItems: total };
  },

  async listAllSpecialties() {
    return await prisma.specialties.findMany({ orderBy: { id: "asc" } });
  },

  async getSpecialtyById(id: number) {
    return await prisma.specialties.findUnique({ where: { id } });
  },

  async deleteSpecialty(id: number) {
    return await prisma.specialties.delete({ where: { id } });
  },
};
