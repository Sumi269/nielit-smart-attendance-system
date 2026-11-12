export function validateStudent(student) {
  const errors = {};

  if (!student.name?.trim()) {
    errors.name = "Student name is required.";
  }

  if (!student.registrationNumber?.trim()) {
    errors.registrationNumber = "Registration number is required.";
  }

  if (!student.courseId) {
    errors.courseId = "Select a course.";
  }

  if (!student.batchId) {
    errors.batchId = "Select a batch.";
  }

  if (student.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
    errors.email = "Enter a valid email address.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}