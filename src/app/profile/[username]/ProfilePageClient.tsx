"use client";

import { getProfileByUsername, getUserPosts, updateProfile } from "@/actions/profile.action";
import { toggleFollow } from "@/actions/user.action";
import PostCard from "@/components/PostCard";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useSession, signIn } from "next-auth/react";
import { format } from "date-fns";
import {
  CalendarIcon,
  EditIcon,
  FileTextIcon,
  HeartIcon,
  LinkIcon,
  MapPinIcon,
  BotIcon,
  MessageCircleIcon,
  Crown,
  Sparkles,
  Gem,
} from "lucide-react";
import { useState, Suspense } from "react";
import toast from "react-hot-toast";
import BeautyRiskAdvisor from "@/components/BeautyRiskAdvisor";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { RiskFactorType, RiskSeverity } from "@prisma/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorBoundary } from "react-error-boundary";
import MembershipDialog from "@/components/MembershipDialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ProfileImageUpload } from "@/components/ProfileImageUpload";
import { SUBSCRIPTION_PLANS } from "@/lib/stripe";

interface User {
  id: string;
  email: string;
  username: string;
  name: string | null;
  bio: string | null;
  image: string | null;
  location: string | null;
  website: string | null;
  subscriptionTier: 'FREE' | 'PINKU' | 'VIP';
  createdAt: Date;
  beautyRisk: {
    id: string;
    riskScore: number;
    lastUpdated: Date;
    factors: Array<{
      id: string;
      type: RiskFactorType;
      severity: RiskSeverity;
      description: string;
      recommendation?: string | null;
    }>;
  } | null;
  _count: {
    followers: number;
    following: number;
    posts: number;
  };
}

interface Post {
  id: string;
  content: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  author: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
  };
  comments: Array<{
    id: string;
    content: string;
    createdAt: Date;
    authorId: string;
    postId: string;
    author: {
      id: string;
      name: string | null;
      username: string;
      image: string | null;
    };
  }>;
  likes: Array<{
    userId: string;
  }>;
  _count: {
    likes: number;
    comments: number;
  };
}

interface ProfilePageClientProps {
  user: User;
  posts: Post[];
  likedPosts: Post[];
  isFollowing: boolean;
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <Button onClick={resetErrorBoundary}>Try again</Button>
    </div>
  );
}

function SmartMirror() {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <div className="rounded-full bg-pink-100 p-2">
              <Sparkles className="h-4 w-4 text-pink-500" />
            </div>
            Smart Mirror Analysis
          </CardTitle>
          <CardDescription>
            AI-powered skin analysis and tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="features">
              <AccordionTrigger>View Features</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-4 text-muted-foreground space-y-1">
                  <li>Real-time skin analysis</li>
                  <li>Progress tracking over time</li>
                  <li>Personalized skincare recommendations</li>
                  <li>Before & after comparisons</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Button className="w-full mt-4">Start Analysis</Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <div className="rounded-full bg-pink-100 p-2">
              <MessageCircleIcon className="h-4 w-4 text-pink-500" />
            </div>
            PinkU Community Access
          </CardTitle>
          <CardDescription>
            Connect with beauty enthusiasts and experts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="benefits">
              <AccordionTrigger>View Benefits</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-4 text-muted-foreground space-y-1">
                  <li>Exclusive PinkU community forums</li>
                  <li>Monthly virtual beauty workshops</li>
                  <li>Early access to beauty events</li>
                  <li>Product testing opportunities</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Button className="w-full mt-4">Join Community</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AndiVirtualEsthetician() {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <div className="rounded-full bg-pink-100 p-2">
              <BotIcon className="h-4 w-4 text-pink-500" />
            </div>
            Andi Virtual Esthetician
          </CardTitle>
          <CardDescription>
            Your personal AI esthetician for advanced skincare guidance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="features">
              <AccordionTrigger>View Features</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-4 text-muted-foreground space-y-1">
                  <li>Advanced skin condition analysis</li>
                  <li>Custom treatment plans</li>
                  <li>24/7 skincare consultation</li>
                  <li>Progress monitoring and adjustments</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Button className="w-full mt-4">Start Consultation</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <div className="rounded-full bg-pink-100 p-2">
              <Crown className="h-4 w-4 text-pink-500" />
            </div>
            PinkFacials & Treatments
          </CardTitle>
          <CardDescription>
            Exclusive access to premium aesthetic treatments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="benefits">
              <AccordionTrigger>View Benefits</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-4 text-muted-foreground space-y-1">
                  <li>Priority booking for treatments</li>
                  <li>Exclusive monthly facial session</li>
                  <li>Personalized treatment plans</li>
                  <li>VIP pricing on additional services</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Button className="w-full mt-4">Book Treatment</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileContent({ user, posts, likedPosts, isFollowing: initialIsFollowing }: ProfilePageClientProps) {
  const { data: session } = useSession();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMembershipDialog, setShowMembershipDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user.name || "",
    bio: user.bio || "",
    location: user.location || "",
    website: user.website || "",
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  const handleEditSubmit = async () => {
    if (isUpdatingProfile) return;
    try {
      setIsUpdatingProfile(true);
      const formData = new FormData();
      formData.append("name", editForm.name);
      formData.append("bio", editForm.bio);
      formData.append("location", editForm.location);
      formData.append("website", editForm.website);
      
      const result = await updateProfile(formData);
      if (result?.success) {
        toast.success("Profile updated successfully");
        setShowEditDialog(false);
      } else {
        toast.error(result?.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("Error updating profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleFollow = async () => {
    if (!session) {
      signIn();
      return;
    }

    if (isUpdatingFollow) return;
    try {
      setIsUpdatingFollow(true);
      setIsFollowing((prev) => !prev);
      const result = await toggleFollow(user.id);
      if (!result?.success) {
        setIsFollowing((prev) => !prev);
        toast.error(result?.error || "Failed to update follow status");
      }
    } catch (error) {
      setIsFollowing((prev) => !prev);
      toast.error("Error updating follow status");
    } finally {
      setIsUpdatingFollow(false);
    }
  };

  const isOwnProfile = session?.user?.email === user.email;
  const isVIP = user.subscriptionTier === "VIP";
  const isPinkU = user.subscriptionTier === "PINKU";

  // Add handlers for post interactions
  const handleLike = async (postId: string) => {
    if (!session) {
      signIn();
      return;
    }
    // Like functionality will be handled within PostCard component
  };

  const handleComment = async (postId: string, content: string) => {
    if (!session) {
      signIn();
      return;
    }
    // Comment functionality will be handled within PostCard component
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            {isOwnProfile ? (
              <ProfileImageUpload
                currentImage={user.image}
                username={user.username}
                name={user.name}
              />
            ) : (
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.image || ""} alt={user.name || ""} />
              </Avatar>
            )}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-2xl font-bold">{user.name}</h1>
                {isVIP && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="secondary" className="gap-1 bg-purple-100 text-purple-700">
                          <Crown className="h-3 w-3" />
                          VIP
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>VIP Member - Access to exclusive features</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className="text-muted-foreground">@{user.username}</p>
              {user.bio && <p className="max-w-md">{user.bio}</p>}
              <div className="flex items-center justify-center gap-4 text-muted-foreground">
                {user.location && (
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="h-4 w-4" />
                    <span>{user.location}</span>
                  </div>
                )}
                {user.website && (
                  <div className="flex items-center gap-1">
                    <LinkIcon className="h-4 w-4" />
                    <a href={user.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                      {user.website}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Joined {format(new Date(user.createdAt), 'MMMM yyyy')}</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-6 pt-2">
                <div className="text-center">
                  <p className="font-bold">{user._count.posts}</p>
                  <p className="text-muted-foreground text-sm">Posts</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{user._count.followers}</p>
                  <p className="text-muted-foreground text-sm">Followers</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{user._count.following}</p>
                  <p className="text-muted-foreground text-sm">Following</p>
                </div>
              </div>
            </div>
            {!isOwnProfile ? (
              <Button
                onClick={handleFollow}
                disabled={isUpdatingFollow}
                variant={isFollowing ? "outline" : "default"}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <EditIcon className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, name: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={editForm.bio}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, bio: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={editForm.location}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, location: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={editForm.website}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, website: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleEditSubmit} disabled={isUpdatingProfile}>
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                {!isVIP && (
                  <MembershipDialog
                    currentTier={user.subscriptionTier}
                    onClose={() => setShowMembershipDialog(false)}
                  >
                    <Button variant="default" className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      Upgrade Membership
                    </Button>
                  </MembershipDialog>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="likes">Likes</TabsTrigger>
          <TabsTrigger value="beauty-suite">Beauty Suite</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              dbUserId={session?.user?.id ?? null}
            />
          ))}
          {posts.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <FileTextIcon className="mx-auto h-8 w-8 mb-2" />
                <p>No posts yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="likes" className="space-y-4">
          {likedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              dbUserId={session?.user?.id ?? null}
            />
          ))}
          {likedPosts.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <HeartIcon className="mx-auto h-8 w-8 mb-2" />
                <p>No liked posts yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="beauty-suite" className="space-y-8">
          {/* Free Tier Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-full bg-pink-100 p-2">
                <Sparkles className="h-4 w-4 text-pink-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Free Features</h3>
                <p className="text-sm text-muted-foreground">Available to all members</p>
              </div>
            </div>
            <BeautyRiskAdvisor beautyRisk={user.beautyRisk} />
          </div>

          {/* PinkU Tier Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-full bg-pink-100 p-2">
                <Gem className="h-4 w-4 text-pink-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">PinkU Features</h3>
                <p className="text-sm text-muted-foreground">Enhanced beauty analysis and community</p>
              </div>
            </div>
            {isPinkU ? (
              <SmartMirror />
            ) : (
              <Card className="border-2 border-pink-100">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <div className="rounded-full bg-pink-100 p-2">
                      <Gem className="h-4 w-4 text-pink-500" />
                    </div>
                    Upgrade to PinkU
                  </CardTitle>
                  <CardDescription>
                    Get access to Smart Mirror technology and exclusive community features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full mb-4">
                    <AccordionItem value="features">
                      <AccordionTrigger>View Features</AccordionTrigger>
                      <AccordionContent>
                        <ul className="list-disc pl-4 text-muted-foreground space-y-1">
                          <li>Smart Mirror skin analysis</li>
                          <li>Progress tracking</li>
                          <li>PinkU community access</li>
                          <li>Monthly beauty workshops</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  <Button asChild className="w-full">
                    <Link href="/membership">Upgrade to PinkU</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* VIP Tier Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-full bg-pink-100 p-2">
                <Crown className="h-4 w-4 text-pink-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">VIP Features</h3>
                <p className="text-sm text-muted-foreground">Premium treatments and personalized care</p>
              </div>
            </div>
            {isVIP ? (
              <AndiVirtualEsthetician />
            ) : (
              <Card className="border-2 border-pink-100">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <div className="rounded-full bg-pink-100 p-2">
                      <Crown className="h-4 w-4 text-pink-500" />
                    </div>
                    Upgrade to VIP
                  </CardTitle>
                  <CardDescription>
                    Experience the ultimate in personalized beauty care
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full mb-4">
                    <AccordionItem value="features">
                      <AccordionTrigger>View Features</AccordionTrigger>
                      <AccordionContent>
                        <ul className="list-disc pl-4 text-muted-foreground space-y-1">
                          <li>Andi Virtual Esthetician</li>
                          <li>Monthly PinkFacials</li>
                          <li>Priority treatment booking</li>
                          <li>VIP pricing on services</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  <Button asChild className="w-full">
                    <Link href="/membership">Upgrade to VIP</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ProfilePageClient(props: ProfilePageClientProps) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <Suspense fallback={<LoadingSpinner />}>
        <ProfileContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
