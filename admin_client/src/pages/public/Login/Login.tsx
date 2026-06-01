import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { api } from "../../../services/api";
import { KeyRound, Mail, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const mouse = { x: 0, y: 0, active: false, radius: 180 };

    class Particle {
      x: number = 0;
      y: number = 0;
      vx: number = 0;
      vy: number = 0;
      radius: number = 0;
      opacity: number = 0;

      constructor(w: number, h: number) {
        this.reset(w, h);
      }

      reset(w: number, h: number) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = (Math.random() - 0.5) * 0.35;
        this.radius = Math.random() * 1.5 + 0.8;
        this.opacity = Math.random() * 0.4 + 0.2;
      }

      update(w: number, h: number) {
        this.x += this.vx;
        this.y += this.vy;

        if (mouse.active) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            this.x += (dx / dist) * force * 0.4;
            this.y += (dy / dist) * force * 0.4;
          }
        }

        if (this.x < -10) this.x = w + 10;
        if (this.x > w + 10) this.x = -10;
        if (this.y < -10) this.y = h + 10;
        if (this.y > h + 10) this.y = -10;
      }

      draw(c: CanvasRenderingContext2D) {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = `rgba(168, 85, 247, ${this.opacity})`;
        c.fill();
      }
    }

    const init = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);

      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const count = Math.min(Math.floor((w * h) / 18000), 80);
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push(new Particle(w, h));
      }
    };

    const handleResize = () => {
      init();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    init();

    const animate = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update(w, h);
        p1.draw(ctx);

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            const alpha = ((110 - dist) / 110) * 0.12;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(129, 140, 248, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }

        if (mouse.active) {
          const dx = p1.x - mouse.x;
          const dy = p1.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const alpha = ((mouse.radius - dist) / mouse.radius) * 0.2;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ các trường.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      if (response.data?.accessToken && response.data?.user) {
        const user = response.data.user;
        if (user.role !== "ADMIN") {
          setError("Truy cập bị từ chối: Chỉ tài khoản Quản trị viên mới được phép truy cập.");
          setLoading(false);
          return;
        }

        login(response.data.accessToken, response.data.refreshToken, user, remember);
        navigate("/admin");
      } else {
        setError("Phản hồi không hợp lệ từ máy chủ.");
      }
    } catch (err) {
      console.error("Login failed:", err);
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(errObj.response?.data?.message || errObj.message || "Thông tin đăng nhập không hợp lệ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[85svh] w-full items-center justify-center px-4 overflow-hidden py-12">
      <style>{`
        @keyframes drift1 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes drift2 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-50px, 50px) scale(1.15); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-drift1 {
          animation: drift1 22s ease-in-out infinite;
        }
        .animate-drift2 {
          animation: drift2 28s ease-in-out infinite;
        }
        .login-card-shadow {
          box-shadow: 0 0 45px rgba(99, 102, 241, 0.08), 0 25px 50px -12px rgba(0, 0, 0, 0.6);
        }
        .login-card-shadow:hover {
          box-shadow: 0 0 60px rgba(99, 102, 241, 0.15), 0 25px 50px -12px rgba(0, 0, 0, 0.75);
        }
      `}</style>

      {/* Interactive background particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Aurora glow blobs */}
      <div className="absolute top-10 left-10 h-87.5 w-87.5 rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none z-0 animate-drift1" />
      <div className="absolute bottom-10 right-10 h-87.5 w-87.5 rounded-full bg-purple-600/10 blur-[130px] pointer-events-none z-0 animate-drift2" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-75 w-150 rounded-full bg-cyan-500/5 blur-[140px] pointer-events-none z-0" />

      {/* Login Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/60 p-8 shadow-2xl backdrop-blur-xl z-10 transition-all duration-500 login-card-shadow hover:border-indigo-500/30 group">
        
        {/* Neon top border light line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-indigo-500/60 to-transparent transition-all duration-700 group-hover:via-indigo-400" />

        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-600/40 text-2xl transition-all duration-500 hover:scale-105 hover:rotate-3 select-none">
            <span className="relative z-10">PM</span>
            <div className="absolute inset-0 rounded-xl border-2 border-indigo-400/40 animate-pulse pointer-events-none" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white mt-2">Chào mừng quay trở lại</h2>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-medium">
            Đăng nhập vào Cổng quản trị học thuật <span className="text-indigo-400 font-semibold">PathMinded</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="flex items-center gap-2.5 rounded-lg bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-400 border border-rose-500/25 animate-fadeIn">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail className="absolute top-3 left-3.5 h-4 w-4 text-slate-500 transition-colors group-focus-within:text-indigo-400" />
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-800/80 bg-slate-950/80 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none transition-all duration-300"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Mật khẩu
              </label>
              <div className="relative">
                <KeyRound className="absolute top-3 left-3.5 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-800/80 bg-slate-950/80 pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center">
            <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-400 select-none cursor-pointer group/check">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500/40 focus:ring-offset-slate-950 cursor-pointer transition-all"
              />
              <span className="group-hover/check:text-slate-300 transition-colors">Ghi nhớ đăng nhập</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:pointer-events-none disabled:opacity-50 transition-all duration-300 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

