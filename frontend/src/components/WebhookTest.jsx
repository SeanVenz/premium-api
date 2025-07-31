import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const WebhookTest = () => {
    const [events, setEvents] = useState([]);
    const [isListening, setIsListening] = useState(false);
    const navigate = useNavigate();

    // Simulate webhook event listening (in real app, this would be via WebSocket or polling)
    useEffect(() => {
        if (isListening) {
            const interval = setInterval(() => {
                // This is just for demonstration
                console.log('Listening for webhook events...');
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [isListening]);

    const addEvent = (event) => {
        setEvents(prev => [{ ...event, timestamp: new Date(), id: Date.now() }, ...prev]);
    };

    const testWebhook = () => {
        // Simulate a test event
        addEvent({
            type: 'payment_intent.succeeded',
            data: {
                id: 'pi_test_' + Math.random().toString(36).substr(2, 9),
                amount: 2999,
                currency: 'usd',
                status: 'succeeded'
            },
            source: 'test'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold text-gray-900">Webhook Testing Dashboard</h1>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                ← Back to Dashboard
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Webhook Status */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm">✓</span>
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-green-800">Webhook Endpoint</p>
                                        <p className="text-xs text-green-600">/api/webhooks/stripe</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm">🔑</span>
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-blue-800">Webhook Secret</p>
                                        <p className="text-xs text-blue-600">Configured ✓</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm">📧</span>
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-purple-800">Email Templates</p>
                                        <p className="text-xs text-purple-600">Ready ✓</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Test Controls */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Test Controls</h3>
                            <div className="flex space-x-4">
                                <button
                                    onClick={testWebhook}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Simulate Payment Success
                                </button>
                                <button
                                    onClick={() => setIsListening(!isListening)}
                                    className={`px-4 py-2 rounded-md ${
                                        isListening 
                                            ? 'bg-red-600 text-white hover:bg-red-700' 
                                            : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                                >
                                    {isListening ? 'Stop Listening' : 'Start Listening'}
                                </button>
                                <button
                                    onClick={() => setEvents([])}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                                >
                                    Clear Events
                                </button>
                            </div>
                        </div>

                        {/* Events Log */}
                        <div className="bg-white border border-gray-200 rounded-lg">
                            <div className="px-4 py-3 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Webhook Events</h3>
                                <p className="text-sm text-gray-500">Real-time webhook event monitoring</p>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {events.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <div className="text-gray-400 text-4xl mb-4">📡</div>
                                        <p className="text-gray-500">No webhook events yet</p>
                                        <p className="text-sm text-gray-400 mt-1">
                                            Make a test payment or simulate an event to see webhook activity
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-200">
                                        {events.map((event) => (
                                            <div key={event.id} className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                event.type.includes('succeeded') 
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : event.type.includes('failed')
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-blue-100 text-blue-800'
                                                            }`}>
                                                                {event.type}
                                                            </span>
                                                            {event.source === 'test' && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                    TEST
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mt-2">
                                                            <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
                                                                {JSON.stringify(event.data, null, 2)}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4 text-xs text-gray-500">
                                                        {event.timestamp.toLocaleTimeString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-yellow-800 mb-2">💡 Testing Instructions</h4>
                            <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                                <li>Make sure your Stripe CLI is running: <code className="bg-yellow-100 px-1 rounded">stripe listen --forward-to localhost:3000/api/webhooks/stripe</code></li>
                                <li>Go to the Payment page and complete a test transaction</li>
                                <li>Check your backend console for webhook events</li>
                                <li>Verify that email was sent and license was created</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WebhookTest;
