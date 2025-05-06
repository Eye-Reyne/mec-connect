// lib/operations/students.ts
import { SQLiteDatabase } from 'expo-sqlite';
import { PaginatedResult, PaginationOptions, SearchOptions, Student } from '../db/schema';

/**
 * Create a new student
 * @param db Database instance
 * @param student Student data
 * @returns Newly created student with ID
 */
export async function addStudent(db: SQLiteDatabase, student: Student): Promise<Student> {
  try {
    const result = await db.runAsync(
      'INSERT INTO students (firstname, othernames, phone, address, status) VALUES (?, ?, ?, ?, ?)',
      student.firstname,
      student.othernames,
      student.phone,
      student.address,
      student.status || 'active'
    );

    return {
      id: result.lastInsertRowId,
      ...student
    };
  } catch (error) {
    console.error('Error adding student:', error);
    throw error;
  }
}

/**
 * Get all students
 * @param db Database instance
 * @returns Array of students
 */
export async function getAllStudents(db: SQLiteDatabase): Promise<Student[]> {
  try {
    const students = await db.getAllAsync<Student>('SELECT * FROM students ORDER BY firstname');
    return students;
  } catch (error) {
    console.error('Error getting students:', error);
    throw error;
  }
}

/**
 * Get a student by ID
 * @param db Database instance
 * @param id Student ID
 * @returns Student data or null if not found
 */
export async function getStudentById(db: SQLiteDatabase, id: number): Promise<Student | null> {
  try {
    const student = await db.getFirstAsync<Student>('SELECT * FROM students WHERE id = ?', id);
    return student || null;
  } catch (error) {
    console.error(`Error getting student with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Update a student
 * @param db Database instance
 * @param student Student data with ID
 * @returns Whether the update was successful
 */
export async function updateStudent(db: SQLiteDatabase, student: Student): Promise<boolean> {
  try {
    if (!student.id) {
      throw new Error('Student ID is required for update');
    }

    const result = await db.runAsync(
      'UPDATE students SET firstname = ?, othernames = ?, phone = ?, address = ?, status = ? WHERE id = ?',
      student.firstname,
      student.othernames,
      student.phone,
      student.address,
      student.status || 'active',
      student.id
    );

    return result.changes > 0;
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
}

/**
 * Delete a student
 * @param db Database instance
 * @param id Student ID
 * @returns Whether the deletion was successful
 */
// Soft delete implementation
export async function deleteStudent(db: SQLiteDatabase, id: number): Promise<boolean> {
  try {
    const result = await db.runAsync('UPDATE students SET isActive = 0 WHERE id = ?', id);
    return result.changes > 0;
  } catch (error) {
    console.error(`Error soft-deleting student with ID ${id}:`, error);
    throw error;
  }
}


/**
 * Search for students with advanced filtering and pagination
 * @param db Database instance
 * @param options Search and pagination options
 * @returns Paginated result of matching students
 */
export async function searchStudents(
  db: SQLiteDatabase,
  options: {
    searchOptions?: SearchOptions,
    pagination?: PaginationOptions,
    includeInactive?: boolean
  } = {}
): Promise<PaginatedResult<Student>> {
  try {
    const { searchOptions, pagination, includeInactive = false } = options;
    
    // Build the initial part of the query
    let query = `SELECT * FROM students`;
    let countQuery = `SELECT COUNT(*) as total FROM students`;
    let whereConditions: string[] = [];
    let params: any[] = [];
    
    // Add active status condition if needed
    if (!includeInactive) {
      whereConditions.push(`isActive = 1`);
    }
    
    // Apply search conditions if provided
    if (searchOptions && searchOptions.query) {
      // Note: This assumes buildSearchQuery handles the conditions correctly
      // and returns them as part of whereConditions rather than modifying the full query
      const { conditions, searchParams } = buildSearchConditions(searchOptions);
      if (conditions.length > 0) {
        whereConditions.push(...conditions);
      }
      if (searchParams.length > 0) {
        params.push(...searchParams);
      }
    }
    
    // Add WHERE clause only if there are conditions
    if (whereConditions.length > 0) {
      const whereClause = ` WHERE ${whereConditions.join(' AND ')}`;
      query += whereClause;
      countQuery += whereClause;
    }
    
    // Add sorting if provided in searchOptions
    if (searchOptions?.sortBy) {
      const direction = (searchOptions.sortOrder || 'asc').toUpperCase();
      query += ` ORDER BY ${searchOptions.sortBy} ${direction}`;
    }
    
    // Apply pagination if provided
    let students: Student[] = [];
    let total = 0;
    
    if (pagination) {
      const { page, pageSize } = pagination;
      const offset = (page - 1) * pageSize;
      
      // Add pagination to query
      query += ` LIMIT ? OFFSET ?`;
      const paginationParams = [pageSize, offset];
      
      // Execute paginated query
      students = await db.getAllAsync<Student>(query, ...params, ...paginationParams);
      
      // Get total count for pagination metadata
      const totalResult = await db.getFirstAsync<{total: number}>(countQuery, ...params);
      total = totalResult?.total || 0;
      
      return {
        data: students,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      };
    } else {
      // Execute non-paginated query
      students = await db.getAllAsync<Student>(query, ...params);
      return {
        data: students,
        total: students.length,
        page: 1,
        pageSize: students.length,
        totalPages: 1
      };
    }
  } catch (error) {
    console.error('Error searching students:', error);
    throw error;
  }
}

/**
 * Helper function to build search conditions
 * This replaces the original buildSearchQuery function with a more explicit approach
 */
function buildSearchConditions(searchOptions: SearchOptions): { conditions: string[], searchParams: any[] } {
  const conditions: string[] = [];
  const searchParams: any[] = [];
  
  if (searchOptions.query && searchOptions.query.trim()) {
    const searchQuery = searchOptions.query.trim();
    // Add conditions for different fields
    conditions.push(`(
      firstname LIKE ? OR 
      othernames LIKE ? OR 
      phone LIKE ? OR 
      address LIKE ?
    )`);
    const likeParam = `%${searchQuery}%`;
    searchParams.push(likeParam, likeParam, likeParam, likeParam);
  }
  
  // Add more specific filters if needed
  if (searchOptions.filters) {
    Object.entries(searchOptions.filters).forEach(([field, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        conditions.push(`${field} = ?`);
        searchParams.push(value);
      }
    });
  }
  
  return { conditions, searchParams };
}