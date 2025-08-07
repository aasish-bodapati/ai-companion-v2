import os
from typing import Optional, BinaryIO, Tuple
from pathlib import Path
from datetime import datetime
import uuid
from fastapi import UploadFile, HTTPException, status
from supabase import create_client, Client
from app.core.config import settings

class StorageService:
    def __init__(self):
        self.supabase = create_client(
            supabase_url=settings.SUPABASE_URL,
            supabase_key=settings.SUPABASE_KEY
        )
        self.bucket_name = settings.SUPABASE_STORAGE_BUCKET
        
        # Ensure the bucket exists
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Ensure the storage bucket exists, create if it doesn't"""
        try:
            self.supabase.storage.get_bucket(self.bucket_name)
        except Exception as e:
            if "not found" in str(e).lower():
                # Create the bucket if it doesn't exist
                self.supabase.storage.create_bucket(
                    self.bucket_name,
                    public=False,  # Make it private for security
                    file_size_limit=1024 * 1024 * 50,  # 50MB file size limit
                    allowed_mime_types=["image/*", "application/pdf", "text/*", "application/*"]
                )
    
    def generate_file_path(self, user_id: int, file_name: str) -> str:
        """Generate a unique file path for storage"""
        # Create a unique filename to avoid collisions
        file_ext = Path(file_name).suffix
        unique_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        return f"users/{user_id}/{timestamp}_{unique_id}{file_ext}"
    
    async def upload_file(
        self, 
        user_id: int, 
        file: UploadFile,
        metadata: Optional[dict] = None
    ) -> Tuple[str, int, str]:
        """Upload a file to Supabase storage"""
        try:
            # Read file content
            content = await file.read()
            file_size = len(content)
            
            # Generate a unique path
            file_path = self.generate_file_path(user_id, file.filename)
            
            # Upload the file
            result = self.supabase.storage.\
                from_("files").\
                upload(
                    path=file_path,
                    file=content,
                    file_options={
                        "content-type": file.content_type,
                        "cache-control": "3600",
                        "x-upsert": "true"
                    }
                )
            
            # Get public URL (if needed)
            url = self.supabase.storage.\
                from_("files").\
                get_public_url(file_path)
            
            return file_path, file_size, url
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error uploading file: {str(e)}"
            )
    
    def delete_file(self, file_path: str) -> bool:
        """Delete a file from storage"""
        try:
            self.supabase.storage.\
                from_("files").\
                remove([file_path])
            return True
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error deleting file: {str(e)}"
            )
    
    def get_file_url(self, file_path: str, expires_in: int = 3600) -> str:
        """Get a signed URL for the file"""
        try:
            return self.supabase.storage.\
                from_("files").\
                create_signed_url(file_path, expires_in=expires_in)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File not found or error generating URL: {str(e)}"
            )
