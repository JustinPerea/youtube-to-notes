import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { blogCategories } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/blog/categories - List all blog categories
export async function GET() {
  try {
    const categories = await db
      .select({
        id: blogCategories.id,
        name: blogCategories.name,
        slug: blogCategories.slug,
        description: blogCategories.description,
        color: blogCategories.color,
        createdAt: blogCategories.createdAt,
      })
      .from(blogCategories)
      .orderBy(blogCategories.name);

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/blog/categories - Create new category (admin only)
export async function POST(req: NextRequest) {
  try {
    // TODO: Add proper authentication and admin check
    const body = await req.json();
    
    const { name, description, color } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newCategory = await db
      .insert(blogCategories)
      .values({
        name,
        slug,
        description,
        color,
      })
      .returning();

    return NextResponse.json(
      { message: 'Category created successfully', category: newCategory[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating blog category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}