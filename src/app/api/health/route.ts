import { NextRequest, NextResponse } from 'next/server';

/**
 * Health check endpoint for Docker and load balancer health checks
 * GET /api/health
 */
export async function GET(request: NextRequest) {
  try {
    // Basic health check - can be extended with database connectivity checks
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      api: {
        baseUrl: 'https://med-cortex.com/api/v1',
        status: 'configured'
      }
    };

    return NextResponse.json(healthData, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      }, 
      { status: 500 }
    );
  }
}
