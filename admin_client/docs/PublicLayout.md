# Public Layout

## English

**Purpose**

This folder contains the layout used by public pages such as the home page or other non-authenticated routes.

**Structure**

- `PublicLayout.tsx`: Main wrapper for public routes. It renders the page shell and the `Outlet`.
- `Navbar/publicNavbar.tsx`: Public navbar wrapper used by the public layout.
- `Footer/publicFooter.tsx`: Public footer wrapper used by the public layout.

**Relation with `@base`**

The `(public)` layer should reuse shared base layout parts from `src/components/layouts/@base`.
Use this folder when you need public-specific composition or behavior without changing the base components directly.

## Tiếng Việt

**Mục đích**

Thư mục này chứa layout dùng cho các trang public như trang chủ hoặc các route không cần đăng nhập.

**Cấu trúc**

- `PublicLayout.tsx`: Layout chính cho route public, chịu trách nhiệm dựng khung trang và `Outlet`.
- `Navbar/publicNavbar.tsx`: Wrapper navbar dành cho khu vực public.
- `Footer/publicFooter.tsx`: Wrapper footer dành cho khu vực public.

**Liên hệ với `@base`**

Tầng `(public)` nên tái sử dụng các phần layout dùng chung từ `src/components/layouts/@base`.
Hãy dùng thư mục này khi cần ghép layout hoặc thêm hành vi riêng cho public mà không sửa trực tiếp component gốc.
