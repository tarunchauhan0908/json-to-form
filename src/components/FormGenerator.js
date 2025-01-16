import React, { useState, useEffect } from 'react';
import { supabase } from './SupabaseClient';
import { Link, Route, Routes, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const FormGenerator = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [formSchema, setFormSchema] = useState(null);
  const [formLink, setFormLink] = useState('');
  const [allForms, setAllForms] = useState([]);
  const [error, setError] = useState('');
  const [fetchedFormData, setFetchedFormData] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState('');

  // Generate Form and Create Shareable Link
  const handleGenerateForm = async () => {
    try {
      const parsedSchema = JSON.parse(jsonInput);
      const uniqueId = uuidv4();
      const generatedLink = `${window.location.origin}/shared-form/${uniqueId}`;

      const { error } = await supabase.from('form_schemas').insert([
        {
          id: uniqueId,
          schema: parsedSchema,
        },
      ]);

      if (error) {
        setError('Error saving form schema. Please try again.');
        return;
      }

      setFormSchema(parsedSchema);
      setFormLink(generatedLink);
      setError('');
    } catch (err) {
      setError('Invalid JSON Schema! Please check your input.');
    }
  };

  // Fetch all forms
  const fetchAllForms = async () => {
    const { data, error } = await supabase.from('form_schemas').select('id, schema');
    if (error) {
      setError('Error fetching forms. Please try again.');
      return;
    }

    const uniqueForms = [];
    const formTitles = new Set();

    data.forEach((form) => {
      if (!formTitles.has(form.schema.title)) {
        uniqueForms.push(form);
        formTitles.add(form.schema.title);
      }
    });

    setAllForms(uniqueForms);
    setError('');
  };

  // Fetch form data based on the title
  const fetchFormDataByTitle = async () => {
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('title, form_data')
        .eq('title', selectedTitle);

      if (error) {
        setError('Error fetching form data. Please try again.');
        return;
      }

      if (data.length === 0) {
        setError('No data found for the selected title.');
        return;
      }

      const consolidatedData = data.map((item) => item.form_data);
      setFetchedFormData(consolidatedData);
      setError('');
    } catch (err) {
      setError('Unexpected error occurred. Please try again.');
    }
  };

  // Convert JSON to CSV and download
  const downloadCSV = () => {
    if (fetchedFormData.length === 0) {
      alert('No data available for download.');
      return;
    }

    const headers = Object.keys(fetchedFormData[0]);
    const rows = fetchedFormData.map((item) =>
      headers.map((header) => `"${item[header] || ''}"`).join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedTitle || 'form_data'}.csv`;
    link.click();
  };

  return (
    <div>
      <h1>Dynamic Form Builder</h1>
      <textarea
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
        rows="10"
        cols="50"
        placeholder="Enter JSON schema here"
      ></textarea>
      <button onClick={handleGenerateForm}>Generate Form</button>
      <button onClick={fetchAllForms}>Fetch All Forms</button>

      <select onChange={(e) => setSelectedTitle(e.target.value)} value={selectedTitle}>
        <option value="">Select Form Title</option>
        {allForms.map((form) => (
          <option key={form.id} value={form.schema.title}>
            {form.schema.title}
          </option>
        ))}
      </select>
      <button onClick={fetchFormDataByTitle}>Fetch Form Data</button>
      {/* <button onClick={downloadCSV}>Download CSV</button> */}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {fetchedFormData.length > 0 && (
        <div>
          <h3>Fetched Form Data</h3>
          <table border="1">
            <thead>
              <tr>
                {Object.keys(fetchedFormData[0]).map((field, index) => (
                  <th key={index}>{field}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fetchedFormData.map((formData, index) => (
                <tr key={index}>
                  {Object.entries(formData).map(([field, value], idx) => (
                    <td key={idx}>{value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button onClick={downloadCSV}>Download CSV</button>


      {formSchema && (
        <div>
          <h2>{formSchema.title}</h2>
          <p>
            Shareable Link: <a href={formLink}>{formLink}</a>
          </p>
        </div>
      )}

      {allForms.length > 0 && (
        <div>
          <h3>All Forms</h3>
          <ul>
            {allForms.map((form) => (
              <li key={form.id}>
                <Link to={`/shared-form/${form.id}`}>{form.schema.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const SharedForm = () => {
  const { id } = useParams();
  const [formSchema, setFormSchema] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchForm = async () => {
      const { data, error } = await supabase.from('form_schemas').select('schema').eq('id', id).single();

      if (error) {
        setError('Error fetching form.');
        return;
      }

      setFormSchema(data.schema);
    };

    fetchForm();
  }, [id]);

  const handleInputChange = (label, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [label]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('forms').insert([
        { title: formSchema.title, form_data: formData },
      ]);

      if (error) {
        alert('Error saving data.');
        return;
      }

      alert('Form submitted successfully!');
      setFormData({});
    } catch (err) {
      alert('Unexpected error occurred.');
    }
  };

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {formSchema ? (
        <form onSubmit={handleSubmit}>
          <h2>{formSchema.title}</h2>
          {formSchema.fields.map((field, idx) => (
            <div key={idx}>
              <label>{field.label}</label>
              {field.type === 'radio' || field.type === 'checkbox' ? (
                field.options.map((option, optIdx) => (
                  <div key={optIdx}>
                    <input
                      type={field.type}
                      name={field.label}
                      value={option}
                      onChange={(e) => handleInputChange(field.label, option)}
                    />
                    <label>{option}</label>
                  </div>
                ))
              ) : (
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  required={field.required}
                  onChange={(e) => handleInputChange(field.label, e.target.value)}
                />
              )}
            </div>
          ))}
          <button type="submit">Submit</button>
        </form>
      ) : (
        <p>Loading form...</p>
      )}
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<FormGenerator />} />
      <Route path="/shared-form/:id" element={<SharedForm />} />
    </Routes>
  );
};

export default App;
