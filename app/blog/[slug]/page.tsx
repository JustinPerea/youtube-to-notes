'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  featuredImage?: string;
  publishedAt: string;
  readingTime: number;
  viewCount: number;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  author: {
    name: string;
    image?: string;
  };
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/blog/posts/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setPost(data.post);
        
        // Update view count
        fetch(`/api/blog/posts/${slug}/views`, { method: 'POST' }).catch(console.error);
      } else if (response.status === 404) {
        setError('Post not found');
      } else {
        setError('Failed to load post');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] pt-20">
        <div className="max-w-4xl mx-auto px-5 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[var(--background)] pt-20">
        <div className="max-w-4xl mx-auto px-5 py-12">
          <div className="text-center py-16">
            <div className="text-6xl mb-6">😞</div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
              {error || 'Post Not Found'}
            </h1>
            <p className="text-[var(--text-secondary)] mb-8">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-pink)] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Back to Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pt-20">
      {/* Back Navigation */}
      <div className="max-w-4xl mx-auto px-5 pt-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent-pink)] transition-colors mb-8"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Blog
        </Link>
      </div>

      <article className="max-w-4xl mx-auto px-5 pb-12">
        {/* Featured Image */}
        {post.featuredImage && (
          <div className="aspect-video rounded-xl overflow-hidden mb-8">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Header */}
        <header className="mb-8">
          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-[var(--accent-pink)]/10 text-[var(--accent-pink)] text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-6 text-[var(--text-secondary)] mb-6">
            <div className="flex items-center gap-3">
              {post.author.image && (
                <img
                  src={post.author.image}
                  alt={post.author.name}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <div className="font-medium text-[var(--text-primary)]">
                  {post.author.name}
                </div>
                <div className="text-sm">
                  {formatDistanceToNow(new Date(post.publishedAt))} ago
                </div>
              </div>
            </div>
            
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <span>{post.readingTime} min read</span>
              <span>•</span>
              <span>{post.viewCount.toLocaleString()} views</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <div 
            className="text-[var(--text-primary)] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
          />
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-[var(--card-border)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
              <span className="sm:hidden">{post.readingTime} min read</span>
              <span className="sm:hidden">•</span>
              <span className="sm:hidden">{post.viewCount.toLocaleString()} views</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Link
                href="/blog"
                className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] rounded-lg hover:border-[var(--accent-pink)] hover:text-[var(--accent-pink)] transition-colors"
              >
                More Posts
              </Link>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}

// Helper function to format content (basic markdown-like formatting)
function formatContent(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/^/, '<p class="mb-4">')
    .replace(/$/, '</p>');
}