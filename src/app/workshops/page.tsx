import { Metadata } from 'next';
import { auth } from "@/lib/auth";
// Removed authOptions import - using auth() directly;
import { prisma } from '@/lib/prisma';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import WorkshopList from '@/components/WorkshopList';
import CreateWorkshopForm from '@/components/CreateWorkshopForm';
import { Plus } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Workshops | PinkLife',
  description: 'Join virtual beauty workshops and learn from experts',
};

export default async function WorkshopsPage() {
  const session = await auth();
  const user = session?.user?.email ? await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, subscriptionTier: true },
  }) : null;

  const [upcomingWorkshops, userWorkshops] = await Promise.all([
    prisma.workshop.findMany({
      where: {
        startTime: {
          gte: new Date(),
        },
        status: 'SCHEDULED',
      },
      orderBy: {
        startTime: 'asc',
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        attendees: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    }),
    user ? prisma.workshop.findMany({
      where: {
        OR: [
          { hostId: user.id },
          { attendees: { some: { id: user.id } } },
        ],
      },
      orderBy: {
        startTime: 'asc',
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        attendees: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    }) : [],
  ]);

  return (
    <div className="container max-w-5xl py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Beauty Workshops</h1>
          <p className="text-muted-foreground">
            Join virtual workshops and learn from beauty experts
          </p>
        </div>

        {user?.subscriptionTier === 'VIP' && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Host Workshop
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create Workshop</DialogTitle>
                <DialogDescription>
                  Fill in the details to host a new beauty workshop
                </DialogDescription>
              </DialogHeader>
              <CreateWorkshopForm />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Workshops</TabsTrigger>
          {user && <TabsTrigger value="my-workshops">My Workshops</TabsTrigger>}
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <WorkshopList
            workshops={upcomingWorkshops}
            currentUserId={user?.id}
          />
        </TabsContent>

        {user && (
          <TabsContent value="my-workshops" className="space-y-4">
            <WorkshopList
              workshops={userWorkshops}
              currentUserId={user.id}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
} 