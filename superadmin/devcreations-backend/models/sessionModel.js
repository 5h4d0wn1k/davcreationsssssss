import prisma from "../config/db.js";

class SessionModel {
  static async create(data) {
    return prisma.session.create({ data });
  }

  static async findById(id) {
 
    return prisma.session.findUnique({
      where: { id },
      include: { users: true }
    });
  }

  static async findOne(filter) {
    return prisma.session.findFirst({
      where: filter,
      include: { users: true }
    });
  }

  static async find(filter = {}) {
    return prisma.session.findMany({
      where: filter,
      include: { users: true }
    });
  }

  static async updateById(user_id, data) {
    return prisma.session.update({ where: { user_id }, data });
  }

  static async deleteById(id) {
    return prisma.session.delete({ where: { id } });
  }

  static async deleteExpired() {
    const now = Math.floor(Date.now() / 1000);
    return prisma.session.deleteMany({
      where: { expiry: { lt: now } }
    });
  }
}

export default SessionModel;
