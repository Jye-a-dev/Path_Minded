# React Client Template

## Clone repo này
```bash
git clone https://github.com/Jye-a-dev/template_react_client.git
```

Template khởi tạo cho React client app theo hướng dễ mở rộng, dùng:

- React 19
- Vite 8
- TypeScript
- Tailwind CSS 4
- React Router DOM 7
- ESLint

Template này phù hợp khi bạn muốn bắt đầu nhanh với React theo kiểu SPA client-side, nhưng vẫn giữ cấu trúc thư mục đủ rõ để scale tiếp.

## 1. Project này đang setup theo kiểu nào?

Repo hiện tại là kiểu:

`React + Vite + TypeScript + Tailwind + React Router`

Đây là setup phù hợp cho:

- Dashboard
- Admin panel
- Landing page có nhiều route
- Client app gọi API backend riêng
- Dự án cần chia folder rõ từ sớm

Nếu bạn chỉ cần một app React rất nhỏ, có thể không cần tách nhiều folder như repo này.

## 2. Khi nào nên dùng từng kiểu setup React?

### React + Vite + JavaScript

Dùng khi:

- muốn làm nhanh
- app nhỏ
- chưa cần TypeScript

Tạo project:

```bash
npm create vite@latest my-app -- --template react
```

### React + Vite + TypeScript

Dùng khi:

- muốn code an toàn hơn
- project có nhiều component/props
- team làm việc lâu dài

Tạo project:

```bash
npm create vite@latest my-app -- --template react-ts
```

### React + Vite + TypeScript + Tailwind

Dùng khi:

- muốn dựng UI nhanh
- cần utility-first CSS
- muốn scale design system sau này

Cài thêm vào project:

```bash
npm install tailwindcss @tailwindcss/vite
```

Sau đó:

- gắn `tailwindcss()` vào `vite.config.ts`
- thêm `@import "tailwindcss";` vào file CSS gốc

### React + Vite + TypeScript + Tailwind + Router

Dùng khi:

- app có nhiều route
- cần layout theo khu vực như `public`, `auth`, `user`
- muốn chia cấu trúc page rõ ràng

Đây chính là kiểu setup của repo này.

### Next.js

Nên dùng thay vì template này nếu bạn cần:

- SSR
- SSG
- SEO mạnh
- full-stack React
- routing kiểu file-based

Template repo này không nhắm tới SSR. Nó là client app template.

## 3. Cài và chạy project

### Yêu cầu

- Node.js 20+
- npm 10+

### Cài dependency

```bash
npm install
```

### Chạy môi trường dev

```bash
npm run dev
```

### Build production

```bash
npm run build
```

### Preview build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## 4. Cấu trúc thư mục hiện tại

```text
src/
├─ app/
│  ├─ (public)/
│  ├─ (user)/
│  ├─ Auth/
│  ├─ NotFound/
│  └─ App.tsx
├─ assets/
├─ components/
│  ├─ layouts/
│  └─ pages/
├─ hooks/
├─ providers/
├─ router/
├─ services/
├─ utils/
├─ Main.tsx
└─ index.css
```

Ý nghĩa chính:

- `app/`: page-level module, screen theo route
- `components/`: UI dùng lại
- `components/layouts/`: layout shell như navbar, footer, public layout
- `components/pages/`: UI tách riêng cho từng page
- `router/`: cấu hình route
- `providers/`: context/provider cấp app
- `services/`: API call, auth service, request wrapper
- `hooks/`: custom hooks
- `utils/`: helper function
- `assets/`: ảnh, icon, static asset import từ source

## 5. Luồng chạy hiện tại của app

Luồng cơ bản:

1. `index.html` load `src/Main.tsx`
2. `Main.tsx` bọc app bằng `BrowserRouter`
3. `app/App.tsx` dùng `useRoutes`
4. `router/Router.tsx` khai báo route
5. Route render layout phù hợp
6. Layout render page tương ứng qua `Outlet`

Tóm tắt:

```text
index.html
-> Main.tsx
-> App.tsx
-> Router.tsx
-> Layout
-> Page
```

## 6. Cách setup một app React mới theo style của repo này

### Bước 1: tạo project React + TS

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
```

### Bước 2: cài router

```bash
npm install react-router-dom
```

### Bước 3: cài Tailwind CSS 4

```bash
npm install tailwindcss @tailwindcss/vite
```

Thêm vào `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

Thêm vào `src/index.css`:

```css
@import "tailwindcss";
```

### Bước 4: tạo entry chuẩn

Ví dụ `src/Main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

### Bước 5: tạo app shell

Ví dụ `src/app/App.tsx`:

```tsx
import { useRoutes } from "react-router-dom";
import routes from "../router/Router";
import Providers from "../providers/Providers";

function App() {
  const element = useRoutes(routes);

  return <Providers>{element}</Providers>;
}

export default App;
```

### Bước 6: tạo router

Ví dụ `src/router/Router.tsx`:

```tsx
import PublicLayout from "../components/layouts/(public)/PublicLayout";
import Home from "../app/(public)/Home/Home";

const routes = [
  {
    path: "/",
    element: <PublicLayout />,
    children: [{ index: true, element: <Home /> }],
  },
];

export default routes;
```

### Bước 7: chia layout

Nên tách ít nhất:

- `@base`: layout part gốc, có thể dùng lại
- `(public)`: layout cho route public
- `(user)`: layout cho route sau đăng nhập nếu cần

Ví dụ:

- `BaseNavbar.tsx`
- `BaseFooter.tsx`
- `PublicNavbar.tsx`
- `PublicFooter.tsx`
- `PublicLayout.tsx`

### Bước 8: chia page và component

Nên theo quy tắc:

- route page nằm ở `src/app`
- UI tái sử dụng nằm ở `src/components`
- logic gọi API nằm ở `src/services`
- helper nằm ở `src/utils`
- hook nằm ở `src/hooks`

## 7. Naming convention đề xuất

### File component

Dùng PascalCase:

- `App.tsx`
- `Main.tsx`
- `Router.tsx`
- `PublicLayout.tsx`
- `BaseNavbar.tsx`

### File helper hoặc config

Có thể dùng PascalCase để thống nhất toàn repo, hoặc camel/lowercase nếu team đã có convention rõ.

Hiện repo này đang được chỉnh theo hướng PascalCase cho file chính.

### Folder

Giữ tên theo domain hoặc vai trò:

- `components`
- `services`
- `router`
- `providers`
- `MainPage`

## 8. Cách scale project khi app lớn hơn

Khi app tăng độ phức tạp, có thể mở rộng thêm:

- `features/`
- `store/`
- `types/`
- `constants/`
- `schemas/`
- `lib/`

Ví dụ:

```text
src/
├─ app/
├─ features/
│  ├─ auth/
│  ├─ dashboard/
│  └─ profile/
├─ components/
├─ services/
├─ hooks/
├─ store/
├─ types/
└─ utils/
```

Nếu team đi theo feature-based architecture, có thể gom:

- component
- hook
- service
- type
- validation

vào cùng một feature.

## 9. Khi nào nên tách theo feature?

Nên tách theo feature khi:

- app có nhiều module nghiệp vụ
- mỗi module có page, hook, API, component riêng
- team có nhiều người cùng làm

Ví dụ:

```text
src/features/auth/
src/features/dashboard/
src/features/orders/
src/features/profile/
```

Không cần tách quá sớm nếu project vẫn nhỏ.

## 10. Tailwind trong repo này

Repo hiện đang dùng Tailwind CSS 4 qua Vite plugin.

Điểm chính:

- package: `tailwindcss`, `@tailwindcss/vite`
- import CSS gốc bằng `@import "tailwindcss";`
- dùng utility class trực tiếp trong JSX

Nên dùng Tailwind cho:

- spacing
- layout
- typography
- border
- responsive

Nếu UI lớn dần, nên chuẩn hóa thêm:

- token màu
- token spacing
- component variant
- reusable wrapper component

## 11. React Router trong repo này

Repo đang dùng `useRoutes` thay vì khai báo `<Routes><Route /></Routes>` trực tiếp trong `Main.tsx`.

Cách này phù hợp khi:

- muốn route config tập trung
- muốn tách layout rõ
- muốn scale route tree dễ hơn

Khi app lớn hơn, có thể mở rộng:

- nested routes
- auth guard
- lazy route
- route metadata

## 12. Quy tắc tổ chức code nên giữ

- Page là nơi ghép màn hình, không nên nhồi quá nhiều UI nhỏ
- Component dùng chung không nên phụ thuộc chặt vào route cụ thể
- Service không nên render UI
- Hook không nên chứa JSX
- Utils nên là pure function càng nhiều càng tốt
- Layout chỉ nên lo page shell và route structure

## 13. Checklist khi tạo project React mới

- chọn Vite hay Next.js đúng nhu cầu
- quyết định có dùng TypeScript hay không
- cài router nếu app có nhiều route
- cài Tailwind nếu cần dựng UI nhanh
- tách `Main`, `App`, `Router`, `Providers`
- tạo folder structure đủ dùng, không over-engineer
- thống nhất naming convention từ đầu
- có lint sớm

## 14. Gợi ý hướng phát triển tiếp cho template này

Nếu muốn biến template này thành base mạnh hơn, có thể thêm:

- Axios hoặc fetch wrapper
- env config
- auth flow
- protected route
- error boundary
- loading boundary
- toast system
- theme switch
- API layer chuẩn hóa
- form library như React Hook Form
- validation bằng Zod

## 15. Tóm tắt

Nếu bạn muốn một setup React cân bằng giữa:

- dễ bắt đầu
- dễ đọc
- dễ scale
- không quá nặng framework

thì `React + Vite + TypeScript + Tailwind + React Router` là lựa chọn rất thực dụng.

Template này đang đi đúng hướng đó:

- entry rõ
- route rõ
- layout rõ
- folder rõ
- dễ nâng cấp tiếp

---

Nếu muốn, có thể viết tiếp phiên bản `README.md` khác theo một trong 3 hướng:

1. ngắn gọn cho team dùng nội bộ
2. chuẩn open-source/public template
3. cực chi tiết kiểu onboarding cho người mới học React
