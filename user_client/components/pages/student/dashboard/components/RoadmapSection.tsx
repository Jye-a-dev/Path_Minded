import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  ArrowRight,
  Info,
  FileSpreadsheet,
  MessageCircle,
} from "lucide-react";

interface RoadmapSectionProps {
  hasGrades?: boolean;
}

export function RoadmapSection({ hasGrades }: RoadmapSectionProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-neutral-950 mb-4 flex items-center gap-2">
          <GraduationCap className="text-violet-600" size={20} />
          Lộ trình học tập khuyến nghị
        </h2>

        {hasGrades ? (
          <>
            <p className="text-sm text-neutral-500 mb-5 leading-relaxed">
              Dựa trên khung chương trình đào tạo, hệ thống đã phân tích các
              học phần đã hoàn thành và gợi ý các nhóm môn tiếp theo.
            </p>
            <div className="space-y-3">
              {[
                {
                  step: 1,
                  title: "Hoàn thành môn điều kiện (Prerequisites)",
                  desc: "Đăng ký Cấu trúc dữ liệu & Giải thuật trước khi học Cơ sở dữ liệu nâng cao ở học kỳ tới.",
                },
                {
                  step: 2,
                  title: "Đăng ký nhóm Tự chọn chuyên ngành",
                  desc: "Chọn tối thiểu 2 môn thuộc nhóm Công nghệ phần mềm (Thiết kế mẫu, Lập trình di động).",
                },
                {
                  step: 3,
                  title: "Hoàn tất nhóm Giáo dục đại cương",
                  desc: "Còn 2 môn bắt buộc cần hoàn thành trong học kỳ 2 năm 3.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex items-start gap-4 p-4 rounded-xl border border-zinc-150 bg-neutral-50 hover:border-violet-200 hover:bg-violet-50/30 transition-all"
                >
                  <div className="h-7 w-7 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5">
                    {item.step}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-neutral-900">
                      {item.title}
                    </h4>
                    <p className="text-xs text-neutral-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA to courses */}
            <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-xs text-neutral-400 font-medium">
                Dựa trên dữ liệu bảng điểm đã nạp
              </span>
              <Link
                href="/student/courses"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-500 transition-all group"
              >
                Xem toàn bộ môn học
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-10 space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-500 mb-2">
              <Info size={24} />
            </div>
            <h4 className="text-sm font-bold text-neutral-800">
              Chưa có dữ liệu điểm
            </h4>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
              Lộ trình học tập chỉ được khởi tạo sau khi bạn nhập bảng điểm vào
              hệ thống.
            </p>
            <Link
              href="/student/transcripts"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all"
            >
              Nhập bảng điểm ngay
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/student/transcripts"
          className="group flex items-center gap-4 p-5 rounded-2xl border border-zinc-200 bg-white shadow-sm hover:border-violet-300 hover:shadow-md transition-all duration-300"
        >
          <div className="p-3 bg-violet-50 rounded-xl border border-violet-100 group-hover:scale-110 transition-transform">
            <FileSpreadsheet className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-900">
              Nhập điểm & Transcript
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Tải lên hoặc dán bảng điểm từ cổng đào tạo
            </p>
          </div>
          <ArrowRight
            size={16}
            className="ml-auto text-neutral-300 group-hover:text-violet-500 transition-all group-hover:translate-x-1"
          />
        </Link>

        <Link
          href="/student/advisor"
          className="group flex items-center gap-4 p-5 rounded-2xl border border-zinc-200 bg-white shadow-sm hover:border-emerald-300 hover:shadow-md transition-all duration-300"
        >
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 group-hover:scale-110 transition-transform">
            <MessageCircle className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-900">
              Liên hệ Cố vấn
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Gửi yêu cầu hỗ trợ từ CVHT của bạn
            </p>
          </div>
          <ArrowRight
            size={16}
            className="ml-auto text-neutral-300 group-hover:text-emerald-500 transition-all group-hover:translate-x-1"
          />
        </Link>
      </div>
    </div>
  );
}
