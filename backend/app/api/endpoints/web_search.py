"""
Web Search API endpoints
Provides internet access capabilities for the AI companion.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.models.user import User
from app.api.deps import get_current_active_user
from app.services.web_search import web_search_service

router = APIRouter()


class WebSearchRequest(BaseModel):
    query: str
    max_results: Optional[int] = 5


class WeatherRequest(BaseModel):
    location: str


class NewsRequest(BaseModel):
    topic: Optional[str] = "general"
    max_results: Optional[int] = 5


class StockRequest(BaseModel):
    symbol: str


class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    source: str


class WeatherResult(BaseModel):
    location: str
    temperature: str
    condition: str
    humidity: str
    wind_speed: str
    source: str


class StockResult(BaseModel):
    symbol: str
    price: str
    change: str
    change_percent: str
    volume: str
    source: str


@router.post("/search", response_model=List[SearchResult])
async def search_web(
    request: WebSearchRequest,
    current_user: User = Depends(get_current_active_user),
):
    """
    Perform a web search and return relevant results.
    """
    try:
        results = await web_search_service.search_web(
            query=request.query, max_results=request.max_results
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.post("/weather", response_model=WeatherResult)
async def get_weather(
    request: WeatherRequest,
    current_user: User = Depends(get_current_active_user),
):
    """
    Get current weather information for a location.
    """
    try:
        weather = await web_search_service.get_current_weather(request.location)
        if weather:
            return weather
        else:
            raise HTTPException(status_code=404, detail="Weather information not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Weather lookup failed: {str(e)}")


@router.post("/news", response_model=List[SearchResult])
async def get_news(
    request: NewsRequest,
    current_user: User = Depends(get_current_active_user),
):
    """
    Get current news headlines.
    """
    try:
        news = await web_search_service.get_news_headlines(
            topic=request.topic, max_results=request.max_results
        )
        return news
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"News lookup failed: {str(e)}")


@router.post("/stock", response_model=StockResult)
async def get_stock_price(
    request: StockRequest,
    current_user: User = Depends(get_current_active_user),
):
    """
    Get current stock price information.
    """
    try:
        stock = await web_search_service.get_stock_price(request.symbol)
        if stock:
            return stock
        else:
            raise HTTPException(status_code=404, detail="Stock information not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stock lookup failed: {str(e)}")
