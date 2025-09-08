import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { blogPosts, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/blog/posts/[slug] - Get single blog post by slug
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const post = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        content: blogPosts.content,
        featuredImage: blogPosts.featuredImage,
        metaTitle: blogPosts.metaTitle,
        metaDescription: blogPosts.metaDescription,
        tags: blogPosts.tags,
        status: blogPosts.status,
        publishedAt: blogPosts.publishedAt,
        readingTime: blogPosts.readingTime,
        viewCount: blogPosts.viewCount,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
        author: {
          name: users.name,
          image: users.image,
        },
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(
        and(
          eq(blogPosts.slug, slug),
          eq(blogPosts.status, 'published')
        )
      )
      .limit(1);

    if (post.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ post: post[0] });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}

// PUT /api/blog/posts/[slug] - Update blog post (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // TODO: Add proper authentication and admin check
    const { slug } = params;
    const body = await req.json();
    
    const {
      title,
      excerpt,
      content,
      featuredImage,
      metaTitle,
      metaDescription,
      tags,
      status,
    } = body;

    // Calculate reading time if content is updated
    let readingTime;
    if (content) {
      const wordCount = content.split(/\s+/).length;
      readingTime = Math.ceil(wordCount / 200);
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title) updateData.title = title;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content) {
      updateData.content = content;
      updateData.readingTime = readingTime;
    }
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (tags) updateData.tags = tags;
    if (status) {
      updateData.status = status;
      if (status === 'published' && !updateData.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const updatedPost = await db
      .update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.slug, slug))
      .returning();

    if (updatedPost.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Blog post updated successfully',
      post: updatedPost[0],
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    );
  }
}

// DELETE /api/blog/posts/[slug] - Delete blog post (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // TODO: Add proper authentication and admin check
    const { slug } = params;

    const deletedPost = await db
      .delete(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .returning();

    if (deletedPost.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Blog post deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    );
  }
}