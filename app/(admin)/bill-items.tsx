import AdminHeader from '@/components/AdminHeader';
import {
    addBillItem,
    deleteBillItem,
    getAllBillItems,
    searchBillItems,
    updateBillItem,
} from '@/lib/operations/bill-items';
import { getAllDepartments } from '@/lib/operations/departments';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { BillItem } from '../../lib/db/schema';


type Department = {
  id?: number;
  name: string;
};

export default function BillItemsScreen ({ navigation }: any) {
  const db = useSQLiteContext();
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<BillItem | null>(null);
  
  // Form state
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);

  // Load departments and bill items when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [db])
  );

  // Load data function to fetch departments and bill items
  const loadData = async () => {
    if (!db) return;
    
    setIsLoading(true);
    try {
      // Load departments
      const departmentsData = await getAllDepartments(db);
      setDepartments(departmentsData);
      
      if (departmentsData.length > 0 && selectedDepartmentId === null) {
        setSelectedDepartmentId(departmentsData[0]?.id || null);
      }
      
      // Load bill items
      const items = await getAllBillItems(db);
      setBillItems(items);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // Handle search
  const handleSearch = async () => {
    if (!db) return;
    
    setIsLoading(true);
    try {
      if (searchQuery.trim() === '') {
        const items = await getAllBillItems(db);
        setBillItems(items);
      } else {
        const items = await searchBillItems(db, searchQuery);
        setBillItems(items);
      }
    } catch (error) {
      console.error('Error searching bill items:', error);
      Alert.alert('Error', 'Failed to search bill items');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form state
  const resetForm = () => {
    setItemName('');
    setItemAmount('');
    setSelectedDepartmentId(departments.length > 0 ? departments[0]?.id ?? null : null);
    setEditingItem(null);
  };

  // Open modal for adding new item
  const handleAddItem = () => {
    resetForm();
    setModalVisible(true);
  };

  // Open modal for editing existing item
  const handleEditItem = (item: BillItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemAmount(item.amount.toString());
    setSelectedDepartmentId(item.departmentId);
    setModalVisible(true);
  };

  // Save bill item (add or update)
  const handleSaveItem = async () => {
    if (!db || !selectedDepartmentId) return;
    
    // Validate inputs
    if (!itemName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    
    const amount = parseFloat(itemAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      const billItemData: {
        name: string;
        amount: number;
        departmentId: number;
        id?: number;
      } = {
        name: itemName.trim(),
        amount,
        departmentId: selectedDepartmentId,
      };

      if (editingItem) {
        // Update existing item
        if (!editingItem.id) {
          Alert.alert('Error', 'Invalid item ID');
          return;
        }
        billItemData.id = editingItem.id;
        await updateBillItem(db, billItemData as { id: number; name: string; amount: number; departmentId: number });
        
        // Update local state
        setBillItems(prevItems =>
          prevItems.map(item => (item.id === editingItem.id ? billItemData : item))
        );
      } else {
        // Add new item
        const newItem = await addBillItem(db, billItemData);
        setBillItems(prevItems => [...prevItems, newItem]);
      }
      
      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.error('Error saving bill item:', error);
      Alert.alert('Error', 'Failed to save bill item');
    }
  };

  // Delete bill item
  const handleDeleteItem = async (item: BillItem) => {
    if (!db) return;
    
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBillItem(db, item.id!);
              setBillItems(prevItems => prevItems.filter(i => i.id !== item.id));
            } catch (error) {
              console.error('Error deleting bill item:', error);
              Alert.alert('Error', 'Failed to delete bill item');
            }
          },
        },
      ]
    );
  };

  // Get department name by ID
  const getDepartmentName = (departmentId: number) => {
    const department = departments.find(dept => dept.id === departmentId);
    return department ? department.name : 'Unknown Department';
  };

  // Render individual bill item
  const renderBillItem = ({ item }: { item: BillItem }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDepartment}>{getDepartmentName(item.departmentId)}</Text>
        <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => handleEditItem(item)}
        >
          <Ionicons name="pencil" size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AdminHeader title="Bill Items" />
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search bill items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Bill Items List */}
      <FlatList
        data={billItems}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderBillItem}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListText}>No bill items found</Text>
          </View>
        }
      />

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Edit Bill Item' : 'Add New Bill Item'}
            </Text>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter bill item name"
              value={itemName}
              onChangeText={setItemName}
            />

            <Text style={styles.inputLabel}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              value={itemAmount}
              onChangeText={setItemAmount}
              keyboardType="decimal-pad"
            />

            <Text style={styles.inputLabel}>Department</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedDepartmentId}
                onValueChange={(itemValue: any) => setSelectedDepartmentId(itemValue)}
                style={styles.picker}
              >
                {departments.map((department) => (
                  <Picker.Item
                    key={department.id}
                    label={department.name}
                    value={department.id}
                  />
                ))}
              </Picker>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveItem}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F2F2F7',
  },
  searchButton: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    marginVertical: 4,
    marginHorizontal: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontFamily: 'SemiBold',
    color: '#1C1C1E',
  },
  itemDepartment: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
    fontFamily: 'Regular',
  },
  itemAmount: {
    fontSize: 16,
    fontFamily: 'SemiBold',
    color: '#007AFF',
    marginTop: 4,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyListText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 15,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3A3A3C',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    height: 45,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F2F2F7',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    marginBottom: 5,
  },
  picker: {
    height: 45,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginLeft: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

