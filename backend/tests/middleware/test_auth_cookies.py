"""Tests for authentication cookie middleware."""

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timezone, timedelta
from fastapi import Request, Response, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from jose import jwt

from app.middleware.auth_cookies import (
    CookieHTTPBearer,
    create_access_token,
    set_auth_cookies,
    clear_auth_cookies,
    verify_token,
    AuthCookieMiddleware,
    cookie_security
)


class TestCookieHTTPBearer:
    """Test cases for CookieHTTPBearer class."""

    @pytest.fixture
    def bearer(self):
        """Create CookieHTTPBearer instance for testing."""
        return CookieHTTPBearer()

    @pytest.fixture
    def mock_request(self):
        """Create mock request."""
        request = Mock(spec=Request)
        request.cookies = {}
        return request

    def test_init(self, bearer):
        """Test CookieHTTPBearer initialization."""
        assert bearer.auto_error is True

    def test_init_with_auto_error_false(self):
        """Test CookieHTTPBearer initialization with auto_error=False."""
        bearer = CookieHTTPBearer(auto_error=False)
        assert bearer.auto_error is False

    @pytest.mark.asyncio
    async def test_call_with_cookie_token(self, bearer, mock_request):
        """Test __call__ with token in cookie."""
        mock_request.cookies = {"access_token": "test_token"}
        
        result = await bearer(mock_request)
        
        assert result is not None
        assert isinstance(result, HTTPAuthorizationCredentials)
        assert result.scheme == "Bearer"
        assert result.credentials == "test_token"

    @pytest.mark.asyncio
    async def test_call_fallback_to_header(self, bearer, mock_request):
        """Test __call__ fallback to Authorization header."""
        mock_request.cookies = {}
        
        with patch('fastapi.security.HTTPBearer.__call__') as mock_super:
            mock_super.return_value = HTTPAuthorizationCredentials(
                scheme="Bearer", credentials="header_token"
            )
            
            result = await bearer(mock_request)
            
            assert result is not None
            assert result.credentials == "header_token"
            mock_super.assert_called_once_with(mock_request)

    @pytest.mark.asyncio
    async def test_call_no_token(self, bearer, mock_request):
        """Test __call__ with no token."""
        mock_request.cookies = {}
        
        with patch('fastapi.security.HTTPBearer.__call__') as mock_super:
            mock_super.return_value = None
            
            result = await bearer(mock_request)
            
            assert result is None


class TestTokenFunctions:
    """Test cases for token utility functions."""

    @patch('app.core.config.settings')
    def test_create_access_token_default_expiry(self, mock_settings):
        """Test creating access token with default expiry."""
        mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30
        mock_settings.SECRET_KEY = "test_secret"
        mock_settings.ALGORITHM = "HS256"
        
        data = {"sub": "user123"}
        token = create_access_token(data)
        
        assert isinstance(token, str)
        assert len(token) > 0

    @patch('app.core.config.settings')
    def test_create_access_token_custom_expiry(self, mock_settings):
        """Test creating access token with custom expiry."""
        mock_settings.SECRET_KEY = "test_secret"
        mock_settings.ALGORITHM = "HS256"
        
        data = {"sub": "user123"}
        expires_delta = timedelta(minutes=60)
        token = create_access_token(data, expires_delta)
        
        assert isinstance(token, str)
        # Decode to verify expiry was set
        payload = jwt.decode(token, "test_secret", algorithms=["HS256"])
        assert "exp" in payload

    @patch('app.core.config.settings')
    def test_set_auth_cookies_secure_default(self, mock_settings):
        """Test setting auth cookies with secure default."""
        mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30
        mock_settings.COOKIE_SECURE = True
        mock_settings.COOKIE_SAMESITE = "lax"
        
        response = Mock(spec=Response)
        response.set_cookie = Mock()
        
        set_auth_cookies(response, "test_token")
        
        assert response.set_cookie.call_count == 2
        # Check access_token cookie
        access_call = response.set_cookie.call_args_list[0]
        assert access_call[1]["key"] == "access_token"
        assert access_call[1]["value"] == "test_token"
        assert access_call[1]["httponly"] is True
        assert access_call[1]["secure"] is True

    @patch('app.core.config.settings')
    def test_set_auth_cookies_localhost_override(self, mock_settings):
        """Test setting auth cookies with localhost override."""
        mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30
        mock_settings.COOKIE_SECURE = True
        mock_settings.COOKIE_SAMESITE = "lax"
        
        response = Mock(spec=Response)
        response.set_cookie = Mock()
        
        request = Mock(spec=Request)
        request.headers = {"origin": "http://localhost:3000"}
        request.url = Mock()
        request.url.hostname = "localhost"
        
        set_auth_cookies(response, "test_token", request)
        
        # Check that secure was set to False for localhost
        access_call = response.set_cookie.call_args_list[0]
        assert access_call[1]["secure"] is False

    @patch('app.core.config.settings')
    def test_set_auth_cookies_exception_handling(self, mock_settings):
        """Test setting auth cookies with exception in request processing."""
        mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30
        mock_settings.COOKIE_SECURE = True
        mock_settings.COOKIE_SAMESITE = "lax"
        
        response = Mock(spec=Response)
        response.set_cookie = Mock()
        
        request = Mock(spec=Request)
        request.headers = Mock()
        request.headers.get.side_effect = Exception("Error")
        
        # Should not raise exception, should use default secure setting
        set_auth_cookies(response, "test_token", request)
        
        access_call = response.set_cookie.call_args_list[0]
        assert access_call[1]["secure"] is True

    def test_clear_auth_cookies(self):
        """Test clearing auth cookies."""
        response = Mock(spec=Response)
        response.delete_cookie = Mock()
        
        clear_auth_cookies(response)
        
        assert response.delete_cookie.call_count == 2
        calls = response.delete_cookie.call_args_list
        assert calls[0][1]["key"] == "access_token"
        assert calls[1][1]["key"] == "is_authenticated"

    @patch('app.core.config.settings')
    def test_verify_token_valid(self, mock_settings):
        """Test verifying valid token."""
        mock_settings.SECRET_KEY = "test_secret"
        mock_settings.ALGORITHM = "HS256"
        
        # Create a valid token
        payload = {"sub": "user123", "exp": datetime.now(timezone.utc) + timedelta(minutes=30)}
        token = jwt.encode(payload, "test_secret", algorithm="HS256")
        
        result = verify_token(token)
        
        assert result["sub"] == "user123"

    @patch('app.core.config.settings')
    def test_verify_token_invalid(self, mock_settings):
        """Test verifying invalid token."""
        mock_settings.SECRET_KEY = "test_secret"
        mock_settings.ALGORITHM = "HS256"
        
        with pytest.raises(HTTPException) as exc_info:
            verify_token("invalid_token")
        
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Could not validate credentials" in exc_info.value.detail

    @patch('app.core.config.settings')
    def test_verify_token_expired(self, mock_settings):
        """Test verifying expired token."""
        mock_settings.SECRET_KEY = "test_secret"
        mock_settings.ALGORITHM = "HS256"
        
        # Create an expired token
        payload = {"sub": "user123", "exp": datetime.now(timezone.utc) - timedelta(minutes=30)}
        token = jwt.encode(payload, "test_secret", algorithm="HS256")
        
        with pytest.raises(HTTPException) as exc_info:
            verify_token(token)
        
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED


class TestAuthCookieMiddleware:
    """Test cases for AuthCookieMiddleware class."""

    @pytest.fixture
    def middleware(self):
        """Create AuthCookieMiddleware instance for testing."""
        return AuthCookieMiddleware(None)

    @pytest.fixture
    def mock_request(self):
        """Create mock request."""
        request = Mock(spec=Request)
        request.cookies = {}
        request.state = Mock()
        return request

    @pytest.mark.asyncio
    async def test_dispatch_no_token(self, middleware, mock_request):
        """Test dispatch with no token in cookies."""
        mock_request.cookies = {}
        
        async def mock_call_next(request):
            return Mock()
        
        response = await middleware.dispatch(mock_request, mock_call_next)
        
        assert response is not None
        assert not hasattr(mock_request.state, 'user_id')

    @pytest.mark.asyncio
    async def test_dispatch_valid_token(self, middleware, mock_request):
        """Test dispatch with valid token."""
        mock_request.cookies = {"access_token": "valid_token"}
        
        with patch('app.middleware.auth_cookies.verify_token') as mock_verify:
            mock_verify.return_value = {"sub": "user123"}
            
            async def mock_call_next(request):
                return Mock()
            
            response = await middleware.dispatch(mock_request, mock_call_next)
            
            assert response is not None
            assert mock_request.state.user_id == "user123"

    @pytest.mark.asyncio
    async def test_dispatch_invalid_token(self, middleware, mock_request):
        """Test dispatch with invalid token."""
        mock_request.cookies = {"access_token": "invalid_token"}
        
        with patch('app.middleware.auth_cookies.verify_token') as mock_verify:
            mock_verify.side_effect = HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
            
            async def mock_call_next(request):
                return Mock()
            
            response = await middleware.dispatch(mock_request, mock_call_next)
            
            assert response is not None
            assert not hasattr(mock_request.state, 'user_id')

    @pytest.mark.asyncio
    async def test_dispatch_token_no_sub(self, middleware, mock_request):
        """Test dispatch with token that has no 'sub' claim."""
        mock_request.cookies = {"access_token": "token_no_sub"}
        
        with patch('app.middleware.auth_cookies.verify_token') as mock_verify:
            mock_verify.return_value = {"other_claim": "value"}
            
            async def mock_call_next(request):
                return Mock()
            
            response = await middleware.dispatch(mock_request, mock_call_next)
            
            assert response is not None
            assert not hasattr(mock_request.state, 'user_id')

    def test_global_instance(self):
        """Test that the global instance is properly configured."""
        assert isinstance(cookie_security, CookieHTTPBearer)
