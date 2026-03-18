import { useEffect, useState } from "react";
import { api } from "../api/client";
import { AppShell } from "../components/layout/AppShell";
import { SectionCard } from "../components/ui/SectionCard";
import { StatCard } from "../components/ui/StatCard";
import { useAuth } from "../context/AuthContext";
import { Category, Task, User } from "../types";

export function AdminDashboard() {
  const { token, user, logout } = useAuth();
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categoryName, setCategoryName] = useState("");

  const load = async () => {
    if (!token) return;
    const [dashboard, nextUsers, nextTasks] = await Promise.all([
      api<Record<string, number>>("/admin/dashboard", {}, token),
      api<User[]>("/admin/users", {}, token),
      api<Task[]>("/admin/tasks", {}, token)
    ]);
    setMetrics(dashboard);
    setUsers(nextUsers);
    setTasks(nextTasks);
  };

  useEffect(() => {
    void load();
  }, [token]);

  const setProviderStatus = async (userId: string, verification: string) => {
    if (!token) return;
    await api(`/admin/providers/${userId}`, { method: "PATCH", body: JSON.stringify({ verification }) }, token);
    await load();
  };

  const addCategory = async () => {
    if (!token || !categoryName) return;
    await api<Category>("/admin/categories", { method: "POST", body: JSON.stringify({ name: categoryName }) }, token);
    setCategoryName("");
    await load();
  };

  return (
    <AppShell
      title={`Admin dashboard, ${user?.name ?? ""}`}
      subtitle="Oversee users, provider verification, categories, and marketplace activity."
      actions={<button className="button button--ghost" onClick={logout}>Logout</button>}
      sidebar={<Sidebar userName={user?.name ?? "Admin"} role="Admin" />}
    >
      <div className="stats-grid">
        {Object.entries(metrics).map(([key, value]) => (
          <StatCard key={key} label={key} value={value} hint="Platform metric" />
        ))}
      </div>
      <div className="dashboard-grid">
        <SectionCard title="Provider approvals" action={<input placeholder="New category" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />}>
          <button className="button button--primary" onClick={addCategory}>Add category</button>
          <div className="stack-list">
            {users.filter((account) => account.role === "PROVIDER").map((account) => (
              <article className="note-card" key={account.id}>
                <strong>{account.name}</strong>
                <p>{account.email}</p>
                <div className="inline-actions">
                  <button className="button button--tiny" onClick={() => setProviderStatus(account.id, "APPROVED")}>Approve</button>
                  <button className="button button--tiny button--ghost" onClick={() => setProviderStatus(account.id, "SUSPENDED")}>Suspend</button>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Platform activity">
          <div className="stack-list">
            {tasks.slice(0, 6).map((task) => (
              <article className="note-card" key={task.id}>
                <strong>{task.title}</strong>
                <p>{task.category.name} · {task.status.replace("_", " ")} · ${task.budget}</p>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}

function Sidebar({ userName, role }: { userName: string; role: string }) {
  return (
    <div>
      <div className="brand-lockup">
        <span className="brand-mark">TS</span>
        <div>
          <strong>TaskSwift</strong>
          <p>{role} workspace</p>
        </div>
      </div>
      <div className="sidebar-card">
        <span>Signed in as</span>
        <strong>{userName}</strong>
      </div>
    </div>
  );
}