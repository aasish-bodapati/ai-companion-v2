import logging
from typing import List, Optional, Dict, Any
import numpy as np
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    """
    Service for generating and managing text embeddings.
    Supports multiple embedding backends (OpenAI, Cohere, local models).
    """
    
    def __init__(self):
        self.embedding_model = settings.EMBEDDING_MODEL
        self._initialize_embedding_model()
    
    def _initialize_embedding_model(self):
        """Initialize the embedding model based on configuration"""
        try:
            if self.embedding_model.startswith("text-embedding"):  # OpenAI
                import openai
                self.embedding_fn = self._get_openai_embeddings
                logger.info(f"Using OpenAI embeddings with model: {self.embedding_model}")
            elif self.embedding_model.startswith("embed-"):  # Cohere
                import cohere
                self.co = cohere.Client(settings.COHERE_API_KEY)
                self.embedding_fn = self._get_cohere_embeddings
                logger.info(f"Using Cohere embeddings with model: {self.embedding_model}")
            else:  # Local model (e.g., sentence-transformers)
                from sentence_transformers import SentenceTransformer
                self.model = SentenceTransformer(self.embedding_model)
                self.embedding_fn = self._get_local_embeddings
                logger.info(f"Using local embeddings with model: {self.embedding_model}")
        except ImportError as e:
            logger.error(f"Failed to initialize embedding model: {str(e)}")
            raise
    
    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Get embeddings for a list of text chunks.
        
        Args:
            texts: List of text strings to embed
            
        Returns:
            List of embedding vectors (list of floats)
        """
        if not texts:
            return []
            
        try:
            return self.embedding_fn(texts)
        except Exception as e:
            logger.error(f"Error generating embeddings: {str(e)}")
            raise
    
    def _get_openai_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Get embeddings using OpenAI API"""
        import openai
        
        # Replace newlines with spaces to avoid API issues
        texts = [text.replace("\n", " ") for text in texts]
        
        response = openai.Embedding.create(
            input=texts,
            model=self.embedding_model
        )
        
        # Extract embeddings from response
        return [item["embedding"] for item in response["data"]]
    
    def _get_cohere_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Get embeddings using Cohere API"""
        response = self.co.embed(
            texts=texts,
            model=self.embedding_model
        )
        return response.embeddings
    
    def _get_local_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Get embeddings using a local model"""
        return self.model.encode(texts, convert_to_numpy=True).tolist()
    
    @staticmethod
    def cosine_similarity(embedding1: List[float], embedding2: List[float]) -> float:
        """Calculate cosine similarity between two embeddings"""
        a = np.array(embedding1)
        b = np.array(embedding2)
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
    
    @staticmethod
    def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 100) -> List[str]:
        """
        Split text into overlapping chunks.
        
        Args:
            text: Input text to chunk
            chunk_size: Maximum size of each chunk (in characters)
            overlap: Number of characters to overlap between chunks
            
        Returns:
            List of text chunks
        """
        if not text:
            return []
            
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            if end >= len(text):
                chunks.append(text[start:])
                break
                
            # Try to find a good breaking point (end of sentence or paragraph)
            break_point = text.rfind('.', start, end)
            if break_point == -1 or (break_point - start) < (chunk_size // 2):
                break_point = text.rfind(' ', start, end)
                if break_point == -1:
                    break_point = end
            
            chunks.append(text[start:break_point + 1].strip())
            start = break_point + 1 - overlap
            
            # Ensure we make progress
            if start <= break_point - overlap:
                start = break_point + 1
        
        return chunks
