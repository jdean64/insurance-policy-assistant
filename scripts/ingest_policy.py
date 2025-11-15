"""
Utility script to ingest a policy PDF into Pinecone.

Steps performed:
1. Extract raw text from the PDF.
2. Chunk the text into overlapping passages.
3. Embed each chunk with Gemini text-embedding-004.
4. Upsert embeddings and metadata into the configured Pinecone index/namespace.

Environment variables required:
    GEMINI_API_KEY
    PINECONE_API_KEY
    PINECONE_INDEX          # existing index name

Optional flags allow you to pick the namespace (defaults to the PDF stem).

Usage:
    python scripts/ingest_policy.py --pdf ./policies/homeowners.pdf --namespace homeowners-2024
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path
from typing import Iterable, List, Sequence

import pdfplumber
from pinecone import Pinecone, ServerlessSpec
from tqdm import tqdm

import google.generativeai as genai


EMBED_MODEL = "text-embedding-004"
DEFAULT_CHUNK_SIZE = 500  # tokens / approx words; heuristic
DEFAULT_CHUNK_OVERLAP = 100


def read_pdf_text(pdf_path: Path) -> str:
    """Extract the text of every page and concatenate."""
    pages: List[str] = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            pages.append(page.extract_text() or "")
    return "\n\n".join(pages)


def chunk_text(text: str, chunk_size: int, overlap: int) -> List[str]:
    """Split text into overlapping chunks."""
    tokens = text.split()
    total = len(tokens)
    chunks: List[str] = []

    start = 0
    while start < total:
        end = min(start + chunk_size, total)
        chunk = " ".join(tokens[start:end]).strip()
        if chunk:
            chunks.append(chunk)
        if end == total:
            break
        start = max(start + chunk_size - overlap, 0)
    return chunks


def ensure_index(pc: Pinecone, index_name: str) -> None:
    """Create the index if it doesn't already exist."""
    existing = {idx["name"] for idx in pc.list_indexes()}
    if index_name in existing:
        return

    pc.create_index(
        name=index_name,
        dimension=2560,  # text-embedding-004 dimensionality
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1"),
    )


def embed_chunks(chunks: Sequence[str]) -> List[List[float]]:
    """Generate embeddings via Gemini."""
    response = genai.embed_content(
        model=EMBED_MODEL,
        content=list(chunks),
    )
    return response["embedding"] if isinstance(response, dict) else response.embeddings


def batch(iterable: Sequence[str], size: int) -> Iterable[Sequence[str]]:
    for i in range(0, len(iterable), size):
        yield iterable[i : i + size]


def ingest(
    pdf_path: Path,
    namespace: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_CHUNK_OVERLAP,
    batch_size: int = 32,
) -> None:
    """Full ingestion pipeline for one PDF."""
    gemini_key = os.getenv("GEMINI_API_KEY")
    pinecone_key = os.getenv("PINECONE_API_KEY")
    index_name = os.getenv("PINECONE_INDEX")

    if not all([gemini_key, pinecone_key, index_name]):
        raise RuntimeError("GEMINI_API_KEY, PINECONE_API_KEY, and PINECONE_INDEX must be set.")

    genai.configure(api_key=gemini_key)

    pc = Pinecone(api_key=pinecone_key)
    ensure_index(pc, index_name)
    index = pc.Index(index_name)

    text = read_pdf_text(pdf_path)
    chunks = chunk_text(text, chunk_size=chunk_size, overlap=overlap)

    if not chunks:
        raise RuntimeError("No text extracted from PDF; aborting ingestion.")

    for chunk_group in tqdm(list(batch(chunks, batch_size)), desc="Ingesting chunks"):
        embeddings = embed_chunks(chunk_group)
        vectors = []
        for idx, (chunk, embedding) in enumerate(zip(chunk_group, embeddings)):
            vectors.append(
                {
                    "id": f"{namespace}-{idx}",
                    "values": embedding,
                    "metadata": {"text": chunk, "source": pdf_path.name},
                }
            )
        index.upsert(vectors=vectors, namespace=namespace)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Ingest a policy PDF into Pinecone.")
    parser.add_argument("--pdf", required=True, type=Path, help="Path to the PDF file.")
    parser.add_argument(
        "--namespace",
        type=str,
        help="Pinecone namespace to use. Defaults to the PDF filename stem.",
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=DEFAULT_CHUNK_SIZE,
        help="Token-ish size of each chunk (default: 500).",
    )
    parser.add_argument(
        "--overlap",
        type=int,
        default=DEFAULT_CHUNK_OVERLAP,
        help="Token-ish overlap between chunks (default: 100).",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=32,
        help="Number of chunks to embed/upload per batch.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    pdf_path: Path = args.pdf
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")
    namespace = args.namespace or pdf_path.stem.lower().replace(" ", "-")
    ingest(
        pdf_path=pdf_path,
        namespace=namespace,
        chunk_size=args.chunk_size,
        overlap=args.overlap,
        batch_size=args.batch_size,
    )
    print(f"Ingestion complete for {pdf_path} into namespace '{namespace}'.")


if __name__ == "__main__":
    main()
