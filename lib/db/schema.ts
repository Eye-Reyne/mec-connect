// lib/db/schema.ts
// Database schema definitions for the school billing system

export interface BaseEntity {
    id?: number; // Optional for new records before insertion
    createdAt?: string; // ISO date string
    updatedAt?: string; // ISO date string
    isActive?: boolean; // Soft delete mechanism
  }
  
  export interface Student extends BaseEntity {
    firstname: string;
    othernames: string;
    phone: string;    
    address: string;
    status?: 'active' | 'inactive' | 'graduated' | 'suspended'; // Enhanced status tracking
  }
  
  export interface Department extends BaseEntity {
    name: string;
    term: string;
    year: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    billItems?: BillItem[]; // Added bill items
  }
  
  export interface StudentDepartment extends BaseEntity {
    studentId: number;
    departmentId: number;
    enrollmentDate?: string; // From SQL schema
    status?: 'active' | 'completed' | 'withdrawn'; // Track enrollment status
  }
  
  export interface BillItem extends BaseEntity {
    name: string;
    amount: number;
    departmentId: number; // Which department this item belongs to
    description?: string; // From SQL schema
    category?: string; // Category of bill item (e.g., tuition, books, uniform)
    isRequired?: boolean; // Whether this item is mandatory
  }
  
  export interface Bill extends BaseEntity {
    name: string;
    studentId: number;
    departmentId: number;
    totalAmount: number;
    dueDate?: string; // Optional due date
    status?: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled'; // Enhanced payment status
    discount?: number; // Optional discount amount
    note?: string; // Additional notes about the bill
  }
  
  export interface BillItemRelation extends BaseEntity {
    billId: number;
    billItemId: number;
    amount: number; // Allows for overriding default amount if needed
    quantity?: number; // Defaults to 1 if not specified
    discount?: number; // Item-specific discount
  }
  
  export interface Payment extends BaseEntity {
    billId: number;
    studentId: number; // Direct reference to student for easier querying
    amount: number;
    paymentDate: string;
    method?: 'cash' | 'transfer' | 'check' | 'card' | 'other'; // Typed payment methods
    reference?: string; // Payment reference number
    receivedBy?: string; // Person who received the payment
    note?: string; // Additional notes about the payment
    status?: 'completed' | 'pending' | 'failed' | 'refunded'; // Payment status tracking
  }
  
  export interface BulkEnrollmentResult {
    successCount: number;
    errors: { studentId: number; error: string }[];
  }
  
  export interface BulkBillResult {
    billsCreated: number;
    totalAmount: number;
    errors: { studentId: number; error: string }[];
  }
  
  // Utility Types
  // Types for CRUD operations
  export type Create<T extends BaseEntity> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
  export type Update<T extends BaseEntity> = Partial<Create<T>> & { id: number };
  
  // Pagination types
  export interface PaginationOptions {
    page: number;
    pageSize: number;
  }
  
  export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number; // Added for frontend pagination
  }
  
  // Search types
  export interface SearchOptions {
    query: string;
    fields: string[];
    filters?: Record<string, any>; // Added for additional filtering
    sortBy?: string; // Field to sort by
    sortOrder?: 'asc' | 'desc'; // Sort direction
  }
  
  // Specific complex operation types
  export interface EnrollStudentsPayload {
    departmentId: number;
    studentIds: number[];
    enrollmentDate?: string; // Optional enrollment date
  }
  
  export interface CreateBillWithItemsPayload {
    studentId: number; // Added student ID for clarity
    departmentId: number;
    name: string;
    dueDate?: string;
    items: {
      billItemId: number;
      amount?: number;
      quantity?: number;
      discount?: number;
    }[];
    note?: string;
  }
  
  export interface BillWithItems extends Bill {
    items: (BillItemRelation & { billItem: BillItem })[];
    payments?: Payment[]; // Include related payments
    student?: Student; // Include student information
  }
  
  export interface StudentWithDepartment extends Student {
    departments: Department[];
  }
  
  export interface DepartmentWithStudents extends Department {
    students: Student[];
  }
  
  export interface StudentBillingSummary {
    studentId: number;
    studentName: string;
    departments: {
      departmentId: number;
      departmentName: string;
      totalBilled: number;
      totalPaid: number;
      totalUnpaid: number;
      bills: Bill[];
    }[];
  }
  
  export interface CreateDepartmentPayload {
    name: string;
    term: string;
    year: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    billItems?: {
        name: string;
        amount: number;
        description?: string;
        category?: string;
        isRequired?: boolean;
    }[];
  }
  
  export interface DepartmentWithBillItems extends Department {
    billItems: BillItem[];
    totalAmount: number;
  }
  
  // Helper Functions
  // Generic filter builder for CRUD operations
  export function buildFilter<T extends BaseEntity>(
    criteria: Partial<T>,
    exclude: (keyof T)[] = ['id', 'createdAt', 'updatedAt']
  ): { whereClause: string; params: any[] } {
    const whereParts: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
  
    for (const [key, value] of Object.entries(criteria)) {
      if (exclude.includes(key as keyof T)) continue;
      
      if (value !== undefined) {
        whereParts.push(`${key} = ?`);
        params.push(value);
        paramIndex++;
      }
    }
  
    return {
      whereClause: whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '',
      params
    };
  }
  
  // Enhanced pagination helper with total pages calculation
  export function applyPagination(
    query: string,
    { page, pageSize }: PaginationOptions,
    totalCountQuery: string
  ): { paginatedQuery: string; countQuery: string; params: any[] } {
    const offset = (page - 1) * pageSize;
    return {
      paginatedQuery: `${query} LIMIT ? OFFSET ?`,
      countQuery: totalCountQuery,
      params: [pageSize, offset]
    };
  }
  
  // Enhanced search helper with sorting
  export function buildSearchQuery(
    { query, fields, filters, sortBy, sortOrder }: SearchOptions,
    baseQuery: string
  ): { searchQuery: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];
    
    // Add search condition
    if (query && fields.length > 0) {
      const searchConditions = fields.map(field => `${field} LIKE ?`).join(' OR ');
      conditions.push(`(${searchConditions})`);
      params.push(...Array(fields.length).fill(`%${query}%`));
    }
    
    // Add filters
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined) {
          conditions.push(`${key} = ?`);
          params.push(value);
        }
      }
    }
    
    // Build WHERE clause
    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';
    
    // Add sorting
    const orderClause = sortBy 
      ? `ORDER BY ${sortBy} ${sortOrder || 'ASC'}`
      : '';
    
    return {
      searchQuery: `${baseQuery} ${whereClause} ${orderClause}`,
      params
    };
  }
  
  // Type Guards (for runtime type checking)
  export function isStudent(obj: any): obj is Student {
    return obj && 
      typeof obj.firstname === 'string' &&
      typeof obj.othernames === 'string' &&      typeof obj.phone === 'string' &&
      typeof obj.address === 'string';
  }
  
  export function isDepartment(obj: any): obj is Department {
    return obj &&
      typeof obj.name === 'string' &&
      typeof obj.term === 'string' &&
      typeof obj.year === 'string';
  }
  
  export function isBillItem(obj: any): obj is BillItem {
    return obj &&
      typeof obj.name === 'string' &&
      typeof obj.amount === 'number' &&
      typeof obj.departmentId === 'number';
  }
  
  export function isPayment(obj: any): obj is Payment {
    return obj &&
      typeof obj.billId === 'number' &&
      typeof obj.amount === 'number' &&
      typeof obj.paymentDate === 'string';
  }
  
  // SQL statements for creating tables
  export const createTablesSQL = `
  -- Students table
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstname TEXT NOT NULL,
    othernames TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    isActive BOOLEAN DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  );
  
  -- Departments table
  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    term TEXT NOT NULL,
    year TEXT NOT NULL,
    description TEXT,
    startDate TEXT,
    endDate TEXT,
    isActive BOOLEAN DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  );
  
  -- StudentDepartment junction table
  CREATE TABLE IF NOT EXISTS student_departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL,
    departmentId INTEGER NOT NULL,
    enrollmentDate TEXT DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active',
    isActive BOOLEAN DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES students (id) ON DELETE CASCADE,
    FOREIGN KEY (departmentId) REFERENCES departments (id) ON DELETE CASCADE,
    UNIQUE(studentId, departmentId)  -- Prevent duplicate enrollments
  );
  
  -- BillItem table
  CREATE TABLE IF NOT EXISTS bill_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    departmentId INTEGER NOT NULL,
    description TEXT,
    category TEXT,
    isRequired BOOLEAN DEFAULT 0,
    isActive BOOLEAN DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (departmentId) REFERENCES departments (id) ON DELETE CASCADE
  );
  
  -- Bills table
  CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    studentId INTEGER NOT NULL,
    departmentId INTEGER NOT NULL,
    totalAmount REAL NOT NULL,
    dueDate TEXT,
    status TEXT DEFAULT 'pending',
    discount REAL DEFAULT 0,
    note TEXT,
    isActive BOOLEAN DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES students (id) ON DELETE CASCADE,
    FOREIGN KEY (departmentId) REFERENCES departments (id) ON DELETE CASCADE
  );
  
  -- BillItemRelation table
  CREATE TABLE IF NOT EXISTS bill_item_relations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    billId INTEGER NOT NULL,
    billItemId INTEGER NOT NULL,
    amount REAL NOT NULL,
    quantity INTEGER DEFAULT 1,
    discount REAL DEFAULT 0,
    isActive BOOLEAN DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (billId) REFERENCES bills (id) ON DELETE CASCADE,
    FOREIGN KEY (billItemId) REFERENCES bill_items (id) ON DELETE CASCADE
  );
  
  -- Payments table
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    billId INTEGER NOT NULL,
    studentId INTEGER NOT NULL,
    amount REAL NOT NULL,
    paymentDate TEXT NOT NULL,
    method TEXT,
    reference TEXT,
    receivedBy TEXT,
    note TEXT,
    status TEXT DEFAULT 'completed',
    isActive BOOLEAN DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (billId) REFERENCES bills (id) ON DELETE CASCADE,
    FOREIGN KEY (studentId) REFERENCES students (id) ON DELETE CASCADE
  );
  
  -- Create indexes for better performance
  CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
  CREATE INDEX IF NOT EXISTS idx_student_departments_studentId ON student_departments(studentId);
  CREATE INDEX IF NOT EXISTS idx_student_departments_departmentId ON student_departments(departmentId);
  CREATE INDEX IF NOT EXISTS idx_student_departments_status ON student_departments(status);
  CREATE INDEX IF NOT EXISTS idx_bill_items_departmentId ON bill_items(departmentId);
  CREATE INDEX IF NOT EXISTS idx_bills_studentId ON bills(studentId);
  CREATE INDEX IF NOT EXISTS idx_bills_departmentId ON bills(departmentId);
  CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
  CREATE INDEX IF NOT EXISTS idx_bill_item_relations_billId ON bill_item_relations(billId);
  CREATE INDEX IF NOT EXISTS idx_bill_item_relations_billItemId ON bill_item_relations(billItemId);
  CREATE INDEX IF NOT EXISTS idx_payments_billId ON payments(billId);
  CREATE INDEX IF NOT EXISTS idx_payments_studentId ON payments(studentId);
  CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
  `;
  
  // Helper query functions for common operations
  export const queries = {
    // Student billing summary
    getBillingSummaryForStudent: `
      SELECT 
        s.id as studentId,
        s.firstname || ' ' || s.othernames as studentName,
        d.id as departmentId,
        d.name as departmentName,
        SUM(b.totalAmount) as totalBilled,
        COALESCE(SUM(p.amount), 0) as totalPaid,
        SUM(b.totalAmount) - COALESCE(SUM(p.amount), 0) as totalUnpaid
      FROM students s
      JOIN bills b ON s.id = b.studentId
      JOIN departments d ON b.departmentId = d.id
      LEFT JOIN payments p ON b.id = p.billId AND p.status = 'completed'
      WHERE s.id = ? AND s.isActive = 1 AND b.isActive = 1
      GROUP BY s.id, d.id
    `,
    
    // Department billing summary
    getBillingSummaryForDepartment: `
      SELECT 
        d.id as departmentId,
        d.name as departmentName,
        COUNT(DISTINCT b.studentId) as totalStudents,
        SUM(b.totalAmount) as totalBilled,
        COALESCE(SUM(p.amount), 0) as totalPaid,
        SUM(b.totalAmount) - COALESCE(SUM(p.amount), 0) as totalUnpaid
      FROM departments d
      JOIN bills b ON d.id = b.departmentId
      LEFT JOIN payments p ON b.id = p.billId AND p.status = 'completed'
      WHERE d.id = ? AND d.isActive = 1 AND b.isActive = 1
      GROUP BY d.id
    `,
  
    // Student bills with items and payments
    getStudentBillsWithDetails: `
      SELECT 
        b.id as billId,
        b.name as billName,
        b.totalAmount,
        b.status,
        b.dueDate,
        s.id as studentId,
        s.firstname || ' ' || s.othernames as studentName,
        d.id as departmentId,
        d.name as departmentName,
        bi.id as billItemId,
        bi.name as billItemName,
        bir.amount as itemAmount,
        bir.quantity as itemQuantity,
        COALESCE(SUM(p.amount), 0) as paidAmount
      FROM bills b
      JOIN students s ON b.studentId = s.id
      JOIN departments d ON b.departmentId = d.id
      JOIN bill_item_relations bir ON b.id = bir.billId
      JOIN bill_items bi ON bir.billItemId = bi.id
      LEFT JOIN payments p ON b.id = p.billId AND p.status = 'completed'
      WHERE b.studentId = ? AND b.isActive = 1
      GROUP BY b.id, bi.id
      ORDER BY b.createdAt DESC
    `,
  
    // Outstanding payments
    getOutstandingPayments: `
      SELECT 
        b.id as billId,
        b.name as billName,
        s.id as studentId,
        s.firstname || ' ' || s.othernames as studentName,
        b.totalAmount,
        COALESCE(SUM(p.amount), 0) as paidAmount,
        b.totalAmount - COALESCE(SUM(p.amount), 0) as amountDue,
        b.dueDate
      FROM bills b
      JOIN students s ON b.studentId = s.id
      LEFT JOIN payments p ON b.id = p.billId AND p.status = 'completed'
      WHERE b.status != 'paid' AND b.isActive = 1
      GROUP BY b.id
      HAVING amountDue > 0
      ORDER BY b.dueDate ASC
    `,
    
    // Payment history
    getPaymentHistory: `
      SELECT 
        p.id as paymentId,
        p.amount,
        p.paymentDate,
        p.method,
        p.reference,
        p.status,
        s.id as studentId,
        s.firstname || ' ' || s.othernames as studentName,
        b.id as billId,
        b.name as billName
      FROM payments p
      JOIN students s ON p.studentId = s.id
      JOIN bills b ON p.billId = b.id
      WHERE p.isActive = 1
      ORDER BY p.paymentDate DESC
    `,
    
    // Department enrollment statistics
    getDepartmentEnrollmentStats: `
      SELECT 
        d.id as departmentId,
        d.name as departmentName,
        COUNT(sd.studentId) as totalEnrollments,
        SUM(CASE WHEN sd.status = 'active' THEN 1 ELSE 0 END) as activeEnrollments,
        SUM(CASE WHEN sd.status = 'completed' THEN 1 ELSE 0 END) as completedEnrollments,
        SUM(CASE WHEN sd.status = 'withdrawn' THEN 1 ELSE 0 END) as withdrawnEnrollments
      FROM departments d
      LEFT JOIN student_departments sd ON d.id = sd.departmentId
      WHERE d.isActive = 1
      GROUP BY d.id
    `
  };