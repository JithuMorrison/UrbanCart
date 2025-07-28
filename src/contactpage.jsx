import React, { useState, useEffect } from 'react';
import { FiMessageSquare, FiStar, FiSend, FiChevronRight } from 'react-icons/fi';

const ContactPage = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeContact, setActiveContact] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [feedback, setFeedback] = useState({ rating: 5, comment: '' });
  const [view, setView] = useState('list'); // 'list', 'new', 'detail'
  const currentUser = localStorage.getItem('userId');

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch(`http://localhost:3000/contacts/${currentUser}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setContacts(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching contacts:', err);
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchContacts();
    }
  }, [currentUser]);

  const handleSubmitNewContact = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          subject,
          message: newMessage,
          user: {
            _id: currentUser,
          }
        })
      });
      
      const data = await response.json();
      setContacts([data, ...contacts]);
      setView('detail');
      setActiveContact(data);
      setNewMessage('');
      setSubject('');
    } catch (err) {
      console.error('Error submitting contact:', err);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3000/contacts/${activeContact._id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(feedback)
      });
      
      const data = await response.json();
      setContacts(contacts.map(c => c._id === data._id ? data : c));
      setActiveContact(data);
    } catch (err) {
      console.error('Error submitting feedback:', err);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Contact Support</h1>
        
        {view === 'list' && (
          <div>
            <button 
              onClick={() => setView('new')}
              className="mb-6 flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              <FiMessageSquare className="mr-2" /> New Query
            </button>
            
            <div className="space-y-4">
              {contacts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  You haven't contacted support yet
                </div>
              ) : (
                contacts.map(contact => (
                  <div 
                    key={contact._id} 
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setActiveContact(contact);
                      setView('detail');
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{contact.subject}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(contact.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          contact.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                          contact.status === 'answered' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {contact.status}
                        </span>
                        <FiChevronRight className="ml-2" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {view === 'new' && (
          <div>
            <button 
              onClick={() => setView('list')}
              className="mb-4 text-blue-600 hover:text-blue-800"
            >
              ← Back to queries
            </button>
            
            <form onSubmit={handleSubmitNewContact} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Message</label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                <FiSend className="mr-2" /> Submit Query
              </button>
            </form>
          </div>
        )}

        {view === 'detail' && activeContact && (
          <div>
            <button 
              onClick={() => setView('list')}
              className="mb-4 text-blue-600 hover:text-blue-800"
            >
              ← Back to queries
            </button>
            
            <h2 className="text-xl font-semibold mb-2">{activeContact.subject}</h2>
            <p className="text-sm text-gray-500 mb-6">
              Created: {new Date(activeContact.createdAt).toLocaleString()}
            </p>
            
            <div className="space-y-4 mb-8">
              {activeContact.messages.map((message, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg ${message.sender === 'user' ? 'bg-gray-100 ml-auto max-w-3/4' : 'bg-blue-100 mr-auto max-w-3/4'}`}
                >
                  <p>{message.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()} - {message.sender}
                  </p>
                </div>
              ))}
            </div>
            
            {activeContact.status === 'answered' && !activeContact.feedback && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Submit Feedback</h3>
                <form onSubmit={handleSubmitFeedback} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating
                    </label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedback({...feedback, rating: star})}
                          className={`p-2 rounded-full ${feedback.rating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                        >
                          <FiStar className="w-6 h-6 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Comments (optional)
                    </label>
                    <textarea
                      value={feedback.comment}
                      onChange={(e) => setFeedback({...feedback, comment: e.target.value})}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="flex items-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Submit Feedback
                  </button>
                </form>
              </div>
            )}
            
            {activeContact.feedback && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-2">Your Feedback</h3>
                <div className="flex items-center mb-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <FiStar 
                        key={star}
                        className={`w-5 h-5 ${star <= activeContact.feedback.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    {activeContact.feedback.rating} out of 5
                  </span>
                </div>
                {activeContact.feedback.comment && (
                  <p className="text-gray-700">{activeContact.feedback.comment}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* About Information Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-bold mb-4">About Our Support</h2>
        <div className="prose max-w-none">
          <p>Our support team is here to help you with any questions or issues you may have.</p>
          <p>When you submit a query:</p>
          <ul className="list-disc pl-5">
            <li>Our team typically responds within 24 hours</li>
            <li>You'll receive one comprehensive reply to your query</li>
            <li>After our response, you can provide feedback on the solution</li>
          </ul>
          <p className="mt-4">
            For urgent matters, please call our hotline at <strong>1-800-HELP-NOW</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;