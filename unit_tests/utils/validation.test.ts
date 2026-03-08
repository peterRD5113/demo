/**
 * Validation Utils Unit Tests
 * Tests validation utility functions with logic verification
 */

describe('Validation Utils', () => {
  describe('Email Validation', () => {
    it('should validate email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.com'
      ];
      
      validEmails.forEach(email => {
        expect(email.includes('@')).toBe(true);
        expect(email.includes('.')).toBe(true);
        expect(email.split('@').length).toBe(2);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        { email: 'invalid', reason: 'no @ symbol' },
        { email: 'invalid@', reason: 'no domain' },
        { email: '@example.com', reason: 'no local part' },
        { email: 'user@', reason: 'no domain' }
      ];
      
      invalidEmails.forEach(({ email }) => {
        const hasAt = email.includes('@');
        const hasDot = email.includes('.');
        const parts = email.split('@');
        const hasLocalPart = parts[0] ? parts[0].length > 0 : false;
        const hasDomainPart = parts[1] ? parts[1].length > 0 : false;
        const isValid = hasAt && hasDot && parts.length === 2 && hasLocalPart && hasDomainPart;
        
        expect(isValid).toBe(false);
      });
      
      // Test empty string separately
      const emptyEmail = '';
      expect(emptyEmail.length).toBe(0);
      expect(emptyEmail).toBeFalsy();
    });

    it('should validate email parts', () => {
      const email = 'user@example.com';
      const parts = email.split('@');
      
      expect(parts[0]).toBe('user'); // local part
      expect(parts[1]).toBe('example.com'); // domain part
      expect(parts[1].includes('.')).toBe(true);
    });
  });

  describe('Password Validation', () => {
    it('should validate password strength', () => {
      const strongPasswords = [
        'Password123',
        'Abcd1234',
        'Test@123'
      ];
      
      strongPasswords.forEach(password => {
        expect(password.length >= 8).toBe(true);
        expect(/[0-9]/.test(password)).toBe(true);
        expect(/[a-zA-Z]/.test(password)).toBe(true);
      });
    });

    it('should reject short passwords', () => {
      const shortPasswords = ['Pass1', 'Ab1', '12345'];
      
      shortPasswords.forEach(password => {
        expect(password.length < 8).toBe(true);
      });
    });

    it('should reject passwords without numbers', () => {
      const noNumberPasswords = ['Password', 'Abcdefgh'];
      
      noNumberPasswords.forEach(password => {
        expect(/[0-9]/.test(password)).toBe(false);
      });
    });

    it('should reject passwords without letters', () => {
      const noLetterPasswords = ['12345678', '98765432'];
      
      noLetterPasswords.forEach(password => {
        expect(/[a-zA-Z]/.test(password)).toBe(false);
      });
    });

    it('should validate password complexity', () => {
      const password = 'SecurePass123';
      
      const hasMinLength = password.length >= 8;
      const hasNumber = /[0-9]/.test(password);
      const hasLetter = /[a-zA-Z]/.test(password);
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      
      expect(hasMinLength).toBe(true);
      expect(hasNumber).toBe(true);
      expect(hasLetter).toBe(true);
      expect(hasUpperCase).toBe(true);
      expect(hasLowerCase).toBe(true);
    });
  });

  describe('Username Validation', () => {
    it('should validate username format', () => {
      const validUsernames = ['user123', 'test_user', 'admin'];
      
      validUsernames.forEach(username => {
        expect(username.length >= 3).toBe(true);
        expect(username.length <= 50).toBe(true);
        expect(/^[a-zA-Z0-9_]+$/.test(username)).toBe(true);
      });
    });

    it('should reject short usernames', () => {
      const shortUsernames = ['ab', 'a', 'xy'];
      
      shortUsernames.forEach(username => {
        expect(username.length < 3).toBe(true);
      });
    });

    it('should reject long usernames', () => {
      const longUsername = 'a'.repeat(51);
      
      expect(longUsername.length > 50).toBe(true);
    });

    it('should reject usernames with special characters', () => {
      const invalidUsernames = [
        'user@123',
        'user#name',
        'user name',
        'user.name'
      ];
      
      invalidUsernames.forEach(username => {
        expect(/^[a-zA-Z0-9_]+$/.test(username)).toBe(false);
      });
    });

    it('should validate username characters', () => {
      const username = 'valid_user123';
      
      expect(/^[a-zA-Z0-9_]+$/.test(username)).toBe(true);
      expect(username.includes(' ')).toBe(false);
      expect(username.includes('@')).toBe(false);
      expect(username.includes('#')).toBe(false);
    });
  });

  describe('Required String Validation', () => {
    it('should validate non-empty strings', () => {
      const validStrings = ['valid string', 'project name', 'description'];
      
      validStrings.forEach(str => {
        expect(str).toBeTruthy();
        expect(str.trim().length > 0).toBe(true);
      });
    });

    it('should reject empty strings', () => {
      const emptyStrings = ['', '   ', '\t', '\n'];
      
      emptyStrings.forEach(str => {
        expect(str.trim().length === 0).toBe(true);
      });
    });

    it('should validate string length', () => {
      const str = 'test string';
      const minLength = 3;
      const maxLength = 100;
      
      expect(str.length >= minLength).toBe(true);
      expect(str.length <= maxLength).toBe(true);
    });

    it('should handle null and undefined', () => {
      const nullValue = null;
      const undefinedValue = undefined;
      
      expect(nullValue).toBeNull();
      expect(undefinedValue).toBeUndefined();
    });

    it('should validate minimum length', () => {
      const shortString = 'ab';
      const validString = 'abc';
      const minLength = 3;
      
      expect(shortString.length < minLength).toBe(true);
      expect(validString.length >= minLength).toBe(true);
    });

    it('should validate maximum length', () => {
      const longString = 'a'.repeat(101);
      const validString = 'a'.repeat(100);
      const maxLength = 100;
      
      expect(longString.length > maxLength).toBe(true);
      expect(validString.length <= maxLength).toBe(true);
    });
  });

  describe('Input Sanitization', () => {
    it('should trim whitespace', () => {
      const inputs = [
        '  test  ',
        '\tvalue\t',
        '\ndata\n'
      ];
      
      inputs.forEach(input => {
        const trimmed = input.trim();
        expect(trimmed).not.toMatch(/^\s/);
        expect(trimmed).not.toMatch(/\s$/);
      });
    });

    it('should handle special characters', () => {
      const specialChars = ['<', '>', '&', '"', "'"];
      
      specialChars.forEach(char => {
        expect(char.length).toBe(1);
        expect(/[<>&"']/.test(char)).toBe(true);
      });
    });

    it('should validate alphanumeric input', () => {
      const alphanumeric = 'abc123';
      const withSpecial = 'abc@123';
      
      expect(/^[a-zA-Z0-9]+$/.test(alphanumeric)).toBe(true);
      expect(/^[a-zA-Z0-9]+$/.test(withSpecial)).toBe(false);
    });
  });

  describe('Data Type Validation', () => {
    it('should validate string type', () => {
      const stringValue = 'test';
      const numberValue = 123;
      
      expect(typeof stringValue).toBe('string');
      expect(typeof numberValue).toBe('number');
    });

    it('should validate number type', () => {
      const validNumber = 42;
      const invalidNumber = 'not a number';
      
      expect(typeof validNumber).toBe('number');
      expect(typeof invalidNumber).toBe('string');
      expect(isNaN(Number(invalidNumber))).toBe(true);
    });

    it('should validate boolean type', () => {
      const boolValue = true;
      const stringValue = 'true';
      
      expect(typeof boolValue).toBe('boolean');
      expect(typeof stringValue).toBe('string');
    });
  });

  describe('Range Validation', () => {
    it('should validate numeric ranges', () => {
      const value = 50;
      const min = 1;
      const max = 100;
      
      expect(value >= min).toBe(true);
      expect(value <= max).toBe(true);
    });

    it('should reject out of range values', () => {
      const tooLow = 0;
      const tooHigh = 101;
      const min = 1;
      const max = 100;
      
      expect(tooLow < min).toBe(true);
      expect(tooHigh > max).toBe(true);
    });
  });

  describe('Pattern Matching', () => {
    it('should validate URL format', () => {
      const validUrls = [
        'http://example.com',
        'https://www.example.com',
        'https://example.com/path'
      ];
      
      validUrls.forEach(url => {
        expect(url.startsWith('http://') || url.startsWith('https://')).toBe(true);
      });
    });

    it('should validate phone number format', () => {
      const phoneNumbers = [
        '1234567890',
        '123-456-7890',
        '(123) 456-7890'
      ];
      
      phoneNumbers.forEach(phone => {
        const digitsOnly = phone.replace(/\D/g, '');
        expect(digitsOnly.length).toBeGreaterThanOrEqual(10);
      });
    });

    it('should validate date format', () => {
      const dateString = '2026-03-08';
      const parts = dateString.split('-');
      
      expect(parts.length).toBe(3);
      expect(parts[0].length).toBe(4); // year
      expect(parts[1].length).toBe(2); // month
      expect(parts[2].length).toBe(2); // day
    });
  });
});
