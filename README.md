# 🚀 Data Sourcing and Visualization App

A full-stack data pipeline application that enables users to source, process, and visualize automotive sales data from multiple sources (JSON, CSV, and API). Built with React, Flask, D3.js, and SQLite — designed for the Full-Stack Engineer role screening task.

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

![Screenshot 2025-04-02 at 2 58 32 AM](https://github.com/user-attachments/assets/92f7c8cd-e276-48a3-8f8a-75355ba75b45)


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

### Setup

```bash
Backend


cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate
pip install -r requirements.txt
python app.py
Runs on: http://localhost:8000

Frontend

cd frontend
npm install
npm start
Runs on: http://localhost:3000



