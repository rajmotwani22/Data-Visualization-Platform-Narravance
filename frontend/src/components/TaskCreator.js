import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/TaskCreator.css';

const API_BASE_URL = 'http://localhost:8000/api';

const TaskCreator = () => {
  const navigate = useNavigate();
  
  // State for form data
  const [formData, setFormData] = useState({
    sourceA: {
      start_date: '',
      end_date: '',
      companies: [],
      models: []
    },
    sourceB: {
      start_date: '',
      end_date: '',
      companies: [],
      models: []
    },
    sourceC: {
      start_date: '',
      end_date: '',
      companies: [],
      models: []
    }
  });
  
  // State for available options
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  
  // State for loading indicator
  const [loading, setLoading] = useState(false);
  
  // State for preview data
  const [previewVisible, setPreviewVisible] = useState({
    sourceA: false,
    sourceB: false,
    sourceC: false
  });
  const [previewData, setPreviewData] = useState({
    sourceA: [],
    sourceB: [],
    sourceC: []
  });
  const [previewLoading, setPreviewLoading] = useState({
    sourceA: false,
    sourceB: false,
    sourceC: false
  });
  
  // Function to get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };
  
  // Create authenticated API instance
  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  };
  
  // Fetch available companies and models
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const authHeaders = getAuthHeaders();
        const [companiesRes, modelsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/companies`, authHeaders),
          axios.get(`${API_BASE_URL}/models`, authHeaders)
        ]);
        
        setAvailableCompanies(companiesRes.data);
        setAvailableModels(modelsRes.data);
      } catch (error) {
        console.error('Error fetching options:', error);
        
        if (error.response && error.response.status === 401) {
          alert('Your session has expired. Please log in again.');
          navigate('/login');
          return;
        }
        
        // Use sample data if API is not available yet
        setAvailableCompanies(['Toyota', 'Honda', 'Ford', 'Chevrolet']);
        setAvailableModels(['Camry', 'Corolla', 'Accord', 'Civic', 'Mustang', 'Explorer', 'Malibu', 'Equinox']);
      }
    };
    
    fetchOptions();
  }, [navigate]);
  
  // Handle input changes
  const handleInputChange = (source, field, value) => {
    setFormData(prev => ({
      ...prev,
      [source]: {
        ...prev[source],
        [field]: value
      }
    }));
  };
  
  // Handle tag selection (replaces checkbox functionality)
  const handleTagSelection = (source, field, item) => {
    setFormData(prev => {
      const currentItems = prev[source][field];
      const newItems = currentItems.includes(item)
        ? currentItems.filter(i => i !== item)
        : [...currentItems, item];
        
      return {
        ...prev,
        [source]: {
          ...prev[source],
          [field]: newItems
        }
      };
    });
  };
  
  // Handle preview data
  const handlePreviewData = (source) => {
    const sourceKey = {
      'JSON': 'sourceA',
      'CSV': 'sourceB',
      'API': 'sourceC'
    }[source];
    
    // Toggle preview visibility
    setPreviewVisible(prev => ({
      ...prev,
      [sourceKey]: !prev[sourceKey]
    }));
    
    // If we're closing the preview, return early
    if (previewVisible[sourceKey]) {
      return;
    }
    
    // Set loading state for this preview
    setPreviewLoading(prev => ({
      ...prev,
      [sourceKey]: true
    }));
    
    // Simulate loading delay
    setTimeout(() => {
      let sampleData;
      
      if (source === 'JSON') {
        // JSON sample data
        sampleData = [
          {"company": "Toyota", "car_model": "Camry", "sale_date": "2023-01-05T14:21:49", "price": 29400},
          {"company": "Toyota", "car_model": "Corolla", "sale_date": "2023-01-05T22:00:17", "price": 24800},
          {"company": "Toyota", "car_model": "RAV4", "sale_date": "2023-01-06T13:36:34", "price": 28300},
          {"company": "Honda", "car_model": "Civic", "sale_date": "2023-01-06T13:51:36", "price": 22200},
          {"company": "Toyota", "car_model": "Corolla", "sale_date": "2023-01-06T21:52:09", "price": 21300}
        ];
      } else if (source === 'CSV') {
        // CSV sample data
        sampleData = [
          {"company": "Toyota", "car_model": "Camry", "sale_date": "2023-01-20", "price": 29000},
          {"company": "Honda", "car_model": "Accord", "sale_date": "2023-02-15", "price": 28500},
          {"company": "Chevrolet", "car_model": "Malibu", "sale_date": "2023-03-10", "price": 25000},
          {"company": "Toyota", "car_model": "Corolla", "sale_date": "2023-04-25", "price": 24000},
          {"company": "Honda", "car_model": "Civic", "sale_date": "2023-05-18", "price": 23500}
        ];
      } else {
        // API sample data
        sampleData = [
          {"company": "Tesla", "car_model": "Model Y", "sale_date": "2023-06-15", "price": 52000},
          {"company": "Tesla", "car_model": "Model 3", "sale_date": "2023-06-20", "price": 45000},
          {"company": "Nissan", "car_model": "Leaf", "sale_date": "2023-06-25", "price": 32000},
          {"company": "BMW", "car_model": "i4", "sale_date": "2023-07-01", "price": 58000},
          {"company": "Ford", "car_model": "Mustang Mach-E", "sale_date": "2023-07-05", "price": 48000}
        ];
      }
      
      // Set the preview data
      setPreviewData(prev => ({
        ...prev,
        [sourceKey]: sampleData
      }));
      
      // Reset loading state
      setPreviewLoading(prev => ({
        ...prev,
        [sourceKey]: false
      }));
    }, 500); // Simulate loading delay
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const authHeaders = getAuthHeaders();
      const response = await axios.post(`${API_BASE_URL}/tasks`, {
        source_a: {
          start_date: formData.sourceA.start_date,
          end_date: formData.sourceA.end_date,
          companies: formData.sourceA.companies.length > 0 ? formData.sourceA.companies : undefined,
          models: formData.sourceA.models.length > 0 ? formData.sourceA.models : undefined
        },
        source_b: {
          start_date: formData.sourceB.start_date,
          end_date: formData.sourceB.end_date,
          companies: formData.sourceB.companies.length > 0 ? formData.sourceB.companies : undefined,
          models: formData.sourceB.models.length > 0 ? formData.sourceB.models : undefined
        },
        source_c: {
          start_date: formData.sourceC.start_date,
          end_date: formData.sourceC.end_date,
          companies: formData.sourceC.companies.length > 0 ? formData.sourceC.companies : undefined,
          models: formData.sourceC.models.length > 0 ? formData.sourceC.models : undefined
        }
      }, authHeaders);
      
      // Redirect to task details page
      navigate(`/tasks/${response.data.id}`);
    } catch (error) {
      console.error('Error creating task:', error);
      
      if (error.response && error.response.status === 401) {
        alert('Your session has expired. Please log in again.');
        navigate('/login');
        return;
      }
      
      alert('Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Component for tag selection
  const TagSelector = ({ items, selectedItems, onChange }) => {
    return (
      <div className="tag-selector">
        {items.map(item => (
          <div
            key={item}
            className={`tag-item ${selectedItems.includes(item) ? 'active' : ''}`}
            onClick={() => onChange(item)}
          >
            {item}
          </div>
        ))}
      </div>
    );
  };
  
  // Component for data preview
  const DataPreview = ({ data, loading }) => {
    if (loading) {
      return (
        <div className="data-preview-loading">
          <div className="spinner"></div>
          <p>Loading preview data...</p>
        </div>
      );
    }
    
    if (!data || data.length === 0) {
      return <div className="no-preview-data">No preview data available</div>;
    }
    
    // Get column headers from the first data item
    const columns = Object.keys(data[0]);
    
    // Format cell value based on column name
    const formatCellValue = (value, column) => {
      if (value === null || value === undefined) {
        return '—';
      }
      
      // Handle date formatting for sale_date column
      if (column === 'sale_date' && typeof value === 'string') {
        try {
          return new Date(value).toLocaleString();
        } catch {
          return value;
        }
      }
      
      // Handle price formatting
      if (column === 'price' && !isNaN(value)) {
        return value.toLocaleString();
      }
      
      // Return string value for other columns
      return String(value);
    };
    
    return (
      <div className="data-preview">
        <table className="preview-table">
          <thead>
            <tr>
              {columns.map(column => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map(column => (
                  <td key={`${rowIndex}-${column}`}>
                    {formatCellValue(row[column], column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  return (
    <div className="task-creator">
      <h2>Create New Data Task</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="sources-container">
          {/* Source A Configuration */}
          <div className="source-config">
            <h3>
              <span className="source-icon">📄</span> Source A (JSON Data)
            </h3>
            
            <div className="form-group">
              <label>Date Range:</label>
              <div className="date-inputs">
                <input
                  type="date"
                  value={formData.sourceA.start_date}
                  onChange={(e) => handleInputChange('sourceA', 'start_date', e.target.value)}
                  placeholder="Start Date"
                />
                <span>to</span>
                <input
                  type="date"
                  value={formData.sourceA.end_date}
                  onChange={(e) => handleInputChange('sourceA', 'end_date', e.target.value)}
                  placeholder="End Date"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>
                Companies:
                {formData.sourceA.companies.length > 0 && 
                  <span className="selection-count">{formData.sourceA.companies.length}</span>
                }
              </label>
              {availableCompanies.length === 0 ? (
                <div className="skeleton-tags">
                  <div className="skeleton-tag"></div>
                  <div className="skeleton-tag"></div>
                  <div className="skeleton-tag"></div>
                  <div className="skeleton-tag"></div>
                </div>
              ) : (
                <TagSelector 
                  items={availableCompanies} 
                  selectedItems={formData.sourceA.companies}
                  onChange={(item) => handleTagSelection('sourceA', 'companies', item)}
                />
              )}
            </div>
            
            <div className="form-group">
              <label>
                Car Models:
                {formData.sourceA.models.length > 0 && 
                  <span className="selection-count">{formData.sourceA.models.length}</span>
                }
              </label>
              {availableModels.length === 0 ? (
                <div className="skeleton-tags">
                  <div className="skeleton-tag"></div>
                  <div className="skeleton-tag"></div>
                  <div className="skeleton-tag"></div>
                  <div className="skeleton-tag"></div>
                </div>
              ) : (
                <TagSelector 
                  items={availableModels} 
                  selectedItems={formData.sourceA.models}
                  onChange={(item) => handleTagSelection('sourceA', 'models', item)}
                />
              )}
            </div>
            
            <button 
              type="button" 
              className={`preview-button ${previewVisible.sourceA ? 'active' : ''}`}
              onClick={() => handlePreviewData('JSON')}
            >
              {previewVisible.sourceA ? 'Hide Preview' : 'Preview Data'}
            </button>
            
            {previewVisible.sourceA && 
              <DataPreview 
                data={previewData.sourceA} 
                loading={previewLoading.sourceA} 
              />
            }
          </div>
          
          {/* Source B Configuration */}
          <div className="source-config">
            <h3>
              <span className="source-icon">📊</span> Source B (CSV Data)
            </h3>
            
            <div className="form-group">
              <label>Date Range:</label>
              <div className="date-inputs">
                <input
                  type="date"
                  value={formData.sourceB.start_date}
                  onChange={(e) => handleInputChange('sourceB', 'start_date', e.target.value)}
                  placeholder="Start Date"
                />
                <span>to</span>
                <input
                  type="date"
                  value={formData.sourceB.end_date}
                  onChange={(e) => handleInputChange('sourceB', 'end_date', e.target.value)}
                  placeholder="End Date"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>
                Companies:
                {formData.sourceB.companies.length > 0 && 
                  <span className="selection-count">{formData.sourceB.companies.length}</span>
                }
              </label>
              {availableCompanies.length === 0 ? (
                <div className="skeleton-tags">
                  <div className="skeleton-tag"></div>
                  <div className="skeleton-tag"></div>
                  <div className="skeleton-tag"></div>
                  <div className="skeleton-tag"></div>
                </div>
              ) : (
                <TagSelector 
                  items={availableCompanies} 
                  selectedItems={formData.sourceB.companies}
                  onChange={(item) => handleTagSelection('sourceB', 'companies', item)}
                />
              )}
            </div>
            
            <div className="form-group">
              <label>
                Car Models:
                {formData.sourceB.models.length > 0 && 
                  <span className="selection-count">{formData.sourceB.models.length}</span>
                }
              </label>
              {availableModels.length === 0 ? (
                <div className="skeleton-tags">
                  <div className="skeleton-tag"></div>
                  <div className="skeleton-tag"></div>
                  <div className="skeleton-tag"></div>
                  <div className="skeleton-tag"></div>
                </div>
              ) : (
                <TagSelector 
                  items={availableModels} 
                  selectedItems={formData.sourceB.models}
                  onChange={(item) => handleTagSelection('sourceB', 'models', item)}
                />
              )}
            </div>
            
            <button 
              type="button" 
              className={`preview-button ${previewVisible.sourceB ? 'active' : ''}`}
              onClick={() => handlePreviewData('CSV')}
            >
              {previewVisible.sourceB ? 'Hide Preview' : 'Preview Data'}
            </button>
            
            {previewVisible.sourceB && 
              <DataPreview 
                data={previewData.sourceB} 
                loading={previewLoading.sourceB} 
              />
            }
          </div>

          {/* Source C Configuration */}
          <div className="source-config">
            <h3>
              <span className="source-icon">🔌</span> Source C (API Data)
            </h3>
            
            <div className="form-group">
              <label>Date Range:</label>
              <div className="date-inputs">
                <input
                  type="date"
                  value={formData.sourceC.start_date}
                  onChange={(e) => handleInputChange('sourceC', 'start_date', e.target.value)}
                  placeholder="Start Date"
                />
                <span>to</span>
                <input
                  type="date"
                  value={formData.sourceC.end_date}
                  onChange={(e) => handleInputChange('sourceC', 'end_date', e.target.value)}
                  placeholder="End Date"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>
                Companies:
                {formData.sourceC.companies.length > 0 && 
                  <span className="selection-count">{formData.sourceC.companies.length}</span>
                }
              </label>
              {availableCompanies.length === 0 ? (
                <div className="skeleton-tags">
                  <div className="skeleton-tag"></div>
                  <div className="skeleton-tag"></div>
                  <div className="skeleton-tag"></div>
                  <div className="skeleton-tag"></div>
                </div>
              ) : (
                <TagSelector 
                  items={availableCompanies} 
                  selectedItems={formData.sourceC.companies}
                  onChange={(item) => handleTagSelection('sourceC', 'companies', item)}
                />
              )}
            </div>
            
            <div className="form-group">
              <label>
                Car Models:
                {formData.sourceC.models.length > 0 && 
                  <span className="selection-count">{formData.sourceC.models.length}</span>
                }
              </label>
              {availableModels.length === 0 ? (
                <div className="skeleton-tags">
                  <div className="skeleton-tag"></div>
                  <div className="skeleton-tag"></div>
                  <div className="skeleton-tag"></div>
                  <div className="skeleton-tag"></div>
                </div>
              ) : (
                <TagSelector 
                  items={availableModels} 
                  selectedItems={formData.sourceC.models}
                  onChange={(item) => handleTagSelection('sourceC', 'models', item)}
                />
              )}
            </div>
            
            <button 
              type="button" 
              className={`preview-button ${previewVisible.sourceC ? 'active' : ''}`}
              onClick={() => handlePreviewData('API')}
            >
              {previewVisible.sourceC ? 'Hide Preview' : 'Preview Data'}
            </button>
            
            {previewVisible.sourceC && 
              <DataPreview 
                data={previewData.sourceC} 
                loading={previewLoading.sourceC} 
              />
            }
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? (
              <><span className="spinner"></span>Creating Task...</>
            ) : (
              'Create Task'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskCreator;