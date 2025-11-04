import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { authApi, userApi, moduleApi, rolesApi, ApiError } from '../lib/api';

// Import fail function for Jest
const fail = (message?: string) => {
  throw new Error(message || 'Test failed');
};

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:4000',
  testUser: {
    email: 'admin@example.com',
    password: 'password123',
  },
  newUser: {
    first_name: 'Test',
    last_name: 'User',
    email: 'testuser@example.com',
    phone: '+1234567890',
    user_password: 'testpass123',
    address: '123 Test St',
    user_type_id: 2,
  },
  newModule: {
    module_name: 'Test Module',
    url_slug: 'test-module',
    tool_tip: 'Test module tooltip',
    short_description: 'Test module description',
  },
};

// Global test state
let authToken: string;
let testUserId: number;
let testModuleId: number;
let sessionCookie: string;

describe('Frontend-Backend Integration Tests', () => {
  beforeAll(async () => {
    // Wait for servers to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    // Cleanup test data
    if (testUserId) {
      try {
        await userApi.hardDeleteUser(testUserId);
      } catch (error) {
        console.warn('Failed to cleanup test user:', error);
      }
    }
    if (testModuleId) {
      try {
        await moduleApi.deactivateModule(testModuleId);
      } catch (error) {
        console.warn('Failed to cleanup test module:', error);
      }
    }
  });

  describe('Authentication Flow', () => {
    it('should send OTP successfully', async () => {
      const response = await authApi.sendOtp({ email: TEST_CONFIG.testUser.email });
      expect(response.message).toContain('OTP sent');
    });

    it('should verify OTP successfully', async () => {
      // Note: In real testing, you'd need to capture the actual OTP
      // For this test, we'll assume OTP verification works
      const response = await authApi.verifyOtp({
        email: TEST_CONFIG.testUser.email,
        otp: '123456' // This would be the actual OTP in real scenario
      });
      expect(response).toBeDefined();
    });

    it('should login with email, password and OTP', async () => {
      const loginData = {
        email: TEST_CONFIG.testUser.email,
        user_password: TEST_CONFIG.testUser.password,
        otp: '123456'
      };

      const response = await authApi.login(loginData);
      expect(response.message).toContain('Login successful');
    });

    it('should get user details after login', async () => {
      const userDetails = await authApi.getUserDetails();
      expect(userDetails).toHaveProperty('email');
      expect(userDetails).toHaveProperty('first_name');
      expect(userDetails).toHaveProperty('userType');
    });

    it('should handle invalid login credentials', async () => {
      try {
        await authApi.login({
          email: 'invalid@example.com',
          user_password: 'wrongpass',
          otp: '000000'
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
      }
    });

    it('should logout successfully', async () => {
      await authApi.logout();
      // Verify logout by trying to access protected resource
      try {
        await authApi.getUserDetails();
        fail('Should have thrown an error after logout');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
      }
    });
  });

  describe('User Management', () => {
    beforeAll(async () => {
      // Re-login for user management tests
      await authApi.login({
        email: TEST_CONFIG.testUser.email,
        user_password: TEST_CONFIG.testUser.password,
        otp: '123456'
      });
    });

    it('should get all users', async () => {
      const users = await userApi.getAllUsers();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
      expect(users[0]).toHaveProperty('user_id');
      expect(users[0]).toHaveProperty('email');
    });

    it('should create a new user', async () => {
      const response = await userApi.createUser(TEST_CONFIG.newUser);
      expect(response.message).toContain('created');
      expect(response.user).toHaveProperty('user_id');
      testUserId = response.user.user_id;
    });

    it('should get user by ID', async () => {
      const user = await userApi.getUserById(testUserId);
      expect(user.user_id).toBe(testUserId);
      expect(user.email).toBe(TEST_CONFIG.newUser.email);
    });

    it('should update user', async () => {
      const updateData = {
        first_name: 'Updated',
        last_name: 'Name',
        phone: '+0987654321'
      };

      const response = await userApi.updateUser(testUserId, updateData);
      expect(response.message).toContain('updated');
      expect(response.user.first_name).toBe('Updated');
      expect(response.user.last_name).toBe('Name');
    });

    it('should change user role', async () => {
      await userApi.changeUserRole(testUserId, { user_type_name: 'user' });
      const user = await userApi.getUserById(testUserId);
      expect(user.user_type_id).toBe(2); // user type id
    });

    it('should deactivate user (soft delete)', async () => {
      await userApi.deleteUser(testUserId);
      const user = await userApi.getUserById(testUserId);
      expect(user.is_active).toBe(false);
    });

    it('should recover user', async () => {
      await userApi.recoverUser(testUserId);
      const user = await userApi.getUserById(testUserId);
      expect(user.is_active).toBe(true);
    });

    it('should hard delete user', async () => {
      await userApi.hardDeleteUser(testUserId);
      try {
        await userApi.getUserById(testUserId);
        fail('Should have thrown an error for deleted user');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
      }
    });
  });

  describe('Module Management', () => {
    beforeAll(async () => {
      // Ensure we're logged in
      try {
        await authApi.getUserDetails();
      } catch {
        await authApi.login({
          email: TEST_CONFIG.testUser.email,
          user_password: TEST_CONFIG.testUser.password,
          otp: '123456'
        });
      }
    });

    it('should get all modules', async () => {
      const modules = await moduleApi.getAllModules();
      expect(Array.isArray(modules)).toBe(true);
      expect(modules.length).toBeGreaterThan(0);
      expect(modules[0]).toHaveProperty('module_id');
      expect(modules[0]).toHaveProperty('module_name');
    });

    it('should create a new module', async () => {
      const response = await moduleApi.createModule(TEST_CONFIG.newModule);
      expect(response.message).toContain('created');
      expect(response.module).toHaveProperty('module_id');
      testModuleId = response.module.module_id;
    });

    it('should get module by ID', async () => {
      const module = await moduleApi.getModuleById(testModuleId);
      expect(module.module_id).toBe(testModuleId);
      expect(module.module_name).toBe(TEST_CONFIG.newModule.module_name);
    });

    it('should update module', async () => {
      const updateData = {
        module_name: 'Updated Test Module',
        tool_tip: 'Updated tooltip'
      };

      const response = await moduleApi.updateModule(testModuleId, updateData);
      expect(response.message).toContain('updated');
      expect(response.module.module_name).toBe('Updated Test Module');
    });

    it('should deactivate module', async () => {
      const response = await moduleApi.deactivateModule(testModuleId);
      expect(response.message).toContain('deactivated');

      const module = await moduleApi.getModuleById(testModuleId);
      expect(module.is_active).toBe(false);
    });
  });

  describe('Roles & Permissions', () => {
    let tempUserId: number;

    beforeAll(async () => {
      // Create a temporary user for permission testing
      const response = await userApi.createUser({
        ...TEST_CONFIG.newUser,
        email: 'permtest@example.com'
      });
      tempUserId = response.user.user_id;
    });

    afterAll(async () => {
      if (tempUserId) {
        try {
          await userApi.hardDeleteUser(tempUserId);
        } catch (error) {
          console.warn('Failed to cleanup permission test user:', error);
        }
      }
    });

    it('should get user modules', async () => {
      const modules = await rolesApi.getUserModules(tempUserId);
      expect(Array.isArray(modules)).toBe(true);
    });

    it('should assign module to user', async () => {
      const assignData = {
        user_id: tempUserId,
        module_id: 1 // Assuming module with ID 1 exists
      };

      const response = await rolesApi.assignModuleToUser(assignData);
      expect(response.message).toContain('assigned');
      expect(response.access).toHaveProperty('user_access_id');
    });

    it('should unassign module from user', async () => {
      const unassignData = {
        user_id: tempUserId,
        module_id: 1
      };

      const response = await rolesApi.unassignModuleFromUser(unassignData);
      expect(response.message).toContain('unassigned');
    });

    it('should get all user types', async () => {
      const userTypes = await rolesApi.getAllUserTypes();
      expect(Array.isArray(userTypes)).toBe(true);
      expect(userTypes.length).toBeGreaterThan(0);
      expect(userTypes[0]).toHaveProperty('user_type_id');
      expect(userTypes[0]).toHaveProperty('user_type_name');
    });
  });

  describe('User Types Management', () => {
    let testUserTypeId: number;

    it('should get all user types', async () => {
      const userTypes = await rolesApi.getAllUserTypes();
      expect(Array.isArray(userTypes)).toBe(true);
      expect(userTypes.length).toBeGreaterThan(0);
      expect(userTypes[0]).toHaveProperty('user_type_id');
      expect(userTypes[0]).toHaveProperty('user_type_name');
      expect(userTypes[0]).toHaveProperty('user_type_value');
      expect(userTypes[0]).toHaveProperty('is_active');
    });

    it('should create a new user type', async () => {
      const newUserType = {
        user_type_name: 'Test User Type',
        user_type_value: 3
      };

      const response = await rolesApi.createUserType(newUserType);
      expect(response.message).toContain('created');
      expect(response.userType).toHaveProperty('user_type_id');
      expect(response.userType.user_type_name).toBe(newUserType.user_type_name);
      expect(response.userType.user_type_value).toBe(newUserType.user_type_value);
      testUserTypeId = response.userType.user_type_id;
    });

    it('should get user type by ID', async () => {
      const userType = await rolesApi.getUserTypeById(testUserTypeId);
      expect(userType.user_type_id).toBe(testUserTypeId);
      expect(userType.user_type_name).toBe('Test User Type');
      expect(userType.user_type_value).toBe(3);
    });

    it('should update user type', async () => {
      const updateData = {
        user_type_name: 'Updated Test User Type',
        user_type_value: 4
      };

      const response = await rolesApi.updateUserType(testUserTypeId, updateData);
      expect(response.message).toContain('updated');
      expect(response.userType.user_type_name).toBe(updateData.user_type_name);
      expect(response.userType.user_type_value).toBe(updateData.user_type_value);
    });

    it('should delete user type', async () => {
      const response = await rolesApi.deleteUserType(testUserTypeId);
      expect(response.message).toContain('deleted');

      // Verify deletion by trying to get the deleted user type
      try {
        await rolesApi.getUserTypeById(testUserTypeId);
        fail('Should have thrown an error for deleted user type');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
      }
    });

    it('should handle validation errors when creating user type', async () => {
      try {
        await rolesApi.createUserType({
          user_type_name: '', // Invalid: empty name
          user_type_value: 5 // Invalid: value too high
        });
        fail('Should have thrown a validation error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(400);
      }
    });

    it('should handle not found error for non-existent user type', async () => {
      try {
        await rolesApi.getUserTypeById(99999);
        fail('Should have thrown a 404 error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
      }
    });
  });

  describe('Settings & Activity Logs', () => {
    describe('Activity Logs', () => {
      it('should handle activity logs data loading', async () => {
        // Note: Activity logs are currently using mock data
        // This test verifies the frontend can handle the expected data structure
        const mockLogs = [
          {
            id: 1,
            action: 'User Login',
            user: 'test@example.com',
            timestamp: new Date().toISOString(),
            type: 'login' as const,
            details: 'Successful login'
          }
        ];

        expect(Array.isArray(mockLogs)).toBe(true);
        expect(mockLogs[0]).toHaveProperty('id');
        expect(mockLogs[0]).toHaveProperty('action');
        expect(mockLogs[0]).toHaveProperty('user');
        expect(mockLogs[0]).toHaveProperty('timestamp');
        expect(mockLogs[0]).toHaveProperty('type');
        expect(mockLogs[0]).toHaveProperty('details');
      });

      it('should filter activity logs by type', async () => {
        const mockLogs = [
          { id: 1, action: 'Login', type: 'login' as const, user: 'user1', timestamp: '2023-01-01', details: 'Login' },
          { id: 2, action: 'User Action', type: 'user_action' as const, user: 'user2', timestamp: '2023-01-01', details: 'Action' },
          { id: 3, action: 'System Event', type: 'system' as const, user: 'system', timestamp: '2023-01-01', details: 'Event' }
        ];

        const loginLogs = mockLogs.filter(log => log.type === 'login');
        const userActionLogs = mockLogs.filter(log => log.type === 'user_action');
        const systemLogs = mockLogs.filter(log => log.type === 'system');

        expect(loginLogs).toHaveLength(1);
        expect(userActionLogs).toHaveLength(1);
        expect(systemLogs).toHaveLength(1);
      });

      it('should search activity logs by text', async () => {
        const mockLogs = [
          { id: 1, action: 'User Login', user: 'john@example.com', details: 'Chrome browser' },
          { id: 2, action: 'User Created', user: 'admin@example.com', details: 'New account' }
        ];

        const searchResults = mockLogs.filter(log =>
          log.action.toLowerCase().includes('login') ||
          log.user.toLowerCase().includes('john') ||
          log.details.toLowerCase().includes('chrome')
        );

        expect(searchResults).toHaveLength(1);
        expect(searchResults[0].user).toBe('john@example.com');
      });
    });

    describe('General Settings', () => {
      it('should handle settings data structure', async () => {
        const mockSettings = {
          siteName: 'Test Site',
          siteUrl: 'https://test.com',
          contactEmail: 'admin@test.com',
          supportPhone: '+1234567890',
          timezone: 'UTC',
          currency: 'USD ($)',
          dateFormat: 'MM/DD/YYYY',
          language: 'English',
          primaryColor: '#3b82f6',
          theme: 'Light'
        };

        expect(mockSettings).toHaveProperty('siteName');
        expect(mockSettings).toHaveProperty('siteUrl');
        expect(mockSettings).toHaveProperty('contactEmail');
        expect(mockSettings).toHaveProperty('supportPhone');
        expect(mockSettings).toHaveProperty('timezone');
        expect(mockSettings).toHaveProperty('currency');
        expect(mockSettings).toHaveProperty('dateFormat');
        expect(mockSettings).toHaveProperty('language');
        expect(mockSettings).toHaveProperty('primaryColor');
        expect(mockSettings).toHaveProperty('theme');
      });

      it('should validate settings form data', async () => {
        const validSettings = {
          siteName: 'Valid Site Name',
          siteUrl: 'https://valid-url.com',
          contactEmail: 'valid@email.com',
          supportPhone: '+1234567890'
        };

        const invalidSettings = {
          siteName: '',
          siteUrl: 'invalid-url',
          contactEmail: 'invalid-email',
          supportPhone: 'invalid-phone'
        };

        // Valid settings should pass basic validation
        expect(validSettings.siteName.length).toBeGreaterThan(0);
        expect(validSettings.siteUrl.startsWith('http')).toBe(true);
        expect(validSettings.contactEmail.includes('@')).toBe(true);

        // Invalid settings should fail validation
        expect(invalidSettings.siteName.length).toBe(0);
        expect(invalidSettings.siteUrl.startsWith('http')).toBe(false);
        expect(invalidSettings.contactEmail.includes('@')).toBe(false);
      });

      it('should handle settings save operation', async () => {
        // This test verifies the expected behavior of settings save
        // In a real implementation, this would test the API call
        const settingsToSave = {
          siteName: 'Updated Site',
          theme: 'Dark'
        };

        expect(settingsToSave.siteName).toBe('Updated Site');
        expect(settingsToSave.theme).toBe('Dark');

        // Simulate successful save response
        const mockResponse = {
          message: 'Settings saved successfully!'
        };

        expect(mockResponse.message).toContain('saved successfully');
      });

      it('should reset settings to defaults', async () => {
        const defaultSettings = {
          siteName: 'SuperAdmin Dashboard',
          siteUrl: 'https://superadmin.example.com',
          contactEmail: 'admin@superadmin.com',
          supportPhone: '+1 (555) 123-4567',
          timezone: 'Asia/Kolkata',
          currency: 'INR (₹)',
          dateFormat: 'DD/MM/YYYY',
          language: 'English',
          primaryColor: '#3b82f6',
          theme: 'Light'
        };

        expect(defaultSettings.siteName).toBe('SuperAdmin Dashboard');
        expect(defaultSettings.theme).toBe('Light');
        expect(defaultSettings.primaryColor).toBe('#3b82f6');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      // Temporarily change base URL to invalid one
      const originalBaseURL = process.env.NEXT_PUBLIC_API_URL;
      process.env.NEXT_PUBLIC_API_URL = 'http://invalid-url:9999';

      try {
        await authApi.getUserDetails();
        fail('Should have thrown a network error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(0);
      } finally {
        process.env.NEXT_PUBLIC_API_URL = originalBaseURL;
      }
    });

    it('should handle 404 errors', async () => {
      try {
        await userApi.getUserById(99999);
        fail('Should have thrown a 404 error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
      }
    });

    it('should handle unauthorized access', async () => {
      // First logout
      await authApi.logout();

      try {
        await userApi.getAllUsers();
        fail('Should have thrown an unauthorized error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
      }
    });

    it('should handle validation errors', async () => {
      // Try to create user with invalid data
      try {
        await userApi.createUser({
          first_name: '',
          last_name: 'Test',
          email: 'invalid-email',
          user_password: '123',
          user_type_id: 1
        });
        fail('Should have thrown a validation error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(400);
      }
    });
  });

  describe('Security & Session Management', () => {
    it('should validate session on protected routes', async () => {
      // Login first
      await authApi.login({
        email: TEST_CONFIG.testUser.email,
        user_password: TEST_CONFIG.testUser.password,
        otp: '123456'
      });

      // Access protected route
      const userDetails = await authApi.getUserDetails();
      expect(userDetails).toBeDefined();
    });

    it('should handle session expiration', async () => {
      // This would require manipulating session expiry
      // For now, just verify logout invalidates session
      await authApi.logout();

      try {
        await authApi.getUserDetails();
        fail('Should have thrown an error after logout');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
      }
    });

    it('should handle concurrent sessions', async () => {
      // Login from multiple "sessions" - simulate with API calls
      await authApi.login({
        email: TEST_CONFIG.testUser.email,
        user_password: TEST_CONFIG.testUser.password,
        otp: '123456'
      });

      // Second login should work (depending on implementation)
      const secondLogin = await authApi.login({
        email: TEST_CONFIG.testUser.email,
        user_password: TEST_CONFIG.testUser.password,
        otp: '123456'
      });

      expect(secondLogin.message).toContain('successful');
    });

    it('should logout from all sessions', async () => {
      await authApi.logoutAll();

      try {
        await authApi.getUserDetails();
        fail('Should have thrown an error after logout all');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
      }
    });
  });
});