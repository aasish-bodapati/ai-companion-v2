uvicorn app.main:app --reload
source venv/Scripts/activate
python -m tests.test_document_api
uvicorn main:app --reload
uvicorn app.main:app --reload --app-dir e:/docs/ai-companion-v2/backend
taskkill /f /im uvicorn.exe
taskkill /f /im python.exe