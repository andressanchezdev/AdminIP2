import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type PageHeaderActionsContextValue = {
  actions: ReactNode
  setActions: (node: ReactNode) => void
}

const PageHeaderActionsContext = createContext<PageHeaderActionsContextValue | null>(null)

/** Permite a cualquier vista inyectar controles en el header del AdminShell. */
export function PageHeaderActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ReactNode>(null)
  const value = useMemo(() => ({ actions, setActions }), [actions])
  return (
    <PageHeaderActionsContext.Provider value={value}>
      {children}
    </PageHeaderActionsContext.Provider>
  )
}

export function usePageHeaderActionsSlot() {
  const ctx = useContext(PageHeaderActionsContext)
  if (!ctx) {
    throw new Error('usePageHeaderActionsSlot debe usarse dentro de PageHeaderActionsProvider')
  }
  return ctx
}

/** Monta `children` en la zona de acciones del header mientras la vista está activa. */
export function PageHeaderActions({ children }: { children: ReactNode }) {
  const { setActions } = usePageHeaderActionsSlot()

  useLayoutEffect(() => {
    setActions(children)
    return () => setActions(null)
  }, [children, setActions])

  return null
}
