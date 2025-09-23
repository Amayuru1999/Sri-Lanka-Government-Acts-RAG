import os
import uuid
import fitz  # PyMuPDF
import torch
import logging
import json
from pathlib import Path
from datetime import datetime
from typing import List, Tuple
# from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma

# -----------------------
# Config
# -----------------------
PROCESSED_LOG = "processed_collections.json"

# -----------------------
# PDF Text Extraction
# -----------------------
def extract_text_from_pdf(pdf_path: str) -> List[Tuple[int, str]]:
    """Extract text from PDF page by page using PyMuPDF."""
    try:
        doc = fitz.open(pdf_path)
        text_pages = []
        for page_num, page in enumerate(doc, start=1):
            text = (page.get_text("text") or "").strip()
            if text:
                text_pages.append((page_num, text))
        doc.close()
        return text_pages
    except Exception as e:
        logging.error(f"Error extracting text from {pdf_path}: {e}")
        return []

# -----------------------
# PDF Processing (Dynamic Paragraph Chunking)
# -----------------------
def process_pdf(pdf_path: str, min_paragraph_length: int = 50, max_paragraph_length: int = 1000):
    """
    Convert one PDF → chunks + metadata + ids using paragraph-based dynamic chunking.
    min_paragraph_length: skip tiny paragraphs
    max_paragraph_length: if paragraph is too big, split it further
    """
    pages = extract_text_from_pdf(pdf_path)
    doc_id = uuid.uuid5(uuid.NAMESPACE_URL, Path(pdf_path).resolve().as_uri()).hex
    upload_date = datetime.now().strftime("%Y-%m-%d")

    chunks, metadatas, ids = [], [], []

    for page_num, text in pages:
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        for i, paragraph in enumerate(paragraphs):
            if len(paragraph) < min_paragraph_length:
                continue

            # Further split large paragraphs
            if len(paragraph) > max_paragraph_length:
                splitter = RecursiveCharacterTextSplitter(chunk_size=max_paragraph_length, chunk_overlap=50)
                sub_chunks = splitter.split_text(paragraph)
            else:
                sub_chunks = [paragraph]

            for j, chunk in enumerate(sub_chunks):
                chunks.append(chunk)
                metadatas.append({
                    "source": Path(pdf_path).name,
                    "path": str(Path(pdf_path).resolve()),
                    "page": page_num,
                    "chunk_id": f"{i}-{j}",
                    "document_id": doc_id,
                    "upload_date": upload_date
                })
                ids.append(f"{doc_id}-p{page_num}-c{i}-{j}")

    return chunks, metadatas, ids

# -----------------------
# Collection Builder
# -----------------------
def build_collection(pdf_dir: str, persist_dir: str, collection_name: str):
    """Process all PDFs in a directory into a Chroma collection"""
    pdf_files = [os.path.join(pdf_dir, f) for f in os.listdir(pdf_dir) if f.lower().endswith(".pdf")]
    if not pdf_files:
        logging.warning(f"No PDFs found in {pdf_dir}")
        return

    device = "cuda" if torch.cuda.is_available() else "cpu"
    embeddings = HuggingFaceEmbeddings(model_name="nlpaueb/legal-bert-base-uncased",
                                       model_kwargs={"device": device})

    vector_db = Chroma(persist_directory=persist_dir,
                       collection_name=collection_name,
                       embedding_function=embeddings)

    all_chunks, all_metas, all_ids = [], [], []
    for pdf_path in pdf_files:
        # Call process_pdf without passing splitter
        chunks, metas, ids = process_pdf(pdf_path)
        all_chunks.extend(chunks)
        all_metas.extend(metas)
        all_ids.extend(ids)

    if all_chunks:
        vector_db.add_texts(all_chunks, metadatas=all_metas, ids=all_ids)
        logging.info(f"✅ Added {len(all_chunks)} chunks to collection: {collection_name}")

# -----------------------
# Master Runner
# -----------------------
def load_processed_log(persist_root: str) -> dict:
    log_path = Path(persist_root) / PROCESSED_LOG
    if log_path.exists():
        with open(log_path, "r") as f:
            return json.load(f)
    return {}

def save_processed_log(persist_root: str, data: dict):
    os.makedirs(persist_root, exist_ok=True)
    log_path = Path(persist_root) / PROCESSED_LOG
    with open(log_path, "w") as f:
        json.dump(data, f, indent=2)

def process_all_acts(base_folder: str, persist_root: str):
    """Iterate over Acts and build collections only for new Acts"""
    processed = load_processed_log(persist_root)

    for act_name in os.listdir(base_folder):
        act_path = os.path.join(base_folder, act_name)
        if not os.path.isdir(act_path):
            continue

        safe_name = act_name.replace(" ", "_")
        collections = {
            "base": f"{safe_name}-Base",
            "amendment": f"{safe_name}-Amendment"
        }

        for folder_type, collection_name in collections.items():
            folder_path = os.path.join(act_path, folder_type)
            if os.path.exists(folder_path):
                if collection_name in processed:
                    logging.info(f"Skipping already processed collection: {collection_name}")
                    continue

                build_collection(folder_path, persist_root, collection_name)
                processed[collection_name] = True

    save_processed_log(persist_root, processed)

# -----------------------
# Main
# -----------------------
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    base_folder = "Acts"
    persist_root = "chroma_storage"

    process_all_acts(base_folder, persist_root)
    logging.info("✅ Finished embedding all Acts into ChromaDB")









# import os
# import uuid
# import fitz
# import torch
# import logging
# from pathlib import Path
# from datetime import datetime
# from typing import List, Tuple
# from langchain_huggingface import HuggingFaceEmbeddings
# from langchain.text_splitter import RecursiveCharacterTextSplitter
# from langchain_chroma import Chroma
# #from docling.pipeline.standard_pipeline import StandardPipeline
# from pathlib import Path

# # Initialize once (don’t re-create inside function for speed)
# #pipeline = StandardPipeline()

# import fitz  # PyMuPDF

# def extract_text_from_pdf(pdf_path: str) -> List[Tuple[int, str]]:
#     """Extract text from PDF page by page using PyMuPDF."""
#     try:
#         doc = fitz.open(pdf_path)
#         text_pages = []
#         for page_num, page in enumerate(doc, start=1):
#             text = (page.get_text("text") or "").strip()
#             if text.strip():
#                 text_pages.append((page_num, text))
#         doc.close()
#         return text_pages
#     except Exception as e:
#         logging.error(f"Error extracting text from {pdf_path}: {e}")
#         return []




# # -----------------------
# # PDF Processing
# # -----------------------
# def process_pdf(pdf_path: str, text_splitter: RecursiveCharacterTextSplitter):
#     """Convert one PDF → chunks + metadata + ids"""
#     pages = extract_text_from_pdf(pdf_path)
#     doc_id = uuid.uuid5(uuid.NAMESPACE_URL, Path(pdf_path).resolve().as_uri()).hex
#     upload_date = datetime.now().strftime("%Y-%m-%d")

#     chunks, metadatas, ids = [], [], []
#     for page_num, text in pages:
#         split_chunks = [c.strip() for c in text_splitter.split_text(text)]
#         for i, chunk in enumerate(split_chunks):
#             if len(chunk) < 30:
#                 continue
#             chunks.append(chunk)
#             metadatas.append({
#                 "source": Path(pdf_path).name,
#                 "path": str(Path(pdf_path).resolve()),
#                 "page": page_num,
#                 "chunk_id": i,
#                 "document_id": doc_id,
#                 "upload_date": upload_date
#             })
#             ids.append(f"{doc_id}-p{page_num}-c{i}")
#     return chunks, metadatas, ids


# # -----------------------
# # Collection Builder
# # -----------------------
# def build_collection(pdf_dir: str, persist_dir: str, collection_name: str):
#     """Process all PDFs in a directory into a Chroma collection"""
#     pdf_files = [os.path.join(pdf_dir, f) for f in os.listdir(pdf_dir) if f.lower().endswith(".pdf")]
#     if not pdf_files:
#         logging.warning(f"No PDFs found in {pdf_dir}")
#         return

#     device = "cuda" if torch.cuda.is_available() else "cpu"
#     embeddings = HuggingFaceEmbeddings(model_name="nlpaueb/legal-bert-base-uncased",
#                                        model_kwargs={"device": device})
#     splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

#     vector_db = Chroma(persist_directory=persist_dir,
#                        collection_name=collection_name,
#                        embedding_function=embeddings)

#     all_chunks, all_metas, all_ids = [], [], []
#     for pdf_path in pdf_files:
#         chunks, metas, ids = process_pdf(pdf_path, splitter)
#         all_chunks.extend(chunks)
#         all_metas.extend(metas)
#         all_ids.extend(ids)

#     if all_chunks:
#         vector_db.add_texts(all_chunks, metadatas=all_metas, ids=all_ids)
#         logging.info(f"✅ Added {len(all_chunks)} chunks to {collection_name}")


# # -----------------------
# # Master Runner
# # -----------------------
# def process_all_acts(base_folder: str, persist_root: str):
#     """Iterate over Acts and build 2 collections (Base + Amendments) for each"""
#     for act_name in os.listdir(base_folder):
#         act_path = os.path.join(base_folder, act_name)
#         if not os.path.isdir(act_path):
#             continue

#         # Safe collection names
#         safe_name = act_name.replace(" ", "_")
#         base_collection = f"{safe_name}-Base"
#         amend_collection = f"{safe_name}-Amendment"

#         # Process base
#         base_dir = os.path.join(act_path, "base")
#         if os.path.exists(base_dir):
#             build_collection(base_dir, persist_root, base_collection)

#         # Process amendments
#         amend_dir = os.path.join(act_path, "amendment")
#         if os.path.exists(amend_dir):
#             build_collection(amend_dir, persist_root, amend_collection)


# if __name__ == "__main__":
#     logging.basicConfig(level=logging.INFO)

#     # Root folder where all Acts are stored
#     base_folder = "Acts"

#     # Directory where Chroma will persist vectors
#     persist_root = "chroma_storage"

#     process_all_acts(base_folder, persist_root)
#     logging.info("✅ Finished embedding all Acts into ChromaDB")
