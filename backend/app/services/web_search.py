"""
Web Search Service
Provides internet access capabilities for the AI companion.
"""

import logging
import httpx
import json
from typing import List, Dict, Optional
from urllib.parse import quote_plus
import re

logger = logging.getLogger(__name__)


class WebSearchService:
    """Service for performing web searches and retrieving information from the internet."""
    
    def __init__(self):
        self.session = httpx.AsyncClient(timeout=30.0)
        self.user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    
    async def search_web(self, query: str, max_results: int = 5) -> List[Dict[str, str]]:
        """
        Perform a web search and return relevant results.
        
        Args:
            query: Search query
            max_results: Maximum number of results to return
            
        Returns:
            List of search results with title, url, and snippet
        """
        try:
            # Use DuckDuckGo Instant Answer API (no API key required)
            encoded_query = quote_plus(query)
            url = f"https://api.duckduckgo.com/?q={encoded_query}&format=json&no_html=1&skip_disambig=1"
            
            headers = {
                "User-Agent": self.user_agent,
                "Accept": "application/json"
            }
            
            response = await self.session.get(url, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            results = []
            
            # Extract abstract if available
            if data.get("Abstract"):
                results.append({
                    "title": data.get("AbstractText", "DuckDuckGo Result"),
                    "url": data.get("AbstractURL", ""),
                    "snippet": data.get("Abstract", ""),
                    "source": "DuckDuckGo Abstract"
                })
            
            # Extract related topics
            for topic in data.get("RelatedTopics", [])[:max_results - len(results)]:
                if isinstance(topic, dict) and topic.get("Text"):
                    results.append({
                        "title": topic.get("FirstURL", "").split("/")[-1].replace("_", " "),
                        "url": topic.get("FirstURL", ""),
                        "snippet": topic.get("Text", ""),
                        "source": "DuckDuckGo Related"
                    })
            
            # If we don't have enough results, try a different approach
            if len(results) < max_results:
                additional_results = await self._search_with_alternative_method(query, max_results - len(results))
                results.extend(additional_results)
            
            return results[:max_results]
            
        except Exception as e:
            logger.error(f"Web search failed: {e}")
            return []
    
    async def _search_with_alternative_method(self, query: str, max_results: int) -> List[Dict[str, str]]:
        """Alternative search method using a different approach."""
        try:
            # Use a simple web scraping approach for news and current events
            encoded_query = quote_plus(query)
            url = f"https://www.google.com/search?q={encoded_query}&num={max_results}"
            
            headers = {
                "User-Agent": self.user_agent,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Accept-Encoding": "gzip, deflate",
                "DNT": "1",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
            }
            
            response = await self.session.get(url, headers=headers)
            response.raise_for_status()
            
            # Simple HTML parsing to extract search results
            html = response.text
            results = []
            
            # Extract search result links (basic pattern matching)
            pattern = r'<h3[^>]*><a[^>]*href="([^"]*)"[^>]*>([^<]*)</a></h3>'
            matches = re.findall(pattern, html)
            
            for url, title in matches[:max_results]:
                if url.startswith("/url?q="):
                    url = url[7:].split("&")[0]
                if url.startswith("http"):
                    results.append({
                        "title": title.strip(),
                        "url": url,
                        "snippet": f"Search result for: {query}",
                        "source": "Google Search"
                    })
            
            return results
            
        except Exception as e:
            logger.error(f"Alternative search method failed: {e}")
            return []
    
    async def get_current_weather(self, location: str) -> Optional[Dict[str, str]]:
        """
        Get current weather information for a location.
        
        Args:
            location: City name or coordinates
            
        Returns:
            Weather information or None if failed
        """
        try:
            # Use a free weather API
            encoded_location = quote_plus(location)
            url = f"https://wttr.in/{encoded_location}?format=j1"
            
            headers = {
                "User-Agent": self.user_agent,
                "Accept": "application/json"
            }
            
            response = await self.session.get(url, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get("current_condition"):
                current = data["current_condition"][0]
                return {
                    "location": location,
                    "temperature": current.get("temp_C", "N/A"),
                    "condition": current.get("weatherDesc", [{}])[0].get("value", "N/A"),
                    "humidity": current.get("humidity", "N/A"),
                    "wind_speed": current.get("windspeedKmph", "N/A"),
                    "source": "wttr.in"
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Weather lookup failed: {e}")
            return None
    
    async def get_news_headlines(self, topic: str = "general", max_results: int = 5) -> List[Dict[str, str]]:
        """
        Get current news headlines.
        
        Args:
            topic: News topic (general, technology, business, etc.)
            max_results: Maximum number of headlines to return
            
        Returns:
            List of news headlines
        """
        try:
            # Use a news API (this is a simplified version)
            encoded_topic = quote_plus(topic)
            url = f"https://news.google.com/rss/search?q={encoded_topic}&hl=en-US&gl=US&ceid=US:en"
            
            headers = {
                "User-Agent": self.user_agent,
                "Accept": "application/rss+xml, application/xml, text/xml"
            }
            
            response = await self.session.get(url, headers=headers)
            response.raise_for_status()
            
            # Parse RSS feed
            content = response.text
            results = []
            
            # Extract news items from RSS
            pattern = r'<item>.*?<title>([^<]*)</title>.*?<link>([^<]*)</link>.*?<description>([^<]*)</description>.*?</item>'
            matches = re.findall(pattern, content, re.DOTALL)
            
            for title, link, description in matches[:max_results]:
                # Clean up HTML entities
                title = re.sub(r'&[^;]+;', '', title)
                description = re.sub(r'&[^;]+;', '', description)
                
                results.append({
                    "title": title.strip(),
                    "url": link.strip(),
                    "snippet": description.strip(),
                    "source": "Google News"
                })
            
            return results
            
        except Exception as e:
            logger.error(f"News lookup failed: {e}")
            return []
    
    async def get_stock_price(self, symbol: str) -> Optional[Dict[str, str]]:
        """
        Get current stock price information.
        
        Args:
            symbol: Stock symbol (e.g., AAPL, GOOGL)
            
        Returns:
            Stock information or None if failed
        """
        try:
            # Use a simple stock API
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
            
            headers = {
                "User-Agent": self.user_agent,
                "Accept": "application/json"
            }
            
            response = await self.session.get(url, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get("chart", {}).get("result"):
                result = data["chart"]["result"][0]
                meta = result.get("meta", {})
                
                return {
                    "symbol": symbol.upper(),
                    "price": str(meta.get("regularMarketPrice", "N/A")),
                    "change": str(meta.get("regularMarketChange", "N/A")),
                    "change_percent": str(meta.get("regularMarketChangePercent", "N/A")),
                    "volume": str(meta.get("regularMarketVolume", "N/A")),
                    "source": "Yahoo Finance"
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Stock lookup failed: {e}")
            return None
    
    async def close(self):
        """Close the HTTP session."""
        await self.session.aclose()


# Global instance
web_search_service = WebSearchService()

