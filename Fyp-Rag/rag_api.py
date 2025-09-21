# rag_api.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import logging
import time
from rag_pipeline import rag_pipeline 

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Sri Lanka Government Acts RAG API",
    description="API for querying Sri Lankan Government Acts using RAG",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    collections: Optional[List[str]] = None
    max_results: Optional[int] = 5
    include_sources: Optional[bool] = True

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str

@app.get("/")
async def root():
    return {
        "message": "Sri Lanka Government Acts RAG API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="healthy",
        timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
        version="1.0.0"
    )

@app.post("/chat")
async def chat(request: ChatRequest):
    start_time = time.time()
    
    try:
        logger.info(f"Processing chat request: {request.message[:100]}...")
        
        # Process the message through RAG pipeline
        response = rag_pipeline(request.message)
        
        processing_time = time.time() - start_time
        
        # Format response
        result = {
            "response": response,
            "sources": [],  # Add sources if available
            "collections": request.collections or [],
            "confidence": 0.8,  # Add confidence scoring
            "processing_time": processing_time,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        logger.info(f"Chat request processed in {processing_time:.2f}s")
        return result
        
    except Exception as e:
        logger.error(f"Error processing chat request: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing request: {str(e)}"
        )

@app.get("/collections")
async def get_collections():
    """Get available document collections"""
    return {
        "collections": [
            "Civil_Aviation_Act-Base",
            "Civil_Aviation_Act-Amendment", 
            "Economic_Service_Charge_Act-Base",
            "Economic_Service_Charge_Act-Amendment"
        ],
        "total_count": 4,
        "last_updated": time.strftime("%Y-%m-%d %H:%M:%S")
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
