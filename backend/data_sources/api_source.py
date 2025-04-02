# backend/data_sources/api_source.py
import requests
import logging
from datetime import datetime
from models import SalesData

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class APIDataSource:
    def __init__(self, api_url=None):
        self.api_url = api_url or "https://my-api-endpoint.com/sales"
        
    def get_data(self, filters=None):
        """
        Fetch data from API source with applied filters
        
        Args:
            filters (dict): Filters to apply to the data
                - start_date (str): Start date in ISO format
                - end_date (str): End date in ISO format
                - companies (list): List of companies to include
                - models (list): List of car models to include
                
        Returns:
            list: Filtered data records
        """
        if filters is None:
            filters = {}
            
        try:
            # For demonstration, we'll simulate API data
            # In a real application, you would make a request to the API
            # response = requests.get(self.api_url, params=filters)
            # api_data = response.json()
            
            # Simulate API response for demo purposes
            api_data = [
                {
                    "company": "Tesla",
                    "car_model": "Model 3",
                    "sale_date": "2024-01-15T14:30:00",
                    "price": 45000
                },
                {
                    "company": "Tesla",
                    "car_model": "Model Y",
                    "sale_date": "2024-02-20T10:15:00",
                    "price": 55000
                },
                {
                    "company": "Nissan",
                    "car_model": "Leaf",
                    "sale_date": "2024-03-05T16:45:00",
                    "price": 32000
                },
                {
                    "company": "BMW",
                    "car_model": "i4",
                    "sale_date": "2024-03-18T09:30:00",
                    "price": 65000
                },
                {
                    "company": "Tesla",
                    "car_model": "Model S",
                    "sale_date": "2024-04-10T11:20:00",
                    "price": 85000
                }
            ]
            
            # Apply filters
            filtered_data = self._apply_filters(api_data, filters)
            
            logger.info(f"Retrieved {len(filtered_data)} records from API source")
            return filtered_data
            
        except Exception as e:
            logger.error(f"Error retrieving data from API source: {str(e)}")
            return []
    
    def _apply_filters(self, data, filters):
        filtered_data = []
        
        start_date = filters.get('start_date')
        end_date = filters.get('end_date')
        companies = filters.get('companies', [])
        models = filters.get('models', [])
        
        start_date = datetime.fromisoformat(start_date) if start_date else None
        end_date = datetime.fromisoformat(end_date) if end_date else None
        
        for record in data:
            # Parse sale date
            sale_date = None
            if 'sale_date' in record:
                try:
                    sale_date = datetime.fromisoformat(record['sale_date'])
                except (ValueError, TypeError):
                    continue
            
            # Apply date filters
            if start_date and (not sale_date or sale_date < start_date):
                continue
                
            if end_date and (not sale_date or sale_date > end_date):
                continue
                
            # Apply company filter
            if companies and record.get('company') not in companies:
                continue
                
            # Apply model filter
            if models and record.get('car_model') not in models:
                continue
                
            filtered_data.append(record)
            
        return filtered_data
        
    def save_data(self, session, task_id, data):
        """
        Save data to the database
        
        Args:
            session: SQLAlchemy session
            task_id (int): Task ID
            data (list): Data records to save
        """
        for record in data:
            try:
                sale_date = None
                if 'sale_date' in record:
                    try:
                        sale_date = datetime.fromisoformat(record['sale_date'])
                    except (ValueError, TypeError):
                        sale_date = None
                
                sales_data = SalesData(
                    task_id=task_id,
                    source='source_c',  # New source identifier
                    company=record.get('company'),
                    car_model=record.get('car_model'),
                    sale_date=sale_date,
                    price=float(record.get('price', 0)),
                    year=sale_date.year if sale_date else None,
                    month=sale_date.month if sale_date else None
                )
                
                session.add(sales_data)
            except Exception as e:
                logger.error(f"Error saving record to database: {str(e)}")
                
        session.commit()
        logger.info(f"Saved {len(data)} records from API source to database")