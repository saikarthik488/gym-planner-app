import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import { AppShell } from "../components/layout/AppShell";
import { SectionCard } from "../components/ui/SectionCard";
import { StatCard } from "../components/ui/StatCard";
import { TaskCard } from "../components/ui/TaskCard";
import { useAuth } from "../context/AuthContext";
import { Notification, Task } from "../types";

export function ProviderDashboard() {
  const { token, user, logout } = useAuth();
  const [marketTasks, setMarketTasks] = useState<Task[]>([]);
  const [jobs, setJobs] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const load = async () => {
    if (!token) return;
    const [nextTasks, nextJobs, nextNotifications] = await Promise.all([
      api<Task[]>("/tasks", {}, token),
      api<Task[]>("/tasks/my/provider", {}, token),
      api<Notification[]>("/notifications", {}, token)
    ]);
    setMarketTasks(nextTasks.filter((task) => task.status === "POSTED"));
    setJobs(nextJobs);
    setNotifications(nextNotifications);
  };

  useEffect(() => {
    void load();
  }, [token]);

  const bidOnTask = async (event: FormEvent<HTMLFormElement>, taskId: string) => {
    event.preventDefault();
    if (!token) return;

    const formData = new FormData(event.currentTarget);
    await api(`/tasks/${taskId}/bids`, {
      method: "POST",
      body: JSON.stringify({
        amount: Number(formData.get("amount")),
        message: String(formData.get("message"))
      })
    }, token);

    event.currentTarget.reset();
    await load();
  };

  const completeTask = async (taskId: string) => {
    if (!token) return;
    await api(`/tasks/${taskId}/status`, { method: "PATCH", body: JSON.stringify({ status: "COMPLETED" }) }, token);
    await load();
  };

  return (
    <AppShell
      title={`Provider dashboard, ${user?.name ?? ""}`}
      subtitle="Review new opportunities, bid with confidence, and update active work statuses."
      actions={<button className="button button--ghost" onClick={logout}>Logout</button>}
      sidebar={<Sidebar userName={user?.name ?? "Provider"} role="Provider" />}
    >
      <div className="stats-grid">
        <StatCard label="Marketplace tasks" value={marketTasks.length} hint="Available to bid" />
        <StatCard label="Accepted jobs" value={jobs.filter((task) => task.status === "IN_PROGRESS").length} hint="Current work queue" />
        <StatCard label="Rating" value={user?.providerProfile?.ratingAverage?.toFixed(1) ?? "0.0"} hint="Based on completed jobs" />
      </div>
      <div className="dashboard-grid">
        <SectionCard title="Open marketplace tasks">
          <div className="card-grid">
            {marketTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                footer={
                  <form className="bid-form" onSubmit={(event) => bidOnTask(event, task.id)}>
                    <input name="amount" type="number" placeholder="Your bid" required />
                    <input name="message" placeholder="Short pitch" required />
                    <button className="button button--primary" type="submit">Place bid</button>
                  </form>
                }
              />
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Notifications">
          <div className="stack-list">
            {notifications.map((notification) => (
              <article key={notification.id} className="note-card">
                <strong>{notification.title}</strong>
                <p>{notification.body}</p>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>
      <SectionCard title="Accepted jobs">
        <div className="card-grid">
          {jobs.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              footer={
                task.status !== "COMPLETED" ? (
                  <button className="button button--ghost" onClick={() => completeTask(task.id)}>Mark completed</button>
                ) : null
              }
            />
          ))}
        </div>
      </SectionCard>
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