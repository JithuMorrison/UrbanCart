import React, { useState, useEffect } from 'react';
import { use } from 'react';
import { FiMessageSquare, FiSend, FiUser, FiMail, FiStar } from 'react-icons/fi';

const AdminContactPage = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeContact, setActiveContact] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [filter, setFilter] = useState('open'); // 'open', 'answered', 'closed', 'all'
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {

        const userId = localStorage.getItem('userId');

        const url = filter === 'all' 
          ? 'http://localhost:3000/contacts/admin'
          : `http://localhost:3000/contacts/admin?status=${filter}`;

        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Session expired. Please login again.');
          }
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch contacts');
        }

        const data = await response.json();
        setContacts(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching contacts:', err);
        setError(err.message);
        setContacts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [filter]);

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    try {

        const userId = localStorage.getItem('userId');

      if (!replyMessage.trim()) {
        throw new Error('Reply message is required');
      }
      if (!activeContact) {
        throw new Error('No active contact selected');
      }

      const response = await fetch(
        `http://localhost:3000/contacts/${activeContact._id}/reply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId
          },
          body: JSON.stringify({
            message: replyMessage.trim()
          })
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit reply');
      }

      const data = await response.json();
      setContacts(contacts.map(c => c._id === data._id ? data : c));
      setActiveContact(data);
      setReplyMessage('');
      setError(null);
    } catch (err) {
      console.error('Error submitting reply:', err);
      setError(err.message);
    }
  };

  const handleLogout = () => {
    window.location.href = '/admin/login';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <div className="mt-2 space-x-2">
            <button
              onClick={() => window.location.reload()}
              className="text-blue-600 hover:text-blue-800"
            >
              Refresh Page
            </button>
            {error.includes('authentication') || error.includes('Session expired') ? (
              <button
                onClick={handleLogout}
                className="text-blue-600 hover:text-blue-800"
              >
                Go to Login Page
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Customer Support Queries</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
        >
          Logout
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6 flex space-x-2">
          <button
            onClick={() => setFilter('open')}
            className={`px-4 py-2 rounded-lg ${filter === 'open' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Open
          </button>
          <button
            onClick={() => setFilter('answered')}
            className={`px-4 py-2 rounded-lg ${filter === 'answered' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Answered
          </button>
          <button
            onClick={() => setFilter('closed')}
            className={`px-4 py-2 rounded-lg ${filter === 'closed' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Closed
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            All
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact List */}
          <div className="lg:col-span-1">
            <div className="space-y-4 max-h-screen overflow-y-auto pr-2">
              {contacts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No {filter === 'all' ? '' : filter + ' '}queries found
                </div>
              ) : (
                contacts.map(contact => (
                  <div 
                    key={contact._id} 
                    className={`border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      activeContact?._id === contact._id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => {
                      setActiveContact(contact);
                      setReplyMessage('');
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{contact.subject}</h3>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <FiUser className="mr-1" />
                          <span>{contact.userId?.username || 'Unknown user'}</span>
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <FiMail className="mr-1" />
                          <span>{contact.userId?.email || 'No email'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          contact.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                          contact.status === 'answered' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {contact.status}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          {new Date(contact.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Contact Detail */}
          <div className="lg:col-span-2">
            {activeContact ? (
              <div className="border rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">{activeContact.subject}</h2>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activeContact.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                    activeContact.status === 'answered' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {activeContact.status}
                  </span>
                </div>

                <div className="space-y-4 mb-8">
                  {activeContact.messages.map((message, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg ${
                        message.sender === 'user' 
                          ? 'bg-gray-100 mr-auto' 
                          : 'bg-blue-100 ml-auto'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(message.timestamp).toLocaleString()} - {message.sender}
                      </p>
                    </div>
                  ))}
                </div>

                {activeContact.status === 'open' && (
                  <form onSubmit={handleSubmitReply} className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Reply to Query</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Response
                      </label>
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        rows="5"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        maxLength="1000"
                      />
                    </div>
                    
                    {error && (
                      <div className="text-red-600 text-sm mt-2">{error}</div>
                    )}
                    
                    <button
                      type="submit"
                      className="mt-4 flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                      disabled={!replyMessage.trim()}
                    >
                      <FiSend className="mr-2" /> Send Reply
                    </button>
                  </form>
                )}

                {activeContact.feedback && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-2">Customer Feedback</h3>
                    <div className="flex items-center mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => (
                          <FiStar 
                            key={star}
                            className={`w-5 h-5 ${
                              star <= activeContact.feedback.rating 
                                ? 'text-yellow-500 fill-current' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {activeContact.feedback.rating} out of 5
                      </span>
                    </div>
                    {activeContact.feedback.comment && (
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {activeContact.feedback.comment}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="border rounded-lg p-8 text-center text-gray-500">
                <FiMessageSquare className="mx-auto text-4xl mb-3" />
                <p>Select a query from the list to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminContactPage;