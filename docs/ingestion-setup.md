# Pinecone Ingestion Environment

This repository now includes a small Python toolchain for loading policy PDFs into Pinecone. Follow the steps below the first time you set it up (and revisit them whenever you pick up a new machine).

## 1. Create a Python virtual environment

```bash
python -m venv .venv
source .venv/bin/activate      # PowerShell: .\.venv\Scripts\Activate.ps1
```

Keep the virtual environment out of Git (it’s already ignored).

## 2. Install dependencies

```bash
pip install --upgrade pip
pip install -r requirements-ingest.txt
```

Packages installed:

- `pdfplumber` – extracts text from PDFs
- `google-generativeai` – Gemini embeddings
- `pinecone-client` – Pinecone vector DB
- `tqdm` – simple progress bar

## 3. Configure environment variables

Set the following in your shell before running the script (or add them to a `.env` file and source it):

```bash
export GEMINI_API_KEY=...
export PINECONE_API_KEY=...
export PINECONE_INDEX=policy-assistant
```

`PINECONE_INDEX` can point to an existing index. The ingestion script will auto-create it (serverless, cosine metric) if it doesn’t exist.

## 4. Ingest a policy PDF

```bash
python scripts/ingest_policy.py --pdf ./policies/homeowners.pdf --namespace homeowners-2025
```

- `--namespace` controls the Pinecone namespace. Omit it to reuse the PDF filename stem.
- Adjust chunk/overlap/batch sizes with flags if needed.

## 5. Updating the runtime function

Once the embeddings are in Pinecone, update your Netlify function to:

1. Embed the user query with the same Gemini embedding model.
2. Query Pinecone for the top-k chunks in the correct namespace.
3. Build an augmented prompt for Gemini using those chunks.

The frontend continues to call `/.netlify/functions/chat`; only the function’s internals change.

## 6. Future PDFs

Drop each PDF into a shared folder (e.g., `policies/`), run the ingestion command with a unique namespace, and you’re set. The embeddings live in Pinecone—no sensitive text ships to the browser or lives in the repo anymore.
