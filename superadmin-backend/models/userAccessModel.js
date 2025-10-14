import prisma from "../config/db.js";

class UserAccessModel {
  static async create(data) {
    return prisma.userAccess.create({ data });
  }

  static async findById(id) {
    return prisma.userAccess.findUnique({ where: { id } });
  }

  static async findOne(filter) {
    return prisma.userAccess.findFirst({ where: filter });
  }

  static async find(filter = {}) {
    return prisma.userAccess.findMany({ where: filter });
  }

  static async updateById(id, data) {
    return prisma.userAccess.update({ where: { id }, data });
  }

  static async deleteById(id) {
    return prisma.userAccess.delete({ where: { id } });
  }
}

export default UserAccessModel;