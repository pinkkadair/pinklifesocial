'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { joinWorkshop, leaveWorkshop, updateWorkshopStatus } from '@/actions/workshop.action';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Prisma } from "@prisma/client";
import EditWorkshopForm from '@/components/EditWorkshopForm';
import WorkshopRecordingUpload from '@/components/WorkshopRecordingUpload';
import { Video, CheckCircle } from 'lucide-react';

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

interface WorkshopClientProps {
  workshop: WorkshopWithRelations;
  currentUserId?: string;
  userSubscriptionTier?: string;
}

export default function WorkshopClient({
  workshop,
  currentUserId,
  userSubscriptionTier,
}: WorkshopClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const isHost = currentUserId === workshop.host.id;
  const isAttending = workshop.attendees.some((attendee: { id: string }) => attendee.id === currentUserId);
  const isFull = workshop.attendees.length >= workshop.maxAttendees;
  const canJoin = currentUserId && userSubscriptionTier !== 'FREE' && !isHost && !isAttending && !isFull;
  const hasEnded = new Date(workshop.endTime) <= new Date();

  const handleJoinWorkshop = async () => {
    try {
      setLoading(true);
      await joinWorkshop(workshop.id);
      toast({
        title: 'Success',
        description: 'You have successfully joined the workshop',
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to join workshop',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveWorkshop = async () => {
    try {
      setLoading(true);
      await leaveWorkshop(workshop.id);
      toast({
        title: 'Success',
        description: 'You have left the workshop',
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to leave workshop',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelWorkshop = async () => {
    try {
      setLoading(true);
      await updateWorkshopStatus(workshop.id, 'CANCELLED');
      toast({
        title: 'Success',
        description: 'Workshop has been cancelled',
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel workshop',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteWorkshop = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workshops/${workshop.id}/complete`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      toast({
        title: 'Success',
        description: 'Workshop marked as completed',
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to complete workshop',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditSuccess = () => {
    setShowEditDialog(false);
    router.refresh();
  };

  const handleUploadSuccess = () => {
    setShowUploadDialog(false);
    router.refresh();
  };

  if (workshop.status === 'CANCELLED') {
    return null;
  }

  return (
    <div className="flex justify-end gap-4">
      {workshop.status === 'SCHEDULED' && (
        <>
          {canJoin && (
            <Button
              onClick={handleJoinWorkshop}
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Joining...
                </>
              ) : (
                'Join Workshop'
              )}
            </Button>
          )}

          {isAttending && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={loading}>
                  {loading ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Leaving...
                    </>
                  ) : (
                    'Leave Workshop'
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave Workshop</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to leave this workshop? You can rejoin later if spots are available.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLeaveWorkshop}>
                    Leave Workshop
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {isHost && (
            <>
              <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">Edit Workshop</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Edit Workshop</DialogTitle>
                    <DialogDescription>
                      Update workshop details
                    </DialogDescription>
                  </DialogHeader>
                  <EditWorkshopForm
                    workshop={workshop}
                    onSuccess={handleEditSuccess}
                  />
                </DialogContent>
              </Dialog>

              {hasEnded ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={loading}>
                      {loading ? (
                        <>
                          <LoadingSpinner className="mr-2 h-4 w-4" />
                          Completing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Complete Workshop
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Complete Workshop</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to mark this workshop as completed? You can upload the recording afterward.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCompleteWorkshop}>
                        Complete Workshop
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={loading}>
                      {loading ? (
                        <>
                          <LoadingSpinner className="mr-2 h-4 w-4" />
                          Cancelling...
                        </>
                      ) : (
                        'Cancel Workshop'
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Workshop</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel this workshop? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Workshop</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancelWorkshop}>
                        Yes, Cancel Workshop
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          )}
        </>
      )}

      {workshop.status === 'COMPLETED' && workshop.recording && (
        <Button variant="outline" className="gap-2" asChild>
          <a href={workshop.recording} target="_blank" rel="noopener noreferrer">
            <Video className="w-4 h-4" />
            Watch Recording
          </a>
        </Button>
      )}

      {isHost && workshop.status === 'COMPLETED' && !workshop.recording && (
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">Upload Recording</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Workshop Recording</DialogTitle>
              <DialogDescription>
                Upload the recorded session for attendees to watch later
              </DialogDescription>
            </DialogHeader>
            <WorkshopRecordingUpload
              workshopId={workshop.id}
              onSuccess={handleUploadSuccess}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 