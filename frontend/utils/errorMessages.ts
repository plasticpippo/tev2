// Common HTTP status codes and their corresponding error messages
export const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'Bad Request: The request was invalid or cannot be served.',
  401: 'Unauthorized: Please log in to access this resource.',
  403: 'Forbidden: You do not have permission to access this resource.',
  404: 'Not Found: The requested resource could not be found.',
  405: 'Method Not Allowed: The HTTP method is not allowed for this endpoint.',
  408: 'Request Timeout: The request took too long to complete.',
  409: 'Conflict: The request conflicts with the current state of the server.',
  422: 'Unprocessable Entity: The request was well-formed but contains semantic errors.',
  429: 'Too Many Requests: You have sent too many requests recently.',
  500: 'Internal Server Error: An unexpected error occurred on the server.',
  502: 'Bad Gateway: The server received an invalid response from the upstream server.',
  503: 'Service Unavailable: The server is temporarily unavailable.',
  504: 'Gateway Timeout: The server did not receive a timely response from the upstream server.'
};

// Custom error messages for specific API endpoints
export const CUSTOM_ERROR_MESSAGES: Record<string, Record<number, string>> = {
  '/api/products': {
    400: 'Invalid product data provided. Please check all required fields.',
    409: 'A product with this name already exists. Please choose a different name.'
  },
  '/api/categories': {
    400: 'Invalid category data provided. Please check all required fields.',
    409: 'A category with this name already exists. Please choose a different name.'
  },
  '/api/stock-items': {
    400: 'Invalid stock item data provided. Please check all required fields.',
    409: 'A stock item with this name already exists. Please choose a different name.'
  },
  '/api/layouts': {
    400: 'Invalid layout data provided. Please check all required fields.',
    409: 'A layout with this name already exists. Please choose a different name.'
  },
  '/api/auth/login': {
    400: 'Invalid credentials provided. Please check your username and password.',
    401: 'Authentication failed. Please check your username and password.'
  }
};

// Field-specific validation error messages
export const FIELD_VALIDATION_MESSAGES: Record<string, Record<string, string>> = {
  name: {
    required: 'This field is required',
    minLength: 'Must be at least 1 character',
    maxLength: 'Must be 255 characters or less',
    pattern: 'Contains invalid characters'
  },
  email: {
    required: 'Email is required',
    format: 'Please enter a valid email address'
  },
  password: {
    required: 'Password is required',
    minLength: 'Password must be at least 6 characters',
    pattern: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  },
  price: {
    required: 'Price is required',
    min: 'Price must be 0 or greater',
    max: 'Price must be 999999 or less',
    format: 'Please enter a valid number'
  },
  quantity: {
    required: 'Quantity is required',
    min: 'Quantity must be 0 or greater',
    format: 'Please enter a valid number'
  },
  category: {
    required: 'Category selection is required'
  }
};