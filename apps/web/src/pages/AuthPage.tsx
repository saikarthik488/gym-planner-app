import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Category } from "../types";

export function AuthPage() {
  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    address: "",
    role: "CLIENT",
    skills: "",
    serviceAreas: "",
    bio: ""
  });

  useEffect(() => {
    api<Category[]>("/categories").then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, user]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      if (isRegister) {
        await register({
          email: form.email,
          password: form.password,
          name: form.name,
          phone: form.phone,
          address: form.address,
          role: form.role,
          providerProfile:
            form.role === "PROVIDER"
              ? {
                  bio: form.bio,
                  skills: form.skills.split(",").map((value) => value.trim()).filter(Boolean),
                  serviceAreas: form.serviceAreas.split(",").map((value) => value.trim()).filter(Boolean),
                  categoryIds: categories.slice(0, 2).map((category) => category.id)
                }
              : undefined
        });
      } else {
        await login(form.email, form.password);
      }
      navigate("/dashboard", { replace: true });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Authentication failed");
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={onSubmit}>
        <p className="eyebrow">TaskSwift Access</p>
        <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>
        <p>{isRegister ? "Join as a client or provider." : "Use the seeded demo accounts or your own credentials."}</p>
        {error ? <div className="alert">{error}</div> : null}
        {isRegister ? (
          <>
            <label>
              Full name
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
            <label>
              Role
              <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                <option value="CLIENT">Client</option>
                <option value="PROVIDER">Service Provider</option>
              </select>
            </label>
            <label>
              Phone
              <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </label>
            <label>
              Address
              <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            </label>
            {form.role === "PROVIDER" ? (
              <>
                <label>
                  Skills
                  <input
                    placeholder="cleaning, repairs, meal prep"
                    value={form.skills}
                    onChange={(event) => setForm({ ...form, skills: event.target.value })}
                  />
                </label>
                <label>
                  Service areas
                  <input
                    placeholder="Sydney CBD, Inner West"
                    value={form.serviceAreas}
                    onChange={(event) => setForm({ ...form, serviceAreas: event.target.value })}
                  />
                </label>
                <label>
                  Bio
                  <textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} rows={4} />
                </label>
              </>
            ) : null}
          </>
        ) : null}
        <label>
          Email
          <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
        </label>
        <button className="button button--primary" type="submit">
          {isRegister ? "Create account" : "Login"}
        </button>
        <button className="button button--ghost" type="button" onClick={() => setIsRegister((value) => !value)}>
          {isRegister ? "Already have an account?" : "Need an account?"}
        </button>
        <div className="demo-strip">
          <span>`client@example.com` / `client1234`</span>
          <span>`provider@example.com` / `provider1234`</span>
          <span>`admin@taskswift.dev` / `admin1234`</span>
        </div>
      </form>
    </div>
  );
}