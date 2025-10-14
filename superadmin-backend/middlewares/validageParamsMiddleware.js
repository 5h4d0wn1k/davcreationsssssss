export const checkParams = (req, res, next, params) => {
  // Prisma uses CUID by default, so we can validate if it's a valid CUID format
  const cuidRegex = /^[a-z0-9]{25}$/;
  if (!cuidRegex.test(params))
    return res.status(400).json({
      error: "Invalid Params ID!",
    });
  next();
};
