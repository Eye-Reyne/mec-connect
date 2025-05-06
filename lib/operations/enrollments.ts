import { SQLiteDatabase } from "expo-sqlite";
import { BulkEnrollmentResult, Department, Student, StudentDepartment } from "../db/schema";

// Bulk Enrollment Utility
export async function bulkEnroll(
    db: SQLiteDatabase,
    departmentId: number,
    studentIds: number[]
  ): Promise<BulkEnrollmentResult> {
    await db.execAsync('BEGIN TRANSACTION');
    const result: BulkEnrollmentResult = {
      successCount: 0,
      errors: []
    };
  
    try {
      // Verify department exists
      const department = await db.getFirstAsync<Department>(
        'SELECT * FROM departments WHERE id = ?',
        [departmentId]
      );

      if (!department) {
        throw new Error(`Department with ID ${departmentId} not found`);
      }
  
      for (const studentId of studentIds) {
        try {
          // Verify student exists
          const student = await db.getFirstAsync<Student>(
            'SELECT * FROM students WHERE id = ?',
            [studentId]
          );
          
          if (!student) {
            result.errors.push({ studentId, error: 'Student not found' });
            continue;
          }
  
          // Check if already enrolled
          const existingEnrollment = await db.getFirstAsync<StudentDepartment>(
            'SELECT * FROM student_departments WHERE studentId = ? AND departmentId = ?',
            [studentId, departmentId]
          );
          
          if (existingEnrollment !== null) {
            result.errors.push({ studentId, error: 'Already enrolled' });
            continue;
          }
  
          // Create enrollment with correct table name and fields
          await db.runAsync(
            'INSERT INTO student_departments (studentId, departmentId, status, isActive) VALUES (?, ?, ?, ?)',
            [studentId, departmentId, 'active', 1]
          );          
          
          result.successCount++;
        } catch (error) {
          result.errors.push({
            studentId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
  
      await db.execAsync('COMMIT');
      return result;
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
}

export async function getEnrollmentsByDepartment(
  db: SQLiteDatabase,
  departmentId: number
): Promise<Student[]> {
  const enrollments = await db.getAllAsync<Student>(
    `SELECT students.* FROM students
     INNER JOIN student_departments ON students.id = student_departments.studentId
     WHERE student_departments.departmentId = ? AND student_departments.isActive = 1`,
    [departmentId]
  );
  
  return enrollments;
}

// Additional helpful functions

export async function getStudentDepartments(
  db: SQLiteDatabase,
  studentId: number
): Promise<Department[]> {
  const departments = await db.getAllAsync<Department>(
    `SELECT departments.* FROM departments
     INNER JOIN student_departments ON departments.id = student_departments.departmentId
     WHERE student_departments.studentId = ? AND student_departments.isActive = 1`,
    [studentId]
  );
  
  return departments;
}

export async function unenrollStudent(
  db: SQLiteDatabase,
  studentId: number,
  departmentId: number
): Promise<boolean> {
  try {
    // Option 1: Soft delete (maintain record but mark as inactive)
    const result = await db.runAsync(
      'UPDATE student_departments SET isActive = 0, status = "withdrawn", updatedAt = CURRENT_TIMESTAMP WHERE studentId = ? AND departmentId = ?',
      [studentId, departmentId]
    );

    return result.changes > 0;
    
    // Option 2: Hard delete (uncomment to use instead)
    // const result = await db.runAsync(
    //   'DELETE FROM student_departments WHERE studentId = ? AND departmentId = ?',
    //   [studentId, departmentId]
    // );
    // 
    // return result.changes > 0;
  } catch (error) {
    console.error('Error unenrolling student:', error);
    return false;
  }
}