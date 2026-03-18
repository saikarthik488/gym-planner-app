import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { TaskCard } from "../components/ui/TaskCard";
import { Category, Task } from "../types";

export function MarketplacePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState({ category: "", location: "", search: "" });

  const load = async () => {
    const query = new URLSearchParams();
    if (filters.category) query.set("category", filters.category);
    if (filters.location) query.set("location", filters.location);
    if (filters.search) query.set("search", filters.search);

    const [nextTasks, nextCategories] = await Promise.all([
      api<Task[]>(`/tasks${query.toString() ? `?${query.toString()}` : ""}`),
      api<Category[]>("/categories")
    ]);
    setTasks(nextTasks);
    setCategories(nextCategories);
  };

  useEffect(() => {
    void load();
  }, []);

  const submitFilters = async (event: FormEvent) => {
    event.preventDefault();
    await load();
  };

  return (
    <div className="marketplace-page">
      <header className="marketplace-header">
        <div>
          <p className="eyebrow">Marketplace</p>
          <h1>Find tasks across home and personal services</h1>
        </div>
        <div className="hero-actions">
          <Link className="button button--ghost" to="/">Home</Link>
          <Link className="button button--primary" to="/auth">Login</Link>
        </div>
      </header>
      <section className="section-card">
        <form className="filter-row" onSubmit={submitFilters}>
          <input placeholder="Search tasks" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
          <select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
            <option value="">All categories</option>
            {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
          </select>
          <input placeholder="Location" value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })} />
          <button className="button button--primary" type="submit">Apply</button>
        </form>
      </section>
      <div className="card-grid">
        {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
      </div>
    </div>
  );
}