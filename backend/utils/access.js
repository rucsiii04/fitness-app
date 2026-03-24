import { Gym } from "../models/index.js";

export const hasManagedGymAccess = async (requester, gymId) => {
  if (requester.role !== "gym_admin") return false;

  const gym = await Gym.findOne({
    where: {
      gym_id: gymId,
      admin_user_id: requester.user_id,
    },
  });

  return Boolean(gym);
};

export const hasGymMembershipAccess = (requester, gymId) => {
  return Number(requester.gym_id) === Number(gymId);
};