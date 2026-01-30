/**
 * Tests for BUG-011: Missing Input Sanitization Fix
 *
 * This test suite verifies that the sanitization functions properly:
 * - Strip HTML tags from input (XSS protection)
 * - Validate input length and character restrictions
 * - Escape HTML entities for safe display
 */

import {
  sanitizeName,
  sanitizeDescription,
  sanitizeHtml,
  escapeHtml,
  sanitizeString,
  sanitizeOptionalName,
  sanitizeOptionalDescription,
  SanitizationError,
} from '../utils/sanitization';

describe('BUG-011: Input Sanitization Tests', () => {
  describe('sanitizeHtml()', () => {
    it('should strip all HTML tags from input', () => {
      const input = '<script>alert("XSS")</script>';
      const result = sanitizeHtml(input);
      expect(result).toBe('alert("XSS")');
    });

    it('should handle nested HTML tags', () => {
      const input = '<div><p>Hello <strong>World</strong></p></div>';
      const result = sanitizeHtml(input);
      expect(result).toBe('Hello World');
    });

    it('should return empty string for non-string input', () => {
      expect(sanitizeHtml(123 as any)).toBe('');
      expect(sanitizeHtml(null as any)).toBe('');
      expect(sanitizeHtml(undefined as any)).toBe('');
      expect(sanitizeHtml({} as any)).toBe('');
    });

    it('should handle empty string', () => {
      expect(sanitizeHtml('')).toBe('');
    });
  });

  describe('sanitizeName() - Valid Names', () => {
    it('should accept valid alphanumeric names', () => {
      expect(sanitizeName('Table1')).toBe('Table1');
      expect(sanitizeName('Room123')).toBe('Room123');
      expect(sanitizeName('ABC123')).toBe('ABC123');
    });

    it('should accept names with spaces', () => {
      expect(sanitizeName('Main Room')).toBe('Main Room');
      expect(sanitizeName('  Table 1  ')).toBe('Table 1');
    });

    it('should accept names with hyphens', () => {
      expect(sanitizeName('Room-A')).toBe('Room-A');
      expect(sanitizeName('Table-1-Left')).toBe('Table-1-Left');
    });

    it('should accept names with underscores', () => {
      expect(sanitizeName('Room_1')).toBe('Room_1');
      expect(sanitizeName('Table_A_Main')).toBe('Table_A_Main');
    });

    it('should trim whitespace from names', () => {
      expect(sanitizeName('  Room1  ')).toBe('Room1');
      expect(sanitizeName('\t Table 1 \n')).toBe('Table 1');
    });

    it('should accept names at minimum length (1 char)', () => {
      expect(sanitizeName('A')).toBe('A');
      expect(sanitizeName('1')).toBe('1');
    });

    it('should accept names at maximum length (100 chars)', () => {
      const longName = 'A'.repeat(100);
      expect(sanitizeName(longName)).toBe(longName);
    });
  });

  describe('sanitizeName() - XSS Payloads (HTML Stripping)', () => {
    it('should strip script tags from names and validate result', () => {
      // HTML is stripped, but result contains invalid chars (parentheses, quotes), so error is thrown
      expect(() => sanitizeName('<script>alert("XSS")</script>')).toThrow(SanitizationError);
    });

    it('should strip img onerror attributes resulting in empty name', () => {
      // After stripping HTML, result is empty which fails validation
      expect(() => sanitizeName('<img src=x onerror=alert("XSS")>')).toThrow(SanitizationError);
    });

    it('should strip event handlers', () => {
      expect(sanitizeName('<div onload="alert(1)">Safe</div>')).toBe('Safe');
    });

    it('should strip javascript: protocol', () => {
      expect(sanitizeName('<a href="javascript:alert(1)">Link</a>')).toBe('Link');
    });

    it('should strip svg with script and validate result', () => {
      // HTML stripped but result has invalid chars
      expect(() => sanitizeName('<svg><script>alert("XSS")</script></svg>')).toThrow(SanitizationError);
    });

    it('should strip iframe tags resulting in empty name', () => {
      expect(() => sanitizeName('<iframe src="evil.com"></iframe>')).toThrow(SanitizationError);
    });

    it('should strip link tags resulting in empty name', () => {
      expect(() => sanitizeName('<link rel="stylesheet" href="evil.css">')).toThrow(SanitizationError);
    });

    it('should strip object tags resulting in empty name', () => {
      expect(() => sanitizeName('<object data="evil.swf"></object>')).toThrow(SanitizationError);
    });

    it('should strip embed tags resulting in empty name', () => {
      expect(() => sanitizeName('<embed src="evil.swf">')).toThrow(SanitizationError);
    });

    it('should strip form tags resulting in empty name', () => {
      expect(() => sanitizeName('<form action="evil.com"><input></form>')).toThrow(SanitizationError);
    });

    it('should strip input tags resulting in empty name', () => {
      expect(() => sanitizeName('<input type="text" value="test">')).toThrow(SanitizationError);
    });

    it('should handle mixed content with HTML', () => {
      expect(sanitizeName('Room <b>1</b>')).toBe('Room 1');
      expect(sanitizeName('<div>Table</div> A')).toBe('Table A');
    });

    it('should strip HTML and validate resulting name', () => {
      // After stripping HTML, the result should still pass validation
      expect(sanitizeName('<script>Main</script>-Room')).toBe('Main-Room');
    });
  });

  describe('sanitizeName() - Invalid Characters (Should Throw Error)', () => {
    it('should throw error for special characters', () => {
      expect(() => sanitizeName('Room@Home')).toThrow(SanitizationError);
      expect(() => sanitizeName('Table#1')).toThrow(SanitizationError);
      expect(() => sanitizeName('Room$')).toThrow(SanitizationError);
      expect(() => sanitizeName('Table%')).toThrow(SanitizationError);
      expect(() => sanitizeName('Room^')).toThrow(SanitizationError);
      expect(() => sanitizeName('Table&')).toThrow(SanitizationError);
      expect(() => sanitizeName('Room*')).toThrow(SanitizationError);
      expect(() => sanitizeName('Table()')).toThrow(SanitizationError);
      expect(() => sanitizeName('Room[]')).toThrow(SanitizationError);
      expect(() => sanitizeName('Table{}')).toThrow(SanitizationError);
      expect(() => sanitizeName('Room|')).toThrow(SanitizationError);
      expect(() => sanitizeName('Table\\')).toThrow(SanitizationError);
      expect(() => sanitizeName('Room:')).toThrow(SanitizationError);
      expect(() => sanitizeName('Table;')).toThrow(SanitizationError);
      expect(() => sanitizeName('Room"')).toThrow(SanitizationError);
      expect(() => sanitizeName("Table'")).toThrow(SanitizationError);
      expect(() => sanitizeName('Room<')).toThrow(SanitizationError);
      expect(() => sanitizeName('Table>')).toThrow(SanitizationError);
      expect(() => sanitizeName('Room,')).toThrow(SanitizationError);
      expect(() => sanitizeName('Table.')).toThrow(SanitizationError);
      expect(() => sanitizeName('Room/')).toThrow(SanitizationError);
      expect(() => sanitizeName('Table?')).toThrow(SanitizationError);
      expect(() => sanitizeName('Room!')).toThrow(SanitizationError);
      expect(() => sanitizeName('Table`')).toThrow(SanitizationError);
      expect(() => sanitizeName('Room~')).toThrow(SanitizationError);
    });

    it('should throw error for empty string', () => {
      expect(() => sanitizeName('')).toThrow(SanitizationError);
    });

    it('should throw error for whitespace-only string', () => {
      expect(() => sanitizeName('   ')).toThrow(SanitizationError);
      expect(() => sanitizeName('\t\n')).toThrow(SanitizationError);
    });

    it('should throw error for names exceeding 100 characters', () => {
      const tooLong = 'A'.repeat(101);
      expect(() => sanitizeName(tooLong)).toThrow(SanitizationError);
    });

    it('should throw error for non-string input', () => {
      expect(() => sanitizeName(123 as any)).toThrow(SanitizationError);
      expect(() => sanitizeName(null as any)).toThrow(SanitizationError);
      expect(() => sanitizeName(undefined as any)).toThrow(SanitizationError);
      expect(() => sanitizeName({} as any)).toThrow(SanitizationError);
    });

    it('should throw error with appropriate message for invalid characters', () => {
      try {
        sanitizeName('Room@Home');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(SanitizationError);
        expect((error as SanitizationError).message).toBe(
          'Name can only contain letters, numbers, spaces, hyphens, and underscores'
        );
      }
    });

    it('should throw error with appropriate message for length violations', () => {
      try {
        sanitizeName('');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(SanitizationError);
        expect((error as SanitizationError).message).toBe(
          'Name must be at least 1 character long'
        );
      }

      try {
        sanitizeName('A'.repeat(101));
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(SanitizationError);
        expect((error as SanitizationError).message).toBe(
          'Name must not exceed 100 characters'
        );
      }
    });
  });

  describe('sanitizeDescription() - XSS Payloads', () => {
    it('should strip script tags from descriptions', () => {
      expect(sanitizeDescription('<script>alert("XSS")</script>')).toBe('alert("XSS")');
    });

    it('should strip img onerror attributes', () => {
      expect(sanitizeDescription('<img src=x onerror=alert("XSS")>')).toBe('');
    });

    it('should strip event handlers', () => {
      expect(sanitizeDescription('<div onload="alert(1)">Safe description</div>')).toBe('Safe description');
    });

    it('should strip javascript: protocol', () => {
      expect(sanitizeDescription('<a href="javascript:alert(1)">Click me</a>')).toBe('Click me');
    });

    it('should handle valid descriptions with HTML', () => {
      expect(sanitizeDescription('This is a <b>bold</b> room')).toBe('This is a bold room');
    });

    it('should accept plain text descriptions', () => {
      expect(sanitizeDescription('This is a normal description')).toBe('This is a normal description');
      expect(sanitizeDescription('Description with numbers 123 and symbols - _')).toBe(
        'Description with numbers 123 and symbols - _'
      );
    });

    it('should trim whitespace from descriptions', () => {
      expect(sanitizeDescription('  Description  ')).toBe('Description');
      expect(sanitizeDescription('\t\nDescription\t\n')).toBe('Description');
    });

    it('should accept empty string', () => {
      expect(sanitizeDescription('')).toBe('');
    });

    it('should accept descriptions at maximum length (500 chars)', () => {
      const longDesc = 'A'.repeat(500);
      expect(sanitizeDescription(longDesc)).toBe(longDesc);
    });

    it('should throw error for descriptions exceeding 500 characters', () => {
      const tooLong = 'A'.repeat(501);
      expect(() => sanitizeDescription(tooLong)).toThrow(SanitizationError);
    });

    it('should throw error for non-string input', () => {
      expect(() => sanitizeDescription(123 as any)).toThrow(SanitizationError);
      expect(() => sanitizeDescription(null as any)).toThrow(SanitizationError);
      expect(() => sanitizeDescription(undefined as any)).toThrow(SanitizationError);
    });
  });

  describe('escapeHtml()', () => {
    it('should escape less-than signs', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    });

    it('should escape greater-than signs', () => {
      expect(escapeHtml('>')).toBe('&gt;');
    });

    it('should escape ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape double quotes', () => {
      expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
    });

    it('should escape single quotes', () => {
      expect(escapeHtml("'single'")).toBe('&#x27;single&#x27;');
    });

    it('should escape forward slashes', () => {
      expect(escapeHtml('http://example.com')).toBe('http:&#x2F;&#x2F;example.com');
    });

    it('should escape complex XSS payloads', () => {
      const xssPayload = '<img src="x" onerror="alert(\'XSS\')">';
      const escaped = escapeHtml(xssPayload);
      // Verify all dangerous characters are escaped
      expect(escaped).not.toContain('<');
      expect(escaped).not.toContain('>');
      expect(escaped).not.toContain('"');
      expect(escaped).not.toContain("'");
      // Verify escaped versions are present
      expect(escaped).toContain('&lt;');
      expect(escaped).toContain('&gt;');
      expect(escaped).toContain('&quot;');
      expect(escaped).toContain('&#x27;');
    });

    it('should return empty string for non-string input', () => {
      expect(escapeHtml(123 as any)).toBe('');
      expect(escapeHtml(null as any)).toBe('');
      expect(escapeHtml(undefined as any)).toBe('');
      expect(escapeHtml({} as any)).toBe('');
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should not modify safe strings', () => {
      expect(escapeHtml('Safe string')).toBe('Safe string');
      expect(escapeHtml('Alphanumeric123')).toBe('Alphanumeric123');
    });
  });

  describe('sanitizeString()', () => {
    it('should strip HTML tags', () => {
      expect(sanitizeString('<b>Bold</b>')).toBe('Bold');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  text  ')).toBe('text');
    });

    it('should enforce max length if specified', () => {
      expect(() => sanitizeString('A'.repeat(101), 100)).toThrow(SanitizationError);
    });

    it('should return empty string for non-string input', () => {
      expect(sanitizeString(123 as any)).toBe('');
    });
  });

  describe('sanitizeOptionalName()', () => {
    it('should return null for null input', () => {
      expect(sanitizeOptionalName(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(sanitizeOptionalName(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(sanitizeOptionalName('')).toBeNull();
    });

    it('should return null for whitespace-only string', () => {
      expect(sanitizeOptionalName('   ')).toBeNull();
    });

    it('should sanitize valid name', () => {
      expect(sanitizeOptionalName('Room1')).toBe('Room1');
    });

    it('should throw error for invalid name', () => {
      expect(() => sanitizeOptionalName('Room@')).toThrow(SanitizationError);
    });
  });

  describe('sanitizeOptionalDescription()', () => {
    it('should return null for null input', () => {
      expect(sanitizeOptionalDescription(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(sanitizeOptionalDescription(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(sanitizeOptionalDescription('')).toBeNull();
    });

    it('should sanitize valid description', () => {
      expect(sanitizeOptionalDescription('Description')).toBe('Description');
    });

    it('should throw error for invalid description', () => {
      expect(() => sanitizeOptionalDescription('A'.repeat(501))).toThrow(SanitizationError);
    });
  });

  describe('SanitizationError', () => {
    it('should have correct error name', () => {
      const error = new SanitizationError('Test message');
      expect(error.name).toBe('SanitizationError');
    });

    it('should preserve error message', () => {
      const error = new SanitizationError('Custom message');
      expect(error.message).toBe('Custom message');
    });

    it('should be instanceof Error', () => {
      const error = new SanitizationError('Test');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('Integration: Real-world XSS Scenarios', () => {
    it('should handle common XSS payload patterns', () => {
      const payloads = [
        '<script>alert(String.fromCharCode(88,83,83))</script>',
        '<img src=x onerror="&#0000106&#0000097&#0000118&#0000097&#0000115&#0000099&#0000114&#0000105&#0000112&#0000116&#0000058&#0000097&#0000108&#0000101&#0000114&#0000116&#0000040&#0000039&#0000088&#0000083&#0000083&#0000039&#0000041">',
        '<svg><desc><![CDATA[</desc><script>alert(1)</script>]]></desc></svg>',
        '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4=">Click</a>',
      ];

      payloads.forEach(payload => {
        // After sanitization, the result should be XSS-free (no script tags)
        const sanitized = sanitizeHtml(payload);
        expect(sanitized).not.toContain('<script');
      });
    });

    it('should prevent stored XSS in room/table names (throws error for invalid chars)', () => {
      const maliciousName = '<script>alert("Room XSS")</script>';
      // Sanitizing name with XSS payload throws error because parentheses/quotes are invalid
      expect(() => sanitizeName(maliciousName)).toThrow(SanitizationError);
    });

    it('should prevent stored XSS in descriptions', () => {
      const maliciousDesc = '<img src=x onerror="alert(\'Desc XSS\')">';
      const sanitized = sanitizeDescription(maliciousDesc);
      expect(sanitized).not.toContain('<img');
      expect(sanitized).toBe('');
    });
  });
});
