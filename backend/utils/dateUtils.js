const ATTENDANCE_OPEN_MINUTES_BEFORE_START = 15;
const ATTENDANCE_CLOSE_MINUTES_AFTER_END = 15;

export const addMinutes = (date, minutes) => {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
};

export const getAttendanceWindow = (session) => ({
  opensAt: addMinutes(
    session.start_datetime,
    -ATTENDANCE_OPEN_MINUTES_BEFORE_START,
  ),
  closesAt: addMinutes(
    session.end_datetime,
    ATTENDANCE_CLOSE_MINUTES_AFTER_END,
  ),
});

export const isAttendanceWindowOpen = (session, now = new Date()) => {
  if (session.status === "cancelled") return false;

  const { opensAt, closesAt } = getAttendanceWindow(session);
  return now >= opensAt && now <= closesAt;
};
