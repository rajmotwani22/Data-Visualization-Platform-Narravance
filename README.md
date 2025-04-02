# 🚀 Data Sourcing and Visualization App

A full-stack data pipeline application that enables users to source, process, and visualize automotive sales data from multiple sources (JSON, CSV, and API). Built with React, Flask, D3.js, and SQLite — designed for the Full-Stack Engineer role screening task at [Narravance](https://tinyurl.com/nvc-fs-jd).

---

## 🧩 Overview

This web application allows users to:
- 📝 **Create data tasks** with filters (date range, companies, models)
- 📦 **Pull data** from multiple sources and queue jobs
- 📊 **Visualize results** with dynamic, filterable D3.js charts
- 📁 **Review a unified dataset** from JSON, CSV, and API inputs

---

## ⚙️ Tech Stack

**Frontend**
- React
- React Router DOM
- Axios
- D3.js
- CSS Modules

**Backend**
- Python + Flask
- SQLAlchemy ORM
- SQLite Database
- In-Memory Job Queue (Python's `queue` module)

---

## 🗂 Project Structure

Data-Sourcing-and-Visualization-main-2/
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── abc.js
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js
│   │   └── index.js
│   └── node_modules/
│       └── ...
│
├── backend/
│   ├── app.py                # Main FastAPI or Flask app
│   ├── models.py             # Data models
│   ├── queue_manager.py      # Handles task queueing
│   ├── sales_data.db         # SQLite database file
│   ├── requirements.txt      # Python dependencies
│   ├── data_sources/
│   │   ├── csv_source.py
│   │   ├── api_source.py
│   │   └── json_source.py
│   └── __pycache__/          # Compiled Python files
│
├── data/
│   ├── sample_data_a.json
│   └── sample_data_b.csv



---

## 🧪 How It Works

1. **User submits a task** from the frontend with custom filters
2. **Task enters a queue** (`pending` → `in_progress` → `completed`)
3. **Data is pulled** from selected sources and stored in the database
4. **Visualizations are rendered** (charts + tables) based on results

---

## 🧠 Features

- ✅ Task-based data sourcing
- ✅ Multi-source merging (JSON, CSV, API)
- ✅ Simulated job processing queue
- ✅ SQLite-backed persistence
- ✅ D3-powered charts (bar, line)
- ✅ Filtering by year, month, company, model, and source
- ✅ Modular React components & clean CSS

---

## 🧰 Getting Started

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate
pip install -r requirements.txt
python app.py
Runs on: http://localhost:8000

### Frontend Setup

cd frontend
npm install
npm start
Runs on: http://localhost:3000



