uvicorn app.main:app --reload
source venv/Scripts/activate
python -m tests.test_document_api
uvicorn app.main:app --reload
uvicorn app.main:app --reload --app-dir e:/docs/ai-companion-v2/backend
taskkill /f /im uvicorn.exe
taskkill /f /im python.exe
taskkill /f /im node.exe


.\.venv312\Scripts\Activate.ps1
.venv312\Scripts\activate.bat

the vision for this app is, imagine a fitness coach, dietician/nutritionist, life coach, personal assistant who tracks, helps to make your life easier, better.
