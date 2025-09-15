import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

class EmbeddingService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.embeddingModel = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
    }

    /**
     * Generate embedding for text using Google Gemini
     * @param {string} text - Text to embed
     * @returns {Promise<number[]>} - Embedding vector
     */
    async generateEmbedding(text) {
        try {
            if (!text || typeof text !== 'string') {
                throw new Error('Text must be a non-empty string');
            }

            // Clean and prepare text
            const cleanText = text.trim().substring(0, 8000); // Limit text length
            
            const result = await this.embeddingModel.embedContent(cleanText);
            const embedding = result.embedding.values;
            
            return embedding;
        } catch (error) {
            console.error('Error generating embedding:', error);
            throw new Error(`Failed to generate embedding: ${error.message}`);
        }
    }

    /**
     * Generate embeddings for multiple texts
     * @param {string[]} texts - Array of texts to embed
     * @returns {Promise<number[][]>} - Array of embedding vectors
     */
    async generateEmbeddings(texts) {
        try {
            if (!Array.isArray(texts) || texts.length === 0) {
                throw new Error('Texts must be a non-empty array');
            }

            const embeddings = [];
            for (const text of texts) {
                const embedding = await this.generateEmbedding(text);
                embeddings.push(embedding);
            }

            return embeddings;
        } catch (error) {
            console.error('Error generating embeddings:', error);
            throw new Error(`Failed to generate embeddings: ${error.message}`);
        }
    }

    /**
     * Calculate cosine similarity between two embeddings
     * @param {number[]} embedding1 - First embedding
     * @param {number[]} embedding2 - Second embedding
     * @returns {number} - Cosine similarity score (-1 to 1)
     */
    calculateCosineSimilarity(embedding1, embedding2) {
        if (embedding1.length !== embedding2.length) {
            throw new Error('Embeddings must have the same dimension');
        }

        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < embedding1.length; i++) {
            dotProduct += embedding1[i] * embedding2[i];
            norm1 += embedding1[i] * embedding1[i];
            norm2 += embedding2[i] * embedding2[i];
        }

        norm1 = Math.sqrt(norm1);
        norm2 = Math.sqrt(norm2);

        if (norm1 === 0 || norm2 === 0) {
            return 0;
        }

        return dotProduct / (norm1 * norm2);
    }

    /**
     * Prepare text for embedding by combining relevant information
     * @param {Object} data - Data object containing text fields
     * @param {string} type - Type of content (todo, ai_content, user_profile)
     * @returns {string} - Combined text for embedding
     */
    prepareTextForEmbedding(data, type) {
        switch (type) {
            case 'todo':
                return `${data.task} ${data.completed ? 'completed' : 'pending'}`.trim();
            
            case 'ai_content':
                return data.originalText || data.content || '';
            
            case 'user_profile':
                return `${data.name || ''} ${data.email || ''} ${data.role || ''}`.trim();
            
            default:
                return data.text || data.content || '';
        }
    }

    /**
     * Validate embedding vector
     * @param {number[]} embedding - Embedding vector to validate
     * @returns {boolean} - Whether embedding is valid
     */
    validateEmbedding(embedding) {
        if (!Array.isArray(embedding)) {
            return false;
        }

        if (embedding.length === 0) {
            return false;
        }

        // Check if all elements are numbers
        return embedding.every(val => typeof val === 'number' && !isNaN(val));
    }
}

export default EmbeddingService;
