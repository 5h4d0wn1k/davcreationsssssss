import bcrypt from "bcrypt";
import prisma from "../config/db.js";

class UserModel {
  static async create(data) {
    if (data.user_password) {
      data.user_password = await bcrypt.hash(data.user_password, 12);
    }
    return prisma.users.create({ data });
  }

  static async findById(user_id) {
    return prisma.users.findUnique({ where: { user_id } });
  }

  static async findByEmail(email) {
    return prisma.users.findUnique({ where: { email } });
  }

  static async findOne(filter) {
    return prisma.users.findFirst({ where: filter });
  }

  static async find(filter = {}) {
    return prisma.users.findMany({ where: filter });
  }

  static async updateById(user_id, data) {
    if (data.user_password) {
      data.user_password = await bcrypt.hash(data.user_password, 12);
    }
    return prisma.users.update({ where: { user_id }, data });
  }

  static async deleteById(user_id) {
    return prisma.users.delete({ where: { user_id } });
  }

  static async comparePassword(userPassword, candidatePassword) {
    return bcrypt.compare(candidatePassword, userPassword);
  }
}

export default UserModel;
