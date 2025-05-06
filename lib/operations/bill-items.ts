// This file handles operations related to bill_items.
// id?: number;
// name: string;
// amount: number;
// departmentId: number;

import { SQLiteDatabase } from 'expo-sqlite';
import { BillItem, BillItemRelation } from '../db/schema';

/**
 * Create a new bill item
 * @param db Database instance
 * @param billItem The bill item to be added
 * @returns Promise resolving to the added bill item
 */
export async function addBillItem(db: SQLiteDatabase, billItem: {
    name: string, amount: number, departmentId: number, description?: string, category?: string, isRequired?: boolean
}): Promise<BillItem> {
    try {
        // Convert undefined values to null for SQLite compatibility
        const description = billItem.description ?? null;
        const category = billItem.category ?? null;
        const isRequired = billItem.isRequired ?? null;

        const result = await db.runAsync(`
            INSERT INTO bill_items (name, amount, departmentId, description, category, isRequired) 
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            billItem.name,
            billItem.amount,
            billItem.departmentId,
            description,
            category,
            isRequired
        );

        return {
            id: result.lastInsertRowId,
            ...billItem,
        };
    } catch (error) {
        console.error('Error adding bill item:', error);
        throw error;
    }
}


/**
 * Get all bill items
 * @param db Database instance
 * @returns Promise resolving to an array of bill items
 */
export async function getAllBillItems(db: SQLiteDatabase): Promise<BillItem[]> {
    try {
        const billItems = await db.getAllAsync<BillItem>(
            'SELECT * FROM bill_items ORDER BY name'
        );
        return billItems;
    } catch (error) {
        console.error('Error getting all bill items:', error);
        throw error;
    }
}

/**
 * Get a bill item by ID
 * @param db Database instance
 * @param id Bill item ID
 * @returns Promise resolving to the bill item or null if not found
 */
export async function getBillItemById(db: SQLiteDatabase, id: number): Promise<BillItem | null> {
    try {
        const billItem = await db.getFirstAsync<BillItem>(
            'SELECT * FROM bill_items WHERE id = ?',
            id
        );
        return billItem || null;
    } catch (error) {
        console.error(`Error getting bill item with ID ${id}:`, error);
        throw error;
    }
}


/** 
 * Update a bill item
 * @param db Database instance
 * @param billItem The bill item to be updated
 * @returns Promise resolving to the updated bill item
 */

export async function updateBillItem(db: SQLiteDatabase, billItem: {
    id: number, name: string, amount: number, departmentId: number, description?: string, category?: string, isRequired?: boolean, isActive?: boolean
}): Promise<BillItem> {
    try {
        // Convert undefined values to null for SQLite compatibility
        const description = billItem.description ?? null;
        const category = billItem.category ?? null;
        const isRequired = billItem.isRequired ?? null;
        const isActive = billItem.isActive ?? null;

        const result = await db.runAsync(`
            UPDATE bill_items 
            SET name = ?, amount = ?, departmentId = ?, description = ?, category = ?, isRequired = ?, isActive = ? 
            WHERE id = ?
        `,
            billItem.name,
            billItem.amount,
            billItem.departmentId,
            description,
            category,
            isRequired,
            isActive,
            billItem.id!
        );


        return billItem;
    } catch (error) {
        console.error('Error updating bill item:', error);
        throw error;
    }
}

/**
 * Delete a bill item
 * @param db Database instance
 * @param id Bill item ID
 * @returns Promise resolving to the result of the deletion operation
 */

export async function deleteBillItem(db: SQLiteDatabase, id: number): Promise<void> {
    // This function does a hard delete.
    try {
        await db.runAsync('DELETE FROM bill_items WHERE id = ?', id);
    } catch (error) {
        console.error(`Error deleting bill item with ID ${id}:`, error);
        throw error;
    }
}

/**
 * Search for bill items by name
 * @param db Database instance
 * @param searchTerm Search term
 * @returns Promise resolving to an array of matching bill items
 */
export async function searchBillItems(db: SQLiteDatabase, searchTerm: string): Promise<BillItem[]> {
    try {
        const billItems = await db.getAllAsync<BillItem>(
            'SELECT * FROM bill_items WHERE name LIKE ? ORDER BY name',
            `%${searchTerm}%`
        );
        return billItems;
    } catch (error) {
        console.error('Error searching bill items:', error);
        throw error;
    }
}

/**
 * Get all bills for a specific department
 * @param db Database instance
 * @param departmentId Department ID
 * @returns Promise resolving to an array of bills for the department
 */
export async function getBillItemsByDepartmentId(db: SQLiteDatabase, departmentId: number): Promise<BillItem[]> {
    try {
        const bills = await db.getAllAsync<BillItem>(`
             SELECT bi.* FROM bill_items bi
             WHERE departmentId = ?
             ORDER BY bi.name
        `,
            departmentId,
        );
        return bills;
    } catch (error) {
        console.error('Error getting bills by department ID:', error);
        throw error;
    }
}

/**
 * Add a bill item relation
 * @param db Database instance
 * @param relation The bill item relation to be added
 * @returns Promise resolving to the added bill item relation
 */


export async function addBillItemRelation(db: SQLiteDatabase, relation: { 
    billId: number, 
    billItemId: number, 
    amount?: number
  }): Promise<BillItemRelation> {
      try {
          // Convert undefined values to default values (not just null)
          // Using default values like 0 to satisfy the BillItemRelation type
          const amount = relation.amount ?? 0; // Default to 0 instead of null
  
          const result = await db.runAsync(`
              INSERT INTO bill_item_relations (billId, billItemId, amount) 
              VALUES (?, ?, ?)
          `,
              relation.billId,
              relation.billItemId,
              amount,
          );
  
          // Return an object that matches the BillItemRelation type
          return {
              id: result.lastInsertRowId,
              billId: relation.billId,
              billItemId: relation.billItemId,
              amount: amount, // Now guaranteed to be a number
          };
      } catch (error) {
          console.error('Error adding bill item relation:', error);
          throw error;
      }
}


/**
 * Get all bill item relations
 * @param db Database instance
 * @returns Promise resolving to an array of bill item relations
 */
export async function getAllBillItemRelations(db: SQLiteDatabase): Promise<BillItemRelation[]> {
    try {
        const relations = await db.getAllAsync<BillItemRelation>(
            'SELECT * FROM bill_item_relations ORDER BY billId'
        );
        return relations;
    } catch (error) {
        console.error('Error getting all bill item relations:', error);
        throw error;
    }
}

/**
 * Get a bill item relation by ID
 * @param db Database instance
 * @param id Bill item relation ID
 * @returns Promise resolving to the bill item relation or null if not found
 */
export async function getBillItemRelationById(db: SQLiteDatabase, id: number): Promise<BillItemRelation | null> {
    try {
        const relation = await db.getFirstAsync<BillItemRelation>(
            'SELECT * FROM bill_item_relations WHERE id = ?',
            id
        );
        return relation || null;
    } catch (error) {
        console.error(`Error getting bill item relation with ID ${id}:`, error);
        throw error;
    }
}


/**
 * Calculate total amount of all bill items for a department
 * @param db Database instance
 * @param departmentId Department ID
 * @returns Promise resolving to the total amount
 */
export async function getDepartmentTotalBill(db: SQLiteDatabase, departmentId: number): Promise<number> {
    try {
        const result = await db.getFirstAsync<{ total: number }>(`
            SELECT COALESCE(SUM(bi.amount * bir.quantity), 0) as total
            FROM bill_items bi
            JOIN bill_item_relations bir ON bi.id = bir.billItemId
            WHERE bi.departmentId = ?
        `,
            departmentId
        );
        return result?.total || 0;
    } catch (error) {
        console.error('Error calculating department total bill:', error);
        throw error;
    }
}

/**
 * Get all bill items for a department with details
 * @param db Database instance
 * @param departmentId Department ID
 * @returns Promise resolving to an array of bill items
 */
export async function getBillItemsByDepartment(db: SQLiteDatabase, departmentId: number): Promise<BillItem[]> {
    try {
        const billItems = await db.getAllAsync<BillItem>(
            `SELECT * FROM bill_items 
             WHERE departmentId = ? 
             ORDER BY name`,
            departmentId
        );
        return billItems;
    } catch (error) {
        console.error('Error getting bill items by department:', error);
        throw error;
    }
}


