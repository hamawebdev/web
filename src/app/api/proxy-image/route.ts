import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return new NextResponse('Missing image URL parameter', { status: 400 });
    }

    // Validate that the URL is from the expected domain
    const allowedDomains = ['med-cortex.com', 'localhost'];
    let isValidDomain = false;
    
    try {
      const url = new URL(imageUrl);
      isValidDomain = allowedDomains.some(domain => url.hostname.includes(domain));
    } catch {
      // If it's a relative URL, it's safe to proxy
      isValidDomain = imageUrl.startsWith('/');
    }

    if (!isValidDomain) {
      return new NextResponse('Invalid image domain', { status: 403 });
    }

    // Construct the full URL if it's relative
    let fullImageUrl = imageUrl;
    if (imageUrl.startsWith('/')) {
      // For relative URLs, use the production domain
      fullImageUrl = `https://med-cortex.com${imageUrl}`;
    }

    console.log('[ImageProxy] Fetching image:', fullImageUrl);

    // Fetch the image from the API with timeout and proper headers
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const imageResponse = await fetch(fullImageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'MedSpace-ImageProxy/1.0',
        'Accept': 'image/*',
        'Cache-Control': 'no-cache',
      },
    });
    
    clearTimeout(timeoutId);

    if (!imageResponse.ok) {
      console.error('[ImageProxy] Failed to fetch image:', {
        url: fullImageUrl,
        status: imageResponse.status,
        statusText: imageResponse.statusText
      });
      return new NextResponse(`Failed to fetch image: ${imageResponse.statusText}`, { 
        status: imageResponse.status 
      });
    }

    // Get the image data
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    console.log('[ImageProxy] Successfully proxied image:', {
      url: fullImageUrl,
      contentType,
      size: imageBuffer.byteLength
    });

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    });

  } catch (error) {
    const { searchParams } = new URL(request.url);
    console.error('[ImageProxy] Error proxying image:', {
      url: searchParams.get('url'),
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new NextResponse('Request timeout', { status: 408 });
      }
      if (error.message.includes('fetch')) {
        return new NextResponse('Network error', { status: 502 });
      }
    }
    
    return new NextResponse('Internal server error', { status: 500 });
  }
}
