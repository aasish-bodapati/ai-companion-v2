import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LoggingModal from '../ui/LoggingModal';
import LoggingItem, { LoggingItemData } from '../ui/LoggingItem';
import { waterService } from '../../services/waterService';
import { hapticFeedback } from '../../utils/haptics';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme/constants';

interface WaterLoggingModalProps {
  visible: boolean;
  onClose: () => void;
  onWaterLogged: () => void;
}

export default function WaterLoggingModal({
  visible,
  onClose,
  onWaterLogged,
}: WaterLoggingModalProps) {
  const [waterEntries, setWaterEntries] = useState<LoggingItemData[]>([]);
  const [saving, setSaving] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setWaterEntries([]);
      setCustomAmount('');
    }
  }, [visible]);

  const commonAmounts = waterService.getCommonAmounts();

  const handleAddWater = (amount: number, label: string) => {
    const newEntry: LoggingItemData = {
      id: `water-${Date.now()}`,
      name: label,
      quantity: amount,
      quantity_unit: 'ml',
    };
    setWaterEntries([...waterEntries, newEntry]);
    hapticFeedback.selection();
  };

  const handleAddCustomAmount = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) {
      hapticFeedback.error();
      return;
    }

    const newEntry: LoggingItemData = {
      id: `water-custom-${Date.now()}`,
      name: 'Custom Amount',
      quantity: amount,
      quantity_unit: 'ml',
    };
    setWaterEntries([...waterEntries, newEntry]);
    setCustomAmount('');
    hapticFeedback.selection();
  };

  const handleRemoveItem = (id: number | string) => {
    setWaterEntries(waterEntries.filter(item => item.id !== id));
    hapticFeedback.light();
  };

  const handleUpdateItem = (id: number | string, updates: Partial<LoggingItemData>) => {
    setWaterEntries(waterEntries.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const isFormValid = () => {
    return waterEntries.length > 0;
  };

  const getFormData = () => {
    const totalAmount = waterEntries.reduce((sum, item) => sum + (item.quantity || 0), 0);
    return {
      amount_ml: totalAmount,
      log_type: 'manual',
    };
  };

  const handleSave = async (data: any) => {
    setSaving(true);
    try {
      await waterService.createWaterLog(data);
      onWaterLogged();
      onClose();
    } catch (error) {
      console.error('Error logging water:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const renderWaterItem = (item: LoggingItemData, index: number) => (
    <LoggingItem
      key={item.id}
      item={item}
      itemType="water"
      onUpdate={handleUpdateItem}
      onRemove={handleRemoveItem}
      testID={`water-item-${index}`}
    />
  );

  const renderQuickAddSection = () => (
    <View style={styles.quickAddSection}>
      <Text style={styles.sectionTitle}>Quick Add</Text>
      <View style={styles.quickAddButtons}>
        {commonAmounts.map((amount) => (
          <TouchableOpacity
            key={amount.ml}
            style={styles.quickAddButton}
            onPress={() => handleAddWater(amount.ml, amount.label)}
            testID={`quick-add-${amount.ml}`}
          >
            <Ionicons name="water" size={20} color={COLORS.primary} />
            <Text style={styles.quickAddText}>{amount.label}</Text>
            <Text style={styles.quickAddAmount}>{amount.ml}ml</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCustomAmountSection = () => (
    <View style={styles.customAmountSection}>
      <Text style={styles.sectionTitle}>Custom Amount</Text>
      <View style={styles.customAmountRow}>
        <TextInput
          style={styles.customAmountInput}
          value={customAmount}
          onChangeText={setCustomAmount}
          placeholder="Enter amount"
          keyboardType="numeric"
          testID="custom-amount-input"
        />
        <Text style={styles.unitLabel}>ml</Text>
        <TouchableOpacity
          style={[
            styles.addCustomButton,
            (!customAmount || parseFloat(customAmount) <= 0) && styles.addCustomButtonDisabled,
          ]}
          onPress={handleAddCustomAmount}
          disabled={!customAmount || parseFloat(customAmount) <= 0}
          testID="add-custom-amount"
        >
          <Ionicons name="add" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSummary = () => {
    const totalAmount = waterEntries.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalOz = waterService.mlToOz(totalAmount);

    return (
      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>Today's Water Intake</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Ionicons name="water" size={24} color={COLORS.primary} />
            <View style={styles.summaryDetails}>
              <Text style={styles.summaryAmount}>{totalAmount}ml</Text>
              <Text style={styles.summaryUnit}>{totalOz.toFixed(1)} fl oz</Text>
            </View>
          </View>
          <Text style={styles.summaryEntries}>
            {waterEntries.length} entr{waterEntries.length === 1 ? 'y' : 'ies'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <LoggingModal
      visible={visible}
      onClose={onClose}
      onSave={handleSave}
      title="Log Water"
      subtitle="Track your hydration"
      formType="water"
      searchPlaceholder=""
      searchResults={[]}
      onSearch={() => {}}
      onSelectItem={() => {}}
      items={waterEntries}
      onAddItem={() => {}}
      onRemoveItem={handleRemoveItem}
      onUpdateItem={handleUpdateItem}
      renderItem={renderWaterItem}
      isFormValid={isFormValid}
      getFormData={getFormData}
      additionalFields={
        <View>
          {renderQuickAddSection()}
          {renderCustomAmountSection()}
          {waterEntries.length > 0 && renderSummary()}
        </View>
      }
      saving={saving}
      variant="fullScreen"
      testID="water-logging-modal"
    />
  );
}

const styles = StyleSheet.create({
  quickAddSection: {
    marginBottom: SPACING.large,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.large,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.medium,
  },
  quickAddButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.small,
  },
  quickAddButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.small,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    gap: SPACING.small,
  },
  quickAddText: {
    flex: 1,
    fontSize: FONT_SIZE.small,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  quickAddAmount: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.secondary,
  },
  customAmountSection: {
    marginBottom: SPACING.large,
  },
  customAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.small,
  },
  customAmountInput: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    borderRadius: BORDER_RADIUS.medium,
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    fontSize: FONT_SIZE.medium,
    color: COLORS.text.primary,
  },
  unitLabel: {
    fontSize: FONT_SIZE.medium,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  addCustomButton: {
    padding: SPACING.small,
    backgroundColor: COLORS.primary + '20',
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  addCustomButtonDisabled: {
    backgroundColor: COLORS.background.disabled,
    borderColor: COLORS.border.disabled,
  },
  summarySection: {
    marginBottom: SPACING.large,
  },
  summaryCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    padding: SPACING.medium,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.small,
  },
  summaryDetails: {
    marginLeft: SPACING.medium,
  },
  summaryAmount: {
    fontSize: FONT_SIZE.large,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  summaryUnit: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.secondary,
  },
  summaryEntries: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
});
