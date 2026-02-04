import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VIEW_MODES } from '../../utils/calendar/calendarConstants';

interface ViewModeSelectorProps {
  currentViewMode: string;
  onModeChange: (mode: string) => void;
}

const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({ currentViewMode, onModeChange }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSelectMode = (modeKey: string) => {
    onModeChange(modeKey);
    setIsDropdownOpen(false);
  };

  return (
    <View style={{ flex: 1 }}> 
      <TouchableOpacity style={styles.dropdownBtn} onPress={() => setIsDropdownOpen(!isDropdownOpen)}>
        <Text style={styles.dropdownText}>{VIEW_MODES.find(m => m.key === currentViewMode)?.label}</Text>
        <View style={{ marginLeft: 5 }}>
          <Ionicons name={isDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color="#666" />
        </View>
      </TouchableOpacity>

      {isDropdownOpen && (
        <View style={styles.viewModeDropdown}>
          {VIEW_MODES.map((item, index) => {
            const isSelected = currentViewMode === item.key;
            return (
              <TouchableOpacity 
                key={item.key} 
                style={[styles.viewModeItem, index < VIEW_MODES.length - 1 && styles.viewModeItemBorder]}
                onPress={() => handleSelectMode(item.key)}
              >
                <Text style={styles.viewModeText}>{item.label}</Text>
                {isSelected && <Ionicons name="checkmark" size={20} color="#000" />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default ViewModeSelector;

const styles = StyleSheet.create({
  dropdownBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#ccc', borderRadius: 6,
    paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#fff',
  },
  dropdownText: { fontSize: 15, color: '#333' },
  viewModeDropdown: {
    position: 'absolute', top: 45, left: 0, right: 0, backgroundColor: '#fff',
    borderRadius: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 5, borderWidth: 1, borderColor: '#eee', zIndex: 99,
  },
  viewModeItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  viewModeItemBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  viewModeText: { fontSize: 16, color: '#333' },
});