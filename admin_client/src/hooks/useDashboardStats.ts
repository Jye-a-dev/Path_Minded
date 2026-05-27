import { useState, useEffect } from "react";
import { api } from "../services/api";

export interface Stats {
  users: number;
  advisors: number;
  programs: number;
  classes: number;
  students: number;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<Stats>({
    users: 0,
    advisors: 0,
    programs: 0,
    classes: 0,
    students: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, advisorsRes, programsRes, classesRes, studentsRes] = await Promise.all([
          api.get("/users/count").catch(() => ({ data: { count: 0 } })),
          api.get("/advisors/count").catch(() => ({ data: { count: 0 } })),
          api.get("/programs/count").catch(() => ({ data: { count: 0 } })),
          api.get("/classes/count").catch(() => ({ data: { count: 0 } })),
          api.get("/students/count").catch(() => ({ data: { count: 0 } })),
        ]);

        setStats({
          users: usersRes.data?.count ?? 0,
          advisors: advisorsRes.data?.count ?? 0,
          programs: programsRes.data?.count ?? 0,
          classes: classesRes.data?.count ?? 0,
          students: studentsRes.data?.count ?? 0,
        });
      } catch (e) {
        console.error("Failed to load dashboard metrics:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
}
