import React, { useEffect, useState } from 'react';
import { postsApi } from '../services/api';
import { Post } from '../types';

const HomePage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await postsApi.getAll();
        setPosts(data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchPosts();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-gray-900">Community Feed</h1>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2">
          {loading ? (
            <p className="text-gray-500">Loading posts...</p>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow p-6 mb-4">
                {post.title && <h3 className="font-bold text-lg mb-2">{post.title}</h3>}
                <p className="text-gray-600 mb-2">{post.content}</p>
                {post.user && <p className="text-xs text-gray-500 mb-4">By {post.user.name}</p>}
                <div className="flex space-x-4 text-sm text-gray-500">
                  <button className="hover:text-blue-600" type="button">
                    ❤️ Like
                  </button>
                  <button className="hover:text-blue-600" type="button">
                    💬 Comment
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No posts yet. Be the first to share!</p>
          )}
        </div>

        <aside className="bg-white rounded-lg shadow p-6 h-fit">
          <h2 className="font-bold text-lg mb-4">Upcoming Events</h2>
          <p className="text-sm text-gray-600">Visit the Events page to RSVP and stay connected.</p>
        </aside>
      </div>
    </div>
  );
};

export default HomePage;
