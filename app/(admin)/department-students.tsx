import AdminHeader from '@/components/AdminHeader';
import { getAllDepartments, getDepartmentWithBillItems } from '@/lib/operations/departments';
import { getStudentsInDepartmentById } from '@/lib/operations/departments';
import { formatCurrency } from '@/utils/formatters';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { Department, DepartmentWithBillItems, Student } from '../../lib/db/schema';

interface StudentWithBilling extends Student {
  totalAmount: number;
}

export default function DepartmentStudentsScreen() {
  const db = useSQLiteContext();
  const [index, setIndex] = useState(0);
  const [routes, setRoutes] = useState<{ key: string; title: string }[]>([]);
  const [departments, setDepartments] = useState<DepartmentWithBillItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load departments and their bill items
  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const allDepartments = await getAllDepartments(db);
      
      // Get bill items for each department
      const departmentsWithItems = await Promise.all(
        allDepartments.map(async (dept) => {
          if (dept.id) {
            const deptWithItems = await getDepartmentWithBillItems(db, dept.id);
            return deptWithItems;
          }
          return null;
        })
      );

      const validDepartments = departmentsWithItems.filter((dept): dept is DepartmentWithBillItems => dept !== null);
      setDepartments(validDepartments);

      // Create routes for TabView
      const newRoutes = validDepartments.map(dept => ({
        key: dept.id!.toString(),
        title: dept.name
      }));
      setRoutes(newRoutes);
    } catch (error) {
      console.error('Error loading departments:', error);
      setError('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      scrollEnabled
      style={styles.tabBar}
      labelStyle={styles.tabLabel}
      indicatorStyle={styles.tabIndicator}
    />
  );

  const renderScene = ({ route }: { route: { key: string } }) => {
    const department = departments.find(d => d.id!.toString() === route.key);
    if (!department) return null;

    return <DepartmentTab department={department} />;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AdminHeader title="Department Students" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AdminHeader title="Department Students" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AdminHeader title="Department Students" />
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: Dimensions.get('window').width }}
        renderTabBar={renderTabBar}
      />
    </SafeAreaView>
  );
}

function DepartmentTab({ department }: { department: DepartmentWithBillItems }) {
  const db = useSQLiteContext();
  const [students, setStudents] = useState<StudentWithBilling[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStudents();
  }, [department.id]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const enrolledStudents = await getStudentsInDepartmentById(db, department.id!);
      
      // Add total amount to each student
      const studentsWithBilling = enrolledStudents.map(student => ({
        ...student,
        totalAmount: department.totalAmount // Each student has the same total amount based on department bill items
      }));

      setStudents(studentsWithBilling);
    } catch (error) {
      console.error('Error loading students:', error);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.tabContent}>
      <View style={styles.departmentInfo}>
        <Text style={styles.departmentName}>{department.name}</Text>
        <Text style={styles.departmentDetails}>
          {department.term} {department.year}
        </Text>
        <Text style={styles.totalAmount}>
          Total Amount: {formatCurrency(department.totalAmount)}
        </Text>
      </View>

      <View style={styles.studentsList}>
        {students.map((student) => (
          <View key={student.id} style={styles.studentCard}>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>
                {student.firstname} {student.othernames}
              </Text>
              <Text style={styles.studentAmount}>
                {formatCurrency(student.totalAmount)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
  tabBar: {
    backgroundColor: '#fff',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabLabel: {
    color: '#333',
    textTransform: 'none',
    fontSize: 14,
    fontFamily: 'Medium',
  },
  tabIndicator: {
    backgroundColor: '#007AFF',
  },
  tabContent: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  departmentInfo: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  departmentName: {
    fontSize: 18,
    fontFamily: 'Bold',
    color: '#333',
  },
  departmentDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Regular',
  },
  totalAmount: {
    fontSize: 16,
    color: '#007AFF',
    marginTop: 8,
    fontFamily: 'SemiBold',
  },
  studentsList: {
    padding: 16,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  studentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentName: {
    fontSize: 16,
    fontFamily: 'Medium',
    color: '#333',
  },
  studentAmount: {
    fontSize: 16,
    fontFamily: 'SemiBold',
    color: '#007AFF',
  },
}); 