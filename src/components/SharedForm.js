import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from './SupabaseClient';

const SharedForm = () => {
  const { id } = useParams(); // Get the unique ID from the URL
  const [formSchema, setFormSchema] = useState(null);
  const [formData, setFormData] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const fetchFormSchema = async () => {
      const { data, error } = await supabase
        .from('form_schemas')
        .select('schema')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching form schema:', error.message);
        alert('Error loading form. Please try again.');
        return;
      }

      setFormSchema(data.schema);
    };

    fetchFormSchema();
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted Form Data:', formData);
    setIsSubmitted(true);
  };

  const handleInputChange = (label, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [label]: value,
    }));
  };

  const renderField = (field) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <input
            type={field.type}
            placeholder={field.placeholder}
            required={field.required}
            onChange={(e) => handleInputChange(field.label, e.target.value)}
          />
        );
      case 'radio':
        return field.options.map((option, idx) => (
          <label key={idx}>
            <input
              type="radio"
              name={field.label}
              value={option}
              onChange={(e) => handleInputChange(field.label, e.target.value)}
            />
            {option}
          </label>
        ));
      case 'checkbox':
        return field.options.map((option, idx) => (
          <label key={idx}>
            <input
              type="checkbox"
              value={option}
              onChange={(e) => {
                const checkedOptions = formData[field.label] || [];
                if (e.target.checked) {
                  handleInputChange(field.label, [...checkedOptions, option]);
                } else {
                  handleInputChange(
                    field.label,
                    checkedOptions.filter((o) => o !== option)
                  );
                }
              }}
            />
            {option}
          </label>
        ));
      default:
        return (
          <input
            type="text"
            placeholder={field.placeholder}
            required={field.required}
            onChange={(e) => handleInputChange(field.label, e.target.value)}
          />
        );
    }
  };

  if (!formSchema) return <p>Loading form...</p>;
  if (isSubmitted) return <p>Thank you for submitting the form!</p>;

  return (
    <div>
      <h1>{formSchema.title}</h1>
      <form onSubmit={handleSubmit}>
        {formSchema.fields.map((field, idx) => (
          <div key={idx}>
            <label>{field.label}</label>
            {renderField(field)}
          </div>
        ))}
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default SharedForm;
