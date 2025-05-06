// components/AdminHeader.tsx
import { Colors } from '@/utils/styles';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HeaderProps {
  title: string;
}

const AdminHeader: React.FC<HeaderProps> = ({ title }) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const handleNavigate = (route: '/' | '/students' 
    | '/departments' | '/enrollments' | '/bill-items' | '/department-students' ) => {
    setMenuVisible(false);
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      {/* MEC Label */}
      <Text style={styles.mec}>MEC</Text>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Menu Button */}
      <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
        <Ionicons name="menu" size={24} color="black" />
      </TouchableOpacity>

      {/* Dropdown Menu */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menu}>
            <TouchableOpacity onPress={() => handleNavigate('/')} style={styles.menuItemContainer}>
              <Ionicons name="home" size={20} color="black" />
              <Text style={styles.menuItemText}>Home</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => handleNavigate("/students")} style={styles.menuItemContainer}>
              <Ionicons name="person" size={20} color="black" />
              <Text style={styles.menuItemText}>Students</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => handleNavigate('/departments')} style={styles.menuItemContainer}>
              <Ionicons name="business" size={20} color="black" />
              <Text style={styles.menuItemText}>Departments</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleNavigate('/enrollments')} style={styles.menuItemContainer}>
              <Ionicons name="folder" size={20} color="black" />
              <Text style={styles.menuItemText}>Enrollments</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleNavigate('/bill-items')} style={styles.menuItemContainer}>
              <Ionicons name="wallet" size={20} color="black" />
              <Text style={styles.menuItemText}>Bill Items</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleNavigate('/department-students')} style={styles.menuItemContainer}>
              <Ionicons name="file-tray" size={20} color="black" />
              <Text style={styles.menuItemText}>Departmett Studentsett Studentsett Studentsent Students</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 100,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  mec: {
    fontFamily: 'Bold',
    fontSize: 20,
    color: '#007AFF',
    paddingTop: 10,
  },
  title: {
    fontSize: 18,
    fontFamily: 'SemiBold',
    color: Colors.purple[800],
    textAlign: 'center',
    flex: 1,
    paddingTop: 10,
  },
  menuButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: Colors.gray[200],
    marginRight: 16,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  menu: {
    marginTop: 70,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: 200,
  },
  menuItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
  },
});

export default AdminHeader;