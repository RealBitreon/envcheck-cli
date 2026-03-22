#!/usr/bin/env python3
"""Edge cases for Python pattern matching"""

import os
from os import environ, getenv

# Standard patterns
standard = os.environ['STANDARD_VAR']
get_method = os.getenv('GET_VAR')
environ_direct = environ['ENVIRON_VAR']
getenv_direct = getenv('GETENV_VAR')

# With defaults
with_default = os.getenv('WITH_DEFAULT', 'default_value')
with_none = os.getenv('WITH_NONE', None)
with_int = int(os.getenv('WITH_INT', '0'))

# Dictionary access
dict_access = os.environ.get('DICT_ACCESS')
dict_bracket = os.environ['DICT_BRACKET']

# In f-strings
url = f"{os.environ['BASE_URL']}/api"
connection = f"postgres://{os.getenv('DB_USER')}:{os.getenv('DB_PASS')}@{os.getenv('DB_HOST')}"

# In conditionals
if os.environ.get('FEATURE_ENABLED'):
    config = os.environ['PROD_CONFIG']
else:
    config = os.getenv('DEV_CONFIG', 'default')

# In function calls
port = int(os.getenv('PORT', '3000'))
enabled = bool(os.environ.get('ENABLED', False))

# In list/dict comprehensions
env_vars = {k: v for k, v in os.environ.items() if k.startswith('APP_')}

# Comments (should not match)
# standard_commented = os.environ['COMMENTED_VAR']
"""
multiline_commented = os.getenv('MULTILINE_VAR')
"""

# String literals (should not match)
string_literal = "os.environ['STRING_LITERAL']"
template = f"os.getenv('TEMPLATE_LITERAL')"

# Dynamic access (should not match specific var)
dynamic = os.environ[var_name]
computed = os.getenv(f"{prefix}_VAR")

# Multiple on same line
multi = os.getenv('VAR1') or os.getenv('VAR2') or os.getenv('VAR3')

# In function parameters
def get_config(url=os.getenv('DEFAULT_URL')):
    return url

# In class attributes
class Config:
    api_key = os.environ.get('CLASS_API_KEY')
    base_url = os.getenv('CLASS_BASE_URL')
    
    def __init__(self):
        self.db_url = os.environ['INIT_DB_URL']
        self.cache_url = os.getenv('INIT_CACHE_URL')

# In lambda functions
get_port = lambda: os.getenv('LAMBDA_PORT')
get_host = lambda: os.environ.get('LAMBDA_HOST', 'localhost')

# In ternary expressions
value = os.getenv('TRUE_VAR') if condition else os.getenv('FALSE_VAR')

# In logical operators
fallback = os.getenv('PRIMARY') or os.getenv('SECONDARY') or 'default'
check = os.getenv('CHECK') and os.getenv('VERIFY')

# In data structures
config = {
    'db': os.environ['DB_URL'],
    'cache': os.getenv('CACHE_URL'),
    'ports': [os.getenv('HTTP_PORT'), os.getenv('HTTPS_PORT')]
}

# Multiline
multiline_value = os.environ.get(
    'MULTILINE_VAR',
    'default_value'
)

# Method chaining
upper_value = os.getenv('UPPER_VAR', '').upper()
split_value = os.environ.get('SPLIT_VAR', '').split(',')
