// app/(admin)/index.tsx
import AdminHeader from '@/components/AdminHeader';
import * as DepartmentOperations from '@/lib/operations/departments';
import { Colors } from '@/utils/styles';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView
} from 'react-native';
import { Department, CreateDepartmentPayload } from '../../lib/db/schema';

interface BillItemForm {
  name: string;
  amount: string;
  description?: string;
  category?: string;
  isRequired?: boolean;
}

export default function DepartmentsScreen() {
  const db = useSQLiteContext();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [departmentName, setDepartmentName] = useState('');
  const [term, setTerm] = useState('');
  const [year, setYear] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [billItems, setBillItems] = useState<BillItemForm[]>([]);

  // Fetch departments from the database on mount
  useEffect(() => {
    loadDepartments();
  }, []);

  // Function to load departments from the database
  const loadDepartments = async () => {
    setLoading(true);
    try {
      const allDepartments = await DepartmentOperations.getAllDepartments(db);
      setDepartments(allDepartments);
    } catch (error) {
      console.error('Error loading departments:', error);
      setError('Failed to load departments. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  // Handle search
  const handleSearch = async () => {
    try {
      setLoading(true);
      if (searchQuery.trim()) {
        const results = await DepartmentOperations.searchDepartments(db, searchQuery);
        setDepartments(results);
      } else {
        await loadDepartments();
      }
    } catch (err) {
      setError('Search failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Add new bill item
  const addBillItem = () => {
    setBillItems([...billItems, { name: '', amount: '' }]);
  };

  // Remove bill item
  const removeBillItem = (index: number) => {
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  // Update bill item
  const updateBillItem = (index: number, field: keyof BillItemForm, value: string | boolean) => {
    const newBillItems = [...billItems];
    newBillItems[index] = { ...newBillItems[index], [field]: value };
    setBillItems(newBillItems);
  };

  // Handle adding a new department
  const saveDepartment = async () => {
    try {
      // Validate form
      if (!departmentName || !term || !year) {
        Alert.alert('Error', 'Please fill in all required fields.');
        return;
      }

      // Validate bill items
      const invalidBillItems = billItems.filter(item => !item.name || !item.amount || isNaN(Number(item.amount)));
      if (invalidBillItems.length > 0) {
        Alert.alert('Error', 'Please fill in all bill item fields correctly.');
        return;
      }
      
      setLoading(true);
      const departmentData: CreateDepartmentPayload = {
        name: departmentName,
        term,
        year,
        description: description || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        billItems: billItems.map(item => ({
          name: item.name,
          amount: Number(item.amount),
          description: item.description,
          category: item.category,
          isRequired: item.isRequired
        }))
      };

      if (isEditing && selectedDepartment) {
        // Update existing department
        await DepartmentOperations.updateDepartment(db, {
          ...selectedDepartment,
          ...departmentData
        });
      } else {
        // Add new department
        await DepartmentOperations.createDepartment(db, departmentData);
      }

      // Reset Form
      resetForm();
      setModalVisible(false);
      await loadDepartments();
      setError(null);
      
    } catch (error) {
      console.error('Error saving department:', error);
      setError('Failed to save department. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  // Reset form
  const resetForm = () => {
    setDepartmentName('');
    setTerm('');
    setYear('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setBillItems([]);
    setIsEditing(false);
    setSelectedDepartment(null);
  };

  // Handle deleting a department
  const deleteDepartment = async (id: number) => {
    try {
      setLoading(true);
      await DepartmentOperations.deleteDepartment(db, id);
      await loadDepartments();
      setError(null);
    } catch (error) {
      console.error('Error deleting department:', error);
      setError('Failed to delete department. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  // Handle selecting a department for editing
  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setDepartmentName(department.name);
    setTerm(department.term);
    setYear(department.year);
    setDescription(department.description || '');
    setStartDate(department.startDate || '');
    setEndDate(department.endDate || '');
    setIsEditing(true);
    setModalVisible(true);
  };

  // Handle opening the modal for adding a new department
  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  // Handle closing the modal
  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  }

  // Render each department item in the list
  const renderDepartmentItem = ({ item }: { item: Department }) => (
    <View style={styles.departmentItem}>
      <View style={styles.departmentInfo}>
        <Text style={styles.departmentName}>{item.name}</Text>
        <Text style={styles.departmentDetails}>
          {item.term} {item.year}
        </Text>
      </View>
      <View style={styles.departmentActions}>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
          <Ionicons name="pencil" size={24} color="blue" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => {
            Alert.alert(
              "Confirm Delete",
              `Are you sure you want to delete ${item.name}?`,
              [
                {
                  text: "Cancel",
                  style: "cancel"
                },
                { 
                  text: "Delete", 
                  onPress: () => deleteDepartment(item.id!),
                  style: "destructive"
                }
              ]
            );
          }} 
          style={styles.actionButton}
        >
          <Ionicons name="trash" size={24} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyListContainer}>
      <Text style={styles.emptyListText}>No departments found.</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );

  // Render main content conditionally
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AdminHeader title="Departments" />
        {renderLoading()}
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AdminHeader title="Departments" />
        {renderError()}
      </SafeAreaView>
    );
  }
  

  return (
    <SafeAreaView style={styles.safeArea}>
      <AdminHeader title='Departments'/>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search departments..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSearchQuery(''); loadDepartments(); }} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <FlatList
          style={styles.flatList}
          data={departments}
          renderItem={renderDepartmentItem}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          ListEmptyComponent={renderEmptyList}
        />
        
        <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
        
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <Pressable style={styles.backdrop} onPress={closeModal}>
            <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
              <ScrollView style={styles.modalScrollView}>
                <Text style={styles.modalTitle}>
                  {isEditing ? 'Edit Department' : 'Add Department'}
                </Text>

                <Text style={styles.inputLabel}>Department Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter department name"
                  value={departmentName}
                  onChangeText={setDepartmentName}
                />

                <Text style={styles.inputLabel}>Term *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter term"
                  value={term}
                  onChangeText={setTerm}
                />

                <Text style={styles.inputLabel}>Year *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter year"
                  value={year}
                  onChangeText={setYear}
                  keyboardType="numeric"
                />

                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter description"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />

                <Text style={styles.inputLabel}>Start Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={startDate}
                  onChangeText={setStartDate}
                />

                <Text style={styles.inputLabel}>End Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={endDate}
                  onChangeText={setEndDate}
                />

                <View style={styles.billItemsSection}>
                  <Text style={styles.sectionTitle}>Bill Items</Text>
                  {billItems.map((item, index) => (
                    <View key={index} style={styles.billItemContainer}>
                      <View style={styles.billItemHeader}>
                        <Text style={styles.billItemTitle}>Item {index + 1}</Text>
                        <TouchableOpacity
                          onPress={() => removeBillItem(index)}
                          style={styles.removeButton}
                        >
                          <Ionicons name="close-circle" size={24} color="red" />
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.inputLabel}>Name *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter item name"
                        value={item.name}
                        onChangeText={(value) => updateBillItem(index, 'name', value)}
                      />

                      <Text style={styles.inputLabel}>Amount *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter amount"
                        value={item.amount}
                        onChangeText={(value) => updateBillItem(index, 'amount', value)}
                        keyboardType="decimal-pad"
                      />

                      <Text style={styles.inputLabel}>Description</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter description"
                        value={item.description}
                        onChangeText={(value) => updateBillItem(index, 'description', value)}
                      />

                      <Text style={styles.inputLabel}>Category</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter category"
                        value={item.category}
                        onChangeText={(value) => updateBillItem(index, 'category', value)}
                      />
                    </View>
                  ))}

                  <TouchableOpacity
                    onPress={addBillItem}
                    style={styles.addBillItemButton}
                  >
                    <Ionicons name="add-circle" size={24} color="#007AFF" />
                    <Text style={styles.addBillItemText}>Add Bill Item</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity onPress={closeModal} style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={saveDepartment} style={styles.saveButton}>
                    <Text style={styles.saveButtonText}>{isEditing ? 'Update' : 'Save'}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    width: '100%',
    marginBottom: 16,
  },
  searchInput: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  searchButton: {
    flex: 1,
    backgroundColor: '#0066cc',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
    alignItems: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Montserrat',
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#333',
    fontSize: 16,
    fontFamily: 'Montserrat',
  },
  flatList: {
    flex: 1,
    width: '100%',
  },
  addButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 30,
    position: 'absolute',
    bottom: 20,
    right: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  departmentItem: {
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
  departmentInfo: {
    flex: 1,
  },
  departmentName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#c026d3', // fucshia
    fontFamily: 'Regular',
  },
  departmentDetails: {
    fontSize: 12,
    fontFamily: 'Regular',
    color: '#666',
    marginTop: 4,
  },
  departmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: 8,
    marginLeft: 10,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyListText: {
    fontSize: 16,
    color: Colors.info['dark'],
    textAlign: 'center',
    fontFamily: 'Regular',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalScrollView: {
    maxHeight: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Medium',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ccc',
    padding: 12,
    borderRadius: 5,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontFamily: 'SemiBold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.success['dark'],
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'SemiBold',
  },
  billItemsSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Bold',
    color: '#333',
    marginBottom: 15,
  },
  billItemContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  billItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  billItemTitle: {
    fontSize: 16,
    fontFamily: 'SemiBold',
    color: '#333',
  },
  removeButton: {
    padding: 5,
  },
  addBillItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginTop: 10,
  },
  addBillItemText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
    fontFamily: 'Medium',
  },
});