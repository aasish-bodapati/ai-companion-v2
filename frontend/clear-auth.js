// Clear authentication state and force fresh login
console.log('🧹 Clearing authentication state...');

// Clear localStorage
localStorage.removeItem('token');
localStorage.removeItem('user_logged_out');

console.log('✅ Authentication state cleared');
console.log('🔄 Please refresh the page (F5) to see the changes');
