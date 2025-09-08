import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { blogPosts, blogPostCategories, blogCategories, users } from '@/lib/db/schema';
import { eq, desc, and, like, inArray, count } from 'drizzle-orm';

// GET /api/blog/posts - List published blog posts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const tag = searchParams.get('tag');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const offset = (page - 1) * limit;

    let whereConditions: any[] = [eq(blogPosts.status, 'published')];

    // Add tag filter if provided
    if (tag) {
      whereConditions.push(like(blogPosts.tags, `%${tag}%`));
    }

    // Add search filter if provided
    if (search) {
      whereConditions.push(
        like(blogPosts.title, `%${search}%`)
      );
    }

    // Fetch posts with author information
    const posts = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        featuredImage: blogPosts.featuredImage,
        publishedAt: blogPosts.publishedAt,
        readingTime: blogPosts.readingTime,
        viewCount: blogPosts.viewCount,
        tags: blogPosts.tags,
        author: {
          name: users.name,
          image: users.image,
        },
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(and(...whereConditions))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ total }] = await db
      .select({ total: count() })
      .from(blogPosts)
      .where(and(...whereConditions));

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / limit),
        hasNext: page * limit < Number(total),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

// POST /api/blog/posts - Create new blog post (admin only)
export async function POST(req: NextRequest) {
  try {
    // For now, we'll implement basic creation
    // TODO: Add proper authentication and admin check
    const body = await req.json();
    
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      metaTitle,
      metaDescription,
      tags,
      status = 'draft',
      authorId,
    } = body;

    if (!title || !content || !authorId) {
      return NextResponse.json(
        { error: 'Title, content, and authorId are required' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Calculate reading time (rough estimate: 200 words per minute)
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    const newPost = await db
      .insert(blogPosts)
      .values({
        title,
        slug: finalSlug,
        excerpt,
        content,
        featuredImage,
        metaTitle,
        metaDescription,
        tags: tags || [],
        status,
        authorId,
        readingTime,
        publishedAt: status === 'published' ? new Date() : null,
      })
      .returning();

    return NextResponse.json(
      { message: 'Blog post created successfully', post: newPost[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    );
  }
}