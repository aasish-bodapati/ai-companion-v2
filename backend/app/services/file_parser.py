import io
import os
from typing import Optional, Dict, Any, Tuple
from pathlib import Path
import logging

# Import file type specific parsers
try:
    import PyPDF2
    import docx2txt
    from PIL import Image
    import pytesseract
    from pdf2image import convert_from_bytes
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False

logger = logging.getLogger(__name__)

class FileParser:
    """
    Service for parsing different file types to extract text content.
    """
    
    @staticmethod
    def extract_text(file_path: str, file_type: str, file_content: bytes = None) -> Tuple[str, Dict[str, Any]]:
        """
        Extract text content from a file based on its type.
        
        Args:
            file_path: Path to the file (used for extension detection if file_content is not provided)
            file_type: MIME type of the file
            file_content: Optional file content as bytes
            
        Returns:
            Tuple of (extracted_text, metadata)
        """
        try:
            # If file_content is provided, use it, otherwise read from file_path
            content = file_content
            if content is None:
                with open(file_path, 'rb') as f:
                    content = f.read()
            
            # Determine file type and parse accordingly
            if file_type == 'application/pdf':
                return FileParser._parse_pdf(content)
            elif file_type in ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
                return FileParser._parse_docx(content)
            elif file_type.startswith('image/'):
                return FileParser._parse_image(content)
            elif file_type == 'text/plain':
                return FileParser._parse_text(content)
            else:
                logger.warning(f"Unsupported file type: {file_type}")
                return "", {}
                
        except Exception as e:
            logger.error(f"Error parsing file {file_path}: {str(e)}", exc_info=True)
            return "", {}
    
    @staticmethod
    def _parse_pdf(content: bytes) -> Tuple[str, Dict[str, Any]]:
        """Extract text from PDF files"""
        if not PDF_SUPPORT:
            raise ImportError("PDF parsing requires PyPDF2 and pdf2image")
            
        text_parts = []
        metadata = {"page_count": 0, "contains_images": False}
        
        try:
            # Extract text from PDF
            with io.BytesIO(content) as f:
                reader = PyPDF2.PdfReader(f)
                metadata["page_count"] = len(reader.pages)
                
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text.strip())
            
            # Check if PDF contains images (basic check)
            images = convert_from_bytes(content)
            if images:
                metadata["contains_images"] = True
                # Use OCR to extract text from images
                for img in images:
                    img_text = pytesseract.image_to_string(img)
                    if img_text.strip():
                        text_parts.append(img_text.strip())
            
            return "\n\n".join(text_parts), metadata
            
        except Exception as e:
            logger.error(f"Error parsing PDF: {str(e)}")
            return "\n\n".join(text_parts), metadata
    
    @staticmethod
    def _parse_docx(content: bytes) -> Tuple[str, Dict[str, Any]]:
        """Extract text from Word documents"""
        try:
            with io.BytesIO(content) as f:
                text = docx2txt.process(f)
                return text.strip(), {}
        except Exception as e:
            logger.error(f"Error parsing DOCX: {str(e)}")
            return "", {}
    
    @staticmethod
    def _parse_image(content: bytes) -> Tuple[str, Dict[str, Any]]:
        """Extract text from images using OCR"""
        if not PDF_SUPPORT:
            raise ImportError("Image parsing requires pytesseract and PIL")
            
        try:
            image = Image.open(io.BytesIO(content))
            text = pytesseract.image_to_string(image)
            return text.strip(), {}
        except Exception as e:
            logger.error(f"Error parsing image: {str(e)}")
            return "", {}
    
    @staticmethod
    def _parse_text(content: bytes) -> Tuple[str, Dict[str, Any]]:
        """Extract text from plain text files"""
        try:
            # Try UTF-8 first, fall back to other encodings if needed
            try:
                return content.decode('utf-8').strip(), {}
            except UnicodeDecodeError:
                return content.decode('latin-1').strip(), {}
        except Exception as e:
            logger.error(f"Error parsing text file: {str(e)}")
            return "", {}
    
    @staticmethod
    def get_file_extension(file_type: str) -> str:
        """Get file extension from MIME type"""
        mime_to_ext = {
            'application/pdf': '.pdf',
            'application/msword': '.doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'text/plain': '.txt',
        }
        return mime_to_ext.get(file_type, '.bin')
