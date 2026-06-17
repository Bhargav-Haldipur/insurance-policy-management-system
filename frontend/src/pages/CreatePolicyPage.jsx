import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { createPolicy, getApiErrorMessage } from '../services/policy_Service'
import { toApiDate } from '../utils/dateFormat'

const initialPolicy = {
  policyName: '',
  status: 'ACTIVE',
  coverageStartDate: '',
  coverageEndDate: '',
}

function CreatePolicyPage() {
  const [policy, setPolicy] = useState(initialPolicy)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setPolicy((currentPolicy) => ({
      ...currentPolicy,
      [name]: value,
    }))
  }

  const handleDateChange = (name, value) => {
    setPolicy((currentPolicy) => ({
      ...currentPolicy,
      [name]: toApiDate(value),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      await createPolicy(policy)
      navigate('/policies')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to create policy.'))
      setIsSubmitting(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Stack component="form" spacing={3} onSubmit={handleSubmit}>
          <Box>
            <Typography component="h1" variant="h4" fontWeight={600}>
              Create Policy
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Policy Name"
            name="policyName"
            value={policy.policyName}
            onChange={handleChange}
            required
            fullWidth
          />

          <FormControl fullWidth required>
            <InputLabel id="create-policy-status-label">Status</InputLabel>
            <Select
              labelId="create-policy-status-label"
              label="Status"
              name="status"
              value={policy.status}
              onChange={handleChange}
            >
              <MenuItem value="ACTIVE">ACTIVE</MenuItem>
              <MenuItem value="INACTIVE">INACTIVE</MenuItem>
            </Select>
          </FormControl>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Coverage Start Date"
              value={policy.coverageStartDate ? dayjs(policy.coverageStartDate) : null}
              onChange={(value) => handleDateChange('coverageStartDate', value)}
              format="DD MM YYYY"
              openTo="year"
              views={['year', 'month', 'day']}
              slotProps={{ textField: { required: true, fullWidth: true } }}
            />

            <DatePicker
              label="Coverage End Date"
              value={policy.coverageEndDate ? dayjs(policy.coverageEndDate) : null}
              onChange={(value) => handleDateChange('coverageEndDate', value)}
              format="DD MM YYYY"
              openTo="year"
              views={['year', 'month', 'day']}
              slotProps={{ textField: { required: true, fullWidth: true } }}
            />
          </LocalizationProvider>

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button type="button" onClick={() => navigate('/policies')}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              Create
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  )
}

export default CreatePolicyPage
