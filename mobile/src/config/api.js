// API Configuration
// For mobile testing: Replace localhost with your computer's IP address
// Find your IP: Run 'ipconfig' on Windows or 'ifconfig' on Mac/Linux
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://10.0.2.2:5000/api/v1'  // Android Emulator (use your computer's IP for real device)
    : 'https://api.workix.com/api/v1', // Production
  
  TIMEOUT: 30000, // 30 seconds
  
  ENDPOINTS: {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
    CHANGE_PASSWORD: '/auth/change-password',
    
    // Work Orders
    WORK_ORDERS: '/work-orders',
    WORK_ORDER_ACTIVITIES: (id) => `/work-orders/${id}/activities`,
    
    // AI
    AI_ENHANCE: '/ai/enhance-text',
    AI_BATCH_ENHANCE: '/ai/batch-enhance',
    
    // Assets
    ASSETS: '/assets',
    
    // Sites
    SITES: '/sites',
    
    // PPM
    PPM_SCHEDULES: '/ppm/schedules',
    PPM_PLANS: '/ppm/plans',
    
    // Users
    USERS: '/users',
  },
  
  // Cache durations (in seconds)
  CACHE_DURATION: {
    WORK_ORDERS: 300, // 5 minutes
    ASSETS: 3600, // 1 hour
    SITES: 3600, // 1 hour
    USER_PROFILE: 3600, // 1 hour
  },
};

export default API_CONFIG;

