import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUserInsights, clearUserInsights } from '../../store/slices/aiSlice';
import MarkdownRenderer from './MarkdownRenderer';

const UserInsights = () => {
  const dispatch = useDispatch();
  const { userInsights, loading, error } = useSelector((state) => state.ai);

  const handleGetInsights = () => {
    dispatch(getUserInsights());
  };

  if (loading.getUserInsights) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-2 text-gray-600">Analyzing your profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          User Insights
        </h3>
        {userInsights && (
          <button
            onClick={() => dispatch(clearUserInsights())}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Clear
          </button>
        )}
      </div>

      {!userInsights && !loading.getUserInsights && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">Get personalized productivity insights</p>
          <button
            onClick={handleGetInsights}
            className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Get My Insights
          </button>
        </div>
      )}

      {loading.getUserInsights && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-2 text-gray-600">Analyzing your profile...</span>
        </div>
      )}

      {userInsights && (
        <>
          {(() => {
            const { userProfile, todoStats } = userInsights;
            return (
              <>
                {/* User Profile */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Your Profile</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Name</div>
                      <div className="font-medium text-gray-900">{userProfile.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Email</div>
                      <div className="font-medium text-gray-900">{userProfile.email}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Role</div>
                      <div className="font-medium text-gray-900 capitalize">{userProfile.role || 'User'}</div>
                    </div>
                  </div>
                </div>

                {/* Todo Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{todoStats.total}</div>
                    <div className="text-sm text-blue-800">Total Todos</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{todoStats.completed}</div>
                    <div className="text-sm text-green-800">Completed</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{todoStats.pending}</div>
                    <div className="text-sm text-orange-800">Pending</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{todoStats.completionRate}%</div>
                    <div className="text-sm text-purple-800">Completion Rate</div>
                  </div>
                </div>

                {/* AI Insights */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">AI Insights & Recommendations</h4>
                  <MarkdownRenderer content={userInsights.insights} />
                </div>
              </>
            );
          })()}
        </>
      )}
    </div>
  );
};

export default UserInsights;
