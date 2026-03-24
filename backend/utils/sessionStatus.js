export const getSessionStatus = (session, now = new Date()) => {

  if (session.status === "cancelled") return "cancelled";
  if (now < session.start_datetime) return "scheduled";
  if (now < session.end_datetime) return "ongoing";

  return "completed";
};