// lib/operations/departments.ts

import { SQLiteDatabase } from "expo-sqlite";
import { Department, Student, CreateDepartmentPayload, DepartmentWithBillItems, BillItem } from "../db/schema";
import { addBillItem } from './bill-items';

/**
 * Create a new department
 * @param db Database instance
 * @param department Department data
 * @returns Newly created department with ID
 */
export async function addDepartment(db: SQLiteDatabase, department: Department): Promise<Department> {
    const { name, term, year, description, startDate, endDate } = department;
    try {
        const result = await db.runAsync(
            "INSERT INTO departments (name, term, year, description, startDate, endDate) VALUES (?, ?, ?, ?, ?, ?)",
            name,
            term,
            year,
            description ?? null,
            startDate ?? null,
            endDate ?? null




        );
    
        return {
        id: result.lastInsertRowId,
        ...department,
        };
    } catch (error) {
        console.error("Error adding department:", error);
        throw error;
    }
    
}

/**
 * Get all departments
 * @param db Database instance
 * @returns Array of departments
 */
export async function getAllDepartments(db: SQLiteDatabase): Promise<Department[]> {
    try {
        const departments = await db.getAllAsync<Department>(
        "SELECT * FROM departments ORDER BY name"
        );
        return departments;
    } catch (error) {
        console.error("Error getting departments:", error);
        throw error;
    }
}

/**
 * Get a department by ID
 * @param db Database instance
 * @param id Department ID
 * @returns Department data or null if not found
 */
export async function getDepartmentById(db: SQLiteDatabase, id: number): Promise<Department | null> {
    try {
        const department = await db.getFirstAsync<Department>(
        "SELECT * FROM departments WHERE id = ?",
        id
        );
        return department || null;
    } catch (error) {
        console.error(`Error getting department with ID ${id}:`, error);
        throw error;
    }
}


/**
 * Update a department
 * @param db Database instance
 * @param department Department data with ID
 * @returns Whether the update was successful
 */
export async function updateDepartment(
    db: SQLiteDatabase,
    department: Department & { billItems?: { name: string; amount: number; description?: string; category?: string; isRequired?: boolean; }[] }
): Promise<Department> {
    if (!department.id) {
        throw new Error("Department ID is required for update");
    }

    await db.execAsync('BEGIN TRANSACTION');
    
    try {
        // 1. Update department
        await db.runAsync(`
            UPDATE departments 
            SET name = ?, term = ?, year = ?, description = ?, startDate = ?, endDate = ?
            WHERE id = ?
        `,
            department.name,
            department.term,
            department.year,
            department.description || null,
            department.startDate || null,
            department.endDate || null,
            department.id
        );

        // 2. If bill items are provided, update them
        if (department.billItems) {
            // First, delete existing bill items
            await db.runAsync('DELETE FROM bill_items WHERE departmentId = ?', department.id);

            // Then, add new bill items
            for (const item of department.billItems) {
                await addBillItem(db, {
                    name: item.name,
                    amount: item.amount,
                    description: item.description,
                    category: item.category,
                    isRequired: item.isRequired,
                    departmentId: department.id
                });
            }
        }

        await db.execAsync('COMMIT');
        return department;
    } catch (error) {
        await db.execAsync('ROLLBACK');
        console.error('Error updating department:', error);
        throw error;
    }
}


/**
 * Delete a department
 * @param db Database instance
 * @param id Department ID
 * @returns Whether the deletion was successful
 */
export async function deleteDepartment(db: SQLiteDatabase, id: number): Promise<boolean> {
    // Hard delete
    try {
        const result = await db.runAsync("DELETE FROM departments WHERE id = ?", id);
        return result.changes > 0;
    } catch (error) {
        console.error(`Error deleting department with ID ${id}:`, error);
        throw error;
    }
}


/**
 * Search for departments by name
 * @param db Database instance
 * @param searchTerm Search term
 * @returns Array of departments matching the search term
 */
export async function searchDepartments(db: SQLiteDatabase, searchTerm: string): Promise<Department[]> {
    try {
        const departments = await db.getAllAsync<Department>(
            `SELECT * FROM departments WHERE name LIKE ? ORDER BY name`,
            `%${searchTerm}%`
        );
        return departments;
    } catch (error) {
        console.error("Error searching departments:", error);
        throw error;
    }
}

/**
 * Get all students in a department by department ID
 * @param db Database instance
 * @param departmentId Department ID
 * @returns Array of students in the department
 */
export async function getStudentsInDepartmentById(db: SQLiteDatabase, departmentId: number): Promise<Student[]> {
    try {
        const students = await db.getAllAsync<Student>(
            `SELECT s.* FROM students s
             JOIN student_department sd ON s.id = sd.studentId
             WHERE sd.departmentId = ?`,
            departmentId
        );
        return students;
    } catch (error) {
        console.error(`Error getting students in department with ID ${departmentId}:`, error);
        throw error;
    }
}

/**
 * Create a new department with bill items
 * @param db Database instance
 * @param department Department data with bill items
 * @returns Newly created department with ID
 */
export async function createDepartment(db: SQLiteDatabase, department: CreateDepartmentPayload): Promise<DepartmentWithBillItems> {
    await db.execAsync('BEGIN TRANSACTION');
    
    try {
        // 1. Create department
        const result = await db.runAsync(
            "INSERT INTO departments (name, term, year, description, startDate, endDate) VALUES (?, ?, ?, ?, ?, ?)",
            department.name,
            department.term,
            department.year,
            department.description ?? null,
            department.startDate ?? null,
            department.endDate ?? null
        );

        const departmentId = result.lastInsertRowId;
        let totalAmount = 0;
        const billItems: BillItem[] = [];

        // 2. Create bill items if provided
        if (department.billItems && department.billItems.length > 0) {
            for (const item of department.billItems) {
                const billItem = await addBillItem(db, {
                    ...item,
                    departmentId
                });
                billItems.push(billItem);
                totalAmount += item.amount;
            }
        }

        await db.execAsync('COMMIT');

        return {
            id: departmentId,
            name: department.name,
            term: department.term,
            year: department.year,
            description: department.description,
            startDate: department.startDate,
            endDate: department.endDate,
            billItems,
            totalAmount
        };
    } catch (error) {
        await db.execAsync('ROLLBACK');
        console.error('Error creating department:', error);
        throw error;
    }
}

/**
 * Get a department with its bill items
 * @param db Database instance
 * @param departmentId Department ID
 * @returns Department with bill items and total amount
 */
export async function getDepartmentWithBillItems(db: SQLiteDatabase, departmentId: number): Promise<DepartmentWithBillItems | null> {
    try {
        // 1. Get department
        const department = await db.getFirstAsync<Department>(
            'SELECT * FROM departments WHERE id = ?',
            departmentId
        );

        if (!department) {
            return null;
        }

        // 2. Get bill items
        const billItems = await db.getAllAsync<BillItem>(
            'SELECT * FROM bill_items WHERE departmentId = ?',
            departmentId
        );

        // 3. Calculate total amount
        const totalAmount = billItems.reduce((sum, item) => sum + item.amount, 0);

        return {
            ...department,
            billItems,
            totalAmount
        };
    } catch (error) {
        console.error('Error getting department with bill items:', error);
        throw error;
    }
}

