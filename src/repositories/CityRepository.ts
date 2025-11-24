import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

export default {
  async getAllCities() {
    const cities = await prisma.tickets.findMany({
      where: {
        address_city: { not: null },
      },
      select: {
        address_city: true,
        address_state: true,
      },
      distinct: ["address_city"],
      orderBy: {
        address_city: "asc",
      },
    });

    return cities;
  },
};
