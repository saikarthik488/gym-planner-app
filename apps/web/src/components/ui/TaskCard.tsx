import { ReactNode } from "react";
import { Task } from "../../types";

export function TaskCard({ task, footer }: { task: Task; footer?: ReactNode }) {
  return (
    <article className="task-card">
      <div className="task-card__top">
        <span className="tag">{task.category.name}</span>
        <span className={`status status--${task.status.toLowerCase()}`}>{task.status.replace("_", " ")}</span>
      </div>
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      <div className="task-meta">
        <span>{task.location}</span>
        <span>${task.budget}</span>
        <span>{new Date(task.scheduledDate).toLocaleDateString()}</span>
      </div>
      {footer}
    </article>
  );
}