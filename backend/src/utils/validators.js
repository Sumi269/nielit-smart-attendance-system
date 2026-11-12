export function isPositiveInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

export function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

export function isValidAttendanceStatus(value) {
  return ["present", "absent", "leave", "excused"].includes(
    String(value).toLowerCase()
  );
}

export function validateThreshold(value) {
  const threshold = Number(value);

  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
    throw new Error("Attendance threshold must be between 0 and 100.");
  }

  return threshold;
}