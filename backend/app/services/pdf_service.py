import io
import logging
try:
    from PyPDF2 import PdfReader
    PYPDF2_AVAILABLE = True
except ImportError:
    PYPDF2_AVAILABLE = False

logger = logging.getLogger("astra_ai.pdf_service")

class PDFService:
    @staticmethod
    def extract_text_from_bytes(file_bytes: bytes) -> str:
        """
        Extracts all textual content from a PDF byte array.
        """
        if not PYPDF2_AVAILABLE:
            return "PDF reading is disabled on this server because 'PyPDF2' is not installed."
        try:
            pdf_file = io.BytesIO(file_bytes)
            reader = PdfReader(pdf_file)
            text_content = []
            
            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                text = page.extract_text()
                if text:
                    text_content.append(text)
            
            extracted_text = "\n".join(text_content).strip()
            if not extracted_text:
                return "The PDF contains no readable text (it might consist only of images)."
            
            return extracted_text
        except Exception as e:
            logger.error(f"Error parsing PDF file: {e}")
            return f"Error occurred while processing PDF file: {str(e)}"
