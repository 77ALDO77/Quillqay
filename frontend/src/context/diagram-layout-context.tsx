'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type SidebarSection = 'tables' | 'dbml' | 'refs' | 'visuals';

interface DiagramLayoutContextValue {
  selectedSection: SidebarSection;
  selectSection: (section: SidebarSection) => void;
  openedTable: string | null;
  openTable: (name: string | null) => void;
  closeAllTables: () => void;
}

const DiagramLayoutContext = createContext<DiagramLayoutContextValue>(null!);

export function useDiagramLayout() {
  return useContext(DiagramLayoutContext);
}

interface DiagramLayoutProviderProps {
  children: ReactNode;
}

export function DiagramLayoutProvider({ children }: DiagramLayoutProviderProps) {
  const [selectedSection, setSelectedSection] = useState<SidebarSection>('tables');
  const [openedTable, setOpenedTable] = useState<string | null>(null);

  const selectSection = useCallback((section: SidebarSection) => {
    setSelectedSection(section);
    setOpenedTable(null);
  }, []);

  const openTable = useCallback((name: string | null) => {
    setOpenedTable(name);
  }, []);

  const closeAllTables = useCallback(() => {
    setOpenedTable(null);
  }, []);

  return (
    <DiagramLayoutContext.Provider value={{
      selectedSection,
      selectSection,
      openedTable,
      openTable,
      closeAllTables,
    }}>
      {children}
    </DiagramLayoutContext.Provider>
  );
}
