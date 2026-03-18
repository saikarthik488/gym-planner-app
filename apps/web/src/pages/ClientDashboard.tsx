import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import { AppShell } from "../components/layout/AppShell";
import { SectionCard } from "../components/ui/SectionCard";
import { StatCard } from "../components/ui/StatCard";
import { TaskCard } from "../components/ui/TaskCard";
import { useAuth } from "../context/AuthContext";
import { Category, Notification, Task } from "../types";

export function ClientDashboard() {
  const { token, user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    location: user?.address ?? "",
    budget: "",
    scheduledDate: ""
  });

  const load = async () => {
    if (!token) return;
    const [nextTasks, nextCategories, nextNotifications] = await Promise.all([
      api<Task[]>("/tasks/my/client", {}, token),
      api<Category[]>("/categories"),
      api<Notification[]>("/notifications", {}, token)
    ]);
    setTasks(nextTasks);
    setCategories(nextCategories);
    setNotifications(nextNotifications);
    setTaskForm((current) => ({ ...current, categoryId: current.categoryId || nextCategories[0]?.id || "" }));
  };

  useEffect(() => {
    void load();
  }, [token]);

  const createTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;

    await api("/tasks", {
      method: "POST",
      body: JSON.stringify({
        ...taskForm,
        budget: Number(taskForm.budget)
      })
    }, token);

    setTaskForm({ title: "", description: "", categoryId: categories[0]?.id || "", location: user?.address ?? "", budget: "", scheduledDate: "" });
    await load();
  };

  const updateBid = async (taskId: string, bidId: string, status: "ACCEPTED" | "REJECTED") => {
    if (!token) return;
    await api(`/tasks/${taskId}/bids/${bidId}`, { method: "PATCH", body: JSON.stringify({ status }) }, token);
    await load();
  };

  const addReview = async (taskId: string, providerId?: string) => {
    if (!token || !providerId) return;
    await api(`/tasks/${taskId}/reviews`, {
      method: "POST",
      body: JSON.stringify({ providerId, rating: 5, comment: "Reliable and professional service." })
    }, token);
    await load();
  };

  return (
    <AppShell
      title={`Client dashboard, ${user?.name ?? ""}`}
      subtitle="Post tasks, review bids, and keep work moving from shortlist to completion."
      actions={<button className="button button--ghost" onClick={logout}>Logout</button>}
      sidebar={<Sidebar userName={user?.name ?? "Client"} role="Client" />}
    >
      <div className="stats-grid">
        <StatCard label="Open tasks" value={tasks.filter((task) => task.status === "POSTED").length} hint="Waiting for bids" />
        <StatCard label="In progress" value={tasks.filter((task) => task.status === "IN_PROGRESS").length} hint="Active provider assignments" />
        <StatCard label="Completed" value={tasks.filter((task) => task.status === "COMPLETED").length} hint="Ready for reviews" />
      </div>
      <div className="dashboard-grid">
        <SectionCard title="Post a new task">
          <form className="form-grid" onSubmit={createTask}>
            <label>
              Title
              <input value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} required />
            </label>
            <label>
              Category
              <select value={taskForm.categoryId} onChange={(event) => setTaskForm({ ...taskForm, categoryId: event.target.value })}>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label className="form-grid__wide">
              Description
              <textarea rows={4} value={taskForm.description} onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })} required />
            </label>
            <label>
              Location
              <input value={taskForm.location} onChange={(event) => setTaskForm({ ...taskForm, location: event.target.value })} required />
            </label>
            <label>
              Budget
              <input type="number" value={taskForm.budget} onChange={(event) => setTaskForm({ ...taskForm, budget: event.target.value })} required />
            </label>
            <label>
              Service date
              <input type="date" value={taskForm.scheduledDate} onChange={(event) => setTaskForm({ ...taskForm, scheduledDate: event.target.value })} required />
            </label>
            <button className="button button--primary" type="submit">Publish task</button>
          </form>
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
      <SectionCard title="Your tasks">
        <div className="card-grid">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              footer={
                <div className="task-footer">
                  {task.bids?.map((bid) => (
                    <div key={bid.id} className="bid-row">
                      <span>${bid.amount}</span>
                      <span>{bid.message}</span>
                      {bid.status === "PENDING" ? (
                        <div className="inline-actions">
                          <button className="button button--tiny" onClick={() => updateBid(task.id, bid.id, "ACCEPTED")}>Accept</button>
                          <button className="button button--tiny button--ghost" onClick={() => updateBid(task.id, bid.id, "REJECTED")}>Reject</button>
                        </div>
                      ) : (
                        <span className="muted">{bid.status}</span>
                      )}
                    </div>
                  ))}
                  {task.status === "COMPLETED" && !task.reviews?.length ? (
                    <button className="button button--ghost" onClick={() => addReview(task.id, task.assignedProviderId)}>Leave review</button>
                  ) : null}
                </div>
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