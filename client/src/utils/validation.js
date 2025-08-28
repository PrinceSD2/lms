// Validation utility functions

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  // Accepts various phone formats for India, Philippines, Zimbabwe
  const phoneRegex = /^[\+]?[1-9][\d]{8,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)\.]/g, ''));
};

export const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

export const validateRequired = (value) => {
  return value && value.toString().trim().length > 0;
};

export const validateMaxLength = (value, maxLength) => {
  return !value || value.toString().length <= maxLength;
};

export const validateMinLength = (value, minLength) => {
  return !value || value.toString().length >= minLength;
};

export const validatePincode = (pincode, country) => {
  if (!pincode) return true; // Optional field
  
  switch (country.toLowerCase()) {
    case 'india':
      // Indian pincode: 6 digits
      return /^[1-9][0-9]{5}$/.test(pincode);
    case 'philippines':
      // Philippines postal code: 4 digits
      return /^[0-9]{4}$/.test(pincode);
    case 'zimbabwe':
      // Zimbabwe postal code: varies, but generally alphanumeric
      return /^[A-Za-z0-9\s]{3,10}$/.test(pincode);
    default:
      // Generic validation for other countries
      return /^[A-Za-z0-9\s\-]{3,10}$/.test(pincode);
  }
};

export const validateIndianStates = (state) => {
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Lakshadweep', 'Puducherry', 'Andaman and Nicobar Islands'
  ];
  return !state || indianStates.some(s => s.toLowerCase() === state.toLowerCase());
};

export const validatePhilippinesProvinces = (state) => {
  const philippinesProvinces = [
    'Abra', 'Agusan del Norte', 'Agusan del Sur', 'Aklan', 'Albay', 'Antique',
    'Apayao', 'Aurora', 'Basilan', 'Bataan', 'Batanes', 'Batangas', 'Benguet',
    'Biliran', 'Bohol', 'Bukidnon', 'Bulacan', 'Cagayan', 'Camarines Norte',
    'Camarines Sur', 'Camiguin', 'Capiz', 'Catanduanes', 'Cavite', 'Cebu',
    'Cotabato', 'Davao de Oro', 'Davao del Norte', 'Davao del Sur', 'Davao Occidental',
    'Davao Oriental', 'Dinagat Islands', 'Eastern Samar', 'Guimaras', 'Ifugao',
    'Ilocos Norte', 'Ilocos Sur', 'Iloilo', 'Isabela', 'Kalinga', 'La Union',
    'Laguna', 'Lanao del Norte', 'Lanao del Sur', 'Leyte', 'Maguindanao',
    'Marinduque', 'Masbate', 'Misamis Occidental', 'Misamis Oriental',
    'Mountain Province', 'Negros Occidental', 'Negros Oriental', 'Northern Samar',
    'Nueva Ecija', 'Nueva Vizcaya', 'Occidental Mindoro', 'Oriental Mindoro',
    'Palawan', 'Pampanga', 'Pangasinan', 'Quezon', 'Quirino', 'Rizal', 'Romblon',
    'Samar', 'Sarangani', 'Siquijor', 'Sorsogon', 'South Cotabato', 'Southern Leyte',
    'Sultan Kudarat', 'Sulu', 'Surigao del Norte', 'Surigao del Sur', 'Tarlac',
    'Tawi-Tawi', 'Zambales', 'Zamboanga del Norte', 'Zamboanga del Sur', 'Zamboanga Sibugay'
  ];
  return !state || philippinesProvinces.some(p => p.toLowerCase() === state.toLowerCase());
};

export const validateZimbabweProvinces = (state) => {
  const zimbabweProvinces = [
    'Bulawayo', 'Harare', 'Manicaland', 'Mashonaland Central', 'Mashonaland East',
    'Mashonaland West', 'Masvingo', 'Matabeleland North', 'Matabeleland South', 'Midlands'
  ];
  return !state || zimbabweProvinces.some(p => p.toLowerCase() === state.toLowerCase());
};

export const validateStateByCountry = (state, country) => {
  if (!state) return true; // Optional field
  
  switch (country.toLowerCase()) {
    case 'india':
      return validateIndianStates(state);
    case 'philippines':
      return validatePhilippinesProvinces(state);
    case 'zimbabwe':
      return validateZimbabweProvinces(state);
    default:
      return true; // Allow any state for other countries
  }
};

export const validateOrganizationForm = (formData) => {
  const errors = {};

  // Required fields
  if (!validateRequired(formData.name)) {
    errors.name = 'Organization name is required';
  } else if (!validateMaxLength(formData.name, 100)) {
    errors.name = 'Organization name cannot exceed 100 characters';
  } else if (!validateMinLength(formData.name, 2)) {
    errors.name = 'Organization name must be at least 2 characters';
  }

  if (!validateRequired(formData.ownerName)) {
    errors.ownerName = 'Owner name is required';
  } else if (!validateMaxLength(formData.ownerName, 100)) {
    errors.ownerName = 'Owner name cannot exceed 100 characters';
  }

  if (!validateRequired(formData.spokPersonName)) {
    errors.spokPersonName = 'Spokesperson name is required';
  } else if (!validateMaxLength(formData.spokPersonName, 100)) {
    errors.spokPersonName = 'Spokesperson name cannot exceed 100 characters';
  }

  if (!validateRequired(formData.spokPersonPhone)) {
    errors.spokPersonPhone = 'Spokesperson phone number is required';
  } else if (!validatePhone(formData.spokPersonPhone)) {
    errors.spokPersonPhone = 'Please enter a valid phone number';
  }

  if (!validateRequired(formData.expectedConnections)) {
    errors.expectedConnections = 'Expected connections is required';
  } else if (isNaN(formData.expectedConnections) || parseInt(formData.expectedConnections) < 1) {
    errors.expectedConnections = 'Expected connections must be a positive number';
  }

  if (!validateRequired(formData.country)) {
    errors.country = 'Country is required';
  } else if (!['india', 'philippines', 'zimbabwe'].includes(formData.country.toLowerCase())) {
    errors.country = 'Please select India, Philippines, or Zimbabwe';
  }

  if (formData.country && !validateStateByCountry(formData.state, formData.country)) {
    errors.state = `Please enter a valid state/province for ${formData.country}`;
  }

  if (formData.pincode && !validatePincode(formData.pincode, formData.country)) {
    const format = formData.country?.toLowerCase() === 'india' ? '6 digits' :
                  formData.country?.toLowerCase() === 'philippines' ? '4 digits' :
                  'valid postal code format';
    errors.pincode = `Please enter a valid pincode (${format})`;
  }

  if (formData.website && !validateURL(formData.website)) {
    errors.website = 'Please enter a valid website URL';
  }

  if (formData.address && !validateMaxLength(formData.address, 300)) {
    errors.address = 'Address cannot exceed 300 characters';
  }

  if (formData.city && !validateMaxLength(formData.city, 50)) {
    errors.city = 'City name cannot exceed 50 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
