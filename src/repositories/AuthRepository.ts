import { PrismaClient } from "../generated/prisma";
const prisma = new PrismaClient();

import crypto from "crypto";

const AuthRepository = {
  async login(email: string, password: string) {
    const user = await prisma.users.findFirst({
      where: { email },
    });
    if (!user || !user.password) return null;
    const passwordMd5 = crypto.createHash("md5").update(password).digest("hex");
    if (user.password !== passwordMd5) return null;
    return user;
  },
};

export default AuthRepository;
