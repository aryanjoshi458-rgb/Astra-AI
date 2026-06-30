import React, { createContext, useState, useEffect, useContext } from "react";

const ThemeContext = createContext(null);

const applyTheme = (mode) => {
  const root = window.document.documentElement;
  if (mode === "light") {
    root.classList.remove("dark");
    root.classList.add("light");
  } else if (mode === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
  } else {
    // system
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(
    localStorage.getItem("astra_theme") || "dark"
  );

  const setTheme = (mode) => {
    setThemeState(mode);
    localStorage.setItem("astra_theme", mode);
    applyTheme(mode);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  useEffect(() => {
    applyTheme(theme);

    // Listen for system changes when in system mode
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") applyTheme("system");
    };
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
