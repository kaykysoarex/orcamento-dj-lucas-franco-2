import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Font imports (only required weights)
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/montserrat/300.css";
import "@fontsource/montserrat/500.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
