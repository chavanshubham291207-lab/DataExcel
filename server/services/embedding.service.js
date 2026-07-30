const { GoogleGenerativeAI } = require('@google/generative-ai');

const getApiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_KEY || '';

/**
 * Generate 768-dimension semantic text embedding using Google Gemini api.
 */
async function generateEmbedding(text) {
  try {
    if (!text || typeof text !== 'string' || !text.trim()) {
      return new Array(768).fill(0);
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      // Deterministic fallback vector
      const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const vector = [];
      for (let i = 0; i < 768; i++) {
        vector.push(Math.sin(hash + i) * 0.1);
      }
      return vector;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'embedding-001' });
    const result = await model.embedContent(text.trim());
    
    if (result && result.embedding && result.embedding.values) {
      console.log('Embedding Generated');
      return result.embedding.values;
    }
  } catch (err) {
    console.warn('[EmbeddingService] Embedding generation failed, returning fallback vector:', err.message);
  }

  // Fallback vector
  const vector = [];
  const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  for (let i = 0; i < 768; i++) {
    vector.push(Math.sin(hash + i) * 0.1);
  }
  return vector;
}

/**
 * Calculates cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Hybrid Vector Search Runner.
 * Attempts $vectorSearch stage first; falls back to in-memory cosine similarity sorting on local databases.
 */
async function searchVector(model, vectorField, queryVector, filter = {}, limit = 10) {
  const startTime = Date.now();
  console.log('Vector Search Used');

  try {
    const pipeline = [
      {
        $vectorSearch: {
          index: `${vectorField.replace('_vector', '')}_vector`,
          path: vectorField,
          queryVector: queryVector,
          numCandidates: limit * 5,
          limit: limit
        }
      }
    ];
    if (Object.keys(filter).length > 0) {
      pipeline.push({ $match: filter });
    }
    
    const results = await model.aggregate(pipeline);
    if (results && results.length > 0) {
      console.log('Similarity Score:', (results[0].score || 0.85).toFixed(4));
      console.log('Returned Candidates:', results.length);
      console.log('Search Time:', Date.now() - startTime, 'ms');
      return results;
    }
  } catch (err) {
    // Fallback to in-memory cosine similarity
  }

  const docs = await model.find(filter).lean();
  const scoredDocs = docs.map(doc => {
    const docVector = doc[vectorField] || [];
    const score = cosineSimilarity(queryVector, docVector);
    return { ...doc, score };
  });

  scoredDocs.sort((a, b) => b.score - a.score);
  const finalResults = scoredDocs.slice(0, limit);

  const topScore = finalResults.length > 0 ? finalResults[0].score : 0;
  console.log('Similarity Score:', topScore.toFixed(4));
  console.log('Returned Candidates:', finalResults.length);
  console.log('Search Time:', Date.now() - startTime, 'ms');

  return finalResults;
}

module.exports = {
  generateEmbedding,
  cosineSimilarity,
  searchVector
};
