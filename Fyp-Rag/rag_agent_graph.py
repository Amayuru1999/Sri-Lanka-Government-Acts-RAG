# import json
# import logging
# import torch
# from pathlib import Path

# from langchain_community.vectorstores import Chroma
# from langchain_community.embeddings import HuggingFaceEmbeddings
# from langchain_community.chat_models import ChatOpenAI
# from langchain.prompts import PromptTemplate

# from langgraph.graph import StateGraph, END

# # -----------------------
# # Config
# # -----------------------
# PERSIST_ROOT = "chroma_storage"
# PROCESSED_LOG = "processed_collections.json"
# DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# # -----------------------
# # Load collections dynamically
# # -----------------------
# def load_collections(persist_root: str):
#     log_path = Path(persist_root) / PROCESSED_LOG
#     if not log_path.exists():
#         raise FileNotFoundError(f"{PROCESSED_LOG} not found in {persist_root}")

#     with open(log_path, "r") as f:
#         processed = json.load(f)

#     embeddings = HuggingFaceEmbeddings(
#         model_name="nlpaueb/legal-bert-base-uncased",
#         model_kwargs={"device": DEVICE}
#     )

#     collections = {}
#     for collection_name in processed.keys():
#         collections[collection_name] = Chroma(
#             persist_directory=persist_root,
#             collection_name=collection_name,
#             embedding_function=embeddings
#         )
#     return collections

# # -----------------------
# # Node Definitions
# # -----------------------
# class QuestionInputNode(Node):
#     def run(self, inputs):
#         question = input("\nEnter your question: ").strip()
#         return {"user_question": question}

# class QuestionAdjusterNode(Node):
#     def __init__(self, available_collections):
#         super().__init__()
#         self.available_collections = available_collections

#     def run(self, inputs):
#         user_question = inputs["user_question"]
#         selected_collections = []
#         current_question = user_question

#         print("\n=== Question Adjuster Agent ===")
#         while True:
#             print(f"\nUser Question: {current_question}")
#             print("Available Acts/Collections:")
#             for i, coll in enumerate(self.available_collections):
#                 print(f"{i+1}. {coll}")

#             user_input = input("Select relevant Acts by number (comma separated) or 'done': ").strip()
#             if user_input.lower() == "done":
#                 break

#             try:
#                 choices = [int(x)-1 for x in user_input.split(",")]
#                 for c in choices:
#                     coll_name = self.available_collections[c]
#                     if coll_name not in selected_collections:
#                         selected_collections.append(coll_name)
#                 print(f"Selected so far: {selected_collections}")
#             except Exception as e:
#                 print(f"Invalid input: {e}")

#             current_question = input("Refine your question (press Enter to keep same): ").strip() or current_question

#         return {
#             "refined_question": current_question,
#             "selected_collections": selected_collections
#         }

# class RAGRetrieverNode(Node):
#     def __init__(self, collections_dict):
#         super().__init__()
#         self.collections_dict = collections_dict

#     def run(self, inputs):
#         question = inputs["refined_question"]
#         selected_collections = inputs["selected_collections"]

#         if not selected_collections:
#             print("No collections selected. Cannot retrieve documents.")
#             return {"retrieved_docs": []}

#         combined_docs = []
#         for name in selected_collections:
#             retriever = self.collections_dict[name].as_retriever(
#                 search_type="similarity", search_kwargs={"k": 5}
#             )
#             combined_docs.extend(retriever.get_relevant_documents(question))

#         return {"retrieved_docs": combined_docs}

# class AnswerGenerationNode(Node):
#     def run(self, inputs):
#         question = inputs["refined_question"]
#         docs = inputs["retrieved_docs"]

#         if not docs:
#             return {"final_answer": "No documents retrieved. Cannot answer this question."}

#         llm = ChatOpenAI(temperature=0)
#         prompt_template = """
# You are a legal assistant. Use the provided documents to answer the question.
# Question: {question}
# Documents:
# {context}

# Answer concisely and clearly.
# """
#         prompt = PromptTemplate(input_variables=["question", "context"], template=prompt_template)
#         context_text = "\n\n".join([doc.page_content for doc in docs])
#         answer = llm.predict(prompt.format(question=question, context=context_text))
#         return {"final_answer": answer}


# # Main Graph Execution
# # -----------------------
# if __name__ == "__main__":
#     logging.basicConfig(level=logging.INFO)
#     collections_dict = load_collections(PERSIST_ROOT)
#     available_collections = list(collections_dict.keys())

#     print("=== Welcome to Agentic RAG System (LangGraph) ===")

#     # Build graph with dictionary as state
#     graph = StateGraph(dict)

#     # Add nodes (functions that take state dict and return dict)
#     graph.add_node("QuestionInput", QuestionInputNode)
#     graph.add_node("QuestionAdjuster", lambda state: QuestionAdjusterNode(state, available_collections))
#     graph.add_node("RAGRetriever", lambda state: RAGRetrieverNode(state, collections_dict))
#     graph.add_node("AnswerGenerator", AnswerGenerationNode)

#     # Connect nodes
#     graph.add_edge("QuestionInput", "QuestionAdjuster")
#     graph.add_edge("QuestionAdjuster", "RAGRetriever")
#     graph.add_edge("RAGRetriever", "AnswerGenerator")
#     graph.add_edge("AnswerGenerator", END)

#     # Execute graph
#     while True:
#         user_continue = input("\nStart a new question? (yes/exit): ").strip().lower()
#         if user_continue == "exit":
#             break

#         results = graph.invoke({"initial_key": "initial_value"})
#         final_answer = results.get("AnswerGenerator", {}).get("final_answer", None)
#         print("\n=== Answer ===")
#         print(final_answer)



import json
import logging
import torch
from pathlib import Path

from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate

from langgraph.graph import StateGraph, END

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
def question_input_node(state):
    question = input("\nEnter your question: ").strip()
    return {"user_question": question}

def question_adjuster_node(state, available_collections):
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
                coll_name = available_collections[c]
                if coll_name not in selected_collections:
                    selected_collections.append(coll_name)
            print(f"Selected so far: {selected_collections}")
        except Exception as e:
            print(f"Invalid input: {e}")

        current_question = input("Refine your question (press Enter to keep same): ").strip() or current_question

    return {
        "refined_question": current_question,
        "selected_collections": selected_collections
    }

def rag_retriever_node(state, collections_dict):
    question = state.get("refined_question", "")
    selected_collections = state.get("selected_collections", [])

    if not selected_collections:
        print("No collections selected. Cannot retrieve documents.")
        return {"retrieved_docs": []}

    combined_docs = []
    for name in selected_collections:
        retriever = collections_dict[name].as_retriever(
            search_type="similarity", search_kwargs={"k": 5}
        )
        combined_docs.extend(retriever.get_relevant_documents(question))

    return {"retrieved_docs": combined_docs}

def answer_generation_node(state):
    question = state.get("refined_question", "")
    docs = state.get("retrieved_docs", [])

    if not docs:
        return {"final_answer": "No documents retrieved. Cannot answer this question."}

    llm = ChatOpenAI(temperature=0)
    prompt_template = """
You are a legal assistant. Use the provided documents to answer the question.
Question: {question}
Documents:
{context}

Answer concisely and clearly.
"""
    context_text = "\n\n".join([doc.page_content for doc in docs])
    answer = llm.predict(prompt_template.format(question=question, context=context_text))
    return {"final_answer": answer}

# -----------------------
# Main Graph Execution
# -----------------------
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    collections_dict = load_collections(PERSIST_ROOT)
    available_collections = list(collections_dict.keys())

    print("=== Welcome to Agentic RAG System (LangGraph) ===")

    # Build graph with dictionary as state
    graph = StateGraph(dict)

    # Add nodes
    graph.add_node("QuestionInput", question_input_node)
    graph.add_node("QuestionAdjuster", lambda state: question_adjuster_node(state, available_collections))
    graph.add_node("RAGRetriever", lambda state: rag_retriever_node(state, collections_dict))
    graph.add_node("AnswerGenerator", answer_generation_node)

    # Connect nodes
    graph.add_edge("QuestionInput", "QuestionAdjuster")
    graph.add_edge("QuestionAdjuster", "RAGRetriever")
    graph.add_edge("RAGRetriever", "AnswerGenerator")
    graph.add_edge("AnswerGenerator", END)

    # Compile the graph into callable
    app = graph.compile()

    # Execute graph
    while True:
        user_continue = input("\nStart a new question? (yes/exit): ").strip().lower()
        if user_continue == "exit":
            break

        results = app.invoke({"initial_key": "initial_value"})
        final_answer = results.get("AnswerGenerator", {}).get("final_answer", None)
        print("\n=== Answer ===")
        print(final_answer)
