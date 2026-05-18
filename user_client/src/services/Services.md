# Services

## English

**Purpose**

This folder contains service modules responsible for communicating with external systems or handling shared side effects.

**What goes here**

- API clients
- Authentication service helpers
- Request wrappers
- Modules that talk to backend endpoints or third-party services

**Notes**

Keep components free from low-level request details.
Services should return clean data or reusable request functions.

## Tiếng Việt

**Mục đích**

Thư mục này chứa các module service dùng để giao tiếp với hệ thống bên ngoài hoặc xử lý các side effect dùng chung.

**Nên đặt gì ở đây**

- API client
- Helper cho auth
- Hàm bọc request
- Module gọi backend hoặc dịch vụ bên thứ ba

**Ghi chú**

Nên tách chi tiết request ra khỏi component.
Service nên trả về dữ liệu sạch hoặc các hàm gọi API có thể tái sử dụng.
