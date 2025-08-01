import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { licenseAPI } from '../services/api';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [licenses, setLicenses] = useState([]);
    const [wordPressInfo, setWordPressInfo] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchUserLicenses = useCallback(async () => {
        if (!user) return;
        
        setLoading(true);
        setError(null);
        try {
            const response = await licenseAPI.getUserLicenses();
            if (response.success) {
                setLicenses(response.data.licenses || []);
                setWordPressInfo(response.data.wordPressInfo || []);
            } else {
                setError(response.message || 'Failed to fetch licenses');
            }
        } catch (error) {
            console.error('Error fetching licenses:', error);
            setError(error.response?.data?.message || 'Failed to fetch licenses');
            // Fallback to demo data for testing
            setLicenses([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const handleToggleLicense = async (licenseId, activate) => {
        setActionLoading(true);
        try {
            const response = activate 
                ? await licenseAPI.activateLicense(licenseId)
                : await licenseAPI.deactivateLicense(licenseId);
            
            if (response.success) {
                // Refresh licenses after successful toggle
                await fetchUserLicenses();
            } else {
                setError(response.message || 'Failed to update license status');
            }
        } catch (error) {
            console.error('Error toggling license:', error);
            setError(error.response?.data?.message || 'Failed to update license status');
        } finally {
            setActionLoading(false);
        }
    };

    useEffect(() => {
        fetchUserLicenses();
    }, [fetchUserLicenses]);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-900">Premium API Dashboard</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">Welcome, {user.username}!</span>
                            <button
                                onClick={handleLogout}
                                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-200"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {/* User Info Card */}
                    <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Account Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Username</dt>
                                    <dd className="text-sm text-gray-900">{user.username}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                                    <dd className="text-sm text-gray-900">{user.email}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Account Status</dt>
                                    <dd className="text-sm text-green-600 font-semibold">Verified ✓</dd>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                            <span className="text-white font-bold">🛒</span>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Purchase License
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                <a href="/payment" className="text-blue-600 hover:text-blue-500">
                                                    Buy Premium →
                                                </a>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                            <span className="text-white font-bold">📊</span>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Active Licenses
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {licenses.filter(l => l.isActive).length}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                                            <span className="text-white font-bold">🔑</span>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Total Licenses
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {licenses.length}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Licenses Table */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Your Licenses</h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Manage your premium API licenses
                            </p>
                        </div>
                        <div className="border-t border-gray-200">
                            {loading ? (
                                <div className="p-4 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="mt-2 text-gray-500">Loading licenses...</p>
                                </div>
                            ) : error ? (
                                <div className="p-6 text-center">
                                    <div className="text-red-400 text-4xl mb-4">⚠️</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Licenses</h3>
                                    <p className="text-red-600 mb-4">{error}</p>
                                    <button
                                        onClick={fetchUserLicenses}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        Retry
                                    </button>
                                </div>
                            ) : licenses.length === 0 ? (
                                <div className="p-6 text-center">
                                    <div className="text-gray-400 text-6xl mb-4">🔑</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No licenses yet</h3>
                                    <p className="text-gray-500 mb-4">Get started by purchasing your first premium license</p>
                                    <a
                                        href="/payment"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        Purchase License
                                    </a>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200">
                                    {licenses.map((license, index) => (
                                        <div key={license.id || index} className={`p-6 ${license.isDeactivated ? 'opacity-50 bg-gray-100' : ''}`}>
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-lg font-medium text-gray-900">
                                                    License #{license.id || index + 1}
                                                </h4>
                                                <div className="flex items-center space-x-2">
                                                    {license.isDeactivated ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                            Permanently Deactivated
                                                        </span>
                                                    ) : (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            license.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {license.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {license.isDeactivated && (
                                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                                    <div className="flex items-center">
                                                        <span className="text-red-400 text-lg mr-2">🚫</span>
                                                        <p className="text-sm text-red-700 font-medium">
                                                            This license has been permanently deactivated and cannot be used anymore.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">License Key</dt>
                                                    <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border">
                                                        {license.licenseKey || 'N/A'}
                                                    </dd>
                                                </div>
                                                
                                                {license.WordPressInfo && (
                                                    <>
                                                        <div>
                                                            <dt className="text-sm font-medium text-gray-500">Site URL</dt>
                                                            <dd className="mt-1 text-sm text-gray-900">
                                                                {license.WordPressInfo.siteUrl || 'N/A'}
                                                            </dd>
                                                        </div>
                                                        
                                                        <div>
                                                            <dt className="text-sm font-medium text-gray-500">Plugin Version</dt>
                                                            <dd className="mt-1 text-sm text-gray-900">
                                                                {license.WordPressInfo.pluginVersion || 'N/A'}
                                                            </dd>
                                                        </div>
                                                        
                                                        <div>
                                                            <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                                                            <dd className="mt-1 text-sm text-gray-900">
                                                                {license.updatedAt ? 
                                                                    new Date(license.updatedAt).toLocaleDateString() : 
                                                                    'N/A'
                                                                }
                                                            </dd>
                                                        </div>
                                                    </>
                                                )}
                                                
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                                                    <dd className="mt-1 text-sm text-gray-900">
                                                        {license.createdAt ? 
                                                            new Date(license.createdAt).toLocaleDateString() : 
                                                            'N/A'
                                                        }
                                                    </dd>
                                                </div>
                                                
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">Updated</dt>
                                                    <dd className="mt-1 text-sm text-gray-900">
                                                        {license.lastValidated ? 
                                                            new Date(license.lastValidated).toLocaleDateString() : 
                                                            'N/A'
                                                        }   
                                                    </dd>
                                                </div>
                                            </dl>
                                            
                                            <div className="mt-4 flex space-x-3">
                                                {license.isDeactivated ? (
                                                    // Show disabled state for permanently deactivated licenses
                                                    <div className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-500 bg-gray-100 cursor-not-allowed">
                                                        <span className="mr-2">🚫</span>
                                                        Cannot be activated
                                                    </div>
                                                ) : license.isActive ? (
                                                    // Show deactivate button if license is active and not permanently deactivated
                                                    <button
                                                        onClick={() => handleToggleLicense(license.licenseKey, false)}
                                                        disabled={actionLoading}
                                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
                                                    >
                                                        {actionLoading ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                        ) : null}
                                                        Deactivate
                                                    </button>
                                                ) : (
                                                    // Show WordPress activation message if license is not active and not permanently deactivated
                                                    <div className="inline-flex items-center px-3 py-2 border border-blue-300 text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50">
                                                        <span className="mr-2">🔌</span>
                                                        Activate this license through your WordPress plugin
                                                    </div>
                                                )}
                                                
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(license.licenseKey || '');
                                                        alert('License key copied to clipboard!');
                                                    }}
                                                    disabled={license.isDeactivated}
                                                    className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                                                        license.isDeactivated 
                                                            ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                                                            : 'text-gray-700 bg-white hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {license.isDeactivated ? 'Key Unavailable' : 'Copy Key'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Testing Section */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-blue-900 mb-4">🧪 Testing Features</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-medium text-blue-800 mb-2">Webhook Status</h4>
                                <p className="text-sm text-blue-700">
                                    ✅ Webhook endpoint: <code>/api/webhooks/stripe</code><br/>
                                    ✅ Email templates ready<br/>
                                    ✅ License generation configured
                                </p>
                            </div>
                            <div>
                                <h4 className="font-medium text-blue-800 mb-2">Test Payment Flow</h4>
                                <p className="text-sm text-blue-700 mb-2">
                                    Complete payment → Webhook triggers → License created → Email sent
                                </p>
                                <div className="space-x-2">
                                    <a
                                        href="/payment"
                                        className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
                                    >
                                        Test Payment →
                                    </a>
                                    <a
                                        href="/webhook-test"
                                        className="inline-flex items-center px-3 py-1 border border-purple-300 text-sm font-medium rounded-md text-purple-700 bg-white hover:bg-purple-50"
                                    >
                                        Monitor Webhooks →
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
