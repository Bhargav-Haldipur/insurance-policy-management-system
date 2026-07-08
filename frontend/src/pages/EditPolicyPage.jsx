import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
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
import { getApiErrorMessage, getPolicy, updatePolicy } from '../services/policy_Service'
import { toApiDate } from '../utils/dateFormat'

const POLICY_STATUSES = ['PENDING', 'ACTIVE', 'INACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED']
const POLICY_TYPES = ['HEALTH', 'AUTO', 'LIFE', 'HOME', 'PROPERTY']

const initialPolicy = {
  policyName: '',
  status: 'ACTIVE',
  policyType: '',
  holderName: '',
  holderEmail: '',
  holderPhone: '',
  premiumAmount: '',
  coverageAmount: '',
  deductible: '',
  coverageStartDate: '',
  coverageEndDate: '',
}

function EditPolicyPage() {
  const [policy, setPolicy] = useState(initialPolicy)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const data = await getPolicy(id)
        setPolicy({
          policyName: data.policyName ?? '',
          status: data.status ?? 'ACTIVE',
          policyType: data.policyType ?? '',
          holderName: data.holderName ?? '',
          holderEmail: data.holderEmail ?? '',
          holderPhone: data.holderPhone ?? '',
          premiumAmount: data.premiumAmount ?? '',
          coverageAmount: data.coverageAmount ?? '',
          deductible: data.deductible ?? '',
          coverageStartDate: data.coverageStartDate ?? '',
          coverageEndDate: data.coverageEndDate ?? '',
        })
      } catch {
        setError('Unable to load policy.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPolicy()
  }, [id])

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

    const payload = {
      ...policy,
      premiumAmount: policy.premiumAmount !== '' ? Number(policy.premiumAmount) : null,
      coverageAmount: policy.coverageAmount !== '' ? Number(policy.coverageAmount) : null,
      deductible: policy.deductible !== '' ? Number(policy.deductible) : null,
    }

    try {
      await updatePolicy(id, payload)
      navigate('/policies')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to update policy.'))
      setIsSubmitting(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Stack component="form" spacing={3} onSubmit={handleSubmit}>
          <Box>
            <Typography component="h1" variant="h4" fontWeight={600}>
              Edit Policy
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <>
              <TextField
                label="Policy Name"
                name="policyName"
                value={policy.policyName}
                onChange={handleChange}
                required
                fullWidth
              />

              <FormControl fullWidth required>
                <InputLabel id="edit-policy-type-label">Policy Type</InputLabel>
                <Select
                  labelId="edit-policy-type-label"
                  label="Policy Type"
                  name="policyType"
                  value={policy.policyType}
                  onChange={handleChange}
                >
                  {POLICY_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel id="edit-policy-status-label">Status</InputLabel>
                <Select
                  labelId="edit-policy-status-label"
                  label="Status"
                  name="status"
                  value={policy.status}
                  onChange={handleChange}
                >
                  {POLICY_STATUSES.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Holder Name"
                name="holderName"
                value={policy.holderName}
                onChange={handleChange}
                required
                fullWidth
              />

              <TextField
                label="Holder Email"
                name="holderEmail"
                type="email"
                value={policy.holderEmail}
                onChange={handleChange}
                required
                fullWidth
              />

              <TextField
                label="Holder Phone (optional)"
                name="holderPhone"
                value={policy.holderPhone}
                onChange={handleChange}
                fullWidth
              />

              <TextField
                label="Premium Amount"
                name="premiumAmount"
                type="number"
                value={policy.premiumAmount}
                onChange={handleChange}
                required
                fullWidth
                slotProps={{ htmlInput: { min: 0.01, step: '0.01' } }}
              />

              <TextField
                label="Coverage Amount"
                name="coverageAmount"
                type="number"
                value={policy.coverageAmount}
                onChange={handleChange}
                required
                fullWidth
                slotProps={{ htmlInput: { min: 0.01, step: '0.01' } }}
              />

              <TextField
                label="Deductible (optional)"
                name="deductible"
                type="number"
                value={policy.deductible}
                onChange={handleChange}
                fullWidth
                slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              />

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
                  Save
                </Button>
              </Stack>
            </>
          )}
        </Stack>
      </Paper>
    </Container>
  )
}

export default EditPolicyPage
