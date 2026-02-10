import jwt from "jsonwebtoken";

export const generateToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      role: user.role,
      gym_id: user.gym_id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
};
