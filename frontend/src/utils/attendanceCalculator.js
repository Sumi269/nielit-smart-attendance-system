export function calculateAttendance(present, totalClasses) {
  const presentCount = Number(present);
  const totalCount = Number(totalClasses);

  if (
    !Number.isFinite(presentCount) ||
    !Number.isFinite(totalCount) ||
    presentCount < 0 ||
    totalCount < 0 ||
    presentCount > totalCount
  ) {
    throw new Error("Invalid attendance values.");
  }

  if (totalCount === 0) {
    return null;
  }

  return Number(((presentCount / totalCount) * 100).toFixed(2));
}

export function getAttendanceStatus(percentage, threshold = 80) {
  if (percentage === null || percentage === undefined) {
    return "No classes";
  }

  if (Number(percentage) >= Number(threshold)) {
    return "Eligible";
  }

  return "Below threshold";
}