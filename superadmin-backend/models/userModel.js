import bcrypt from "bcrypt";
import prisma from "../config/db.js";

class UserModel {
  static async create(data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }
    return prisma.user.create({ data });
  }

  static async findById(id) {
    return prisma.user.findUnique({ where: { id } });
  }

  static async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  }

  static async findOne(filter) {
    return prisma.user.findFirst({ where: filter });
  }

  static async find(filter = {}) {
    return prisma.user.findMany({ where: filter });
  }

  static async updateById(id, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }
    return prisma.user.update({ where: { id }, data });
  }

  static async deleteById(id) {
    return prisma.user.delete({ where: { id } });
  }

  static async comparePassword(userPassword, candidatePassword) {
    return bcrypt.compare(candidatePassword, userPassword);
  }
}

export default UserModel;
