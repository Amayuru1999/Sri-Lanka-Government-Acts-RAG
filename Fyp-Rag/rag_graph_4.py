import json
import logging
import torch
from pathlib import Path
from typing import TypedDict, List, Any
import os
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate

from langgraph.graph import StateGraph, START, END

from dotenv import load_dotenv

load_dotenv()

# -----------------------
# State Definition
# -----------------------
class RAGState(TypedDict):
    user_question: str
    analysis_result: str
    question_status: str  # "answerable", "needs_reshaping", "not_answerable"
    reshaped_question: str
    user_approved_question: str
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

def question_analyzer_node(state: RAGState, available_collections) -> RAGState:
    user_question = state["user_question"]
    
    print("\n=== Question Analyzer Agent ===")
    print("Analyzing your question against available legal acts...")
    
    try:
        llm = ChatOpenAI(temperature=0.3)
        
        # Create a summary of available acts for the LLM
        acts_summary = "\n".join([f"- {act}" for act in available_collections])
        
        analysis_prompt = f"""
You are a legal expert analyzing whether a user question can be answered using available legal acts.

Available Legal Acts/Collections:
{acts_summary}

User Question: "{user_question}"

Analyze the question and determine:
1. Can this question be directly answered using the available acts? 
2. Is the question related to legal matters but needs reshaping to align with available acts?
3. Is the question completely unrelated to the available legal acts?

Based on your analysis, classify the question as one of:
- ANSWERABLE: Question can be directly answered with available acts
- NEEDS_RESHAPING: Question is legal-related but needs to be reformulated to match available acts
- NOT_ANSWERABLE: Question is completely outside the scope of available acts

Provide your classification and a brief explanation.

Format your response as:
STATUS: [ANSWERABLE/NEEDS_RESHAPING/NOT_ANSWERABLE]
EXPLANATION: [Your explanation]
SUGGESTED_QUESTION: [If NEEDS_RESHAPING, provide a better question aligned with available acts]
RELEVANT_ACTS: [List relevant act names if any]
"""
        
        analysis_result = llm.predict(analysis_prompt)
        print(f"Analysis Result:\n{analysis_result}")
        
        # Parse the analysis result
        lines = analysis_result.strip().split('\n')
        status = "not_answerable"
        explanation = ""
        suggested_question = ""
        relevant_acts = []
        
        for line in lines:
            if line.startswith("STATUS:"):
                status_text = line.split(":", 1)[1].strip()
                if "ANSWERABLE" in status_text and "NEEDS_RESHAPING" not in status_text:
                    status = "answerable"
                elif "NEEDS_RESHAPING" in status_text:
                    status = "needs_reshaping"
                else:
                    status = "not_answerable"
            elif line.startswith("EXPLANATION:"):
                explanation = line.split(":", 1)[1].strip()
            elif line.startswith("SUGGESTED_QUESTION:"):
                suggested_question = line.split(":", 1)[1].strip()
            elif line.startswith("RELEVANT_ACTS:"):
                acts_text = line.split(":", 1)[1].strip()
                relevant_acts = [act.strip() for act in acts_text.split(",") if act.strip()]
        
        return {
            **state,
            "analysis_result": analysis_result,
            "question_status": status,
            "reshaped_question": suggested_question,
            "selected_collections": relevant_acts
        }
        
    except Exception as e:
        print(f"Error during analysis: {e}")
        return {
            **state,
            "analysis_result": f"Analysis failed: {str(e)}",
            "question_status": "not_answerable",
            "reshaped_question": "",
            "selected_collections": []
        }

def question_reshaping_node(state: RAGState) -> RAGState:
    question_status = state.get("question_status", "")
    reshaped_question = state.get("reshaped_question", "")
    original_question = state.get("user_question", "")
    
    if question_status == "not_answerable":
        print("\n=== Question Status: NOT ANSWERABLE ===")
        print("I'm sorry, but your question appears to be outside the scope of the available legal acts.")
        print("The available acts are focused on specific legal domains, and your question doesn't align with these areas.")
        return {**state, "final_answer": "Question cannot be answered with available legal acts."}
    
    elif question_status == "answerable":
        print("\n=== Question Status: DIRECTLY ANSWERABLE ===")
        print("Great! Your question can be answered using the available legal acts.")
        return {**state, "user_approved_question": original_question}
    
    elif question_status == "needs_reshaping":
        print("\n=== Question Reshaping Agent ===")
        print("Your question is related to legal matters, but I can reshape it to better align with available acts.")
        print(f"\nOriginal Question: {original_question}")
        print(f"Suggested Reshaped Question: {reshaped_question}")
        
        while True:
            user_choice = input("\nWould you like to:\n1. Use the reshaped question\n2. Modify it further\n3. Cancel\nEnter choice (1/2/3): ").strip()
            
            if user_choice == "1":
                return {**state, "user_approved_question": reshaped_question}
            elif user_choice == "2":
                user_modified = input("Enter your modified question: ").strip()
                if user_modified:
                    return {**state, "user_approved_question": user_modified}
                else:
                    print("No question entered. Please try again.")
            elif user_choice == "3":
                return {**state, "final_answer": "Question processing cancelled by user."}
            else:
                print("Invalid choice. Please enter 1, 2, or 3.")
    
    return {**state, "user_approved_question": original_question}

def smart_collection_selector_node(state: RAGState, collections_dict) -> RAGState:
    approved_question = state.get("user_approved_question", "")
    pre_selected_collections = state.get("selected_collections", [])
    
    if not approved_question:
        return {**state, "retrieved_docs": []}
    
    print("\n=== Smart Collection Selector ===")
    print(f"Question to process: {approved_question}")
    
    # If we already have pre-selected collections from analysis, use them
    if pre_selected_collections:
        # Validate pre-selected collections exist
        valid_collections = []
        for coll in pre_selected_collections:
            if coll in collections_dict:
                valid_collections.append(coll)
            else:
                # Try partial matching
                matches = [c for c in collections_dict.keys() if coll.lower() in c.lower() or c.lower() in coll.lower()]
                if matches:
                    valid_collections.extend(matches)
        
        if valid_collections:
            print(f"Using AI-selected collections: {valid_collections}")
            user_confirm = input("Proceed with these collections? (y/n): ").strip().lower()
            if user_confirm in ['y', 'yes']:
                return {**state, "selected_collections": list(set(valid_collections))}
    
    # Manual selection fallback
    print("Available Legal Acts/Collections:")
    available_collections = list(collections_dict.keys())
    for i, coll in enumerate(available_collections):
        print(f"{i+1}. {coll}")
    
    selected_collections = []
    while True:
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
    
    return {**state, "selected_collections": selected_collections}

def rag_retriever_node(state: RAGState, collections_dict) -> RAGState:
    question = state.get("user_approved_question", "")
    selected_collections = state.get("selected_collections", [])

    if not selected_collections:
        print("No collections selected. Cannot retrieve documents.")
        return {**state, "retrieved_docs": []}

    print(f"\n=== Document Retrieval ===")
    print(f"Searching in collections: {selected_collections}")
    
    combined_docs = []
    for name in selected_collections:
        if name in collections_dict:
            retriever = collections_dict[name].as_retriever(
                search_type="similarity", search_kwargs={"k": 5}
            )
            docs = retriever.get_relevant_documents(question)
            combined_docs.extend(docs)
            print(f"Retrieved {len(docs)} documents from {name}")
        else:
            print(f"Warning: Collection '{name}' not found in available collections")

    print(f"Total documents retrieved: {len(combined_docs)}")
    return {**state, "retrieved_docs": combined_docs}

def answer_generation_node(state: RAGState) -> RAGState:
    question = state.get("user_approved_question", "")
    docs = state.get("retrieved_docs", [])
    
    # Check if we already have a final answer (from early termination)
    if state.get("final_answer"):
        return state

    if not docs:
        return {**state, "final_answer": "No relevant documents found. Cannot provide an answer based on available legal acts."}

    print(f"\n=== Answer Generation ===")
    print("Generating comprehensive answer based on retrieved legal documents...")
    
    try:
        llm = ChatOpenAI(temperature=0)
        prompt_template = """
You are an expert legal assistant. Use the provided legal documents to answer the user's question comprehensively and accurately.

User Question: {question}

Legal Documents: In this context there might be unnessary information will be there. Please look at the question and only use rl=elavant context to generate the answer
{context}

Instructions:
1. Provide a clear, comprehensive answer based solely on the provided legal documents
2. Cite specific sections or provisions where relevant
3. If the documents don't fully address the question, clearly state what aspects cannot be answered
4. Use professional legal language but ensure clarity for the user
5. Structure your answer logically with clear sections if the response is lengthy

Answer:
"""
        context_text = "\n\n---Document---\n".join([f"Source: {doc.metadata.get('source', 'Unknown')}\nContent: {doc.page_content}" for doc in docs])
        formatted_prompt = prompt_template.format(question=question, context=context_text)
        answer = llm.predict(formatted_prompt)
        return {**state, "final_answer": answer}
        
    except Exception as e:
        error_msg = f"Error generating answer: {str(e)}"
        print(error_msg)
        return {**state, "final_answer": error_msg}

# -----------------------
# Decision Logic
# -----------------------
def should_continue_processing(state: RAGState) -> str:
    question_status = state.get("question_status", "")
    if question_status == "not_answerable":
        return "end"
    elif state.get("final_answer", "").startswith("Question processing cancelled"):
        return "end"
    else:
        return "continue"

# -----------------------
# Main Graph Execution
# -----------------------
def create_rag_graph(collections_dict, available_collections):
    # Build graph with proper state type
    graph = StateGraph(RAGState)

    # Add all nodes
    graph.add_node("QuestionInput", question_input_node)
    graph.add_node("QuestionAnalyzer", 
                  lambda state: question_analyzer_node(state, available_collections))
    graph.add_node("QuestionReshaping", question_reshaping_node)
    graph.add_node("CollectionSelector", 
                  lambda state: smart_collection_selector_node(state, collections_dict))
    graph.add_node("RAGRetriever", 
                  lambda state: rag_retriever_node(state, collections_dict))
    graph.add_node("AnswerGenerator", answer_generation_node)

    # Connect nodes with conditional logic
    graph.add_edge(START, "QuestionInput")
    graph.add_edge("QuestionInput", "QuestionAnalyzer")
    graph.add_edge("QuestionAnalyzer", "QuestionReshaping")
    
    # Conditional edge based on whether we should continue processing
    graph.add_conditional_edges(
        "QuestionReshaping",
        should_continue_processing,
        {
            "continue": "CollectionSelector",
            "end": END
        }
    )
    
    graph.add_edge("CollectionSelector", "RAGRetriever")
    graph.add_edge("RAGRetriever", "AnswerGenerator")
    graph.add_edge("AnswerGenerator", END)

    return graph.compile()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Check environment setup
    print("=== Environment Check ===")
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        print(f"✓ OpenAI API Key loaded (ends with: ...{openai_key[-4:]})")
    else:
        print("⚠ OpenAI API Key not found - will use fallback keyword analysis")
        print("  To enable full AI analysis, ensure .env file has OPENAI_API_KEY=your_key")
    
    try:
        collections_dict = load_collections(PERSIST_ROOT)
        available_collections = list(collections_dict.keys())
        
        print("\n=== Welcome to Autonomous Legal RAG System ===")
        print(f"Loaded {len(collections_dict)} legal act collections:")
        for act in available_collections:
            print(f"  • {act}")
        print("\nThis system will intelligently analyze your questions and guide you through the process.")
        
        # Create the compiled graph
        app = create_rag_graph(collections_dict, available_collections)
        
        # Execute graph
        while True:
            user_continue = input("\nWould you like to ask a legal question? (yes/exit): ").strip().lower()
            if user_continue == "exit":
                print("Thank you for using the Legal RAG System!")
                break
            
            if user_continue != "yes":
                continue
                
            try:
                # Initialize with empty state
                initial_state = RAGState(
                    user_question="",
                    analysis_result="",
                    question_status="",
                    reshaped_question="",
                    user_approved_question="",
                    selected_collections=[],
                    retrieved_docs=[],
                    final_answer=""
                )
                
                # Execute the graph
                results = app.invoke(initial_state)
                
                # Display final answer
                print("\n" + "="*50)
                print("FINAL ANSWER")
                print("="*50)
                print(results.get("final_answer", "No answer generated"))
                print("="*50)
                
            except Exception as e:
                print(f"Error during execution: {str(e)}")
                logging.error(f"Execution error: {e}", exc_info=True)
                
    except Exception as e:
        print(f"Failed to initialize system: {str(e)}")
        logging.error(f"Initialization error: {e}", exc_info=True)