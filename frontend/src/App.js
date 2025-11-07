import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Send, Trash2, Camera, User, LogOut, PlusSquare } from 'lucide-react';

const API_URL = 'http://localhost:8000/api';

const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = { 'Accept': 'application/json', ...options.headers };
    
    if (token && !options.skipAuth) headers['Authorization'] = `Bearer ${token}`;
    if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    
    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    if (!response.ok) throw new Error((await response.json()).message || 'Request failed');
    return response.json();
  },
  
  auth: {
    register: (data) => api.request('/register', { method: 'POST', body: JSON.stringify(data), skipAuth: true }),
    login: (data) => api.request('/login', { method: 'POST', body: JSON.stringify(data), skipAuth: true }),
    logout: () => api.request('/logout', { method: 'POST' }),
    me: () => api.request('/me'),
  },
  
  posts: {
    getAll: () => api.request('/posts', { method: 'GET' }),
    create: (formData) => api.request('/posts', { method: 'POST', body: formData }),
    delete: (id) => api.request(`/posts/${id}`, { method: 'DELETE' }),
    like: (id) => api.request(`/posts/${id}/like`, { method: 'POST' }),
  },
  
  comments: {
    create: (postId, content) => api.request(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  },
};

const AuthContext = React.createContext(null);

function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.auth.me().then(data => setUser(data.user)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);
  
  const login = async (email, password) => {
    const data = await api.auth.login({ email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };
  
  const register = async (name, email, password, password_confirmation) => {
    const data = await api.auth.register({ name, email, password, password_confirmation });
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };
  
  const logout = async () => {
    await api.auth.logout();
    localStorage.removeItem('token');
    setUser(null);
  };
  
  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  
  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.name, formData.email, formData.password, formData.password_confirmation);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Camera className="w-16 h-16 mx-auto mb-4 text-pink-500" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">InstaApp</h1>
          <p className="text-gray-500 mt-2">Share your moments with the world</p>
        </div>
        
        <div className="space-y-4">
          {!isLogin && (
            <>
              <input type="text" placeholder="Username" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition" />
            </>
          )}
          
          <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition" />
          <input type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition" />
          
          {!isLogin && <input type="password" placeholder="Confirm Password" value={formData.password_confirmation} onChange={(e) => setFormData({...formData, password_confirmation: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition" />}
          
          {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>}
          
          <button onClick={handleSubmit} disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition disabled:opacity-50">
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </div>
        
        <div className="text-center mt-6">
          <button onClick={() => setIsLogin(!isLogin)} className="text-pink-600 hover:text-pink-700 font-medium">
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, onDelete, onLike, onComment }) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const { user } = useAuth();
  
  const handleComment = async () => {
    if (!comment.trim()) return;
    await onComment(post.id, comment);
    setComment('');
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6 hover:shadow-xl transition">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{post.user.name}</h3>
          </div>
        </div>
        {user?.id === post.user.id && (
          <button onClick={() => onDelete(post.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition">
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <img src={post.image_url} alt="Post" className="w-full aspect-square object-cover" />
      
      <div className="p-4">
        <div className="flex items-center gap-4 mb-3">
          <button onClick={() => onLike(post.id)} className={`flex items-center gap-2 transition ${post.is_liked ? 'text-red-500' : 'text-gray-700 hover:text-red-500'}`}>
            <Heart className={`w-6 h-6 ${post.is_liked ? 'fill-current' : ''}`} />
            <span className="font-semibold">{post.likes_count}</span>
          </button>
          <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 text-gray-700 hover:text-blue-500 transition">
            <MessageCircle className="w-6 h-6" />
            <span className="font-semibold">{post.comments_count}</span>
          </button>
        </div>
        
        {post.caption && (
          <p className="text-gray-800 mb-2">
            <span className="font-semibold mr-2">{post.user.username}</span>
            {post.caption}
          </p>
        )}
        
        <p className="text-xs text-gray-500">{post.created_at}</p>
        
        {showComments && (
          <div className="mt-4 space-y-3">
            {post.comments.map(c => (
              <div key={c.id} className="text-sm">
                <span className="font-semibold">{c.user.username}</span> <span className="text-gray-700">{c.content}</span>
              </div>
            ))}
            
            <div className="flex gap-2 mt-3">
              <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment..." className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none" />
              <button onClick={handleComment} className="bg-pink-500 text-white p-2 rounded-full hover:bg-pink-600 transition">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CreatePostModal({ isOpen, onClose, onSubmit }) {
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };
  
  const handleSubmit = async () => {
    if (!image) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('image', image);
    formData.append('caption', caption);
    await onSubmit(formData);
    setCaption('');
    setImage(null);
    setPreview(null);
    setLoading(false);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Create New Post</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block mb-2 font-medium">Choose Image</label>
            <input type="file" accept="image/*" onChange={handleImageChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          
          {preview && <img src={preview} alt="Preview" className="w-full rounded-lg" />}
          
          <div>
            <label className="block mb-2 font-medium">Caption</label>
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write a caption..." className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none h-24" />
          </div>
          
          <div className="flex gap-3">
            <button onClick={handleSubmit} disabled={loading || !image} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50">
              {loading ? 'Posting...' : 'Post'}
            </button>
            <button onClick={onClose} className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MainApp() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user, logout } = useAuth();
  
  const fetchPosts = async () => {
    try {
      const data = await api.posts.getAll();
      console.log('Fetched posts:', data);
      setPosts(data.data);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPosts();
  }, []);
  
  const handleCreatePost = async (formData) => {
    await api.posts.create(formData);
    fetchPosts();
  };
  
  const handleDeletePost = async (id) => {
    if (window.confirm('Delete this post?')) {
      await api.posts.delete(id);
      setPosts(posts.filter(p => p.id !== id));
    }
  };
  
  const handleLike = async (id) => {
    const data = await api.posts.like(id);
    setPosts(posts.map(p => p.id === id ? {...p, is_liked: data.is_liked, likes_count: data.likes_count} : p));
  };
  
  const handleComment = async (postId, content) => {
    await api.comments.create(postId, content);
    fetchPosts();
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-8 h-8 text-pink-500" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">InstaApp</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full hover:shadow-lg transition">
              <PlusSquare className="w-5 h-5" />
              <span className="hidden sm:inline">Create</span>
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <span className="hidden sm:inline font-medium">{user?.name}</span>
            </div>
            
            <button onClick={logout} className="text-gray-600 hover:text-red-500 transition">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-2xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No posts yet. Be the first to share!</p>
          </div>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} onDelete={handleDeletePost} onLike={handleLike} onComment={handleComment} />)
        )}
      </main>
      
      <CreatePostModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSubmit={handleCreatePost} />
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center">
        <div className="text-center">
          <Camera className="w-16 h-16 mx-auto text-white mb-4 animate-pulse" />
          <p className="text-white text-xl">Loading...</p>
        </div>
      </div>
    );
  }
  
  return user ? <MainApp /> : <AuthPage />;
}

export default function InstaApp() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}