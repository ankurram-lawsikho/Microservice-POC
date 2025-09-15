import { pool } from '../config/database.js';
import EmbeddingService from './embeddingService.js';

class VectorSearchService {
    constructor() {
        this.embeddingService = new EmbeddingService();
    }

    /**
     * Store todo embedding
     * @param {Object} todoData - Todo data
     * @param {string} todoData.todoId - Todo ID
     * @param {number} todoData.userId - User ID
     * @param {string} todoData.task - Todo task text
     * @param {boolean} todoData.completed - Completion status
     * @param {Object} metadata - Additional metadata
     * @returns {Promise<Object>} - Stored embedding record
     */
    async storeTodoEmbedding(todoData, metadata = {}) {
        try {
            const client = await pool.connect();
            
            try {
                // Check if embedding already exists
                const existingResult = await client.query(
                    'SELECT id FROM todo_embeddings WHERE "todoId" = $1',
                    [todoData.todoId]
                );
                
                // Prepare text for embedding
                const textForEmbedding = this.embeddingService.prepareTextForEmbedding(todoData, 'todo');
                
                // Generate embedding
                const embedding = await this.embeddingService.generateEmbedding(textForEmbedding);
                
                // Convert embedding array to vector string format
                const embeddingVector = `[${embedding.join(',')}]`;
                
                const embeddingMetadata = {
                    ...metadata,
                    completed: todoData.completed,
                    originalText: textForEmbedding
                };

                if (existingResult.rows.length > 0) {
                    // Update existing embedding
                    const updateResult = await client.query(`
                        UPDATE todo_embeddings 
                        SET "userId" = $1, task = $2, embedding = $3, 
                            "embeddingModel" = $4, metadata = $5, "updatedAt" = CURRENT_TIMESTAMP
                        WHERE "todoId" = $6
                        RETURNING *
                    `, [
                        todoData.userId,
                        todoData.task,
                        embeddingVector,
                        'text-embedding-004',
                        JSON.stringify(embeddingMetadata),
                        todoData.todoId
                    ]);
                    
                    return updateResult.rows[0];
                } else {
                    // Create new embedding
                    const insertResult = await client.query(`
                        INSERT INTO todo_embeddings ("todoId", "userId", task, embedding, "embeddingModel", metadata)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        RETURNING *
                    `, [
                        todoData.todoId,
                        todoData.userId,
                        todoData.task,
                        embeddingVector,
                        'text-embedding-004',
                        JSON.stringify(embeddingMetadata)
                    ]);
                    
                    return insertResult.rows[0];
                }
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error storing todo embedding:', error);
            throw new Error(`Failed to store todo embedding: ${error.message}`);
        }
    }

    /**
     * Store AI content embedding
     * @param {Object} contentData - Content data
     * @param {number} contentData.userId - User ID
     * @param {string} contentData.contentType - Type of content
     * @param {string} contentData.originalText - Original text content
     * @param {Object} metadata - Additional metadata
     * @returns {Promise<Object>} - Stored embedding record
     */
    async storeAIContentEmbedding(contentData, metadata = {}) {
        try {
            const client = await pool.connect();
            
            try {
                // Generate embedding
                const embedding = await this.embeddingService.generateEmbedding(contentData.originalText);
                
                // Convert embedding array to vector string format
                const embeddingVector = `[${embedding.join(',')}]`;
                
                const embeddingMetadata = {
                    ...metadata,
                    timestamp: new Date().toISOString()
                };

                const result = await client.query(`
                    INSERT INTO ai_content_embeddings ("userId", "contentType", "originalText", embedding, "embeddingModel", metadata)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
                `, [
                    contentData.userId,
                    contentData.contentType,
                    contentData.originalText,
                    embeddingVector,
                    'text-embedding-004',
                    JSON.stringify(embeddingMetadata)
                ]);

                return result.rows[0];
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error storing AI content embedding:', error);
            throw new Error(`Failed to store AI content embedding: ${error.message}`);
        }
    }

    /**
     * Store user profile embedding
     * @param {Object} profileData - Profile data
     * @param {number} profileData.userId - User ID
     * @param {Object} profileData.profileData - User profile information
     * @param {Object} metadata - Additional metadata
     * @returns {Promise<Object>} - Stored embedding record
     */
    async storeUserProfileEmbedding(profileData, metadata = {}) {
        try {
            const client = await pool.connect();
            
            try {
                // Prepare text for embedding
                const textForEmbedding = this.embeddingService.prepareTextForEmbedding(profileData, 'user');
                
                // Generate embedding
                const embedding = await this.embeddingService.generateEmbedding(textForEmbedding);
                
                // Convert embedding array to vector string format
                const embeddingVector = `[${embedding.join(',')}]`;
                
                const embeddingMetadata = {
                    ...metadata,
                    timestamp: new Date().toISOString()
                };

                // Check if profile embedding already exists
                const existingResult = await client.query(
                    'SELECT id FROM user_profile_embeddings WHERE "userId" = $1',
                    [profileData.userId]
                );

                if (existingResult.rows.length > 0) {
                    // Update existing embedding
                    const updateResult = await client.query(`
                        UPDATE user_profile_embeddings 
                        SET "profileData" = $1, embedding = $2, 
                            "embeddingModel" = $3, metadata = $4, "updatedAt" = CURRENT_TIMESTAMP
                        WHERE "userId" = $5
                        RETURNING *
                    `, [
                        JSON.stringify(profileData.profileData),
                        embeddingVector,
                        'text-embedding-004',
                        JSON.stringify(embeddingMetadata),
                        profileData.userId
                    ]);
                    
                    return updateResult.rows[0];
                } else {
                    // Create new embedding
                    const insertResult = await client.query(`
                        INSERT INTO user_profile_embeddings ("userId", "profileData", embedding, "embeddingModel", metadata)
                        VALUES ($1, $2, $3, $4, $5)
                        RETURNING *
                    `, [
                        profileData.userId,
                        JSON.stringify(profileData.profileData),
                        embeddingVector,
                        'text-embedding-004',
                        JSON.stringify(embeddingMetadata)
                    ]);
                    
                    return insertResult.rows[0];
                }
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error storing user profile embedding:', error);
            throw new Error(`Failed to store user profile embedding: ${error.message}`);
        }
    }

    /**
     * Search for similar todos using vector similarity
     * @param {string} query - Search query
     * @param {number} userId - User ID (optional)
     * @param {number} limit - Maximum number of results
     * @param {number} threshold - Similarity threshold (0-1)
     * @returns {Promise<Array>} - Array of similar todos
     */
    async searchSimilarTodos(query, userId = null, limit = 10, threshold = 0.7) {
        try {
            const client = await pool.connect();
            
            try {
                // Generate embedding for the query
                const queryEmbedding = await this.embeddingService.generateEmbedding(query);
                const queryVector = `[${queryEmbedding.join(',')}]`;
                
                let sqlQuery = `
                    SELECT
                        "todoId",
                        "userId",
                        task,
                        metadata,
                        "createdAt",
                        (embedding <=> $1) as distance,
                        (1 - (embedding <=> $1)) as similarity
                    FROM todo_embeddings
                    WHERE (1 - (embedding <=> $1)) >= $2
                `;
                
                const params = [queryVector, threshold];
                
                if (userId) {
                    sqlQuery += ` AND "userId" = $3`;
                    params.push(userId);
                }
                
                sqlQuery += ` ORDER BY similarity DESC LIMIT $${params.length + 1}`;
                params.push(limit);
                
                const result = await client.query(sqlQuery, params);
                
                return result.rows.map(row => ({
                    todoId: row.todoId,
                    userId: row.userId,
                    task: row.task,
                    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
                    createdAt: row.createdAt,
                    similarity: parseFloat(row.similarity),
                    distance: parseFloat(row.distance)
                }));
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error searching similar todos:', error);
            throw new Error(`Failed to search similar todos: ${error.message}`);
        }
    }

    /**
     * Search for similar AI content using vector similarity
     * @param {string} query - Search query
     * @param {number} userId - User ID (optional)
     * @param {string} contentType - Content type filter (optional)
     * @param {number} limit - Maximum number of results
     * @param {number} threshold - Similarity threshold (0-1)
     * @returns {Promise<Array>} - Array of similar AI content
     */
    async searchAIContent(query, userId = null, contentType = null, limit = 10, threshold = 0.7) {
        try {
            const client = await pool.connect();
            
            try {
                // Generate embedding for the query
                const queryEmbedding = await this.embeddingService.generateEmbedding(query);
                const queryVector = `[${queryEmbedding.join(',')}]`;
                
                let sqlQuery = `
                    SELECT
                        id,
                        "userId",
                        "contentType",
                        "originalText",
                        metadata,
                        "createdAt",
                        (embedding <=> $1) as distance,
                        (1 - (embedding <=> $1)) as similarity
                    FROM ai_content_embeddings
                    WHERE (1 - (embedding <=> $1)) >= $2
                `;
                
                const params = [queryVector, threshold];
                let paramIndex = 3;
                
                if (userId) {
                    sqlQuery += ` AND "userId" = $${paramIndex}`;
                    params.push(userId);
                    paramIndex++;
                }
                
                if (contentType) {
                    sqlQuery += ` AND "contentType" = $${paramIndex}`;
                    params.push(contentType);
                    paramIndex++;
                }
                
                sqlQuery += ` ORDER BY similarity DESC LIMIT $${paramIndex}`;
                params.push(limit);
                
                const result = await client.query(sqlQuery, params);
                
                return result.rows.map(row => ({
                    id: row.id,
                    userId: row.userId,
                    contentType: row.contentType,
                    originalText: row.originalText,
                    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
                    createdAt: row.createdAt,
                    similarity: parseFloat(row.similarity),
                    distance: parseFloat(row.distance)
                }));
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error searching AI content:', error);
            throw new Error(`Failed to search AI content: ${error.message}`);
        }
    }

    /**
     * Search for similar user profiles using vector similarity
     * @param {string} query - Search query
     * @param {number} limit - Maximum number of results
     * @param {number} threshold - Similarity threshold (0-1)
     * @returns {Promise<Array>} - Array of similar user profiles
     */
    async searchUserProfiles(query, limit = 10, threshold = 0.7) {
        try {
            const client = await pool.connect();
            
            try {
                // Generate embedding for the query
                const queryEmbedding = await this.embeddingService.generateEmbedding(query);
                const queryVector = `[${queryEmbedding.join(',')}]`;
                
                const result = await client.query(`
                    SELECT
                        "userId",
                        "profileData",
                        metadata,
                        "createdAt",
                        (embedding <=> $1) as distance,
                        (1 - (embedding <=> $1)) as similarity
                    FROM user_profile_embeddings
                    WHERE (1 - (embedding <=> $1)) >= $2
                    ORDER BY similarity DESC
                    LIMIT $3
                `, [queryVector, threshold, limit]);
                
                return result.rows.map(row => ({
                    userId: row.userId,
                    profileData: typeof row.profileData === 'string' ? JSON.parse(row.profileData) : row.profileData,
                    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
                    createdAt: row.createdAt,
                    similarity: parseFloat(row.similarity),
                    distance: parseFloat(row.distance)
                }));
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error searching user profiles:', error);
            throw new Error(`Failed to search user profiles: ${error.message}`);
        }
    }

    /**
     * Get embedding statistics
     * @returns {Promise<Object>} - Statistics about embeddings
     */
    async getEmbeddingStats() {
        try {
            const client = await pool.connect();
            
            try {
                const [todoStats, aiStats, userStats] = await Promise.all([
                    client.query('SELECT COUNT(*) as count FROM todo_embeddings'),
                    client.query('SELECT COUNT(*) as count FROM ai_content_embeddings'),
                    client.query('SELECT COUNT(*) as count FROM user_profile_embeddings')
                ]);
                
                return {
                    todoEmbeddings: parseInt(todoStats.rows[0].count),
                    aiContentEmbeddings: parseInt(aiStats.rows[0].count),
                    userProfileEmbeddings: parseInt(userStats.rows[0].count),
                    total: parseInt(todoStats.rows[0].count) + parseInt(aiStats.rows[0].count) + parseInt(userStats.rows[0].count)
                };
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error getting embedding stats:', error);
            throw new Error(`Failed to get embedding stats: ${error.message}`);
        }
    }

    /**
     * Delete todo embedding
     * @param {string} todoId - Todo ID
     * @returns {Promise<boolean>} - Success status
     */
    async deleteTodoEmbedding(todoId) {
        try {
            const client = await pool.connect();
            
            try {
                const result = await client.query(
                    'DELETE FROM todo_embeddings WHERE "todoId" = $1',
                    [todoId]
                );
                
                return result.rowCount > 0;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error deleting todo embedding:', error);
            throw new Error(`Failed to delete todo embedding: ${error.message}`);
        }
    }

    /**
     * Delete AI content embedding
     * @param {number} id - Embedding ID
     * @returns {Promise<boolean>} - Success status
     */
    async deleteAIContentEmbedding(id) {
        try {
            const client = await pool.connect();
            
            try {
                const result = await client.query(
                    'DELETE FROM ai_content_embeddings WHERE id = $1',
                    [id]
                );
                
                return result.rowCount > 0;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error deleting AI content embedding:', error);
            throw new Error(`Failed to delete AI content embedding: ${error.message}`);
        }
    }

    /**
     * Delete user profile embedding
     * @param {number} userId - User ID
     * @returns {Promise<boolean>} - Success status
     */
    async deleteUserProfileEmbedding(userId) {
        try {
            const client = await pool.connect();
            
            try {
                const result = await client.query(
                    'DELETE FROM user_profile_embeddings WHERE "userId" = $1',
                    [userId]
                );
                
                return result.rowCount > 0;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error deleting user profile embedding:', error);
            throw new Error(`Failed to delete user profile embedding: ${error.message}`);
        }
    }
}

export default VectorSearchService;