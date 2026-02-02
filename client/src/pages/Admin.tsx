import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Loader2, Plus, Trash2, Shield, ShieldOff, ArrowLeft, Users, Settings2, Pencil } from "lucide-react";

interface User {
  id: string;
  username: string;
  isAdmin: boolean;
  createdAt: string;
}

interface AppConfig {
  accountMode: string;
  registrationEnabled: boolean;
  appName: string;
  installed: boolean;
}

export default function Admin() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editPassword, setEditPassword] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: config, isLoading: configLoading } = useQuery<AppConfig>({
    queryKey: ["/api/admin/config"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; isAdmin: boolean }) => {
      const res = await apiRequest("POST", "/api/admin/users", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setCreateDialogOpen(false);
      setNewUsername("");
      setNewPassword("");
      setNewIsAdmin(false);
      toast({ title: "User created successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to create user",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; username?: string; password?: string; isAdmin?: boolean }) => {
      const res = await apiRequest("PUT", `/api/admin/users/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditDialogOpen(false);
      setEditingUser(null);
      setEditPassword("");
      toast({ title: "User updated successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to update user",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setDeleteDialogOpen(false);
      setDeletingUser(null);
      toast({ title: "User deleted" });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete user",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (data: Partial<AppConfig>) => {
      const res = await apiRequest("PUT", "/api/admin/config", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
      toast({ title: "Settings saved" });
    },
    onError: (error) => {
      toast({
        title: "Failed to save settings",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (newUsername.trim().length < 3) {
      toast({ title: "Username must be at least 3 characters", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    createUserMutation.mutate({ username: newUsername.trim(), password: newPassword, isAdmin: newIsAdmin });
  };

  const handleEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const updates: { id: string; password?: string; isAdmin?: boolean } = { id: editingUser.id };
    if (editPassword.length > 0) {
      if (editPassword.length < 6) {
        toast({ title: "Password must be at least 6 characters", variant: "destructive" });
        return;
      }
      updates.password = editPassword;
    }
    updateUserMutation.mutate(updates);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setEditPassword("");
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  };

  const isLoading = usersLoading || configLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage users and application settings</p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Users</CardTitle>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-create-user">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateUser}>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>Add a new user account to the system.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-username">Username</Label>
                      <Input
                        id="new-username"
                        data-testid="input-new-username"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="username"
                        autoComplete="off"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Password</Label>
                      <Input
                        id="new-password"
                        data-testid="input-new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="new-admin">Administrator</Label>
                      <Switch
                        id="new-admin"
                        data-testid="switch-new-admin"
                        checked={newIsAdmin}
                        onCheckedChange={setNewIsAdmin}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createUserMutation.isPending} data-testid="button-submit-create">
                      {createUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create User
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {users && users.length > 0 ? (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      {user.isAdmin ? (
                        <Shield className="h-5 w-5 text-primary" />
                      ) : (
                        <ShieldOff className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.isAdmin ? "Administrator" : "User"}
                          {user.id === currentUser?.id && " (You)"}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(user)}
                        data-testid={`button-edit-user-${user.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {user.id !== currentUser?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(user)}
                          data-testid={`button-delete-user-${user.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No users found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              <CardTitle>Application Settings</CardTitle>
            </div>
            <CardDescription>Configure how the application behaves</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Allow New Registrations</Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, new users can create accounts themselves
                </p>
              </div>
              <Switch
                checked={config?.registrationEnabled ?? true}
                onCheckedChange={(checked) => updateConfigMutation.mutate({ registrationEnabled: checked })}
                disabled={updateConfigMutation.isPending}
                data-testid="switch-registration"
              />
            </div>
            <div className="pt-2 border-t">
              <div className="text-sm text-muted-foreground">
                Account Mode: <span className="font-medium">{config?.accountMode === "single" ? "Single User" : "Multi-User"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <form onSubmit={handleEditUser}>
              <DialogHeader>
                <DialogTitle>Edit User: {editingUser?.username}</DialogTitle>
                <DialogDescription>Update user settings</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-password">New Password (leave blank to keep current)</Label>
                  <Input
                    id="edit-password"
                    data-testid="input-edit-password"
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="New password"
                    autoComplete="new-password"
                  />
                </div>
                {editingUser && editingUser.id !== currentUser?.id && (
                  <div className="flex items-center justify-between">
                    <Label>Administrator</Label>
                    <Switch
                      checked={editingUser.isAdmin}
                      onCheckedChange={(checked) => {
                        updateUserMutation.mutate({ id: editingUser.id, isAdmin: checked });
                      }}
                      disabled={updateUserMutation.isPending}
                      data-testid="switch-edit-admin"
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={updateUserMutation.isPending} data-testid="button-submit-edit">
                  {updateUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deletingUser?.username}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} data-testid="button-cancel-delete">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deletingUser && deleteUserMutation.mutate(deletingUser.id)}
                disabled={deleteUserMutation.isPending}
                data-testid="button-confirm-delete"
              >
                {deleteUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
