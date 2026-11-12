export function calculateAttendance({
  classesConducted,
  present,
  absent = 0,
  excused = 0,
  threshold = 75
}) {
  const values = [
    classesConducted,
    present,
    absent,
    excused,
    threshold
  ];

  if (!values.every((value) => Number.isFinite(Number(value)))) {
    throw new Error("Attendance values must be numeric.");
  }

  classesConducted = Number(classesConducted);
  present = Number(present);
  absent = Number(absent);
  excused = Number(excused);
  threshold = Number(threshold);

  if (
    classesConducted < 0 ||
    present < 0 ||
    absent < 0 ||
    excused < 0 ||
    threshold < 0 ||
    threshold > 100
  ) {
    throw new Error("Attendance values are outside their permitted range.");
  }

  if (present + absent + excused > classesConducted) {
    throw new Error(
      "Recorded attendance cannot exceed classes conducted."
    );
  }

  const applicableClasses = classesConducted - excused;

  const percentage =
    applicableClasses > 0
      ? Number(((present / applicableClasses) * 100).toFixed(2))
      : 0;

  return {
    classesConducted,
    present,
    absent,
    excused,
    applicableClasses,
    percentage,
    threshold,
    eligible: applicableClasses > 0 && percentage >= threshold
  };
}