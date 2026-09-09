import React from "react";
import Sidebar from "./Sidebar.jsx";

const AppShell = ({ children }) => {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
};

export default AppShell;
