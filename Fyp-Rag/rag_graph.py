import json
import logging
import torch
from pathlib import Path
from typing import TypedDict, List, Any

from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate

from langgraph.graph import StateGraph, START, END

# -----------------------
# State Definition
# -----------------------
class RAGState(TypedDict):
    user_question: str
    refined_question: str
    selected_collections: List[str]
    retrieved_docs: List[Any]
    final_answer: str

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
# Node Functions
# -----------------------
def question_input_node(state: RAGState) -> RAGState:
    question = input("\nEnter your question: ").strip()
    return {**state, "user_question": question}

def question_adjuster_node(state: RAGState, available_collections) -> RAGState:
    user_question = state["user_question"]
    selected_collections = []
    current_question = user_question

    print("\n=== Question Adjuster Agent ===")
    while True:
        print(f"\nUser Question: {current_question}")
        print("Available Acts/Collections:")
        for i, coll in enumerate(available_collections):
            print(f"{i+1}. {coll}")

        user_input = input("Select relevant Acts by number (comma separated) or 'done': ").strip()
        if user_input.lower() == "done":
            break

        try:
            choices = [int(x)-1 for x in user_input.split(",")]
            for c in choices:
                if 0 <= c < len(available_collections):
                    coll_name = available_collections[c]
                    if coll_name not in selected_collections:
                        selected_collections.append(coll_name)
            print(f"Selected so far: {selected_collections}")
        except Exception as e:
            print(f"Invalid input: {e}")

        refine_input = input("Refine your question (press Enter to keep same): ").strip()
        if refine_input:
            current_question = refine_input

    return {
        **state,
        "refined_question": current_question,
        "selected_collections": selected_collections
    }

def rag_retriever_node(state: RAGState, collections_dict) -> RAGState:
    question = state.get("refined_question", "")
    selected_collections = state.get("selected_collections", [])

    if not selected_collections:
        print("No collections selected. Cannot retrieve documents.")
        return {**state, "retrieved_docs": []}

    combined_docs = []
    for name in selected_collections:
        if name in collections_dict:
            retriever = collections_dict[name].as_retriever(
                search_type="similarity", search_kwargs={"k": 5}
            )
            docs = retriever.get_relevant_documents(question)
            combined_docs.extend(docs)
        else:
            print(f"Warning: Collection '{name}' not found in available collections")

    print(f"Retrieved {len(combined_docs)} documents total")
    return {**state, "retrieved_docs": combined_docs}

def answer_generation_node(state: RAGState) -> RAGState:
    question = state.get("refined_question", "")
    docs = state.get("retrieved_docs", [])

    if not docs:
        return {**state, "final_answer": "No documents retrieved. Cannot answer this question."}

    try:
        llm = ChatOpenAI(temperature=0)
        prompt_template = """
You are a legal assistant. Use the provided documents to answer the question.
Question: {question}
Documents:
{context}

Answer concisely and clearly based on the provided legal documents.
"""
        context_text = "\n\n".join([doc.page_content for doc in docs])
        formatted_prompt = prompt_template.format(question=question, context=context_text)
        answer = llm.predict(formatted_prompt)
        return {**state, "final_answer": answer}
    except Exception as e:
        error_msg = f"Error generating answer: {str(e)}"
        print(error_msg)
        return {**state, "final_answer": error_msg}

# -----------------------
# Main Graph Execution
# -----------------------
def create_rag_graph(collections_dict, available_collections):
    # Build graph with proper state type
    graph = StateGraph(RAGState)

    # Add nodes with proper lambda functions that maintain state
    graph.add_node("QuestionInput", question_input_node)
    graph.add_node("QuestionAdjuster", 
                  lambda state: question_adjuster_node(state, available_collections))
    graph.add_node("RAGRetriever", 
                  lambda state: rag_retriever_node(state, collections_dict))
    graph.add_node("AnswerGenerator", answer_generation_node)

    # Connect nodes - IMPORTANT: Add START edge
    graph.add_edge(START, "QuestionInput")
    graph.add_edge("QuestionInput", "QuestionAdjuster")
    graph.add_edge("QuestionAdjuster", "RAGRetriever")
    graph.add_edge("RAGRetriever", "AnswerGenerator")
    graph.add_edge("AnswerGenerator", END)

    return graph.compile()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    try:
        collections_dict = load_collections(PERSIST_ROOT)
        available_collections = list(collections_dict.keys())
        
        print("=== Welcome to Agentic RAG System (LangGraph) ===")
        print(f"Loaded {len(collections_dict)} collections: {available_collections}")
        
        # Create the compiled graph
        app = create_rag_graph(collections_dict, available_collections)
        
        # Execute graph
        while True:
            user_continue = input("\nStart a new question? (yes/exit): ").strip().lower()
            if user_continue == "exit":
                break
            
            if user_continue != "yes":
                continue
                
            try:
                # Initialize with empty state
                initial_state = RAGState(
                    user_question="",
                    refined_question="",
                    selected_collections=[],
                    retrieved_docs=[],
                    final_answer=""
                )
                
                # Execute the graph
                results = app.invoke(initial_state)
                
                # Display final answer
                print("\n=== Final Answer ===")
                print(results.get("final_answer", "No answer generated"))
                
            except Exception as e:
                print(f"Error during execution: {str(e)}")
                logging.error(f"Execution error: {e}", exc_info=True)
                
    except Exception as e:
        print(f"Failed to initialize system: {str(e)}")
        logging.error(f"Initialization error: {e}", exc_info=True)