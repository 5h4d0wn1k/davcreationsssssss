import prisma from "../config/db.js";

class UserTypeModel {
  static async create(data) {
    return prisma.userType.create({ data });
  }

  static async findById(user_type_id) {
    return prisma.userType.findUnique({ where: { user_type_id } });
  }

  static async findByName(name) {
    return prisma.userType.find({ where: { name } });
  }

  static async findOne(filter) {
    return prisma.userType.findFirst({ where: filter });
  }

  static async find(filter = {}) {
    return prisma.userType.findMany({ where: filter });
  }

  static async updateById(user_type_id, data) {
  
    return prisma.userType.update({ where: { user_type_id }, data });
  }

  static async deleteById(user_type_id) {
    return prisma.userType.delete({ where: { user_type_id } });
  }
}

export default UserTypeModel;
