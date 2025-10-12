import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Image,
  View,
  StyleSheet,
  ImageStyle,
  ViewStyle,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { performanceUtils, imageOptimization } from '../../utils/performance';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme/constants';

interface OptimizedImageProps {
  source: { uri: string } | number;
  style?: ImageStyle | ImageStyle[];
  containerStyle?: ViewStyle;
  placeholder?: React.ReactNode;
  errorComponent?: React.ReactNode;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  enableLazyLoading?: boolean;
  enableCaching?: boolean;
  onLoad?: () => void;
  onError?: (error: any) => void;
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

interface ImageCache {
  [key: string]: {
    uri: string;
    timestamp: number;
    size: number;
  };
}

// Simple in-memory cache for images
const imageCache: ImageCache = {};
const CACHE_MAX_SIZE = 50; // Maximum number of cached images
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

const OptimizedImage = React.memo(function OptimizedImage({
  source,
  style,
  containerStyle,
  placeholder,
  errorComponent,
  resizeMode = 'cover',
  quality,
  maxWidth = 300,
  maxHeight = 300,
  enableLazyLoading = true,
  enableCaching = true,
  onLoad,
  onError,
  onPress,
  accessibilityLabel,
  testID,
}: OptimizedImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(!enableLazyLoading);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  
  const imageRef = useRef<Image>(null);
  const intersectionObserver = useRef<any>(null);

  // Generate cache key
  const cacheKey = useMemo(() => {
    if (typeof source === 'number') return `local_${source}`;
    return `remote_${source.uri}`;
  }, [source]);

  // Get optimized dimensions
  const optimizedDimensions = useMemo(() => {
    if (imageDimensions) {
      return imageOptimization.getOptimizedDimensions(
        imageDimensions.width,
        imageDimensions.height,
        maxWidth,
        maxHeight
      );
    }
    return { width: maxWidth, height: maxHeight };
  }, [imageDimensions, maxWidth, maxHeight]);

  // Get image quality
  const imageQuality = useMemo(() => {
    return quality || imageOptimization.getImageQuality();
  }, [quality]);

  // Check if image is cached
  const isCached = useMemo(() => {
    if (!enableCaching || typeof source === 'number') return false;
    const cached = imageCache[cacheKey];
    return cached && (Date.now() - cached.timestamp) < CACHE_EXPIRY;
  }, [cacheKey, enableCaching, source]);

  // Load image from cache or network
  const loadImage = useCallback(async () => {
    if (typeof source === 'number') {
      setImageUri(source.toString());
      setLoading(false);
      return;
    }

    // Check cache first
    if (enableCaching && isCached) {
      const cached = imageCache[cacheKey];
      setImageUri(cached.uri);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(false);

      // In a real implementation, you would:
      // 1. Resize/compress the image
      // 2. Store in cache
      // 3. Return optimized URI
      
      // For now, use the original URI
      const optimizedUri = source.uri;
      
      // Cache the image
      if (enableCaching) {
        imageCache[cacheKey] = {
          uri: optimizedUri,
          timestamp: Date.now(),
          size: 0, // Would be actual size in real implementation
        };
        
        // Clean up old cache entries
        cleanupCache();
      }

      setImageUri(optimizedUri);
      setLoading(false);
      onLoad?.();
    } catch (err) {
      setError(true);
      setLoading(false);
      onError?.(err);
    }
  }, [source, cacheKey, enableCaching, isCached, onLoad, onError]);

  // Clean up cache when it gets too large
  const cleanupCache = useCallback(() => {
    const entries = Object.entries(imageCache);
    if (entries.length > CACHE_MAX_SIZE) {
      // Sort by timestamp and remove oldest entries
      entries
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)
        .slice(0, entries.length - CACHE_MAX_SIZE)
        .forEach(([key]) => delete imageCache[key]);
    }
  }, []);

  // Handle image load
  const handleImageLoad = useCallback((event: any) => {
    const { width, height } = event.nativeEvent.source;
    setImageDimensions({ width, height });
    setLoading(false);
    onLoad?.();
  }, [onLoad]);

  // Handle image error
  const handleImageError = useCallback((error: any) => {
    setError(true);
    setLoading(false);
    onError?.(error);
  }, [onError]);

  // Lazy loading with intersection observer
  useEffect(() => {
    if (!enableLazyLoading || isVisible) {
      loadImage();
      return;
    }

    // In a real implementation, you would use react-native-intersection-observer
    // For now, we'll simulate lazy loading with a timeout
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [enableLazyLoading, isVisible, loadImage]);

  // Retry loading
  const handleRetry = useCallback(() => {
    setError(false);
    loadImage();
  }, [loadImage]);

  // Render placeholder
  const renderPlaceholder = () => {
    if (placeholder) return placeholder;

    return (
      <View style={[styles.placeholder, containerStyle]}>
        <ActivityIndicator size="small" color={COLORS.primary.main} />
        <Text style={styles.placeholderText}>Loading...</Text>
      </View>
    );
  };

  // Render error component
  const renderError = () => {
    if (errorComponent) return errorComponent;

    return (
      <View style={[styles.errorContainer, containerStyle]}>
        <Ionicons name="image-outline" size={32} color={COLORS.text.secondary} />
        <Text style={styles.errorText}>Failed to load image</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Ionicons name="refresh" size={16} color={COLORS.primary.main} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render image
  const renderImage = () => {
    if (loading) return renderPlaceholder();
    if (error) return renderError();
    if (!imageUri) return renderPlaceholder();

    const imageStyle = [
      styles.image,
      {
        width: optimizedDimensions.width,
        height: optimizedDimensions.height,
      },
      style,
    ];

    return (
      <Image
        ref={imageRef}
        source={typeof source === 'number' ? source : { uri: imageUri }}
        style={imageStyle}
        resizeMode={resizeMode}
        onLoad={handleImageLoad}
        onError={handleImageError}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
      />
    );
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        disabled={loading || error}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
      >
        {renderImage()}
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyle} testID={testID}>
      {renderImage()}
    </View>
  );
});

const styles = StyleSheet.create({
  image: {
    backgroundColor: COLORS.background.secondary,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.lg,
  },
  placeholderText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.lg,
  },
  errorText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.primary.light,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  retryText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary.main,
    fontWeight: '500',
  },
});

export default OptimizedImage;
