const ATTENDANCE_OPEN_MINUTES_BEFORE_START = 15;
const ATTENDANCE_CLOSE_MINUTES_AFTER_END = 15;

export const addMinutes = (date, minutes) => {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
};

export const isAttendanceWindowOpen = (session, now = new Date()) => {
  if (session.status === "cancelled") return false;

  const opensAt = new Date(session.start_datetime);
  opensAt.setMinutes(
    opensAt.getMinutes() - ATTENDANCE_OPEN_MINUTES_BEFORE_START,
  );

  const closesAt = new Date(session.end_datetime);
  closesAt.setMinutes(
    closesAt.getMinutes() + ATTENDANCE_CLOSE_MINUTES_AFTER_END,
  );

  return now >= opensAt && now <= closesAt;
};
