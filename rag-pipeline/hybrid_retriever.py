"""
Foodify Hybrid Search & Retrieval Engine
Combines sparse lexical retrieval (BM25 keyword matching) with dense semantic
vector cosine similarity and hard dietary/allergen filtering.
"""

import math
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("FoodifyHybridRetriever")

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    dot = sum(a * b for a, b in zip(v1, v2))
    norm_a = math.sqrt(sum(a * a for a in v1))
    norm_b = math.sqrt(sum(b * b for b in v2))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)

def compute_lexical_score(query: str, text: str) -> float:
    """
    Computes BM25-approximated lexical overlap score between query tokens and document.
    """
    q_tokens = set(query.lower().split())
    doc_tokens = text.lower().split()
    if not doc_tokens:
        return 0.0
    matches = sum(1 for t in doc_tokens if t in q_tokens)
    return min(1.0, (matches / max(1, len(q_tokens))) * 1.2)

def hybrid_search(
    query: str,
    query_embedding: List[float],
    corpus: List[Dict[str, Any]],
    user_dietary_restrictions: Optional[List[str]] = None,
    user_allergens: Optional[List[str]] = None,
    alpha: float = 0.65,  # Weight for vector score vs lexical score
    top_k: int = 5
) -> List[Dict[str, Any]]:
    """
    Executes hybrid retrieval:
    1. Hard filter: Exclude chunks violating user allergens
    2. Dense search: Cosine similarity on query_embedding vs chunk embedding
    3. Sparse search: BM25 / token overlap
    4. Personalization boost: Boost items matching user dietary preferences
    5. Reciprocal Rank / Weighted Fusion score: final_score = alpha * dense + (1 - alpha) * sparse + dietary_bonus
    """
    user_dietary = set(d.lower() for d in (user_dietary_restrictions or []))
    allergens = set(a.lower() for a in (user_allergens or []))

    scored_results = []

    for item in corpus:
        metadata = item.get("metadata", {})
        item_allergens = set(a.lower() for a in metadata.get("allergens", []))

        # Hard constraint: Filter out fatal allergens
        if allergens and any(a in item_allergens for a in allergens):
            continue

        # Compute dense semantic similarity
        dense_score = cosine_similarity(query_embedding, item.get("embedding", []))

        # Compute sparse lexical score
        sparse_score = compute_lexical_score(query, item.get("chunk_text", ""))

        # Compute dietary alignment boost
        item_dietary = set(d.lower() for d in metadata.get("dietary_tags", []))
        dietary_matches = len(user_dietary.intersection(item_dietary))
        dietary_boost = 0.15 * min(2, dietary_matches)

        hybrid_score = (alpha * dense_score) + ((1.0 - alpha) * sparse_score) + dietary_boost

        scored_results.append({
            "chunk_id": item.get("id"),
            "dish_name": item.get("dish_name"),
            "restaurant_id": item.get("restaurant_id"),
            "hybrid_score": round(hybrid_score, 4),
            "dense_similarity": round(dense_score, 4),
            "lexical_score": round(sparse_score, 4),
            "dietary_match_count": dietary_matches,
            "metadata": metadata,
            "chunk_text": item.get("chunk_text")
        })

    scored_results.sort(key=lambda x: x["hybrid_score"], reverse=True)
    return scored_results[:top_k]
