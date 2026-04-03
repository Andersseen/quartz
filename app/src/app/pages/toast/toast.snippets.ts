export const TYPES_SNIPPET = `// Shorthand methods
toastService.success('Operation completed!', 'Success');
toastService.error('Something went wrong!', 'Error');
toastService.warning('Please review your input.', 'Warning');
toastService.info('This is an informational message.', 'Info');`;

export const POSITIONS_SNIPPET = `// Any of 6 positions
toastService.show({
  type: 'info',
  message: 'Positioned toast',
  position: 'top-right', // or 'bottom-center', etc.
});`;

export const DURATION_SNIPPET = `// Custom duration (ms)
toastService.show({
  type: 'info',
  message: 'Quick toast',
  duration: 2000, // 2 seconds
});

// Persistent toast
toastService.show({
  type: 'info',
  message: 'Manual close required',
  duration: 0, // No auto-dismiss
  closable: true,
});`;

export const API_SNIPPET = `// Full options
toastService.show({
  type: 'success',
  title: 'Changes Saved',
  message: 'Your modifications have been saved successfully.',
  position: 'bottom-right',
  duration: 5000,
  closable: true,
});`;
