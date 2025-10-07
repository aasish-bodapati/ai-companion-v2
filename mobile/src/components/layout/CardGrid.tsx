import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  ViewStyle,
} from 'react-native';

const { width } = Dimensions.get('window');

interface CardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  spacing?: number;
  horizontal?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  contentContainerStyle?: ViewStyle;
  style?: ViewStyle;
}

export default function CardGrid({
  children,
  columns = 2,
  spacing = 16,
  horizontal = false,
  showsHorizontalScrollIndicator = false,
  contentContainerStyle,
  style,
}: CardGridProps) {
  const getItemWidth = () => {
    if (horizontal) return undefined;
    
    const totalSpacing = spacing * (columns + 1);
    const availableWidth = width - totalSpacing;
    return availableWidth / columns;
  };

  const itemWidth = getItemWidth();

  const renderChildren = () => {
    if (horizontal) {
      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
          contentContainerStyle={[
            styles.horizontalContainer,
            { gap: spacing },
            contentContainerStyle,
          ]}
        >
          {children}
        </ScrollView>
      );
    }

    return (
      <View style={[styles.gridContainer, { gap: spacing }, style]}>
        {React.Children.map(children, (child, index) => (
          <View
            key={index}
            style={[
              styles.gridItem,
              { width: itemWidth },
            ]}
          >
            {child}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={style}>
      {renderChildren()}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  gridItem: {
    marginBottom: 16,
  },
  horizontalContainer: {
    paddingHorizontal: 16,
  },
});
