import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { FONTS } from '../../services/fonts';

interface CardItemProps {
  index: number;
  card: {
    id: string;
    term: string;
    definition: string;
  };
  onChangeField: (field: string, value: string) => void;
  onDelete: () => void;
}

export default function CardItem({ index, card, onChangeField, onDelete }: CardItemProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.indexText}>{index + 1}</Text>
      <View style={styles.cardContent}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholderTextColor="#8E8E93"
            value={card.term}
            onChangeText={(text) => onChangeField('term', text)}
            multiline
            placeholder="Term"
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholderTextColor="#8E8E93"
            value={card.definition}
            onChangeText={(text) => onChangeField('definition', text)}
            multiline
            placeholder="Definition"
          />
        </View>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
        <Text style={styles.deleteButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  indexText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 12,
    width: 20,
    textAlign: 'center'
  },
  container: {
    backgroundColor: '#202f36',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    aspectRatio: 3/4
  },
  cardContent: {
    flex: 1,
    position: 'relative'
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 16
  },
  input: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: '#FFFFFF',
    padding: 0,
    minHeight: 24
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(44, 62, 71, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1
  },
  deleteButtonText: {
    color: '#8E8E93',
    fontSize: 18,
    fontFamily: FONTS.regular
  }
});