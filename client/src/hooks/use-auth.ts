import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface AuthUser {
  id: string;
  username: string;
  isAdmin: boolean;
}

export interface AuthStatus {
  authenticated: boolean;
  accountMode: "single" | "multi";
  user?: AuthUser;
  registrationEnabled?: boolean;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: authStatus, isLoading, error } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/register", { username, password });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
    },
  });

  return {
    isLoading,
    error,
    isAuthenticated: authStatus?.authenticated ?? false,
    accountMode: authStatus?.accountMode ?? "multi",
    user: authStatus?.user,
    registrationEnabled: authStatus?.registrationEnabled ?? true,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}

export function useInstallStatus() {
  return useQuery<{
    installed: boolean;
    hasUsers: boolean;
    accountMode: string;
  }>({
    queryKey: ["/api/install/status"],
    staleTime: 1000 * 60 * 5,
  });
}
