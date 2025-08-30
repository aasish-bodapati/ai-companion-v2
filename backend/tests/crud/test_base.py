"""Tests for CRUD base functionality."""

import pytest
from unittest.mock import Mock, MagicMock, patch
from uuid import uuid4
from typing import Dict, Any

from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.crud.base import CRUDBase
from app.db.base_class import Base


class MockModel:
    """Mock SQLAlchemy model for testing."""
    __tablename__ = "mock_table"
    
    # Add class-level attributes that SQLAlchemy would have
    id = "mock_id"
    
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)


class MockCreateSchema(BaseModel):
    """Mock Pydantic create schema."""
    name: str
    value: int


class MockUpdateSchema(BaseModel):
    """Mock Pydantic update schema."""
    name: str = None
    value: int = None


class TestCRUDBase:
    """Test cases for CRUDBase class."""

    @pytest.fixture
    def crud(self):
        """Create CRUD instance for testing."""
        return CRUDBase[MockModel, MockCreateSchema, MockUpdateSchema](MockModel)

    @pytest.fixture
    def mock_db(self):
        """Create mock database session."""
        db = Mock(spec=Session)
        # Create a query mock that supports chaining
        query_mock = Mock()
        query_mock.filter.return_value = query_mock
        query_mock.offset.return_value = query_mock
        query_mock.limit.return_value = query_mock
        query_mock.first.return_value = None
        query_mock.all.return_value = []
        
        db.query.return_value = query_mock
        return db

    def test_init(self, crud):
        """Test CRUD initialization."""
        assert crud.model == MockModel

    def test_get_with_string_id(self, crud, mock_db):
        """Test get method with string ID."""
        mock_obj = MockModel(id="test-id", name="test")
        mock_db.query.return_value.first.return_value = mock_obj
        
        result = crud.get(mock_db, "test-id")
        
        assert result == mock_obj
        mock_db.query.assert_called_once_with(MockModel)

    def test_get_with_uuid_id(self, crud, mock_db):
        """Test get method with UUID ID."""
        test_uuid = uuid4()
        mock_obj = MockModel(id=str(test_uuid), name="test")
        mock_db.query.return_value.first.return_value = mock_obj
        
        result = crud.get(mock_db, test_uuid)
        
        assert result == mock_obj
        mock_db.query.assert_called_once_with(MockModel)

    def test_get_not_found(self, crud, mock_db):
        """Test get method when object not found."""
        mock_db.query.return_value.first.return_value = None
        
        result = crud.get(mock_db, "nonexistent")
        
        assert result is None

    def test_get_multi(self, crud, mock_db):
        """Test get_multi method."""
        mock_objects = [MockModel(id=f"id-{i}") for i in range(3)]
        mock_db.query.return_value.all.return_value = mock_objects
        
        result = crud.get_multi(mock_db, skip=10, limit=20)
        
        assert result == mock_objects

    def test_get_multi_defaults(self, crud, mock_db):
        """Test get_multi method with default parameters."""
        mock_objects = [MockModel(id=f"id-{i}") for i in range(3)]
        mock_db.query.return_value.all.return_value = mock_objects
        
        result = crud.get_multi(mock_db)
        
        assert result == mock_objects

    def test_create(self, crud, mock_db):
        """Test create method."""
        schema = MockCreateSchema(name="test", value=42)
        mock_obj = MockModel(name="test", value=42)
        
        # Mock the model constructor
        with patch.object(MockModel, '__init__', return_value=None) as mock_init:
            mock_init.return_value = None
            crud.model = Mock(return_value=mock_obj)
            
            result = crud.create(mock_db, obj_in=schema)
            
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()
            mock_db.refresh.assert_called_once()

    def test_update_with_schema(self, crud, mock_db):
        """Test update method with Pydantic schema."""
        db_obj = MockModel(id="test", name="old", value=1)
        update_schema = MockUpdateSchema(name="new", value=2)
        
        with patch('app.crud.base.jsonable_encoder') as mock_encoder:
            mock_encoder.return_value = {"id": "test", "name": "old", "value": 1}
            
            result = crud.update(mock_db, db_obj=db_obj, obj_in=update_schema)
            
            assert db_obj.name == "new"
            assert db_obj.value == 2
            mock_db.add.assert_called_once_with(db_obj)
            mock_db.commit.assert_called_once()
            mock_db.refresh.assert_called_once_with(db_obj)

    def test_update_with_dict(self, crud, mock_db):
        """Test update method with dictionary."""
        db_obj = MockModel(id="test", name="old", value=1)
        update_data = {"name": "new", "value": 2}
        
        with patch('app.crud.base.jsonable_encoder') as mock_encoder:
            mock_encoder.return_value = {"id": "test", "name": "old", "value": 1}
            
            result = crud.update(mock_db, db_obj=db_obj, obj_in=update_data)
            
            assert db_obj.name == "new"
            assert db_obj.value == 2
            mock_db.add.assert_called_once_with(db_obj)
            mock_db.commit.assert_called_once()

    def test_remove_with_string_id(self, crud, mock_db):
        """Test remove method with string ID."""
        mock_obj = MockModel(id="test-id")
        mock_query = Mock()
        mock_query.first.return_value = mock_obj
        mock_query.delete.return_value = 1
        mock_db.query.return_value.filter.return_value = mock_query
        
        result = crud.remove(mock_db, id="test-id")
        
        assert result == mock_obj
        mock_query.delete.assert_called_once_with(synchronize_session=False)
        mock_db.commit.assert_called_once()

    def test_remove_with_uuid_id(self, crud, mock_db):
        """Test remove method with UUID ID."""
        test_uuid = uuid4()
        mock_obj = MockModel(id=str(test_uuid))
        mock_query = Mock()
        mock_query.first.return_value = mock_obj
        mock_query.delete.return_value = 1
        mock_db.query.return_value.filter.return_value = mock_query
        
        result = crud.remove(mock_db, id=test_uuid)
        
        assert result == mock_obj
        mock_query.delete.assert_called_once_with(synchronize_session=False)

    def test_remove_not_found(self, crud, mock_db):
        """Test remove method when object not found."""
        mock_query = Mock()
        mock_query.first.return_value = None
        mock_query.delete.return_value = 0
        mock_db.query.return_value.filter.return_value = mock_query
        
        result = crud.remove(mock_db, id="nonexistent")
        
        assert result is None
        mock_query.delete.assert_called_once()
