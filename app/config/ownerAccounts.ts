// Owner accounts configuration
// Add usernames here to grant them premium access without payment
export const OWNER_ACCOUNTS = [
  'admin',        // Replace with your actual username
  'owner',
  'blue_floor_3394',     // Add more owner usernames as needed
];

// Check if a username is an owner account
export const isOwnerAccount = (username: string): boolean => {
  return OWNER_ACCOUNTS.includes(username.toLowerCase());
};
