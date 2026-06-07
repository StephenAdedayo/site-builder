// src/components/providers.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Link, NavLink, useNavigate } from "react-router-dom"
import type { ReactNode } from "react"
import { authClient } from "@/lib/auth-client"
import { AuthProvider } from "@/components/auth/auth-provider"
import { Toaster } from "@/components/ui/sonner"
import { deleteUserPlugin } from "./lib/auth/delete-user-plugin"

const queryClient = new QueryClient()

export function Providers({ children }: { children: ReactNode }) {
  const navigate = useNavigate()

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider
        authClient={authClient}
        navigate={({ to, replace }:any) =>
          replace ? navigate(to, { replace: true }) : navigate(to)
        }
        Link={(props:any) => <NavLink {...props} to={props.href}/>}
        redirectTo="/"
        plugins={[deleteUserPlugin()]} 

      >
        {children}
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  )
}