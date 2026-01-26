import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateProfileRequest, type UpdateProfileRequest } from "@shared/routes";

// GET /api/profiles
export function useProfiles() {
  return useQuery({
    queryKey: [api.profiles.list.path],
    queryFn: async () => {
      const res = await fetch(api.profiles.list.path, { credentials: "include" });
      if (!res.ok) throw new Error('Failed to fetch profiles');
      return api.profiles.list.responses[200].parse(await res.json());
    },
  });
}

// GET /api/profiles/:id
export function useProfile(id: number) {
  return useQuery({
    queryKey: [api.profiles.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.profiles.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch profile');
      return api.profiles.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// POST /api/profiles
export function useCreateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateProfileRequest) => {
      const validated = api.profiles.create.input.parse(data);
      const res = await fetch(api.profiles.create.path, {
        method: api.profiles.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message);
        }
        throw new Error('Failed to create profile');
      }
      return api.profiles.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.profiles.list.path] }),
  });
}

// PUT /api/profiles/:id
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & UpdateProfileRequest) => {
      const validated = api.profiles.update.input.parse(updates);
      const url = buildUrl(api.profiles.update.path, { id });
      const res = await fetch(url, {
        method: api.profiles.update.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400 || res.status === 404) {
          const error = await res.json();
          throw new Error(error.message);
        }
        throw new Error('Failed to update profile');
      }
      return api.profiles.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.profiles.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.profiles.get.path, variables.id] });
    },
  });
}

// DELETE /api/profiles/:id
export function useDeleteProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.profiles.delete.path, { id });
      const res = await fetch(url, { method: api.profiles.delete.method, credentials: "include" });
      if (!res.ok && res.status !== 404) throw new Error('Failed to delete profile');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.profiles.list.path] }),
  });
}
