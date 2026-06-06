import BaseFooter from "@/components/layouts/@base/Footer/BaseFooter";

export default function PublicFooter() {
  return (
    <BaseFooter
      left={<p>&copy; 2026 PathMinded. Bảo lưu mọi quyền.</p>}
      right={<p>Hệ thống phân tích & chuẩn hóa chương trình đào tạo - Đại học Văn Lang (VLU).</p>}
    />
  );
}
