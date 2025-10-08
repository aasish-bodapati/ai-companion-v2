import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mobileUtils } from '../../utils/haptics';

interface OnboardingStepProps {
  icon?: string;
  image?: string | number;
  title: string;
  subtitle?: string;
  description: string;
  children?: React.ReactNode;
  variant?: 'default' | 'centered' | 'minimal';
  showIcon?: boolean;
  iconColor?: string;
  backgroundColor?: string;
}

const { width: screenWidth } = Dimensions.get('window');

export default function OnboardingStep({
  icon,
  image,
  title,
  subtitle,
  description,
  children,
  variant = 'default',
  showIcon = true,
  iconColor = '#3b82f6',
  backgroundColor = '#ffffff',
}: OnboardingStepProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, slideAnim]);

  const getResponsiveFontSize = (baseSize: number) => {
    return mobileUtils.getResponsiveFontSize(baseSize, screenWidth);
  };


  const renderIcon = () => {
    if (!showIcon || (!icon && !image)) return null;

    if (image) {
      return (
        <Animated.View
          style={[
            styles.imageContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image source={image} style={styles.image} resizeMode="contain" />
        </Animated.View>
      );
    }

    return (
      <Animated.View
        style={[
          styles.iconContainer,
          {
            backgroundColor: `${iconColor}15`,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Ionicons
          name={icon as keyof typeof Ionicons.glyphMap}
          size={getResponsiveFontSize(48)}
          color={iconColor}
        />
      </Animated.View>
    );
  };

  const getContainerStyle = () => {
    const baseStyle = [styles.container, { backgroundColor }];
    
    switch (variant) {
      case 'centered':
        return [...baseStyle, styles.centeredContainer];
      case 'minimal':
        return [...baseStyle, styles.minimalContainer];
      default:
        return baseStyle;
    }
  };

  return (
    <Animated.View
      style={[
        ...getContainerStyle(),
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        {renderIcon()}

        <View style={styles.textContainer}>
          <Text style={[styles.title, { fontSize: getResponsiveFontSize(28) }]}>
            {title}
          </Text>
          
          {subtitle && (
            <Text style={[styles.subtitle, { fontSize: getResponsiveFontSize(18) }]}>
              {subtitle}
            </Text>
          )}
          
          <Text style={[styles.description, { fontSize: getResponsiveFontSize(16) }]}>
            {description}
          </Text>
        </View>

        {children && (
          <View style={styles.childrenContainer}>
            {children}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  centeredContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  minimalContainer: {
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    width: 200,
    height: 200,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 36,
  },
  subtitle: {
    fontWeight: '600',
    color: '#3b82f6',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  description: {
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: screenWidth * 0.85,
  },
  childrenContainer: {
    width: '100%',
    marginTop: 20,
  },
});
