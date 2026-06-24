import axios from 'axios'

export const getPolicies = async () => {
  const response = await axios.get('/api/policies')
  return response.data
}

export const getPolicy = async (id) => {
  const response = await axios.get(`/api/policies/${id}`)
  return response.data
}

export const createPolicy = async (policy) => {
  const response = await axios.post('/api/policies', policy)
  return response.data
}

export const updatePolicy = async (id, policy) => {
  const response = await axios.put(
    `/api/policies/${id}`,
    policy
  )
  return response.data
}

export const deletePolicy = async (id) => {
  await axios.delete(`/api/policies/${id}`)
}

export const getPolicyEvents = async (policyId) => {
  const response = await axios.get(
    `/api/events/${policyId}`
  )
  return response.data
}

export const getApiErrorMessage = (error, fallbackMessage) => {
  const data = error.response?.data

  if (data?.message) {
    return data.message
  }

  if (data?.errors) {
    return Object.entries(data.errors)
      .map(([field, message]) => `${field}: ${message}`)
      .join(', ')
  }

  return fallbackMessage
}