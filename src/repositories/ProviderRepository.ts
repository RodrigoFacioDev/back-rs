import { PrismaClient } from "../generated/prisma";
const prisma = new PrismaClient();

export default {
  async createProvider(data: {
    type: string;
    document?: string;
    social_name: string;
    fantasy_name?: string;
    open_date?: string;
    phone1?: string;
    phone2?: string;
    address_zipcode?: string;
    address_street?: string;
    address_number?: string;
    address_complement?: string;
    address_district?: string;
    address_city?: string;
    address_state?: string;
    default_km_price?: number;
    default_max_hour_ticket?: number;
    default_add_hour_price?: number;
    status?: boolean;
  }) {
    return await prisma.providers.create({ data });
  },

  async updateProvider(
    id: number,
    data: {
      type?: string;
      document?: string;
      social_name?: string;
      fantasy_name?: string;
      open_date?: string;
      phone1?: string;
      phone2?: string;
      address_zipcode?: string;
      address_street?: string;
      address_number?: string;
      address_complement?: string;
      address_district?: string;
      address_city?: string;
      address_state?: string;
      default_km_price?: number;
      default_max_hour_ticket?: number;
      default_add_hour_price?: number;
      status?: boolean;
    }
  ) {
    return await prisma.providers.update({ where: { id }, data });
  },
  async listProvidersPaginated(skip: number, limit: number, search?: string) {
    let searchCondition = "";
    let searchParams: any[] = [];
    if (search) {
      searchCondition = `WHERE (social_name LIKE ? OR fantasy_name LIKE ? OR address_city LIKE ?)`;
      searchParams = [`%${search}%`, `%${search}%`, `%${search}%`];
    }
    const providers = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM providers ${searchCondition} ORDER BY social_name ASC LIMIT ? OFFSET ?`,
      ...searchParams,
      limit,
      skip
    );
    const [{ total }] = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as total FROM providers ${searchCondition}`,
      ...searchParams
    );
    return { providers, totalItems: total };
  },
};
