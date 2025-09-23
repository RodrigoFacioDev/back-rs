import { PrismaClient } from "../generated/prisma";
const prisma = new PrismaClient();

export default {
  async createClient(data: {
    name: string;
    zipcode?: string;
    street?: string;
    number?: string;
    complement?: string;
    district?: string;
    city?: string;
    state?: string;
    whatsapp?: string;
    email?: string;
    cpf_cnpj?: string;
    contact_name?: string;
  }) {
    return await prisma.clients.create({ data });
  },

  async updateClient(
    id: number,
    data: {
      name?: string;
      zipcode?: string;
      street?: string;
      number?: string;
      complement?: string;
      district?: string;
      city?: string;
      state?: string;
      whatsapp?: string;
      email?: string;
      cpf_cnpj?: string;
      contact_name?: string;
    }
  ) {
    return await prisma.clients.update({ where: { id }, data });
  },
  async listClientsPaginated(skip: number, limit: number, search?: string) {
    let searchCondition = "";
    let searchParams: any[] = [];
    if (search) {
      searchCondition = "WHERE name LIKE ?";
      searchParams = [`%${search}%`];
    }
    const clients = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM clients ${searchCondition} ORDER BY name ASC LIMIT ? OFFSET ?`,
      ...searchParams,
      limit,
      skip
    );
    const [{ total }] = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as total FROM clients ${searchCondition}`,
      ...searchParams
    );
    return { clients, totalItems: total };
  },
};
