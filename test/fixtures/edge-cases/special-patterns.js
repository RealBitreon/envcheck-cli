// Edge cases for JavaScript pattern matching

// Standard patterns
const standard = process.env.STANDARD_VAR;
const bracket = process.env['BRACKET_VAR'];

// Nested access
const nested = process.env.NESTED?.VAR;
const optional = process.env?.OPTIONAL_VAR;

// Destructuring
const { DATABASE_URL, API_KEY } = process.env;
const { PORT = 3000 } = process.env;

// Template literals
const url = `${process.env.BASE_URL}/api`;
const connection = `postgres://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}`;

// Conditional access
const config = process.env.NODE_ENV === 'production' ? process.env.PROD_KEY : process.env.DEV_KEY;

// Function calls
const port = parseInt(process.env.PORT);
const enabled = Boolean(process.env.FEATURE_ENABLED);

// Object spread
const envConfig = { ...process.env };

// Array access (should not match)
const arr = ['test'];
const notEnv = arr.env.SHOULD_NOT_MATCH;

// Comments containing env vars (should not match)
// const commented = process.env.COMMENTED_VAR;
/* const multiline = process.env.MULTILINE_VAR; */

// String literals (should not match)
const str = "process.env.STRING_LITERAL";
const template = `process.env.TEMPLATE_LITERAL`;

// Dynamic access (should not match specific var)
const dynamic = process.env[varName];
const computed = process.env[`${prefix}_VAR`];

// Vite/import.meta.env patterns
const viteVar = import.meta.env.VITE_API_URL;
const viteBracket = import.meta.env['VITE_PUBLIC_KEY'];
const viteTemplate = `${import.meta.env.VITE_BASE_URL}/api`;

// Edge case: multiple on same line
const multi = process.env.VAR1 || process.env.VAR2 || process.env.VAR3;

// Edge case: chained access
const chained = process.env.CHAINED_VAR?.toString().toLowerCase();

// Edge case: in function parameters
function getConfig(url = process.env.DEFAULT_URL) {
  return url;
}

// Edge case: in class properties
class Config {
  apiKey = process.env.CLASS_API_KEY;
  static baseUrl = process.env.STATIC_BASE_URL;
}

// Edge case: in arrow functions
const getPort = () => process.env.ARROW_PORT;
const getHost = () => { return process.env.ARROW_HOST; };

// Edge case: in ternary
const value = condition ? process.env.TRUE_VAR : process.env.FALSE_VAR;

// Edge case: in logical operators
const fallback = process.env.PRIMARY || process.env.SECONDARY || 'default';
const check = process.env.CHECK && process.env.VERIFY;

// Edge case: in array/object literals
const config = {
  db: process.env.DB_URL,
  cache: process.env.CACHE_URL,
  ports: [process.env.HTTP_PORT, process.env.HTTPS_PORT]
};
