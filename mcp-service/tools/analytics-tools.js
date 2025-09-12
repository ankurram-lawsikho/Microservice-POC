const axios = require('axios');

class AnalyticsTools {
  constructor() {
    this.todoServiceUrl = process.env.TODO_SERVICE_URL || 'http://localhost:3002';
    this.userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:3008';
  }

  async analyzeUserProductivity({ userId, timeframe = 'month' }) {
    try {
      // Get user's todos
      const todosResponse = await axios.get(`${this.todoServiceUrl}/todos/user/${userId}`);
      const todos = todosResponse.data;
      
      // Get user profile
      const userResponse = await axios.get(`${this.userServiceUrl}/users/${userId}`);
      const user = userResponse.data;
      
      // Calculate statistics
      const stats = this.calculateProductivityStats(todos, timeframe);
      
      return {
        success: true,
        data: {
          userId,
          user: {
            name: user.name,
            email: user.email,
            role: user.role || 'User'
          },
          timeframe,
          statistics: stats,
          analysis: this.generateProductivityAnalysis(stats)
        },
        message: 'Productivity analysis completed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to analyze user productivity'
      };
    }
  }

  async getTodoStatistics({ userId }) {
    try {
      const response = await axios.get(`${this.todoServiceUrl}/todos/user/${userId}`);
      const todos = response.data;
      
      const stats = this.calculateTodoStatistics(todos);
      
      return {
        success: true,
        data: {
          userId,
          statistics: stats
        },
        message: 'Todo statistics retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to retrieve todo statistics'
      };
    }
  }

  async suggestProductivityImprovements({ userId }) {
    try {
      // Get user's todos and profile
      const [todosResponse, userResponse] = await Promise.all([
        axios.get(`${this.todoServiceUrl}/todos/user/${userId}`),
        axios.get(`${this.userServiceUrl}/users/${userId}`)
      ]);
      
      const todos = todosResponse.data;
      const user = userResponse.data;
      
      // Calculate current statistics
      const stats = this.calculateProductivityStats(todos);
      
      // Generate suggestions based on patterns
      const suggestions = this.generateProductivitySuggestions(stats, user);
      
      return {
        success: true,
        data: {
          userId,
          user: {
            name: user.name,
            role: user.role || 'User'
          },
          currentStats: stats,
          suggestions
        },
        message: 'Productivity improvement suggestions generated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to generate productivity suggestions'
      };
    }
  }

  calculateProductivityStats(todos, timeframe = 'month') {
    const now = new Date();
    const timeframes = {
      week: 7,
      month: 30,
      year: 365
    };
    
    const daysBack = timeframes[timeframe] || 30;
    const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    
    // Filter todos by timeframe
    const recentTodos = todos.filter(todo => 
      new Date(todo.createdAt) >= cutoffDate
    );
    
    const total = recentTodos.length;
    const completed = recentTodos.filter(todo => todo.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Calculate average completion time
    const completedTodos = recentTodos.filter(todo => todo.completed);
    const avgCompletionTime = this.calculateAverageCompletionTime(completedTodos);
    
    // Calculate daily activity
    const dailyActivity = this.calculateDailyActivity(recentTodos, daysBack);
    
    return {
      timeframe,
      total,
      completed,
      pending,
      completionRate,
      avgCompletionTime,
      dailyActivity,
      trends: this.calculateTrends(recentTodos)
    };
  }

  calculateTodoStatistics(todos) {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Group by creation date
    const byDate = todos.reduce((acc, todo) => {
      const date = new Date(todo.createdAt).toDateString();
      if (!acc[date]) acc[date] = { created: 0, completed: 0 };
      acc[date].created++;
      if (todo.completed) acc[date].completed++;
      return acc;
    }, {});
    
    return {
      total,
      completed,
      pending,
      completionRate,
      byDate,
      recentActivity: Object.keys(byDate).slice(-7) // Last 7 days
    };
  }

  calculateAverageCompletionTime(completedTodos) {
    if (completedTodos.length === 0) return 0;
    
    const totalTime = completedTodos.reduce((sum, todo) => {
      const created = new Date(todo.createdAt);
      const updated = new Date(todo.updatedAt);
      return sum + (updated.getTime() - created.getTime());
    }, 0);
    
    return Math.round(totalTime / completedTodos.length / (1000 * 60 * 60)); // Hours
  }

  calculateDailyActivity(todos, daysBack) {
    const activity = {};
    const now = new Date();
    
    for (let i = 0; i < daysBack; i++) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dateStr = date.toDateString();
      activity[dateStr] = { created: 0, completed: 0 };
    }
    
    todos.forEach(todo => {
      const createdDate = new Date(todo.createdAt).toDateString();
      if (activity[createdDate]) {
        activity[createdDate].created++;
      }
      
      if (todo.completed) {
        const completedDate = new Date(todo.updatedAt).toDateString();
        if (activity[completedDate]) {
          activity[completedDate].completed++;
        }
      }
    });
    
    return activity;
  }

  calculateTrends(todos) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const twoWeeksAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
    
    const recentWeek = todos.filter(todo => new Date(todo.createdAt) >= weekAgo);
    const previousWeek = todos.filter(todo => 
      new Date(todo.createdAt) >= twoWeeksAgo && new Date(todo.createdAt) < weekAgo
    );
    
    const recentCompleted = recentWeek.filter(todo => todo.completed).length;
    const previousCompleted = previousWeek.filter(todo => todo.completed).length;
    
    const completionTrend = previousCompleted > 0 
      ? Math.round(((recentCompleted - previousCompleted) / previousCompleted) * 100)
      : 0;
    
    return {
      completionTrend,
      recentWeek: recentWeek.length,
      previousWeek: previousWeek.length,
      activityTrend: previousWeek.length > 0 
        ? Math.round(((recentWeek.length - previousWeek.length) / previousWeek.length) * 100)
        : 0
    };
  }

  generateProductivityAnalysis(stats) {
    const { completionRate, avgCompletionTime, trends } = stats;
    
    let analysis = [];
    
    if (completionRate >= 80) {
      analysis.push("Excellent productivity! You're completing most of your tasks.");
    } else if (completionRate >= 60) {
      analysis.push("Good productivity level. Consider focusing on completing more tasks.");
    } else if (completionRate >= 40) {
      analysis.push("Moderate productivity. You might benefit from better task prioritization.");
    } else {
      analysis.push("Low productivity detected. Consider breaking down tasks into smaller chunks.");
    }
    
    if (avgCompletionTime < 24) {
      analysis.push("Great! You're completing tasks quickly.");
    } else if (avgCompletionTime < 72) {
      analysis.push("Good completion time. Most tasks are done within a few days.");
    } else {
      analysis.push("Tasks are taking longer to complete. Consider setting deadlines.");
    }
    
    if (trends.completionTrend > 10) {
      analysis.push("Your productivity is improving! Keep up the good work.");
    } else if (trends.completionTrend < -10) {
      analysis.push("Your productivity has decreased recently. Consider reviewing your workflow.");
    }
    
    return analysis;
  }

  generateProductivitySuggestions(stats, user) {
    const suggestions = [];
    const { completionRate, avgCompletionTime, trends } = stats;
    
    if (completionRate < 70) {
      suggestions.push({
        category: "Task Management",
        suggestion: "Break down large tasks into smaller, manageable subtasks",
        priority: "high"
      });
    }
    
    if (avgCompletionTime > 48) {
      suggestions.push({
        category: "Time Management",
        suggestion: "Set specific deadlines for tasks to improve completion time",
        priority: "medium"
      });
    }
    
    if (trends.activityTrend < -20) {
      suggestions.push({
        category: "Motivation",
        suggestion: "Consider reviewing your goals and priorities to boost activity",
        priority: "high"
      });
    }
    
    if (completionRate > 80 && avgCompletionTime < 24) {
      suggestions.push({
        category: "Growth",
        suggestion: "You're doing great! Consider taking on more challenging tasks",
        priority: "low"
      });
    }
    
    // Role-specific suggestions
    if (user.role === 'Developer') {
      suggestions.push({
        category: "Development",
        suggestion: "Consider using time-blocking techniques for coding sessions",
        priority: "medium"
      });
    } else if (user.role === 'Manager') {
      suggestions.push({
        category: "Leadership",
        suggestion: "Delegate more tasks to focus on strategic planning",
        priority: "medium"
      });
    }
    
    return suggestions;
  }
}

module.exports = { AnalyticsTools };
