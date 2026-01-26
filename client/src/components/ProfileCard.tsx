import { Profile } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Terminal, Settings } from "lucide-react";
import { useLocation } from "wouter";

interface ProfileCardProps {
  profile: Profile;
  onEdit: (profile: Profile) => void;
  onDelete: (id: number) => void;
}

export function ProfileCard({ profile, onEdit, onDelete }: ProfileCardProps) {
  const [, setLocation] = useLocation();

  return (
    <Card className="group relative overflow-hidden border-border bg-card/50 hover:bg-card hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-primary/10">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/0 via-primary/50 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          <span className="text-xl font-display tracking-wide text-primary-foreground group-hover:text-primary transition-colors">
            {profile.name}
          </span>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:text-accent hover:bg-accent/10"
              onClick={() => onEdit(profile)}
              aria-label={`Edit ${profile.name}`}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(profile.id)}
              aria-label={`Delete ${profile.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
          <span className="w-16">HOST:</span>
          <span className="text-foreground">{profile.host}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
          <span className="w-16">PORT:</span>
          <span className="text-foreground">{profile.port}</span>
        </div>
      </CardContent>

      <CardFooter>
        <Button 
          className="w-full font-bold tracking-wider group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-md hover:shadow-primary/25"
          onClick={() => setLocation(`/play/${profile.id}`)}
        >
          <Terminal className="mr-2 w-4 h-4" />
          CONNECT
        </Button>
      </CardFooter>
    </Card>
  );
}
