import prisma from "../config/db.js";

class OTPModel {
  static async create(data) {
    return prisma.oTP.create({ data });
  }

  static async findByEmail(email) {
    return prisma.oTP.findUnique({ where: { email } });
  }

  static async findOne(filter) {
    return prisma.oTP.findFirst({ where: filter });
  }

  static async updateByEmail(email, data) {
    return prisma.oTP.update({ where: { email }, data });
  }

  static async deleteByEmail(email) {
    return prisma.oTP.delete({ where: { email } });
  }

  static async upsert(email, data) {
    return prisma.oTP.upsert({
      where: { email },
      update: data,
      create: { ...data, email }
    });
  }

  // static async findOneAndUpdate(filter, update, options = {}) {
  //   const { upsert = false } = options;

  //   if (upsert) {
  //     return prisma.oTP.upsert({
  //       where: filter,
  //       update: update,
  //       create: { ...update, ...filter }
  //     });
  //   } else {
  //     return prisma.oTP.updateMany({
  //       where: filter,
  //       data: update
  //     });
  //   }
  // }
}

export default OTPModel;
