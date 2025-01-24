import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, SparklesIcon, ActivityIcon, CrownIcon, CalendarIcon, BotIcon, HistoryIcon, CreditCardIcon, TicketIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SmartMirror from "./SmartMirror";
import BeautyRiskAssessment from "./BeautyRiskAssessment";
import AndiVirtualEsthetician from "./AndiVirtualEsthetician";
import { useState } from "react";

interface VIPSectionProps {
  isVIP: boolean;
  isPinkU: boolean;
}

export default function VIPSection({ isVIP, isPinkU }: VIPSectionProps) {
  const [showAssessment, setShowAssessment] = useState(false);

  // Mock data - replace with real data from your backend
  const bankedServices = [
    { name: "Facial Treatment", credits: 2 },
    { name: "Consultation", credits: 1 },
  ];

  const treatmentHistory = [
    { date: "2024-03-15", treatment: "Hydrafacial", provider: "Dr. Smith" },
    { date: "2024-02-28", treatment: "Skin Analysis", provider: "Dr. Johnson" },
  ];

  if (!isVIP && !isPinkU) {
    return (
      <Card className="bg-gradient-to-r from-pink-50/20 to-purple-50/20 border-pink-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-pink-500" />
            <span>Unlock Premium Features</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Start your 7-day free trial to get a complimentary Beauty Risk Assessment. Subscribe to PinkU ($30/month) or PinkVIP ($155/month) to unlock all exclusive content and features.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-white/50 border border-pink-100">
                <div className="flex items-center gap-2 mb-2">
                  <SparklesIcon className="w-5 h-5 text-pink-500" />
                  <h3 className="font-semibold">Pink U</h3>
                </div>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                  <li>Basic Beauty Risk Assessment</li>
                  <li>Community Features</li>
                  <li>Monthly Digital Content</li>
                  <li>Basic Smart Mirror Access</li>
                  <li>Basic Andi Access</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-white/50 border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <CrownIcon className="w-5 h-5 text-purple-500" />
                  <h3 className="font-semibold">Pink VIP</h3>
                </div>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                  <li>Priority Beauty Risk Assessment</li>
                  <li>1-on-1 Virtual Consultations</li>
                  <li>Exclusive Events & Meetups</li>
                  <li>Premium Content Access</li>
                  <li>Unlimited Smart Mirror Analysis</li>
                  <li>Premium Andi Access</li>
                  <li>Monthly Treatment Credits</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">
          {isVIP ? "Pink VIP Experience" : "Pink U Experience"}
        </h2>
        <Badge variant="secondary" className={isVIP ? "bg-purple-100 text-purple-700" : "bg-pink-100 text-pink-700"}>
          {isVIP ? "Pink VIP" : "Pink U"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Smart Mirror */}
        <Card className="bg-gradient-to-br from-pink-50/10 to-purple-50/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ActivityIcon className="w-5 h-5 text-pink-500" />
              Smart Mirror Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SmartMirror isVIP={isVIP} />
          </CardContent>
        </Card>

        {/* Andi */}
        <Card className="bg-gradient-to-br from-pink-50/10 to-purple-50/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BotIcon className="w-5 h-5 text-pink-500" />
              Andi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AndiVirtualEsthetician />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Beauty Risk Assessment */}
        <Card className="bg-gradient-to-br from-pink-50/10 to-purple-50/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ActivityIcon className="w-5 h-5 text-pink-500" />
              Beauty Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Get personalized recommendations and insights with our advanced beauty assessment.
            </p>
            <Button onClick={() => setShowAssessment(true)} className="w-full">
              Start Assessment
            </Button>
          </CardContent>
        </Card>

        {/* Services & History */}
        <Card className="bg-gradient-to-br from-pink-50/10 to-purple-50/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCardIcon className="w-5 h-5 text-pink-500" />
              My Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Banked Services */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4 text-pink-500" />
                  Banked Services
                </h3>
                <ul className="space-y-2">
                  {bankedServices.map((service, index) => (
                    <li key={index} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span>{service.name}</span>
                        <Badge variant="secondary">{service.credits} credits</Badge>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => {
                          // Add redemption logic here
                        }}
                      >
                        <TicketIcon className="w-4 h-4" />
                        Redeem Service
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Treatment History */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <HistoryIcon className="w-4 h-4 text-pink-500" />
                  Treatment History
                </h3>
                <ul className="space-y-2">
                  {treatmentHistory.map((item, index) => (
                    <li key={index} className="text-sm space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{item.treatment}</span>
                        <span className="text-muted-foreground">{new Date(item.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-muted-foreground">{item.provider}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BeautyRiskAssessment
        open={showAssessment}
        onClose={(updated) => {
          setShowAssessment(false);
        }}
      />
    </div>
  );
} 