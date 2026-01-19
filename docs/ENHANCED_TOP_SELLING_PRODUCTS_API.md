# Enhanced Top Selling Products API Documentation

## Overview
This document describes the enhanced API endpoints for the Top Selling Products functionality that expands the existing analytics capabilities with more granular filtering and display options.

## API Endpoints

### 1. Get Product Performance Data
**Endpoint:** `GET /api/analytics/product-performance`

#### Description
Returns detailed product performance metrics with support for various filtering and pagination options.

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| startDate | string | No | - | Start date in ISO format (YYYY-MM-DD) |
| endDate | string | No | - | End date in ISO format (YYYY-MM-DD) |
| productId | number | No | - | Filter by specific product ID |
| categoryId | number | No | - | Filter by category ID |
| sortBy | string | No | 'revenue' | Sort by 'revenue', 'quantity', or 'name' |
| sortOrder | string | No | 'desc' | Sort order 'asc' or 'desc' |
| page | number | No | 1 | Page number for pagination |
| limit | number | No | 10 | Items per page (max 100) |
| includeAllProducts | boolean | No | true | Whether to return all products or just top N |

#### Response Format
```json
{
  "products": [
    {
      "id": 1,
      "name": "Product Name",
      "categoryId": 2,
      "categoryName": "Category Name",
      "totalQuantity": 15,
      "totalRevenue": 150.00,
      "averagePrice": 10.00,
      "transactionCount": 3
    }
  ],
  "metadata": {
    "totalCount": 25,
    "totalPages": 3,
    "currentPage": 1,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "summary": {
    "totalRevenue": 1500.00,
    "totalUnitsSold": 150,
    "topProduct": {
      "name": "Best Selling Product",
      "revenue": 500.00,
      "quantity": 50
    }
  }
}
```

### 2. Get Top Performers (Backward Compatibility)
**Endpoint:** `GET /api/analytics/top-performers`

#### Description
Maintains backward compatibility with the existing Top Performers functionality. Returns the top products limited to 5 by default.

#### Query Parameters
Same as above, with a default limit of 5 products.

#### Response Format
Same as above, but limited to top 5 products by default.

## Usage Examples

### Get all products with default settings
```
GET /api/analytics/product-performance
```

### Filter by specific product
```
GET /api/analytics/product-performance?productId=1
```

### Filter by category
```
GET /api/analytics/product-performance?categoryId=2
```

### Custom date range
```
GET /api/analytics/product-performance?startDate=2023-01-01&endDate=2023-12-31
```

### Paginated results
```
GET /api/analytics/product-performance?page=2&limit=10
```

### Sorted by quantity in ascending order
```
GET /api/analytics/product-performance?sortBy=quantity&sortOrder=asc
```

## Implementation Details

### Backend Structure
- **Handler**: `backend/src/handlers/analytics.ts`
- **Service**: `backend/src/services/analyticsService.ts`
- **Validation**: `backend/src/utils/validation.ts`

### Key Features
1. **Enhanced Filtering**: Support for filtering by product ID, category ID, and custom date ranges
2. **Pagination**: Support for paginated results to handle large datasets efficiently
3. **Sorting**: Multiple sorting options (revenue, quantity, name) with configurable order
4. **Performance**: Server-side aggregation to handle large datasets efficiently
5. **Backward Compatibility**: Maintains existing API contract with the top-performers endpoint

### Database Queries
The service performs efficient database queries by:
- Fetching transactions within specified date ranges
- Joining with product and category data
- Aggregating metrics at the database level where possible
- Using pagination to limit result sets

### Error Handling
- Invalid date formats are ignored gracefully
- Invalid numeric parameters are ignored
- Non-existent products/categories return empty results
- All errors are logged with appropriate status codes

## Security Considerations
- Input validation for all parameters
- SQL injection prevention through Prisma ORM
- Rate limiting applied at the application level
- Authentication handled by existing middleware

## Performance Considerations
- Results are limited to 100 items per page maximum
- Date range filters reduce dataset size
- Efficient database queries with proper indexing
- Consider implementing caching for frequently accessed reports