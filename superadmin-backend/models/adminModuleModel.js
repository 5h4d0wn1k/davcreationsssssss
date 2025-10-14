import prisma from "../config/db.js";

class AdminModuleModel {
  static async create(data) {
    return prisma.adminModule.create({ data });
  }

  static async findById(id) {
    return prisma.adminModule.findUnique({ where: { id } });
  }

  static async findByUrlSlug(urlSlug) {
    return prisma.adminModule.findUnique({ where: { urlSlug } });
  }

  static async findOne(filter) {
    return prisma.adminModule.findFirst({ where: filter });
  }

  static async find(filter = {}) {
    return prisma.adminModule.findMany({ where: filter });
  }

  static async updateById(id, data) {
    return prisma.adminModule.update({ where: { id }, data });
  }

  static async deleteById(id) {
    return prisma.adminModule.delete({ where: { id } });
  }
}

export default AdminModuleModel;