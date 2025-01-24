import { NextResponse } from 'next/server';
import { logger as appLogger } from '@/lib/logger';
import { withErrorHandler } from '@/lib/api-middleware';

async function handler() {
  try {
    appLogger.info('Stripe webhook test endpoint reached');
    
    return NextResponse.json({ 
      success: true,
      message: 'Stripe webhook test endpoint is configured correctly',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    appLogger.error('Error in Stripe webhook test endpoint:', error as Error);
    throw error;
  }
}

export const GET = withErrorHandler(handler); 