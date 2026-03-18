import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });
  });
}

if ("caches" in window) {
  window.addEventListener("load", () => {
    window.caches.keys().then((keys) => {
      keys.forEach((key) => {
        window.caches.delete(key);
      });
    });
  });
}
