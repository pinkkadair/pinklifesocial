import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from "@/lib/auth";
// Removed authOptions import - using auth() directly;
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, Video, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import WorkshopClient from './WorkshopClient';

interface Props {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const workshop = await prisma.workshop.findUnique({
    where: { id: params.id },
    select: { title: true, description: true },
  });

  if (!workshop) {
    return {
      title: 'Workshop Not Found | PinkLife',
      description: 'The requested workshop could not be found.',
    };
  }

  return {
    title: `${workshop.title} | PinkLife Workshops`,
    description: workshop.description,
  };
}

export default async function WorkshopPage({ params }: Props) {
  const session = await auth();
  const user = session?.user?.email ? await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, subscriptionTier: true },
  }) : null;

  const workshop = await prisma.workshop.findUnique({
    where: { id: params.id },
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
  });

  if (!workshop) {
    notFound();
  }

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

  return (
    <div className="container max-w-5xl py-8">
      <Link href="/workshops" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Workshops
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{workshop.title}</CardTitle>
              <p className="text-muted-foreground">{workshop.description}</p>
            </div>
            <Badge className={getStatusColor(workshop.status)}>
              {workshop.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{format(new Date(workshop.startTime), 'PPP')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>
                  {format(new Date(workshop.startTime), 'p')} - {format(new Date(workshop.endTime), 'p')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>
                  {workshop.attendees.length}/{workshop.maxAttendees} attendees
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={workshop.host.image || undefined} />
                  <AvatarFallback>
                    {workshop.host.name?.[0] || workshop.host.username[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{workshop.host.name || workshop.host.username}</p>
                  <p className="text-sm text-muted-foreground">Workshop Host</p>
                </div>
              </div>

              {workshop.recording && (
                <Link
                  href={workshop.recording}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
                >
                  <Video className="w-4 h-4" />
                  Watch Recording
                </Link>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Attendees</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {workshop.attendees.map((attendee) => (
                  <div key={attendee.id} className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={attendee.image || undefined} />
                      <AvatarFallback>
                        {attendee.name?.[0] || attendee.username[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{attendee.name || attendee.username}</span>
                  </div>
                ))}
              </div>
            </div>

            <WorkshopClient
              workshop={workshop}
              currentUserId={user?.id}
              userSubscriptionTier={user?.subscriptionTier}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 