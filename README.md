
# 📊 Data Sourcing & Visualization Platform

A full-stack data sourcing and visualization application where users can create tasks to fetch car sales data from multiple sources (JSON, CSV, API), store the unified data, and view interactive analytics dashboards.

---

## 🌟 Features

- ✅ Create data fetch tasks from:
  - JSON (local or remote)
  - CSV (uploaded or stored)
  - API (live source)
- 🕒 Task status lifecycle: `Pending → In Progress → Completed`
- 📊 Interactive visualizations (Line, Bar, Pie, Heatmap)
- 🧠 Filter analytics by Year, Month, Company, Model, and Source
- 🔁 Polling for real-time task status
- 🔐 User Authentication (Sign In / Register)
- ⚡ Redis-backed queue manager for async task processing
- 🧪 Sample data provided for testing

---

## 🧱 Architecture Flow

```text

```

📸 _Insert screenshot of architecture flow diagram here_

---

## 🔑 Authentication

- Basic username/password auth
- Sign In / Register screens with protected views
- Session token stored on frontend

📸 _Insert login screenshot here (e.g. `screenshots/login-page.png`)_

---

## 🖼️ Screenshots

### Task List View
📸 _Insert screenshot here (e.g. `screenshots/task-dashboard.png`)_

---

## 🗂 File Structure

```
📦 Data-Sourcing-and-Visualization
├── 📁 backend
│   ├── 📄 app.py
│   ├── 📄 models.py
│   ├── 📄 queue_manager.py
│   ├── 📄 auth_simple.py
│   ├── 📄 requirements.txt
│   ├── 📄 sales_data.db
│   ├── 📁 data_sources
│   │   ├── 📄 api_source.py
│   │   ├── 📄 csv_source.py
│   │   └── 📄 json_source.py
│   ├── 📁 Redis
│   │   ├── 📄 redis_cache_decorator.py
│   │   ├── 📄 redis_connection.py
│   │   └── 📄 redis_diagnose.py
│   └── 📁 tests
│       ├── 📄 __init__.py
│       ├── 📄 test_auth.py
│       └── 📄 conftest.py
│
├── 📁 data
│   ├── 📄 sample_data_a.json
│   └── 📄 sample_data_b.csv
│
├── 📁 frontend
│   ├── 📄 package.json
│   ├── 📁 node_modules
│   ├── 📁 public
│   │   └── 📄 index.html
│   └── 📁 src
│       ├── 📄 App.js
│       ├── 📄 index.js
│       ├── 📁 components
│       │   ├── 📄 TaskCreator.js
│       │   ├── 📄 TaskDetails.js
│       │   ├── 📄 TaskList.js
│       │   ├── 📄 Visualizations.js
│       │   ├── 📁 auth
│       │   │   ├── 📄 Login.js
│       │   │   └── 📄 Register.js
│       └── 📁 styles
│           ├── 📄 TaskCreator.css
│           ├── 📄 TaskDetails.css
│           ├── 📄 TaskList.css
│           └── 📄 Visualizations.css
│
├── 📄 Redis-setup.sh
```

---

## 💾 Sample Data

### JSON

```json
{
  "company": "Toyota",
  "car_model": "Camry",
  "sale_date": "2023-01-15T12:30:00",
  "price": 28000
}
```

### CSV

```csv
id,company,car_model,sale_date,price
1,Honda,Civic,2023-04-10,26000
```

---

## 📊 Visualizations

- 📈 Line Chart – Sales volume over time
- 📊 Bar Chart – Company-wise car sales
- 🥧 Pie Chart – Source distribution
- 🔥 Heatmap – Monthly trends

---

## ⚙️ Setup Instructions

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Queue (with Redis)
```bash
redis-server  # or run Redis on Docker
rq worker     # in backend/ directory
```

---

## 🧠 Future Improvements

- ⬇ Export visualized data to CSV
- ☁️ Deploy to Vercel/Render with CI/CD
- 👥 Add user roles & task history per user
- 🌍 Enable upload of custom CSV/JSON sources

---

## 📬 Contact

If you'd like to discuss this project or have questions, feel free to reach out via GitHub Issues or [your.email@example.com].

---

