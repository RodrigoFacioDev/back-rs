import { PrismaClient } from "../generated/prisma";
const prisma = new PrismaClient();

export default {
  async findByEmail(email: string) {
    return await prisma.users.findFirst({ where: { email } });
  },
  async rawCount(where: string) {
    return await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as total FROM users u WHERE ${where}`
    );
  },
  async listAdmins() {
    return await prisma.users.findMany({
      where: {
        type: { in: [1, 10] },
      },
      include: {
        user_main_menus_user_main_menus_user_idTousers: {
          select: { menus: true },
        },
      },
      orderBy: { fullname: "asc" },
    });
  },

  async listAdminsPaginated(skip: number, limit: number, search?: string) {
    let searchCondition = "";
    let searchParams: any[] = [];
    console.log({ search });
    if (search) {
      searchCondition = "AND (u.fullname LIKE ? OR u.email LIKE ?)";
      searchParams = [`%${search}%`, `%${search}%`];
    }

    // Query principal com parâmetros na ordem correta
    const admins = await prisma.$queryRawUnsafe<any[]>(
      `SELECT u.*, m.menus
     FROM users u
     LEFT JOIN user_main_menus m ON m.user_id = u.id
     WHERE u.type IN (1, 10)
     ${searchCondition}
     ORDER BY u.fullname ASC
     LIMIT ? OFFSET ?`,
      ...searchParams,
      limit,
      skip
    );

    // Query para contar total de registros
    const [{ total }] = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as total 
     FROM users u 
     WHERE u.type IN (1, 10) ${searchCondition}`,
      ...searchParams
    );

    // Query para contar apenas admins (type = 1)
    const [{ totalAdmins }] = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as totalAdmins 
     FROM users u 
     WHERE u.type = 1 ${searchCondition}`,
      ...searchParams
    );

    // Query para contar apenas colaboradores (type = 10)
    const [{ totalCollaborators }] = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as totalCollaborators 
     FROM users u 
     WHERE u.type = 10 ${searchCondition}`,
      ...searchParams
    );

    return { admins, totalItems: total, totalAdmins, totalCollaborators };
  },
  async createAdmin(data: {
    fullname: string;
    email: string;
    password: string;
  }) {
    return await prisma.users.create({
      data: {
        fullname: data.fullname,
        email: data.email,
        password: data.password,
        type: 1,
      },
    });
  },

  async updateAdmin(
    id: number,
    data: { fullname: string; email: string; password?: string }
  ) {
    const updateData: any = {
      fullname: data.fullname,
      email: data.email,
    };
    if (data.password) {
      updateData.password = data.password;
    }
    return await prisma.users.update({
      where: { id },
      data: updateData,
    });
  },
};
