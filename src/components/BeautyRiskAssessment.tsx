"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import MembershipDialog from "@/components/MembershipDialog";
import { RiskFactorType, RiskSeverity } from "@prisma/client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { calculateBeautyRiskAssessment, UserInputs } from "@/lib/beauty-risk-calculator";

const skinTypes = [
  { value: "Oily", label: "Oily" },
  { value: "Dry", label: "Dry" },
  { value: "Combination", label: "Combination" },
  { value: "Sensitive", label: "Sensitive" },
  { value: "Normal", label: "Normal" },
] as const;

const melanationTypes = [
  { value: "None", label: "None (Extremely Fair/Albinism)" },
  { value: "Light", label: "Light" },
  { value: "Medium", label: "Medium" },
  { value: "Dark", label: "Dark" },
  { value: "Very Dark", label: "Very Dark" },
  { value: "Mixed", label: "Mixed" },
] as const;

const skinConcerns = [
  { value: "ACNE", label: "Acne & Breakouts" },
  { value: "AGING", label: "Signs of Aging" },
  { value: "DRYNESS", label: "Dryness & Flaking" },
  { value: "SENSITIVITY", label: "Sensitivity & Redness" },
  { value: "PIGMENTATION", label: "Dark Spots & Pigmentation" },
  { value: "TEXTURE", label: "Uneven Texture" },
] as const;

const environmentalFactors = [
  { value: "UV_EXPOSURE", label: "High UV Exposure" },
  { value: "POLLUTION", label: "Air Pollution" },
  { value: "CLIMATE", label: "Harsh Climate" },
  { value: "STRESS", label: "High Stress Levels" },
  { value: "SLEEP", label: "Poor Sleep Quality" },
  { value: "DIET", label: "Unbalanced Diet" },
] as const;

const treatments = [
  { value: "DEEP_CHEMICAL_PEEL", label: "Deep Chemical Peel" },
  { value: "ABLATIVE_LASER", label: "Ablative Laser" },
  { value: "MICRONEEDLING", label: "Microneedling" },
  { value: "MEDIUM_PEEL", label: "Medium-Depth Peel" },
  { value: "LIGHT_PEEL", label: "Light Chemical Peel" },
  { value: "LED_THERAPY", label: "LED Light Therapy" },
] as const;

const formSchema = z.object({
  age: z.number().min(18, "Must be at least 18 years old").max(120, "Please enter a valid age"),
  gender: z.enum(["Female", "Male", "Non-binary", "Other"]),
  skinType: z.enum(["Oily", "Dry", "Combination", "Sensitive", "Normal"]),
  melanation: z.enum(["None", "Light", "Medium", "Dark", "Very Dark", "Mixed"]),
  concerns: z.array(z.string()).min(1, "Please select at least one skin concern"),
  underlyingConditions: z.array(z.string()),
  allergies: z.array(z.string()),
  medications: z.array(z.string()),
  smoking: z.boolean(),
  sunExposure: z.enum(["minimal", "moderate", "heavy"]),
  waterIntake: z.enum(["<1L", "1-2L", ">2L"]),
  treatmentsWanted: z.array(z.string()),
  pregnancyOrBreastfeeding: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface BeautyRiskAssessmentProps {
  open: boolean;
  onClose: (updated?: boolean) => void;
}

function BeautyRiskAssessment({ open, onClose }: BeautyRiskAssessmentProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      age: 25,
      gender: "Female",
      skinType: "Normal",
      melanation: "Light",
      concerns: [],
      underlyingConditions: [],
      allergies: [],
      medications: [],
      smoking: false,
      sunExposure: "minimal",
      waterIntake: "1-2L",
      treatmentsWanted: [],
      pregnancyOrBreastfeeding: false,
    }
  });

  const onSubmit = async (data: FormData) => {
    if (!session?.user?.subscriptionTier || session.user.subscriptionTier === "FREE") {
      toast.error("Beauty risk assessment requires Pink U or VIP subscription");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Calculate beauty risk assessment
      const assessment = calculateBeautyRiskAssessment(data as UserInputs);

      // Save to database
      const response = await fetch("/api/beauty-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          factors: assessment.factors,
          riskScore: assessment.riskScore,
          socialMediaText: assessment.socialMediaText,
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save assessment");
      }

      toast.success("Beauty risk assessment saved successfully");
      onClose(true);
    } catch (error) {
      console.error("Error saving assessment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save assessment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Beauty Risk Assessment</DialogTitle>
          <DialogDescription>
            Complete this comprehensive assessment to get personalized beauty recommendations and risk analysis
          </DialogDescription>
        </DialogHeader>

        {!session?.user?.subscriptionTier || session.user.subscriptionTier === "FREE" ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              Beauty risk assessment is available for Pink U and VIP members only.
            </p>
            <MembershipDialog>
              <Button>Upgrade Membership</Button>
            </MembershipDialog>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Non-binary">Non-binary</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="skinType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skin Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select skin type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {skinTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="melanation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skin Tone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select skin tone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {melanationTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="concerns"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skin Concerns</FormLabel>
                      <div className="space-y-2">
                        {skinConcerns.map(concern => (
                          <div key={concern.value} className="flex items-center space-x-2">
                            <Checkbox
                              checked={field.value.includes(concern.value)}
                              onCheckedChange={(checked) => {
                                const newValue = checked
                                  ? [...field.value, concern.value]
                                  : field.value.filter(v => v !== concern.value);
                                field.onChange(newValue);
                              }}
                            />
                            <label className="text-sm">{concern.label}</label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="treatmentsWanted"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desired Treatments</FormLabel>
                      <div className="space-y-2">
                        {treatments.map(treatment => (
                          <div key={treatment.value} className="flex items-center space-x-2">
                            <Checkbox
                              checked={field.value.includes(treatment.value)}
                              onCheckedChange={(checked) => {
                                const newValue = checked
                                  ? [...field.value, treatment.value]
                                  : field.value.filter(v => v !== treatment.value);
                                field.onChange(newValue);
                              }}
                            />
                            <label className="text-sm">{treatment.label}</label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sunExposure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sun Exposure</FormLabel>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="minimal" id="minimal" />
                            <label htmlFor="minimal">Minimal</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="moderate" id="moderate" />
                            <label htmlFor="moderate">Moderate</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="heavy" id="heavy" />
                            <label htmlFor="heavy">Heavy</label>
                          </div>
                        </FormControl>
                      </RadioGroup>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="waterIntake"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Daily Water Intake</FormLabel>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="<1L" id="low" />
                            <label htmlFor="low">Less than 1L</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="1-2L" id="medium" />
                            <label htmlFor="medium">1-2L</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value=">2L" id="high" />
                            <label htmlFor="high">More than 2L</label>
                          </div>
                        </FormControl>
                      </RadioGroup>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="smoking"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Current Smoker</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pregnancyOrBreastfeeding"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Pregnant or Breastfeeding</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="underlyingConditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical Conditions (if any)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. diabetes, immune disorders (comma separated)"
                          value={field.value.join(", ")}
                          onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Known Allergies (if any)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. latex, hydroquinone (comma separated)"
                          value={field.value.join(", ")}
                          onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="medications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Medications (if any)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. isotretinoin (comma separated)"
                          value={field.value.join(", ")}
                          onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Assessment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default BeautyRiskAssessment; 