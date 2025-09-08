/**
 * Admin Configuration
 * Centralized admin access control
 */

// Admin email addresses that can access admin features
export const ADMIN_EMAILS = [
  'justinmperea@gmail.com', // Primary admin
  // Add other admin emails below:
  // 'teammate@example.com',
  // 'admin@mycompany.com',    // Uncomment and replace with real email
];

/**
 * Check if a user is an admin
 */
export function isAdmin(email?: string | null): boolean {
  // Allow all users in development mode
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // Check admin email list in production
  return email ? ADMIN_EMAILS.includes(email) : false;
}

/**
 * Check if a user can access admin features
 */
export function canAccessAdmin(userEmail?: string | null): boolean {
  return isAdmin(userEmail);
}