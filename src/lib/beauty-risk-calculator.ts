import { RiskFactorType, RiskSeverity } from "@prisma/client";

export interface UserInputs {
  age: number;
  gender: 'Female' | 'Male' | 'Non-binary' | string;
  skinType: 'Oily' | 'Dry' | 'Combination' | 'Sensitive' | 'Normal';
  melanation: 'None' | 'Light' | 'Medium' | 'Dark' | 'Very Dark' | 'Mixed';
  concerns: string[];
  underlyingConditions: string[];
  allergies: string[];
  medications: string[];
  smoking: boolean;
  sunExposure: 'minimal' | 'moderate' | 'heavy';
  waterIntake: '<1L' | '1-2L' | '>2L';
  treatmentsWanted: string[];
  pregnancyOrBreastfeeding: boolean;
}

export interface BeautyRiskResult {
  riskScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
  melanation: string;
  recommendation: string;
  socialMediaText: string;
  disclaimer: string;
  factors: {
    type: RiskFactorType;
    severity: RiskSeverity;
    description: string;
    recommendation?: string;
  }[];
}

export function calculateBeautyRiskAssessment(userInputs: UserInputs): BeautyRiskResult {
  let riskPoints = 0;
  const factors: BeautyRiskResult['factors'] = [];

  // Age Risk
  if (userInputs.age < 25) {
    riskPoints += 1;
  } else if (userInputs.age < 35) {
    riskPoints += 2;
  } else if (userInputs.age < 45) {
    riskPoints += 3;
  } else {
    riskPoints += 4;
  }
  factors.push({
    type: RiskFactorType.LIFESTYLE,
    severity: riskPoints <= 2 ? RiskSeverity.LOW : RiskSeverity.MEDIUM,
    description: `Age-related considerations for ${userInputs.age} years old`,
  });

  // Skin Type Risk
  let skinTypePoints = 0;
  switch (userInputs.skinType) {
    case 'Oily':
      skinTypePoints = 2;
      break;
    case 'Dry':
      skinTypePoints = 1;
      break;
    case 'Sensitive':
      skinTypePoints = 3;
      break;
    case 'Combination':
      skinTypePoints = 2;
      break;
    case 'Normal':
      skinTypePoints = 1;
      break;
  }
  riskPoints += skinTypePoints;
  factors.push({
    type: RiskFactorType.SKIN,
    severity: skinTypePoints >= 3 ? RiskSeverity.HIGH : skinTypePoints >= 2 ? RiskSeverity.MEDIUM : RiskSeverity.LOW,
    description: `${userInputs.skinType} skin type considerations`,
  });

  // Melanation Risk
  let melanationPoints = 0;
  switch (userInputs.melanation) {
    case 'None':
      melanationPoints = 2;
      break;
    case 'Light':
      melanationPoints = 1;
      break;
    case 'Medium':
      melanationPoints = 2;
      break;
    case 'Dark':
      melanationPoints = 3;
      break;
    case 'Very Dark':
      melanationPoints = 4;
      break;
    case 'Mixed':
      melanationPoints = 3;
      break;
  }
  riskPoints += melanationPoints;
  factors.push({
    type: RiskFactorType.SKIN,
    severity: melanationPoints >= 3 ? RiskSeverity.HIGH : melanationPoints >= 2 ? RiskSeverity.MEDIUM : RiskSeverity.LOW,
    description: `${userInputs.melanation} skin tone considerations`,
    recommendation: melanationPoints >= 2 ? 'Consider patch testing for chemical treatments and careful monitoring for hyperpigmentation risk.' : undefined,
  });

  // Skin Concerns
  if (userInputs.concerns.length > 0) {
    riskPoints += userInputs.concerns.length;
    factors.push({
      type: RiskFactorType.SKIN,
      severity: userInputs.concerns.length >= 3 ? RiskSeverity.HIGH : userInputs.concerns.length >= 2 ? RiskSeverity.MEDIUM : RiskSeverity.LOW,
      description: `Multiple skin concerns: ${userInputs.concerns.join(', ')}`,
    });
  }

  // Medical History
  if (userInputs.allergies.length > 0) {
    riskPoints += userInputs.allergies.length * 2;
    factors.push({
      type: RiskFactorType.SKIN,
      severity: RiskSeverity.HIGH,
      description: `Known allergies: ${userInputs.allergies.join(', ')}`,
      recommendation: 'Careful patch testing required before any new treatment.',
    });
  }

  // Underlying Conditions
  if (userInputs.underlyingConditions.length > 0) {
    const hasHighRiskCondition = userInputs.underlyingConditions.some(
      condition => condition.toLowerCase().includes('immune') || condition.toLowerCase().includes('diabetes')
    );
    riskPoints += hasHighRiskCondition ? 3 : userInputs.underlyingConditions.length;
    factors.push({
      type: RiskFactorType.LIFESTYLE,
      severity: hasHighRiskCondition ? RiskSeverity.CRITICAL : RiskSeverity.HIGH,
      description: `Medical conditions: ${userInputs.underlyingConditions.join(', ')}`,
      recommendation: 'Medical clearance required before treatments.',
    });
  }

  // Medications
  if (userInputs.medications.includes('isotretinoin')) {
    riskPoints += 3;
    factors.push({
      type: RiskFactorType.PRODUCT,
      severity: RiskSeverity.CRITICAL,
      description: 'Current isotretinoin use',
      recommendation: 'Many treatments contraindicated while on isotretinoin.',
    });
  }

  // Lifestyle Factors
  if (userInputs.smoking) {
    riskPoints += 2;
    factors.push({
      type: RiskFactorType.LIFESTYLE,
      severity: RiskSeverity.MEDIUM,
      description: 'Active smoker',
      recommendation: 'Smoking can affect healing and treatment results.',
    });
  }

  if (userInputs.sunExposure === 'heavy') {
    riskPoints += 2;
    factors.push({
      type: RiskFactorType.ENVIRONMENTAL,
      severity: RiskSeverity.HIGH,
      description: 'High sun exposure',
      recommendation: 'Sun protection crucial before and after treatments.',
    });
  }

  // Treatment Risk
  if (userInputs.treatmentsWanted.length > 0) {
    const highRiskTreatments = userInputs.treatmentsWanted.filter(
      t => t.toLowerCase().includes('deep chemical peel') || t.toLowerCase().includes('ablative laser')
    );
    const mediumRiskTreatments = userInputs.treatmentsWanted.filter(
      t => t.toLowerCase().includes('microneedling') || t.toLowerCase().includes('medium-depth peel')
    );
    
    if (highRiskTreatments.length > 0) {
      riskPoints += 4;
      factors.push({
        type: RiskFactorType.PRODUCT,
        severity: RiskSeverity.CRITICAL,
        description: `High-risk treatments desired: ${highRiskTreatments.join(', ')}`,
        recommendation: 'Professional consultation required.',
      });
    }
    
    if (mediumRiskTreatments.length > 0) {
      riskPoints += 3;
      factors.push({
        type: RiskFactorType.PRODUCT,
        severity: RiskSeverity.HIGH,
        description: `Medium-risk treatments desired: ${mediumRiskTreatments.join(', ')}`,
        recommendation: 'Patch testing and gradual approach recommended.',
      });
    }
  }

  // Pregnancy/Breastfeeding
  if (userInputs.pregnancyOrBreastfeeding) {
    riskPoints += 5;
    factors.push({
      type: RiskFactorType.LIFESTYLE,
      severity: RiskSeverity.CRITICAL,
      description: 'Pregnancy or breastfeeding',
      recommendation: 'Many treatments contraindicated during pregnancy/breastfeeding.',
    });
  }

  // Calculate final risk score
  const MAX_POINTS = 50;
  const riskScore = Math.max(0, Math.min(100, 100 - (riskPoints / MAX_POINTS) * 100));

  // Determine risk level and recommendations
  let riskLevel: 'Low' | 'Moderate' | 'High';
  let recommendation = '';

  if (riskScore >= 70) {
    riskLevel = 'Low';
    recommendation = 'Overall low risk. Proceed with usual precautions and standard consultation. ';
  } else if (riskScore >= 40) {
    riskLevel = 'Moderate';
    recommendation = 'Moderate risk. Consult a certified skin specialist, dermatologist, or Kris, FNP-BC at PinkLife Medspa before proceeding with invasive treatments. ';
  } else {
    riskLevel = 'High';
    recommendation = 'High risk. Strongly recommend clearance from Kris, FNP-BC at PinkLife Medspa or a certified dermatologist before any procedure. ';
  }

  // Add melanation-specific recommendations
  if (['Medium', 'Dark', 'Very Dark', 'Mixed'].includes(userInputs.melanation)) {
    if (riskLevel === 'Low') {
      recommendation += 'Given your skin color type, still consider a patch test if doing chemical peels or lasers. ';
    } else if (riskLevel === 'Moderate') {
      recommendation += 'For your skin color type, start with light chemical peels or low-intensity treatments, possibly at more frequent intervals instead of one aggressive session. This reduces the chance of hypo-/hyperpigmentation. Patch testing is strongly advised. ';
    } else {
      recommendation += 'With deeper/mixed skin tones, you have an elevated risk of post-inflammatory hyperpigmentation or scarring. Seek personalized supervision and opt for mild approaches first. ';
    }
  }

  // Generate social media text
  const socialMediaText = `My #BeautyRisk score is ${Math.round(riskScore)} (${riskLevel}) with a ${userInputs.melanation} skin tone! #PatchTest #HealthySkin #SkinToneCare #PinkLifeMedspa Always consult a professional before starting new skincare treatments.`;

  return {
    riskScore: Math.round(riskScore),
    riskLevel,
    melanation: userInputs.melanation,
    recommendation: recommendation.trim(),
    socialMediaText,
    disclaimer: 'Disclaimer: This assessment is for informational purposes only. Always consult a certified skin specialist, dermatologist, or Kris, FNP-BC at PinkLife Medspa for personalized guidance before undergoing any aesthetic treatments.',
    factors,
  };
} 