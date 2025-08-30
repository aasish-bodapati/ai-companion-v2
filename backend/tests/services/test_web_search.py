"""Tests for WebSearchService."""

import pytest
from unittest.mock import Mock, AsyncMock, patch
import httpx

from app.services.web_search import WebSearchService, web_search_service


class TestWebSearchService:
    """Test cases for WebSearchService class."""

    @pytest.fixture
    def service(self):
        """Create WebSearchService instance for testing."""
        return WebSearchService()

    @pytest.fixture
    def mock_response(self):
        """Create mock HTTP response."""
        response = Mock()
        response.raise_for_status = Mock()
        response.json = Mock()
        response.text = ""
        return response

    @pytest.mark.asyncio
    async def test_init(self, service):
        """Test WebSearchService initialization."""
        assert service.session is not None
        assert service.user_agent is not None

    @pytest.mark.asyncio
    async def test_search_web_with_abstract(self, service, mock_response):
        """Test web search with abstract result."""
        mock_response.json.return_value = {
            "Abstract": "Test abstract content",
            "AbstractText": "Test Abstract",
            "AbstractURL": "https://example.com",
            "RelatedTopics": []
        }
        
        with patch.object(service.session, 'get', return_value=mock_response):
            results = await service.search_web("test query")
            
            assert len(results) == 1
            assert results[0]["title"] == "Test Abstract"
            assert results[0]["url"] == "https://example.com"
            assert results[0]["snippet"] == "Test abstract content"
            assert results[0]["source"] == "DuckDuckGo Abstract"

    @pytest.mark.asyncio
    async def test_search_web_with_related_topics(self, service, mock_response):
        """Test web search with related topics."""
        mock_response.json.return_value = {
            "Abstract": "",
            "RelatedTopics": [
                {
                    "Text": "Related topic 1",
                    "FirstURL": "https://example.com/topic_1"
                },
                {
                    "Text": "Related topic 2",
                    "FirstURL": "https://example.com/topic_2"
                }
            ]
        }
        
        with patch.object(service.session, 'get', return_value=mock_response):
            results = await service.search_web("test query", max_results=2)
            
            assert len(results) == 2
            assert results[0]["title"] == "topic 1"
            assert results[0]["snippet"] == "Related topic 1"
            assert results[0]["source"] == "DuckDuckGo Related"

    @pytest.mark.asyncio
    async def test_search_web_with_alternative_method(self, service, mock_response):
        """Test web search falling back to alternative method."""
        # First call returns empty results
        mock_response.json.return_value = {"Abstract": "", "RelatedTopics": []}
        
        # Mock alternative method
        with patch.object(service.session, 'get', return_value=mock_response), \
             patch.object(service, '_search_with_alternative_method', return_value=[
                 {"title": "Alternative Result", "url": "https://alt.com", "snippet": "Alt snippet", "source": "Google"}
             ]):
            
            results = await service.search_web("test query")
            
            assert len(results) == 1
            assert results[0]["title"] == "Alternative Result"

    @pytest.mark.asyncio
    async def test_search_web_exception(self, service):
        """Test web search with exception."""
        with patch.object(service.session, 'get', side_effect=httpx.RequestError("Network error")):
            results = await service.search_web("test query")
            assert results == []

    @pytest.mark.asyncio
    async def test_search_with_alternative_method_success(self, service, mock_response):
        """Test alternative search method success."""
        mock_response.text = '''
        <h3><a href="/url?q=https://example.com&amp;sa=U">Example Title</a></h3>
        <h3><a href="https://direct.com">Direct Link</a></h3>
        '''
        
        with patch.object(service.session, 'get', return_value=mock_response):
            results = await service._search_with_alternative_method("test query", 2)
            
            assert len(results) == 2
            assert results[0]["url"] == "https://example.com"
            assert results[1]["url"] == "https://direct.com"

    @pytest.mark.asyncio
    async def test_search_with_alternative_method_exception(self, service):
        """Test alternative search method with exception."""
        with patch.object(service.session, 'get', side_effect=httpx.RequestError("Network error")):
            results = await service._search_with_alternative_method("test query", 5)
            assert results == []

    @pytest.mark.asyncio
    async def test_get_current_weather_success(self, service, mock_response):
        """Test successful weather lookup."""
        mock_response.json.return_value = {
            "current_condition": [{
                "temp_C": "22",
                "weatherDesc": [{"value": "Sunny"}],
                "humidity": "65",
                "windspeedKmph": "10"
            }]
        }
        
        with patch.object(service.session, 'get', return_value=mock_response):
            result = await service.get_current_weather("New York")
            
            assert result is not None
            assert result["location"] == "New York"
            assert result["temperature"] == "22"
            assert result["condition"] == "Sunny"
            assert result["humidity"] == "65"
            assert result["wind_speed"] == "10"
            assert result["source"] == "wttr.in"

    @pytest.mark.asyncio
    async def test_get_current_weather_no_data(self, service, mock_response):
        """Test weather lookup with no data."""
        mock_response.json.return_value = {}
        
        with patch.object(service.session, 'get', return_value=mock_response):
            result = await service.get_current_weather("Unknown City")
            assert result is None

    @pytest.mark.asyncio
    async def test_get_current_weather_exception(self, service):
        """Test weather lookup with exception."""
        with patch.object(service.session, 'get', side_effect=httpx.RequestError("Network error")):
            result = await service.get_current_weather("New York")
            assert result is None

    @pytest.mark.asyncio
    async def test_get_news_headlines_success(self, service, mock_response):
        """Test successful news headlines lookup."""
        mock_response.text = '''
        <item>
            <title>News Title 1</title>
            <link>https://news1.com</link>
            <description>News description 1</description>
        </item>
        <item>
            <title>News Title 2</title>
            <link>https://news2.com</link>
            <description>News description 2</description>
        </item>
        '''
        
        with patch.object(service.session, 'get', return_value=mock_response):
            results = await service.get_news_headlines("technology", 2)
            
            assert len(results) == 2
            assert results[0]["title"] == "News Title 1"
            assert results[0]["url"] == "https://news1.com"
            assert results[0]["snippet"] == "News description 1"
            assert results[0]["source"] == "Google News"

    @pytest.mark.asyncio
    async def test_get_news_headlines_with_html_entities(self, service, mock_response):
        """Test news headlines with HTML entities."""
        mock_response.text = '''
        <item>
            <title>News &amp; Updates</title>
            <link>https://news.com</link>
            <description>Description &quot;with quotes&quot;</description>
        </item>
        '''
        
        with patch.object(service.session, 'get', return_value=mock_response):
            results = await service.get_news_headlines("general", 1)
            
            assert len(results) == 1
            assert "News  Updates" in results[0]["title"]  # HTML entities removed
            assert "Description with quotes" in results[0]["snippet"]

    @pytest.mark.asyncio
    async def test_get_news_headlines_exception(self, service):
        """Test news headlines lookup with exception."""
        with patch.object(service.session, 'get', side_effect=httpx.RequestError("Network error")):
            results = await service.get_news_headlines("technology")
            assert results == []

    @pytest.mark.asyncio
    async def test_get_stock_price_success(self, service, mock_response):
        """Test successful stock price lookup."""
        mock_response.json.return_value = {
            "chart": {
                "result": [{
                    "meta": {
                        "regularMarketPrice": 150.25,
                        "regularMarketChange": 2.50,
                        "regularMarketChangePercent": 1.69,
                        "regularMarketVolume": 1000000
                    }
                }]
            }
        }
        
        with patch.object(service.session, 'get', return_value=mock_response):
            result = await service.get_stock_price("AAPL")
            
            assert result is not None
            assert result["symbol"] == "AAPL"
            assert result["price"] == "150.25"
            assert result["change"] == "2.5"
            assert result["change_percent"] == "1.69"
            assert result["volume"] == "1000000"
            assert result["source"] == "Yahoo Finance"

    @pytest.mark.asyncio
    async def test_get_stock_price_no_data(self, service, mock_response):
        """Test stock price lookup with no data."""
        mock_response.json.return_value = {"chart": {"result": []}}
        
        with patch.object(service.session, 'get', return_value=mock_response):
            result = await service.get_stock_price("INVALID")
            assert result is None

    @pytest.mark.asyncio
    async def test_get_stock_price_exception(self, service):
        """Test stock price lookup with exception."""
        with patch.object(service.session, 'get', side_effect=httpx.RequestError("Network error")):
            result = await service.get_stock_price("AAPL")
            assert result is None

    @pytest.mark.asyncio
    async def test_close(self, service):
        """Test closing the HTTP session."""
        with patch.object(service.session, 'aclose') as mock_close:
            await service.close()
            mock_close.assert_called_once()

    def test_global_instance(self):
        """Test that the global instance is properly configured."""
        assert isinstance(web_search_service, WebSearchService)
