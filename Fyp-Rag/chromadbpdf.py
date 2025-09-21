# import os
# import io
# import re
# import uuid
# import base64
# import logging
# import concurrent.futures
# from datetime import datetime
# from pathlib import Path
# from typing import List, Tuple, Dict, Any, Optional
# import argparse
# from collections import defaultdict

# import fitz
# from PIL import Image
# import torch

# from dotenv import load_dotenv

# load_dotenv()

# from langchain.text_splitter import RecursiveCharacterTextSplitter
# from langchain_huggingface import HuggingFaceEmbeddings
# from langchain_chroma import Chroma
# from langchain_core.documents import Document
# from langchain_openai import ChatOpenAI
# from langchain.retrievers import BM25Retriever
# from langchain.retrievers import EnsembleRetriever



# logging.basicConfig(
#     level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
# )

# PDF_DIR = os.getenv("PDF_DIR", "./Civil Aviation/act")
# AMENDMENT_PDF_DIR = os.getenv("AMENDMENT_PDF_DIR", "./Civil Aviation/amendment")
# PERSIST_DIR = os.getenv("PERSIST_DIR", "././civil_db")
# COLLECTION_NAME = os.getenv("COLLECTION_NAME", "civil_docs")
# AMENDMENT_COLLECTION_NAME = os.getenv("AMENDMENT_COLLECTION_NAME", "civil_amendments")
# OPENAI_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")
# LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", 0))

# # Vision OCR
# OPENAI_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")
# OPENAI_OCR_MODEL = os.getenv("OPENAI_OCR_MODEL", "gpt-4o-mini")
# OCR_DPI = int(os.getenv("OCR_DPI", "220"))
# OCR_MAX_RETRIES = 3
# OCR_BACKOFF = 2.0
# OCR_PROMPT = os.getenv(
#     "OCR_PROMPT",
#     "Extract all legible body text from this legal page. Preserve reading order. "
#     "Ignore repeated headers/footers and watermarks. Return plain UTF-8 text.",
# )

# try:
#     from openai import OpenAI

#     openai_client: Optional["OpenAI"] = OpenAI()
#     _has_openai = True
# except Exception as _e:
#     logging.warning(
#         "OpenAI SDK not available or OPENAI_API_KEY not set. OCR fallback will be disabled."
#     )
#     openai_client = None
#     _has_openai = False


# # ---------------- Helpers ----------------
# def normalize_ws(text: str) -> str:
#     text = re.sub(r"[ \t\u00A0]+", " ", text)
#     text = re.sub(r"\n{3,}", "\n\n", text)
#     return text.strip()


# def render_page_png(page: fitz.Page, dpi: int = OCR_DPI) -> bytes:
#     zoom = dpi / 72.0
#     mat = fitz.Matrix(zoom, zoom)
#     pix = page.get_pixmap(matrix=mat, alpha=False)
#     return pix.tobytes("png")


# def ocr_png_with_openai(img_bytes: bytes) -> str:
#     """OCR a PNG image using OpenAI Vision. Returns normalized text or '' on failure."""
#     if not _has_openai:
#         return ""
#     img_b64 = base64.b64encode(img_bytes).decode("utf-8")
#     last_err = None
#     for attempt in range(1, OCR_MAX_RETRIES + 1):
#         try:
#             resp = openai_client.chat.completions.create(
#                 model=OPENAI_OCR_MODEL,
#                 temperature=0,
#                 messages=[
#                     {
#                         "role": "system",
#                         "content": "You are an OCR assistant for legal documents. Return only extracted text.",
#                     },
#                     {
#                         "role": "user",
#                         "content": [
#                             {"type": "text", "text": OCR_PROMPT},
#                             {
#                                 "type": "image_url",
#                                 "image_url": {
#                                     "url": f"data:image/png;base64,{img_b64}"
#                                 },
#                             },
#                         ],
#                     },
#                 ],
#             )
#             text = resp.choices[0].message.content or ""
#             return normalize_ws(text)
#         except Exception as e:
#             last_err = e
#             if attempt < OCR_MAX_RETRIES:
#                 backoff = OCR_BACKOFF ** (attempt - 1)
#                 logging.warning(
#                     f"OCR attempt {attempt} failed ({e}). Retrying in {backoff:.1f}s..."
#                 )
#                 import time

#                 time.sleep(backoff)
#     logging.error(f"OCR failed after {OCR_MAX_RETRIES} attempts: {last_err}")
#     return ""


# def extract_text_from_pdf(pdf_path: str) -> List[Tuple[int, str]]:
#     """
#     Extract text from a PDF, page by page.
#     - Uses PyMuPDF text first.
#     - Falls back to OpenAI OCR if the page text is empty/very short (scanned).
#     """
#     try:
#         doc = fitz.open(pdf_path)
#         text_pages = []
#         for page_num, page in enumerate(doc, start=1):
#             text = (page.get_text("text") or "").strip()

#             # do OCR for scanned images.
#             if len(text) < 25:
#                 try:
#                     img_bytes = render_page_png(page, dpi=OCR_DPI)
#                     ocr_text = ocr_png_with_openai(img_bytes)
#                     if len(ocr_text) > len(text):
#                         text = ocr_text
#                 except Exception as e:
#                     logging.warning(
#                         f"OCR fallback failed for page {page_num} in {pdf_path}: {e}"
#                     )

#             if text.strip():
#                 text_pages.append((page_num, text.strip()))
#         doc.close()
#         return text_pages
#     except Exception as e:
#         logging.error(f"Error extracting text from {pdf_path}: {e}")
#         return []


# def process_pdf(
#     pdf_file: str, pdf_dir: str, text_splitter: RecursiveCharacterTextSplitter
# ):
#     """
#     Extract and split PDF text into chunks. Adds richer metadata and stable IDs.
#     """
#     full_path = os.path.join(pdf_dir, pdf_file)
#     pages = extract_text_from_pdf(full_path)

#     # stable per-file document_id based on file path URI
#     try:
#         document_id = uuid.uuid5(
#             uuid.NAMESPACE_URL, Path(full_path).resolve().as_uri()
#         ).hex
#     except Exception:
#         document_id = uuid.uuid4().hex

#     chunks, metadata_list, ids = [], [], []
#     upload_date = datetime.now().strftime("%Y-%m-%d")

#     for page_num, text in pages:
#         split_chunks = [c.strip() for c in text_splitter.split_text(text)]
#         for i, chunk in enumerate(split_chunks):
#             if len(chunk) < 30:
#                 continue
#             chunks.append(chunk)
#             metadata_list.append(
#                 {
#                     "source": pdf_file,
#                     "source_path": str(Path(full_path).resolve()),
#                     "page_number": page_num,
#                     "chunk_id": i,
#                     "document_id": document_id,
#                     "document_type": "Legal Document",
#                     "jurisdiction": "Unknown",
#                     "upload_date": upload_date,
#                 }
#             )
#             ids.append(f"{document_id}-p{page_num}-c{i}")

#     return chunks, metadata_list, ids, document_id


# # def process_all_pdfs():

# #     pdf_dir = "./Civil Aviation"
# #     persist_directory = "./civil_db"
# #     collection_name = "civil_docs"

# #     if not os.path.exists(pdf_dir):
# #         logging.error(f"Directory '{pdf_dir}' does not exist!")
# #         return

# #     pdf_files = [f for f in os.listdir(pdf_dir) if f.lower().endswith(".pdf")]
# #     if not pdf_files:
# #         logging.error("No PDF files found!")
# #         return
# #     logging.info(f"Found {len(pdf_files)} PDF files to process.")

# #     device = "cuda" if torch.cuda.is_available() else "cpu"
# #     logging.info(f"Using device: {device}")

# #     embeddings = HuggingFaceEmbeddings(
# #         model_name="nlpaueb/legal-bert-base-uncased",
# #         model_kwargs={"device": device},
# #     )
# #     logging.info("LEGAL-BERT model loaded successfully.")

# #     text_splitter = RecursiveCharacterTextSplitter(
# #         chunk_size=1000,
# #         chunk_overlap=200,
# #         length_function=len,
# #     )

# #     vector_db = Chroma(
# #         persist_directory=persist_directory,
# #         embedding_function=embeddings,
# #         collection_name=collection_name,
# #     )

# #     all_chunks, all_metadatas, all_ids = [], [], []

# #     with concurrent.futures.ThreadPoolExecutor() as executor:
# #         results = executor.map(
# #             lambda pdf: process_pdf(pdf, pdf_dir, text_splitter), pdf_files
# #         )

# #         for pdf_file, (chunks, metadatas, ids, document_id) in zip(pdf_files, results):
# #             if not chunks:
# #                 logging.warning(f"Skipping empty PDF (no extractable text): {pdf_file}")
# #                 continue
# #             all_chunks.extend(chunks)
# #             all_metadatas.extend(metadatas)
# #             all_ids.extend(ids)
# #             logging.info(
# #                 f"Prepared {len(chunks)} chunks from {pdf_file} (document_id={document_id})."
# #             )

# #     if not all_chunks:
# #         logging.info("No chunks to add. Exiting.")
# #         return

# #     logging.info(
# #         f"Adding {len(all_chunks)} chunks to ChromaDB (this embeds; may take a while)..."
# #     )
# #     vector_db.add_texts(texts=all_chunks, metadatas=all_metadatas, ids=all_ids)

# #     try:
# #         collection_size = vector_db._collection.count()
# #     except Exception:
# #         collection_size = "unknown"
# #     logging.info(f"Finished processing. Total chunks in ChromaDB: {collection_size}")

# # ---------------- RAG: Map-Reduce over ALL documents ----------------


# def process_all_pdfs(pdf_dir: str, persist_directory: str, collection_name: str):
#     if not os.path.exists(pdf_dir):
#         logging.error(f"Directory '{pdf_dir}' does not exist!")
#         return

#     pdf_files = [f for f in os.listdir(pdf_dir) if f.lower().endswith(".pdf")]
#     if not pdf_files:
#         logging.error(f"No PDF files found in {pdf_dir}!")
#         return
#     logging.info(f"Found {len(pdf_files)} PDF files to process in {pdf_dir}.")

#     device = "cuda" if torch.cuda.is_available() else "cpu"
#     embeddings = HuggingFaceEmbeddings(
#         model_name="nlpaueb/legal-bert-base-uncased",
#         model_kwargs={"device": device},
#     )

#     text_splitter = RecursiveCharacterTextSplitter(
#         chunk_size=1000, chunk_overlap=200, length_function=len
#     )

#     vector_db = Chroma(
#         persist_directory=persist_directory,
#         embedding_function=embeddings,
#         collection_name=collection_name,
#     )

#     all_chunks, all_metadatas, all_ids = [], [], []

#     with concurrent.futures.ThreadPoolExecutor() as executor:
#         results = executor.map(
#             lambda pdf: process_pdf(pdf, pdf_dir, text_splitter), pdf_files
#         )

#         for pdf_file, (chunks, metadatas, ids, document_id) in zip(pdf_files, results):
#             if not chunks:
#                 logging.warning(f"Skipping empty PDF: {pdf_file}")
#                 continue
#             all_chunks.extend(chunks)
#             all_metadatas.extend(metadatas)
#             all_ids.extend(ids)

#     if not all_chunks:
#         logging.info("No chunks to add.")
#         return

#     vector_db.add_texts(texts=all_chunks, metadatas=all_metadatas, ids=all_ids)
#     logging.info(
#         f"Finished processing {len(all_chunks)} chunks into {collection_name}."
#     )


# def ingest_both():
#     process_all_pdfs(PDF_DIR, PERSIST_DIR, COLLECTION_NAME)  # Acts
#     process_all_pdfs(
#         AMENDMENT_PDF_DIR, PERSIST_DIR, AMENDMENT_COLLECTION_NAME
#     )  # Amendments


# # def get_vectorstore() -> Chroma:
# #     device = "cuda" if torch.cuda.is_available() else "cpu"
# #     embeddings = HuggingFaceEmbeddings(
# #         model_name="nlpaueb/legal-bert-base-uncased",
# #         model_kwargs={"device": device},
# #     )
# #     return Chroma(
# #         persist_directory=PERSIST_DIR,
# #         embedding_function=embeddings,
# #         collection_name=COLLECTION_NAME,
# #     )


# def get_vectorstores() -> Dict[str, Chroma]:
#     device = "cuda" if torch.cuda.is_available() else "cpu"
#     embeddings = HuggingFaceEmbeddings(
#         model_name="nlpaueb/legal-bert-base-uncased",
#         model_kwargs={"device": device},
#     )
#     return {
#         "acts": Chroma(
#             persist_directory=PERSIST_DIR,
#             embedding_function=embeddings,
#             collection_name=COLLECTION_NAME,
#         ),
#         "amendments": Chroma(
#             persist_directory=PERSIST_DIR,
#             embedding_function=embeddings,
#             collection_name=AMENDMENT_COLLECTION_NAME,
#         ),
#     }


# def build_doc_index(vs: Chroma) -> Dict[str, Dict[str, Any]]:
#     """
#     Returns a dict keyed by document_id with some metadata (first source seen, etc.)
#     """
#     # Pull all metadatas (and docs count) to enumerate document_ids
#     col = vs._collection  # using underlying chroma collection
#     # raw = col.get(include=["metadatas"], where={})
#     raw = col.get(include=["metadatas"])
#     metadatas = raw.get("metadatas", []) or []
#     by_doc: Dict[str, Dict[str, Any]] = {}
#     for m in metadatas:
#         doc_id = m.get("document_id", "unknown")
#         if doc_id not in by_doc:
#             by_doc[doc_id] = {"source": m.get("source"), "document_id": doc_id}
#     return by_doc


# def retrieve_topk_per_document(
#     vs: Chroma, question: str, doc_ids: List[str], k_per_doc: int = 3
# ) -> Dict[str, List[Document]]:
#     """
#     For fairness: for each document, retrieve top-k chunks filtered by that document_id.
#     """
#     per_doc_hits: Dict[str, List[Document]] = {}
#     for doc_id in doc_ids:
#         hits = vs.similarity_search(
#             question, k=k_per_doc, filter={"document_id": doc_id}
#         )
#         per_doc_hits[doc_id] = hits
#     return per_doc_hits


# def make_map_prompt(question: str, doc_title: str, chunks: List[Document]) -> str:
#     context_parts = []
#     for i, d in enumerate(chunks, 1):
#         meta = d.metadata or {}
#         src = meta.get("source", "unknown.pdf")
#         page = meta.get("page_number", "?")
#         context_parts.append(f"[{i}] Source: {src}, Page: {page}\n{d.page_content}\n")
#     context = "\n\n".join(context_parts) if context_parts else "(no context provided)"

#     return f"""
# You are a precise legal analyst. Answer ONLY using the context below for the specified document.
# If the context does not contain relevant information, reply exactly: "No relevant information."

# Document: {doc_title}

# Question:
# {question}

# Context:
# {context}

# Rules:
# - Use ONLY the context above; do not invent facts.
# - If partially relevant, answer with what is supported and state limits.
# - If no relevant info, reply exactly "No relevant information."
# """


# def map_step(
#     llm: ChatOpenAI,
#     question: str,
#     per_doc_hits: Dict[str, List[Document]],
#     doc_catalog: Dict[str, Dict[str, Any]],
# ) -> Dict[str, str]:
#     """
#     Returns per-document answers (some may be 'No relevant information.').
#     """
#     answers: Dict[str, str] = {}
#     for doc_id, chunks in per_doc_hits.items():
#         title = doc_catalog.get(doc_id, {}).get("source") or f"document {doc_id[:8]}"
#         prompt = make_map_prompt(question, title, chunks)
#         resp = llm.invoke(prompt)
#         ans = (resp.content or "").strip()
#         answers[doc_id] = ans
#     return answers


# def make_reduce_prompt(
#     question: str,
#     per_doc_answers: Dict[str, str],
#     doc_catalog: Dict[str, Dict[str, Any]],
# ) -> str:
#     lines = []
#     for doc_id, ans in per_doc_answers.items():
#         title = doc_catalog.get(doc_id, {}).get("source") or f"document {doc_id[:8]}"
#         lines.append(f"## {title}\n{ans}\n")
#     combined = "\n".join(lines)

#     return f"""
# You are a senior legal summarizer.

# User Question:
# {question}

# Below are per-document answers (some may say "No relevant information."):

# {combined}

# Task:
# - Merge only the relevant answers into one clear, comprehensive response.
# - If answers conflict, note the conflict and explain.
# - Cite documents by filename (e.g., "(see: file.pdf)") when referencing facts.
# - If ALL answers are "No relevant information.", say so clearly and suggest what documents would be needed.

# Final Answer:
# """


# def reduce_step(
#     llm: ChatOpenAI,
#     question: str,
#     per_doc_answers: Dict[str, str],
#     doc_catalog: Dict[str, Dict[str, Any]],
# ) -> str:
#     prompt = make_reduce_prompt(question, per_doc_answers, doc_catalog)
#     resp = llm.invoke(prompt)
#     return (resp.content or "").strip()


# # def answer_question_map_reduce(
# #     question: str,
# #     k_per_doc: int = 3,
# #     model: str = OPENAI_CHAT_MODEL,
# #     temperature: float = LLM_TEMPERATURE,
# # ) -> str:
# #     """
# #     Map-Reduce RAG over all documents:
# #     - For each document_id, retrieve top-k chunks with a filter.
# #     - Map: answer based only on those chunks, or "No relevant information."
# #     - Reduce: merge relevant answers; ignore irrelevant ones.
# #     """
# #     vs = get_vectorstores()
# #     doc_catalog = build_doc_index(vs)
# #     if not doc_catalog:
# #         return "No documents found in the vector store."

# #     doc_ids = list(doc_catalog.keys())


# #     per_doc_hits = retrieve_topk_per_document(
# #         vs, question, doc_ids, k_per_doc=k_per_doc
# #     )


# #     llm = ChatOpenAI(model=model, temperature=temperature)


# #     per_doc_answers = map_step(llm, question, per_doc_hits, doc_catalog)


# #     any_relevant = any(
# #         "No relevant information" not in a for a in per_doc_answers.values()
# #     )
# #     if not any_relevant:
# #         return "No relevant information across the documents for this question."


# #     final_answer = reduce_step(llm, question, per_doc_answers, doc_catalog)
# #     return final_answer


# def answer_question_map_reduce(
#     question: str,
#     k_per_doc: int = 4,  # now fixed at 4 per collection
#     model: str = OPENAI_CHAT_MODEL,
#     temperature: float = LLM_TEMPERATURE,
# ) -> str:
#     vs_dict = get_vectorstores()
#     llm = ChatOpenAI(model=model, temperature=temperature)

#     per_doc_answers_all = {}
#     doc_catalog_all = {}

#     for name, vs in vs_dict.items():
#         doc_catalog = build_doc_index(vs)
#         doc_catalog_all.update(doc_catalog)
#         if not doc_catalog:
#             logging.warning(f"No documents in {name} collection.")
#             continue

#         doc_ids = list(doc_catalog.keys())
#         per_doc_hits = retrieve_topk_per_document(
#             vs, question, doc_ids, k_per_doc=k_per_doc
#         )
#         per_doc_answers = map_step(llm, question, per_doc_hits, doc_catalog)
#         per_doc_answers_all.update(per_doc_answers)

#     if not per_doc_answers_all:
#         return "No relevant information across Acts or Amendments."

#     any_relevant = any(
#         "No relevant information" not in a for a in per_doc_answers_all.values()
#     )
#     if not any_relevant:
#         return "No relevant information across the documents for this question."

#     final_answer = reduce_step(llm, question, per_doc_answers_all, doc_catalog_all)
#     return final_answer


# # ---------------- CLI ----------------
# # def main():
# #     parser = argparse.ArgumentParser(description="Legal RAG (Ingest + Map-Reduce QA)")
# #     parser.add_argument(
# #         "--ingest", action="store_true", help="Process PDFs and persist to Chroma."
# #     )
# #     parser.add_argument("--ask", type=str, help="Ask a question over the corpus.")
# #     parser.add_argument(
# #         "--k_per_doc",
# #         type=int,
# #         default=int(os.getenv("K_PER_DOC", "3")),
# #         help="Top-k chunks per document for the map step.",
# #     )
# #     parser.add_argument(
# #         "--model", type=str, default=OPENAI_CHAT_MODEL, help="OpenAI chat model for QA."
# #     )
# #     parser.add_argument(
# #         "--temperature", type=float, default=LLM_TEMPERATURE, help="LLM temperature."
# #     )
# #     args = parser.parse_args()

# #     if args.ingest:
# #         process_all_pdfs()

# #     if args.ask:
# #         answer = answer_question_map_reduce(
# #             question=args.ask,
# #             k_per_doc=args.k_per_doc,
# #             model=args.model,
# #             temperature=args.temperature,
# #         )
# #         print("\n=== FINAL ANSWER ===\n")
# #         print(answer)

# #     if not args.ingest and not args.ask:
# #         parser.print_help()



# all_docs = vs.similarity_search("placeholder", k=vs._collection.count())
# bm25_retriever = BM25Retriever.from_documents(all_docs)
# bm25_retriever.k = 5

# dense_retriever = vs.as_retriever(search_kwargs={"k": 5})

# # Hybrid retriever
# hybrid_retriever = EnsembleRetriever(
#     retrievers=[bm25_retriever, dense_retriever],
#     weights=[0.5, 0.5]
# )


# def main():
#     parser = argparse.ArgumentParser(description="Legal RAG (Ingest + Map-Reduce QA)")
#     parser.add_argument(
#         "--ingest", action="store_true", help="Process PDFs and persist to Chroma."
#     )
#     parser.add_argument("--ask", type=str, help="Ask a question over the corpus.")
#     parser.add_argument(
#         "--k_per_doc",
#         type=int,
#         default=int(os.getenv("K_PER_DOC", "3")),
#         help="Top-k chunks per document for the map step.",
#     )
#     parser.add_argument(
#         "--model", type=str, default=OPENAI_CHAT_MODEL, help="OpenAI chat model for QA."
#     )
#     parser.add_argument(
#         "--temperature", type=float, default=LLM_TEMPERATURE, help="LLM temperature."
#     )
#     args = parser.parse_args()

#     if args.ingest:
#         logging.info("Starting ingestion of Acts and Amendments...")
#         ingest_both()
#         logging.info("Ingestion complete.")

#     if args.ask:
#         logging.info(f"Answering question: {args.ask}")
#         answer = answer_question_map_reduce(
#             question=args.ask,
#             k_per_doc=args.k_per_doc,
#             model=args.model,
#             temperature=args.temperature,
#         )
#         print("\n=== FINAL ANSWER ===\n")
#         print(answer)

#     if not args.ingest and not args.ask:
#         parser.print_help()


# if __name__ == "__main__":
#     main()

import os
import io
import re
import uuid
import base64
import logging
import concurrent.futures
from datetime import datetime
from pathlib import Path
from typing import List, Tuple, Dict, Any, Optional
import argparse

import fitz
from PIL import Image
import torch
from dotenv import load_dotenv

load_dotenv()

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_openai import ChatOpenAI
from langchain.retrievers import BM25Retriever, EnsembleRetriever, ContextualCompressionRetriever
from langchain.retrievers.multi_query import MultiQueryRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor
from langchain.prompts import PromptTemplate

from sentence_transformers import CrossEncoder

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# ---------------- Config ----------------
PDF_DIR = os.getenv("PDF_DIR", "./Civil Aviation/act")
AMENDMENT_PDF_DIR = os.getenv("AMENDMENT_PDF_DIR", "./Civil Aviation/amendment")
PERSIST_DIR = os.getenv("PERSIST_DIR", "./civil_db")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "civil_docs")
AMENDMENT_COLLECTION_NAME = os.getenv("AMENDMENT_COLLECTION_NAME", "civil_amendments")
OPENAI_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")
LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", 0))

OCR_DPI = int(os.getenv("OCR_DPI", "220"))
OCR_MAX_RETRIES = 3
OCR_BACKOFF = 2.0
OCR_PROMPT = os.getenv(
    "OCR_PROMPT",
    "Extract all legible body text from this legal page. Preserve reading order. "
    "Ignore repeated headers/footers and watermarks. Return plain UTF-8 text.",
)

try:
    from openai import OpenAI
    openai_client: Optional["OpenAI"] = OpenAI()
    _has_openai = True
except Exception:
    logging.warning("OpenAI SDK not available or OPENAI_API_KEY not set. OCR fallback disabled.")
    openai_client = None
    _has_openai = False

cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')  # Re-ranking

# ---------------- PDF Helpers ----------------
def normalize_ws(text: str) -> str:
    text = re.sub(r"[ \t\u00A0]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

def render_page_png(page: fitz.Page, dpi: int = OCR_DPI) -> bytes:
    zoom = dpi / 72.0
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    return pix.tobytes("png")

def ocr_png_with_openai(img_bytes: bytes) -> str:
    if not _has_openai:
        return ""
    img_b64 = base64.b64encode(img_bytes).decode("utf-8")
    last_err = None
    for attempt in range(1, OCR_MAX_RETRIES + 1):
        try:
            resp = openai_client.chat.completions.create(
                model=OPENAI_CHAT_MODEL,
                temperature=0,
                messages=[
                    {"role": "system", "content": "You are an OCR assistant for legal documents."},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": OCR_PROMPT},
                            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_b64}"}},
                        ],
                    },
                ],
            )
            text = resp.choices[0].message.content or ""
            return normalize_ws(text)
        except Exception as e:
            last_err = e
            if attempt < OCR_MAX_RETRIES:
                import time
                time.sleep(OCR_BACKOFF ** (attempt - 1))
    logging.error(f"OCR failed after {OCR_MAX_RETRIES} attempts: {last_err}")
    return ""

def extract_text_from_pdf(pdf_path: str) -> List[Tuple[int, str]]:
    try:
        doc = fitz.open(pdf_path)
        text_pages = []
        for page_num, page in enumerate(doc, start=1):
            text = (page.get_text("text") or "").strip()
            if len(text) < 25:
                try:
                    img_bytes = render_page_png(page, dpi=OCR_DPI)
                    ocr_text = ocr_png_with_openai(img_bytes)
                    if len(ocr_text) > len(text):
                        text = ocr_text
                except Exception as e:
                    logging.warning(f"OCR failed for page {page_num} in {pdf_path}: {e}")
            if text.strip():
                text_pages.append((page_num, text.strip()))
        doc.close()
        return text_pages
    except Exception as e:
        logging.error(f"Error extracting text from {pdf_path}: {e}")
        return []

def process_pdf(pdf_file: str, pdf_dir: str, text_splitter: RecursiveCharacterTextSplitter):
    full_path = os.path.join(pdf_dir, pdf_file)
    pages = extract_text_from_pdf(full_path)
    try:
        document_id = uuid.uuid5(uuid.NAMESPACE_URL, Path(full_path).resolve().as_uri()).hex
    except Exception:
        document_id = uuid.uuid4().hex

    chunks, metadata_list, ids = [], [], []
    upload_date = datetime.now().strftime("%Y-%m-%d")

    for page_num, text in pages:
        split_chunks = [c.strip() for c in text_splitter.split_text(text)]
        for i, chunk in enumerate(split_chunks):
            if len(chunk) < 30:
                continue
            chunks.append(chunk)
            metadata_list.append({
                "source": pdf_file,
                "source_path": str(Path(full_path).resolve()),
                "page_number": page_num,
                "chunk_id": i,
                "document_id": document_id,
                "document_type": "Legal Document",
                "jurisdiction": "Unknown",
                "upload_date": upload_date,
            })
            ids.append(f"{document_id}-p{page_num}-c{i}")
    return chunks, metadata_list, ids, document_id

def process_all_pdfs(pdf_dir: str, persist_directory: str, collection_name: str):
    if not os.path.exists(pdf_dir):
        logging.error(f"Directory '{pdf_dir}' does not exist!")
        return
    pdf_files = [f for f in os.listdir(pdf_dir) if f.lower().endswith(".pdf")]
    if not pdf_files:
        logging.error(f"No PDFs in {pdf_dir}")
        return
    logging.info(f"Found {len(pdf_files)} PDFs in {pdf_dir}")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    embeddings = HuggingFaceEmbeddings(model_name="nlpaueb/legal-bert-base-uncased", model_kwargs={"device": device})
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200, length_function=len)
    vector_db = Chroma(persist_directory=persist_directory, embedding_function=embeddings, collection_name=collection_name)

    all_chunks, all_metadatas, all_ids = [], [], []
    with concurrent.futures.ThreadPoolExecutor() as executor:
        results = executor.map(lambda pdf: process_pdf(pdf, pdf_dir, text_splitter), pdf_files)
        for pdf_file, (chunks, metadatas, ids, _) in zip(pdf_files, results):
            if not chunks:
                logging.warning(f"Skipping empty PDF: {pdf_file}")
                continue
            all_chunks.extend(chunks)
            all_metadatas.extend(metadatas)
            all_ids.extend(ids)

    if not all_chunks:
        logging.info("No chunks to add")
        return
    vector_db.add_texts(texts=all_chunks, metadatas=all_metadatas, ids=all_ids)
    logging.info(f"Finished processing {len(all_chunks)} chunks into {collection_name}")

def ingest_both():
    process_all_pdfs(PDF_DIR, PERSIST_DIR, COLLECTION_NAME)
    process_all_pdfs(AMENDMENT_PDF_DIR, PERSIST_DIR, AMENDMENT_COLLECTION_NAME)

# ---------------- Vectorstores ----------------
def get_vectorstores() -> Dict[str, Chroma]:
    device = "cuda" if torch.cuda.is_available() else "cpu"
    embeddings = HuggingFaceEmbeddings(model_name="nlpaueb/legal-bert-base-uncased", model_kwargs={"device": device})
    return {
        "acts": Chroma(persist_directory=PERSIST_DIR, embedding_function=embeddings, collection_name=COLLECTION_NAME),
        "amendments": Chroma(persist_directory=PERSIST_DIR, embedding_function=embeddings, collection_name=AMENDMENT_COLLECTION_NAME),
    }

def build_doc_index(vs: Chroma) -> Dict[str, Dict[str, Any]]:
    col = vs._collection
    raw = col.get(include=["metadatas"])
    metadatas = raw.get("metadatas", []) or []
    by_doc = {}
    for m in metadatas:
        doc_id = m.get("document_id", "unknown")
        if doc_id not in by_doc:
            by_doc[doc_id] = {"source": m.get("source"), "document_id": doc_id}
    return by_doc

def retrieve_topk_per_document(vs: Chroma, question: str, doc_ids: List[str], k_per_doc: int = 3) -> Dict[str, List[Document]]:
    per_doc_hits = {}
    for doc_id in doc_ids:
        hits = vs.similarity_search(question, k=k_per_doc, filter={"document_id": doc_id})
        per_doc_hits[doc_id] = hits
    return per_doc_hits

def rerank(query: str, docs: List[Document]) -> List[Document]:
    pairs = [[query, d.page_content] for d in docs]
    scores = cross_encoder.predict(pairs)
    sorted_docs = [doc for _, doc in sorted(zip(scores, docs), reverse=True)]
    return sorted_docs

# ---------------- Map-Reduce ----------------
def make_map_prompt(question: str, doc_title: str, chunks: List[Document]) -> str:
    context_parts = []
    for i, d in enumerate(chunks, 1):
        meta = d.metadata or {}
        src = meta.get("source", "unknown.pdf")
        page = meta.get("page_number", "?")
        context_parts.append(f"[{i}] Source: {src}, Page: {page}\n{d.page_content}\n")
    context = "\n\n".join(context_parts) if context_parts else "(no context provided)"
    return f"""
You are a precise legal analyst. Answer ONLY using the context below for the specified document.
If the context does not contain relevant information, reply exactly: "No relevant information."

Document: {doc_title}

Question:
{question}

Context:
{context}

Rules:
- Use ONLY the context above; do not invent facts.
- If partially relevant, answer with what is supported and state limits.
- If no relevant info, reply exactly "No relevant information."
"""

def map_step(llm: ChatOpenAI, question: str, per_doc_hits: Dict[str, List[Document]], doc_catalog: Dict[str, Dict[str, Any]]) -> Dict[str, str]:
    answers = {}
    for doc_id, chunks in per_doc_hits.items():
        title = doc_catalog.get(doc_id, {}).get("source") or f"document {doc_id[:8]}"
        prompt = make_map_prompt(question, title, chunks)
        resp = llm.invoke(prompt)
        ans = (resp.content or "").strip()
        answers[doc_id] = ans
    return answers

def make_reduce_prompt(question: str, per_doc_answers: Dict[str, str], doc_catalog: Dict[str, Dict[str, Any]]) -> str:
    lines = []
    for doc_id, ans in per_doc_answers.items():
        title = doc_catalog.get(doc_id, {}).get("source") or f"document {doc_id[:8]}"
        lines.append(f"## {title}\n{ans}\n")
    combined = "\n".join(lines)
    return f"""
You are a senior legal summarizer.

User Question:
{question}

Below are per-document answers (some may say "No relevant information."):

{combined}

Task:
- Merge only the relevant answers into one clear, comprehensive response.
- Cite documents by filename (e.g., "(see: file.pdf)").
- If ALL answers are "No relevant information.", say so clearly.

Final Answer:
"""

def reduce_step(llm: ChatOpenAI, question: str, per_doc_answers: Dict[str, str], doc_catalog: Dict[str, Dict[str, Any]]) -> str:
    prompt = make_reduce_prompt(question, per_doc_answers, doc_catalog)
    resp = llm.invoke(prompt)
    return (resp.content or "").strip()

def answer_question_map_reduce(question: str, k_per_doc: int = 4, model: str = OPENAI_CHAT_MODEL, temperature: float = LLM_TEMPERATURE) -> str:
    vs_dict = get_vectorstores()
    llm = ChatOpenAI(model=model, temperature=temperature)

    per_doc_answers_all = {}
    doc_catalog_all = {}

    for name, vs in vs_dict.items():
        all_docs = vs.similarity_search("placeholder", k=vs._collection.count())
        bm25 = BM25Retriever.from_documents(all_docs)
        bm25.k = k_per_doc
        dense = vs.as_retriever(search_kwargs={"k": k_per_doc})
        hybrid = EnsembleRetriever(retrievers=[bm25, dense], weights=[0.5, 0.5])

        doc_catalog = build_doc_index(vs)
        doc_catalog_all.update(doc_catalog)
        if not doc_catalog:
            logging.warning(f"No documents in {name} collection.")
            continue

        doc_ids = list(doc_catalog.keys())
        per_doc_hits = {}
        for doc_id in doc_ids:
            chunks = hybrid.get_relevant_documents(question)
            # Filter by document_id
            filtered_chunks = [c for c in chunks if c.metadata.get("document_id") == doc_id]
            per_doc_hits[doc_id] = filtered_chunks[:k_per_doc]

        per_doc_answers = map_step(llm, question, per_doc_hits, doc_catalog)
        per_doc_answers_all.update(per_doc_answers)

    final_answer = reduce_step(llm, question, per_doc_answers_all, doc_catalog_all)
    return final_answer

# ---------------- Main ----------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--ingest", action="store_true", help="Ingest PDFs into vector DB")
    parser.add_argument("--query", type=str, help="Question to ask the legal DB")
    args = parser.parse_args()

    if args.ingest:
        ingest_both()
    elif args.query:
        answer = answer_question_map_reduce(args.query)
        print("\n=== FINAL ANSWER ===\n")
        print(answer)
    else:
        print("Use --ingest to index PDFs or --query 'your question'")
