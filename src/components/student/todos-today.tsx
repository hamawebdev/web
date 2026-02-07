// @ts-nocheck
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  BookOpen,
  Target,
  Calendar,
  CheckCircle,
  AlertCircle,
  FileText,
  Play,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TodoItem } from '@/types/api'

interface TodosTodayProps {
  todos: TodoItem[]
  loading?: boolean
}

export function TodosToday({ todos, loading }: TodosTodayProps) {
  // Format date to DD/MM/YYYY HH:mm
  const formatDueDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  // Get icon for todo type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EXAM':
        return Target;
      case 'PRACTICE':
        return Play;
      case 'READING':
        return BookOpen;
      default:
        return FileText;
    }
  };

  // Get priority color using design system colors
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'MEDIUM':
        return 'bg-chart-4/10 text-chart-4 border-chart-4/20';
      case 'LOW':
        return 'bg-chart-1/10 text-chart-1 border-chart-1/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  // Get status color and icon using design system colors
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return {
          color: 'bg-chart-1/10 text-chart-1 border-chart-1/20',
          icon: CheckCircle,
        };
      case 'IN_PROGRESS':
        return {
          color: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
          icon: Play,
        };
      case 'PENDING':
        return {
          color: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
          icon: Clock,
        };
      default:
        return {
          color: 'bg-muted/10 text-muted-foreground border-muted/20',
          icon: AlertCircle,
        };
    }
  };

  if (loading) {
    return (
      <Card className="relative overflow-hidden transition-all duration-300 ease-out hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 border-border/50 hover:border-primary/20">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-lg font-bold text-foreground">
            <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg border border-primary/20">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            Tâches d'aujourd'hui
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground font-medium mt-1">
            Chargement de vos tâches...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-muted/30 rounded-lg animate-pulse border border-border/50">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-3/4 mb-3"></div>
              <div className="flex gap-2 mb-3">
                <div className="h-6 w-16 bg-muted rounded"></div>
                <div className="h-6 w-20 bg-muted rounded"></div>
                <div className="h-6 w-16 bg-muted rounded"></div>
              </div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden transition-all duration-300 ease-out hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 border-border/50 hover:border-primary/20">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-3 text-lg font-bold text-foreground">
          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg border border-primary/20">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          Tâches d'aujourd'hui
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground font-medium mt-1">
          Vos tâches prioritaires pour aujourd'hui
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {todos.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <div className="text-sm font-medium">Aucun élément disponible.</div>
          </div>
        ) : (
          todos.map((todo) => {
            const TypeIcon = getTypeIcon(todo.type);
            const statusInfo = getStatusInfo(todo.status);
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={todo.id}
                className="p-4 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-all duration-300 ease-out hover:shadow-sm"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-md flex-shrink-0 border border-primary/20">
                    <TypeIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base line-clamp-1 mb-1 text-foreground">
                      {todo.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-2 font-medium">
                      {todo.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="outline" className={cn("text-xs font-semibold px-2.5 py-1", getPriorityColor(todo.priority))}>
                    {todo.priority}
                  </Badge>
                  <Badge variant="outline" className={cn("text-xs flex items-center gap-1.5 font-semibold px-2.5 py-1", statusInfo.color)}>
                    <StatusIcon className="h-3 w-3" />
                    {todo.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 bg-chart-3/10 text-chart-3 border-chart-3/20">
                    {todo.type}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                  <Clock className="h-4 w-4" />
                  <span>Échéance: {formatDueDate(todo.dueDate)}</span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
