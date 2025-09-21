import json
import logging
import torch
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from pathlib import Path

# -----------------------
# Config
# -----------------------
PERSIST_ROOT = "chroma_storage"
PROCESSED_LOG = "processed_collections.json"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# -----------------------
# Load collections dynamically
# -----------------------
def load_collections(persist_root: str):
    log_path = Path(persist_root) / PROCESSED_LOG
    if not log_path.exists():
        raise FileNotFoundError(f"{PROCESSED_LOG} not found in {persist_root}")

    with open(log_path, "r") as f:
        processed = json.load(f)

    embeddings = HuggingFaceEmbeddings(
        model_name="nlpaueb/legal-bert-base-uncased",
        model_kwargs={"device": DEVICE}
    )

    collections = {}
    for collection_name in processed.keys():
        collections[collection_name] = Chroma(
            persist_directory=persist_root,
            collection_name=collection_name,
            embedding_function=embeddings
        )
    return collections

# -----------------------
# Question Adjuster Agent
# -----------------------
def question_adjuster(user_question: str, available_collections: list):
    """
    Iteratively ask clarifying questions to identify relevant collections.
    Returns a list of collection names to query.
    """
    selected_collections = []

    print("=== Question Adjuster Agent ===")
    current_question = user_question
    while True:
        print(f"\nUser Question: {current_question}")
        print("Available Acts/Collections to consider:")
        for i, coll in enumerate(available_collections):
            print(f"{i+1}. {coll}")

        user_input = input("Enter numbers of relevant Acts separated by comma (or 'done' if satisfied): ").strip()
        if user_input.lower() == "done":
            break

        try:
            choices = [int(x) - 1 for x in user_input.split(",")]
            for c in choices:
                if available_collections[c] not in selected_collections:
                    selected_collections.append(available_collections[c])
            print(f"Selected collections so far: {selected_collections}")
        except Exception as e:
            print(f"Invalid input. Try again. Error: {e}")

        current_question = input("Do you want to refine the question? (press Enter to keep same): ").strip() or current_question

    return selected_collections

# -----------------------
# RAG Agent
# -----------------------
def rag_agent(user_question: str, selected_collections: list, collections_dict: dict):
    """
    Perform semantic search on selected collections and answer question.
    """
    if not selected_collections:
        print("No relevant collections selected. Cannot answer.")
        return None

    # Combine all selected collections into one retriever
    retrievers = [collections_dict[name].as_retriever(search_type="similarity", search_kwargs={"k": 5})
                  for name in selected_collections]

    from langchain.chains import AnalyzeDocumentChain, LLMChain
    from langchain.chains.combine_documents.base import StuffDocumentsChain

    # For simplicity, chain all retrievers sequentially
    # Here we just merge top docs
    combined_docs = []
    for retriever in retrievers:
        combined_docs.extend(retriever.get_relevant_documents(user_question))

    if not combined_docs:
        print("No documents retrieved for this question.")
        return None

    llm = ChatOpenAI(temperature=0)
    prompt_template = """
You are a legal assistant. Use the provided documents to answer the question.
Question: {question}
Documents:
{context}

Answer concisely and clearly.
"""
    prompt = PromptTemplate(input_variables=["question", "context"], template=prompt_template)
    chain = LLMChain(llm=llm, prompt=prompt)
    context_text = "\n\n".join([doc.page_content for doc in combined_docs])
    answer = chain.run(question=user_question, context=context_text)
    return answer

# -----------------------
# Main interactive loop
# -----------------------
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    collections_dict = load_collections(PERSIST_ROOT)
    available_collections = list(collections_dict.keys())

    print("=== Welcome to Agentic RAG System ===")

    while True:
        user_question = input("\nEnter your question (or 'exit' to quit): ").strip()
        if user_question.lower() == "exit":
            break

        selected = question_adjuster(user_question, available_collections)
        answer = rag_agent(user_question, selected, collections_dict)
        if answer:
            print("\n=== Answer ===")
            print(answer)
        else:
            print("\nNo answer could be retrieved.")
