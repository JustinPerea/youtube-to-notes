import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { blogPosts } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// POST /api/blog/posts/[slug]/views - Increment view count
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // Increment view count
    const updatedPost = await db
      .update(blogPosts)
      .set({
        viewCount: sql`${blogPosts.viewCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(blogPosts.slug, slug))
      .returning({
        id: blogPosts.id,
        viewCount: blogPosts.viewCount,
      });

    if (updatedPost.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      viewCount: updatedPost[0].viewCount,
    });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    return NextResponse.json(
      { error: 'Failed to update view count' },
      { status: 500 }
    );
  }
}