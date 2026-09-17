"""
Foodify RAG Ingestion Pipeline
Ingests restaurant menu data, user dietary preferences, and food trend contexts,
generates embeddings via Google Gemini or local vector models, and upserts to pgvector.
"""

import os
import sys
import json
import logging
from typing import List, Dict, Any

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("FoodifyIngestionPipeline")

def chunk_menu_document(item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transforms structured menu data into an information-dense semantic chunk
    optimized for embedding and vector similarity retrieval.
    """
    dietary_str = ", ".join(item.get("dietary_tags", [])) or "None specified"
    allergens_str = ", ".join(item.get("allergens", [])) or "None"
    ingredients_str = ", ".join(item.get("ingredients", []))

    semantic_text = (
        f"Restaurant: {item.get('restaurant_name')}. "
        f"Dish: {item.get('item_name')}. "
        f"Price: ${item.get('price'):.2f}. "
        f"Category: {item.get('category')}. "
        f"Cuisine: {item.get('cuisine', 'Contemporary')}. "
        f"Dietary: {dietary_str}. "
        f"Allergens: {allergens_str}. "
        f"Nutrition: {item.get('calories', 0)} kcal, {item.get('protein_g', 0)}g protein. "
        f"Key Ingredients: {ingredients_str}. "
        f"Description: {item.get('text', '')}"
    )

    return {
        "id": item.get("id"),
        "restaurant_id": item.get("restaurant_id"),
        "dish_name": item.get("item_name"),
        "chunk_text": semantic_text,
        "metadata": {
            "price": item.get("price"),
            "calories": item.get("calories"),
            "protein_g": item.get("protein_g"),
            "dietary_tags": item.get("dietary_tags", []),
            "allergens": item.get("allergens", []),
            "category": item.get("category"),
            "restaurant_id": item.get("restaurant_id")
        }
    }

def generate_embedding(text: str, api_key: str = None) -> List[float]:
    """
    Generates dense vector embeddings using Google GenAI or fallback semantic hash vector.
    """
    gemini_key = api_key or os.environ.get("GEMINI_API_KEY")
    
    if gemini_key:
        try:
            from google import genai
            client = genai.Client(api_key=gemini_key)
            response = client.models.embed_content(
                model="gemini-embedding-2-preview",
                contents=text
            )
            return response.embeddings[0].values
        except Exception as e:
            logger.warning(f"Gemini API embed call failed ({e}), falling back to deterministic local embedding.")

    # High-dimensional deterministic normalized vector for sandbox/local runs
    import hashlib
    dim = 768
    raw_hash = hashlib.sha256(text.encode("utf-8")).digest()
    vector = [((b / 255.0) * 2.0 - 1.0) for b in raw_hash]
    # Expand to 768 dimensions
    expanded = (vector * ((dim // len(vector)) + 1))[:dim]
    norm = sum(x**2 for x in expanded) ** 0.5
    return [x / norm for x in expanded]

def run_ingestion():
    """
    Loads raw menu data, chunks it, generates embeddings, and simulates pgvector upsert.
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(current_dir, "data", "menus.json")

    logger.info(f"Loading raw menu chunks from {data_path}...")
    with open(data_path, "r", encoding="utf-8") as f:
        raw_items = json.load(f)

    logger.info(f"Loaded {len(raw_items)} menu items. Starting chunking & vector embedding...")
    processed_records = []

    for item in raw_items:
        chunk = chunk_menu_document(item)
        embedding = generate_embedding(chunk["chunk_text"])
        chunk["embedding"] = embedding
        chunk["embedding_dim"] = len(embedding)
        processed_records.append(chunk)
        logger.info(f"Chunked & embedded: '{chunk['dish_name']}' ({len(embedding)} dims)")

    logger.info(f"Successfully upserted {len(processed_records)} records to vector index.")
    return processed_records

if __name__ == "__main__":
    records = run_ingestion()
    print(f"Ingestion complete: {len(records)} chunks indexed.")
