import { Link } from 'react-router-dom'
import { getPublishedPosts } from '@/mocks/data'
import { BlogPostRenderer } from '@/features/blog/components/BlogPostRenderer'
import { PublicBlogShell } from '@/features/blog/PublicBlogShell'
import './BlogPublic.css'

export function BlogPublicPage() {
  const posts = getPublishedPosts()

  return (
    <PublicBlogShell>
      <section className="blog-public">
        <header className="blog-public__intro">
          <h1>Novedades Semanales</h1>
        </header>

        {posts.length === 0 ? (
          <p className="admin-empty">Pronto habrá contenido aquí.</p>
        ) : (
          <div className="blog-public__feed">
            {posts.map((post) => (
              post.kind === 'separator' ? (
                <BlogPostRenderer key={post.id} post={post} compact />
              ) : (
                <Link key={post.id} to={`/blog/${post.slug}`} className="blog-public__card-link">
                  <BlogPostRenderer post={post} compact />
                </Link>
              )
            ))}
          </div>
        )}
      </section>
    </PublicBlogShell>
  )
}
