import prisma from "../config/db.js";

class ModuleModel {
  static async create(data) {
    return prisma.modules.create({ data });
  }

  static async findById(module_id) {
    return prisma.modules.findUnique({ where: { module_id } });
  }

  static async findByUrlSlug(url_slug) {
    return prisma.modules.findUnique({ where: { url_slug } });
  }

  static async findOne(filter) {
    return prisma.modules.findFirst({ where: filter });
  }

  static async find(filter = {}) {
    return prisma.modules.findMany({ where: filter });
  }

  static async updateById(module_id, data) {
    return prisma.modules.update({ where: { module_id }, data });
  }

  static async deleteById(module_id) {
    return prisma.modules.delete({ where: { module_id } });
  }
}

export default ModuleModel;