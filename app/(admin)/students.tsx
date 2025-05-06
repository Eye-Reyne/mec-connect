import AdminHeader from '@/components/AdminHeader';
import { Student } from '@/lib/db/schema';
import * as StudentOperations from '@/lib/operations/students';
import { Colors } from '@/utils/styles';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';



/**
 * Comprehensive Student Management Component
 * Features:
 * - List students with pagination
 * - Search functionality
 * - Create, Read, Update, Delete operations
 * - Form validation
 * - Loading states and error handling
 */
export default function StudentManagement() {
  const db = useSQLiteContext();
  
  // State for student list and pagination
  const [students, setStudents] = useState<Student[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // State for searching
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // State for student form (create/edit)
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<Student>({
    firstname: '',
    othernames: '',
    phone: '',
    address: '',
    status: 'active'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Load students when component mounts or when pagination/search changes
  useEffect(() => {
    loadStudents();
  }, [currentPage, pageSize, searchQuery]);

  // Function to load students with pagination and search
  const loadStudents = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      const searchOptions = searchQuery ? {
        query: searchQuery,
        fields: ['firstname', 'othernames', 'phone', 'address'],
        sortBy: 'firstname',
        sortOrder: 'asc' as const
      } : undefined;
      
      const result = await StudentOperations.searchStudents(db, {
        searchOptions,
        pagination: { page: currentPage, pageSize },
        includeInactive: false
      });
      
      setStudents(result.data);
      setTotalPages(result.totalPages);
      setTotalStudents(result.total);
      
    } catch (error) {
      console.error('Failed to load students:', error);
      Alert.alert('Error', 'Failed to load students. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((text: string) => {
      setSearchQuery(text);
      setCurrentPage(1); // Reset to first page when searching
      setIsSearching(false);
    }, 500),
    []
  );

  // Handle search input
  const handleSearch = (text: string) => {
    setIsSearching(true);
    debouncedSearch(text);
  };

  // Function to handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadStudents();
  };

  // Reset form data and errors
  const resetForm = () => {
    setFormData({
      firstname: '',
      othernames: '',
      phone: '',
      address: '',
      status: 'active'
    });
    setFormErrors({});
  };

  // Open modal for creating a new student
  const handleAddStudent = () => {
    setIsEditMode(false);
    resetForm();
    setIsModalVisible(true);
  };

  // Open modal for editing an existing student
  const handleEditStudent = (student: Student) => {
    setIsEditMode(true);
    setFormData({ ...student });
    setIsModalVisible(true);
  };

  // Update form data when fields change
  const handleInputChange = (field: keyof Student, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user types
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.firstname.trim()) {
      errors.firstname = 'First name is required';
    }
    
    if (!formData.othernames.trim()) {
      errors.othernames = 'Other names are required';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9]{10,15}$/.test(formData.phone.trim())) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form to create or update student
  const handleSubmit = async () => {
    Keyboard.dismiss();
    
    if (!validateForm()) return;
    
    try {
      setIsSaving(true);
      
      if (isEditMode && formData.id) {
        // Update existing student
        await StudentOperations.updateStudent(db, formData);
        Alert.alert('Success', 'Student updated successfully');
      } else {
        // Create new student
        await StudentOperations.addStudent(db, formData);
        Alert.alert('Success', 'Student added successfully');
      }
      
      setIsModalVisible(false);
      loadStudents(); // Reload the list
      
    } catch (error) {
      console.error('Error saving student:', error);
      Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'add'} student. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle student deletion with confirmation
  const handleDeleteStudent = (student: Student) => {
    if (!student.id) return;
    
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${student.firstname} ${student.othernames}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              if (!student.id) throw new Error('Student ID is undefined');
              await StudentOperations.deleteStudent(db, student.id);
              
              // If we're on a page that would be empty after deletion, go back one page
              if (students.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
              } else {
                loadStudents();
              }
              
              Alert.alert('Success', 'Student deleted successfully');
            } catch (error) {
              console.error('Error deleting student:', error);
              Alert.alert('Error', 'Failed to delete student. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // View student details
  const handleViewStudent = (student: Student) => {
    Alert.alert(
      `${student.firstname} ${student.othernames}`,
      `Phone: ${student.phone}\nAddress: ${student.address}\nStatus: ${student.status || 'Active'}`,
      [{ text: 'Close' }]
    );
  };

  // Render each student item in the list
  const renderStudentItem = ({ item }: { item: Student }) => (
    <View style={styles.studentItem}>
      <TouchableOpacity 
        style={styles.studentInfo}
        onPress={() => handleViewStudent(item)}
      >
        <Text style={styles.studentName}>{item.firstname} {item.othernames}</Text>
      </TouchableOpacity>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditStudent(item)}
        >
          <Ionicons name="pencil" size={18} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteStudent(item)}
        >
          <Ionicons name="trash" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render pagination controls
  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      <Text style={styles.paginationInfo}>
        {totalStudents > 0 
          ? `Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalStudents)} of ${totalStudents}`
          : 'No students found'}
      </Text>
      
      <View style={styles.paginationControls}>
        <TouchableOpacity 
          style={[styles.paginationButton, currentPage <= 1 && styles.disabledButton]}
          onPress={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <Ionicons name="chevron-back" size={18} color={currentPage <= 1 ? '#aaa' : '#fff'} />
        </TouchableOpacity>
        
        <Text style={styles.pageNumber}>{currentPage} / {totalPages}</Text>
        
        <TouchableOpacity 
          style={[styles.paginationButton, currentPage >= totalPages && styles.disabledButton]}
          onPress={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <Ionicons name="chevron-forward" size={18} color={currentPage >= totalPages ? '#aaa' : '#fff'} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Main render
  return (
    <SafeAreaView style={{ flex: 1}}>
      <AdminHeader title="Student Management" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddStudent}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
             
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search students..."
              onChangeText={handleSearch}
              returnKeyType="search"
            />
            {isSearching && (
              <ActivityIndicator size="small" color="#007BFF" style={styles.searchSpinner} />
            )}
          </View>
        </View>

        
        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007BFF" />
            <Text style={styles.loadingText}>Loading students...</Text>
          </View>
        ) : (
          <FlatList
            data={students}
            keyExtractor={(item) => `student-${item.id}`}
            renderItem={renderStudentItem}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people" size={48} color="#ccc" />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No students match your search' : 'No students found'}
                </Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#007BFF']}
              />
            }
          />
        )}
        
        {renderPagination()}
        
        {/* Student Form Modal */}
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {isEditMode ? 'Edit Student' : 'Add New Student'}
                </Text>
                <TouchableOpacity 
                  onPress={() => setIsModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.formContainer}>
                {/* First Name */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>First Name</Text>
                  <TextInput
                    style={[styles.formInput, formErrors.firstname && styles.inputError]}
                    value={formData.firstname}
                    onChangeText={(value) => handleInputChange('firstname', value)}
                    placeholder="Enter first name"
                  />
                  {formErrors.firstname && (
                    <Text style={styles.errorText}>{formErrors.firstname}</Text>
                  )}
                </View>
                
                {/* Other Names */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Other Names</Text>
                  <TextInput
                    style={[styles.formInput, formErrors.othernames && styles.inputError]}
                    value={formData.othernames}
                    onChangeText={(value) => handleInputChange('othernames', value)}
                    placeholder="Enter other names"
                  />
                  {formErrors.othernames && (
                    <Text style={styles.errorText}>{formErrors.othernames}</Text>
                  )}
                </View>
                
                {/* Phone */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Phone</Text>
                  <TextInput
                    style={[styles.formInput, formErrors.phone && styles.inputError]}
                    value={formData.phone}
                    onChangeText={(value) => handleInputChange('phone', value)}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                  />
                  {formErrors.phone && (
                    <Text style={styles.errorText}>{formErrors.phone}</Text>
                  )}
                </View>
                
                {/* Address */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Address</Text>
                  <TextInput
                    style={[styles.formInput, formErrors.address && styles.inputError]}
                    value={formData.address}
                    onChangeText={(value) => handleInputChange('address', value)}
                    placeholder="Enter address"
                    multiline={true}
                    numberOfLines={3}
                  />
                  {formErrors.address && (
                    <Text style={styles.errorText}>{formErrors.address}</Text>
                  )}
                </View>
                
                {/* Status */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Status</Text>
                  <View style={styles.statusButtons}>
                    {['active', 'inactive', 'graduated', 'suspended'].map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusButton,
                          formData.status === status && styles.statusButtonActive
                        ]}
                        onPress={() => handleInputChange('status', status)}
                      >
                        <Text
                          style={[
                            styles.statusButtonText,
                            formData.status === status && styles.statusButtonTextActive
                          ]}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>
              
              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setIsModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {isEditMode ? 'Update' : 'Save'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    //paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    // backgroundColor: '#fff',
    // borderBottomWidth: 1,
    // borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.purple[500],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 0.7,
    height: 44,
    fontSize: 16,
  },
  searchSpinner: {
    marginLeft: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  studentItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  studentDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  studentStatus: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  paginationInfo: {
    fontSize: 14,
    color: '#666',
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paginationButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
  },
  pageNumber: {
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 16,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  statusButtonActive: {
    backgroundColor: '#007BFF',
  },
  statusButtonText: {
    color: '#333',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});