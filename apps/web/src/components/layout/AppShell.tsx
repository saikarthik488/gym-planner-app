import { ReactNode } from "react";

type AppShellProps = {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
};

export function AppShell({ title, subtitle, actions, sidebar, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">{sidebar}</aside>
      <main className="app-main">
        <header className="page-header">
          <div>
            <p className="eyebrow">TaskSwift</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          {actions ? <div className="header-actions">{actions}</div> : null}
        </header>
        {children}
      </main>
    </div>
  );
}