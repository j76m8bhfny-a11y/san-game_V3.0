import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// 引入全局样式 (包含了你的像素字体和 Tailwind)
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);