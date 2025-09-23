#!/usr/bin/env python3
"""
Download sample dataset from OpenFoodFacts for MVP development
"""

import requests
import json
import gzip
import os
import sys
from pathlib import Path
from typing import Dict, Any, List
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OpenFoodFactsDownloader:
    def __init__(self, data_dir: str = "data/openfoodfacts"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
    def download_sample_data(self, sample_size: int = 1000) -> str:
        """
        Download a sample of OpenFoodFacts data using their API
        
        Args:
            sample_size: Number of products to download (max 1000 per request)
            
        Returns:
            Path to the downloaded JSON file
        """
        logger.info(f"Downloading {sample_size} products from OpenFoodFacts...")
        
        # OpenFoodFacts API endpoint for search
        base_url = "https://world.openfoodfacts.org/cgi/search.pl"
        
        # Parameters for the search
        params = {
            'search_terms': '',  # Empty to get random products
            'search_simple': 1,
            'action': 'process',
            'json': 1,
            'page_size': min(sample_size, 1000),  # API limit is 1000 per request
            'page': 1,
            'sort_by': 'popularity',  # Get popular products
            'fields': 'code,product_name,brands,categories,ingredients_text,'
                     'nutrition_grade_fr,energy_100g,proteins_100g,'
                     'carbohydrates_100g,fat_100g,fiber_100g,sugars_100g,'
                     'sodium_100g,serving_size,serving_quantity,'
                     'image_url,image_small_url,image_thumb_url'
        }
        
        try:
            response = requests.get(base_url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            if 'products' not in data:
                raise ValueError("No products found in response")
            
            products = data['products']
            logger.info(f"Downloaded {len(products)} products")
            
            # Save to file
            output_file = self.data_dir / f"openfoodfacts_sample_{len(products)}.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(products, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Sample data saved to: {output_file}")
            return str(output_file)
            
        except requests.RequestException as e:
            logger.error(f"Failed to download data: {e}")
            raise
        except Exception as e:
            logger.error(f"Error processing data: {e}")
            raise
    
    def download_large_sample(self, sample_size: int = 10000) -> str:
        """
        Download a larger sample by making multiple API calls
        
        Args:
            sample_size: Total number of products to download
            
        Returns:
            Path to the downloaded JSON file
        """
        logger.info(f"Downloading {sample_size} products in batches...")
        
        all_products = []
        batch_size = 1000
        page = 1
        
        while len(all_products) < sample_size:
            remaining = sample_size - len(all_products)
            current_batch_size = min(batch_size, remaining)
            
            logger.info(f"Downloading batch {page} ({current_batch_size} products)...")
            
            # Download batch
            batch_file = self.download_sample_data(current_batch_size)
            
            # Load and merge
            with open(batch_file, 'r', encoding='utf-8') as f:
                batch_products = json.load(f)
            
            all_products.extend(batch_products)
            
            # Clean up batch file
            os.remove(batch_file)
            
            page += 1
            
            # Add delay to be respectful to the API
            import time
            time.sleep(1)
        
        # Save combined data
        output_file = self.data_dir / f"openfoodfacts_sample_{len(all_products)}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_products, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Large sample data saved to: {output_file}")
        return str(output_file)
    
    def get_sample_categories(self) -> List[str]:
        """Get a list of popular food categories for targeted downloads"""
        return [
            'cereals',
            'fruits',
            'vegetables',
            'dairy',
            'meat',
            'fish',
            'beverages',
            'snacks',
            'desserts',
            'bread',
            'pasta',
            'rice',
            'nuts',
            'seeds',
            'oils',
            'condiments'
        ]
    
    def download_by_category(self, category: str, sample_size: int = 500) -> str:
        """
        Download products from a specific category
        
        Args:
            category: Food category to search for
            sample_size: Number of products to download
            
        Returns:
            Path to the downloaded JSON file
        """
        logger.info(f"Downloading {sample_size} products from category: {category}")
        
        base_url = "https://world.openfoodfacts.org/cgi/search.pl"
        
        params = {
            'search_terms': category,
            'search_simple': 1,
            'action': 'process',
            'json': 1,
            'page_size': min(sample_size, 1000),
            'page': 1,
            'sort_by': 'popularity',
            'fields': 'code,product_name,brands,categories,ingredients_text,'
                     'nutrition_grade_fr,energy_100g,proteins_100g,'
                     'carbohydrates_100g,fat_100g,fiber_100g,sugars_100g,'
                     'sodium_100g,serving_size,serving_quantity,'
                     'image_url,image_small_url,image_thumb_url'
        }
        
        try:
            response = requests.get(base_url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            products = data.get('products', [])
            
            logger.info(f"Downloaded {len(products)} products from category: {category}")
            
            # Save to file
            output_file = self.data_dir / f"openfoodfacts_{category}_{len(products)}.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(products, f, indent=2, ensure_ascii=False)
            
            return str(output_file)
            
        except Exception as e:
            logger.error(f"Failed to download category {category}: {e}")
            raise

def main():
    """Main function to download sample data"""
    downloader = OpenFoodFactsDownloader()
    
    # Download a small sample first
    logger.info("Downloading small sample (1000 products)...")
    small_sample = downloader.download_sample_data(1000)
    logger.info(f"Small sample saved to: {small_sample}")
    
    # Download some category-specific samples
    categories = ['fruits', 'vegetables', 'dairy', 'cereals', 'meat']
    for category in categories:
        try:
            logger.info(f"Downloading {category} products...")
            category_file = downloader.download_by_category(category, 200)
            logger.info(f"{category} sample saved to: {category_file}")
        except Exception as e:
            logger.error(f"Failed to download {category}: {e}")
    
    logger.info("Sample data download complete!")

if __name__ == "__main__":
    main()
