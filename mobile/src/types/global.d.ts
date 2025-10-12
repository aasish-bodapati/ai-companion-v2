// Global type declarations for React Native/Expo project

declare module '*.png' {
  const value: any;
  export default value;
}

declare module '*.jpg' {
  const value: any;
  export default value;
}

declare module '*.jpeg' {
  const value: any;
  export default value;
}

declare module '*.gif' {
  const value: any;
  export default value;
}

declare module '*.svg' {
  const value: any;
  export default value;
}

declare module '*.json' {
  const value: any;
  export default value;
}

// Suppress type errors for packages without type definitions
declare module 'aria-query';
declare module 'babel__core';
declare module 'babel__generator';
declare module 'babel__template';
declare module 'babel__traverse';
declare module 'eslint';
declare module 'eslint-scope';
declare module 'estree';
declare module 'graceful-fs';
declare module 'hammerjs';
declare module 'istanbul-lib-coverage';
declare module 'istanbul-lib-report';
declare module 'istanbul-reports';
declare module 'json-schema';
declare module 'json5';

// Global variables
declare var __DEV__: boolean;
declare var __TEST__: boolean;
