import React, { createContext, useState, useContext, useEffect } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  // Initialize from localStorage or default to false
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
    updateLayout(isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  const updateLayout = (collapsed) => {
    const header = document.querySelector(".page-header");
    const footer = document.querySelector(".page-footer");
    const body = document.querySelector(".page-wrapper.compact-wrapper .page-body-wrapper .page-body");

    if (header && footer && body) {
      if (collapsed) {
        header.style.marginLeft = "100px";
        header.style.width = "calc(100% - 100px)";
        footer.style.marginLeft = "100px";
        footer.style.width = "calc(100% - 100px)";
        body.style.marginLeft = "100px";
      } else {
        header.style.marginLeft = "265px";
        header.style.width = "calc(100% - 265px)";
        footer.style.marginLeft = "265px";
        footer.style.width = "calc(100% - 265px)";
        body.style.marginLeft = "265px";
      }
    }
  };

  // Initialize layout on mount
  useEffect(() => {
    updateLayout(isSidebarCollapsed);
  }, []);

  return (
    <SidebarContext.Provider value={{
      isSidebarCollapsed,
      toggleSidebar,
      setIsSidebarCollapsed
    }}>
      {children}
    </SidebarContext.Provider>
  );
};