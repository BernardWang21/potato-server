import React, { useState, useEffect } from 'react';
import { Users, Lock, Unlock, Plus, Trash2, Edit2, Save, X } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('potato-users');
      return saved ? JSON.parse(saved) : [
        { username: 'very-fried-potato', password: '601121W@ngheh', role: 'admin' }
      ];
    } catch (e) {
      return [
        { username: 'very-fried-potato', password: '601121W@ngheh', role: 'admin' }
      ];
    }
  });
  const [channels, setChannels] = useState(() => {
    try {
      const saved = localStorage.getItem('potato-channels');
      return saved ? JSON.parse(saved) : [
        { 
          id: 1, 
          name: 'Welcome', 
          posts: [
            { id: 1, author: 'very-fried-potato', content: 'Welcome to Potato Server! 🥔', timestamp: new Date().toISOString() }
          ],
          locked: true,
          isSpecial: true
        },
        { 
          id: 2, 
          name: 'General', 
          posts: [],
          locked: false,
          isSpecial: false
        },
        { 
          id: 3, 
          name: 'Announcements', 
          posts: [],
          locked: true,
          isSpecial: true
        }
      ];
    } catch (e) {
      return [
        { 
          id: 1, 
          name: 'Welcome', 
          posts: [
            { id: 1, author: 'very-fried-potato', content: 'Welcome to Potato Server! 🥔', timestamp: new Date().toISOString() }
          ],
          locked: true,
          isSpecial: true
        },
        { 
          id: 2, 
          name: 'General', 
          posts: [],
          locked: false,
          isSpecial: false
        },
        { 
          id: 3, 
          name: 'Announcements', 
          posts: [],
          locked: true,
          isSpecial: true
        }
      ];
    }
  });
  const [activeChannel, setActiveChannel] = useState(1);
  const [showAuth, setShowAuth] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [newPost, setNewPost] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [newMemberName, setNewMemberName] = useState('');
  const [editingChannel, setEditingChannel] = useState(null);
  const [editChannelName, setEditChannelName] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('potato-users', JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users:', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('potato-channels', JSON.stringify(channels));
    } catch (e) {
      console.error('Failed to save channels:', e);
    }
  }, [channels]);

  const handleAuth = () => {
    setAuthError('');
    
    if (!authForm.username || !authForm.password) {
      setAuthError('ERROR: Please enter both username and password');
      return;
    }

    if (isSignUp) {
      if (users.find(u => u.username === authForm.username)) {
        setAuthError('ERROR: Username already exists! Please choose a different username.');
        return;
      }
      const newUser = { 
        username: authForm.username, 
        password: authForm.password, 
        role: authForm.username === 'very-fried-potato' ? 'admin' : 'user'
      };
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      setCurrentUser(newUser);
      setShowAuth(false);
      setAuthForm({ username: '', password: '' });
    } else {
      const user = users.find(u => 
        u.username === authForm.username && u.password === authForm.password
      );
      if (user) {
        setCurrentUser(user);
        setShowAuth(false);
        setAuthForm({ username: '', password: '' });
      } else {
        setAuthError('ERROR: Invalid username or password! Please try again.');
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowAuth(true);
    setActiveChannel(1);
  };

  const isAdmin = () => {
    return currentUser && currentUser.username === 'very-fried-potato';
  };

  const canModifyChannel = (channel) => {
    if (!channel) return false;
    if (isAdmin()) return true;
    return !channel.locked;
  };

  const handlePostSubmit = () => {
    if (!newPost.trim()) return;

    const channel = channels.find(c => c.id === activeChannel);
    if (!canModifyChannel(channel)) {
      alert('This channel is locked! Only very-fried-potato can post here.');
      return;
    }

    const updatedChannels = channels.map(c => {
      if (c.id === activeChannel) {
        return {
          ...c,
          posts: [...c.posts, {
            id: Date.now(),
            author: currentUser.username,
            content: newPost,
            timestamp: new Date().toISOString()
          }]
        };
      }
      return c;
    });

    setChannels(updatedChannels);
    setNewPost('');
  };

  const handleDeletePost = (postId) => {
    const updatedChannels = channels.map(c => {
      if (c.id === activeChannel) {
        return {
          ...c,
          posts: c.posts.filter(p => p.id !== postId)
        };
      }
      return c;
    });
    setChannels(updatedChannels);
  };

  const handleEditPost = (postId, content) => {
    setEditingPost(postId);
    setEditContent(content);
  };

  const handleSaveEdit = (postId) => {
    const updatedChannels = channels.map(c => {
      if (c.id === activeChannel) {
        return {
          ...c,
          posts: c.posts.map(p => 
            p.id === postId ? { ...p, content: editContent } : p
          )
        };
      }
      return c;
    });
    setChannels(updatedChannels);
    setEditingPost(null);
    setEditContent('');
  };

  const handleCreateChannel = () => {
    if (!newChannelName.trim()) return;
    
    const newChannel = {
      id: Date.now(),
      name: newChannelName,
      posts: [],
      locked: false,
      isSpecial: false
    };
    
    setChannels([...channels, newChannel]);
    setNewChannelName('');
    setShowChannelModal(false);
  };

  const handleRemoveMember = (username) => {
    if (username === 'very-fried-potato') {
      alert('Cannot remove the admin!');
      return;
    }
    if (username === currentUser.username) {
      alert('Cannot remove yourself!');
      return;
    }
    if (window.confirm(`Are you sure you want to remove ${username}?`)) {
      setUsers(users.filter(u => u.username !== username));
    }
  };

  const handleRenameMember = (oldUsername) => {
    if (oldUsername === 'very-fried-potato') {
      alert('Cannot rename the admin!');
      return;
    }
    setEditingMember(oldUsername);
    setNewMemberName(oldUsername);
    setShowMemberModal(true);
  };

  const handleSaveRename = () => {
    if (!newMemberName.trim()) {
      alert('Username cannot be empty!');
      return;
    }
    if (users.find(u => u.username === newMemberName && u.username !== editingMember)) {
      alert('Username already exists!');
      return;
    }
    
    const updatedUsers = users.map(u => 
      u.username === editingMember ? { ...u, username: newMemberName } : u
    );
    
    const updatedChannels = channels.map(channel => ({
      ...channel,
      posts: channel.posts.map(post => 
        post.author === editingMember ? { ...post, author: newMemberName } : post
      )
    }));
    
    if (currentUser.username === editingMember) {
      setCurrentUser({ ...currentUser, username: newMemberName });
    }
    
    setUsers(updatedUsers);
    setChannels(updatedChannels);
    setEditingMember(null);
    setNewMemberName('');
    setShowMemberModal(false);
  };

  const handleRemoveChannel = (channelId) => {
    if (window.confirm('Are you sure you want to delete this channel?')) {
      setChannels(channels.filter(c => c.id !== channelId));
      if (activeChannel === channelId) {
        setActiveChannel(channels[0].id);
      }
    }
  };

  const handleRenameChannel = (channelId, currentName) => {
    setEditingChannel(channelId);
    setEditChannelName(currentName);
  };

  const handleSaveChannelRename = () => {
    if (!editChannelName.trim()) {
      alert('Channel name cannot be empty!');
      return;
    }
    
    const updatedChannels = channels.map(c => 
      c.id === editingChannel ? { ...c, name: editChannelName } : c
    );
    
    setChannels(updatedChannels);
    setEditingChannel(null);
    setEditChannelName('');
  };

  const toggleChannelType = (channelId) => {
    const updatedChannels = channels.map(c => {
      if (c.id === channelId) {
        return { ...c, isSpecial: !c.isSpecial };
      }
      return c;
    });
    setChannels(updatedChannels);
  };

  const toggleChannelLock = (channelId) => {
    const updatedChannels = channels.map(c => {
      if (c.id === channelId) {
        return { ...c, locked: !c.locked };
      }
      return c;
    });
    setChannels(updatedChannels);
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  const renderMessageContent = (content) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 underline"
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const getOnlineUsers = () => {
    return users.map(u => u.username);
  };

  const activeChannelData = channels.find(c => c.id === activeChannel);

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <div className="text-6xl">🥔</div>
          </div>
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
            Potato Server
          </h1>
          <p className="text-center text-gray-600 mb-6">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </p>
          
          {authError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {authError}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={authForm.username}
                onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                onKeyPress={(e) => handleKeyPress(e, handleAuth)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                onKeyPress={(e) => handleKeyPress(e, handleAuth)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={handleAuth}
              className="w-full bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700 transition"
            >
              {isSignUp ? 'Sign Up' : 'Log In'}
            </button>
          </div>
          
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setAuthError('');
              }}
              className="text-orange-600 hover:text-orange-800 text-sm"
            >
              {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!activeChannelData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">🥔</div>
            <h1 className="text-2xl font-bold text-gray-800">Potato Server</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Hello, <strong>{currentUser.username}</strong></span>
            {isAdmin() && (
              <span className="bg-yellow-400 text-orange-900 px-3 py-1 rounded-full text-sm font-bold">
                ADMIN
              </span>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        <div className="w-64 space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg text-gray-800">Channels</h2>
              {isAdmin() && (
                <button
                  onClick={() => setShowChannelModal(true)}
                  className="text-orange-600 hover:text-orange-800"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div className="space-y-2">
              {channels.map(channel => (
                <div key={channel.id} className="flex items-center gap-2">
                  {editingChannel === channel.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editChannelName}
                        onChange={(e) => setEditChannelName(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, handleSaveChannelRename)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <button
                        onClick={handleSaveChannelRename}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingChannel(null);
                          setEditChannelName('');
                        }}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setActiveChannel(channel.id)}
                        className={`flex-1 text-left px-4 py-2 rounded-lg transition flex items-center justify-between ${
                          activeChannel === channel.id
                            ? 'bg-orange-100 text-orange-800'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <span className="font-medium"># {channel.name}</span>
                        {channel.locked && <Lock className="w-4 h-4 text-red-600" />}
                      </button>
                      {isAdmin() && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleRenameChannel(channel.id, channel.name)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                            title="Rename Channel"
                          >
                            <Edit2 className="w-3 h-3 text-blue-600" />
                          </button>
                          <button
                            onClick={() => toggleChannelLock(channel.id)}
                            className={`p-2 rounded-lg transition ${
                              channel.locked 
                                ? 'hover:bg-red-100' 
                                : 'hover:bg-green-100'
                            }`}
                            title={channel.locked ? "Unlock Channel" : "Lock Channel"}
                          >
                            {channel.locked ? (
                              <Lock className="w-3 h-3 text-red-600" />
                            ) : (
                              <Unlock className="w-3 h-3 text-green-600" />
                            )}
                          </button>
                          <button
                            onClick={() => handleRemoveChannel(channel.id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition"
                            title="Delete Channel"
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-gray-600" />
              <h2 className="font-bold text-lg text-gray-800">Members</h2>
            </div>
            
            <div className="space-y-2">
              {getOnlineUsers().map(user => (
                <div key={user} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg group">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700">{user}</span>
                    {user === 'very-fried-potato' && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Admin</span>
                    )}
                  </div>
                  {isAdmin() && user !== 'very-fried-potato' && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleRenameMember(user)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleRemoveMember(user)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {activeChannelData.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {activeChannelData.locked ? (
                    <span className="text-red-600">
                      🔒 Locked channel - Only very-fried-potato can post
                    </span>
                  ) : (
                    'Everyone can post here'
                  )}
                  {activeChannelData.isSpecial && (
                    <span className="ml-2 text-purple-600">• Special Posts Mode</span>
                  )}
                </p>
              </div>
              {isAdmin() && (
                <button
                  onClick={() => toggleChannelType(activeChannel)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    activeChannelData.isSpecial
                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {activeChannelData.isSpecial ? 'Special Posts' : 'Normal Messages'}
                </button>
              )}
            </div>
          </div>

          <div className="p-6 h-96 overflow-y-auto">
            {activeChannelData.posts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No messages yet. Start the conversation!</p>
            ) : (
              <div className={activeChannelData.isSpecial ? 'space-y-4' : 'space-y-3'}>
                {activeChannelData.posts.map(post => (
                  activeChannelData.isSpecial ? (
                    <div key={post.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-semibold text-orange-600">{post.author}</span>
                          {post.author === 'very-fried-potato' && (
                            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Admin</span>
                          )}
                          <span className="text-gray-500 text-sm ml-2">
                            {new Date(post.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {post.author === currentUser.username && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditPost(post.id, post.content)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      {editingPost === post.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onKeyPress={(e) => handleKeyPress(e, () => handleSaveEdit(post.id))}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <button
                            onClick={() => handleSaveEdit(post.id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setEditingPost(null)}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-gray-800">{renderMessageContent(post.content)}</p>
                      )}
                    </div>
                  ) : (
                    <div key={post.id} className="flex items-start gap-2 hover:bg-gray-50 px-2 py-1 rounded">
                      <span className="text-xs text-gray-500 w-16 flex-shrink-0 mt-0.5">
                        {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-gray-800 mr-2">{post.author}</span>
                        {post.author === 'very-fried-potato' && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded mr-2">Admin</span>
                        )}
                        {editingPost === post.id ? (
                          <div className="flex gap-2 mt-1">
                            <input
                              type="text"
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              onKeyPress={(e) => handleKeyPress(e, () => handleSaveEdit(post.id))}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <button
                              onClick={() => handleSaveEdit(post.id)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingPost(null)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-700">{renderMessageContent(post.content)}</span>
                        )}
                      </div>
                      {post.author === currentUser.username && editingPost !== post.id && (
                        <div className="flex space-x-1 opacity-0 hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditPost(post.id, post.content)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                ))}
              </div>
            )}
          </div>

          {canModifyChannel(activeChannelData) ? (
            <div className="border-t border-gray-200 p-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handlePostSubmit)}
                  placeholder={activeChannelData.isSpecial ? "Write a post..." : "Send a message..."}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  onClick={handlePostSubmit}
                  className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition font-semibold"
                >
                  {activeChannelData.isSpecial ? 'Post' : 'Send'}
                </button>
              </div>
            </div>
          ) : (
