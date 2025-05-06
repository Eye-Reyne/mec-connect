import AdminHeader from '@/components/AdminHeader';
import { getAllDepartments } from '@/lib/operations/departments';
import { bulkEnroll, getEnrollmentsByDepartment } from '@/lib/operations/enrollments';
import { getAllStudents } from '@/lib/operations/students';
import { Colors } from '@/utils/styles';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { CheckBox } from 'react-native-elements';
import { BulkEnrollmentResult, Department, Student } from '../../lib/db/schema';

// Define interface for enrolled students
interface EnrolledStudent {
  studentId: number;
  studentName: string;
}

// Constants for pagination
const STUDENTS_PER_PAGE = 10;

export default function EnrollmentsScreen() {
  const db = useSQLiteContext();
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // New state variables
  const [activeTab, setActiveTab] = useState<'enrolled' | 'unenrolled'>('unenrolled');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      loadEnrolledStudents();
    }
  }, [selectedDepartment]);

  const loadData = async () => {
    try {
      setInitialLoading(true);
      const [allDepartments, allStudents] = await Promise.all([
        getAllDepartments(db),
        getAllStudents(db)
      ]);
      
      setDepartments(allDepartments);
      setStudents(allStudents);
      
      if (allDepartments.length > 0 && allDepartments[0].id) {
        setSelectedDepartment(allDepartments[0].id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
      console.error(error);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadEnrolledStudents = async () => {
    if (!selectedDepartment) return;
    
    try {
      const enrollments = await getEnrollmentsByDepartment(db, selectedDepartment);
      
      setEnrolledStudents(
        enrollments.map(student => ({
          studentId: student.id!,
          studentName: `${student.firstname} ${student.othernames}`
        }))
      );
      
      // Reset pagination
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading enrolled students:', error);
      Alert.alert('Error', 'Failed to load enrolled students');
    }
  };

  const handleToggleStudent = (studentId: number) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleEnroll = async () => {
    if (!selectedDepartment) {
      Alert.alert('Error', 'Please select a department');
      return;
    }

    if (selectedStudents.length === 0) {
      Alert.alert('Error', 'Please select at least one student');
      return;
    }

    try {
      setLoading(true);
      const result: BulkEnrollmentResult = await bulkEnroll(db, selectedDepartment, selectedStudents);
      
      if (result.errors.length > 0) {
        // Show partial success with errors
        Alert.alert(
          'Partial Success', 
          `Successfully enrolled ${result.successCount} student(s).\n\n${result.errors.length} student(s) could not be enrolled.`,
          [
            { 
              text: 'View Errors', 
              onPress: () => showEnrollmentErrors(result.errors) 
            },
            { text: 'OK' }
          ]
        );
      } else {
        // Show full success
        Alert.alert(
          'Success', 
          `Successfully enrolled all ${result.successCount} student(s).`
        );
      }
      
      // Reset selections and refresh enrolled students
      setSelectedStudents([]);
      setSelectAll(false);
      await loadEnrolledStudents();
    } catch (error) {
      Alert.alert('Error', 'Failed to enroll students');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showEnrollmentErrors = (errors: { studentId: number; error: string }[]) => {
    const errorMessages = errors.map(error => {
      const student = students.find(s => s.id === error.studentId);
      const studentName = student ? `${student.firstname} ${student.othernames}` : `Student #${error.studentId}`;
      return `• ${studentName}: ${error.error}`;
    }).join('\n');
    
    Alert.alert('Enrollment Errors', errorMessages);
  };

  // Filter students based on search query
  const filterStudents = (studentList: Student[] | EnrolledStudent[], query: string) => {
    if (!query) return studentList;
    
    return studentList.filter(student => {
      const studentName = 'studentName' in student 
        ? student.studentName.toLowerCase() 
        : `${student.firstname} ${student.othernames}`.toLowerCase();
      
      return studentName.includes(query.toLowerCase());
    });
  };

  // Get students for current page
  const getPaginatedStudents = (studentList: any[], page: number) => {
    const startIndex = (page - 1) * STUDENTS_PER_PAGE;
    return studentList.slice(startIndex, startIndex + STUDENTS_PER_PAGE);
  };

  // Calculate total pages
  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / STUDENTS_PER_PAGE);
  };

  // Handle select all functionality
  const handleSelectAll = (value: boolean) => {
    setSelectAll(value);
    
    if (value) {
      // Get all unenrolled student IDs that are visible (filtered by search)
      const unenrolledStudents = students.filter(
        student => !enrolledStudents.some(es => es.studentId === student.id)
      );
      const filteredStudents = filterStudents(unenrolledStudents, searchQuery);
      const studentIds = filteredStudents
        .map(student => ('id' in student ? student.id : ('studentId' in student ? student.studentId : null)))
        .filter((id): id is number => id !== null);
      setSelectedStudents(studentIds);
    } else {
      setSelectedStudents([]);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading data...</Text>
      </View>
    );
  }

  // Filter students based on enrollment status and search query
  const unenrolledStudents = students.filter(
    student => !enrolledStudents.some(es => es.studentId === student.id)
  );
  
  const filteredEnrolledStudents = filterStudents(enrolledStudents, searchQuery);
  const filteredUnenrolledStudents = filterStudents(unenrolledStudents, searchQuery);
  
  // Get current page data
  const currentEnrolledStudents = getPaginatedStudents(filteredEnrolledStudents, currentPage);
  const currentUnenrolledStudents = getPaginatedStudents(filteredUnenrolledStudents, currentPage);
  
  // Calculate total pages
  const totalEnrolledPages = getTotalPages(filteredEnrolledStudents.length);
  const totalUnenrolledPages = getTotalPages(filteredUnenrolledStudents.length);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AdminHeader title='Enroll Students'/>
      
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header with title */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Student Enrollments</Text>
        </View>

        {/* Department Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Department</Text>
          <View style={styles.pickerContainer}>
            {departments.length > 0 ? (
              <Picker
                selectedValue={selectedDepartment}
                onValueChange={(itemValue) => setSelectedDepartment(itemValue)}
                style={styles.picker}
              >
                {departments.map(dept => (
                  <Picker.Item 
                    key={dept.id} 
                    label={`${dept.name} (${dept.term} ${dept.year})`} 
                    value={dept.id} 
                  />
                ))}
              </Picker>
            ) : (
              <Text style={styles.noDataText}>No departments available</Text>
            )}
          </View>
        </View>

        {selectedDepartment && (
          <>
            {/* Enrollment Button - Moved to top */}
            <TouchableOpacity 
              style={[
                styles.enrollButton,
                (loading || selectedStudents.length === 0) && styles.disabledButton
              ]} 
              onPress={handleEnroll}
              disabled={loading || selectedStudents.length === 0}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={20} color="white" />
                  <Text style={styles.enrollButtonText}>
                    Enroll Selected ({selectedStudents.length})
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Tabs Navigation */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'unenrolled' && styles.activeTab]}
                onPress={() => {
                  setActiveTab('unenrolled');
                  setCurrentPage(1);
                }}
              >
                <Text style={[styles.tabText, activeTab === 'unenrolled' && styles.activeTabText]}>
                  Unenrolled ({filteredUnenrolledStudents.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'enrolled' && styles.activeTab]}
                onPress={() => {
                  setActiveTab('enrolled');
                  setCurrentPage(1);
                }}
              >
                <Text style={[styles.tabText, activeTab === 'enrolled' && styles.activeTabText]}>
                  Enrolled ({filteredEnrolledStudents.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#777" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search students..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
              {searchQuery !== '' && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}>
                  <Ionicons name="close-circle" size={20} color="#777" />
                </TouchableOpacity>
              )}
            </View>

            {/* Student Lists - Unenrolled Tab */}
            {activeTab === 'unenrolled' && (
              <View style={styles.listContainer}>
                {/* Select All Option */}
                {filteredUnenrolledStudents.length > 0 && (
                  <View style={styles.selectAllContainer}>
                    <CheckBox
                      checked={selectAll}
                      onPress={() => handleSelectAll(!selectAll)}
                      containerStyle={styles.selectAllCheckbox}
                    />
                    <Text style={styles.selectAllText}>Select All</Text>
                  </View>
                )}

                {/* Students List */}
                {filteredUnenrolledStudents.length > 0 ? (
                  currentUnenrolledStudents.map(student => (
                    <View key={student.id} style={styles.studentItem}>
                      <CheckBox
                        checked={selectedStudents.includes(student.id!)}
                        onPress={() => handleToggleStudent(student.id!)}
                        containerStyle={styles.checkbox}
                      />
                      <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>
                          {student.firstname} {student.othernames}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDataText}>
                    {searchQuery ? 'No students match your search' : 'No students available to enroll'}
                  </Text>
                )}

                {/* Pagination Controls */}
                {filteredUnenrolledStudents.length > STUDENTS_PER_PAGE && (
                  <View style={styles.paginationContainer}>
                    <TouchableOpacity
                      disabled={currentPage === 1}
                      onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      style={[styles.paginationButton, currentPage === 1 && styles.disabledPaginationButton]}
                    >
                      <Ionicons name="chevron-back" size={18} color={currentPage === 1 ? "#ccc" : "#2196F3"} />
                    </TouchableOpacity>
                    
                    <Text style={styles.paginationText}>
                      Page {currentPage} of {totalUnenrolledPages}
                    </Text>
                    
                    <TouchableOpacity
                      disabled={currentPage === totalUnenrolledPages}
                      onPress={() => setCurrentPage(prev => Math.min(totalUnenrolledPages, prev + 1))}
                      style={[styles.paginationButton, currentPage === totalUnenrolledPages && styles.disabledPaginationButton]}
                    >
                      <Ionicons name="chevron-forward" size={18} color={currentPage === totalUnenrolledPages ? "#ccc" : "#2196F3"} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Student Lists - Enrolled Tab */}
            {activeTab === 'enrolled' && (
              <View style={styles.listContainer}>
                {filteredEnrolledStudents.length > 0 ? (
                  currentEnrolledStudents.map(student => (
                    <View key={student.studentId} style={styles.enrolledStudent}>
                      <Ionicons name="person" size={20} color="#2196F3" />
                      <Text style={styles.enrolledStudentName}>{student.studentName}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDataText}>
                    {searchQuery ? 'No enrolled students match your search' : 'No students enrolled yet'}
                  </Text>
                )}

                {/* Pagination Controls */}
                {filteredEnrolledStudents.length > STUDENTS_PER_PAGE && (
                  <View style={styles.paginationContainer}>
                    <TouchableOpacity
                      disabled={currentPage === 1}
                      onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      style={[styles.paginationButton, currentPage === 1 && styles.disabledPaginationButton]}
                    >
                      <Ionicons name="chevron-back" size={18} color={currentPage === 1 ? "#ccc" : "#2196F3"} />
                    </TouchableOpacity>
                    
                    <Text style={styles.paginationText}>
                      Page {currentPage} of {totalEnrolledPages}
                    </Text>
                    
                    <TouchableOpacity
                      disabled={currentPage === totalEnrolledPages}
                      onPress={() => setCurrentPage(prev => Math.min(totalEnrolledPages, prev + 1))}
                      style={[styles.paginationButton, currentPage === totalEnrolledPages && styles.disabledPaginationButton]}
                    >
                      <Ionicons name="chevron-forward" size={18} color={currentPage === totalEnrolledPages ? "#ccc" : "#2196F3"} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Bold',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Regular',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  activeTab: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Medium',
    color: '#777',
  },
  activeTabText: {
    color: 'white',
  },
  // Search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
  },
  clearSearch: {
    padding: 4,
  },
  // List container
  listContainer: {
    marginBottom: 16,
  },
  // Select all option
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 8,
  },
  selectAllCheckbox: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    margin: 0,
  },
  selectAllText: {
    fontSize: 14,
    fontFamily: 'Bold',
    color: Colors.warning['light'],
  },
  enrolledStudent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  enrolledStudentName: {
    marginLeft: 12,
    fontSize: 14,
    fontFamily: 'Medium',
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  checkbox: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    margin: 0,
  },
  studentInfo: {
    flex: 1,
    paddingVertical: 8,
  },
  studentName: {
    fontSize: 14,
    fontFamily: 'Regular',
  },
  noDataText: {
    padding: 12,
    fontStyle: 'italic',
    color: '#888',
    textAlign: 'center',
  },
  // Pagination styles
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  paginationButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  disabledPaginationButton: {
    opacity: 0.5,
  },
  paginationText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontFamily: 'Regular',
  },
  // Enrollment button styles
  enrollButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  enrollButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Bold',
    marginLeft: 8,
  },
});