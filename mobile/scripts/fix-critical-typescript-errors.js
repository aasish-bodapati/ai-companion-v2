const fs = require('fs');
const path = require('path');

// Fix critical TypeScript errors
const fixes = [
  // Fix missing React import in performance.ts
  {
    file: 'src/utils/performance.ts',
    pattern: /import { debounce } from 'lodash';/,
    replacement: "import React from 'react';\nimport { debounce } from 'lodash';"
  },
  
  // Fix missing TextInput import in UnifiedForm.tsx
  {
    file: 'src/components/ui/UnifiedForm.tsx',
    pattern: /import { Text, View, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';/,
    replacement: "import { Text, View, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';"
  },
  
  // Fix missing Text import in UnifiedForm.example.tsx
  {
    file: 'src/components/ui/UnifiedForm.example.tsx',
    pattern: /import { View, StyleSheet, ScrollView, Alert } from 'react-native';/,
    replacement: "import { View, StyleSheet, ScrollView, Alert, Text } from 'react-native';"
  },
  
  // Fix missing Text import in SimpleLoggingItem.tsx
  {
    file: 'src/components/ui/SimpleLoggingItem.tsx',
    pattern: /import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';/,
    replacement: "import { View, StyleSheet, TouchableOpacity, Alert, Text } from 'react-native';"
  },
  
  // Fix missing Text import in SmartInput.tsx
  {
    file: 'src/components/ui/SmartInput.tsx',
    pattern: /import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';/,
    replacement: "import { View, StyleSheet, TouchableOpacity, Alert, Text, TextInput } from 'react-native';"
  },
  
  // Fix missing Text import in SearchInput.tsx
  {
    file: 'src/components/ui/SearchInput.tsx',
    pattern: /import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';/,
    replacement: "import { View, StyleSheet, TouchableOpacity, Alert, Text, TextInput } from 'react-native';"
  },
  
  // Fix missing Text import in ProgressCard.tsx
  {
    file: 'src/components/ui/ProgressCard.tsx',
    pattern: /import { View, StyleSheet, TouchableOpacity } from 'react-native';/,
    replacement: "import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';"
  },
  
  // Fix missing Text import in SearchableList.tsx
  {
    file: 'src/components/ui/SearchableList.tsx',
    pattern: /import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';/,
    replacement: "import { View, StyleSheet, TouchableOpacity, Alert, Text, TextInput } from 'react-native';"
  },
  
  // Fix missing Text import in Toast.tsx
  {
    file: 'src/components/ui/Toast.tsx',
    pattern: /import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';/,
    replacement: "import { View, StyleSheet, TouchableOpacity, Alert, Text } from 'react-native';"
  },
  
  // Fix missing Text import in UnifiedCard.tsx
  {
    file: 'src/components/ui/UnifiedCard.tsx',
    pattern: /import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';/,
    replacement: "import { View, StyleSheet, TouchableOpacity, Alert, Text } from 'react-native';"
  },
  
  // Fix missing Text import in MobileOptimizedCard.tsx
  {
    file: 'src/components/ui/MobileOptimizedCard.tsx',
    pattern: /import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';/,
    replacement: "import { View, StyleSheet, TouchableOpacity, Alert, Text } from 'react-native';"
  },
  
  // Fix missing Text import in OptimizedImage.tsx
  {
    file: 'src/components/ui/OptimizedImage.tsx',
    pattern: /import { Image, View, StyleSheet, ImageStyle, ViewStyle, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';/,
    replacement: "import { Image, View, StyleSheet, ImageStyle, ViewStyle, ActivityIndicator, TouchableOpacity, Dimensions, Text } from 'react-native';"
  },
  
  // Fix missing Text import in VirtualizedList.tsx
  {
    file: 'src/components/ui/VirtualizedList.tsx',
    pattern: /import { FlatList, View, StyleSheet, Dimensions, ListRenderItem, FlatListProps, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';/,
    replacement: "import { FlatList, View, StyleSheet, Dimensions, ListRenderItem, FlatListProps, NativeScrollEvent, NativeSyntheticEvent, Text } from 'react-native';"
  },
  
  // Fix missing Text import in ErrorBoundary.tsx
  {
    file: 'src/components/ErrorBoundary.tsx',
    pattern: /import { View, StyleSheet, Pressable, ScrollView } from 'react-native';/,
    replacement: "import { View, StyleSheet, Pressable, ScrollView, Text } from 'react-native';"
  }
];

// Apply fixes
let fixedCount = 0;
fixes.forEach(fix => {
  const filePath = path.join('src', fix.file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (fix.pattern.test(content)) {
      const updatedContent = content.replace(fix.pattern, fix.replacement);
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`Fixed: ${fix.file}`);
      fixedCount++;
    }
  }
});

console.log(`Fixed ${fixedCount} files`);
