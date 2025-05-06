import { SQLiteDatabase } from "expo-sqlite";
import { Bill, BulkBillResult, CreateBillWithItemsPayload, Department, Student } from "../db/schema";


// Department-Wide Bill Generation

export async function createBillsForDepartment(
    db: SQLiteDatabase,
    departmentId: number,
    billItems: {
      billItemId: number;
      amount?: number;
      quantity?: number;
    }[],
    billName: string
  ): Promise<BulkBillResult> {
    await db.execAsync('BEGIN TRANSACTION');
    const result: BulkBillResult = {
      billsCreated: 0,
      totalAmount: 0,
      errors: []
    };
  
    try {
      // 1. Verify department exists
      const department = await db.getAllAsync<Department>(
        'SELECT * FROM departments WHERE id = ?',
        [departmentId]
      );
      
      if (!department || department.length === 0) {
        throw new Error(`Department with ID ${departmentId} not found`);
      }
  
      // 2. Get all enrolled students
      const students = await db.getAllAsync<Student>(
        `SELECT s.* FROM students s
         JOIN studentDepartments sd ON s.id = sd.studentId
         WHERE sd.departmentId = ? AND sd.isActive = 1`,
        [departmentId]
      );
  
      // 3. Process each student
      for (const student of students) {
        try {
          if (student.id === undefined) {
            throw new Error('Student ID is undefined');
          }

          // Calculate total amount
          let studentTotal = 0;
          const itemRelations: {
            billItemId: number;
            amount: number;
            quantity: number;
          }[] = [];
  
          for (const item of billItems) {
            let amount: number;
            if (item.amount !== undefined) {
              amount = item.amount;
            } else {
              const billItem = await db.getFirstAsync<{ amount: number }>(
                'SELECT amount FROM billItems WHERE id = ?',
                [item.billItemId]
              );
              
              if (!billItem || billItem.amount === undefined) {
                throw new Error(`BillItem with ID ${item.billItemId} not found or has no amount`);
              }
              
              amount = billItem.amount;
            }
            
            const quantity = item.quantity ?? 1;
            studentTotal += Number(amount) * Number(quantity);
            itemRelations.push({ billItemId: item.billItemId, amount, quantity });
          }
  
          // Create bill
          const billResult = await db.runAsync(
            `INSERT INTO bills (name, studentId, departmentId, totalAmount, status)
             VALUES (?, ?, ?, ?, ?)`,
            [billName || '', student.id, departmentId, studentTotal, 'pending']
          );
  
          const billId = billResult.lastInsertRowId;
  
          // Add bill items
          for (const relation of itemRelations) {
            await db.runAsync(
              `INSERT INTO billItemRelations (billId, billItemId, amount, quantity)
               VALUES (?, ?, ?, ?)`,
              [billId, relation.billItemId, relation.amount, relation.quantity]
            );
          }
  
          result.billsCreated++;
          result.totalAmount += studentTotal;
        } catch (error) {
          result.errors.push({
            studentId: student.id || 0, // Provide default if undefined
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

// Usage Example
// const enrollmentResult = await bulkEnrollStudents(db, 1, [101, 102, 103]);
// console.log(`Enrolled ${enrollmentResult.successCount} students`);
// enrollmentResult.errors.forEach(error => {
//   console.error(`Failed for student ${error.studentId}: ${error.error}`);
// });

/**
 * Create a new bill with items
 * @param db Database instance
 * @param bill The bill data
 * @returns Newly created bill with ID
 */
export async function createBillWithItems(db: SQLiteDatabase, bill: CreateBillWithItemsPayload): Promise<Bill> {
    try {
        await db.execAsync('BEGIN TRANSACTION');

        const billResult = await db.runAsync(
            'INSERT INTO bills (name, studentId, departmentId, totalAmount, dueDate, note) VALUES (?, ?, ?, ?, ?, ?)',
            bill.name,
            bill.studentId,
            bill.departmentId,
            0, // We'll update this after adding the items
            bill.dueDate || null,
            bill.note || null
        );

        const billId = billResult.lastInsertRowId;

        let totalAmount = 0;
        for (const item of bill.items) {
            const itemAmount = item.amount || 0
            const quantity = item.quantity || 1;
            const discount = item.discount || 0;
            await db.runAsync(
                'INSERT INTO bill_item_relations (billId, billItemId, amount, quantity, discount) VALUES (?, ?, ?, ?, ?)',
                billId,
                item.billItemId,
                itemAmount,
                quantity,
                discount
            );
            totalAmount += (itemAmount * quantity) - discount;
        }

        await db.runAsync('UPDATE bills SET totalAmount = ? WHERE id = ?', totalAmount, billId);

        await db.execAsync('COMMIT');

        return {
            id: billId,
            name: bill.name,
            studentId: bill.studentId,
            departmentId: bill.departmentId,
            totalAmount: totalAmount,
            dueDate: bill.dueDate,
            note: bill.note,
        };
    } catch (error) {
        await db.execAsync('ROLLBACK');
        console.error('Error creating bill with items:', error);
        throw error;
    }
}

/**
 * Get all bills
 * @param db Database instance
 * @returns Array of bills
 */
export async function getAllBills(db: SQLiteDatabase): Promise<Bill[]> {
    try {
        const bills = await db.getAllAsync<Bill>('SELECT * FROM bills ORDER BY name');
        return bills;
    } catch (error) {
        console.error('Error getting all bills:', error);
        throw error;
    }
}

/**
 * Get a bill by ID
 * @param db Database instance
 * @param id Bill ID
 * @returns Bill data or null if not found
 */
export async function getBillById(db: SQLiteDatabase, id: number): Promise<Bill | null> {
    try {
        const bill = await db.getFirstAsync<Bill>('SELECT * FROM bills WHERE id = ?', id);
        return bill || null;
    } catch (error) {
        console.error(`Error getting bill with ID ${id}:`, error);
        throw error;
    }
}

/**
 * Update a bill
 * @param db Database instance
 * @param bill Bill data with ID
 * @returns Whether the update was successful
 */
export async function updateBill(db: SQLiteDatabase, bill: Bill): Promise<boolean> {
    try {
        if (!bill.id) {
            throw new Error('Bill ID is required for update');
        }

        const result = await db.runAsync(
            'UPDATE bills SET name = ?, studentId = ?, departmentId = ?, totalAmount = ?, dueDate = ?, status = ?, discount = ?, note = ? WHERE id = ?',
            bill.name,
            bill.studentId,
            bill.departmentId,
            bill.totalAmount,
            bill.dueDate || null,
            bill.status || null,
            bill.discount || null,
            bill.note || null,
            bill.id
        );

        return result.changes > 0;
    } catch (error) {
        console.error('Error updating bill:', error);
        throw error;
    }
}

/**
 * Delete a bill
 * @param db Database instance
 * @param id Bill ID
 * @returns Whether the deletion was successful
 */
export async function deleteBill(db: SQLiteDatabase, id: number): Promise<boolean> {
    try {
        //hard delete
        const result = await db.runAsync('DELETE FROM bills WHERE id = ?', id);
        return result.changes > 0;
    } catch (error) {
        console.error(`Error deleting bill with ID ${id}:`, error);
        throw error;
    }
}

/**
 * Search for bills by name
 * @param db Database instance
 * @param searchTerm Search term
 * @returns Array of matching bills
 */
export async function searchBills(db: SQLiteDatabase, searchTerm: string): Promise<Bill[]> {
    try {
        const query = `
            SELECT * FROM bills
            WHERE name LIKE ?
            ORDER BY name
        `;
        const searchParam = `%${searchTerm}%`;

        const bills = await db.getAllAsync<Bill>(query, searchParam);
        return bills;
    } catch (error) {
        console.error('Error searching bills:', error);
        throw error;
    }
}


export async function getBillsByStudentId(db: SQLiteDatabase, studentId: number): Promise<Bill[]> {
    try {
        const bills = await db.getAllAsync<Bill>('SELECT * FROM bills WHERE studentId = ?', studentId);
        return bills;
    } catch (error) {
        console.error(`Error getting bills for student with ID ${studentId}:`, error);
        throw error;
    }
}


