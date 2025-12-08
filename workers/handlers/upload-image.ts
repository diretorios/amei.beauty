/**
 * Handle image upload to R2
 * POST /api/upload?cardId=<cardId> (optional)
 * 
 * Authentication:
 * - If cardId is provided, requires valid owner token (Bearer token in Authorization header)
 * - If no cardId, allows upload but applies stricter rate limiting (handled by middleware)
 */

import type { Env } from '../types';
import { verifyCardOwnership } from '../middleware/auth';

export async function handleUploadImage(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Check if cardId is provided in query parameters
    const url = new URL(request.url);
    const cardId = url.searchParams.get('cardId');
    
    // If cardId is provided, verify ownership
    if (cardId) {
      const ownership = await verifyCardOwnership(cardId, request, env);
      
      if (!ownership.valid) {
        // Legacy cards without tokens are not allowed for authenticated uploads
        // They should republish to get a token, or upload without cardId (with stricter limits)
        return new Response(
          JSON.stringify({ 
            error: 'Unauthorized',
            message: ownership.isLegacy 
              ? 'This card needs to be republished to enable authenticated uploads. Please republish your card or upload without authentication (with stricter limits).'
              : 'Invalid or missing authentication token. Please provide a valid owner token.'
          }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate file type (check both MIME type and extension)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const fileExtension = '.' + (file.name.split('.').pop() || '').toLowerCase();
    
    if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(fileExtension)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only images (JPEG, PNG, WebP, GIF) are allowed.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Validate file content (magic bytes check)
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer.slice(0, 12));
    const magicBytes = Array.from(uint8Array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    
    // Check magic bytes for common image formats
    const isValidImage =
      magicBytes.startsWith('FFD8FF') || // JPEG
      magicBytes.startsWith('89504E47') || // PNG
      magicBytes.startsWith('474946') || // GIF
      magicBytes.startsWith('52494646') && uint8Array[8] === 0x57 && uint8Array[9] === 0x45 && uint8Array[10] === 0x42 && uint8Array[11] === 0x50; // WebP
    
    if (!isValidImage) {
      return new Response(
        JSON.stringify({ error: 'Invalid file content. File does not appear to be a valid image.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 5MB.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Validate image dimensions (optional - would require image processing)
    // For now, we rely on file size limit and content validation

    // Generate unique filename (sanitize extension)
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    // Use extension from validated file extension, not original filename
    const extension = fileExtension.substring(1); // Remove the dot
    const filename = `${timestamp}-${random}.${extension}`;

    // Upload to R2 (arrayBuffer already created during validation)
    await env.IMAGES.put(filename, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Return URL (in production, this would be your CDN URL)
    // For now, return the filename - you'll need to configure R2 public access
    const imageUrl = `/images/${filename}`;

    return new Response(
      JSON.stringify({
        success: true,
        url: imageUrl,
        filename,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to upload image',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

