import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProfileSchema, type InsertProfile, type Profile } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateProfile, useUpdateProfile } from "@/hooks/use-profiles";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

interface CreateProfileDialogProps {
  existingProfile?: Profile | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateProfileDialog({ existingProfile, open, onOpenChange }: CreateProfileDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

  const createMutation = useCreateProfile();
  const updateMutation = useUpdateProfile();

  const form = useForm<InsertProfile>({
    resolver: zodResolver(insertProfileSchema),
    defaultValues: {
      name: "",
      host: "",
      port: 23,
      encoding: "ISO-8859-1",
      settings: {},
      triggers: [],
      aliases: [],
      scripts: [],
    },
  });

  useEffect(() => {
    if (existingProfile) {
      form.reset({
        name: existingProfile.name,
        host: existingProfile.host,
        port: existingProfile.port,
        encoding: existingProfile.encoding || "ISO-8859-1",
        settings: existingProfile.settings || {},
        triggers: existingProfile.triggers || [],
        aliases: existingProfile.aliases || [],
        scripts: existingProfile.scripts || [],
      });
    } else {
      form.reset({
        name: "",
        host: "",
        port: 23,
        encoding: "ISO-8859-1",
      });
    }
  }, [existingProfile, form, isOpen]);

  const onSubmit = async (data: InsertProfile) => {
    if (existingProfile) {
      await updateMutation.mutateAsync({ id: existingProfile.id, ...data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setIsOpen(false);
    form.reset();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Plus className="mr-2 w-4 h-4" />
            New Connection
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px] bg-card border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-tight">
            {existingProfile ? "Edit Connection" : "New Connection"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Achaea" {...field} className="bg-background font-mono" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="host"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Host Address</FormLabel>
                    <FormControl>
                      <Input placeholder="mud.example.com" {...field} className="bg-background font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Port</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        className="bg-background font-mono" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="encoding"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Encoding</FormLabel>
                  <FormControl>
                    <Input placeholder="ISO-8859-1" {...field} value={field.value ?? ''} className="bg-background font-mono" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Saving..." : (existingProfile ? "Update Connection" : "Create Connection")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
