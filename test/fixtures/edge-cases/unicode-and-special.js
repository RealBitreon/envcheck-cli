// File with unicode, special characters, and encoding edge cases

// Standard ASCII
const ascii = process.env.ASCII_VAR;

// Unicode in comments (should not affect parsing)
// 你好世界 - Chinese characters
// مرحبا بالعالم - Arabic
// Привет мир - Russian
const unicode_comment = process.env.UNICODE_COMMENT_VAR;

// Emoji in comments 🚀 🌍 ✨
const emoji_comment = process.env.EMOJI_COMMENT_VAR;

// Very long lines
const very_long_line = process.env.VERY_LONG_VARIABLE_NAME_THAT_EXCEEDS_NORMAL_LENGTH_EXPECTATIONS_AND_KEEPS_GOING_AND_GOING_AND_GOING_AND_GOING;

// Multiple spaces and tabs
const	tabs	=	process.env.TABS_VAR;
const    spaces    =    process.env.SPACES_VAR;

// Windows line endings (CRLF) vs Unix (LF)
const windows = process.env.WINDOWS_VAR;
const unix = process.env.UNIX_VAR;

// Escaped characters in strings
const escaped = "process.env.ESCAPED_VAR";
const backslash = 'process.env.BACKSLASH_VAR';

// Regex patterns that might confuse parser
const regex = /process\.env\.REGEX_VAR/;
const regexTest = /process.env.REGEX_TEST/.test(str);

// Edge case: null bytes (if present)
const nullByte = process.env.NULL_BYTE_VAR;

// Edge case: very deeply nested
const deep = {
  level1: {
    level2: {
      level3: {
        level4: {
          value: process.env.DEEPLY_NESTED_VAR
        }
      }
    }
  }
};

// Edge case: minified-style (no spaces)
const minified=process.env.MINIFIED_VAR||process.env.MINIFIED_FALLBACK||'default';

// Edge case: unusual but valid JavaScript
const unusual = (process.env.UNUSUAL_VAR);
const wrapped = ((process.env.WRAPPED_VAR));
const negated = !process.env.NEGATED_VAR;
const typeof_check = typeof process.env.TYPEOF_VAR;
