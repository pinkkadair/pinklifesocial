'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, Video } from 'lucide-react';
import { format } from 'date-fns';
import { Prisma } from "@prisma/client";
import { joinWorkshop, leaveWorkshop } from '@/actions/workshop.action';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';

type WorkshopWithRelations = Prisma.WorkshopGetPayload<{
  include: {
    host: {
      select: {
        id: true;
        name: true;
        username: true;
        image: true;
      };
    };
    attendees: {
      select: {
        id: true;
        name: true;
        username: true;
        image: true;
      };
    };
  };
}>;

interface WorkshopListProps {
  workshops: WorkshopWithRelations[];
  currentUserId?: string;
  onWorkshopUpdate?: (workshop: WorkshopWithRelations) => void;
}

export default function WorkshopList({ workshops, currentUserId, onWorkshopUpdate }: WorkshopListProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleJoinWorkshop = async (workshopId: string) => {
    try {
      setLoading(workshopId);
      const updatedWorkshop = await joinWorkshop(workshopId);
      toast({
        title: 'Success',
        description: 'You have successfully joined the workshop',
      });
      onWorkshopUpdate?.(updatedWorkshop);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to join workshop',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleLeaveWorkshop = async (workshopId: string) => {
    try {
      setLoading(workshopId);
      const updatedWorkshop = await leaveWorkshop(workshopId);
      toast({
        title: 'Success',
        description: 'You have left the workshop',
      });
      onWorkshopUpdate?.(updatedWorkshop);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to leave workshop',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (workshops.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No workshops available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {workshops.map((workshop) => (
        <Card key={workshop.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle>{workshop.title}</CardTitle>
                <CardDescription>{workshop.description}</CardDescription>
              </div>
              <Badge className={getStatusColor(workshop.status)}>
                {workshop.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(new Date(workshop.startTime), 'PPP')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(new Date(workshop.startTime), 'p')} - {format(new Date(workshop.endTime), 'p')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src={workshop.host.image || undefined} />
                      <AvatarFallback>
                        {workshop.host.name?.[0] || workshop.host.username[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{workshop.host.name || workshop.host.username}</p>
                      <p className="text-xs text-muted-foreground">Host</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {workshop.attendees.length}/{workshop.maxAttendees} attendees
                    </span>
                  </div>
                </div>

                {workshop.status === 'SCHEDULED' && currentUserId && (
                  workshop.attendees.some(a => a.id === currentUserId) ? (
                    <Button
                      variant="outline"
                      onClick={() => handleLeaveWorkshop(workshop.id)}
                      disabled={loading === workshop.id}
                    >
                      {loading === workshop.id ? (
                        <LoadingSpinner className="w-4 h-4" />
                      ) : (
                        'Leave Workshop'
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleJoinWorkshop(workshop.id)}
                      disabled={loading === workshop.id || workshop.attendees.length >= workshop.maxAttendees}
                    >
                      {loading === workshop.id ? (
                        <LoadingSpinner className="w-4 h-4" />
                      ) : workshop.attendees.length >= workshop.maxAttendees ? (
                        'Workshop Full'
                      ) : (
                        'Join Workshop'
                      )}
                    </Button>
                  )
                )}

                {workshop.recording && (
                  <Button variant="outline" className="gap-2">
                    <Video className="w-4 h-4" />
                    Watch Recording
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 